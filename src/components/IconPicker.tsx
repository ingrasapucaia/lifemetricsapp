import { useState } from "react";
import { AVAILABLE_ICONS } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LucideIcon } from "@/components/LucideIcon";
import { cn } from "@/lib/utils";

interface Props {
  value?: string;
  onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center justify-center w-10 h-10 rounded border hover:bg-muted transition-colors">
          {value ? (
            <LucideIcon name={value} size={18} className="text-foreground" />
          ) : (
            <span className="text-xs text-muted-foreground">?</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-3" align="start">
        <p className="text-xs text-muted-foreground mb-2">Escolha um ícone</p>
        <div className="grid grid-cols-6 gap-1">
          {AVAILABLE_ICONS.map((name) => (
            <button
              key={name}
              onClick={() => { onChange(name); setOpen(false); }}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded hover:bg-muted transition-colors",
                value === name && "bg-muted ring-1 ring-foreground/20"
              )}
            >
              <LucideIcon name={name} size={18} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
