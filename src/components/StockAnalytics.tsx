import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, TrendingUp, Calendar, BarChart3, Package, Search } from "lucide-react";
import {
  useUsageStats,
  useProductUsageSummary,
  useCategoryUsageStats,
  useProductUsageTrend,
} from "@/hooks/useStockAnalytics";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function StockAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [selectedProductForTrend, setSelectedProductForTrend] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: usageStats, isLoading: loadingUsage } = useUsageStats(selectedPeriod);
  const { data: productSummary, isLoading: loadingSummary } = useProductUsageSummary();
  const { data: categoryStats, isLoading: loadingCategory } = useCategoryUsageStats(selectedPeriod);

  // Filter and limit products
  const filteredUsageStats = usageStats?.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const displayedUsageStats = showAllProducts 
    ? filteredUsageStats 
    : filteredUsageStats.slice(0, 10);

  const filteredProductSummary = productSummary?.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const displayedProductSummary = showAllProducts 
    ? filteredProductSummary 
    : filteredProductSummary.slice(0, 10);

  // Calculate totals from filtered data
  const totalUsageCost = filteredUsageStats.reduce((sum, item) => sum + item.cost, 0) || 0;
  const totalItems = filteredUsageStats.length || 0;

  // Get unique categories
  const categories = Array.from(new Set(productSummary?.map(p => p.category) || []));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usage Cost</p>
                <p className="text-2xl font-bold mt-1">₹{totalUsageCost.toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{selectedPeriod}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Products Used</p>
                <p className="text-2xl font-bold mt-1">{totalItems}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{selectedPeriod}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories Active</p>
                <p className="text-2xl font-bold mt-1">{categoryStats?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{selectedPeriod}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Selector */}
      <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Main Content Tabs */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Usage Details</TabsTrigger>
          <TabsTrigger value="summary">Product Summary</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        {/* Usage Details Tab */}
        <TabsContent value="usage" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!showAllProducts && filteredUsageStats.length > 10 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAllProducts(true)}
                    className="whitespace-nowrap"
                  >
                    Show All ({filteredUsageStats.length})
                  </Button>
                )}
                {showAllProducts && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAllProducts(false)}
                    className="whitespace-nowrap"
                  >
                    Show Top 10
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Usage Details - {selectedPeriod === 'today' ? 'Today' : selectedPeriod === 'week' ? 'This Week' : 'This Month'}
                {!showAllProducts && <Badge variant="secondary">Top 10</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsage ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : displayedUsageStats.length > 0 ? (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Used</TableHead>
                        <TableHead className="text-right">Purchased</TableHead>
                        <TableHead className="text-right">Transactions</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedUsageStats.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-destructive font-medium">
                            {item.total_used.toFixed(2)} {item.unit}
                          </TableCell>
                          <TableCell className="text-right text-success font-medium">
                            {item.total_purchased.toFixed(2)} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">{item.transaction_count}</TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{item.cost.toLocaleString("en-IN")}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={5}>Total</TableCell>
                        <TableCell className="text-right">
                          ₹{totalUsageCost.toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No usage data for this period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!showAllProducts && filteredProductSummary.length > 10 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAllProducts(true)}
                    className="whitespace-nowrap"
                  >
                    Show All ({filteredProductSummary.length})
                  </Button>
                )}
                {showAllProducts && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAllProducts(false)}
                    className="whitespace-nowrap"
                  >
                    Show Top 10
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Usage Summary
                {!showAllProducts && <Badge variant="secondary">Top 10</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : displayedProductSummary.length > 0 ? (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Today</TableHead>
                        <TableHead className="text-right">This Week</TableHead>
                        <TableHead className="text-right">This Month</TableHead>
                        <TableHead className="text-right">Overall</TableHead>
                        <TableHead className="text-right">Avg/Day</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedProductSummary.map((item) => (
                        <TableRow 
                          key={item.product_id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedProductForTrend(item.product_id)}
                        >
                          <TableCell className="font-medium">
                            <div>
                              {item.product_name}
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.today_used.toFixed(1)} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.week_used.toFixed(1)} {item.unit}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.month_used.toFixed(1)} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.overall_used.toFixed(1)} {item.unit}
                          </TableCell>
                          <TableCell className="text-right text-info">
                            {item.average_daily.toFixed(1)} {item.unit}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{item.total_cost.toLocaleString("en-IN")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No product usage data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Trend Chart */}
          {selectedProductForTrend && (
            <ProductTrendChart productId={selectedProductForTrend} onClose={() => setSelectedProductForTrend(null)} />
          )}
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          {/* Category Usage Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Category-wise Usage Cost - {selectedPeriod === 'today' ? 'Today' : selectedPeriod === 'week' ? 'This Week' : 'This Month'}</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCategory ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : categoryStats && categoryStats.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryStats}
                        dataKey="cost"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.category}: ₹${entry.cost.toFixed(0)}`}
                      >
                        {categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No category data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Most Used Products - {selectedPeriod === 'today' ? 'Today' : selectedPeriod === 'week' ? 'This Week' : 'This Month'}</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsage ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : usageStats && usageStats.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usageStats.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`} />
                      <Legend />
                      <Bar dataKey="cost" fill="#3b82f6" name="Cost (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No usage data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component to show trend for a specific product
function ProductTrendChart({ productId, onClose }: { productId: string; onClose: () => void }) {
  const { data: trendData, isLoading } = useProductUsageTrend(productId, 7);
  const { data: summary } = useProductUsageSummary();
  
  const product = summary?.find(p => p.product_id === productId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            7-Day Usage Trend: {product?.product_name}
          </CardTitle>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : trendData && trendData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                  formatter={(value: number) => [`${value.toFixed(2)} ${product?.unit}`, 'Used']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="quantity" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name={`Usage (${product?.unit})`}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No trend data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
