# Stock/Inventory Management System - Part 2
## Continuation of Complete Architecture Design

---

# 4. USER INTERFACE / UX CONSIDERATIONS (Continued)

## 4.1 Key UI Workflows (Continued)

### Workflow 1: Adding New Stock (Receiving) - Complete

```
1. Navigate to Stock → Receive Stock
2. Search/Select Product (autocomplete search by name/SKU/barcode)
3. Form auto-fills with product details (name, current stock, UOM)
4. Enter:
   - Quantity (number input with +/- buttons)
   - Unit Cost (pre-filled with last purchase cost, editable)
   - Supplier (dropdown with search, filterable)
   - Invoice Number (text input)
   - Batch Number (if batch tracking enabled)
   - Expiry Date (date picker, if expiry tracking enabled)
   - Notes (optional)
5. Real-time validation:
   - Quantity > 0
   - Expiry date > today
   - Batch number unique check
6. Submit → Shows success toast with new stock level
7. Option to:
   - Add another item
   - View updated stock
   - Print receipt
```

### Workflow 2: Dispatching Stock (Sales/Usage)

```
1. Navigate to Stock → Dispatch Stock
2. Search/Select Product or Scan Barcode
3. Current stock displayed prominently
4. Enter quantity to dispatch
5. Real-time validation:
   - Quantity ≤ Available stock (shows error if exceeded)
   - Color coding: Green (OK), Yellow (Low stock warning), Red (Insufficient)
6. Select reason: Sale / Damage / Expired / Other
7. If Sale: Enter sale price and invoice number
8. Submit → Confirms dispatch
9. If stock falls below reorder level → Alert displayed
10. Option to immediately create purchase order
```

### Workflow 3: Checking Stock Levels

```
Dashboard View:
├── Quick Stats Cards
│   ├── Total Products
│   ├── Total Stock Value
│   ├── Low Stock Items (count)
│   └── Items Expiring Soon (count)
│
├── Search/Filter Bar
│   ├── Search by Name/SKU/Barcode
│   ├── Filter by Category
│   ├── Filter: Low Stock Only
│   └── Filter: Expiring Soon
│
└── Stock Table (Sortable, Paginated)
    ├── Product Name & SKU
    ├── Category
    ├── Current Stock (color-coded by status)
    ├── Reorder Level
    ├── Stock Value
    ├── Last Updated
    └── Quick Actions (View Details, Reorder, Edit)

Status Color Coding:
- Green: Stock > Reorder Level
- Yellow: Stock = Reorder Level (warning)
- Orange: Stock < Reorder Level (low)
- Red: Stock = 0 (out of stock)
```

## 4.2 Validations & Business Rules

### Input Validations

| Field | Validation Rules | Error Message |
|-------|-----------------|---------------|
| SKU | Required, Unique, Alphanumeric, Max 50 chars | "SKU is required and must be unique" |
| Product Name | Required, Max 255 chars | "Product name is required" |
| Quantity | Required, Integer, > 0 | "Quantity must be a positive number" |
| Cost Price | Required, Decimal, ≥ 0 | "Cost price must be 0 or greater" |
| Sale Price | Required, Decimal, ≥ 0 | "Sale price must be 0 or greater" |
| Reorder Level | Integer, ≥ 0 | "Reorder level must be 0 or greater" |
| Expiry Date | Date, > Today | "Expiry date must be in the future" |
| Batch Number | Unique per product | "This batch number already exists for this product" |
| Stock Dispatch | Quantity ≤ Available Stock | "Insufficient stock. Available: X units" |

### Business Logic Validations

**1. Negative Stock Prevention:**
```javascript
// Before dispatching stock
if (requestedQuantity > currentStock) {
  throw new ValidationError(
    `Cannot dispatch ${requestedQuantity} units. Only ${currentStock} available.`
  );
}
```

**2. Reorder Level Warning:**
```javascript
// After stock dispatch
const newStock = currentStock - dispatchedQuantity;
if (newStock <= reorderLevel) {
  showWarning(`Stock level low! Current: ${newStock}, Reorder at: ${reorderLevel}`);
  if (newStock <= reorderLevel * 0.5) {
    showCriticalAlert("CRITICAL: Stock critically low!");
  }
}
```

