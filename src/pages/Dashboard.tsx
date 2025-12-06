import { StatsCard } from "@/components/StatsCard";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/useDailyCashFlow";
import { AlertBadge } from "@/components/AlertBadge";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-6 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-6 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <AlertBadge 
            type="info" 
            message="No data available. Start by adding a daily entry!" 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-6 px-4 md:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Daily Section - Most Important */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Today's Summary</h2>
          {stats.today ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              
              {/* Today's Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 border-2">
                  <p className="text-xs text-muted-foreground font-medium">Cash Sales</p>
                  <p className="text-xl font-bold mt-1 text-success">₹{stats.today.cashSales.toFixed(2)}</p>
                </Card>
                <Card className="p-4 border-2">
                  <p className="text-xs text-muted-foreground font-medium">Online Sales</p>
                  <p className="text-xl font-bold mt-1 text-info">₹{stats.today.onlineSales.toFixed(2)}</p>
                </Card>
                <Card className="p-4 border-2">
                  <p className="text-xs text-muted-foreground font-medium">Closing Cash</p>
                  <p className="text-xl font-bold mt-1">₹{stats.today.closingCash.toFixed(2)}</p>
                </Card>
                <Card className="p-4 border-2">
                  <p className="text-xs text-muted-foreground font-medium">Expected Cash</p>
                  <p className="text-xl font-bold mt-1 text-muted-foreground">₹{stats.today.expectedCash.toFixed(2)}</p>
                </Card>
              </div>
              {stats.today.cashMismatch && (
                <div className="mt-4">
                  <AlertBadge 
                    type="warning" 
                    message={`Cash mismatch! Expected: ₹${stats.today.expectedCash.toFixed(2)} | Actual: ₹${stats.today.closingCash.toFixed(2)}`} 
                  />
                </div>
              )}
            </>
          ) : (
            <AlertBadge 
              type="info" 
              message="No data for today yet. Go to Daily Entry to add today's cash flow." 
            />
          )}
        </section>

        {/* Weekly Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">This Week</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Weekly Sales"
              value={`₹${stats.weekly.sales.toFixed(2)}`}
              icon={TrendingUp}
              variant="sales"
            />
            <StatsCard
              title="Weekly Expenses"
              value={`₹${stats.weekly.expenses.toFixed(2)}`}
              icon={TrendingDown}
              variant="expense"
            />
            <StatsCard
              title="Weekly Profit"
              value={`₹${stats.weekly.profit.toFixed(2)}`}
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
              value={`₹${stats.monthly.sales.toFixed(2)}`}
              icon={TrendingUp}
              variant="sales"
            />
            <StatsCard
              title="Monthly Expenses"
              value={`₹${stats.monthly.expenses.toFixed(2)}`}
              icon={TrendingDown}
              variant="expense"
            />
            <StatsCard
              title="Monthly Profit"
              value={`₹${stats.monthly.profit.toFixed(2)}`}
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
              value={`₹${stats.overall.sales.toFixed(2)}`}
              icon={TrendingUp}
              variant="sales"
            />
            <StatsCard
              title="Total Expenses"
              value={`₹${stats.overall.expenses.toFixed(2)}`}
              icon={TrendingDown}
              variant="expense"
            />
            <StatsCard
              title="Total Profit"
              value={`₹${stats.overall.profit.toFixed(2)}`}
              icon={Wallet}
              variant="profit"
            />
          </div>
        </section>


        {/* Analytics Charts */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Analytics</h2>
          <AnalyticsCharts />
        </section>
      </div>
    </div>
  );
}
