import { getLifeArea } from "@/types";
import { cn } from "@/lib/utils";

interface LifeAreaBadgeProps {
  value?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LifeAreaBadge({ value, size = "sm", className }: LifeAreaBadgeProps) {
  const area = getLifeArea(value);
  if (!area) return null;

  const sizeClasses = {
    sm: "text-[10px] px-2.5 py-0.5",
    md: "text-xs px-3 py-1",
    lg: "text-sm px-4 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        sizeClasses[size],
        className,
      )}
      style={{ backgroundColor: area.bgColor, color: area.textColor }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: area.textColor }}
      />
      {area.label}
    </span>
  );
}
