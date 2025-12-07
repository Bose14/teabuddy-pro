import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  QueryConstraint,
  onSnapshot,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import { db } from './config';
import type {
  DailyCashFlow,
  DailyCashFlowInput,
  Expense,
  ExpenseInput,
  Employee,
  EmployeeInput,
  SalaryPayment,
  SalaryPaymentInput,
  Stock,
  StockInput,
  StockTransaction,
  StockTransactionInput,
} from './types';

// Collection names
export const COLLECTIONS = {
  DAILY_CASH_FLOW: 'dailyCashFlow',
  EXPENSES: 'expenses',
  EMPLOYEES: 'employees',
  SALARY_PAYMENTS: 'salaryPayments',
  STOCK: 'stock',
  STOCK_TRANSACTIONS: 'stockTransactions',
  STOCK_ANALYTICS: 'stockAnalytics',
} as const;

// Helper to convert Firestore Timestamp to ISO string
export const timestampToDate = (timestamp: Timestamp): string => {
  return timestamp.toDate().toISOString();
};

// Helper to convert ISO string to Firestore Timestamp
export const dateToTimestamp = (dateString: string): Timestamp => {
  return Timestamp.fromDate(new Date(dateString));
};

// ========== DAILY CASH FLOW ==========

export const getDailyCashFlowByDate = async (date: string): Promise<DailyCashFlow | null> => {
  const q = query(
    collection(db, COLLECTIONS.DAILY_CASH_FLOW),
    where('date', '==', date),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  const docData = snapshot.docs[0];
  return { id: docData.id, ...docData.data() } as DailyCashFlow;
};

export const getAllDailyCashFlow = async (limitCount?: number): Promise<DailyCashFlow[]> => {
  const constraints: QueryConstraint[] = [orderBy('date', 'desc')];
  if (limitCount) constraints.push(limit(limitCount));
  
  const q = query(collection(db, COLLECTIONS.DAILY_CASH_FLOW), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyCashFlow));
};

export const createDailyCashFlow = async (data: DailyCashFlowInput): Promise<string> => {
  // Calculate computed fields
  const daily_sales = data.closing_cash + data.online_sales + (data.total_expenses || 0) - data.yesterday_cash;
  const daily_profit = daily_sales - (data.total_expenses || 0);
  const expected_closing_cash = data.yesterday_cash + data.cash_sales - (data.cash_expenses || 0);
  
  const docData = {
    ...data,
    daily_sales,
    daily_profit,
    expected_closing_cash,
    total_expenses: data.total_expenses || 0,
    cash_expenses: data.cash_expenses || 0,
    online_expenses: data.online_expenses || 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, COLLECTIONS.DAILY_CASH_FLOW), docData);
  return docRef.id;
};

export const updateDailyCashFlow = async (id: string, data: Partial<DailyCashFlowInput>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.DAILY_CASH_FLOW, id);
  
  // If updating fields that affect computed values, recalculate
  const currentDoc = await getDoc(docRef);
  if (!currentDoc.exists()) throw new Error('Document not found');
  
  const currentData = currentDoc.data() as DailyCashFlow;
  const updatedData = { ...currentData, ...data };
  
  const daily_sales = updatedData.closing_cash + updatedData.online_sales + updatedData.total_expenses - updatedData.yesterday_cash;
  const daily_profit = daily_sales - updatedData.total_expenses;
  const expected_closing_cash = updatedData.yesterday_cash + updatedData.cash_sales - updatedData.cash_expenses;
  
  await updateDoc(docRef, {
    ...data,
    daily_sales,
    daily_profit,
    expected_closing_cash,
    updated_at: serverTimestamp(),
  });
};

