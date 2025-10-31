import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus } from "lucide-react";
import { format } from "date-fns";

export default function StockManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [itemName, setItemName] = useState("");
  const [openingStock, setOpeningStock] = useState("");
  const [stockIn, setStockIn] = useState("");
  const [stockOut, setStockOut] = useState("");

  const { data: stockData } = useQuery({
    queryKey: ["stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addStockMutation = useMutation({
    mutationFn: async (newStock: any) => {
      const remaining = Number(openingStock) + Number(stockIn) - Number(stockOut);
      const { error } = await supabase.from("stock").insert([{
        ...newStock,
        remaining,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      toast({ title: "Stock entry added successfully!" });
      setItemName("");
      setOpeningStock("");
      setStockIn("");
      setStockOut("");
    },
    onError: () => {
      toast({ title: "Failed to add stock entry", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addStockMutation.mutate({
      item_name: itemName,
      opening_stock: Number(openingStock) || 0,
      stock_in: Number(stockIn) || 0,
      stock_out: Number(stockOut) || 0,
      date: format(new Date(), "yyyy-MM-dd"),
    });
  };

  const itemPresets = ["Tea Powder", "Sugar", "Milk", "Cups", "Bun Pack", "Gas Cylinder"];

  return (
    <div className="min-h-screen bg-background pt-20 pb-6 px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Stock Management</h1>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                {itemPresets.map((item) => (
                  <Button
                    key={item}
                    type="button"
                    variant="outline"
                    onClick={() => setItemName(item)}
                    className={itemName === item ? "bg-primary text-primary-foreground" : ""}
                  >
                    {item}
                  </Button>
                ))}
              </div>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Or enter custom item"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Opening Stock</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={openingStock}
                  onChange={(e) => setOpeningStock(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Stock In (Purchased)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={stockIn}
                  onChange={(e) => setStockIn(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Stock Out (Used)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={stockOut}
                  onChange={(e) => setStockOut(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Remaining Stock</p>
              <p className="text-2xl font-bold">
                {(Number(openingStock) || 0) + (Number(stockIn) || 0) - (Number(stockOut) || 0)}
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Add Stock Entry
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Stock History</h2>
          {stockData?.map((stock) => (
            <Card key={stock.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{stock.item_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(stock.date), "dd MMM yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-xl font-bold text-success">{Number(stock.remaining).toFixed(2)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Opening</p>
                  <p className="font-medium">{Number(stock.opening_stock).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">In</p>
                  <p className="font-medium text-primary">+{Number(stock.stock_in).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Out</p>
                  <p className="font-medium text-destructive">-{Number(stock.stock_out).toFixed(2)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
