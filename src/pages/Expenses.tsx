import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useExpenses, useAddExpense, useDeleteExpense } from "@/hooks/useExpenses";
import { EXPENSE_TYPES, PAYMENT_METHODS } from "@/lib/constants";
import { Loader2, Plus, Trash2, TrendingDown, Wallet, Smartphone } from "lucide-react";
import { toast } from "sonner";

export default function Expenses() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expenseType, setExpenseType] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [vendorName, setVendorName] = useState("");
  const [notes, setNotes] = useState("");

  const { data: expenses, isLoading } = useExpenses();
  const addMutation = useAddExpense();
  const deleteMutation = useDeleteExpense();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseType || !amount) {
      toast.error("Please fill expense type and amount");
      return;
    }

    addMutation.mutate({
      date,
      expense_type: expenseType,
      amount: parseFloat(amount),
      payment_method: paymentMethod,
      vendor_name: vendorName || undefined,
      notes: notes || undefined,
    }, {
      onSuccess: () => {
        setExpenseType("");
        setAmount("");
        setVendorName("");
        setNotes("");
      }
    });
  };

  const todayExpenses = expenses?.filter(e => e.date === format(new Date(), "yyyy-MM-dd")) || [];
  const todayTotal = todayExpenses.reduce((acc, e) => acc + Number(e.amount), 0);

  return (
    <div className="lg:ml-64 p-4 lg:p-6 space-y-6 safe-bottom">
      <h1 className="text-2xl font-bold text-foreground">Expenses</h1>

      {/* Add Expense Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Expense
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <Label>Expense Type</Label>
              <Select value={expenseType} onValueChange={setExpenseType}>
                <SelectTrigger className="input-field">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <Button
                    key={method}
                    type="button"
                    variant={paymentMethod === method ? "default" : "outline"}
                    onClick={() => setPaymentMethod(method)}
                    className="h-12"
                  >
                    {method === "Cash" ? <Wallet className="h-4 w-4 mr-2" /> : <Smartphone className="h-4 w-4 mr-2" />}
                    {method}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Vendor Name (Optional)</Label>
              <Input
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g., Milk supplier"
                className="input-field"
              />
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes..."
                rows={2}
              />
            </div>

            <Button
              type="submit"
              className="w-full action-btn"
              disabled={addMutation.isPending}
            >
              {addMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Plus className="h-5 w-5 mr-2" />
              )}
              Add Expense
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Today's Expenses
            </span>
            <span className="text-destructive font-bold">
              ₹{todayTotal.toLocaleString("en-IN")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayExpenses.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No expenses today</p>
          ) : (
            <div className="space-y-2">
              {todayExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div>
                    <p className="font-medium">{expense.expense_type}</p>
                    <p className="text-sm text-muted-foreground">
                      {expense.payment_method} {expense.vendor_name && `• ${expense.vendor_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-destructive">
                      ₹{Number(expense.amount).toLocaleString("en-IN")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(expense.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4">Loading...</p>
          ) : expenses && expenses.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {expenses.slice(0, 20).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div>
                    <p className="font-medium">{expense.expense_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(expense.date), "dd MMM yyyy")} • {expense.payment_method}
                    </p>
                  </div>
                  <span className="font-bold">₹{Number(expense.amount).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No expenses yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}