export const deleteDailyCashFlow = async (date: string): Promise<void> => {
  // Find the daily cash flow entry for this date
  const cashFlowEntry = await getDailyCashFlowByDate(date);
  if (!cashFlowEntry) throw new Error('Daily cash flow entry not found');
  
  // Get all expenses for this date
  const expenses = await getExpensesByDate(date);
  
  // Use batch to delete everything atomically
  const batch = writeBatch(db);
  
  // Delete the daily cash flow entry
  batch.delete(doc(db, COLLECTIONS.DAILY_CASH_FLOW, cashFlowEntry.id));
  
  // Delete all expenses for this date
  expenses.forEach(expense => {
    batch.delete(doc(db, COLLECTIONS.EXPENSES, expense.id));
    
    // If it's a salary payment, also delete the salary_payment record
    if (expense.is_salary_payment && expense.employee_id) {
      // Note: We'll handle salary payment deletion in a separate transaction
      // since we need to query for it first
    }
  });
  
  await batch.commit();
  
  // Handle salary payment cascade deletions separately
  for (const expense of expenses) {
    if (expense.is_salary_payment && expense.employee_id) {
      const salaryPaymentsQuery = query(
        collection(db, COLLECTIONS.SALARY_PAYMENTS),
        where('employee_id', '==', expense.employee_id),
        where('amount', '==', expense.amount),
        orderBy('created_at', 'desc'),
        limit(5)
      );
      
      const salaryPaymentsSnapshot = await getDocs(salaryPaymentsQuery);
      const expenseTime = expense.created_at.toMillis();
      
      const matchingPayment = salaryPaymentsSnapshot.docs.find(paymentDoc => {
        const paymentTime = paymentDoc.data().created_at.toMillis();
        const timeDiff = Math.abs(expenseTime - paymentTime);
        return timeDiff < 5000; // Within 5 seconds
      });
      
      if (matchingPayment) {
        const paymentData = matchingPayment.data() as SalaryPayment;
        
        // Delete the salary_payment record
        await deleteDoc(doc(db, COLLECTIONS.SALARY_PAYMENTS, matchingPayment.id));
        
        // If it was an advance, reverse it from employee's advance_given
        if (paymentData.payment_type === 'Advance') {
          const employeeDoc = await getDoc(doc(db, COLLECTIONS.EMPLOYEES, expense.employee_id));
          if (employeeDoc.exists()) {
            const employee = employeeDoc.data() as Employee;
            const newAdvance = Math.max(0, Number(employee.advance_given) - Number(expense.amount));
            await updateDoc(doc(db, COLLECTIONS.EMPLOYEES, expense.employee_id), {
              advance_given: newAdvance,
              updated_at: serverTimestamp(),
            });
          }
        }
      }
    }
  }
};

// ========== EXPENSES ==========

export const getExpensesByDate = async (date: string): Promise<Expense[]> => {
  const q = query(
    collection(db, COLLECTIONS.EXPENSES),
    where('date', '==', date),
    orderBy('created_at', 'desc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
};

export const getAllExpenses = async (limitCount?: number): Promise<Expense[]> => {
  const constraints: QueryConstraint[] = [orderBy('date', 'desc')];
  if (limitCount) constraints.push(limit(limitCount));
  
  const q = query(collection(db, COLLECTIONS.EXPENSES), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
};

export const createExpense = async (data: ExpenseInput): Promise<string> => {
  const docData = {
    ...data,
    is_salary_payment: data.is_salary_payment || false,
    created_at: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, COLLECTIONS.EXPENSES), docData);
  
  // Trigger sync to daily cash flow (will be handled by Cloud Function in production)
  // For now, we'll do it client-side
  await syncExpensesToDailyCashFlow(data.date);
  
  return docRef.id;
};

export const updateExpense = async (id: string, data: Partial<ExpenseInput>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.EXPENSES, id);
  const currentDoc = await getDoc(docRef);
  
  if (!currentDoc.exists()) throw new Error('Expense not found');
  
  const oldDate = currentDoc.data().date;
  await updateDoc(docRef, data);
  
  // Sync both old and new dates
  await syncExpensesToDailyCashFlow(oldDate);
  if (data.date && data.date !== oldDate) {
    await syncExpensesToDailyCashFlow(data.date);
  }
};

export const deleteExpense = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.EXPENSES, id);
  const currentDoc = await getDoc(docRef);
  
  if (!currentDoc.exists()) throw new Error('Expense not found');
  
  const expenseData = currentDoc.data() as Expense;
  const date = expenseData.date;
  
  // If it's a salary payment, handle cascade deletion
  if (expenseData.is_salary_payment && expenseData.employee_id) {
    // Find and delete matching salary_payment record
    const salaryPaymentsQuery = query(
      collection(db, COLLECTIONS.SALARY_PAYMENTS),
      where('employee_id', '==', expenseData.employee_id),
      where('amount', '==', expenseData.amount),
      orderBy('created_at', 'desc'),
      limit(5)
    );
    
    const salaryPaymentsSnapshot = await getDocs(salaryPaymentsQuery);
    
    // Find best match by comparing timestamps
    const expenseTime = expenseData.created_at.toMillis();
    const matchingPayment = salaryPaymentsSnapshot.docs.find(paymentDoc => {
      const paymentTime = paymentDoc.data().created_at.toMillis();
      const timeDiff = Math.abs(expenseTime - paymentTime);
      return timeDiff < 5000; // Within 5 seconds
    });
    
    if (matchingPayment) {
      const paymentData = matchingPayment.data() as SalaryPayment;
      
      // Delete the salary_payment record
      await deleteDoc(doc(db, COLLECTIONS.SALARY_PAYMENTS, matchingPayment.id));
      
      // If it was an advance, reverse it from employee's advance_given
      if (paymentData.payment_type === 'Advance') {
        const employeeDoc = await getDoc(doc(db, COLLECTIONS.EMPLOYEES, expenseData.employee_id));
        if (employeeDoc.exists()) {
          const employee = employeeDoc.data() as Employee;
          const newAdvance = Math.max(0, Number(employee.advance_given) - Number(expenseData.amount));
          await updateDoc(doc(db, COLLECTIONS.EMPLOYEES, expenseData.employee_id), {
            advance_given: newAdvance,
            updated_at: serverTimestamp(),
          });
        }
      }
    }
  }
  
  // Delete the expense
  await deleteDoc(docRef);
  
  // Sync after deletion
  await syncExpensesToDailyCashFlow(date);
};