**3. Expiry Date Validation:**
```javascript
// When receiving stock with expiry tracking
if (expiryTracking && !expiryDate) {
  throw new ValidationError("Expiry date is required for this product");
}
if (expiryDate && expiryDate <= today) {
  throw new ValidationError("Expiry date must be in the future");
}
```

**4. Price Consistency Warning:**
```javascript
// When updating sale price
if (newSalePrice < costPrice) {
  showWarning("Sale price is less than cost price. This will result in loss.");
  // Don't block, just warn
}
```

## 4.3 Alert & Notification System

### Alert Display Mechanisms

**1. Dashboard Alert Cards:**
```
┌─────────────────────────────────────┐
│ ⚠️  5 Products Low on Stock         │
│ 🔴 2 Products Out of Stock          │
│ ⏰ 3 Products Expiring in 7 Days    │
│ [View All Alerts]                   │
└─────────────────────────────────────┘
```

**2. Notification Bell Icon:**
- Badge shows count of active alerts
- Dropdown shows recent alerts
- Click to view full alert list

**3. In-Page Banner Alerts:**
```
┌──────────────────────────────────────────────────────┐
│ ⚠️  Tea Powder stock is low (5 kg remaining).       │
│ Reorder level: 10 kg | Suggested order: 100 kg      │
│ [Reorder Now] [Acknowledge]                          │
└──────────────────────────────────────────────────────┘
```

**4. Email Notifications:**
- Daily digest of all active alerts
- Immediate notification for critical alerts (out of stock)
- Weekly inventory summary

**5. Toast Notifications:**
- Success: "Stock updated successfully"
- Warning: "Stock level low for 3 items"
- Error: "Failed to update stock"

### Alert Priority Levels

| Priority | Type | Condition | Action |
|----------|------|-----------|--------|
| 🔴 Critical | OUT_OF_STOCK | Stock = 0 | Immediate email + SMS |
| 🟠 High | CRITICAL_STOCK | Stock ≤ 50% of reorder level | Email notification |
| 🟡 Medium | LOW_STOCK | Stock ≤ reorder level | Dashboard alert |
| 🔵 Low | EXPIRING_SOON | Expiry within 30 days | Daily email digest |

---

# 5. ADDITIONAL FEATURES & EXTENSIBILITY

## 5.1 Batch/Lot Tracking

### Implementation

**Purpose:** Track products by batch/lot number, especially for:
- Perishable goods with expiry dates
- Regulated products (pharma, food)
- Quality control and recall management

**Features:**
1. **Batch Creation:** Automatically created when receiving stock
2. **FIFO/FEFO:** First-In-First-Out or First-Expiry-First-Out dispatch
3. **Batch History:** Full traceability from receipt to dispatch
4. **Expiry Tracking:** Alert when batches approach expiry
5. **Recall Management:** Identify and track recalled batches

**UI Components:**
```
Product Detail → Batches Tab
├── Active Batches
│   ├── Batch #BATCH-001 | Qty: 50 | Expiry: 2026-06-30
│   ├── Batch #BATCH-002 | Qty: 75 | Expiry: 2026-07-15
│   └── [Show All Batches]
│
└── Batch Dispatch Strategy
    ├── ○ FIFO (First In, First Out)
    └── ● FEFO (First Expiry, First Out) ← Selected
```

**Database Extension:**
- `batch_inventory` table (already defined in schema)
- Link stock transactions to specific batches
- Track batch-wise movements in ledger

## 5.2 Barcode/QR Code Support

### Barcode Scanner Integration

**Hardware Support:**
- USB barcode scanners (acts as keyboard input)
- Mobile camera barcode scanning (QuaggaJS, ZXing)
- Bluetooth handheld scanners

**Barcode Types Supported:**
- EAN-13, EAN-8 (retail products)
- Code 128 (warehouse/logistics)
- QR Codes (custom product info)

**Use Cases:**
1. **Product Search:** Scan to instantly find product
2. **Quick Stock In:** Scan → Enter quantity → Submit
3. **Fast Dispatch:** Scan → Confirm quantity → Dispatch
4. **Stock Verification:** Scan during physical count

