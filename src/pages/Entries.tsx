import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StockEntryForm, EntryItem } from '@/components/stock/StockEntryForm';
import { MovementsHistory } from '@/components/stock/MovementsHistory';
import { ImportMovementsDialog, ImportedItem } from '@/components/stock/ImportMovementsDialog';
import { ImportInvoiceDialog, InvoiceMetadata } from '@/components/stock/ImportInvoiceDialog';
import { ArrowDownToLine } from 'lucide-react';

interface LocationState {
  openDialog?: 'importFile' | 'importInvoice';
}

export default function Entries() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as LocationState | null;

  const [entryItems, setEntryItems] = useState<EntryItem[]>([]);
  const [invoiceMetadata, setInvoiceMetadata] = useState<InvoiceMetadata | null>(null);
  const [importFileOpen, setImportFileOpen] = useState(false);
  const [importInvoiceOpen, setImportInvoiceOpen] = useState(false);

  // Handle navigation state to open dialogs
  useEffect(() => {
    if (locationState?.openDialog) {
      if (locationState.openDialog === 'importFile') {
        setImportFileOpen(true);
      } else if (locationState.openDialog === 'importInvoice') {
        setImportInvoiceOpen(true);
      }
      // Clear the state to prevent reopening on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [locationState, navigate, location.pathname]);

  const handleImportToList = (items: ImportedItem[]) => {
    const newItems: EntryItem[] = items.map(item => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      isNew: item.isNew,
      newProductName: item.newProductName,
      newProductCode: item.newProductCode,
      category: item.category,
      unitPrice: item.unitPrice,
      supplier: item.supplier,
    }));
    
    setEntryItems(prev => [...prev, ...newItems]);
  };

  const handleInvoiceImport = (items: EntryItem[], metadata?: InvoiceMetadata) => {
    setEntryItems(prev => [...prev, ...items]);
    if (metadata) {
      setInvoiceMetadata(metadata);
    }
  };

  const clearInvoiceMetadata = () => {
    setInvoiceMetadata(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <ArrowDownToLine className="h-8 w-8 text-success" />
              Intrări Stoc
            </h1>
            <p className="text-muted-foreground mt-1">
              Înregistrează aprovizionări și adaugă produse în stoc
            </p>
          </div>
          <div className="flex gap-2">
            <ImportInvoiceDialog 
              onImportToList={handleInvoiceImport}
              externalOpen={importInvoiceOpen}
              onExternalOpenChange={setImportInvoiceOpen}
            />
            <ImportMovementsDialog 
              type="entry" 
              onImportToList={handleImportToList}
              externalOpen={importFileOpen}
              onExternalOpenChange={setImportFileOpen}
            />
          </div>
        </div>

        {/* Entry Form */}
        <StockEntryForm 
          externalItems={entryItems} 
          onItemsChange={setEntryItems}
          invoiceMetadata={invoiceMetadata}
          onMetadataUsed={clearInvoiceMetadata}
        />

        {/* History */}
        <MovementsHistory type="entry" />
      </div>
    </MainLayout>
  );
}