// Helper function to sync expenses to daily cash flow
const syncExpensesToDailyCashFlow = async (date: string): Promise<void> => {
  // Get all expenses for this date
  const expenses = await getExpensesByDate(date);
  
  // Calculate totals
  const cash_expenses = expenses
    .filter(e => e.payment_method === 'Cash')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const online_expenses = expenses
    .filter(e => e.payment_method === 'Online')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const total_expenses = cash_expenses + online_expenses;
  
  // Update or create daily cash flow entry
  const existingCashFlow = await getDailyCashFlowByDate(date);
  
  if (existingCashFlow) {
    await updateDailyCashFlow(existingCashFlow.id, {
      cash_expenses,
      online_expenses,
      total_expenses,
    });
  } else {
    // Create new entry with default values
    await createDailyCashFlow({
      date,
      yesterday_cash: 0,
      cash_sales: 0,
      online_sales: 0,
      closing_cash: 0,
      cash_expenses,
      online_expenses,
      total_expenses,
    });
  }
};

// ========== EMPLOYEES ==========

export const getAllEmployees = async (activeOnly = false): Promise<Employee[]> => {
  const constraints: QueryConstraint[] = [];
  if (activeOnly) constraints.push(where('is_active', '==', true));
  constraints.push(orderBy('name', 'asc'));
  
  const q = query(collection(db, COLLECTIONS.EMPLOYEES), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
};

export const createEmployee = async (data: EmployeeInput): Promise<string> => {
  const docData = {
    ...data,
    advance_given: data.advance_given || 0,
    is_active: data.is_active !== undefined ? data.is_active : true,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, COLLECTIONS.EMPLOYEES), docData);
  return docRef.id;
};

export const updateEmployee = async (id: string, data: Partial<EmployeeInput>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.EMPLOYEES, id);
  await updateDoc(docRef, {
    ...data,
    updated_at: serverTimestamp(),
  });
};

// ========== SALARY PAYMENTS ==========

export const getSalaryPayments = async (
  employeeId?: string,
  month?: string,
  year?: number
): Promise<SalaryPayment[]> => {
  const constraints: QueryConstraint[] = [];
  
  if (employeeId) constraints.push(where('employee_id', '==', employeeId));
  if (month) constraints.push(where('month', '==', month));
  if (year) constraints.push(where('year', '==', year));
  
  constraints.push(orderBy('created_at', 'desc'));
  
  const q = query(collection(db, COLLECTIONS.SALARY_PAYMENTS), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalaryPayment));
};

export const createSalaryPayment = async (data: SalaryPaymentInput): Promise<string> => {
  const docData: any = {
    employee_id: data.employee_id,
    amount: data.amount,
    payment_type: data.payment_type || 'Salary',
    payment_method: data.payment_method,
    month: data.month,
    year: data.year,
    created_at: serverTimestamp(),
  };
  
  // Only add notes if it's not undefined
  if (data.notes !== undefined && data.notes !== null) {
    docData.notes = data.notes;
  }
  
  const docRef = await addDoc(collection(db, COLLECTIONS.SALARY_PAYMENTS), docData);
  return docRef.id;
};

// ========== STOCK ==========

