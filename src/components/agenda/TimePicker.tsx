import { useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const ITEM_H = 44;
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

interface WheelColProps {
  items: string[];
  value: string;
  onChange: (v: string) => void;
}

function WheelCol({ items, value, onChange }: WheelColProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // Set initial scroll position (no animation)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = items.indexOf(value);
    if (idx >= 0) el.scrollTop = idx * ITEM_H;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to value when changed externally
  useEffect(() => {
    if (isScrolling.current) return;
    const el = ref.current;
    if (!el) return;
    const idx = items.indexOf(value);
    if (idx >= 0) el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
  }, [value, items]);

  const handleScroll = useCallback(() => {
    isScrolling.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      isScrolling.current = false;
      const el = ref.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
      onChange(items[clamped]);
    }, 120);
  }, [items, onChange]);

  return (
    <div className="relative flex-1 select-none">
      {/* Fade top */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none z-10"
        style={{ height: ITEM_H * 2, background: "linear-gradient(to bottom, white 30%, transparent)" }}
      />
      {/* Fade bottom */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none z-10"
        style={{ height: ITEM_H * 2, background: "linear-gradient(to top, white 30%, transparent)" }}
      />
      {/* Selected highlight */}
      <div
        className="absolute inset-x-2 pointer-events-none z-10 rounded-xl"
        style={{ top: ITEM_H * 2, height: ITEM_H, backgroundColor: "#D6F3A1" }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="[&::-webkit-scrollbar]:hidden"
        style={{
          height: ITEM_H * 5,
          overflowY: "scroll",
          scrollbarWidth: "none",
        }}
      >
        <div style={{ height: ITEM_H * 2 }} />
        {items.map((item) => (
          <div
            key={item}
            style={{ height: ITEM_H }}
            className="flex items-center justify-center cursor-pointer"
            onClick={() => {
              const idx = items.indexOf(item);
              ref.current?.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
              onChange(item);
            }}
          >
            <span className="text-xl font-semibold text-[#1C1C1E]">{item}</span>
          </div>
        ))}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  );
}

interface TimePickerProps {
  value: string;
  onChange: (val: string) => void;
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const hour = value ? value.split(":")[0] : "08";
  const rawMinute = value ? value.split(":")[1] : "00";
  // Snap minute to nearest 5-min increment
  const minute = MINUTES.reduce((prev, curr) =>
    Math.abs(parseInt(curr) - parseInt(rawMinute)) < Math.abs(parseInt(prev) - parseInt(rawMinute)) ? curr : prev
  );

  const handleHour = useCallback(
    (h: string) => onChange(`${h}:${minute}`),
    [minute, onChange]
  );

  const handleMinute = useCallback(
    (m: string) => onChange(`${hour}:${m}`),
    [hour, onChange]
  );

  return (
    <div className="space-y-2">
      <div
        className="flex items-center overflow-hidden"
        style={{
          border: "1px solid #E5E5EA",
          borderRadius: 12,
          background: "white",
          height: ITEM_H * 5,
        }}
      >
        <WheelCol items={HOURS} value={hour} onChange={handleHour} />
        <div
          className="flex items-center justify-center font-bold text-[#1C1C1E] shrink-0"
          style={{ width: 20, fontSize: 22 }}
        >
          :
        </div>
        <WheelCol items={MINUTES} value={minute} onChange={handleMinute} />
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
