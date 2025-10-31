import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  variant?: "sales" | "expense" | "profit";
}

export const StatsCard = ({ title, value, icon: Icon, variant = "sales" }: StatsCardProps) => {
  const variantStyles = {
    sales: "border-primary/20 bg-primary/5",
    expense: "border-destructive/20 bg-destructive/5",
    profit: "border-success/20 bg-success/5",
  };

  const iconStyles = {
    sales: "text-primary bg-primary/10",
    expense: "text-destructive bg-destructive/10",
    profit: "text-success bg-success/10",
  };

  return (
    <Card className={`p-6 ${variantStyles[variant]} border-2`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${iconStyles[variant]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};