**UI Features:**
```
┌────────────────────────────────┐
│  [📷 Scan Barcode]             │
│                                │
│  Or enter manually:            │
│  [____________] Search         │
└────────────────────────────────┘

On Scan:
→ Auto-fills product details
→ Focus on quantity field
→ Ready for quick entry
```

**Implementation:**
```javascript
// Barcode scan handler
function handleBarcodeScan(barcode) {
  // Look up product by barcode
  const product = await findProductByBarcode(barcode);
  
  if (product) {
    // Auto-fill form
    setProduct(product);
    // Focus on quantity input
    quantityInput.focus();
  } else {
    showError("Product not found");
    // Option to create new product with this barcode
  }
}
```

## 5.3 Supplier/Order Management Module

### Purchase Order System

**Features:**
1. **Create Purchase Orders:**
   - Select supplier
   - Add products from catalog
   - Specify quantities and expected prices
   - Set delivery date
   - PO status: Draft → Sent → Confirmed → Received → Completed

2. **Order Tracking:**
   - View all pending orders
   - Expected delivery dates
   - Partial receipts handling
   - Auto-reminders for overdue orders

3. **Receipt Against PO:**
   - Receive against specific PO
   - Validate quantities (expected vs received)
   - Handle over-delivery / under-delivery
   - Auto-create stock-in transaction

**Tables Required:**
```sql
CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  status VARCHAR(50), -- DRAFT, SENT, CONFIRMED, PARTIAL, RECEIVED, CANCELLED
  total_amount DECIMAL(15,2),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id INTEGER REFERENCES purchase_orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2),
  quantity_received INTEGER DEFAULT 0,
  status VARCHAR(50) -- PENDING, PARTIAL, RECEIVED
);
```

## 5.4 Multi-Warehouse Support

### Warehouse Management

**Features:**
1. **Warehouse Master:**
   - Multiple warehouse/location support
   - Each warehouse has own stock levels
   - Transfer stock between warehouses

2. **Warehouse-Specific Operations:**
   - Stock in at specific warehouse
   - Stock out from specific warehouse
   - View stock by warehouse
   - Consolidated stock view across all warehouses

3. **Inter-Warehouse Transfers:**
   - Transfer stock from Warehouse A to B
   - Track transfer in-transit
   - Automatic stock adjustments

**Tables Required:**
```sql
CREATE TABLE warehouses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  address TEXT,
  manager_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE warehouse_stock (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER REFERENCES warehouses(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
  last_updated TIMESTAMP,
  UNIQUE(warehouse_id, product_id)
);

CREATE TABLE stock_transfers (
  id SERIAL PRIMARY KEY,
  transfer_number VARCHAR(50) UNIQUE,
  product_id INTEGER REFERENCES products(id),
  from_warehouse_id INTEGER REFERENCES warehouses(id),
  to_warehouse_id INTEGER REFERENCES warehouses(id),
  quantity INTEGER NOT NULL,
  status VARCHAR(50), -- PENDING, IN_TRANSIT, RECEIVED, CANCELLED
  transfer_date DATE,
  received_date DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 5.5 Sales/Order Integration

### Auto Stock Reduction on Sales

**Integration Points:**
1. **Order Placement:**
   - Create sales order
   - Reserve stock (reduce available, not current)
   - Prevent overselling

2. **Order Fulfillment:**
   - Pick items from stock
   - Create stock-out transaction
   - Link to sales invoice
   - Update order status

3. **Returns Handling:**
   - Customer returns
   - Stock-in transaction with reference to original sale
   - Quality check before adding back to sellable stock

**Workflow:**
```
Sale Order Created
    ↓
Reserve Stock (Available -= Quantity)
    ↓
Order Packed/Fulfilled
    ↓
Stock Out Transaction Created
    ↓
Current Stock -= Quantity
Reserved Stock += Quantity
Available Stock unchanged
    ↓
Invoice Generated
```

## 5.6 Advanced Reporting & Analytics

### 1. **ABC Analysis Report**
- Categorize products by value contribution
- A: High value (70% of total)
- B: Medium value (20% of total)
- C: Low value (10% of total)
- Focus inventory control efforts accordingly

### 2. **Stock Turnover Analysis**
```
Stock Turnover Ratio = Cost of Goods Sold / Average Inventory Value

