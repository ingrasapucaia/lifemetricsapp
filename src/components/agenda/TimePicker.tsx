import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TimePickerProps {
  value: string;
  onChange: (val: string) => void;
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const [hour, minute] = value ? value.split(":") : ["", ""];
  const minuteRef = useRef<HTMLInputElement>(null);

  const clamp = (v: number, max: number) => Math.max(0, Math.min(max, v));

  const handleHour = useCallback((raw: string) => {
    const n = raw.replace(/\D/g, "").slice(0, 2);
    if (n === "") { onChange(""); return; }
    const h = clamp(Number(n), 23).toString().padStart(2, "0");
    onChange(`${h}:${minute || "00"}`);
  }, [minute, onChange]);

  const handleMinute = useCallback((raw: string) => {
    const n = raw.replace(/\D/g, "").slice(0, 2);
    if (n === "") { onChange(`${hour || "08"}:00`); return; }
    const m = clamp(Number(n), 59).toString().padStart(2, "0");
    onChange(`${hour || "08"}:${m}`);
  }, [hour, onChange]);

  const onHourKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ":" || e.key === "Tab") {
      e.preventDefault();
      minuteRef.current?.focus();
      minuteRef.current?.select();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="08"
          value={hour}
          onChange={(e) => handleHour(e.target.value)}
          onBlur={(e) => { if (e.target.value && value) handleHour(e.target.value); }}
          onFocus={(e) => e.target.select()}
          onKeyDown={onHourKeyDown}
          className="w-14 h-10 rounded-md border border-input bg-background text-center text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <span className="text-base font-semibold text-muted-foreground">:</span>
        <input
          ref={minuteRef}
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="00"
          value={minute}
          onChange={(e) => handleMinute(e.target.value)}
          onBlur={(e) => { if (e.target.value && value) handleMinute(e.target.value); }}
          onFocus={(e) => e.target.select()}
          className="w-14 h-10 rounded-md border border-input bg-background text-center text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
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
