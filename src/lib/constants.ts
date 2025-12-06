export const EXPENSE_TYPES = [
  "Milk",
  "Oil", 
  "Sugar",
  "Vegetables",
  "Salary",
  "Rent",
  "Electricity",
  "Gas",
  "Tea Powder",
  "Coffee Powder",
  "Cups/Supplies",
  "Transport",
  "Maintenance",
  "Others"
] as const;

export const PAYMENT_METHODS = ["Cash", "Online"] as const;

export const STOCK_CATEGORIES = {
  "Raw Materials": [
    "Milk",
    "Tea Powder",
    "Coffee Powder",
    "Sugar",
    "Oil",
    "Flour",
    "Vegetables",
    "Gas Cylinder",
    "Cups",
    "Tissues"
  ],
  "Resale Items": [
    "Biscuits - Parle G",
    "Biscuits - Good Day",
    "Biscuits - Marie",
    "Cakes",
    "Ice Cream",
    "Cool Drinks - Pepsi",
    "Cool Drinks - Coca Cola",
    "Cool Drinks - Sprite",
    "Chips",
    "Chocolates"
  ]
} as const;

export const STOCK_UNITS = [
  "kg",
  "liters",
  "pieces",
  "packets",
  "boxes",
  "bottles",
  "cylinders"
] as const;

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
] as const;