High turnover = Fast-moving product
Low turnover = Slow-moving/dead stock
```

### 3. **Dead Stock Report**
- Products with no movement in X days (configurable)
- Identify obsolete inventory
- Recommend clearance sales or write-offs

### 4. **Stock Aging Report**
- How long items have been in stock
- Age brackets: 0-30 days, 31-60, 61-90, 90+ days
- Useful for perishables and fashion items

### 5. **Supplier Performance Report**
- On-time delivery rate
- Quality acceptance rate
- Price competitiveness
- Order frequency and volume

### 6. **Forecast & Reorder Suggestions**
- Based on historical consumption patterns
- Seasonal demand analysis
- Automatic reorder quantity calculation
- Just-in-time (JIT) ordering support

---

# 6. NON-FUNCTIONAL REQUIREMENTS

## 6.1 Data Consistency & Integrity

### Measures to Ensure Data Integrity

**1. Database Constraints:**
- Primary keys, foreign keys, unique constraints
- Check constraints (quantity > 0, prices ≥ 0)
- NOT NULL constraints on critical fields
- Cascade rules for referential integrity

**2. Transaction Management:**
```javascript
// All stock operations in database transactions
async function dispatchStock(productId, quantity) {
  const transaction = await db.transaction();
  
  try {
    // 1. Check stock availability
    const product = await transaction.products.findOne(productId, { lock: true });
    
    if (product.current_stock < quantity) {
      throw new Error("Insufficient stock");
    }
    
    // 2. Create stock-out record
    await transaction.stock_out_transactions.create({...});
    
    // 3. Update product stock
    await transaction.products.update(productId, {
      current_stock: product.current_stock - quantity
    });
    
    // 4. Create ledger entry
    await transaction.stock_ledger.create({...});
    
    // 5. Check and create alerts
    if (product.current_stock - quantity <= product.reorder_level) {
      await transaction.stock_alerts.create({...});
    }
    
    // Commit transaction
    await transaction.commit();
  } catch (error) {
    // Rollback on any error
    await transaction.rollback();
    throw error;
  }
}
```

**3. Audit Trail (Immutable Ledger):**
- All stock movements logged in `stock_ledger`
- No updates or deletes allowed (append-only)
- Corrections via adjustment transactions
- Full traceability of who did what and when

**4. Data Validation:**
- Input validation at UI layer
- Business logic validation at API layer
- Database constraints as final safeguard
- Consistent error handling and user feedback

## 6.2 Scalability

### Handling Growth

**Database Scalability:**

1. **Indexing Strategy:**
   - Indexes on frequently queried columns
   - Composite indexes for common query patterns
   - Covering indexes to avoid table lookups

2. **Query Optimization:**
   - Use EXPLAIN ANALYZE to identify slow queries
   - Optimize N+1 query problems
   - Use database views for complex reports
   - Implement caching for expensive queries

3. **Partitioning:**
   - Partition large tables (ledger, transactions) by date
   - Archive old data to separate tables/database
   - Keep recent data in hot storage, old data in cold storage

4. **Read Replicas:**
   - Master for writes, replicas for reads
   - Offload reporting queries to read replicas
   - Reduces load on primary database

**Application Scalability:**

1. **Horizontal Scaling:**
   - Stateless API servers
   - Load balancer distributes requests
   - Session data in Redis or JWT tokens

2. **Caching:**
   - Redis/Memcached for frequently accessed data
   - Cache product catalog, stock levels (short TTL)
   - Invalidate cache on stock changes

3. **Async Processing:**
   - Use job queues (Bull, Celery) for:
     - Report generation
     - Email notifications
     - Batch imports
   - Prevents blocking user requests

**Capacity Planning:**
- Estimate data growth: X products, Y transactions/day
- Calculate storage needs: Transactional data + audit logs
- Plan for 3-5 years growth
- Monitor and scale proactively

## 6.3 Security

### Multi-Layer Security

**1. Authentication:**
- Secure password hashing (bcrypt, argon2)
- Password strength requirements
- Account lockout after failed attempts
- Optional: Two-factor authentication (2FA)
- Session timeout for inactivity

**2. Authorization:**
- Role-based access control (RBAC)
- Principle of least privilege
- Permission checks on every API call
- UI elements hidden based on permissions

**3. Data Security:**
- Encryption at rest (database encryption)
- Encryption in transit (HTTPS/TLS)
- Sensitive data masking in logs
- PII data handling compliance (GDPR, etc.)

**4. API Security:**
- JWT tokens with expiration
- API rate limiting to prevent abuse
- Input sanitization to prevent SQL injection
- CORS configuration
- CSRF protection

**5. Audit & Compliance:**
- Log all access attempts (success & failure)
- Log all data modifications
- Retain audit logs per compliance requirements
- Regular security audits
- Compliance with industry standards (ISO 27001, SOC 2)

**6. Backup Security:**
- Encrypted backups
- Secure backup storage (offsite)
- Access controls on backups
- Regular backup testing

## 6.4 Backup & Recovery Strategy

### Backup Plan

**1. Database Backups:**

**Daily Full Backup:**
- Automated daily full database backup
- Run during off-peak hours (e.g., 2 AM)
- Retention: 30 days

**Hourly Incremental Backup:**
- Incremental backups every hour
- Captures changes since last full/incremental
- Retention: 7 days

**Transaction Log Backup:**
- Continuous transaction log backup
- Enables point-in-time recovery
- Retention: 7 days

**2. Backup Storage:**
- Primary: On-premises/same-region storage
- Secondary: Offsite/different region (disaster recovery)
- Cloud storage: AWS S3, Azure Blob, Google Cloud Storage
- Encryption: All backups encrypted (AES-256)

**3. Backup Testing:**
- Monthly backup restoration test
- Verify data integrity
- Measure recovery time
- Document recovery procedures

**4. Disaster Recovery Plan:**

**Recovery Time Objective (RTO):** < 4 hours
- Time to restore system to operational state

**Recovery Point Objective (RPO):** < 1 hour
- Maximum acceptable data loss

**DR Procedure:**
```
1. Identify failure (system down, data corruption)
2. Assess damage and required recovery point
3. Locate appropriate backup
4. Restore to new/repaired system
5. Verify data integrity
6. Test critical functions
7. Switch users to recovered system
8. Monitor for issues
9. Document incident and recovery
```

**5. High Availability (Optional):**
- Database replication (master-slave)
- Automatic failover
- Geographic redundancy
- Load balancing

---

# 7. DELIVERABLES

## 7.1 ER Diagram
✅ Provided in Section 3.1

## 7.2 Database Schema
✅ Provided in Section 3.2 (Complete SQL DDL)

## 7.3 API Endpoints

### Product Management APIs

```
GET    /api/products                  # List all products (paginated, filterable)
GET    /api/products/:id              # Get product details
POST   /api/products                  # Create new product
PUT    /api/products/:id              # Update product
DELETE /api/products/:id              # Soft delete product
GET    /api/products/barcode/:code    # Find product by barcode
```

### Stock Management APIs

```
POST   /api/stock/receive             # Record stock in
POST   /api/stock/dispatch            # Record stock out
GET    /api/stock/levels              # Current stock levels (all products)
GET    /api/stock/levels/:productId   # Stock level for specific product
GET    /api/stock/ledger              # Stock movement history
GET    /api/stock/ledger/:productId   # Ledger for specific product
POST   /api/stock/adjust              # Manual stock adjustment
```

### Alert Management APIs

```
GET    /api/alerts/stock              # Active stock alerts
GET    /api/alerts/expiry             # Expiry alerts
POST   /api/alerts/configure          # Configure alert thresholds
PUT    /api/alerts/:id/acknowledge    # Acknowledge alert
GET    /api/alerts/history            # Alert history
```

### Supplier Management APIs

```
GET    /api/suppliers                 # List all suppliers
GET    /api/suppliers/:id             # Supplier details
POST   /api/suppliers                 # Create supplier
PUT    /api/suppliers/:id             # Update supplier
DELETE /api/suppliers/:id             # Soft delete supplier
GET    /api/suppliers/:id/products    # Products from supplier
GET    /api/suppliers/:id/history     # Purchase history
```

### Report APIs

```
POST   /api/reports/generate          # Generate report
GET    /api/reports/:id               # Get generated report
GET    /api/reports/stock-summary     # Stock summary report
GET    /api/reports/low-stock         # Low stock report
GET    /api/reports/valuation         # Inventory valuation
GET    /api/reports/movement          # Stock movement report
GET    /api/reports/expiry            # Expiry report
GET    /api/reports/abc-analysis      # ABC analysis
```

### User & Auth APIs

```
POST   /api/auth/login                # User login
POST   /api/auth/logout               # User logout
POST   /api/auth/refresh              # Refresh JWT token
GET    /api/users                     # List users
POST   /api/users                     # Create user
PUT    /api/users/:id                 # Update user
DELETE /api/users/:id                 # Delete user
GET    /api/roles                     # List roles
```

## 7.4 UI Component List

### Dashboard
- Stats Cards (Total Products, Stock Value, Alerts)
- Low Stock Widget
- Expiry Alert Widget
- Quick Action Buttons
- Recent Activity Feed
- Charts (Stock by Category, Value Distribution)

### Product Management
- Product List (Table with search, filter, sort)
- Product Form (Add/Edit)
- Product Detail View
- Barcode Scanner Component
- Bulk Import Component

### Stock Operations
- Stock Receive Form
- Stock Dispatch Form
- Stock Levels Table
- Stock Ledger Viewer
- Batch/Lot Tracker

### Reports
- Report Generator (with filters)
- Report Viewer (PDF/Excel preview)
- Report Download
- Scheduled Reports Configuration

### Alerts & Notifications
- Notification Bell with Badge
- Alert List
- Alert Detail Modal
- Alert Configuration Panel

### Administration
- User Management Table
- Role Management
- System Settings
- Backup Management

## 7.5 Validation & Error Handling Rules

✅ Provided in Section 4.2

## 7.6 Test Cases

### Stock Workflows Test Cases

#### TC-001: Add New Product
```
Test: Create product with valid data
Steps:
1. Navigate to Products → Add Product
2. Fill all required fields
3. Submit form
Expected: Product created successfully, shown in product list
```

#### TC-002: Prevent Duplicate SKU
```
Test: Cannot create product with existing SKU
Steps:
1. Try to create product with SKU that already exists
Expected: Error message "SKU already exists"
```

#### TC-003: Stock In Transaction
```
Test: Receive stock successfully
Steps:
1. Navigate to Stock → Receive
2. Select product, enter quantity = 100
3. Submit
Expected: 
- Stock in transaction created
- Product current_stock increased by 100
- Ledger entry created
```

#### TC-004: Prevent Negative Stock
```
Test: Cannot dispatch more than available stock
Steps:
1. Product has current_stock = 50
2. Try to dispatch quantity = 60
Expected: Error "Insufficient stock. Available: 50"
```

#### TC-005: Low Stock Alert
```
Test: Alert created when stock falls below reorder level
Steps:
1. Product has current_stock = 15, reorder_level = 10
2. Dispatch quantity = 10 (new stock = 5)
Expected: 
- Stock dispatched successfully
- Low stock alert created
- Alert visible on dashboard
```

#### TC-006: Threshold Alert
```
Test: Alert created when stock reaches reorder level
Steps:
1. Product has current_stock = 12, reorder_level = 10
2. Dispatch quantity = 2 (new stock = 10)
Expected: LOW_STOCK alert created
```

#### TC-007: Critical Stock Alert
```
Test: Critical alert for very low stock
Steps:
1. Product has reorder_level = 10
2. Dispatch until current_stock = 5 (50% of reorder)
Expected: CRITICAL_STOCK alert created
```

#### TC-008: Report Generation
```
Test: Generate stock summary report
Steps:
1. Navigate to Reports
2. Select "Stock Summary"
3. Choose date range
4. Select format: PDF
Expected: Report generated and downloadable
```

#### TC-009: Batch Tracking
```
Test: Stock dispatched from correct batch (FIFO)
Steps:
1. Product has 2 batches:
   - Batch A: 50 units, received 2025-01-01
   - Batch B: 30 units, received 2025-01-15
