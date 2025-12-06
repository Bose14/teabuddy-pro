import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertBadgeProps {
  type: "success" | "warning" | "error" | "info";
  message: string;
  className?: string;
}

const styles = {
  success: {
    bg: "bg-success/10 border-success/30",
    text: "text-success",
    icon: CheckCircle,
  },
  warning: {
    bg: "bg-warning/10 border-warning/30",
    text: "text-warning",
    icon: AlertTriangle,
  },
  error: {
    bg: "bg-destructive/10 border-destructive/30",
    text: "text-destructive",
    icon: XCircle,
  },
  info: {
    bg: "bg-info/10 border-info/30",
    text: "text-info",
    icon: Info,
  },
};

export function AlertBadge({ type, message, className }: AlertBadgeProps) {
  const { bg, text, icon: Icon } = styles[type];
  
  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-3 rounded-lg border animate-fade-in",
      bg,
      className
    )}>
      <Icon className={cn("h-5 w-5 flex-shrink-0", text)} />
      <span className={cn("text-sm font-medium", text)}>{message}</span>
    </div>
  );
}