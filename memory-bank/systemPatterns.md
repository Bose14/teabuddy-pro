# System Patterns

## Architecture Overview

### Frontend Architecture
```
React SPA (Single Page Application)
├── Pages (Route Components)
├── Components (Reusable UI)
├── Hooks (Business Logic & Data Fetching)
├── Integrations (External Services)
└── Lib (Utilities & Constants)
```

### Data Flow Pattern
1. **User Action** → Component
2. **Component** → Custom Hook (useQuery/useMutation)
3. **Hook** → Supabase Client
4. **Supabase** → PostgreSQL Database
5. **Response** → React Query Cache → Component Update

## Key Technical Decisions

### Database Design

#### Computed Columns Pattern
The `daily_cash_flow` table uses PostgreSQL GENERATED ALWAYS AS for auto-calculations:
```sql
daily_sales = closing_cash + online_sales + total_expenses - yesterday_cash
daily_profit = daily_sales - total_expenses
expected_closing_cash = yesterday_cash + cash_sales - cash_expenses
```

**Why**: Ensures calculations are always accurate and consistent, reduces frontend complexity.

#### Separate Transaction Tables
- `expenses` - All expense transactions
- `salary_payments` - Salary-specific transactions
- `stock_transactions` - Stock movement history

**Why**: Maintains audit trail, enables detailed reporting, prevents data loss on edits.

### Component Patterns

#### Page Structure
Each page follows this pattern:
```tsx
export default function PageName() {
  // 1. State management
  const [formData, setFormData] = useState()
  
  // 2. Data fetching with React Query
  const { data, isLoading } = useQuery(...)
  
  // 3. Mutations for updates
  const mutation = useMutation(...)
  
  // 4. Event handlers
  const handleSubmit = () => {...}
  
  // 5. Render UI
  return <div>...</div>
}
```

#### Form Handling
- Controlled components (value + onChange)
- Manual state management (no react-hook-form yet)
- Optimistic updates disabled (wait for server confirmation)
- Toast notifications for success/error

### Data Management

#### React Query Strategy
```typescript
// Query Keys Pattern
["entity-name"]              // List all
["entity-name", id]          // Single item
["entity-name", "range", start, end]  // Filtered list
["dashboard-stats", date]    // Computed stats
```

**Cache Invalidation**: After mutations, invalidate related queries:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["daily-cash-flow"] })
  queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
}
```

#### Supabase Patterns
- RLS (Row Level Security) enabled but open policies (auth coming later)
- Direct client queries (no API layer)
- Real-time subscriptions not implemented yet
- `maybeSingle()` for queries that may return 0 or 1 row

### Critical Implementation Paths

#### Daily Entry Flow
```
1. User loads page
2. Fetch yesterday's closing cash (auto-populate)
3. Fetch today's existing entry if any
4. User enters: cash sales, online sales, closing cash
5. Backend fetches expenses for date
6. Calculate: cash_expenses, online_expenses, total_expenses
7. Save to daily_cash_flow (upsert pattern)
8. PostgreSQL generates: daily_sales, daily_profit, expected_closing_cash
9. UI shows mismatch alert if closing ≠ expected
```

#### Expense-to-DailyCashFlow Sync
**Current Issue**: Expenses don't auto-update daily_cash_flow totals.

**Solution Needed**: Database trigger or hook to recalculate when expenses change.

#### Stock Calculation
```
closing_stock = opening_stock + purchased_qty - used_sold_qty
```
Stored as GENERATED column, updates automatically.

### Component Relationships

#### Dashboard Dependencies
```
Dashboard
├── Uses: useDashboardStats hook
├── Fetches: daily_cash_flow table
└── Displays: StatsCard components
```

**Issue**: Currently fetches old `sales` and `milk_usage` tables that should be deprecated.

#### Stock Management Flow
```
Stock Page
├── View: List all stock items
├── Add: Dialog with full item details
├── Update: Quick purchase/use buttons
│   └── Creates stock_transaction record
│   └── Updates purchased_qty or used_sold_qty
│   └── closing_stock recalculates automatically
└── Alerts: Low stock & expiry warnings computed in hook
```

### UI/UX Patterns

#### Color System
- **Primary**: Brand/action color
- **Success** (Green): Profit, income, positive balance
- **Destructive** (Red): Expenses, loss, alerts
- **Warning** (Amber): Low stock, expiry soon
- **Info** (Blue): Online payments, informational

#### Responsive Strategy
- Desktop: Sidebar navigation (lg:ml-64)
- Mobile: Bottom navigation or hamburger
- Forms: Stack vertically on mobile, grid on desktop
- Tables: Horizontal scroll on mobile

#### Loading States
- Skeleton loaders not fully implemented
- Simple "Loading..." text in most places
- Button disabled states with spinner on mutations

### Security Patterns

#### Current State
- No authentication implemented
- RLS enabled but policies allow all operations
- No user context in queries
- No role-based access control

#### Planned Enhancement
- Supabase Auth for user management
- RLS policies by user/shop
- Role field in users table (Owner/Staff)
- Conditional UI based on role

### Performance Considerations

#### Query Optimization
- Indexes on: date columns, foreign keys, category fields
- No pagination implemented (assumes small dataset)
- No virtual scrolling for long lists

#### State Management
- React Query handles caching
- No global state (Redux/Zustand)
- Props drilling minimal due to flat component structure

## Design Patterns in Use

### Repository Pattern (via Hooks)
Custom hooks encapsulate data access logic:
- `useDailyCashFlow(date)` - Single day
- `useExpenses()` - All expenses
- `useStock()` - All stock items

### Mutation Pattern
Consistent mutation structure:
```typescript
const mutation = useMutation({
  mutationFn: async (data) => { /* Supabase operation */ },
  onSuccess: () => { 
    invalidateQueries()
    toast.success()
  },
  onError: (error) => {
    toast.error(error.message)
  }
})
```

### Dialog/Modal Pattern
- shadcn Dialog component
- Controlled by local state
- Form inside dialog
- Reset on close

### Alert Pattern
Custom `AlertBadge` component for warnings:
```tsx
<AlertBadge 
  type="warning|error|info" 
  message="..." 
/>
```

## Integration Points

### Supabase Integration
- Single client instance (`@/integrations/supabase/client`)
- Type definitions from Supabase CLI
- Environment variables for project URL & anon key

### Export Integration
- **PDF**: jsPDF + jspdf-autotable
- **Excel**: xlsx library
- Generated client-side from query results

### Chart Integration
- Recharts library
- Not yet implemented in Dashboard
- Planned: Bar, Line, Pie charts
