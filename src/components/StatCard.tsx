import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: "default" | "success" | "danger" | "info" | "warning";
  className?: string;
}

const variantStyles = {
  default: "bg-card border-border",
  success: "bg-success/10 border-success/30",
  danger: "bg-destructive/10 border-destructive/30",
  info: "bg-info/10 border-info/30",
  warning: "bg-warning/10 border-warning/30",
};

const iconStyles = {
  default: "text-muted-foreground bg-secondary",
  success: "text-success bg-success/20",
  danger: "text-destructive bg-destructive/20",
  info: "text-info bg-info/20",
  warning: "text-warning bg-warning/20",
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = "default",
  className 
}: StatCardProps) {
  return (
    <div className={cn(
      "stat-card border animate-fade-in",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">
            {typeof value === "number" ? `₹${value.toLocaleString("en-IN")}` : value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "p-2.5 rounded-lg",
            iconStyles[variant]
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}