import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { toast } from "sonner";

export interface Expense {
  id: string;
  date: string;
  expense_type: string;
  amount: number;
  payment_method: string;
  vendor_name: string | null;
  notes: string | null;
  is_salary_payment: boolean;
  employee_id: string | null;
  created_at: string;
}

export function useExpenses(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["expenses", startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (startDate) query = query.gte("date", startDate);
      if (endDate) query = query.lte("date", endDate);

      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
  });
}

export function useExpenseStats() {
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["expense-stats", today, monthStart],
    queryFn: async () => {
      const { data: allExpenses } = await supabase
        .from("expenses")
        .select("*");

      const todayExpenses = allExpenses?.filter(e => e.date === today) || [];
      const weekExpenses = allExpenses?.filter(e => e.date >= weekStart && e.date <= weekEnd) || [];
      const monthExpenses = allExpenses?.filter(e => e.date >= monthStart && e.date <= monthEnd) || [];

      const sum = (data: Expense[]) => data.reduce((acc, e) => acc + Number(e.amount), 0);
      const sumByMethod = (data: Expense[], method: string) => 
        data.filter(e => e.payment_method === method).reduce((acc, e) => acc + Number(e.amount), 0);

      return {
        today: {
          total: sum(todayExpenses),
          cash: sumByMethod(todayExpenses, "Cash"),
          online: sumByMethod(todayExpenses, "Online"),
        },
        weekly: {
          total: sum(weekExpenses),
          cash: sumByMethod(weekExpenses, "Cash"),
          online: sumByMethod(weekExpenses, "Online"),
        },
        monthly: {
          total: sum(monthExpenses),
          cash: sumByMethod(monthExpenses, "Cash"),
          online: sumByMethod(monthExpenses, "Online"),
        },
        overall: {
          total: sum(allExpenses || []),
          cash: sumByMethod(allExpenses || [], "Cash"),
          online: sumByMethod(allExpenses || [], "Online"),
        },
        byType: Object.entries(
          (allExpenses || []).reduce((acc, e) => {
            acc[e.expense_type] = (acc[e.expense_type] || 0) + Number(e.amount);
            return acc;
          }, {} as Record<string, number>)
        ).sort((a, b) => b[1] - a[1]),
      };
    },
  });
}

export function useAddExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      date: string;
      expense_type: string;
      amount: number;
      payment_method: string;
      vendor_name?: string;
      notes?: string;
      is_salary_payment?: boolean;
      employee_id?: string;
    }) => {
      // 1. Insert the expense
      const { error: insertError } = await supabase.from("expenses").insert({
        date: data.date,
        expense_type: data.expense_type,
        amount: data.amount,
        payment_method: data.payment_method,
        vendor_name: data.vendor_name || null,
        notes: data.notes || null,
        is_salary_payment: data.is_salary_payment || false,
        employee_id: data.employee_id || null,
      });
      if (insertError) throw insertError;

      // 2. Calculate total expenses for this date
      const { data: expensesForDate, error: queryError } = await supabase
        .from("expenses")
        .select("*")
        .eq("date", data.date);
      
      if (queryError) throw queryError;

      // 3. Calculate cash and online expenses
      const cashExpenses = expensesForDate
        ?.filter(e => e.payment_method === 'Cash')
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      
      const onlineExpenses = expensesForDate
        ?.filter(e => e.payment_method === 'Online')
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      
      const totalExpenses = cashExpenses + onlineExpenses;

      // 4. Update or insert into daily_cash_flow
      const { error: upsertError } = await supabase
        .from("daily_cash_flow")
        .upsert({
          date: data.date,
          cash_expenses: cashExpenses,
          online_expenses: onlineExpenses,
          total_expenses: totalExpenses,
        }, {
          onConflict: 'date',
          ignoreDuplicates: false,
        });
      
      if (upsertError) throw upsertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      queryClient.invalidateQueries({ queryKey: ["daily-cash-flow"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Expense added successfully!");
    },
    onError: (error) => {
      toast.error("Failed to add expense: " + error.message);
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Get the expense date before deleting (needed for sync)
      const { data: expenseToDelete, error: fetchError } = await supabase
        .from("expenses")
        .select("date")
        .eq("id", id)
        .single();
      
      if (fetchError) throw fetchError;
      const expenseDate = expenseToDelete.date;

      // 2. Delete the expense
      const { error: deleteError } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);
      
      if (deleteError) throw deleteError;

      // 3. Recalculate expenses for that date
      const { data: remainingExpenses, error: queryError } = await supabase
        .from("expenses")
        .select("*")
        .eq("date", expenseDate);
      
      if (queryError) throw queryError;

      // 4. Calculate new totals
      const cashExpenses = remainingExpenses
        ?.filter(e => e.payment_method === 'Cash')
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      
      const onlineExpenses = remainingExpenses
        ?.filter(e => e.payment_method === 'Online')
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      
      const totalExpenses = cashExpenses + onlineExpenses;

      // 5. Update daily_cash_flow
      const { error: upsertError } = await supabase
        .from("daily_cash_flow")
        .upsert({
          date: expenseDate,
          cash_expenses: cashExpenses,
          online_expenses: onlineExpenses,
          total_expenses: totalExpenses,
        }, {
          onConflict: 'date',
          ignoreDuplicates: false,
        });
      
      if (upsertError) throw upsertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      queryClient.invalidateQueries({ queryKey: ["daily-cash-flow"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Expense deleted!");
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });
}
