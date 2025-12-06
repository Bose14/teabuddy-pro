# Stock Management Enhancement - Implementation Guide

## Overview

This guide explains how to implement Phase 1 enhancements to TeaBuddy Pro's stock management system.

## What's Been Enhanced

### 1. **New Database Tables**
- `suppliers` - Proper vendor/supplier management
- `stock_ledger` - Immutable audit trail of all stock movements
- `stock_alerts` - Persistent stock alerts (low stock, expiry warnings)
- `price_history` - Track price changes over time

### 2. **Enhanced Stock Table**
New columns added:
- `sku` - Unique product code (auto-generated if not provided)
- `supplier_id` - Reference to suppliers table
- `barcode` - For barcode scanning (future feature)
- `min_stock_level` - Minimum acceptable stock
- `max_stock_level` - Maximum stock capacity (optional)

### 3. **Enhanced Stock Transactions**
New columns for detailed tracking:
- `supplier_id` - Who supplied this stock
- `unit_price` - Price per unit
- `total_value` - Total transaction value
- `batch_number` - Batch/lot tracking
- `expiry_date` - Batch-specific expiry (for items with multiple batches)
- `invoice_number` - Reference number

### 4. **Database Triggers & Functions**
- Auto-generate SKU if not provided
- Automatically create ledger entries on stock transactions
- Auto-create/clear stock alerts based on thresholds
- Track price changes automatically
- Function to check expiring items

## Implementation Steps

### Step 1: Apply Database Migration

Since you're using a remote Supabase instance (rzmqwpumyttwbobzptmg.supabase.co), you need to apply the migration through Supabase Dashboard:

#### Option A: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**: https://supabase.com/dashboard/project/rzmqwpumyttwbobzptmg

2. **Navigate to SQL Editor** (left sidebar)

3. **Create a new query** and paste the entire contents of:
   ```
   supabase/migrations/20251206183000_enhanced_stock_system.sql
   ```

4. **Run the migration** - Click "Run" button

5. **Verify tables created**:
   - Go to "Table Editor" in left sidebar
   - You should see new tables: `suppliers`, `stock_ledger`, `stock_alerts`, `price_history`
   - Check `stock` table has new columns: `sku`, `supplier_id`, `barcode`, etc.

#### Option B: Using Supabase CLI (If you have it configured)

```bash
# Link your project
npx supabase link --project-ref rzmqwpumyttwbobzptmg

# Push migration
npx supabase db push
```

### Step 2: Regenerate TypeScript Types

After applying the migration, regenerate your TypeScript types:

```bash
# Generate types from your remote database
npx supabase gen types typescript --project-id rzmqwpumyttwbobzptmg > src/integrations/supabase/types.ts
```

This will update `src/integrations/supabase/types.ts` with the new table definitions, which will fix all the TypeScript errors in `useStockEnhanced.ts`.

### Step 3: Test the Migration

Once migration is applied and types regenerated, test basic operations:

1. **Test in SQL Editor**:
```sql
-- Check suppliers table
SELECT * FROM suppliers LIMIT 1;

-- Check stock alerts
SELECT * FROM stock_alerts WHERE is_active = true;

-- Check ledger
SELECT * FROM stock_ledger LIMIT 5;

-- Test the view
SELECT * FROM stock_summary LIMIT 5;
```

2. **Test SKU auto-generation**:
```sql
-- Insert a stock item without SKU
INSERT INTO stock (product_name, category, unit, opening_stock, purchase_price, selling_price)
VALUES ('Test Tea', 'Raw Materials', 'kg', 10, 100, 150);

-- Check that SKU was auto-generated
SELECT sku, product_name FROM stock WHERE product_name = 'Test Tea';
```

### Step 4: Update UI Components

After migration is successful, you can start using the enhanced hooks:

1. **Import enhanced hooks** in your components:
```typescript
import { useSuppliers, useAddSupplier } from "@/hooks/useStockEnhanced";
import { useStockAlerts, useAcknowledgeAlert } from "@/hooks/useStockEnhanced";
```

