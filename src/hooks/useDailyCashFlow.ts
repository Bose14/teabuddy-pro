import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { toast } from "sonner";
import {
  getAllDailyCashFlow as getFirebaseDailyCashFlow,
  getDailyCashFlowByDate as getFirebaseDailyCashFlowByDate,
  createDailyCashFlow as createFirebaseDailyCashFlow,
  updateDailyCashFlow as updateFirebaseDailyCashFlow,
} from "@/integrations/firebase/client";
import {
  getAllExpenses as getFirebaseExpenses,
} from "@/integrations/firebase/client";
import type { DailyCashFlow as FirebaseDailyCashFlow } from "@/integrations/firebase/types";

// Check which backend to use
const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';

export interface DailyCashFlow {
  id: string;
  date: string;
  yesterday_cash: number;
  cash_sales: number;
  online_sales: number;
  total_expenses: number;
  cash_expenses: number;
  online_expenses: number;
  closing_cash: number;
  daily_sales: number;
  daily_profit: number;
  expected_closing_cash: number;
  notes: string | null;
}

export function useDailyCashFlow(date: string) {
  return useQuery({
    queryKey: ["daily-cash-flow", date, USE_FIREBASE ? 'firebase' : 'supabase'],
    queryFn: async () => {
      if (USE_FIREBASE) {
        const entry = await getFirebaseDailyCashFlowByDate(date);
        if (!entry) return null;
        return {
          ...entry,
          created_at: entry.created_at?.toDate().toISOString() || new Date().toISOString(),
        } as DailyCashFlow;
      } else {
        const { data, error } = await supabase
          .from("daily_cash_flow")
          .select("*")
          .eq("date", date)
          .maybeSingle();
        
        if (error) throw error;
        return data as DailyCashFlow | null;
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
}

export function useDailyCashFlowRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["daily-cash-flow-range", startDate, endDate, USE_FIREBASE ? 'firebase' : 'supabase'],
    queryFn: async () => {
      if (USE_FIREBASE) {
        const allEntries = await getFirebaseDailyCashFlow();
        const filtered = allEntries.filter(e => e.date >= startDate && e.date <= endDate);
        return filtered.map(e => ({
          ...e,
          created_at: e.created_at?.toDate().toISOString() || new Date().toISOString(),
        })).sort((a, b) => b.date.localeCompare(a.date)) as DailyCashFlow[];
      } else {
        const { data, error } = await supabase
          .from("daily_cash_flow")
          .select("*")
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: false });
        
        if (error) throw error;
        return data as DailyCashFlow[];
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
}

export function useDashboardStats() {
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["dashboard-stats", today, monthStart, USE_FIREBASE ? 'firebase' : 'supabase'],
    queryFn: async () => {
      if (USE_FIREBASE) {
        // Get all data from Firebase
        const allEntries = await getFirebaseDailyCashFlow();
        
        // Convert to proper format
        const allData = allEntries.map(e => ({
          ...e,
          created_at: e.created_at?.toDate().toISOString() || new Date().toISOString(),
        })) as DailyCashFlow[];

        // Filter for different time periods
        const todayData = allData.find(e => e.date === today);
        const weekData = allData.filter(e => e.date >= weekStart && e.date <= weekEnd);
        const monthData = allData.filter(e => e.date >= monthStart && e.date <= monthEnd);

        const sumData = (data: DailyCashFlow[]) => ({
          sales: data.reduce((acc, d) => acc + Number(d.daily_sales || 0), 0),
          expenses: data.reduce((acc, d) => acc + Number(d.total_expenses || 0), 0),
          profit: data.reduce((acc, d) => acc + Number(d.daily_profit || 0), 0),
          cashSales: data.reduce((acc, d) => acc + Number(d.cash_sales || 0), 0),
          onlineSales: data.reduce((acc, d) => acc + Number(d.online_sales || 0), 0),
        });

        return {
          today: todayData ? {
            sales: Number(todayData.daily_sales) || 0,
            expenses: Number(todayData.total_expenses) || 0,
            profit: Number(todayData.daily_profit) || 0,
            cashSales: Number(todayData.cash_sales) || 0,
            onlineSales: Number(todayData.online_sales) || 0,
            closingCash: Number(todayData.closing_cash) || 0,
            expectedCash: Number(todayData.expected_closing_cash) || 0,
            cashMismatch: Number(todayData.closing_cash) !== Number(todayData.expected_closing_cash),
          } : null,
          weekly: sumData(weekData),
          monthly: sumData(monthData),
          overall: sumData(allData),
        };
      } else {
        // Get today's data
        const { data: todayData } = await supabase
          .from("daily_cash_flow")
          .select("*")
          .eq("date", today)
          .maybeSingle();

        // Get monthly data
        const { data: monthData } = await supabase
          .from("daily_cash_flow")
          .select("*")
          .gte("date", monthStart)
          .lte("date", monthEnd);

        // Get weekly data
        const { data: weekData } = await supabase
          .from("daily_cash_flow")
          .select("*")
          .gte("date", weekStart)
          .lte("date", weekEnd);

        // Get all-time data
        const { data: allData } = await supabase
          .from("daily_cash_flow")
          .select("*");

        const sumData = (data: DailyCashFlow[] | null) => ({
          sales: data?.reduce((acc, d) => acc + Number(d.daily_sales || 0), 0) || 0,
          expenses: data?.reduce((acc, d) => acc + Number(d.total_expenses || 0), 0) || 0,
          profit: data?.reduce((acc, d) => acc + Number(d.daily_profit || 0), 0) || 0,
          cashSales: data?.reduce((acc, d) => acc + Number(d.cash_sales || 0), 0) || 0,
          onlineSales: data?.reduce((acc, d) => acc + Number(d.online_sales || 0), 0) || 0,
        });

        return {
          today: todayData ? {
            sales: Number(todayData.daily_sales) || 0,
            expenses: Number(todayData.total_expenses) || 0,
            profit: Number(todayData.daily_profit) || 0,
            cashSales: Number(todayData.cash_sales) || 0,
            onlineSales: Number(todayData.online_sales) || 0,
            closingCash: Number(todayData.closing_cash) || 0,
            expectedCash: Number(todayData.expected_closing_cash) || 0,
            cashMismatch: Number(todayData.closing_cash) !== Number(todayData.expected_closing_cash),
          } : null,
          weekly: sumData(weekData),
          monthly: sumData(monthData),
          overall: sumData(allData),
        };
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
}

export function useSaveDailyEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      date: string;
      yesterday_cash: number;
      cash_sales: number;
      online_sales: number;
      closing_cash: number;
      notes?: string;
    }) => {
      if (USE_FIREBASE) {
        // Get expenses for this date from Firebase
        const allExpenses = await getFirebaseExpenses();
        const expensesForDate = allExpenses.filter(e => e.date === data.date);

        const cashExpenses = expensesForDate
          .filter(e => e.payment_method === "Cash")
          .reduce((acc, e) => acc + Number(e.amount), 0);
        
        const onlineExpenses = expensesForDate
          .filter(e => e.payment_method === "Online")
          .reduce((acc, e) => acc + Number(e.amount), 0);
        
        const totalExpenses = cashExpenses + onlineExpenses;

        const payload = {
          date: data.date,
          yesterday_cash: data.yesterday_cash,
          cash_sales: data.cash_sales,
          online_sales: data.online_sales,
          total_expenses: totalExpenses,
          cash_expenses: cashExpenses,
          online_expenses: onlineExpenses,
          closing_cash: data.closing_cash,
          notes: data.notes || null,
        };

        // Check if entry exists
        const existing = await getFirebaseDailyCashFlowByDate(data.date);
        
        if (existing) {
          await updateFirebaseDailyCashFlow(existing.id, payload);
        } else {
          await createFirebaseDailyCashFlow(payload);
        }
      } else {
        // Get expenses for this date
        const { data: expenses } = await supabase
          .from("expenses")
          .select("amount, payment_method")
          .eq("date", data.date);

        const cashExpenses = expenses?.filter(e => e.payment_method === "Cash").reduce((acc, e) => acc + Number(e.amount), 0) || 0;
        const onlineExpenses = expenses?.filter(e => e.payment_method === "Online").reduce((acc, e) => acc + Number(e.amount), 0) || 0;
        const totalExpenses = cashExpenses + onlineExpenses;

        const payload = {
          date: data.date,
          yesterday_cash: data.yesterday_cash,
          cash_sales: data.cash_sales,
          online_sales: data.online_sales,
          total_expenses: totalExpenses,
          cash_expenses: cashExpenses,
          online_expenses: onlineExpenses,
          closing_cash: data.closing_cash,
          notes: data.notes || null,
        };

        const { data: existing } = await supabase
          .from("daily_cash_flow")
          .select("id")
          .eq("date", data.date)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("daily_cash_flow")
            .update(payload)
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("daily_cash_flow")
            .insert(payload);
          if (error) throw error;
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["daily-cash-flow"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Daily entry saved successfully!");
    },
    onError: (error) => {
      toast.error("Failed to save: " + error.message);
    },
  });
}

export function useDeleteDailyEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date: string) => {
      const { error } = await supabase
        .from("daily_cash_flow")
        .delete()
        .eq("date", date);
      
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["daily-cash-flow"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Daily entry deleted!");
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });
}
