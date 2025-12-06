# Stock/Inventory Management System - Complete Architecture Design

## Document Version: 1.0
**Date:** December 6, 2025  
**Prepared by:** Senior Software Architect

---

# 1. SYSTEM OVERVIEW

## 1.1 Architecture Overview

The system follows a **three-tier architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│   (React SPA - Desktop/Mobile Responsive Interface)         │
└────────────────┬────────────────────────────────────────────┘
                 │ REST API / GraphQL
┌────────────────▼────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  (Node.js/Express or Python/Django - Business Logic)        │
│  - Authentication & Authorization                            │
│  - Business Rules & Validations                             │
│  - Stock Calculations & Alerts                              │
│  - Report Generation                                         │
└────────────────┬────────────────────────────────────────────┘
                 │ ORM/Query Builder
┌────────────────▼────────────────────────────────────────────┐
│                      DATA LAYER                              │
│         (PostgreSQL/MySQL - Relational Database)            │
│  - Transactional Data Storage                               │
│  - Audit Logs & History                                     │
│  - Referential Integrity                                    │
└─────────────────────────────────────────────────────────────┘
```

## 1.2 User Roles & Permissions

### Role-Based Access Control (RBAC)

| Role | Permissions | Use Cases |
|------|------------|-----------|
| **Admin** | Full system access, user management, configuration, all CRUD operations, reports | System administrator, business owner |
| **Warehouse Manager** | View/Add/Edit products, manage stock in/out, supplier management, generate reports | Warehouse supervisor |
| **Warehouse Staff** | View products, record stock in/out, view current stock levels | Daily operations staff |
| **Sales Staff** | View products, record stock out (sales), view stock levels | Sales counter, dispatch |
| **Accountant** | View-only access, generate financial reports, valuation reports | Finance department |
| **Viewer** | Read-only access to products and current stock levels | Stakeholders, auditors |

### Permission Matrix

| Action | Admin | Warehouse Manager | Warehouse Staff | Sales Staff | Accountant | Viewer |
|--------|-------|-------------------|-----------------|-------------|------------|--------|
| Add Product | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit Product | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete Product | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Stock In (Purchase) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Stock Out (Sale/Dispatch) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Stock Levels | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Suppliers | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Generate Reports | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| System Configuration | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

# 2. CORE FUNCTIONALITIES

## 2.1 Product Management

### Add New Product/Item

**Required Fields:**
- Product Name (String, max 255 chars)
- SKU/Product Code (String, unique, alphanumeric, max 50 chars)
- Category (Foreign key to Categories table)
- Unit of Measure (UOM) - e.g., pieces, kg, liters
- Cost Price (Decimal, min 0)
- Sale Price (Decimal, min 0)
- Reorder Level (Integer, min 0) - Low stock threshold

**Optional Fields:**
- Description (Text)
- Barcode/QR Code (String, unique if provided)
- Brand (String)
- Supplier (Foreign key to Suppliers table)
- Shelf Location (String)
- Weight/Volume
- Expiry Tracking (Boolean)
- Default Expiry Days (Integer, if expiry tracking enabled)
- Is Active (Boolean, default true)
- Tags/Labels (JSON array)

**Business Rules:**
- SKU must be unique across the system
- Sale price ≥ Cost price (warning, not blocker)
- Reorder level must be > 0 for low-stock alerts
- If expiry tracking enabled, default expiry days required

**API Endpoint:**
```
POST /api/products
{
  "name": "Tea Powder Premium",
  "sku": "TEA-001",
  "category_id": 5,
  "uom": "kg",
  "cost_price": 450.00,
  "sale_price": 650.00,
  "reorder_level": 10,
  "description": "Premium quality tea powder",
  "supplier_id": 3,
  "expiry_tracking": true,
  "default_expiry_days": 180
}
```

### Update Product Details

**Updatable Fields:**
- All product fields except SKU (SKU is immutable after creation)
- Price changes create audit log entry
- Stock level changes NOT allowed here (use stock in/out transactions)

**API Endpoint:**
```
PUT /api/products/:id
PATCH /api/products/:id  (for partial updates)
```

**Version Control:**
- Maintain price history in separate table
- Log all changes with timestamp and user

## 2.2 Stock Receiving (Increase Stock)

### Stock In Transaction

**Required Fields:**
- Product ID (Foreign key)
- Quantity (Integer, > 0)
- Transaction Date (DateTime, defaults to now)
- Transaction Type: "PURCHASE" | "ADJUSTMENT_IN" | "RETURN_FROM_CUSTOMER" | "OPENING_STOCK"
- Unit Cost (Decimal, can differ from product's cost price)

**Optional Fields:**
- Supplier ID (Foreign key)
- Purchase Order Number
- Invoice Number
- Batch/Lot Number (if batch tracking enabled)
- Manufacturing Date
- Expiry Date (if expiry tracking enabled)
- Warehouse/Location ID (if multi-warehouse)
- Notes/Comments
- Received By (User ID)

**Business Rules:**
- Quantity must be > 0
- If expiry date provided, must be future date
- If batch tracking enabled, batch number required
- Transaction creates audit log entry
- Automatically updates product's current stock level

**API Endpoint:**
```
POST /api/stock/receive
{
  "product_id": 15,
  "quantity": 100,
  "transaction_type": "PURCHASE",
  "unit_cost": 445.00,
  "supplier_id": 3,
  "invoice_number": "INV-2025-001",
  "batch_number": "BATCH-001",
  "expiry_date": "2026-06-30",
  "notes": "Regular monthly stock",
  "received_by": "user_123"
}
```

**Process Flow:**
```
1. Validate inputs
2. Check if batch number is unique (if provided)
3. Create stock_in_transactions record
4. Update products.current_stock (+quantity)
5. Create stock_ledger audit entry
6. If batch tracking: Create batch_inventory record
7. Check if stock now above reorder level (clear alert if exists)
8. Return updated stock level
```

## 2.3 Stock Dispatch (Decrease Stock)

### Stock Out Transaction

**Required Fields:**
- Product ID (Foreign key)
- Quantity (Integer, > 0)
- Transaction Date (DateTime)
- Transaction Type: "SALE" | "DISPATCH" | "ADJUSTMENT_OUT" | "DAMAGED" | "EXPIRED" | "RETURN_TO_SUPPLIER"

**Optional Fields:**
- Customer ID / Order ID (if sale)
- Invoice Number
- Batch/Lot Number (if batch tracking - for FIFO/FEFO)
- Warehouse/Location ID
- Unit Sale Price (for sales)
- Notes/Reason
- Dispatched By (User ID)

**Business Rules:**
- Quantity must be > 0
- Quantity must be ≤ current available stock (strict validation)
- For sales, sale price should be > 0
- If batch tracking: deduct from oldest batch first (FIFO) or earliest expiry (FEFO)
- Low stock alert triggered if stock falls below reorder level

**API Endpoint:**
```
POST /api/stock/dispatch
{
  "product_id": 15,
  "quantity": 25,
  "transaction_type": "SALE",
  "invoice_number": "SALE-2025-045",
  "unit_sale_price": 650.00,
  "dispatched_by": "user_456",
  "notes": "Regular customer order"
}
```

**Process Flow:**
```
1. Validate inputs
2. Check current stock ≥ requested quantity
3. If batch tracking: Identify batches to deduct from (FIFO/FEFO)
4. Create stock_out_transactions record
5. Update products.current_stock (-quantity)
6. If batch tracking: Update batch_inventory quantities
7. Create stock_ledger audit entry
8. Check if stock < reorder level (trigger alert)
9. Return updated stock level
```

## 2.4 Real-Time Stock Level View

**Features:**
- Current available quantity per SKU
- Stock value (quantity × cost price)
- Reserved stock (if order management integrated)
- Available stock (current - reserved)
- Last updated timestamp
- Batch/expiry details (if enabled)

**API Endpoint:**
```
GET /api/stock/levels
Query params: 
  - category_id (optional)
  - warehouse_id (optional)
  - low_stock_only=true (optional)
  - expiring_soon=true (optional)
  - search (optional)
  - page, limit (pagination)

