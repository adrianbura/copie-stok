import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Warehouse } from './useWarehouse';

export interface BackupData {
  version: string;
  createdAt: string;
  backupType: 'global' | 'warehouse';
  warehouseId?: string;
  warehouseName?: string;
  warehouseCode?: string;
  products: any[];
  stockMovements: any[];
  warehouseStock: any[];
  warehouses: any[];
  inventoryDocuments: any[];
  companySettings: any;
  alerts: any[];
}

function downloadBackup(data: BackupData, prefix: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
  a.href = url;
  a.download = `${prefix}_${dateStr}_${timeStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useBackup() {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isCreatingWarehouseBackup, setIsCreatingWarehouseBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const createGlobalBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const [
        productsRes,
        movementsRes,
        warehouseStockRes,
        warehousesRes,
        documentsRes,
        companyRes,
        alertsRes,
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('stock_movements').select('*'),
        supabase.from('warehouse_stock').select('*'),
        supabase.from('warehouses').select('*'),
        supabase.from('inventory_documents').select('*'),
        supabase.from('company_settings').select('*').maybeSingle(),
        supabase.from('alerts').select('*'),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (movementsRes.error) throw movementsRes.error;
      if (warehouseStockRes.error) throw warehouseStockRes.error;
      if (warehousesRes.error) throw warehousesRes.error;
      if (documentsRes.error) throw documentsRes.error;
      if (companyRes.error) throw companyRes.error;
      if (alertsRes.error) throw alertsRes.error;

      const backupData: BackupData = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        backupType: 'global',
        products: productsRes.data || [],
        stockMovements: movementsRes.data || [],
        warehouseStock: warehouseStockRes.data || [],
        warehouses: warehousesRes.data || [],
        inventoryDocuments: documentsRes.data || [],
        companySettings: companyRes.data,
        alerts: alertsRes.data || [],
      };

      downloadBackup(backupData, 'backup_global');
      
      toast.success('Backup global creat cu succes!', {
        description: `${backupData.products.length} produse, ${backupData.stockMovements.length} mișcări exportate`,
      });
    } catch (error: any) {
      console.error('Error creating backup:', error);
      toast.error('Eroare la crearea backup-ului', { description: error.message });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const createWarehouseBackup = async (warehouse: Warehouse) => {
    setIsCreatingWarehouseBackup(true);
    try {
      const { data: warehouseStockData, error: stockError } = await supabase
        .from('warehouse_stock')
        .select('*, product:products(*)')
        .eq('warehouse_id', warehouse.id);

      if (stockError) throw stockError;

      const productIds = warehouseStockData?.map(ws => ws.product_id) || [];

      const { data: movementsData, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('warehouse_id', warehouse.id);

      if (movementsError) throw movementsError;

      const { data: documentsData, error: documentsError } = await supabase
        .from('inventory_documents')
        .select('*')
        .eq('warehouse', warehouse.name);

      if (documentsError) throw documentsError;

      const products = warehouseStockData?.map(ws => ws.product).filter(Boolean) || [];

      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .in('product_id', productIds.length > 0 ? productIds : ['00000000-0000-0000-0000-000000000000']);

      if (alertsError) throw alertsError;

      const backupData: BackupData = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        backupType: 'warehouse',
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        warehouseCode: warehouse.code,
        products: products,
        stockMovements: movementsData || [],
        warehouseStock: warehouseStockData?.map(ws => ({
          id: ws.id,
          warehouse_id: ws.warehouse_id,
          product_id: ws.product_id,
          quantity: ws.quantity,
          min_stock: ws.min_stock,
          location: ws.location,
          created_at: ws.created_at,
          updated_at: ws.updated_at,
        })) || [],
        warehouses: [warehouse],
        inventoryDocuments: documentsData || [],
        companySettings: null,
        alerts: alertsData || [],
      };

      downloadBackup(backupData, `backup_${warehouse.code}`);

      toast.success(`Backup ${warehouse.code} creat cu succes!`, {
        description: `${products.length} produse, ${movementsData?.length || 0} mișcări exportate`,
      });
    } catch (error: any) {
      console.error('Error creating warehouse backup:', error);
      toast.error('Eroare la crearea backup-ului', { description: error.message });
    } finally {
      setIsCreatingWarehouseBackup(false);
    }
  };

  const validateBackupFile = async (file: File): Promise<BackupData | null> => {
    if (!file.name.endsWith('.json')) {
      toast.error('Fișier invalid', { description: 'Selectați un fișier JSON valid' });
      return null;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;

      if (!data.version || !data.createdAt || !Array.isArray(data.products)) {
        throw new Error('Structură fișier invalidă');
      }

      if (!data.stockMovements || !data.warehouses) {
        throw new Error('Fișierul nu conține toate datele necesare');
      }

      return data;
    } catch (error: any) {
      console.error('Error parsing backup file:', error);
      toast.error('Fișier backup invalid', { description: error.message || 'Nu s-a putut citi fișierul' });
      return null;
    }
  };

  const executeGlobalRestore = async (data: BackupData) => {
    // Delete existing data in correct order (respecting foreign keys)
    const deleteAlerts = await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteAlerts.error) throw deleteAlerts.error;

    const deleteMovements = await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteMovements.error) throw deleteMovements.error;

    const deleteWarehouseStock = await supabase.from('warehouse_stock').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteWarehouseStock.error) throw deleteWarehouseStock.error;

    const deleteDocuments = await supabase.from('inventory_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteDocuments.error) throw deleteDocuments.error;

    const deleteProducts = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteProducts.error) throw deleteProducts.error;

    const deleteWarehouses = await supabase.from('warehouses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteWarehouses.error) throw deleteWarehouses.error;

    // Insert new data in correct order
    if (data.warehouses.length > 0) {
      const { error } = await supabase.from('warehouses').insert(data.warehouses);
      if (error) throw error;
    }

    if (data.products.length > 0) {
      const { error } = await supabase.from('products').insert(data.products);
      if (error) throw error;
    }

    if (data.warehouseStock.length > 0) {
      const { error } = await supabase.from('warehouse_stock').insert(data.warehouseStock);
      if (error) throw error;
    }

    if (data.stockMovements.length > 0) {
      const { error } = await supabase.from('stock_movements').insert(data.stockMovements);
      if (error) throw error;
    }

    if (data.inventoryDocuments.length > 0) {
      const { error } = await supabase.from('inventory_documents').insert(data.inventoryDocuments);
      if (error) throw error;
    }

    if (data.alerts.length > 0) {
      const alertsToInsert = data.alerts.map(a => ({
        ...a,
        acknowledged: false,
        acknowledged_at: null,
        acknowledged_by: null,
      }));
      const { error } = await supabase.from('alerts').insert(alertsToInsert);
      if (error) throw error;
    }

    if (data.companySettings) {
      const { error } = await supabase
        .from('company_settings')
        .update(data.companySettings)
        .eq('id', data.companySettings.id);
      if (error) {
        await supabase.from('company_settings').insert(data.companySettings);
      }
    }
  };

  const executeWarehouseRestore = async (data: BackupData) => {
    const warehouseId = data.warehouseId!;

    const deleteMovements = await supabase.from('stock_movements').delete().eq('warehouse_id', warehouseId);
    if (deleteMovements.error) throw deleteMovements.error;

    const deleteWarehouseStock = await supabase.from('warehouse_stock').delete().eq('warehouse_id', warehouseId);
    if (deleteWarehouseStock.error) throw deleteWarehouseStock.error;

    const deleteDocuments = await supabase.from('inventory_documents').delete().eq('warehouse', data.warehouseName);
    if (deleteDocuments.error) throw deleteDocuments.error;

    const productIds = data.products.map(p => p.id);
    if (productIds.length > 0) {
      const deleteAlerts = await supabase.from('alerts').delete().in('product_id', productIds);
      if (deleteAlerts.error) throw deleteAlerts.error;
    }

    if (data.products.length > 0) {
      for (const product of data.products) {
        const { error } = await supabase.from('products').upsert(product, { onConflict: 'id' });
        if (error) throw error;
      }
    }

    if (data.warehouseStock.length > 0) {
      const { error } = await supabase.from('warehouse_stock').insert(data.warehouseStock);
      if (error) throw error;
    }

    if (data.stockMovements.length > 0) {
      const { error } = await supabase.from('stock_movements').insert(data.stockMovements);
      if (error) throw error;
    }

    if (data.inventoryDocuments.length > 0) {
      const { error } = await supabase.from('inventory_documents').insert(data.inventoryDocuments);
      if (error) throw error;
    }

    if (data.alerts.length > 0) {
      const alertsToInsert = data.alerts.map(a => ({
        ...a,
        acknowledged: false,
        acknowledged_at: null,
        acknowledged_by: null,
      }));
      const { error } = await supabase.from('alerts').insert(alertsToInsert);
      if (error) throw error;
    }
  };

  const executeRestore = async (data: BackupData) => {
    setIsRestoring(true);
    try {
      if (data.backupType === 'warehouse' && data.warehouseId) {
        await executeWarehouseRestore(data);
      } else {
        await executeGlobalRestore(data);
      }

      toast.success('Restaurare completă!', {
        description: data.backupType === 'warehouse' 
          ? `Depozit ${data.warehouseCode} restaurat cu succes`
          : `${data.products.length} produse, ${data.stockMovements.length} mișcări restaurate`,
      });
      return true;
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      toast.error('Eroare la restaurare', { description: error.message });
      return false;
    } finally {
      setIsRestoring(false);
    }
  };

  return {
    isCreatingBackup,
    isCreatingWarehouseBackup,
    isRestoring,
    createGlobalBackup,
    createWarehouseBackup,
    validateBackupFile,
    executeRestore,
  };
}
