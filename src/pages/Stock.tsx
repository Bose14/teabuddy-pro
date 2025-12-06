import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { useStock, useAddStock, useUpdateStock, useStockAlerts } from "@/hooks/useStock";
import { STOCK_CATEGORIES, STOCK_UNITS } from "@/lib/constants";
import { AlertBadge } from "@/components/AlertBadge";
import StockAnalytics from "@/components/StockAnalytics";
import { Loader2, Plus, Package, Minus, AlertTriangle, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function Stock() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [updateType, setUpdateType] = useState<"purchase" | "use">("purchase");
  const [updateQty, setUpdateQty] = useState("");

  // Add stock form
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [vendor, setVendor] = useState("");
  const [unit, setUnit] = useState("kg");
  const [openingStock, setOpeningStock] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [expiryDate, setExpiryDate] = useState("");

  const { data: stock, isLoading } = useStock();
  const { lowStockItems, expiringItems } = useStockAlerts();
  const addMutation = useAddStock();
  const updateMutation = useUpdateStock();

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !category) {
      toast.error("Please fill product name and category");
      return;
    }

    addMutation.mutate({
      product_name: productName,
      category,
      vendor: vendor || undefined,
      unit,
      opening_stock: parseFloat(openingStock) || 0,
      purchase_price: parseFloat(purchasePrice) || 0,
      selling_price: parseFloat(sellingPrice) || 0,
      low_stock_threshold: parseFloat(lowStockThreshold) || 10,
      expiry_date: expiryDate || undefined,
    }, {
      onSuccess: () => {
        setProductName("");
        setCategory("");
        setVendor("");
        setOpeningStock("");
        setPurchasePrice("");
        setSellingPrice("");
        setExpiryDate("");
        setShowAddDialog(false);
      }
    });
  };

  const handleUpdateStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock || !updateQty) {
      toast.error("Please enter quantity");
      return;
    }

    updateMutation.mutate({
      id: selectedStock,
      type: updateType,
      quantity: parseFloat(updateQty),
    }, {
      onSuccess: () => {
        setUpdateQty("");
        setShowUpdateDialog(false);
        setSelectedStock(null);
      }
    });
  };

  // Group stock by category
  const categories = [
    { name: "Tea/Coffee Products", items: stock?.filter(s => s.category === "Tea/Coffee Products") || [] },
    { name: "Malligai Raw Material", items: stock?.filter(s => s.category === "Malligai Raw Material") || [] },
    { name: "Vegetables", items: stock?.filter(s => s.category === "Vegetables") || [] },
    { name: "Cakes", items: stock?.filter(s => s.category === "Cakes") || [] },
    { name: "Biscuits", items: stock?.filter(s => s.category === "Biscuits") || [] },
    { name: "Ice cream", items: stock?.filter(s => s.category === "Ice cream") || [] },
    { name: "Juice", items: stock?.filter(s => s.category === "Juice") || [] },
    { name: "Gas Cylinders", items: stock?.filter(s => s.category === "Gas Cylinders") || [] },
    { name: "Others", items: stock?.filter(s => s.category === "Others") || [] },
  ];

  // Helper to check if category has low stock items
  const hasLowStockInCategory = (items: any[]) => {
    return items.some(item => item.closing_stock <= item.low_stock_threshold);
  };

  return (
    <div className="lg:ml-64 p-4 mt-16 lg:p-6 space-y-6 safe-bottom">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Stock Management</h1>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Stock Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tea/Coffee Products">Tea/Coffee Products</SelectItem>
                    <SelectItem value="Malligai Raw Material">Malligai Raw Material</SelectItem>
                    <SelectItem value="Vegetables">Vegetables</SelectItem>
                    <SelectItem value="Cakes">Cakes</SelectItem>
                    <SelectItem value="Biscuits">Biscuits</SelectItem>
                    <SelectItem value="Ice cream">Ice cream</SelectItem>
                    <SelectItem value="Juice">Juice</SelectItem>
                    <SelectItem value="Gas Cylinders">Gas Cylinders</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Product Name</Label>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., Tea Powder"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Unit</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STOCK_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Opening Stock</Label>
                  <Input
                    type="number"
                    value={openingStock}
                    onChange={(e) => setOpeningStock(e.target.value)}
                    placeholder="0"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <Label>Vendor (Optional)</Label>
                <Input
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="Supplier name"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Purchase Price (₹)</Label>
                  <Input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="0"
                    className="input-field"
                  />
                </div>
                <div>
                  <Label>Selling Price (₹)</Label>
                  <Input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Low Stock Alert</Label>
                  <Input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    placeholder="10"
                    className="input-field"
                  />
                </div>
                <div>
                  <Label>Expiry Date (Optional)</Label>
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={addMutation.isPending}>
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Stock Item
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage Analytics
          </TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Alerts */}
          {(lowStockItems.length > 0 || expiringItems.length > 0) && (
            <div className="space-y-2">
              {lowStockItems.length > 0 && (
                <AlertBadge type="error" message={`Low stock: ${lowStockItems.map(s => s.product_name).join(", ")}`} />
              )}
              {expiringItems.length > 0 && (
                <AlertBadge type="warning" message={`Expiring soon: ${expiringItems.map(s => s.product_name).join(", ")}`} />
              )}
            </div>
          )}

          {/* Stock Categories Accordion */}
          <Card>
            <CardContent className="pt-6">
              <Accordion type="multiple" className="w-full">
                {categories.map((category) => (
                  <AccordionItem key={category.name} value={category.name}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          <span className="font-semibold">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasLowStockInCategory(category.items) && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Low Stock
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {category.items.length} {category.items.length === 1 ? 'item' : 'items'}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {category.items.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No items in this category</p>
                      ) : (
                        <div className="space-y-2 pt-2">
                          {category.items.map((item) => (
                            <StockItem
                              key={item.id}
                              item={item}
                              onUpdate={(type) => {
                                setSelectedStock(item.id);
                                setUpdateType(type);
                                setShowUpdateDialog(true);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <StockAnalytics />
        </TabsContent>
      </Tabs>

      {/* Update Stock Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {updateType === "purchase" ? "Add Stock" : "Use/Sell Stock"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateStock} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={updateType === "purchase" ? "default" : "outline"}
                onClick={() => setUpdateType("purchase")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Purchase
              </Button>
              <Button
                type="button"
                variant={updateType === "use" ? "default" : "outline"}
                onClick={() => setUpdateType("use")}
              >
                <Minus className="h-4 w-4 mr-2" />
                Use/Sell
              </Button>
            </div>

            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={updateQty}
                onChange={(e) => setUpdateQty(e.target.value)}
                placeholder="0"
                className="input-field"
              />
            </div>

            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Stock
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StockItem({ 
  item, 
  onUpdate 
}: { 
  item: any; 
  onUpdate: (type: "purchase" | "use") => void;
}) {
  const isLowStock = item.closing_stock <= item.low_stock_threshold;
  
  return (
    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{item.product_name}</p>
          {isLowStock && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Low
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {item.vendor && `${item.vendor} • `}
          Open: {item.opening_stock} | In: {item.purchased_qty} | Out: {item.used_sold_qty}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right mr-2">
          <p className="font-bold text-lg">{item.closing_stock}</p>
          <p className="text-xs text-muted-foreground">{item.unit}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => onUpdate("purchase")}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => onUpdate("use")}>
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