Response:
{
  "data": [
    {
      "product_id": 15,
      "sku": "TEA-001",
      "name": "Tea Powder Premium",
      "category": "Beverages",
      "current_stock": 75,
      "reorder_level": 10,
      "stock_status": "ADEQUATE",
      "stock_value": 33750.00,
      "uom": "kg",
      "last_updated": "2025-12-06T10:30:00Z",
      "batches": [
        {
          "batch_number": "BATCH-001",
          "quantity": 75,
          "expiry_date": "2026-06-30",
          "days_to_expiry": 207
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50
}
```

## 2.5 Low-Stock Alert System

### Alert Configuration

**Per-Product Thresholds:**
- Reorder Level (minimum stock before alert)
- Critical Level (urgent reorder required)
- Maximum Stock Level (overstocking alert, optional)

**Alert Types:**
1. **LOW_STOCK**: Stock ≤ Reorder Level
2. **CRITICAL_STOCK**: Stock ≤ Critical Level (typically 50% of reorder level)
3. **OUT_OF_STOCK**: Stock = 0
4. **OVERSTOCK**: Stock > Maximum Level (if configured)

**Notification Channels:**
- In-app dashboard alerts (bell icon with count)
- Email notifications (daily digest or real-time)
- SMS alerts (for critical stock)
- Webhook to external systems

**API Endpoints:**
```
GET /api/alerts/stock
  - Returns active stock alerts

POST /api/alerts/configure
  - Configure alert thresholds per product

PUT /api/alerts/:id/acknowledge
  - Mark alert as acknowledged

GET /api/alerts/history
  - Historical alerts with resolution status
```

## 2.6 Historical Stock Ledger / Audit Trail

### Comprehensive Transaction Log

**Stored Information:**
- Transaction ID (unique)
- Product ID
- Transaction Type (IN/OUT/ADJUSTMENT)
- Quantity
- Before Stock Level
- After Stock Level
- Unit Price (cost or sale)
- Transaction Value
- Date & Time
- User Who Performed Action
- Reason/Reference (PO, Invoice, Reason Code)
- Batch Number (if applicable)
- Warehouse/Location
- Related Document IDs

**Query Capabilities:**
```
GET /api/stock/ledger
Query params:
  - product_id (filter by product)
  - date_from, date_to (date range)
  - transaction_type (filter by type)
  - user_id (filter by user)
  - warehouse_id (filter by location)
  - page, limit (pagination)

Response: Chronological list of all stock movements
```

**Immutability:**
- Ledger entries are write-only (no updates/deletes)
- Corrections done via adjustment transactions
- Full audit trail maintained indefinitely (or per retention policy)

## 2.7 Supplier/Vendor Management

### Supplier Master Data

**Fields:**
- Supplier ID (unique)
- Supplier Name
- Contact Person
- Email, Phone
- Address
- Tax ID / Registration Number
- Payment Terms (e.g., Net 30)
- Is Active
- Credit Limit (optional)
- Rating (1-5 stars)
- Notes

**Features:**
- List of products supplied by each vendor
- Purchase history & volume
- Performance metrics (on-time delivery, quality)
- Outstanding payables

**API Endpoints:**
```
POST /api/suppliers
GET /api/suppliers
GET /api/suppliers/:id
PUT /api/suppliers/:id
DELETE /api/suppliers/:id (soft delete)

GET /api/suppliers/:id/purchase-history
  - Purchase orders and receipts from this supplier

GET /api/suppliers/:id/products
  - Products supplied by this vendor
```

## 2.8 Report Generation

### Standard Reports

#### 1. Stock Summary Report
- Current stock levels for all products
- Stock value (quantity × cost price)
- Stock by category/warehouse
- Filters: category, warehouse, date

#### 2. Low-Stock List
- Products below reorder level
- Quantity shortage
- Recommended order quantity
- Supplier information

#### 3. Stock Movement History
- All transactions in date range
- Grouped by product or transaction type
- In vs Out comparison
- Net change in stock

#### 4. Inventory Valuation Report
- Total inventory value at cost price
- Total inventory value at sale price
- Potential profit
- Dead stock identification (no movement in X days)

#### 5. Expiry Report (if enabled)
- Products expiring in next X days
- Expired products
- Batch-wise expiry details
- Action required

#### 6. Stock Reconciliation Report
- System stock vs Physical count
- Discrepancies
- Adjustment required

#### 7. ABC Analysis Report
- A items: Top 20% products by value (70% of total value)
- B items: Next 30% products (20% of total value)
- C items: Remaining 50% products (10% of total value)

### Export Formats

**Supported Formats:**
- **PDF**: Formatted reports with charts
- **Excel (.xlsx)**: Raw data with pivot-ready structure
- **CSV**: Simple data export
- **JSON**: API integration

**API Endpoint:**
```
POST /api/reports/generate
{
  "report_type": "stock_summary",
  "filters": {
    "category_id": 5,
    "warehouse_id": 1,
    "date_from": "2025-01-01",
    "date_to": "2025-12-31"
  },
  "format": "pdf",
  "email_to": "manager@example.com"
}

Response: Report URL or file download
```

## 2.9 Role-Based Access Implementation

**Authentication & Authorization Flow:**

```
1. User Login
   ↓
2. JWT Token Generated (contains user_id, role_id)
   ↓
3. Frontend stores token in localStorage/cookie
   ↓
4. Every API call includes Authorization header
   ↓
5. Backend middleware validates token
   ↓
6. Extract user role from token
   ↓
7. Check permission matrix for requested action
   ↓
8. Allow/Deny request
```

**Middleware Example:**
```javascript
function checkPermission(requiredPermission) {
  return async (req, res, next) => {
    const userRole = req.user.role;
    const permissions = ROLE_PERMISSIONS[userRole];
    
    if (permissions.includes(requiredPermission)) {
      next();
    } else {
      res.status(403).json({ error: "Access denied" });
    }
  };
}

// Usage
app.post('/api/products', 
  authenticate, 
  checkPermission('product.create'),
  createProduct
);
```

---

# 3. DATA MODEL / DATABASE SCHEMA

## 3.1 Entity-Relationship Diagram (ERD)

```
┌──────────────┐          ┌──────────────┐
│   Users      │          │   Roles      │
├──────────────┤          ├──────────────┤
│ id (PK)      │◄────────┤│ id (PK)      │
│ username     │          │ name         │
│ email        │          │ permissions  │
│ password_hash│          └──────────────┘
│ role_id (FK) │
│ is_active    │
│ created_at   │
└──────────────┘

┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│  Categories  │          │   Products   │          │  Suppliers   │
├──────────────┤          ├──────────────┤          ├──────────────┤
│ id (PK)      │◄────────┤│ id (PK)      │         ┌│ id (PK)      │
│ name         │          │ sku (UNIQUE) │         ││ name         │
│ description  │          │ name         │         ││ contact      │
│ parent_id    │          │ category_id  │──────┐  ││ email        │
└──────────────┘          │ description  │      │  ││ phone        │
                          │ uom          │      └─►│ address      │
                          │ cost_price   │         │ is_active    │
                          │ sale_price   │         └──────────────┘
                          │ current_stock│
                          │ reorder_level│
                          │ supplier_id  │
                          │ barcode      │
                          │ is_active    │
                          │ created_at   │
                          └──────┬───────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
           ┌────────▼───────┐    │   ┌────────▼───────┐
           │  StockIn       │    │   │   StockOut     │
           │  Transactions  │    │   │   Transactions │
           ├────────────────┤    │   ├────────────────┤
           │ id (PK)        │    │   │ id (PK)        │
           │ product_id (FK)│    │   │ product_id (FK)│
           │ quantity       │    │   │ quantity       │
           │ unit_cost      │    │   │ unit_price     │
           │ supplier_id    │    │   │ transaction_   │
           │ invoice_no     │    │   │   type         │
           │ batch_number   │    │   │ invoice_no     │
           │ expiry_date    │    │   │ notes          │
           │ received_date  │    │   │ dispatched_date│
           │ received_by    │    │   │ dispatched_by  │
           │ notes          │    │   │ created_at     │
           │ created_at     │    │   └────────────────┘
           └────────────────┘    │
                                 │
                          ┌──────▼───────┐
                          │ StockLedger  │
                          │ (Audit Trail)│
                          ├──────────────┤
                          │ id (PK)      │
                          │ product_id   │
                          │ trans_type   │
                          │ trans_ref_id │
                          │ quantity     │
                          │ before_stock │
                          │ after_stock  │
                          │ unit_price   │
                          │ user_id      │
                          │ notes        │
                          │ created_at   │
                          └──────────────┘

┌──────────────┐          ┌──────────────┐
│ BatchInventory│         │ StockAlerts  │
├──────────────┤          ├──────────────┤
│ id (PK)      │          │ id (PK)      │
│ product_id   │          │ product_id   │
│ batch_number │          │ alert_type   │
│ quantity     │          │ threshold    │
│ mfg_date     │          │ current_stock│
│ expiry_date  │          │ is_active    │
│ received_date│          │ acknowledged │
│ location     │          │ created_at   │
└──────────────┘          └──────────────┘
```

## 3.2 Detailed Table Schemas

### 3.2.1 users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_email ON users(email);
```

### 3.2.2 roles
```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB, -- Array of permission strings
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('Admin', 'Full system access', '["*"]'),
('Warehouse Manager', 'Manage stock and suppliers', 
  '["product.*", "stock.*", "supplier.*", "report.view"]'),
('Warehouse Staff', 'Basic stock operations', 
  '["stock.in", "stock.out", "stock.view"]'),
('Sales Staff', 'Sales and dispatch', 
  '["stock.out", "stock.view"]'),
('Accountant', 'View and reports only', 
  '["product.view", "stock.view", "report.*"]'),
('Viewer', 'Read-only access', 
  '["product.view", "stock.view"]');
```

### 3.2.3 categories
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES categories(id), -- For hierarchical categories
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
```

### 3.2.4 suppliers
```sql
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  tax_id VARCHAR(50),
  payment_terms VARCHAR(100), -- e.g., "Net 30"
  credit_limit DECIMAL(15,2),
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_name ON suppliers(name);
```

### 3.2.5 products
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES categories(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  uom VARCHAR(20) NOT NULL, -- Unit of Measure
  cost_price DECIMAL(15,2) NOT NULL CHECK (cost_price >= 0),
  sale_price DECIMAL(15,2) NOT NULL CHECK (sale_price >= 0),
  current_stock INTEGER DEFAULT 0 CHECK (current_stock >= 0),
  reorder_level INTEGER DEFAULT 0 CHECK (reorder_level >= 0),
  max_stock_level INTEGER,
  barcode VARCHAR(100) UNIQUE,
  brand VARCHAR(100),
  weight DECIMAL(10,3),
  volume DECIMAL(10,3),
  shelf_location VARCHAR(50),
  expiry_tracking BOOLEAN DEFAULT false,
  default_expiry_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  tags JSONB, -- Array of tags for filtering
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_name ON products(name);
```

### 3.2.6 stock_in_transactions
```sql
CREATE TABLE stock_in_transactions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(15,2) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- PURCHASE, ADJUSTMENT_IN, RETURN, OPENING
  supplier_id INTEGER REFERENCES suppliers(id),
  purchase_order_no VARCHAR(100),
  invoice_number VARCHAR(100),
  batch_number VARCHAR(100),
  manufacturing_date DATE,
  expiry_date DATE,
  warehouse_id INTEGER, -- For multi-warehouse
  location VARCHAR(100),
  notes TEXT,
  received_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  received_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stockin_product ON stock_in_transactions(product_id);
CREATE INDEX idx_stockin_supplier ON stock_in_transactions(supplier_id);
CREATE INDEX idx_stockin_date ON stock_in_transactions(received_date);
CREATE INDEX idx_stockin_batch ON stock_in_transactions(batch_number);
```

### 3.2.7 stock_out_transactions
```sql
CREATE TABLE stock_out_transactions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(15,2),
  transaction_type VARCHAR(50) NOT NULL, -- SALE, DISPATCH, ADJUSTMENT_OUT, DAMAGED, EXPIRED
  customer_id INTEGER, -- If sales module integrated
  order_id INTEGER,
  invoice_number VARCHAR(100),
  batch_number VARCHAR(100), -- Batch consumed (FIFO/FEFO)
  warehouse_id INTEGER,
  location VARCHAR(100),
  notes TEXT,
  dispatched_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dispatched_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stockout_product ON stock_out_transactions(product_id);
CREATE INDEX idx_stockout_date ON stock_out_transactions(dispatched_date);
CREATE INDEX idx_stockout_invoice ON stock_out_transactions(invoice_number);
```

### 3.2.8 stock_ledger (Audit Trail)
```sql
CREATE TABLE stock_ledger (
  id BIGSERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  transaction_type VARCHAR(20) NOT NULL, -- IN, OUT
  transaction_ref_id INTEGER NOT NULL, -- References stock_in or stock_out
  transaction_subtype VARCHAR(50), -- PURCHASE, SALE, ADJUSTMENT, etc.
  quantity INTEGER NOT NULL,
  before_stock INTEGER NOT NULL,
  after_stock INTEGER NOT NULL,
  unit_price DECIMAL(15,2),
  transaction_value DECIMAL(15,2), -- quantity × unit_price
  user_id UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Immutable: No updates or deletes allowed
CREATE INDEX idx_ledger_product ON stock_ledger(product_id);
CREATE INDEX idx_ledger_date ON stock_ledger(created_at);
CREATE INDEX idx_ledger_user ON stock_ledger(user_id);
```

### 3.2.9 batch_inventory (For Batch/Lot Tracking)
```sql
CREATE TABLE batch_inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  batch_number VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  manufacturing_date DATE,
  expiry_date DATE,
  received_date DATE NOT NULL,
  warehouse_id INTEGER,
  location VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, batch_number)
);

CREATE INDEX idx_batch_product ON batch_inventory(product_id);
CREATE INDEX idx_batch_expiry ON batch_inventory(expiry_date);
CREATE INDEX idx_batch_number ON batch_inventory(batch_number);
```

### 3.2.10 stock_alerts
```sql
CREATE TABLE stock_alerts (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  alert_type VARCHAR(50) NOT NULL, -- LOW_STOCK, CRITICAL_STOCK, OUT_OF_STOCK, OVERSTOCK, EXPIRING
  threshold INTEGER,
  current_stock INTEGER,
  message TEXT,
  is_active BOOLEAN DEFAULT true,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_product ON stock_alerts(product_id);
CREATE INDEX idx_alerts_type ON stock_alerts(alert_type);
CREATE INDEX idx_alerts_active ON stock_alerts(is_active, acknowledged);
```

### 3.2.11 price_history (For Price Change Tracking)
```sql
CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  price_type VARCHAR(20) NOT NULL, -- COST, SALE
  old_price DECIMAL(15,2),
  new_price DECIMAL(15,2),
  changed_by UUID REFERENCES users(id),
  reason TEXT,
  effective_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_price_history_product ON price_history(product_id);
```

## 3.3 Database Triggers & Functions

### 3.3.1 Update Current Stock on Stock In
```sql
CREATE OR REPLACE FUNCTION update_stock_on_receive()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current stock
  UPDATE products 
  SET current_stock = current_stock + NEW.quantity,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.product_id;
  
  -- Create ledger entry
  INSERT INTO stock_ledger (
    product_id, transaction_type, transaction_ref_id, 
    transaction_subtype, quantity, before_stock, after_stock,
    unit_price, transaction_value, user_id, notes
  )
  SELECT 
    NEW.product_id, 'IN', NEW.id,
    NEW.transaction_type, NEW.quantity,
    p.current_stock - NEW.quantity, -- before
    p.current_stock, -- after
    NEW.unit_cost,
    NEW.quantity * NEW.unit_cost,
    NEW.received_by,
    NEW.notes
  FROM products p
  WHERE p.id = NEW.product_id;
  
  -- Check and clear low stock alert if stock now above reorder level
  UPDATE stock_alerts
  SET is_active = false
  WHERE product_id = NEW.product_id 
    AND alert_type IN ('LOW_STOCK', 'CRITICAL_STOCK', 'OUT_OF_STOCK')
    AND is_active = true
    AND (SELECT current_stock FROM products WHERE id = NEW.product_id) > 
        (SELECT reorder_level FROM products WHERE id = NEW.product_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_stock_in
  AFTER INSERT ON stock_in_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_receive();
```

### 3.3.2 Update Current Stock on Stock Out
```sql
CREATE OR REPLACE FUNCTION update_stock_on_dispatch()
RETURNS TRIGGER AS $$
DECLARE
  current_qty INTEGER;
  reorder_qty INTEGER;
BEGIN
  -- Get current stock
  SELECT current_stock, reorder_level 
  INTO current_qty, reorder_qty
  FROM products 
  WHERE id = NEW.product_id;
  
  -- Validate sufficient stock
  IF current_qty < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', 
      current_qty, NEW.quantity;
  END IF;
  
  -- Update current stock
  UPDATE products 
  SET current_stock = current_stock - NEW.quantity,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.product_id;
  
  -- Create ledger entry
  INSERT INTO stock_ledger (
    product_id, transaction_type, transaction_ref_id,
    transaction_subtype, quantity, before_stock, after_stock,
    unit_price, transaction_value, user_id, notes
  )
  SELECT 
    NEW.product_id, 'OUT', NEW.id,
    NEW.transaction_type, NEW.quantity,
    current_qty, -- before
    current_qty - NEW.quantity, -- after
    NEW.unit_price,
    NEW.quantity * COALESCE(NEW.unit_price, 0),
    NEW.dispatched_by,
    NEW.notes;
  
  -- Create alert if stock falls below reorder level
  IF (current_qty - NEW.quantity) <= reorder_qty THEN
    INSERT INTO stock_alerts (
      product_id, alert_type, threshold, current_stock, message
    )
    VALUES (
      NEW.product_id,
      CASE 
        WHEN (current_qty - NEW.quantity) = 0 THEN 'OUT_OF_STOCK'
        WHEN (current_qty - NEW.quantity) <= (reorder_qty * 0.5) THEN 'CRITICAL_STOCK'
        ELSE 'LOW_STOCK'
      END,
      reorder_qty,
      current_qty - NEW.quantity,
      'Stock level critical, reorder required'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_stock_out
  BEFORE INSERT ON stock_out_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_dispatch();
```

### 3.3.3 Track Price Changes
```sql
CREATE OR REPLACE FUNCTION track_price_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.cost_price != NEW.cost_price THEN
    INSERT INTO price_history (
      product_id, price_type, old_price, new_price, changed_by
    )
    VALUES (
      NEW.id, 'COST', OLD.cost_price, NEW.cost_price, 
      current_setting('app.current_user_id')::UUID
    );
  END IF;
  
  IF OLD.sale_price != NEW.sale_price THEN
    INSERT INTO price_history (
      product_id, price_type, old_price, new_price, changed_by
    )
    VALUES (
      NEW.id, 'SALE', OLD.sale_price, NEW.sale_price,
      current_setting('app.current_user_id')::UUID
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_price_change
  AFTER UPDATE ON products
  FOR EACH ROW
  WHEN (OLD.cost_price != NEW.cost_price OR OLD.sale_price != NEW.sale_price)
  EXECUTE FUNCTION track_price_changes();
```

---

# 4. USER INTERFACE / UX CONSIDERATIONS

## 4.1 Key UI Workflows

### Workflow 1: Adding New Stock (Receiving)

```
1. Navigate to Stock → Receive Stock
2. Search/Select Product (autocomplete search by name/SKU/barcode)
3. Form auto-fills with product details
4. Enter:
   - Quantity (number input with +/- buttons)
   - Unit Cost (pre-filled with last cost, editable)
   - Supplier (dropdown, filterable)
   - Invoice
