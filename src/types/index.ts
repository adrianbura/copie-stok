export type PyroCategory = '1' | '2' | '3' | '4' | 'T1' | 'T2';

export interface Product {
  id: string;
  name: string;
  code: string;
  category: PyroCategory;
  quantity: number;
  unit: string;
  supplier: string;
  batchNumber: string;
  expirationDate: string;
  certificateNumber: string;
  certificateExpiry: string;
  minStock: number;
  location: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  type: 'entry' | 'exit';
  quantity: number;
  date: string;
  reason: string;
  operator: string;
  notes: string;
  documentNumber: string;
}

export interface Alert {
  id: string;
  type: 'low_stock' | 'expiring_product' | 'certificate_expiry';
  severity: 'warning' | 'critical';
  message: string;
  productId: string;
  productName: string;
  date: string;
  acknowledged: boolean;
}

export interface CategoryInfo {
  id: PyroCategory;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: '1',
    name: 'Categoria 1',
    description: 'Artificii pentru uz public general',
    color: 'text-category-1',
    bgColor: 'bg-category-1/10',
    icon: '🎆',
  },
  {
    id: '2',
    name: 'Categoria 2',
    description: 'Artificii pentru uz în spații deschise',
    color: 'text-category-2',
    bgColor: 'bg-category-2/10',
    icon: '🎇',
  },
  {
    id: '3',
    name: 'Categoria 3',
    description: 'Artificii pentru uz profesional',
    color: 'text-category-3',
    bgColor: 'bg-category-3/10',
    icon: '💥',
  },
  {
    id: '4',
    name: 'Categoria 4',
    description: 'Artificii pentru uz exclusiv profesional',
    color: 'text-category-4',
    bgColor: 'bg-category-4/10',
    icon: '🔥',
  },
  {
    id: 'T1',
    name: 'Categoria T1',
    description: 'Articole teatrale pentru uz interior',
    color: 'text-category-t1',
    bgColor: 'bg-category-t1/10',
    icon: '🎭',
  },
  {
    id: 'T2',
    name: 'Categoria T2',
    description: 'Articole teatrale pentru uz exterior',
    color: 'text-category-t2',
    bgColor: 'bg-category-t2/10',
    icon: '🎪',
  },
];
