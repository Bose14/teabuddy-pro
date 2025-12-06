import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { toast } from "sonner";

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
    queryKey: ["daily-cash-flow", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_cash_flow")
        .select("*")
        .eq("date", date)
        .maybeSingle();
      
      if (error) throw error;
      return data as DailyCashFlow | null;
    },
  });
}

export function useDailyCashFlowRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["daily-cash-flow-range", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_cash_flow")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });
      
      if (error) throw error;
      return data as DailyCashFlow[];
    },
  });
}

export function useDashboardStats() {
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["dashboard-stats", today, monthStart],
    queryFn: async () => {
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
    },
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-cash-flow"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Daily entry saved successfully!");
    },
    onError: (error) => {
      toast.error("Failed to save: " + error.message);
    },
  });
}