import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StockEntryForm, EntryItem } from '@/components/stock/StockEntryForm';
import { MovementsHistory } from '@/components/stock/MovementsHistory';
import { ImportInvoiceDialog, InvoiceMetadata } from '@/components/stock/ImportInvoiceDialog';
import { useWarehouseContext } from '@/hooks/useWarehouse';
import { ArrowDownToLine } from 'lucide-react';

interface LocationState {
  openDialog?: 'importFile' | 'importInvoice';
}

export default function Entries() {
  const { selectedWarehouse } = useWarehouseContext();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as LocationState | null;

  const [entryItems, setEntryItems] = useState<EntryItem[]>([]);
  const [invoiceMetadata, setInvoiceMetadata] = useState<InvoiceMetadata | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Handle navigation state to open dialogs
  useEffect(() => {
    if (locationState?.openDialog) {
      // Both 'importFile' and 'importInvoice' now open the same unified dialog
      if (locationState.openDialog === 'importFile' || locationState.openDialog === 'importInvoice') {
        setImportDialogOpen(true);
      }
      // Clear the state to prevent reopening on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [locationState, navigate, location.pathname]);

  const handleImportToList = (items: EntryItem[], metadata?: InvoiceMetadata) => {
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
          <ImportInvoiceDialog 
            onImportToList={handleImportToList}
            externalOpen={importDialogOpen}
            onExternalOpenChange={setImportDialogOpen}
          />
        </div>

        {/* Entry Form */}
        <StockEntryForm 
          externalItems={entryItems} 
          onItemsChange={setEntryItems}
          invoiceMetadata={invoiceMetadata}
          onMetadataUsed={clearInvoiceMetadata}
        />

        {/* History */}
        <MovementsHistory type="entry" warehouseId={selectedWarehouse?.id} />
      </div>
    </MainLayout>
  );
}
