import { Product, StockMovement, Alert, PyroCategory } from '@/types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Rachete Festival Gold',
    code: 'RFG-001',
    category: '1',
    quantity: 250,
    unit: 'buc',
    supplier: 'PyroTech SRL',
    batchNumber: 'PT2024-001',
    expirationDate: '2026-12-31',
    certificateNumber: 'CE-2024-1234',
    certificateExpiry: '2025-06-30',
    minStock: 50,
    location: 'A1-R01',
    price: 15.50,
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01',
  },
  {
    id: '2',
    name: 'Baterie Artificii Premium',
    code: 'BAP-002',
    category: '2',
    quantity: 35,
    unit: 'buc',
    supplier: 'FireWorks International',
    batchNumber: 'FWI2024-045',
    expirationDate: '2025-08-15',
    certificateNumber: 'CE-2024-5678',
    certificateExpiry: '2025-03-15',
    minStock: 40,
    location: 'B2-R03',
    price: 89.00,
    createdAt: '2024-02-20',
    updatedAt: '2024-11-28',
  },
  {
    id: '3',
    name: 'Spectacol Profesional XL',
    code: 'SPX-003',
    category: '3',
    quantity: 15,
    unit: 'set',
    supplier: 'ProPyro Industries',
    batchNumber: 'PPI2024-012',
    expirationDate: '2027-03-20',
    certificateNumber: 'CE-2024-9012',
    certificateExpiry: '2026-01-10',
    minStock: 10,
    location: 'C3-R02',
    price: 450.00,
    createdAt: '2024-03-10',
    updatedAt: '2024-12-05',
  },
  {
    id: '4',
    name: 'Kit Pirotehnic Expert',
    code: 'KPE-004',
    category: '4',
    quantity: 8,
    unit: 'kit',
    supplier: 'Elite Pyrotechnics',
    batchNumber: 'EP2024-007',
    expirationDate: '2028-01-01',
    certificateNumber: 'CE-2024-3456',
    certificateExpiry: '2025-12-31',
    minStock: 5,
    location: 'D4-R01',
    price: 1250.00,
    createdAt: '2024-04-05',
    updatedAt: '2024-12-10',
  },
  {
    id: '5',
    name: 'Efecte Scenice Interior',
    code: 'ESI-005',
    category: 'T1',
    quantity: 120,
    unit: 'buc',
    supplier: 'Theatre FX',
    batchNumber: 'TFX2024-089',
    expirationDate: '2025-09-30',
    certificateNumber: 'CE-2024-7890',
    certificateExpiry: '2025-05-15',
    minStock: 30,
    location: 'E1-R04',
    price: 28.00,
    createdAt: '2024-05-12',
    updatedAt: '2024-11-15',
  },
  {
    id: '6',
    name: 'Pirotehnie Teatrală Outdoor',
    code: 'PTO-006',
    category: 'T2',
    quantity: 45,
    unit: 'buc',
    supplier: 'Stage Pyro Co.',
    batchNumber: 'SPC2024-034',
    expirationDate: '2026-05-20',
    certificateNumber: 'CE-2024-2345',
    certificateExpiry: '2025-08-20',
    minStock: 20,
    location: 'E2-R02',
    price: 65.00,
    createdAt: '2024-06-18',
    updatedAt: '2024-12-08',
  },
  {
    id: '7',
    name: 'Petarde Festive Mini',
    code: 'PFM-007',
    category: '1',
    quantity: 500,
    unit: 'buc',
    supplier: 'PyroTech SRL',
    batchNumber: 'PT2024-102',
    expirationDate: '2025-12-31',
    certificateNumber: 'CE-2024-4567',
    certificateExpiry: '2025-04-30',
    minStock: 100,
    location: 'A2-R01',
    price: 5.50,
    createdAt: '2024-07-22',
    updatedAt: '2024-12-01',
  },
  {
    id: '8',
    name: 'Vulcan de Foc Pro',
    code: 'VFP-008',
    category: '3',
    quantity: 22,
    unit: 'buc',
    supplier: 'ProPyro Industries',
    batchNumber: 'PPI2024-078',
    expirationDate: '2026-11-15',
    certificateNumber: 'CE-2024-6789',
    certificateExpiry: '2025-10-01',
    minStock: 15,
    location: 'C2-R03',
    price: 185.00,
    createdAt: '2024-08-14',
    updatedAt: '2024-12-12',
  },
];

