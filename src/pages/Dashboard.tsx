import { useState } from "react";
import { StatsCard } from "@/components/StatsCard";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardStats } from "@/hooks/useDailyCashFlow";
import { AlertBadge } from "@/components/AlertBadge";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";

type TimePeriod = "today" | "weekly" | "monthly" | "overall";

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("today");
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="lg:ml-64 p-4 mt-16 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="lg:ml-64 p-4 mt-16 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <AlertBadge 
            type="info" 
            message="No data available. Start by adding a daily entry!" 
          />
        </div>
      </div>
    );
  }

  // Get current period data
  const getCurrentData = () => {
    switch (selectedPeriod) {
      case "today":
        return stats.today || { sales: 0, expenses: 0, profit: 0 };
      case "weekly":
        return stats.weekly;
      case "monthly":
        return stats.monthly;
      case "overall":
        return stats.overall;
    }
  };

  const currentData = getCurrentData();
  const periodLabel = {
    today: "Today",
    weekly: "This Week",
    monthly: "This Month",
    overall: "Overall",
  }[selectedPeriod];

  return (
    <div className="lg:ml-64 p-4 mt-16 lg:p-6 space-y-6 safe-bottom">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Period Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          
          <div className="w-full sm:w-64">
            <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as TimePeriod)}>
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">📅 Today</SelectItem>
                <SelectItem value="weekly">📊 This Week</SelectItem>
                <SelectItem value="monthly">📈 This Month</SelectItem>
                <SelectItem value="overall">🌍 Overall</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Statistics Cards */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-muted-foreground">{periodLabel} Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Sales"
              value={`₹${currentData.sales.toLocaleString("en-IN")}`}
              icon={TrendingUp}
              variant="sales"
            />
            <StatsCard
              title="Expenses"
              value={`₹${currentData.expenses.toLocaleString("en-IN")}`}
              icon={TrendingDown}
              variant="expense"
            />
            <StatsCard
              title="Profit"
              value={`₹${currentData.profit.toLocaleString("en-IN")}`}
              icon={Wallet}
              variant="profit"
            />
          </div>
        </section>

        {/* Today's Detailed Breakdown - Only show when Today is selected */}
        {selectedPeriod === "today" && stats.today && (
          <section>
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Today's Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-2 border-success/20">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">💵 Cash Sales</p>
                    <p className="text-2xl font-bold text-success">
                      ₹{stats.today.cashSales.toLocaleString("en-IN")}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-info/20">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">📱 Online Sales</p>
                    <p className="text-2xl font-bold text-info">
                      ₹{stats.today.onlineSales.toLocaleString("en-IN")}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">💰 Closing Cash</p>
                    <p className="text-2xl font-bold">
                      ₹{stats.today.closingCash.toLocaleString("en-IN")}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">🎯 Expected Cash</p>
                    <p className="text-2xl font-bold text-muted-foreground">
                      ₹{stats.today.expectedCash.toLocaleString("en-IN")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Cash Mismatch Alert */}
            {stats.today.cashMismatch && (
              <div className="mt-4">
                <AlertBadge 
                  type="warning" 
                  message={`⚠️ Cash mismatch detected! Expected: ₹${stats.today.expectedCash.toLocaleString("en-IN")} | Actual: ₹${stats.today.closingCash.toLocaleString("en-IN")}`} 
                />
              </div>
            )}
          </section>
        )}

        {/* Period Summary Breakdown - Show for Week/Month/Overall */}
        {selectedPeriod !== "today" && (
          <section>
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground">{periodLabel} Breakdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <Card className="border-2 border-success/20">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">💵 Cash Sales</p>
                    <p className="text-2xl font-bold text-success">
                      ₹{('cashSales' in currentData ? currentData.cashSales : 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-info/20">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">📱 Online Sales</p>
                    <p className="text-2xl font-bold text-info">
                      ₹{('onlineSales' in currentData ? currentData.onlineSales : 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* No Data Message for Today */}
        {selectedPeriod === "today" && !stats.today && (
          <AlertBadge 
            type="info" 
            message="No data for today yet. Go to Daily Entry to add today's cash flow." 
          />
        )}

        {/* Analytics Charts */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Analytics</h2>
          <AnalyticsCharts />
        </section>
      </div>
    </div>
  );
}
