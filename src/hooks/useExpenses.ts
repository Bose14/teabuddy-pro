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
      const { error } = await supabase.from("expenses").insert({
        date: data.date,
        expense_type: data.expense_type,
        amount: data.amount,
        payment_method: data.payment_method,
        vendor_name: data.vendor_name || null,
        notes: data.notes || null,
        is_salary_payment: data.is_salary_payment || false,
        employee_id: data.employee_id || null,
      });
      if (error) throw error;
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
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      toast.success("Expense deleted!");
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });
}