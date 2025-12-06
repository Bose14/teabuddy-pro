import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addDays, isBefore } from "date-fns";

export interface Stock {
  id: string;
  product_name: string;
  category: string;
  vendor: string | null;
  unit: string;
  opening_stock: number;
  purchased_qty: number;
  used_sold_qty: number;
  closing_stock: number;
  purchase_price: number;
  selling_price: number;
  low_stock_threshold: number;
  expiry_date: string | null;
  created_at: string;
}

export interface StockTransaction {
  id: string;
  stock_id: string;
  transaction_type: string;
  quantity: number;
  notes: string | null;
  created_at: string;
}

export function useStock() {
  return useQuery({
    queryKey: ["stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock")
        .select("*")
        .order("category")
        .order("product_name");
      if (error) throw error;
      return data as Stock[];
    },
  });
}

export function useStockAlerts() {
  const { data: stock } = useStock();

  const lowStockItems = stock?.filter(s => s.closing_stock <= s.low_stock_threshold) || [];
  const expiringItems = stock?.filter(s => {
    if (!s.expiry_date) return false;
    const expiryDate = new Date(s.expiry_date);
    const warningDate = addDays(new Date(), 7);
    return isBefore(expiryDate, warningDate);
  }) || [];

  return { lowStockItems, expiringItems };
}

export function useAddStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      product_name: string;
      category: string;
      vendor?: string;
      unit: string;
      opening_stock: number;
      purchase_price: number;
      selling_price: number;
      low_stock_threshold: number;
      expiry_date?: string;
    }) => {
      const { error } = await supabase.from("stock").insert({
        product_name: data.product_name,
        category: data.category,
        vendor: data.vendor || null,
        unit: data.unit,
        opening_stock: data.opening_stock,
        purchased_qty: 0,
        used_sold_qty: 0,
        purchase_price: data.purchase_price,
        selling_price: data.selling_price,
        low_stock_threshold: data.low_stock_threshold,
        expiry_date: data.expiry_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      toast.success("Stock item added!");
    },
    onError: (error) => {
      toast.error("Failed: " + error.message);
    },
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type, quantity, notes }: {
      id: string;
      type: "purchase" | "use";
      quantity: number;
      notes?: string;
    }) => {
      // Get current stock
      const { data: current } = await supabase
        .from("stock")
        .select("purchased_qty, used_sold_qty")
        .eq("id", id)
        .single();

      if (!current) throw new Error("Stock not found");

      const updates = type === "purchase"
        ? { purchased_qty: Number(current.purchased_qty) + quantity }
        : { used_sold_qty: Number(current.used_sold_qty) + quantity };

      const { error: updateError } = await supabase
        .from("stock")
        .update(updates)
        .eq("id", id);
      if (updateError) throw updateError;

      // Log transaction
      const { error: txError } = await supabase.from("stock_transactions").insert({
        stock_id: id,
        transaction_type: type,
        quantity,
        notes: notes || null,
      });
      if (txError) throw txError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      toast.success("Stock updated!");
    },
    onError: (error) => {
      toast.error("Failed: " + error.message);
    },
  });
}

export function useDeleteStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stock").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      toast.success("Stock item deleted!");
    },
    onError: (error) => {
      toast.error("Failed: " + error.message);
    },
  });
}