export const EXPENSE_TYPES = [
  "Milk",
  "Brownie",
  "Ice Cream",
  "Cauli Flower",
  "Samosa",
  "Malligai",
  "Banana Cake",
  "Buscuits",
  "Oil", 
  "Maavu Araika",
  "Cylinder",
  "Sugar",
  "Vegetables",
  "Salary",
  "Rent",
  "Electricity",
  "Gas",
  "Tea Powder",
  "Coffee Powder",
  "Cups",
  "Transport",
  "Maintenance",
  "Others"
] as const;

export const PAYMENT_METHODS = ["Cash", "Online"] as const;

export const STOCK_CATEGORIES = {
  "Tea/Coffee Products": [
    "Tea Powder",
    "Coffee Powder",
    "Tea Bags",
    "Coffee Beans",
    "Green Tea",
    "Masala Tea Mix"
  ],
  "Malligai Raw Material": [
    "Milk",
    "Sugar",
    "Condensed Milk",
    "Milk Powder"
  ],
  "Vegetables": [
    "Onions",
    "Potatoes",
    "Tomatoes",
    "Curry Leaves",
    "Coriander",
    "Green Chillies"
  ],
  "Cakes": [
    "Banana Cake",
    "Tea Cake",
    "Plum Cake",
    "Chocolate Cake",
    "Vanilla Cake"
  ],
  "Biscuits": [
    "Parle G",
    "Good Day",
    "Marie",
    "Bourbon",
    "Tiger",
    "Cream Biscuits"
  ],
  "Ice cream": [
    "Milky Mist - Vanilla",
    "Milky Mist - Chocolate",
    "Milky Mist - Strawberry",
    "Arun Ice Cream",
    "Cornetto",
    "Ice Candy"
  ],
  "Juice": [
    "Frooti",
    "Maaza",
    "Real Juice",
    "Slice",
    "Tropicana"
  ],
  "Gas Cylinders": [
    "LPG Cylinder - Full",
    "LPG Cylinder - Empty",
    "Gas Stove",
    "Gas Regulator",
    "Gas Pipe/Tube"
  ],
  "Others": [
    "Paper Cups",
    "Plastic Cups",
    "Spoons",
    "Napkins",
    "Tissue Paper",
    "Cleaning Supplies",
    "Disposable Plates",
    "Carry Bags",
    "Straws",
    "Containers"
  ]
} as const;

// Category names array for dropdowns
export const STOCK_CATEGORY_NAMES = [
  "Tea/Coffee Products",
  "Malligai Raw Material",
  "Vegetables",
  "Cakes",
  "Biscuits",
  "Ice cream",
  "Juice",
  "Gas Cylinders",
  "Others"
] as const;

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
