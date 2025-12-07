import { useState } from "react";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { MonthYearFilter } from "@/components/MonthYearFilter";
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
import { useDailyCashFlow, useDailyCashFlowRange, useSaveDailyEntry, useDeleteDailyEntry } from "@/hooks/useDailyCashFlow";
import { useAddExpense } from "@/hooks/useExpenses";
import { AlertBadge } from "@/components/AlertBadge";
import { Loader2, Plus, Calendar, IndianRupee, Smartphone, Wallet, Edit, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

export default function DailyEntry() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [deleteDate, setDeleteDate] = useState<string | null>(null);
  
  // Date range for table
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const handleFilterChange = (start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Form state
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [yesterdayCash, setYesterdayCash] = useState("");
  const [cashSales, setCashSales] = useState("");
  const [onlineSales, setOnlineSales] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [notes, setNotes] = useState("");
  const [recordMismatchAsExpense, setRecordMismatchAsExpense] = useState(false);

  const { data: entries, isLoading } = useDailyCashFlowRange(
    startDate || format(new Date(0), "yyyy-MM-dd"), 
    endDate || format(new Date(), "yyyy-MM-dd")
  );
  const { data: todayData } = useDailyCashFlow(date);
  const { data: yesterdayData } = useDailyCashFlow(format(subDays(new Date(date), 1), "yyyy-MM-dd"));
  const saveMutation = useSaveDailyEntry();
  const deleteMutation = useDeleteDailyEntry();
  const addExpenseMutation = useAddExpense();

  // Calculate summary stats
  const totalSales = entries?.reduce((acc, e) => acc + Number(e.daily_sales || 0), 0) || 0;
  const totalExpenses = entries?.reduce((acc, e) => acc + Number(e.total_expenses || 0), 0) || 0;
  const totalProfit = entries?.reduce((acc, e) => acc + Number(e.daily_profit || 0), 0) || 0;

  const parseNum = (val: string) => parseFloat(val) || 0;

  // Auto-calculated values
  const yesterdayCashNum = parseNum(yesterdayCash);
  const cashSalesNum = parseNum(cashSales);
  const onlineSalesNum = parseNum(onlineSales);
  const closingCashNum = parseNum(closingCash);
  const totalExpensesForDate = todayData?.total_expenses || 0;
  const cashExpenses = todayData?.cash_expenses || 0;

  const expectedClosingCash = yesterdayCashNum + cashSalesNum - cashExpenses;
  const dailySales = closingCashNum + onlineSalesNum + totalExpensesForDate - yesterdayCashNum;
  const dailyProfit = dailySales - totalExpensesForDate;
  const cashMismatch = closingCashNum > 0 && Math.abs(closingCashNum - expectedClosingCash) > 0.01;
  const cashDifference = expectedClosingCash - closingCashNum;
  const showMismatchToggle = closingCashNum > 0 && cashDifference > 0.01;

  const handleOpenDialog = (dateToEdit?: string) => {
    if (dateToEdit) {
      setEditingDate(dateToEdit);
      setDate(dateToEdit);
      // Data will be auto-filled by useEffect in the actual implementation
      // For now, we'll fetch it when dialog opens
      const entry = entries?.find(e => e.date === dateToEdit);
      if (entry) {
        setYesterdayCash(entry.yesterday_cash.toString());
        setCashSales(entry.cash_sales.toString());
        setOnlineSales(entry.online_sales.toString());
        setClosingCash(entry.closing_cash.toString());
        setNotes(entry.notes || "");
      }
    } else {
      setEditingDate(null);
      setDate(format(new Date(), "yyyy-MM-dd"));
      resetForm();
    }
    setShowDialog(true);
  };

  const resetForm = () => {
    setCashSales("");
    setOnlineSales("");
    setClosingCash("");
    setNotes("");
    setRecordMismatchAsExpense(false);
    // Auto-fill yesterday's cash
    if (yesterdayData) {
      setYesterdayCash(yesterdayData.closing_cash.toString());
    } else {
      setYesterdayCash("0");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Step 1: Save daily entry
      await saveMutation.mutateAsync({
        date,
        yesterday_cash: yesterdayCashNum,
        cash_sales: cashSalesNum,
        online_sales: onlineSalesNum,
        closing_cash: closingCashNum,
        notes: notes || undefined,
      });

      // Step 2: If mismatch toggle is checked, create expense
      if (recordMismatchAsExpense && showMismatchToggle) {
        await addExpenseMutation.mutateAsync({
          date: date,
          expense_type: "Others",
          amount: cashDifference,
          payment_method: "Cash",
          notes: "Cash difference adjustment",
          is_salary_payment: false,
        });
      }

      // Step 3: Close dialog and reset
      setShowDialog(false);
      setEditingDate(null);
      resetForm();
    } catch (error) {
      // Error handling is done by the mutations
      console.error("Error saving entry:", error);
    }
  };

  const handleDelete = (dateToDelete: string) => {
    deleteMutation.mutate(dateToDelete, {
      onSuccess: () => {
        setDeleteDate(null);
      }
    });
  };

  const getStatusBadge = (entry: any) => {
    if (!entry.closing_cash) {
      return <Badge variant="secondary">Pending</Badge>;
    }
    
    const mismatch = Math.abs(entry.closing_cash - entry.expected_closing_cash) > 0.01;
    if (mismatch) {
      return <Badge variant="destructive">Mismatch</Badge>;
    }
    
    return <Badge variant="default" className="bg-success">Complete</Badge>;
  };

  return (
    <div className="lg:ml-64 p-4 mt-16 lg:p-6 space-y-6 safe-bottom">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Daily Entry</h1>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDate ? `Edit Entry - ${format(new Date(date), "dd MMM yyyy")}` : "Add Daily Entry"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date Selection */}
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Cash Flow Inputs */}
              <div className="space-y-3">
                <div>
                  <Label>Opening Cash (Yesterday)</Label>
                  <Input
                    type="number"
                    value={yesterdayCash}
                    onChange={(e) => setYesterdayCash(e.target.value)}
                    placeholder="0"
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-success" />
                      Cash Sales
                    </Label>
                    <Input
                      type="number"
                      value={cashSales}
                      onChange={(e) => setCashSales(e.target.value)}
                      placeholder="0"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-info" />
                      Online Sales
                    </Label>
                    <Input
                      type="number"
                      value={onlineSales}
                      onChange={(e) => setOnlineSales(e.target.value)}
                      placeholder="0"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <Label>Closing Cash (Counted)</Label>
                  <Input
                    type="number"
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    placeholder="0"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Cash Mismatch Alert */}
              {cashMismatch && (
                <AlertBadge
                  type="warning"
                  message={`Cash Mismatch! Expected: ₹${expectedClosingCash.toLocaleString("en-IN")} | Counted: ₹${closingCashNum.toLocaleString("en-IN")} | Diff: ₹${Math.abs(closingCashNum - expectedClosingCash).toLocaleString("en-IN")}`}
                />
              )}

              {/* Cash Mismatch Toggle - Only show when counted < expected */}
              {showMismatchToggle && (
                <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                  <Checkbox
                    id="record-mismatch"
                    checked={recordMismatchAsExpense}
                    onCheckedChange={(checked) => 
                      setRecordMismatchAsExpense(checked as boolean)
                    }
                  />
                  <label 
                    htmlFor="record-mismatch" 
                    className="text-sm cursor-pointer leading-tight"
                  >
                    Record ₹{cashDifference.toLocaleString("en-IN")} difference as expense (Others category)
                  </label>
                </div>
              )}

              {/* Auto Calculated Summary */}
              <div className="p-4 bg-secondary rounded-lg space-y-2">
                <p className="font-semibold mb-2">Summary (Auto-Calculated)</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Sales:</span>
                    <span className="font-semibold text-success">₹{dailySales.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expenses:</span>
                    <span className="font-semibold text-destructive">₹{totalExpensesForDate.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Cash:</span>
                    <span className="font-semibold">₹{expectedClosingCash.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Profit:</span>
                    <span className={`font-semibold ${dailyProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      ₹{dailyProfit.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any notes for today..."
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
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {editingDate ? "Update Entry" : "Save Entry"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold text-success">₹{totalSales.toLocaleString("en-IN")}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-destructive">₹{totalExpenses.toLocaleString("en-IN")}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ₹{totalProfit.toLocaleString("en-IN")}
                </p>
              </div>
              <IndianRupee className={`h-8 w-8 ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Month/Year Filter */}
      <Card>
        <CardContent className="pt-6">
          <MonthYearFilter onFilterChange={handleFilterChange} />
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8">Loading...</p>
          ) : entries && entries.length > 0 ? (
            <div className="max-h-[600px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Cash Sales</TableHead>
                    <TableHead className="text-right">Online Sales</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Closing Cash</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(entry.date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">₹{Number(entry.cash_sales).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">₹{Number(entry.online_sales).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap">₹{Number(entry.daily_sales).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right text-destructive whitespace-nowrap">₹{Number(entry.total_expenses).toLocaleString("en-IN")}</TableCell>
                      <TableCell className={`text-right font-semibold whitespace-nowrap ${Number(entry.daily_profit) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        ₹{Number(entry.daily_profit).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">₹{Number(entry.closing_cash).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-center whitespace-nowrap">{getStatusBadge(entry)}</TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(entry.date)}
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
                                <AlertDialogTitle>Delete Daily Entry?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will delete the cash flow entry for <strong>{format(new Date(entry.date), "dd MMM yyyy")}</strong>.
                                  <br /><br />
                                  <strong>Note:</strong> Expenses recorded for this day will NOT be deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(entry.date)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Entry
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
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No entries found for this date range</p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Entry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
