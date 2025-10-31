import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "@/components/StatsCard";
import { TrendingUp, TrendingDown, Wallet, Milk } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { Card } from "@/components/ui/card";

export default function Dashboard() {
  const { data: salesData } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: expensesData } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: milkData } = useQuery({
    queryKey: ["milk_usage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("milk_usage")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const calculateStats = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

    const todaySales = salesData?.filter((s) => s.date === today) || [];
    const todayExpenses = expensesData?.filter((e) => e.date === today) || [];

    const monthSales = salesData?.filter((s) => s.date >= monthStart) || [];
    const monthExpenses = expensesData?.filter((e) => e.date >= monthStart) || [];

    const todaySalesTotal = todaySales.reduce((sum, s) => sum + Number(s.amount), 0);
    const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const todayProfit = todaySalesTotal - todayExpensesTotal;

    const monthSalesTotal = monthSales.reduce((sum, s) => sum + Number(s.amount), 0);
    const monthExpensesTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const monthProfit = monthSalesTotal - monthExpensesTotal;

    const totalSales = salesData?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
    const totalExpenses = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const totalProfit = totalSales - totalExpenses;

    const cashInHand = 
      (salesData?.filter(s => s.payment_mode === 'Cash').reduce((sum, s) => sum + Number(s.amount), 0) || 0) -
      (expensesData?.filter(e => e.mode === 'Cash').reduce((sum, e) => sum + Number(e.amount), 0) || 0);

    const gpay = 
      (salesData?.filter(s => s.payment_mode === 'GPay').reduce((sum, s) => sum + Number(s.amount), 0) || 0) -
      (expensesData?.filter(e => e.mode === 'GPay').reduce((sum, e) => sum + Number(e.amount), 0) || 0);

    const phonePe = 
      (salesData?.filter(s => s.payment_mode === 'PhonePe').reduce((sum, s) => sum + Number(s.amount), 0) || 0) -
      (expensesData?.filter(e => e.mode === 'PhonePe').reduce((sum, e) => sum + Number(e.amount), 0) || 0);

    const todayMilk = milkData?.find(m => m.date === today);
    const monthMilk = milkData?.filter(m => m.date >= monthStart) || [];
    const monthMilkPurchased = monthMilk.reduce((sum, m) => sum + Number(m.purchased), 0);
    const monthMilkUsed = monthMilk.reduce((sum, m) => sum + Number(m.used), 0);

    return {
      today: { sales: todaySalesTotal, expenses: todayExpensesTotal, profit: todayProfit },
      month: { sales: monthSalesTotal, expenses: monthExpensesTotal, profit: monthProfit },
      total: { sales: totalSales, expenses: totalExpenses, profit: totalProfit },
      payment: { cash: cashInHand, gpay, phonePe, online: gpay + phonePe },
      milk: {
        todayPurchased: todayMilk ? Number(todayMilk.purchased) : 0,
        todayUsed: todayMilk ? Number(todayMilk.used) : 0,
        remaining: todayMilk ? Number(todayMilk.remaining) : 0,
        monthPurchased: monthMilkPurchased,
        monthUsed: monthMilkUsed,
      },
    };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-background pt-20 pb-6 px-4 md:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Today Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Today</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Total Sales"
              value={`₹${stats.today.sales.toFixed(2)}`}
              icon={TrendingUp}
              variant="sales"
            />
            <StatsCard
              title="Total Expenses"
              value={`₹${stats.today.expenses.toFixed(2)}`}
              icon={TrendingDown}
              variant="expense"
            />
            <StatsCard
              title="Profit"
              value={`₹${stats.today.profit.toFixed(2)}`}
              icon={Wallet}
              variant="profit"
            />
          </div>
        </section>

        {/* Month Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">This Month</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Monthly Sales"
              value={`₹${stats.month.sales.toFixed(2)}`}
              icon={TrendingUp}
              variant="sales"
            />
            <StatsCard
              title="Monthly Expenses"
              value={`₹${stats.month.expenses.toFixed(2)}`}
              icon={TrendingDown}
              variant="expense"
            />
            <StatsCard
              title="Monthly Profit"
              value={`₹${stats.month.profit.toFixed(2)}`}
              icon={Wallet}
              variant="profit"
            />
          </div>
        </section>

        {/* Overall Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Overall Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Total Sales"
              value={`₹${stats.total.sales.toFixed(2)}`}
              icon={TrendingUp}
              variant="sales"
            />
            <StatsCard
              title="Total Expenses"
              value={`₹${stats.total.expenses.toFixed(2)}`}
              icon={TrendingDown}
              variant="expense"
            />
            <StatsCard
              title="Total Profit"
              value={`₹${stats.total.profit.toFixed(2)}`}
              icon={Wallet}
              variant="profit"
            />
          </div>
        </section>

        {/* Payment Summary */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Payment Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card p-6 rounded-xl border-2">
              <p className="text-sm text-muted-foreground font-medium">Cash in Hand</p>
              <p className="text-2xl font-bold mt-2">₹{stats.payment.cash.toFixed(2)}</p>
            </div>
            <div className="bg-card p-6 rounded-xl border-2">
              <p className="text-sm text-muted-foreground font-medium">GPay</p>
              <p className="text-2xl font-bold mt-2">₹{stats.payment.gpay.toFixed(2)}</p>
            </div>
            <div className="bg-card p-6 rounded-xl border-2">
              <p className="text-sm text-muted-foreground font-medium">PhonePe</p>
              <p className="text-2xl font-bold mt-2">₹{stats.payment.phonePe.toFixed(2)}</p>
            </div>
            <div className="bg-card p-6 rounded-xl border-2">
              <p className="text-sm text-muted-foreground font-medium">Total Online</p>
              <p className="text-2xl font-bold mt-2">₹{stats.payment.online.toFixed(2)}</p>
            </div>
          </div>
        </section>

        {/* Milk Summary */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Milk className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Milk Summary</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4 border-2">
              <p className="text-xs text-muted-foreground font-medium">Today Purchased</p>
              <p className="text-xl font-bold mt-1 text-primary">{stats.milk.todayPurchased.toFixed(2)} L</p>
            </Card>
            <Card className="p-4 border-2">
              <p className="text-xs text-muted-foreground font-medium">Today Used</p>
              <p className="text-xl font-bold mt-1 text-destructive">{stats.milk.todayUsed.toFixed(2)} L</p>
            </Card>
            <Card className="p-4 border-2">
              <p className="text-xs text-muted-foreground font-medium">Remaining</p>
              <p className="text-xl font-bold mt-1 text-success">{stats.milk.remaining.toFixed(2)} L</p>
            </Card>
            <Card className="p-4 border-2">
              <p className="text-xs text-muted-foreground font-medium">Month Purchased</p>
              <p className="text-xl font-bold mt-1">{stats.milk.monthPurchased.toFixed(2)} L</p>
            </Card>
            <Card className="p-4 border-2">
              <p className="text-xs text-muted-foreground font-medium">Month Used</p>
              <p className="text-xl font-bold mt-1">{stats.milk.monthUsed.toFixed(2)} L</p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
