export type PyroCategory = 'F1' | 'F2' | 'F3' | 'F4' | 'T1' | 'T2';

export type UserRole = 'admin' | 'operator' | 'viewer';

export type MovementType = 'entry' | 'exit';

export type AlertType = 'expiry' | 'low_stock' | 'compliance';

export interface Product {
  id: string;
  code: string;
  name: string;
  category: PyroCategory;
  quantity: number;
  min_stock: number;
  unit_price: number;
  location: string | null;
  supplier: string | null;
  batch_number: string | null;
  expiry_date: string | null;
  net_weight: number | null;
  hazard_class: string | null;
  certification: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: MovementType;
  quantity: number;
  reference: string | null;
  notes: string | null;
  date: string;
  created_at: string;
  created_by: string | null;
  // Joined fields
  product?: Product;
}

export interface Alert {
  id: string;
  product_id: string | null;
  type: AlertType;
  title: string;
  message: string;
  severity: string;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
  // Joined fields
  product?: Product;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
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
    id: 'F1',
    name: 'Categoria F1',
    description: 'Artificii pentru uz public general',
    color: 'text-category-1',
    bgColor: 'bg-category-1/10',
    icon: '🎆',
  },
  {
    id: 'F2',
    name: 'Categoria F2',
    description: 'Artificii pentru uz în spații deschise',
    color: 'text-category-2',
    bgColor: 'bg-category-2/10',
    icon: '🎇',
  },
  {
    id: 'F3',
    name: 'Categoria F3',
    description: 'Artificii pentru uz profesional',
    color: 'text-category-3',
    bgColor: 'bg-category-3/10',
    icon: '💥',
  },
  {
    id: 'F4',
    name: 'Categoria F4',
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