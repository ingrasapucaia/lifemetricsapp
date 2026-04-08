import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"));

interface TimePickerProps {
  value: string;
  onChange: (val: string) => void;
}

function ScrollColumn({ items, selected, onSelect }: { items: string[]; selected: string; onSelect: (v: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ITEM_H = 36;

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (idx >= 0 && containerRef.current) {
      containerRef.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    }
  }, [selected, items]);

  return (
    <div
      ref={containerRef}
      className="h-[144px] overflow-y-auto snap-y snap-mandatory flex-1"
      style={{ scrollbarWidth: "none" }}
    >
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onSelect(item)}
          className={cn(
            "w-full h-9 flex items-center justify-center text-sm snap-start transition-all",
            selected === item
              ? "bg-muted rounded-xl font-semibold text-foreground"
              : "text-muted-foreground/60 hover:text-muted-foreground"
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const [hour, minute] = value ? value.split(":") : ["08", "00"];

  const setHour = useCallback((h: string) => {
    onChange(`${h}:${minute || "00"}`);
  }, [minute, onChange]);

  const setMinute = useCallback((m: string) => {
    onChange(`${hour || "08"}:${m}`);
  }, [hour, onChange]);

  return (
    <div className="space-y-2">
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-3">
        <div className="flex items-center gap-2">
          <ScrollColumn items={HOURS} selected={hour || "08"} onSelect={setHour} />
          <span className="text-lg font-bold text-muted-foreground/40">:</span>
          <ScrollColumn items={MINUTES} selected={minute || "00"} onSelect={setMinute} />
        </div>
      </div>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground h-7 px-2"
          onClick={() => onChange("")}
        >
          <X size={12} className="mr-1" /> Limpar horário
        </Button>
      )}
    </div>
  );
}
