import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllExpenses,
  getExpensesByDate,
  createExpense,
  updateExpense,
  deleteExpense,
} from '@/integrations/firebase/client';
import type { ExpenseInput } from '@/integrations/firebase/types';

export const useExpensesFirebase = () => {
  const queryClient = useQueryClient();

  // Fetch all expenses
  const { data: expenses, isLoading, error } = useQuery({
    queryKey: ['expenses-firebase'],
    queryFn: () => getAllExpenses(100),
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: (data: ExpenseInput) => createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses-firebase'] });
      queryClient.invalidateQueries({ queryKey: ['daily-cash-flow-firebase'] });
      toast.success('Expense added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add expense: ${error.message}`);
    },
  });

  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseInput> }) =>
      updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses-firebase'] });
      queryClient.invalidateQueries({ queryKey: ['daily-cash-flow-firebase'] });
      toast.success('Expense updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update expense: ${error.message}`);
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses-firebase'] });
      queryClient.invalidateQueries({ queryKey: ['daily-cash-flow-firebase'] });
      toast.success('Expense deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete expense: ${error.message}`);
    },
  });

  return {
    expenses: expenses || [],
    isLoading,
    error,
    createExpense: createExpenseMutation.mutate,
    updateExpense: updateExpenseMutation.mutate,
    deleteExpense: deleteExpenseMutation.mutate,
  };
};

// Hook to get expenses by specific date
export const useExpensesByDateFirebase = (date: string) => {
  return useQuery({
    queryKey: ['expenses-firebase', date],
    queryFn: () => getExpensesByDate(date),
    enabled: !!date,
  });
};
