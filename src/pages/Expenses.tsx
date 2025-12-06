import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useExpenses, useExpenseStats, useAddExpense, useDeleteExpense, type Expense } from "@/hooks/useExpenses";
import { EXPENSE_TYPES, PAYMENT_METHODS } from "@/lib/constants";
import { Loader2, Plus, Calendar, TrendingDown, Wallet, Smartphone, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Expenses() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Date range for table
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  // Form state
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expenseType, setExpenseType] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [vendorName, setVendorName] = useState("");
  const [notes, setNotes] = useState("");

  const { data: expenses, isLoading } = useExpenses(startDate, endDate);
  const { data: stats } = useExpenseStats();
  const addMutation = useAddExpense();
  const deleteMutation = useDeleteExpense();

  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setDate(expense.date);
      setExpenseType(expense.expense_type);
      setAmount(expense.amount.toString());
      setPaymentMethod(expense.payment_method);
      setVendorName(expense.vendor_name || "");
      setNotes(expense.notes || "");
    } else {
      setEditingExpense(null);
      resetForm();
    }
    setShowDialog(true);
  };

  const resetForm = () => {
    setDate(format(new Date(), "yyyy-MM-dd"));
    setExpenseType("");
    setAmount("");
    setPaymentMethod("Cash");
    setVendorName("");
    setNotes("");
  };

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
        setShowDialog(false);
        setEditingExpense(null);
        resetForm();
      }
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const setThisMonth = () => {
    setStartDate(format(startOfMonth(new Date()), "yyyy-MM-dd"));
    setEndDate(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  };

  const getPaymentBadge = (method: string) => {
    return method === "Cash" ? (
      <Badge variant="outline" className="bg-success/10 text-success border-success">
        <Wallet className="h-3 w-3 mr-1" />
        Cash
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-info/10 text-info border-info">
        <Smartphone className="h-3 w-3 mr-1" />
        Online
      </Badge>
    );
  };

  return (
    <div className="lg:ml-64 p-4 mt-16 lg:p-6 space-y-6 safe-bottom">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? "Edit Expense" : "Add Expense"}
              </DialogTitle>
            </DialogHeader>
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
                      {method === "Cash" ? (
                        <Wallet className="h-4 w-4 mr-2" />
                      ) : (
                        <Smartphone className="h-4 w-4 mr-2" />
                      )}
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

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={addMutation.isPending}
                >
                  {addMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {editingExpense ? "Update Expense" : "Add Expense"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-2xl font-bold text-destructive">
                ₹{stats?.today.total.toLocaleString("en-IN") || 0}
              </p>
              <div className="flex gap-2 text-xs">
                <span className="text-muted-foreground">
                  💵 {stats?.today.cash.toLocaleString("en-IN") || 0}
                </span>
                <span className="text-muted-foreground">
                  📱 {stats?.today.online.toLocaleString("en-IN") || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold text-destructive">
                ₹{stats?.weekly.total.toLocaleString("en-IN") || 0}
              </p>
              <div className="flex gap-2 text-xs">
                <span className="text-muted-foreground">
                  💵 {stats?.weekly.cash.toLocaleString("en-IN") || 0}
                </span>
                <span className="text-muted-foreground">
                  📱 {stats?.weekly.online.toLocaleString("en-IN") || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-destructive">
                ₹{stats?.monthly.total.toLocaleString("en-IN") || 0}
              </p>
              <div className="flex gap-2 text-xs">
                <span className="text-muted-foreground">
                  💵 {stats?.monthly.cash.toLocaleString("en-IN") || 0}
                </span>
                <span className="text-muted-foreground">
                  📱 {stats?.monthly.online.toLocaleString("en-IN") || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Overall</p>
              <p className="text-2xl font-bold text-destructive">
                ₹{stats?.overall.total.toLocaleString("en-IN") || 0}
              </p>
              <div className="flex gap-2 text-xs">
                <span className="text-muted-foreground">
                  💵 {stats?.overall.cash.toLocaleString("en-IN") || 0}
                </span>
                <span className="text-muted-foreground">
                  📱 {stats?.overall.online.toLocaleString("en-IN") || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <Label>From Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex-1">
              <Label>To Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>
            <Button onClick={setThisMonth} variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              This Month
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8">Loading...</p>
          ) : expenses && expenses.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">
                          {format(new Date(expense.date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>{expense.expense_type}</TableCell>
                        <TableCell className="text-right font-semibold text-destructive">
                          ₹{Number(expense.amount).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>{getPaymentBadge(expense.payment_method)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {expense.vendor_name || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                          {expense.notes || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(expense)}
                              disabled={expense.is_salary_payment}
                              title={expense.is_salary_payment ? "Salary payments cannot be edited here" : "Edit expense"}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will delete the expense of <strong>₹{Number(expense.amount).toLocaleString("en-IN")}</strong> for <strong>{expense.expense_type}</strong> on {format(new Date(expense.date), "dd MMM yyyy")}.
                                    {expense.is_salary_payment && (
                                      <>
                                        <br /><br />
                                        <strong className="text-destructive">Warning:</strong> This is a salary payment. Deleting it will also remove the salary record from the employee's history.
                                      </>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(expense.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete Expense
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {expenses.map((expense) => (
                  <Card key={expense.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">{expense.expense_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(expense.date), "dd MMM yyyy")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenDialog(expense)}
                            disabled={expense.is_salary_payment}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Delete ₹{Number(expense.amount).toLocaleString("en-IN")} expense?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(expense.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-secondary rounded">
                          <span className="text-sm text-muted-foreground">Amount:</span>
                          <span className="font-semibold text-destructive">
                            ₹{Number(expense.amount).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-secondary rounded">
                          <span className="text-sm text-muted-foreground">Method:</span>
                          {getPaymentBadge(expense.payment_method)}
                        </div>
                        {expense.vendor_name && (
                          <div className="flex justify-between items-center p-2 bg-secondary rounded">
                            <span className="text-sm text-muted-foreground">Vendor:</span>
                            <span className="text-sm">{expense.vendor_name}</span>
                          </div>
                        )}
                        {expense.notes && (
                          <div className="p-2 bg-secondary rounded">
                            <span className="text-xs text-muted-foreground block mb-1">Notes:</span>
                            <span className="text-sm">{expense.notes}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No expenses found for this date range</p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Expense
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
