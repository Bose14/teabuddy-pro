import { Home, Calendar, TrendingDown, Menu, Package, Users, FileText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/daily-entry", icon: Calendar, label: "Daily Entry" },
  { to: "/expenses", icon: TrendingDown, label: "Expenses" },
  { to: "/employees", icon: Users, label: "Employees" },
  { to: "/stock", icon: Package, label: "Stock" },
  { to: "/reports", icon: FileText, label: "Reports" },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <>
      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-card border-b z-50">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold text-primary">Tea Shop Manager</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-2 mt-8">
                {navItems.map((item) => (
                  <Link key={item.to} to={item.to}>
                    <Button
                      variant={location.pathname === item.to ? "default" : "ghost"}
                      className="w-full justify-start gap-2"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 bg-card border-b z-50 px-6 h-16 items-center gap-6">
        <h1 className="text-xl font-bold text-primary mr-8">Tea Shop Manager</h1>
        {navItems.map((item) => (
          <Link key={item.to} to={item.to}>
            <Button
              variant={location.pathname === item.to ? "default" : "ghost"}
              className="gap-2"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
    </>
  );
};
