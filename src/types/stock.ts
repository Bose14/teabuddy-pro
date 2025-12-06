// Enhanced Stock Management Types

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockEnhanced {
  id: string;
  sku: string;
  product_name: string;
  category: string;
  supplier_id: string | null;
  vendor: string | null; // Legacy field
  barcode: string | null;
  unit: string;
  opening_stock: number;
  purchased_qty: number;
  used_sold_qty: number;
  closing_stock: number;
  purchase_price: number;
  selling_price: number;
  low_stock_threshold: number;
  min_stock_level: number;
  max_stock_level: number | null;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockLedger {
  id: string;
  stock_id: string;
  transaction_type: 'IN' | 'OUT';
  transaction_subtype: string;
  quantity: number;
  before_stock: number;
  after_stock: number;
  unit_price: number | null;
  transaction_value: number | null;
  reference_id: string | null;
  user_notes: string | null;
  created_at: string;
}

export interface StockAlert {
  id: string;
  stock_id: string;
  alert_type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';
  message: string;
  severity: 'info' | 'warning' | 'error';
  is_active: boolean;
  is_acknowledged: boolean;
  acknowledged_at: string | null;
  created_at: string;
}

export interface PriceHistory {
  id: string;
  stock_id: string;
  price_type: 'PURCHASE' | 'SELLING';
  old_price: number | null;
  new_price: number;
  changed_reason: string | null;
  created_at: string;
}

export interface StockTransactionEnhanced {
  id: string;
  stock_id: string;
  transaction_type: string;
  quantity: number;
  supplier_id: string | null;
  unit_price: number | null;
  total_value: number | null;
  batch_number: string | null;
  expiry_date: string | null;
  invoice_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface StockSummary extends StockEnhanced {
  supplier_name: string | null;
  supplier_phone: string | null;
  stock_value: number;
  stock_status: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'OVERSTOCK' | 'ADEQUATE';
  active_alerts_count: number;
}

export type TransactionType = 
  | 'purchase' 
  | 'use' 
  | 'sale' 
  | 'adjustment_in' 
  | 'adjustment_out' 
  | 'damage' 
  | 'expired' 
  | 'return';

export interface AddStockParams {
  product_name: string;
  category: string;
  sku?: string;
  supplier_id?: string;
  barcode?: string;
  unit: string;
  opening_stock: number;
  purchase_price: number;
  selling_price: number;
  low_stock_threshold?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  expiry_date?: string;
}

export interface UpdateStockParams {
  id: string;
  type: TransactionType;
  quantity: number;
  supplier_id?: string;
  unit_price?: number;
  batch_number?: string;
  expiry_date?: string;
  invoice_number?: string;
  notes?: string;
}

export interface AddSupplierParams {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}
