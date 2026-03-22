import { GoalStatus, getGoalStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: GoalStatus;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
}

export function StatusBadge({ status, size = "sm", onClick, className }: StatusBadgeProps) {
  const config = getGoalStatus(status);
  if (!config) return null;

  const sizeClasses = {
    sm: "text-[10px] px-2.5 py-0.5",
    md: "text-xs px-3 py-1",
    lg: "text-sm px-4 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium whitespace-nowrap transition-colors duration-200",
        sizeClasses[size],
        onClick && "cursor-pointer hover:opacity-80",
        className,
      )}
      style={{ backgroundColor: config.bgColor, color: config.textColor }}
      onClick={onClick}
    >
      {config.label}
      {onClick && " ▾"}
    </span>
  );
}