2. **The current Stock.tsx will continue to work** using the existing hooks

3. **Gradually migrate to enhanced features** as needed

## New Features Available

### 1. Supplier Management

```typescript
import { useSuppliers, useAddSupplier } from "@/hooks/useStockEnhanced";

function SupplierManager() {
  const { data: suppliers } = useSuppliers();
  const addSupplier = useAddSupplier();
  
  const handleAdd = () => {
    addSupplier.mutate({
      name: "ABC Suppliers",
      contact_person: "John Doe",
      phone: "9876543210",
      email: "john@abc.com",
      address: "123 Main St"
    });
  };
}
```

### 2. Stock Alerts

```typescript
import { useStockAlerts, useAcknowledgeAlert } from "@/hooks/useStockEnhanced";

function AlertsDisplay() {
  const { data: alerts } = useStockAlerts();
  const acknowledge = useAcknowledgeAlert();
  
  // Alerts are automatically created by database triggers
  // when stock levels change
}
```

### 3. Stock Ledger (Audit Trail)

```typescript
import { useStockLedger } from "@/hooks/useStockEnhanced";

function StockHistory({ stockId }) {
  const { data: ledger } = useStockLedger(stockId);
  
  // Shows complete history of all stock movements
  // IN/OUT transactions with before/after quantities
}
```

### 4. Stock Valuation

```typescript
import { useStockValuation } from "@/hooks/useStockEnhanced";

function StockValue() {
  const { data: valuation } = useStockValuation();
  
  // Shows:
  // - Total purchase value of inventory
  // - Total selling value of inventory  
  // - Potential profit
  // - Profit margin percentage
  // - Breakdown by category
}
```

### 5. Price History

```typescript
import { usePriceHistory } from "@/hooks/useStockEnhanced";

function PriceTracker({ stockId }) {
  const { data: history } = usePriceHistory(stockId);
  
  // Automatically tracks whenever purchase_price or 
  // selling_price changes
}
```

## Benefits After Migration

1. **Automatic SKU Generation** - No need to manually create product codes
2. **Complete Audit Trail** - Every stock change is logged with before/after quantities
3. **Persistent Alerts** - Alerts stored in database, can be acknowledged
4. **Supplier Tracking** - Proper supplier management instead of text fields
5. **Price History** - Track cost/selling price changes over time
6. **Better Stock Analysis** - Valuation reports, movement analysis
7. **Batch Tracking** - Track items by batch with different expiry dates
8. **Invoice References** - Link transactions to invoice numbers

## Troubleshooting

### Error: Table already exists
If you get "table already exists" errors, the migration has IF NOT EXISTS clauses, so it's safe to run.

### Error: Column already exists
Same as above - migration uses IF NOT EXISTS for column additions.

### TypeScript errors persist after migration
Make sure you regenerated the types:
```bash
npx supabase gen types typescript --project-id rzmqwpumyttwbobzptmg > src/integrations/supabase/types.ts
```

### Migration fails midway
Check error message, fix the SQL, and try again. The migration uses transactions where possible.

## Next Steps After Implementation

Once the migration is successful:

1. **Create Supplier Management Page** - Add/edit suppliers
2. **Enhanced Stock Page** - Show SKU, supplier info, alerts
3. **Stock Valuation Dashboard** - Display inventory value
4. **Stock History Viewer** - Show ledger entries
5. **Alert Management** - Display and acknowledge alerts

## Files Created

1. `supabase/migrations/20251206183000_enhanced_stock_system.sql` - Database migration
2. `src/types/stock.ts` - TypeScript type definitions
3. `src/hooks/useStockEnhanced.ts` - Enhanced hooks (will work after migration)
4. `STOCK_ENHANCEMENT_IMPLEMENTATION_GUIDE.md` - This guide

## Backward Compatibility

The existing `useStock.ts` hooks will continue to work. The migration:
- Adds new columns with defaults
- Doesn't remove or rename existing columns
- Adds new tables without affecting existing ones
- Uses triggers that don't break current functionality

You can migrate to enhanced features gradually without breaking existing code.
