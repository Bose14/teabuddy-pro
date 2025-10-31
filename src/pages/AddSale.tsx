import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const itemPresets = [
  { name: "Tea", price: 10 },
  { name: "Coffee", price: 15 },
  { name: "Bun", price: 20 },
  { name: "Milk", price: 25 },
  { name: "Snacks", price: 30 },
  { name: "Others", price: 0 },
];

export default function AddSale() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");

  const amount = quantity * pricePerUnit;

  const addSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const { error } = await supabase.from("sales").insert([saleData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast({
        title: "Sale Added!",
        description: "Sale entry has been recorded successfully.",
      });
      navigate("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add sale. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || quantity <= 0 || pricePerUnit <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please fill all fields correctly.",
        variant: "destructive",
      });
      return;
    }

    addSaleMutation.mutate({
      item_name: itemName,
      quantity,
      price_per_unit: pricePerUnit,
      amount,
      payment_mode: paymentMode,
      date: new Date().toISOString().split("T")[0],
    });
  };

  const handleItemSelect = (name: string) => {
    setItemName(name);
    const preset = itemPresets.find((p) => p.name === name);
    if (preset) setPricePerUnit(preset.price);
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-6 px-4 md:px-6">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 md:p-8">
          <h1 className="text-3xl font-bold mb-6 text-primary">Add Sale</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item Selection */}
            <div className="space-y-2">
              <Label>Item</Label>
              <div className="grid grid-cols-3 gap-2">
                {itemPresets.map((item) => (
                  <Button
                    key={item.name}
                    type="button"
                    variant={itemName === item.name ? "default" : "outline"}
                    onClick={() => handleItemSelect(item.name)}
                    className="h-16"
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="text-lg h-14"
              />
            </div>

            {/* Price Per Unit */}
            <div className="space-y-2">
              <Label htmlFor="price">Price per Unit (₹)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(Number(e.target.value))}
                className="text-lg h-14"
              />
            </div>

            {/* Amount Display */}
            <div className="bg-primary/5 p-4 rounded-lg border-2 border-primary/20">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold text-primary">₹{amount.toFixed(2)}</p>
            </div>

            {/* Payment Mode */}
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger className="h-14">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="GPay">GPay</SelectItem>
                  <SelectItem value="PhonePe">PhonePe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-14 text-lg"
              disabled={addSaleMutation.isPending}
            >
              {addSaleMutation.isPending ? "Adding..." : "Add Sale"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
