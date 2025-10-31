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

export default function AddExpense() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState(0);
  const [mode, setMode] = useState("Cash");
  const [status, setStatus] = useState("Paid");

  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData: any) => {
      const { error } = await supabase.from("expenses").insert([expenseData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({
        title: "Expense Added!",
        description: "Expense entry has been recorded successfully.",
      });
      navigate("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || amount <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please fill all fields correctly.",
        variant: "destructive",
      });
      return;
    }

    addExpenseMutation.mutate({
      title,
      amount,
      mode,
      status,
      date: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-6 px-4 md:px-6">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 md:p-8">
          <h1 className="text-3xl font-bold mb-6 text-destructive">Add Expense</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Expense Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Expense Title</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Milk Purchase, Electricity Bill"
                className="text-lg h-14"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="text-lg h-14"
              />
            </div>

            {/* Amount Display */}
            <div className="bg-destructive/5 p-4 rounded-lg border-2 border-destructive/20">
              <p className="text-sm text-muted-foreground">Total Expense</p>
              <p className="text-3xl font-bold text-destructive">₹{amount.toFixed(2)}</p>
            </div>

            {/* Payment Mode */}
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="h-14">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="GPay">GPay</SelectItem>
                  <SelectItem value="PhonePe">PhonePe</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-14">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="destructive"
              className="w-full h-14 text-lg"
              disabled={addExpenseMutation.isPending}
            >
              {addExpenseMutation.isPending ? "Adding..." : "Add Expense"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
