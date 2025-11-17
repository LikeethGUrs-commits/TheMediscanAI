import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, Flame } from "lucide-react";

type RiskLevel = "low" | "medium" | "high" | "critical";

interface RiskBadgeProps {
  level: RiskLevel;
  showIcon?: boolean;
}

export function RiskBadge({ level, showIcon = true }: RiskBadgeProps) {
  const config = {
    low: {
      label: "Low Risk",
      icon: Info,
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    },
    medium: {
      label: "Medium Risk",
      icon: AlertCircle,
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    },
    high: {
      label: "High Risk",
      icon: AlertTriangle,
      className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    },
    critical: {
      label: "Critical",
      icon: Flame,
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    },
  };

  const { label, icon: Icon, className } = config[level];

  return (
    <Badge className={`${className} border font-medium`} data-testid={`badge-risk-${level}`}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  );
}