export const getAllStock = async (): Promise<Stock[]> => {
  const q = query(
    collection(db, COLLECTIONS.STOCK),
    orderBy('category', 'asc'),
    orderBy('product_name', 'asc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Stock));
};

export const createStock = async (data: StockInput): Promise<string> => {
  const docData = {
    ...data,
    purchased_qty: 0,
    used_sold_qty: 0,
    closing_stock: data.opening_stock, // Initial closing = opening
    low_stock_threshold: data.low_stock_threshold || 10,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, COLLECTIONS.STOCK), docData);
  return docRef.id;
};

export const updateStock = async (id: string, updates: { type: 'purchase' | 'use'; quantity: number }): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.STOCK, id);
  
  await runTransaction(db, async (transaction) => {
    const stockDoc = await transaction.get(docRef);
    if (!stockDoc.exists()) throw new Error('Stock not found');
    
    const stockData = stockDoc.data() as Stock;
    
    let purchased_qty = stockData.purchased_qty;
    let used_sold_qty = stockData.used_sold_qty;
    
    if (updates.type === 'purchase') {
      purchased_qty += updates.quantity;
    } else {
      used_sold_qty += updates.quantity;
    }
    
    const closing_stock = stockData.opening_stock + purchased_qty - used_sold_qty;
    
    transaction.update(docRef, {
      purchased_qty,
      used_sold_qty,
      closing_stock,
      updated_at: serverTimestamp(),
    });
    
    // Create stock transaction record
    const transactionData: Omit<StockTransaction, 'id'> = {
      stock_id: id,
      transaction_type: updates.type,
      quantity: updates.quantity,
      created_at: Timestamp.now(),
    };
    
    const transactionRef = doc(collection(db, COLLECTIONS.STOCK_TRANSACTIONS));
    transaction.set(transactionRef, transactionData);
  });
};

export const deleteStock = async (id: string): Promise<void> => {
  // Delete the stock item
  await deleteDoc(doc(db, COLLECTIONS.STOCK, id));
  
  // Delete associated transactions
  const transactionsQuery = query(
    collection(db, COLLECTIONS.STOCK_TRANSACTIONS),
    where('stock_id', '==', id)
  );
  
  const transactionsSnapshot = await getDocs(transactionsQuery);
  const batch = writeBatch(db);
  
  transactionsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
};

// ========== STOCK TRANSACTIONS ==========

export const getStockTransactions = async (stockId?: string): Promise<StockTransaction[]> => {
  const constraints: QueryConstraint[] = [];
  if (stockId) constraints.push(where('stock_id', '==', stockId));
  constraints.push(orderBy('created_at', 'desc'));
  
  const q = query(collection(db, COLLECTIONS.STOCK_TRANSACTIONS), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockTransaction));
};

// Get stock transactions with stock details for analytics
export const getStockTransactionsWithDetails = async (
  startDate?: Date,
  endDate?: Date
): Promise<Array<StockTransaction & { stock: Stock | null }>> => {
  const constraints: QueryConstraint[] = [];
  
  if (startDate) {
    constraints.push(where('created_at', '>=', Timestamp.fromDate(startDate)));
  }
  if (endDate) {
    constraints.push(where('created_at', '<=', Timestamp.fromDate(endDate)));
  }
  
  constraints.push(orderBy('created_at', 'desc'));
  
  const q = query(collection(db, COLLECTIONS.STOCK_TRANSACTIONS), ...constraints);
  const snapshot = await getDocs(q);
  
  // Get all unique stock IDs
  const stockIds = [...new Set(snapshot.docs.map(doc => doc.data().stock_id))];
  
  // Fetch all stock details
  const stockMap = new Map<string, Stock>();
  await Promise.all(
    stockIds.map(async (stockId) => {
      const stockDoc = await getDoc(doc(db, COLLECTIONS.STOCK, stockId));
      if (stockDoc.exists()) {
        stockMap.set(stockId, { id: stockDoc.id, ...stockDoc.data() } as Stock);
      }
    })
  );
  
  // Combine transactions with stock details
  return snapshot.docs.map(doc => {
    const transaction = { id: doc.id, ...doc.data() } as StockTransaction;
    return {
      ...transaction,
      stock: stockMap.get(transaction.stock_id) || null,
    };
  });
};

// ========== REAL-TIME SUBSCRIPTIONS ==========

export const subscribeToDailyCashFlow = (
  callback: (data: DailyCashFlow[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.DAILY_CASH_FLOW),
    orderBy('date', 'desc'),
    limit(30)
  );
  
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyCashFlow));
    callback(data);
  });
};

export const subscribeToExpenses = (
  callback: (data: Expense[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.EXPENSES),
    orderBy('date', 'desc'),
    limit(100)
  );
  
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
    callback(data);
  });
};

export const subscribeToStock = (
  callback: (data: Stock[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.STOCK),
    orderBy('product_name', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Stock));
    callback(data);
  });
};
