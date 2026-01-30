import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Download, FileSpreadsheet, Search, Package } from 'lucide-react';
import { format, endOfDay, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useWarehouseContext } from '@/hooks/useWarehouse';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { CATEGORIES } from '@/types';
import { CategoryBadge } from '@/components/ui/category-badge';

interface HistoricalStockItem {
  product_id: string;
  product_code: string;
  product_name: string;
  category: string;
  quantity: number;
  warehouse_name: string;
}

export function HistoricalStockReport() {
  const { selectedWarehouse } = useWarehouseContext();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Fetch historical stock data
  const { data: historicalStock, isLoading, refetch } = useQuery({
    queryKey: ['historical-stock', selectedDate?.toISOString(), selectedWarehouse?.id],
    queryFn: async () => {
      if (!selectedDate) return [];

      const endOfSelectedDay = endOfDay(selectedDate).toISOString();

      // Get all products (filtered by warehouse if selected)
      let productsQuery = supabase
        .from('products')
        .select('id, code, name, category, warehouse_id');
      
      if (selectedWarehouse?.id) {
        productsQuery = productsQuery.eq('warehouse_id', selectedWarehouse.id);
      }

      const { data: products, error: productsError } = await productsQuery;
      
      if (productsError) throw productsError;
      if (!products || products.length === 0) return [];

      // Get all stock movements up to the selected date
      let movementsQuery = supabase
        .from('stock_movements')
        .select('product_id, type, quantity, date')
        .lte('date', endOfSelectedDay);

      if (selectedWarehouse?.id) {
        movementsQuery = movementsQuery.eq('warehouse_id', selectedWarehouse.id);
      }

      const { data: movements, error: movementsError } = await movementsQuery;
      
      if (movementsError) throw movementsError;

      // Get warehouse names
      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id, name');

      const warehouseMap = new Map(warehouses?.map(w => [w.id, w.name]) || []);

      // Calculate stock for each product at the selected date
      const stockMap = new Map<string, number>();
      
      movements?.forEach(movement => {
        const currentStock = stockMap.get(movement.product_id) || 0;
        if (movement.type === 'entry') {
          stockMap.set(movement.product_id, currentStock + movement.quantity);
        } else if (movement.type === 'exit') {
          stockMap.set(movement.product_id, currentStock - movement.quantity);
        }
      });

      // Build the result array
      const result: HistoricalStockItem[] = products
        .map(product => ({
          product_id: product.id,
          product_code: product.code,
          product_name: product.name,
          category: product.category,
          quantity: stockMap.get(product.id) || 0,
          warehouse_name: warehouseMap.get(product.warehouse_id || '') || 'N/A',
        }))
        .filter(item => item.quantity !== 0) // Only show products that had stock
        .sort((a, b) => a.product_code.localeCompare(b.product_code));

      return result;
    },
    enabled: !!selectedDate,
  });

  // Filter by search term
  const filteredStock = useMemo(() => {
    if (!historicalStock) return [];
    if (!searchTerm) return historicalStock;

    const term = searchTerm.toLowerCase();
    return historicalStock.filter(
      item =>
        item.product_code.toLowerCase().includes(term) ||
        item.product_name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
    );
  }, [historicalStock, searchTerm]);

  // Calculate totals
  const totalQuantity = filteredStock.reduce((sum, item) => sum + item.quantity, 0);
  const totalProducts = filteredStock.length;

  // Export to Excel
  const handleExportExcel = () => {
    if (!filteredStock.length || !selectedDate) {
      toast.error('Nu există date de exportat');
      return;
    }

    const exportData = filteredStock.map(item => ({
      'Cod Produs': item.product_code,
      'Denumire': item.product_name,
      'Categorie': item.category,
      'Cantitate': item.quantity,
      'Depozit': item.warehouse_name,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Auto-fit column widths based on content
    const colWidths = [
      { wch: Math.max(12, ...filteredStock.map(item => item.product_code.length)) },
      { wch: Math.max(10, ...filteredStock.map(item => item.product_name.length)) },
      { wch: Math.max(10, ...filteredStock.map(item => item.category.length)) },
      { wch: 12 },
      { wch: Math.max(8, ...filteredStock.map(item => item.warehouse_name.length)) },
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stoc Istoric');

    const fileName = `stoc-istoric-${format(selectedDate, 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(`Export realizat: ${fileName}`);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (!filteredStock.length || !selectedDate) {
      toast.error('Nu există date de exportat');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(16);
      doc.text('Raport Stoc Istoric', pageWidth / 2, 20, { align: 'center' });

      // Subtitle with date and warehouse
      doc.setFontSize(10);
      const subtitle = selectedWarehouse
        ? `${selectedWarehouse.name} - Stoc la ${format(selectedDate, 'dd.MM.yyyy')}`
        : `Toate depozitele - Stoc la ${format(selectedDate, 'dd.MM.yyyy')}`;
      doc.text(subtitle, pageWidth / 2, 28, { align: 'center' });

      // Summary
      doc.setFontSize(10);
      doc.text(`Total produse: ${totalProducts} | Cantitate totală: ${totalQuantity} buc`, 14, 38);

      // Table
      autoTable(doc, {
        startY: 45,
        head: [['Cod', 'Denumire', 'Categorie', 'Cantitate', 'Depozit']],
        body: filteredStock.map(item => [
          item.product_code,
          item.product_name,
          item.category,
          item.quantity.toString(),
          item.warehouse_name,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 60 },
          2: { cellWidth: 20 },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 45 },
        },
      });

      // Footer
      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(`Generat la: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, finalY + 10);

      const fileName = `stoc-istoric-${format(selectedDate, 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      toast.success(`Export realizat: ${fileName}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Eroare la generarea PDF-ului');
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Selectează Data pentru Istoric Stoc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[280px] justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, 'PPP', { locale: ro })
                  ) : (
                    <span>Alege o dată</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setIsCalendarOpen(false);
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>

            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Caută după cod sau denumire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={handleExportExcel} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </Button>
              <Button variant="outline" onClick={handleExportPDF} className="gap-2">
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          {selectedDate && (
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                Afișare stoc la: <strong className="text-foreground">{format(selectedDate, 'dd MMMM yyyy', { locale: ro })}</strong>
              </span>
              {selectedWarehouse && (
                <span>
                  | Depozit: <strong className="text-foreground">{selectedWarehouse.name}</strong>
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produse cu Stoc</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cantitate Totală</p>
                <p className="text-2xl font-bold">{totalQuantity.toLocaleString()} buc</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Stoc la Data de {selectedDate ? format(selectedDate, 'dd.MM.yyyy') : '...'}
            {selectedWarehouse && ` - ${selectedWarehouse.name}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredStock.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? 'Nu s-au găsit produse pentru căutarea efectuată'
                : 'Nu există date de stoc pentru data selectată'}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Cod</TableHead>
                    <TableHead className="font-semibold">Denumire Produs</TableHead>
                    <TableHead className="font-semibold">Categorie</TableHead>
                    <TableHead className="text-right font-semibold">Cantitate</TableHead>
                    <TableHead className="font-semibold">Depozit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.map((item) => (
                    <TableRow key={item.product_id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-medium">{item.product_code}</TableCell>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>
                        <CategoryBadge category={item.category as any} />
                      </TableCell>
                      <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                      <TableCell className="text-muted-foreground">{item.warehouse_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
