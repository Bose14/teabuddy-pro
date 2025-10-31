import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import Index from "./pages/Index";
import AddSale from "./pages/AddSale";
import AddExpense from "./pages/AddExpense";
import StockManagement from "./pages/StockManagement";
import MilkTracker from "./pages/MilkTracker";
import PendingBills from "./pages/PendingBills";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/add-sale" element={<AddSale />} />
          <Route path="/add-expense" element={<AddExpense />} />
          <Route path="/stock" element={<StockManagement />} />
          <Route path="/milk-tracker" element={<MilkTracker />} />
          <Route path="/pending-bills" element={<PendingBills />} />
          <Route path="/reports" element={<Reports />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
