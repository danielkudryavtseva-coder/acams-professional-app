import * as React from "react";
import { cn } from "./utils";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface DashboardCellProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  value?: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

const DashboardCell = React.forwardRef<HTMLDivElement, DashboardCellProps>(
  ({ className, title, value, description, icon, trend, trendValue, children, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn("bg-white", className)} {...props}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </CardHeader>
        <CardContent>
          {value !== undefined && (
            <div className="text-2xl font-bold">{value}</div>
          )}
          {trendValue && (
            <p className={cn(
              "text-xs mt-1",
              trend === "up" && "text-[#c63f60]",
              trend === "down" && "text-[#2f2e2e]",
              trend === "neutral" && "text-muted-foreground"
            )}>
              {trendValue}
            </p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {children}
        </CardContent>
      </Card>
    );
  }
);
DashboardCell.displayName = "DashboardCell";

export { DashboardCell };
