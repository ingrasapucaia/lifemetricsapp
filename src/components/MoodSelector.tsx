import { MOOD_OPTIONS } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Props {
  value?: string;
  onChange: (label: string) => void;
}

export function MoodSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = MOOD_OPTIONS.find((m) => m.label === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1 text-sm hover:bg-muted px-2 py-1 rounded transition-colors min-w-[80px]">
          {selected ? (
            <Badge className={cn("font-normal capitalize", selected.bg, selected.text, "border-0 hover:opacity-80")}>
              {selected.label}
            </Badge>
          ) : (
            <span className="text-muted-foreground">Selecionar...</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex flex-wrap gap-1.5 max-w-[280px]">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.label}
              onClick={() => { onChange(m.label); setOpen(false); }}
              className="transition-transform hover:scale-105"
            >
              <Badge
                className={cn(
                  "font-normal capitalize cursor-pointer border-0",
                  m.bg, m.text,
                  value === m.label && "ring-2 ring-offset-1 ring-foreground/20"
                )}
              >
                {m.label}
              </Badge>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
