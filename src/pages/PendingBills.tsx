import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Check } from "lucide-react";
import { format } from "date-fns";

export default function PendingBills() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [vendorName, setVendorName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: billsData } = useQuery({
    queryKey: ["pending_bills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_bills")
        .select("*")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const addBillMutation = useMutation({
    mutationFn: async (newBill: any) => {
      const { error } = await supabase.from("pending_bills").insert([newBill]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending_bills"] });
      toast({ title: "Bill added successfully!" });
      setVendorName("");
      setAmount("");
      setDueDate(format(new Date(), "yyyy-MM-dd"));
    },
    onError: () => {
      toast({ title: "Failed to add bill", variant: "destructive" });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (billId: string) => {
      const { error } = await supabase
        .from("pending_bills")
        .update({ status: "Paid" })
        .eq("id", billId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending_bills"] });
      toast({ title: "Bill marked as paid!" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBillMutation.mutate({
      vendor_name: vendorName,
      amount: Number(amount),
      due_date: dueDate,
      status: "Pending",
    });
  };

  const pendingBills = billsData?.filter((b) => b.status === "Pending") || [];
  const paidBills = billsData?.filter((b) => b.status === "Paid") || [];
  const totalPending = pendingBills.reduce((sum, b) => sum + Number(b.amount), 0);

  return (
    <div className="min-h-screen bg-background pt-20 pb-6 px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Pending Bills</h1>
        </div>

        <Card className="p-6 bg-destructive/5 border-destructive/20">
          <p className="text-sm text-muted-foreground">Total Pending Amount</p>
          <p className="text-3xl font-bold text-destructive">₹{totalPending.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground mt-1">{pendingBills.length} pending bills</p>
        </Card>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Vendor Name</Label>
              <Input
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Enter vendor name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Add Pending Bill
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Pending Bills</h2>
          {pendingBills.map((bill) => (
            <Card key={bill.id} className="p-4 border-destructive/20">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{bill.vendor_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Due: {format(new Date(bill.due_date), "dd MMM yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-destructive">₹{Number(bill.amount).toFixed(2)}</p>
                </div>
              </div>
              <Button
                onClick={() => markPaidMutation.mutate(bill.id)}
                variant="outline"
                className="w-full"
              >
                <Check className="h-4 w-4 mr-2" />
                Mark as Paid
              </Button>
            </Card>
          ))}
        </div>

        {paidBills.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Paid Bills</h2>
            {paidBills.map((bill) => (
              <Card key={bill.id} className="p-4 opacity-60">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{bill.vendor_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Due: {format(new Date(bill.due_date), "dd MMM yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-success">₹{Number(bill.amount).toFixed(2)}</p>
                    <p className="text-xs text-success">Paid ✓</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
