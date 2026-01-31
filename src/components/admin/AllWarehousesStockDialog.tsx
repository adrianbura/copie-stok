import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Warehouse, FileText, FileSpreadsheet, Search, Loader2, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ProductWithWarehouse {
  id: string;
  code: string;
  name: string;
  quantity: number;
  warehouseName: string;
  warehouseCode: string;
}

export function AllWarehousesStockDialog() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all products with their warehouse info
  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ['all-warehouses-stock'],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          code,
          name,
          quantity,
          warehouse_id,
          warehouses:warehouse_id (
            id,
            name,
            code
          )
        `)
        .order('name');

      if (error) throw error;

      return (products || []).map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        quantity: p.quantity,
        warehouseName: p.warehouses?.name || 'Necunoscut',
        warehouseCode: p.warehouses?.code || '-',
      })) as ProductWithWarehouse[];
    },
    enabled: open,
  });

  // Filter products based on search
  const filteredProducts = allProducts.filter(p =>
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.warehouseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const now = format(new Date(), 'dd.MM.yyyy HH:mm', { locale: ro });

    // Header
    doc.setFontSize(18);
    doc.text('Stoc Total - Toate Depozitele', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generat la: ${now}`, 14, 28);
    doc.text(`Total produse: ${filteredProducts.length} | Cantitate totala: ${filteredProducts.reduce((sum, p) => sum + p.quantity, 0)} buc`, 14, 35);

    // Table
    autoTable(doc, {
      startY: 42,
      head: [['Cod', 'Denumire Produs', 'Cantitate', 'Depozit']],
      body: filteredProducts.map(p => [
        p.code,
        p.name,
        p.quantity.toString(),
        `${p.warehouseName} (${p.warehouseCode})`
      ]),
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Pagina ${i} din ${pageCount} | PyroStok - Stoc Total Depozite`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`stoc-toate-depozitele-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const wsData = [
      ['Stoc Total - Toate Depozitele'],
      [`Generat la: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: ro })}`],
      [],
      ['Cod', 'Denumire Produs', 'Cantitate', 'Depozit'],
      ...filteredProducts.map(p => [
        p.code,
        p.name,
        p.quantity,
        `${p.warehouseName} (${p.warehouseCode})`
      ]),
      [],
      [`Total produse: ${filteredProducts.length}`, '', `Cantitate totala: ${filteredProducts.reduce((sum, p) => sum + p.quantity, 0)} buc`, '']
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-adjust column widths
    const colWidths = [
      { wch: Math.max(...filteredProducts.map(p => p.code.length), 10) },
      { wch: Math.max(...filteredProducts.map(p => p.name.length), 20) },
      { wch: 12 },
      { wch: Math.max(...filteredProducts.map(p => p.warehouseName.length + p.warehouseCode.length + 3), 20) },
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stoc Depozite');
    XLSX.writeFile(wb, `stoc-toate-depozitele-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Package className="h-4 w-4" />
          Vezi stocul tuturor depozitelor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Stoc Total - Toate Depozitele
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cauta dupa cod, denumire sau depozit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={filteredProducts.length === 0}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={filteredProducts.length === 0}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              <strong className="text-foreground">{filteredProducts.length}</strong> produse
            </span>
            <span>
              <strong className="text-foreground">{filteredProducts.reduce((sum, p) => sum + p.quantity, 0)}</strong> bucati total
            </span>
          </div>

          {/* Table */}
          <ScrollArea className="flex-1 border rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p>Nu s-au gasit produse.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background">Cod</TableHead>
                    <TableHead className="sticky top-0 bg-background">Denumire Produs</TableHead>
                    <TableHead className="sticky top-0 bg-background text-right">Cantitate</TableHead>
                    <TableHead className="sticky top-0 bg-background">Depozit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {product.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {product.quantity}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {product.warehouseName}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
