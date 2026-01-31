import { useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProducts } from '@/hooks/useProducts';
import { useStockMovements, StockMovementWithDetails } from '@/hooks/useStockMovements';
import { useWarehouseContext } from '@/hooks/useWarehouse';
import { CATEGORIES, Product } from '@/types';
import { FileText, Printer, Download, CalendarIcon, X } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ProductSearchSelect } from '@/components/stock/ProductSearchSelect';

interface MovementWithStock extends StockMovementWithDetails {
  stockBefore: number;
  stockAfter: number;
}

interface ProductRegisterData {
  product: Product;
  movements: MovementWithStock[];
  totalEntries: number;
  totalExits: number;
  finalStock: number;
}

export function ProductMovementRegister() {
  const [open, setOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [showRegister, setShowRegister] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { selectedWarehouse } = useWarehouseContext();
  const { data: products } = useProducts(selectedWarehouse?.id);
  const { data: allMovements } = useStockMovements(selectedWarehouse?.id);

  const registerData = useMemo(() => {
    if (!products || !allMovements) return [];

    const filteredProducts = selectedProductId === 'all' 
      ? products 
      : products.filter(p => p.id === selectedProductId);

    return filteredProducts.map(product => {
      // Get all movements for this product, sorted chronologically (oldest first)
      let productMovements = allMovements
        .filter(m => m.product_id === product.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Filter by date range if specified
      if (startDate || endDate) {
        productMovements = productMovements.filter(m => {
          const movementDate = new Date(m.date);
          if (startDate && endDate) {
            return isWithinInterval(movementDate, {
              start: startOfDay(startDate),
              end: endOfDay(endDate)
            });
          }
          if (startDate) {
            return movementDate >= startOfDay(startDate);
          }
          if (endDate) {
            return movementDate <= endOfDay(endDate);
          }
          return true;
        });
      }

      // Calculate stock before/after for each movement
      // We need to calculate from the beginning to get accurate running totals
      const allProductMovementsSorted = allMovements
        .filter(m => m.product_id === product.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let runningStock = 0;
      const movementsWithStock: MovementWithStock[] = [];

      // First, calculate initial stock before the filter period
      if (startDate) {
        for (const m of allProductMovementsSorted) {
          if (new Date(m.date) < startOfDay(startDate)) {
            runningStock += m.type === 'entry' ? m.quantity : -m.quantity;
          }
        }
      }

      // Now process filtered movements
      for (const m of productMovements) {
        const stockBefore = runningStock;
        const quantityChange = m.type === 'entry' ? m.quantity : -m.quantity;
        runningStock += quantityChange;
        
        movementsWithStock.push({
          ...m,
          stockBefore,
          stockAfter: runningStock
        });
      }

      const totalEntries = movementsWithStock
        .filter(m => m.type === 'entry')
        .reduce((sum, m) => sum + m.quantity, 0);

      const totalExits = movementsWithStock
        .filter(m => m.type === 'exit')
        .reduce((sum, m) => sum + m.quantity, 0);

      return {
        product,
        movements: movementsWithStock,
        totalEntries,
        totalExits,
        finalStock: runningStock
      } as ProductRegisterData;
    }).filter(data => data.movements.length > 0);
  }, [products, allMovements, selectedProductId, startDate, endDate]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Registru Mișcare Produse Pirotehnice</title>
          <style>
            @page { size: A4; margin: 15mm; }
            * { box-sizing: border-box; }
            body { 
              font-family: 'Times New Roman', Times, serif; 
              font-size: 11pt; 
              line-height: 1.4;
              color: #000;
              margin: 0;
              padding: 0;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
            }
            .header h1 { 
              font-size: 18pt; 
              margin: 0 0 5px 0; 
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .header p { margin: 3px 0; font-size: 10pt; }
            .product-section { 
              page-break-inside: avoid; 
              margin-bottom: 25px;
              border: 1px solid #000;
              padding: 10px;
            }
            .product-header { 
              background: #f0f0f0; 
              padding: 8px 10px; 
              margin: -10px -10px 10px -10px;
              border-bottom: 1px solid #000;
            }
            .product-header h2 { 
              font-size: 13pt; 
              margin: 0; 
            }
            .product-info { 
              display: flex; 
              gap: 30px; 
              font-size: 12pt;
              margin-top: 5px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              font-size: 14pt;
              margin-bottom: 10px;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 5px 8px; 
              text-align: left; 
            }
            th { 
              background: #e8e8e8; 
              font-weight: bold;
              text-align: center;
            }
            td { vertical-align: top; }
            .number { text-align: right; }
            .center { text-align: center; }
            .entry { color: #166534; font-weight: bold; }
            .exit { color: #dc2626; font-weight: bold; }
            .summary { 
              display: flex; 
              justify-content: space-between;
              background: #f5f5f5;
              padding: 10px;
              border: 1px solid #000;
              margin-top: 10px;
            }
            .summary-item { text-align: center; }
            .summary-item strong { display: block; font-size: 14pt; }
            .summary-item span { font-size: 9pt; text-transform: uppercase; }
            .footer { 
              margin-top: 30px; 
              text-align: center;
              font-size: 9pt;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 10px;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
              padding: 0 20px;
            }
            .signature-box {
              text-align: center;
              width: 200px;
            }
            .signature-line {
              border-top: 1px solid #000;
              margin-top: 40px;
              padding-top: 5px;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDF = () => {
    // For PDF export, we use the same print functionality
    // In a real app, you might use a library like jsPDF or html2pdf
    handlePrint();
  };

  const getCategoryName = (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: ro });
  };

  const formatShortDate = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, 'dd.MM.yyyy', { locale: ro });
  };

  const clearFilters = () => {
    setSelectedProductId('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FileText className="h-4 w-4" />
          Generează Registru Mișcare Produse
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Registru de Mișcare Produse Pirotehnice
          </DialogTitle>
        </DialogHeader>

        {!showRegister ? (
          <div className="space-y-6 p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Selectează Produs</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <ProductSearchSelect
                      products={products}
                      value={selectedProductId === 'all' ? '' : selectedProductId}
                      onSelect={(id) => setSelectedProductId(id || 'all')}
                      placeholder="Caută produs sau lasă gol pentru toate"
                      showStock={false}
                    />
                  </div>
                  {selectedProductId !== 'all' && (
                    <Button variant="ghost" size="icon" onClick={() => setSelectedProductId('all')} title="Arată toate produsele">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedProductId === 'all' ? 'Se vor afișa toate produsele' : 'Un produs selectat'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data început</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? formatShortDate(startDate) : "Selectează data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data sfârșit</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? formatShortDate(endDate) : "Selectează data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {(selectedProductId !== 'all' || startDate || endDate) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" />
                Șterge filtrele
              </Button>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setShowRegister(true)} className="flex-1">
                Previzualizează Registru
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex gap-2 p-4 border-b bg-muted/30">
              <Button variant="outline" onClick={() => setShowRegister(false)}>
                ← Înapoi la filtre
              </Button>
              <div className="flex-1" />
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button onClick={handleExportPDF} className="gap-2">
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div ref={printRef} className="bg-white text-black min-h-full">
                <div className="header">
                  <h1>Registru de Mișcare Produse Pirotehnice</h1>
                  <p>Generat la: {format(new Date(), 'dd.MM.yyyy HH:mm', { locale: ro })}</p>
                  {(startDate || endDate) && (
                    <p>
                      Perioada: {startDate ? formatShortDate(startDate) : 'începutul'} - {endDate ? formatShortDate(endDate) : 'prezent'}
                    </p>
                  )}
                </div>

                {registerData.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    Nu există mișcări de stoc pentru criteriile selectate.
                  </div>
                ) : (
                  registerData.map((data, index) => (
                    <div key={data.product.id} className="product-section">
                      <div className="product-header">
                        <h2>{index + 1}. {data.product.name}</h2>
                        <div className="product-info">
                          <span><strong>Cod:</strong> {data.product.code}</span>
                          <span><strong>Categorie:</strong> {getCategoryName(data.product.category)}</span>
                          {data.product.batch_number && (
                            <span><strong>Lot:</strong> {data.product.batch_number}</span>
                          )}
                          {data.product.location && (
                            <span><strong>Locație:</strong> {data.product.location}</span>
                          )}
                        </div>
                      </div>

                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: '14%' }}>Data operațiunii</th>
                            <th style={{ width: '10%' }}>Tip</th>
                            <th style={{ width: '8%' }}>Cantitate</th>
                            <th style={{ width: '10%' }}>Stoc înainte</th>
                            <th style={{ width: '10%' }}>Stoc după</th>
                            <th style={{ width: '15%' }}>Operator</th>
                            <th>Document / Observații</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.movements.map((movement, mIndex) => (
                            <tr key={movement.id}>
                              <td className="center">{formatDate(movement.date)}</td>
                              <td className={`center ${movement.type === 'entry' ? 'entry' : 'exit'}`}>
                                {movement.type === 'entry' ? 'INTRARE' : 'IEȘIRE'}
                              </td>
                              <td className={`number ${movement.type === 'entry' ? 'entry' : 'exit'}`}>
                                {movement.type === 'entry' ? '+' : '-'}{movement.quantity}
                              </td>
                              <td className="number">{movement.stockBefore}</td>
                              <td className="number" style={{ fontWeight: 'bold' }}>{movement.stockAfter}</td>
                              <td className="center">{movement.operator_name || '-'}</td>
                              <td>
                                {movement.reference && <span><strong>Ref:</strong> {movement.reference}</span>}
                                {movement.reference && movement.notes && ' | '}
                                {movement.notes && <span>{movement.notes}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="summary">
                        <div className="summary-item">
                          <strong className="entry">+{data.totalEntries}</strong>
                          <span>Total Intrări</span>
                        </div>
                        <div className="summary-item">
                          <strong className="exit">-{data.totalExits}</strong>
                          <span>Total Ieșiri</span>
                        </div>
                        <div className="summary-item">
                          <strong>{data.finalStock}</strong>
                          <span>Stoc Final</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                <div className="signature-section">
                  <div className="signature-box">
                    <div className="signature-line">Întocmit</div>
                  </div>
                  <div className="signature-box">
                    <div className="signature-line">Verificat</div>
                  </div>
                  <div className="signature-box">
                    <div className="signature-line">Aprobat</div>
                  </div>
                </div>

                <div className="footer">
                  Document generat automat din sistemul PyroStok • {format(new Date(), 'dd.MM.yyyy HH:mm:ss')}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
