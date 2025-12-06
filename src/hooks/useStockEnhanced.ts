import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Supplier,
  StockAlert,
  StockLedger,
  AddStockParams,
  UpdateStockParams,
  AddSupplierParams,
  TransactionType,
} from "@/types/stock";

// ============= SUPPLIERS =============

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Supplier[];
    },
  });
}

export function useAddSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddSupplierParams) => {
      const { error } = await supabase.from("suppliers").insert({
        name: params.name,
        contact_person: params.contact_person || null,
        phone: params.phone || null,
        email: params.email || null,
        address: params.address || null,
        notes: params.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier added successfully!");
    },
    onError: (error) => {
      toast.error("Failed to add supplier: " + error.message);
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
      const { error } = await supabase
        .from("suppliers")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier updated!");
    },
    onError: (error) => {
      toast.error("Failed to update supplier: " + error.message);
    },
  });
}

// ============= STOCK ALERTS =============

export function useStockAlerts() {
  return useQuery({
    queryKey: ["stock-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_alerts")
        .select("*, stock:stock_id(product_name, unit)")
        .eq("is_active", true)
        .eq("is_acknowledged", false)
        .order("severity", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StockAlert[];
    },
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("stock_alerts")
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      toast.success("Alert acknowledged");
    },
    onError: (error) => {
      toast.error("Failed to acknowledge alert: " + error.message);
    },
  });
}

// ============= STOCK LEDGER =============

export function useStockLedger(stockId?: string) {
  return useQuery({
    queryKey: ["stock-ledger", stockId],
    queryFn: async () => {
      let query = supabase
        .from("stock_ledger")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (stockId) {
        query = query.eq("stock_id", stockId);
      }
      
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as StockLedger[];
    },
    enabled: !!stockId,
  });
}

// ============= ENHANCED STOCK OPERATIONS =============

export function useStockWithSuppliers() {
  return useQuery({
    queryKey: ["stock-with-suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock")
        .select(`
          *,
          supplier:supplier_id(id, name, phone, contact_person)
        `)
        .order("category")
        .order("product_name");
      if (error) throw error;
      return data;
    },
  });
}

export function useAddStockEnhanced() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddStockParams) => {
      const { error } = await supabase.from("stock").insert({
        product_name: params.product_name,
        category: params.category,
        sku: params.sku || null,
        supplier_id: params.supplier_id || null,
        barcode: params.barcode || null,
        unit: params.unit,
        opening_stock: params.opening_stock,
        purchased_qty: 0,
        used_sold_qty: 0,
        purchase_price: params.purchase_price,
        selling_price: params.selling_price,
        low_stock_threshold: params.low_stock_threshold || 10,
        min_stock_level: params.min_stock_level || 5,
        max_stock_level: params.max_stock_level || null,
        expiry_date: params.expiry_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["stock-with-suppliers"] });
      toast.success("Stock item added successfully!");
    },
    onError: (error) => {
      toast.error("Failed to add stock: " + error.message);
    },
  });
}

export function useUpdateStockEnhanced() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateStockParams) => {
      // Insert transaction with enhanced fields
      const { error } = await supabase.from("stock_transactions").insert({
        stock_id: params.id,
        transaction_type: params.type,
        quantity: params.quantity,
        supplier_id: params.supplier_id || null,
        unit_price: params.unit_price || null,
        total_value: params.unit_price ? params.quantity * params.unit_price : null,
        batch_number: params.batch_number || null,
        expiry_date: params.expiry_date || null,
        invoice_number: params.invoice_number || null,
        notes: params.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["stock-with-suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["stock-ledger"] });
      toast.success("Stock updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update stock: " + error.message);
    },
  });
}

// ============= STOCK VALUATION =============

export function useStockValuation() {
  return useQuery({
    queryKey: ["stock-valuation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock")
        .select("closing_stock, purchase_price, selling_price, category");
      
      if (error) throw error;

      const totalPurchaseValue = data.reduce(
        (sum, item) => sum + (item.closing_stock || 0) * item.purchase_price,
        0
      );

      const totalSellingValue = data.reduce(
        (sum, item) => sum + (item.closing_stock || 0) * item.selling_price,
        0
      );

      const potentialProfit = totalSellingValue - totalPurchaseValue;

      const byCategory = data.reduce((acc, item) => {
        const category = item.category;
        if (!acc[category]) {
          acc[category] = {
            purchaseValue: 0,
            sellingValue: 0,
            items: 0,
          };
        }
        acc[category].purchaseValue += (item.closing_stock || 0) * item.purchase_price;
        acc[category].sellingValue += (item.closing_stock || 0) * item.selling_price;
        acc[category].items += 1;
        return acc;
      }, {} as Record<string, { purchaseValue: number; sellingValue: number; items: number }>);

      return {
        totalPurchaseValue,
        totalSellingValue,
        potentialProfit,
        profitMargin: totalPurchaseValue > 0 
          ? ((potentialProfit / totalPurchaseValue) * 100).toFixed(2)
          : "0",
        byCategory,
      };
    },
  });
}

// ============= PRICE HISTORY =============

export function usePriceHistory(stockId: string) {
  return useQuery({
    queryKey: ["price-history", stockId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_history")
        .select("*")
        .eq("stock_id", stockId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!stockId,
  });
}

// ============= UTILITY FUNCTIONS =============

export async function checkExpiringItems() {
  const { error } = await supabase.rpc("check_expiring_items");
  if (error) {
    console.error("Failed to check expiring items:", error);
    throw error;
  }
}

// Run expiry check on app load
if (typeof window !== 'undefined') {
  checkExpiringItems().catch(console.error);
}
