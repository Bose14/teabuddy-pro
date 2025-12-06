import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from "date-fns";

export interface DailyUsage {
  product_name: string;
  category: string;
  unit: string;
  total_used: number;
  total_purchased: number;
  transaction_count: number;
  cost: number;
}

export interface UsageTrend {
  date: string;
  quantity: number;
}

export interface ProductUsageSummary {
  product_id: string;
  product_name: string;
  category: string;
  unit: string;
  today_used: number;
  week_used: number;
  month_used: number;
  overall_used: number;
  average_daily: number;
  total_cost: number;
}

// Get usage statistics for a specific time period
export function useUsageStats(period: 'today' | 'week' | 'month' | 'overall' = 'today') {
  return useQuery({
    queryKey: ["usage-stats", period],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = endOfDay(now);

      switch (period) {
        case 'today':
          startDate = startOfDay(now);
          break;
        case 'week':
          startDate = startOfWeek(now);
          break;
        case 'month':
          startDate = startOfMonth(now);
          break;
        case 'overall':
          startDate = new Date('2024-01-01'); // Or your app start date
          break;
      }

      // Get all usage transactions for the period
      const { data: transactions, error } = await supabase
        .from("stock_transactions")
        .select(`
          quantity,
          transaction_type,
          created_at,
          stock:stock_id (
            product_name,
            category,
            unit,
            purchase_price
          )
        `)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by product and calculate totals
      const usageMap = new Map<string, DailyUsage>();

      transactions?.forEach((tx: any) => {
        if (!tx.stock) return;
        
        const key = tx.stock.product_name;
        const existing = usageMap.get(key) || {
          product_name: tx.stock.product_name,
          category: tx.stock.category,
          unit: tx.stock.unit,
          total_used: 0,
          total_purchased: 0,
          transaction_count: 0,
          cost: 0,
        };

        if (tx.transaction_type === 'use') {
          existing.total_used += Number(tx.quantity);
          existing.cost += Number(tx.quantity) * Number(tx.stock.purchase_price);
        } else if (tx.transaction_type === 'purchase') {
          existing.total_purchased += Number(tx.quantity);
        }
        existing.transaction_count += 1;

        usageMap.set(key, existing);
      });

      return Array.from(usageMap.values()).sort((a, b) => b.total_used - a.total_used);
    },
    refetchOnWindowFocus: false,
  });
}

// Get usage trend for a specific product over the last N days
export function useProductUsageTrend(productId: string, days: number = 7) {
  return useQuery({
    queryKey: ["product-usage-trend", productId, days],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, days - 1);

      const { data, error } = await supabase
        .from("stock_transactions")
        .select("quantity, created_at")
        .eq("stock_id", productId)
        .eq("transaction_type", "use")
        .gte("created_at", startOfDay(startDate).toISOString())
        .lte("created_at", endOfDay(endDate).toISOString());

      if (error) throw error;

      // Group by date
      const trendMap = new Map<string, number>();
      
      // Initialize all dates with 0
      for (let i = 0; i < days; i++) {
        const date = subDays(endDate, days - 1 - i);
        trendMap.set(format(date, 'yyyy-MM-dd'), 0);
      }

      // Add actual usage
      data?.forEach((tx: any) => {
        const dateKey = format(new Date(tx.created_at), 'yyyy-MM-dd');
        const current = trendMap.get(dateKey) || 0;
        trendMap.set(dateKey, current + Number(tx.quantity));
      });

      return Array.from(trendMap.entries()).map(([date, quantity]) => ({
        date,
        quantity,
      }));
    },
    enabled: !!productId,
  });
}

// Get comprehensive usage summary for all products
export function useProductUsageSummary() {
  return useQuery({
    queryKey: ["product-usage-summary"],
    queryFn: async () => {
      // Get all stock items
      const { data: stockItems, error: stockError } = await supabase
        .from("stock")
        .select("id, product_name, category, unit, purchase_price");

      if (stockError) throw stockError;

      const now = new Date();
      const startOfToday = startOfDay(now);
      const startOfThisWeek = startOfWeek(now);
      const startOfThisMonth = startOfMonth(now);

      // Get all usage transactions
      const { data: transactions, error: txError } = await supabase
        .from("stock_transactions")
        .select("stock_id, quantity, created_at")
        .eq("transaction_type", "use");

      if (txError) throw txError;

      // Calculate summary for each product
      const summaries: ProductUsageSummary[] = stockItems.map((stock: any) => {
        const stockTxs = transactions?.filter((tx: any) => tx.stock_id === stock.id) || [];
        
        const todayUsed = stockTxs
          .filter((tx: any) => new Date(tx.created_at) >= startOfToday)
          .reduce((sum, tx: any) => sum + Number(tx.quantity), 0);

        const weekUsed = stockTxs
          .filter((tx: any) => new Date(tx.created_at) >= startOfThisWeek)
          .reduce((sum, tx: any) => sum + Number(tx.quantity), 0);

        const monthUsed = stockTxs
          .filter((tx: any) => new Date(tx.created_at) >= startOfThisMonth)
          .reduce((sum, tx: any) => sum + Number(tx.quantity), 0);

        const overallUsed = stockTxs.reduce((sum, tx: any) => sum + Number(tx.quantity), 0);

        // Calculate days since first transaction for average
        const firstTx = stockTxs.length > 0 
          ? new Date(stockTxs[stockTxs.length - 1].created_at)
          : now;
        const daysSinceStart = Math.max(1, Math.ceil((now.getTime() - firstTx.getTime()) / (1000 * 60 * 60 * 24)));
        const averageDaily = overallUsed / daysSinceStart;

        const totalCost = overallUsed * Number(stock.purchase_price);

        return {
          product_id: stock.id,
          product_name: stock.product_name,
          category: stock.category,
          unit: stock.unit,
          today_used: todayUsed,
          week_used: weekUsed,
          month_used: monthUsed,
          overall_used: overallUsed,
          average_daily: averageDaily,
          total_cost: totalCost,
        };
      });

      return summaries.filter(s => s.overall_used > 0); // Only show products with usage
    },
  });
}

// Get transaction history for a specific product
export function useProductTransactions(productId: string, limit: number = 10) {
  return useQuery({
    queryKey: ["product-transactions", productId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_transactions")
        .select("*")
        .eq("stock_id", productId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

// Get category-wise usage statistics
export function useCategoryUsageStats(period: 'today' | 'week' | 'month' = 'month') {
  return useQuery({
    queryKey: ["category-usage-stats", period],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'today':
          startDate = startOfDay(now);
          break;
        case 'week':
          startDate = startOfWeek(now);
          break;
        case 'month':
          startDate = startOfMonth(now);
          break;
      }

      const { data: transactions, error } = await supabase
        .from("stock_transactions")
        .select(`
          quantity,
          stock:stock_id (
            category,
            purchase_price
          )
        `)
        .eq("transaction_type", "use")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      const categoryMap = new Map<string, { quantity: number; cost: number }>();

      transactions?.forEach((tx: any) => {
        if (!tx.stock) return;
        const category = tx.stock.category;
        const existing = categoryMap.get(category) || { quantity: 0, cost: 0 };
        existing.quantity += Number(tx.quantity);
        existing.cost += Number(tx.quantity) * Number(tx.stock.purchase_price);
        categoryMap.set(category, existing);
      });

      return Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        quantity: data.quantity,
        cost: data.cost,
      }));
    },
  });
}
