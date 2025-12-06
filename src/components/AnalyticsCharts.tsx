import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useDailyCashFlowRange } from "@/hooks/useDailyCashFlow";
import { format, subDays, startOfMonth } from "date-fns";

export function AnalyticsCharts() {
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const last7Days = format(subDays(new Date(), 6), "yyyy-MM-dd");

  const { data: weekData } = useDailyCashFlowRange(last7Days, today);
  const { data: monthData } = useDailyCashFlowRange(monthStart, today);

  // Prepare data for Sales vs Expenses chart (last 7 days)
  const salesVsExpensesData = weekData?.map((item) => ({
    date: format(new Date(item.date), "MMM dd"),
    sales: Number(item.daily_sales),
    expenses: Number(item.total_expenses),
  })).reverse() || [];

  // Prepare data for Profit Trend chart (this month)
  const profitTrendData = monthData?.map((item) => ({
    date: format(new Date(item.date), "MMM dd"),
    profit: Number(item.daily_profit),
  })).reverse() || [];

  // Calculate totals for Cash vs Online pie chart (this month)
  const totalCashSales = monthData?.reduce((sum, item) => sum + Number(item.cash_sales), 0) || 0;
  const totalOnlineSales = monthData?.reduce((sum, item) => sum + Number(item.online_sales), 0) || 0;

  const cashVsOnlineData = [
    { name: "Cash Sales", value: totalCashSales },
    { name: "Online Sales", value: totalOnlineSales },
  ];

  const COLORS = {
    sales: "#10b981", // green
    expenses: "#ef4444", // red
    profit: "#3b82f6", // blue
    cash: "#f59e0b", // amber
    online: "#8b5cf6", // purple
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sales vs Expenses - Last 7 Days */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sales vs Expenses (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesVsExpensesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `₹${value.toFixed(2)}`}
            />
            <Legend />
            <Bar dataKey="sales" fill={COLORS.sales} name="Sales" />
            <Bar dataKey="expenses" fill={COLORS.expenses} name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Profit Trend - This Month */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Profit Trend (This Month)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={profitTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `₹${value.toFixed(2)}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke={COLORS.profit} 
              strokeWidth={2}
              name="Daily Profit"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Cash vs Online - This Month */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Cash vs Online Sales (This Month)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={cashVsOnlineData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {cashVsOnlineData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === 0 ? COLORS.cash : COLORS.online} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `₹${value.toFixed(2)}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Weekly Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Weekly Summary</h3>
        <div className="space-y-4">
          {weekData?.slice().reverse().map((item) => {
            const profit = Number(item.daily_profit);
            const isProfitable = profit >= 0;
            return (
              <div key={item.date} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{format(new Date(item.date), "EEE, MMM dd")}</p>
                  <p className="text-sm text-muted-foreground">
                    Sales: ₹{Number(item.daily_sales).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${isProfitable ? 'text-success' : 'text-destructive'}`}>
                    {isProfitable ? '+' : ''}₹{profit.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isProfitable ? 'Profit' : 'Loss'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
