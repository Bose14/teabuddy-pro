# Project Brief: TeaBuddy Pro

## Project Overview
A comprehensive web application for managing a tea shop's daily operations, including sales, expenses, stock, salary, and profit tracking with analytics.

## Core Requirements

### 1. Daily Cash Flow System
- Track cash and online (GPay/UPI) sales separately
- Online payments settle to bank daily, reset to 0 each morning
- Cash carries forward daily
- Track: Yesterday Cash, Today Cash Sales, Today Online Sales, Today Total Expenses, Closing Cash
- Auto-calculate: Daily Sales, Daily Profit, Expected Closing Cash
- Show mismatch alerts when Expected ≠ Actual Closing Cash

### 2. Expense Management
- Categories: Milk, Oil, Sugar, Vegetables, Salary, Rent, Electricity, Gas, Others
- Payment methods: Cash/Online
- Track vendor names and notes
- Auto-calculate: Daily, Weekly, Monthly, Overall expenses

### 3. Salary Management
- Employee records: Name, Role, Monthly Salary
- Track: Salary Paid, Advance Given, Salary Due
- Auto-add salary payments to expenses

### 4. Stock Management
- Categories:
  - Raw Materials: Milk, Tea Powder, Coffee Powder, Sugar, Oil, Flour, Vegetables
  - Resale Items: Biscuits, Cakes, Ice Cream, Cool Drinks
- Track: Opening Stock, Purchased, Used/Sold, Closing Stock (auto-calculated)
- Purchase/Selling prices, Expiry dates
- Low stock and expiry alerts

### 5. Sales Entry
- Daily form with Cash Sales, Online Sales, Notes
- Independent from balance calculations (balances for verification only)

### 6. Dashboard & Reports
- Display: Daily, Weekly, Monthly, Overall metrics
- Charts: Sales vs Expenses, Profit Trend, Cash vs Online %
- Filters: Date Range, Month
- Export: PDF and Excel

### 7. User Roles
- Owner: Full access
- Staff: Sales & expenses only

### 8. Extra Features
- Daily Bank Settlement Report for Online Sales
- Cash Mismatch Alerts
- Automatic Daily Data Backup
- Ready for Multi-Shop Support

### 9. UI Requirements
- Simple, clean design
- Mobile-friendly
- Fast data entry
- Tamil + English labels (bilingual)

## Technology Stack
- Frontend: React + TypeScript + Vite
- UI: shadcn/ui components + Tailwind CSS
- Backend: Supabase (PostgreSQL)
- State: React Query (@tanstack/react-query)
- Charts: Recharts
- Export: jsPDF, xlsx

## Success Criteria
- Quick daily entry workflow
- Accurate auto-calculations
- Clear alerts for discrepancies
- Comprehensive reporting
- Mobile-responsive interface
