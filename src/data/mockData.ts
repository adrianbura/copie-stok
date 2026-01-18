import { Product, StockMovement, Alert, PyroCategory } from '@/types';

// Mock data is deprecated - the app now uses Supabase database
// These are kept for backward compatibility during migration

export const mockProducts: Product[] = [];
export const mockMovements: StockMovement[] = [];
export const mockAlerts: Alert[] = [];

export const getStockByCategory = (): Record<PyroCategory, number> => {
  const stock: Record<PyroCategory, number> = {
    'F1': 0,
    'F2': 0,
    'F3': 0,
    'F4': 0,
    'T1': 0,
    'T2': 0,
  };
  return stock;
};

export const getTotalStockValue = (): number => {
  return 0;
};

export const getLowStockProducts = (): Product[] => {
  return [];
};

export const getExpiringProducts = (days: number = 180): Product[] => {
  return [];
};