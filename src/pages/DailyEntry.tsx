import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDailyCashFlow, useSaveDailyEntry } from "@/hooks/useDailyCashFlow";
import { AlertBadge } from "@/components/AlertBadge";
import { Loader2, Save, Calendar, IndianRupee, Smartphone, Wallet } from "lucide-react";

export default function DailyEntry() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [yesterdayCash, setYesterdayCash] = useState("");
  const [cashSales, setCashSales] = useState("");
  const [onlineSales, setOnlineSales] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [notes, setNotes] = useState("");

  const { data: todayData, isLoading } = useDailyCashFlow(date);
  const { data: yesterdayData } = useDailyCashFlow(format(subDays(new Date(date), 1), "yyyy-MM-dd"));
  const saveMutation = useSaveDailyEntry();

  // Auto-fill from existing data
  useEffect(() => {
    if (todayData) {
      setYesterdayCash(todayData.yesterday_cash.toString());
      setCashSales(todayData.cash_sales.toString());
      setOnlineSales(todayData.online_sales.toString());
      setClosingCash(todayData.closing_cash.toString());
      setNotes(todayData.notes || "");
    } else {
      setCashSales("");
      setOnlineSales("");
      setClosingCash("");
      setNotes("");
      // Auto-fill yesterday's closing cash
      if (yesterdayData) {
        setYesterdayCash(yesterdayData.closing_cash.toString());
      } else {
        setYesterdayCash("0");
      }
    }
  }, [todayData, yesterdayData, date]);

  const parseNum = (val: string) => parseFloat(val) || 0;

  // Auto-calculated values
  const yesterdayCashNum = parseNum(yesterdayCash);
  const cashSalesNum = parseNum(cashSales);
  const onlineSalesNum = parseNum(onlineSales);
  const closingCashNum = parseNum(closingCash);
  const totalExpenses = todayData?.total_expenses || 0;
  const cashExpenses = todayData?.cash_expenses || 0;

  const expectedClosingCash = yesterdayCashNum + cashSalesNum - cashExpenses;
  const dailySales = closingCashNum + onlineSalesNum + totalExpenses - yesterdayCashNum;
  const dailyProfit = dailySales - totalExpenses;
  const cashMismatch = closingCashNum > 0 && Math.abs(closingCashNum - expectedClosingCash) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      date,
      yesterday_cash: yesterdayCashNum,
      cash_sales: cashSalesNum,
      online_sales: onlineSalesNum,
      closing_cash: closingCashNum,
      notes: notes || undefined,
    });
  };

  return (
    <div className="lg:ml-64 p-4 lg:p-6 space-y-6 safe-bottom">
      <h1 className="text-2xl font-bold text-foreground">Daily Entry</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Selection */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Inputs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
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
          </CardContent>
        </Card>

        {/* Cash Mismatch Alert */}
        {cashMismatch && (
          <AlertBadge
            type="warning"
            message={`Cash Mismatch! Expected: ₹${expectedClosingCash.toLocaleString("en-IN")} | Counted: ₹${closingCashNum.toLocaleString("en-IN")} | Diff: ₹${Math.abs(closingCashNum - expectedClosingCash).toLocaleString("en-IN")}`}
          />
        )}

        {/* Auto Calculated Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Summary (Auto-Calculated)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-secondary rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total Expenses</p>
              <p className="text-lg font-bold text-destructive">₹{totalExpenses.toLocaleString("en-IN")}</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Expected Cash</p>
              <p className="text-lg font-bold text-muted-foreground">₹{expectedClosingCash.toLocaleString("en-IN")}</p>
            </div>
            <div className="p-3 bg-success/10 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Daily Sales</p>
              <p className="text-lg font-bold text-success">₹{dailySales.toLocaleString("en-IN")}</p>
            </div>
            <div className={`p-3 rounded-lg text-center ${dailyProfit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
              <p className="text-xs text-muted-foreground">Daily Profit</p>
              <p className={`text-lg font-bold ${dailyProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                ₹{dailyProfit.toLocaleString("en-IN")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardContent className="pt-6">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes for today..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full action-btn"
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          Save Daily Entry
        </Button>
      </form>
    </div>
  );
}