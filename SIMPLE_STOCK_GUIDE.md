# Stock Management - Simple Enhancements

## Overview

I've enhanced your TeaBuddy Pro stock management to support **4 categories** as per your requirements, along with useful vendor analysis features.

## What's Changed

### 1. ✅ 4 Stock Categories

Your stock system now supports exactly the 4 categories you specified:

1. **Raw Materials** - Milk, Tea Powder, Coffee Powder, Sugar, Oil, Flour, Vegetables
2. **Resale Items** - Biscuits (multiple types), Cakes, Ice Cream
3. **Beverage** - Cool Drinks (Pepsi, Coca Cola, Sprite), Juices
4. **Snack** - Chips, Chocolates, Namkeen

### 2. ✅ Stock Columns (As Per Your Requirement)

The stock table has exactly these columns:
- `id` – Unique stock item ID
- `product_name` – Product name
- `category` – One of 4 categories
- `vendor` – Supplier name (text field)
- `unit` – Unit of measurement (kg, liters, pieces, packets, etc.)
- `opening_stock` – Stock at start of day
- `purchased_qty` – Purchased today
- `used_sold_qty` – Used/sold today
- `closing_stock` – Auto-calculated: opening + purchased - used/sold
- `purchase_price` – Cost price per unit
- `selling_price` – Selling price per unit
- `low_stock_thr` – Low stock alert threshold
- `expiry_date` – Expiry date (optional)
- `created_at` – When added
- `updated_at` – Last updated

### 3. ✅ Simple Formula Working

The system uses your exact formula:
```
Closing Stock = Opening Stock + Purchased - Used/Sold
```

This is automatically calculated when you add/use stock.

## New Features (Optional Migration)

If you apply the optional migration (`supabase/migrations/20251206190000_simple_stock_enhancements.sql`), you'll get:

### 1. Vendor-wise Spending Analysis

See which vendor you're spending most on:
```sql
SELECT * FROM get_vendor_spending('2024-12-01', '2024-12-31');
```

Returns:
- Vendor name
- Total purchase value
- Number of items purchased
- Average purchase price

### 2. Stock Valuation by Category

See inventory value by category:
```sql
SELECT * FROM get_stock_valuation();
```

Returns for each category:
- Total items
- Total quantity
- Purchase value (what you paid)
- Selling value (what you can sell for)
- Potential profit

### 3. Low Stock Alerts

Quick function to find all low stock items:
```sql
SELECT * FROM get_low_stock_items();
```

### 4. Expiring Items

Find items expiring within X days:
```sql
SELECT * FROM get_expiring_items(7);  -- Items expiring in next 7 days
```

## Implementation

### Current Status

✅ **Already Working:**
- 4 categories in dropdown
- All 4 categories display on Stock page
- Constants updated with sample products

### Optional Enhancement (5 minutes)

If you want vendor analysis and stock valuation:

1. Go to: https://supabase.com/dashboard/project/rzmqwpumyttwbobzptmg/sql/new

2. Copy entire contents of `supabase/migrations/20251206190000_simple_stock_enhancements.sql`

3. Paste and click "Run"

That's it! The functions will be available for reports.

## Using the System

### Adding Stock Items

1. Click "Add Item" on Stock page
2. Select category (Raw Materials, Resale Items, Beverage, or Snack)
3. Enter product name
4. Set opening stock
5. Set purchase/selling price
6. Optionally add vendor name
7. Click "Add Stock Item"

### Stock Tracking

The system automatically tracks:
- **Opening Stock** - What you start with
- **Purchases** - When you click (+) button
- **Usage/Sales** - When you click (-) button
- **Closing Stock** - Calculated automatically

### Example (Milk):

```
Opening: 20 liters
+ Purchase: 30 liters
- Used: 45 liters
= Closing: 5 liters
```

### Vendor Management

Simply enter vendor name when adding stock items:
- "Black Pekoe" for biscuits/tea items
- "Vegetable Vendor"
- "Milk Vendor"  
- "Ice Cream Vendor"

The vendor analysis functions will then show spending by vendor.

## Reports You Can Generate

Once optional migration is applied, you can create custom reports:

### 1. Vendor Spending Report
```sql
SELECT * FROM get_vendor_spending('2024-12-01', '2024-12-31');
```

Shows which vendor costs you most money.

### 2. Category-wise Stock Value
```sql
SELECT * FROM get_stock_valuation();
```

Shows inventory value broken down by:
- Raw Materials
- Resale Items
- Beverage
- Snack

### 3. Low Stock Items
```sql
SELECT * FROM get_low_stock_items();
```

Items that need reordering.

### 4. Expiring Items
```sql
SELECT * FROM get_expiring_items(7);
```

Items expiring in next 7 days.

## Key Points

✅ **Simple & Practical** - No over-engineering
✅ **4 Categories** - Exactly as you specified
✅ **Vendor as Text** - Simple vendor name field
✅ **Auto-Calculation** - Closing stock calculated automatically
✅ **Low Stock Alerts** - Warns when stock is low
✅ **Expiry Tracking** - For perishable items
✅ **Vendor Analysis** - Optional, see spending by vendor

## Files Modified

1. `src/lib/constants.ts` - Added 4 categories with sample products
2. `src/pages/Stock.tsx` - Display all 4 categories
3. `supabase/migrations/20251206190000_simple_stock_enhancements.sql` - Optional vendor analysis functions

## No Breaking Changes

Everything continues to work as before. You can:
- Continue using existing stock items
- Gradually move items to new categories
- Optionally apply migration for vendor reports

Your current stock data is safe and will work with the new categories!
