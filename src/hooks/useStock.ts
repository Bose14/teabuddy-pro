import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addDays, isBefore } from "date-fns";
import {
  getAllStock as getFirebaseStock,
  createStock as createFirebaseStock,
  updateStock as updateFirebaseStock,
  deleteStock as deleteFirebaseStock,
} from "@/integrations/firebase/client";
import type { Stock as FirebaseStock } from "@/integrations/firebase/types";

// Check which backend to use
const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';

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
    queryKey: ["stock", USE_FIREBASE ? 'firebase' : 'supabase'],
    queryFn: async () => {
      if (USE_FIREBASE) {
        const stocks = await getFirebaseStock();
        return stocks.map(s => ({
          ...s,
          created_at: s.created_at?.toDate().toISOString() || new Date().toISOString(),
        })).sort((a, b) => {
          // Sort by category, then product_name
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return a.product_name.localeCompare(b.product_name);
        }) as Stock[];
      } else {
        const { data, error } = await supabase
          .from("stock")
          .select("*")
          .order("category")
          .order("product_name");
        if (error) throw error;
        return data as Stock[];
      }
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
      if (USE_FIREBASE) {
        await createFirebaseStock({
          product_name: data.product_name,
          category: data.category,
          vendor: data.vendor || null,
          unit: data.unit,
          opening_stock: data.opening_stock,
          purchase_price: data.purchase_price,
          selling_price: data.selling_price,
          low_stock_threshold: data.low_stock_threshold,
          expiry_date: data.expiry_date || null,
        });
      } else {
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
      }
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
      if (USE_FIREBASE) {
        // Get current stock from Firebase
        const allStock = await getFirebaseStock();
        const current = allStock.find(s => s.id === id);
        
        if (!current) throw new Error("Stock not found");

        // Update stock with transaction info
        await updateFirebaseStock(id, {
          type,
          quantity,
        });
        
        // Note: Stock transactions are Supabase-only for now
        // If needed, we can add Firebase support later
      } else {
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
      }
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
      if (USE_FIREBASE) {
        await deleteFirebaseStock(id);
      } else {
        const { error } = await supabase.from("stock").delete().eq("id", id);
        if (error) throw error;
      }
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
