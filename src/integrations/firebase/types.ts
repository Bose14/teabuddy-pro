import { Timestamp } from 'firebase/firestore';

// Daily Cash Flow
export interface DailyCashFlow {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  yesterday_cash: number;
  cash_sales: number;
  online_sales: number;
  total_expenses: number;
  cash_expenses: number;
  online_expenses: number;
  closing_cash: number;
  daily_sales: number; // Computed
  daily_profit: number; // Computed
  expected_closing_cash: number; // Computed
  notes?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DailyCashFlowInput {
  date: string;
  yesterday_cash: number;
  cash_sales: number;
  online_sales: number;
  total_expenses?: number;
  cash_expenses?: number;
  online_expenses?: number;
  closing_cash: number;
  notes?: string;
}

// Expenses
export interface Expense {
  id: string;
  date: string; // ISO date string
  expense_type: string;
  amount: number;
  payment_method: 'Cash' | 'Online';
  vendor_name?: string;
  notes?: string;
  is_salary_payment: boolean;
  employee_id?: string;
  created_at: Timestamp;
}

export interface ExpenseInput {
  date: string;
  expense_type: string;
  amount: number;
  payment_method: 'Cash' | 'Online';
  vendor_name?: string;
  notes?: string;
  is_salary_payment?: boolean;
  employee_id?: string;
}

// Employees
export interface Employee {
  id: string;
  name: string;
  role: string;
  monthly_salary: number;
  advance_given: number;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface EmployeeInput {
  name: string;
  role: string;
  monthly_salary: number;
  advance_given?: number;
  is_active?: boolean;
}

// Salary Payments
export interface SalaryPayment {
  id: string;
  employee_id: string;
  amount: number;
  payment_type: string;
  payment_method: 'Cash' | 'Online';
  month: string;
  year: number;
  notes?: string;
  created_at: Timestamp;
}

export interface SalaryPaymentInput {
  employee_id: string;
  amount: number;
  payment_type?: string;
  payment_method: 'Cash' | 'Online';
  month: string;
  year: number;
  notes?: string;
}

// Stock
export interface Stock {
  id: string;
  product_name: string;
  category: string;
  vendor?: string;
  unit: string;
  opening_stock: number;
  purchased_qty: number;
  used_sold_qty: number;
  closing_stock: number; // Computed
  purchase_price: number;
  selling_price: number;
  low_stock_threshold: number;
  expiry_date?: string; // ISO date string
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface StockInput {
  product_name: string;
  category: string;
  vendor?: string;
  unit: string;
  opening_stock: number;
  purchase_price: number;
  selling_price: number;
  low_stock_threshold?: number;
  expiry_date?: string;
}

// Stock Transactions
export interface StockTransaction {
  id: string;
  stock_id: string;
  transaction_type: 'purchase' | 'use';
  quantity: number;
  notes?: string;
  created_at: Timestamp;
}

export interface StockTransactionInput {
  stock_id: string;
  transaction_type: 'purchase' | 'use';
  quantity: number;
  notes?: string;
}

// Stock Analytics (Pre-computed for performance)
export interface StockAnalytics {
  stock_id: string;
  product_name: string;
  category: string;
  unit: string;
  today_used: number;
  week_used: number;
  month_used: number;
  overall_used: number;
  average_daily: number;
  total_cost: number;
  last_updated: Timestamp;
}

// Helper type for converting Firestore Timestamp to Date
export type FirestoreDoc<T> = Omit<T, 'created_at' | 'updated_at'> & {
  created_at: Date;
  updated_at?: Date;
};
