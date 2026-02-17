import { Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number; // 0-5
  onChange: (v: number) => void;
}

export function WaterDroplets({ value, onChange }: Props) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          onClick={() => onChange(value === i ? i - 1 : i)}
          className={cn(
            "p-1 rounded transition-colors",
            i <= value
              ? "text-blue-500"
              : "text-muted-foreground/30 hover:text-muted-foreground/50"
          )}
        >
          <Droplets
            size={18}
            fill={i <= value ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}