2. Dispatch 60 units
Expected:
- 50 units deducted from Batch A (fully consumed)
- 10 units deducted from Batch B
```

#### TC-010: Role-Based Access
```
Test: Viewer cannot add stock
Steps:
1. Login as Viewer role
2. Try to access Stock → Receive page
Expected: Access denied or button not visible
```

---

# 8. TECH STACK RECOMMENDATIONS

## Option 1: MERN Stack (Recommended for Modern Web Apps)

**Stack:**
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- ORM: Prisma or TypeORM
- Auth: JWT + Passport.js
- Cache: Redis

**Pros:**
✅ JavaScript/TypeScript across full stack
✅ Large ecosystem and community
✅ Fast development with React
✅ Real-time capabilities (Socket.io)
✅ Good for responsive/mobile-friendly UI
✅ PostgreSQL ensures data integrity

**Cons:**
❌ Node.js single-threaded (mitigated with clustering)
❌ Requires good architecture to avoid callback hell

**Best For:**
- Startups and SMBs
- Teams familiar with JavaScript
- Need for rapid development
- Real-time features desired

---

## Option 2: Python Django Stack

**Stack:**
- Frontend: React + TypeScript
- Backend: Python + Django + Django REST Framework
- Database: PostgreSQL
- ORM: Django ORM
- Auth: Django Auth + JWT
- Cache: Redis

**Pros:**
✅ Django's "batteries included" philosophy
✅ Excellent admin panel out-of-box
✅ Strong ORM with migrations
✅ Great for data-heavy applications
✅ Good security defaults
✅ Python excellent for data analytics/ML

**Cons:**
❌ Slower than Node.js for I/O operations
❌ Two different languages (Python + JavaScript)
❌ Larger deployment footprint

**Best For:**
- Teams with Python expertise
- Need for built-in admin interface
- Data analytics requirements
- Enterprises preferring Python

---

## Option 3: Modern Serverless (Cloud-Native)

**Stack:**
- Frontend: Next.js (React) deployed to Vercel/Netlify
- Backend: AWS Lambda / Google Cloud Functions
- Database: AWS RDS PostgreSQL / Supabase
- Auth: Auth0 / AWS Cognito
- Storage: AWS S3
- Cache: AWS ElastiCache

**Pros:**
✅ Auto-scaling (pay for what you use)
✅ No server management
✅ Global CDN for frontend
✅ Built-in high availability
✅ Cost-effective for variable load

**Cons:**
❌ Vendor lock-in
❌ Cold start latency
❌ Complex debugging
❌ Cost can escalate with high usage

**Best For:**
- Startups with limited DevOps
- Variable/unpredictable load
- Global user base
- Cloud-first organizations

---

## Recommended Choice: **Option 1 - MERN with PostgreSQL**

**Rationale:**
- Best balance of performance, developer experience, and ecosystem
- TypeScript ensures type safety across stack
- React provides excellent UX with component reusability
- PostgreSQL ensures data integrity with ACID compliance
- Easy to find developers
- Cost-effective hosting options (VPS, cloud, on-premise)
- Can start small and scale as needed

---

## CONCLUSION

This comprehensive inventory management system design provides:

✅ **Robust Data Model** - Normalized schema with audit trails
✅ **Complete API Specification** - RESTful endpoints for all operations
✅ **User-Centric UI/UX** - Intuitive workflows with validation
✅ **Scalability** - Design supports growth to thousands of SKUs
✅ **Security** - Multi-layer security with RBAC
✅ **Reliability** - Backup strategy and disaster recovery
✅ **Extensibility** - Modular design for future enhancements

**Implementation Timeline Estimate:**
- Phase 1 (Core Features): 8-10 weeks
- Phase 2 (Advanced Features): 6-8 weeks
- Phase 3 (Polish & Testing): 4 weeks
- **Total: 18-22 weeks (4-5 months)**

**Team Recommendation:**
- 1 Backend Developer
- 1 Frontend Developer
- 1 Full-Stack Developer
- 1 UI/UX Designer (part-time)
- 1 QA Engineer (part-time)
- 1 DevOps Engineer (part-time)

---

**Document End**
