# Technical Context

## Technology Stack

### Frontend Framework
- **React 18.3.1** - UI library
- **TypeScript 5.8.3** - Type safety
- **Vite 5.4.19** - Build tool & dev server

### UI Components
- **shadcn/ui** - Pre-built accessible components
- **Radix UI** - Headless UI primitives
- **Tailwind CSS 3.4.17** - Utility-first styling
- **Lucide React** - Icon library

### State Management & Data Fetching
- **@tanstack/react-query 5.83.0** - Server state management
  - Handles caching, background updates, stale data
  - Query invalidation for data consistency
  - Loading and error states

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Auto-generated REST API
  - Real-time subscriptions (not yet used)

### Form Handling
- **react-hook-form 7.61.1** - Installed but not yet used
- **zod 3.25.76** - Schema validation (installed, not used)
- **@hookform/resolvers 3.10.0** - Bridge between react-hook-form and zod

### Charting
- **Recharts 2.15.4** - React charting library
  - Installed but not yet implemented
  - Planned for dashboard analytics

### Export Functionality
- **jsPDF 3.0.3** - PDF generation
- **jspdf-autotable 5.0.2** - Table formatting for PDFs
- **xlsx 0.18.5** - Excel file generation

### Routing
- **react-router-dom 6.30.1** - Client-side routing
  - Pages: Dashboard, DailyEntry, Expenses, Employees, Stock, Reports
  - No authentication guards yet

### Date Handling
- **date-fns 3.6.0** - Date utilities
  - Format dates for display
  - Calculate date ranges (week, month)
  - Add/subtract days

### Notifications
- **sonner 1.7.4** - Toast notifications
  - Success/error messages
  - Auto-dismiss

## Development Setup

### Environment Variables
Required in `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Available Scripts
```bash
npm run dev        # Start dev server (Vite)
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint check
```

### Project Structure
```
teabuddy-pro/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn components
│   │   ├── AlertBadge.tsx
│   │   ├── Navigation.tsx
│   │   ├── StatCard.tsx
│   │   └── StatsCard.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useDailyCashFlow.ts
│   │   ├── useExpenses.ts
│   │   ├── useEmployees.ts
│   │   ├── useStock.ts
│   │   └── use-toast.ts
│   ├── integrations/
│   │   └── supabase/    # Supabase client & types
│   ├── lib/
│   │   ├── constants.ts # App constants
│   │   └── utils.ts     # Utility functions
│   ├── pages/           # Route components
│   │   ├── Dashboard.tsx
│   │   ├── DailyEntry.tsx
│   │   ├── Expenses.tsx
│   │   ├── Employees.tsx
│   │   ├── Stock.tsx
│   │   └── Reports.tsx
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── supabase/
│   ├── config.toml
│   └── migrations/      # Database migrations
├── public/              # Static assets
└── package.json
```

## Database Schema

### Tables

#### `daily_cash_flow`
- Stores daily financial summary
- Has GENERATED columns for auto-calculations
- Unique constraint on `date`

#### `expenses`
- All expense transactions
- Links to employees for salary payments (`employee_id`)
- Categorized by `expense_type`

#### `employees`
- Employee master data
- Tracks `monthly_salary`, `advance_given`
- Soft delete with `is_active` flag

#### `salary_payments`
- Individual salary/advance payments
- Links to `employees` via foreign key
- Tracks month/year for period

#### `stock`
- Inventory items
- GENERATED `closing_stock` column
- Categories: Raw Materials, Resale Items

#### `stock_transactions`
- Audit trail for stock changes
- Links to `stock` items
- Records purchase/use transactions

### Database Functions
```sql
update_updated_at_column()
```
Trigger function to auto-update `updated_at` timestamp.

### Indexes
- `idx_daily_cash_flow_date` on daily_cash_flow(date)
- `idx_expenses_date` on expenses(date)
- `idx_expenses_type` on expenses(expense_type)
- `idx_stock_category` on stock(category)
- `idx_salary_payments_employee` on salary_payments(employee_id)

## Technical Constraints

### Browser Support
- Modern browsers only (ES2020+)
- No IE11 support
- Mobile browsers (Chrome, Safari on iOS/Android)

### Performance
- Small dataset assumed (single shop, < 10,000 records)
- No pagination implemented
- All queries fetch full datasets
- React Query caching reduces API calls

### Offline Support
- Not implemented
- Requires network connection
- Future: Service workers, local storage sync

### File Size
- PDF reports < 5MB typical
- Excel exports < 2MB typical
- No image uploads in current scope

## Dependencies to Note

### Peer Dependencies
All Radix UI components have React 18 as peer dependency.

### Potential Conflicts
None identified. All packages compatible.

### Version Locking
- Using `package-lock.json` for reproducible builds
- `bun.lockb` also present (if using Bun runtime)

## Build Configuration

### Vite Config
- React plugin with SWC compiler
- Path aliases: `@/` maps to `src/`
- Development server on port 5173 (default)

### TypeScript Config
- Strict mode enabled
- Target: ES2020
- Module: ESNext
- JSX: react-jsx

### Tailwind Config
- Custom colors for success/destructive/warning
- Typography plugin included
- Animations plugin included

## API Integration

### Supabase Client
```typescript
import { supabase } from "@/integrations/supabase/client"

// Query
const { data, error } = await supabase
  .from("table_name")
  .select("*")
  .eq("column", value)

// Insert
const { error } = await supabase
  .from("table_name")
  .insert({ ... })

// Update
const { error } = await supabase
  .from("table_name")
  .update({ ... })
  .eq("id", id)
```

### React Query Integration
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["key", params],
  queryFn: async () => {
    // Supabase query
  }
})

const mutation = useMutation({
  mutationFn: async (data) => {
    // Supabase mutation
  },
  onSuccess: () => {
    queryClient.invalidateQueries()
  }
})
```

## Development Workflow

1. Start Supabase locally (optional) or use cloud instance
2. Run migrations: `supabase db push` (if local)
3. Generate types: `supabase gen types typescript`
4. Start dev server: `npm run dev`
5. Make changes, hot-reload automatically
6. Test in browser at `localhost:5173`

## Known Issues

### Migration History
- Old `sales` and `milk_usage` tables exist but unused
- Dashboard still queries these deprecated tables
- Need migration to drop old tables after data migration

### Type Safety
- Supabase types need regeneration after schema changes
- Some `any` types in older code
- No runtime validation on forms yet

### Error Handling
- Basic error handling with toast messages
- No retry logic
- No error boundaries
- No logging/monitoring

## Future Technical Enhancements

### Short Term
- Implement react-hook-form + zod validation
- Add error boundaries
- Implement proper loading skeletons
- Database triggers for auto-sync

### Medium Term
- Add Supabase Auth
- Real-time subscriptions for multi-user
- Service worker for offline support
- API rate limiting/caching

### Long Term
- Migrate to Next.js for SSR
- GraphQL instead of REST
- Analytics/monitoring (Sentry, PostHog)
- Automated testing (Vitest, Playwright)