export const mockMovements: StockMovement[] = [
  {
    id: '1',
    productId: '1',
    productName: 'Rachete Festival Gold',
    productCode: 'RFG-001',
    type: 'entry',
    quantity: 100,
    date: '2024-12-10',
    reason: 'Aprovizionare',
    operator: 'Ion Popescu',
    notes: 'Comandă regulată de la furnizor',
    documentNumber: 'NIR-2024-0156',
  },
  {
    id: '2',
    productId: '2',
    productName: 'Baterie Artificii Premium',
    productCode: 'BAP-002',
    type: 'exit',
    quantity: 15,
    date: '2024-12-12',
    reason: 'Vânzare',
    operator: 'Maria Ionescu',
    notes: 'Client: Events Pro SRL',
    documentNumber: 'AV-2024-0089',
  },
  {
    id: '3',
    productId: '3',
    productName: 'Spectacol Profesional XL',
    productCode: 'SPX-003',
    type: 'entry',
    quantity: 5,
    date: '2024-12-08',
    reason: 'Aprovizionare',
    operator: 'Ion Popescu',
    notes: 'Stoc pentru sezonul de iarnă',
    documentNumber: 'NIR-2024-0154',
  },
  {
    id: '4',
    productId: '5',
    productName: 'Efecte Scenice Interior',
    productCode: 'ESI-005',
    type: 'exit',
    quantity: 30,
    date: '2024-12-11',
    reason: 'Vânzare',
    operator: 'Andrei Georgescu',
    notes: 'Client: Teatrul Național',
    documentNumber: 'AV-2024-0088',
  },
  {
    id: '5',
    productId: '7',
    productName: 'Petarde Festive Mini',
    productCode: 'PFM-007',
    type: 'entry',
    quantity: 200,
    date: '2024-12-05',
    reason: 'Aprovizionare',
    operator: 'Ion Popescu',
    notes: 'Comandă pentru sărbători',
    documentNumber: 'NIR-2024-0150',
  },
];

export const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'low_stock',
    severity: 'critical',
    message: 'Stoc critic pentru Baterie Artificii Premium',
    productId: '2',
    productName: 'Baterie Artificii Premium',
    date: '2024-12-14',
    acknowledged: false,
  },
  {
    id: '2',
    type: 'certificate_expiry',
    severity: 'warning',
    message: 'Certificat expiră în 90 de zile',
    productId: '2',
    productName: 'Baterie Artificii Premium',
    date: '2024-12-14',
    acknowledged: false,
  },
  {
    id: '3',
    type: 'expiring_product',
    severity: 'warning',
    message: 'Produs expiră în 8 luni',
    productId: '5',
    productName: 'Efecte Scenice Interior',
    date: '2024-12-13',
    acknowledged: true,
  },
];

export const getStockByCategory = (): Record<PyroCategory, number> => {
  const stock: Record<PyroCategory, number> = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    'T1': 0,
    'T2': 0,
  };
  
  mockProducts.forEach(product => {
    stock[product.category] += product.quantity;
  });
  
  return stock;
};

export const getTotalStockValue = (): number => {
  return mockProducts.reduce((total, product) => {
    return total + (product.quantity * product.price);
  }, 0);
};

export const getLowStockProducts = (): Product[] => {
  return mockProducts.filter(product => product.quantity <= product.minStock);
};

export const getExpiringProducts = (days: number = 180): Product[] => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  
  return mockProducts.filter(product => {
    const expDate = new Date(product.expirationDate);
    return expDate <= futureDate;
  });
};
