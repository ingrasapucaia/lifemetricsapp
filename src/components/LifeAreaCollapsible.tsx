import { useState } from "react";
import { LIFE_AREAS, getLifeArea } from "@/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LifeAreaCollapsibleProps {
  /** For single-select mode */
  value?: string;
  onValueChange?: (value: string) => void;
  /** For multi-select mode */
  selected?: string[];
  onSelectedChange?: (selected: string[]) => void;
  /** Whether multiple areas can be selected */
  multiple?: boolean;
  label?: string;
}

export default function LifeAreaCollapsible({
  value,
  onValueChange,
  selected = [],
  onSelectedChange,
  multiple = false,
  label = "Área(s) de vida",
}: LifeAreaCollapsibleProps) {
  const [open, setOpen] = useState(false);

  const currentSelected = multiple ? selected : value ? [value] : [];

  const handleSelect = (areaValue: string) => {
    if (multiple) {
      const next = selected.includes(areaValue)
        ? selected.filter((v) => v !== areaValue)
        : [...selected, areaValue];
      onSelectedChange?.(next);
    } else {
      onValueChange?.(areaValue);
      setOpen(false);
    }
  };

  const renderSummary = () => {
    if (currentSelected.length === 0) {
      return <span className="text-muted-foreground">{multiple ? "Nenhuma selecionada" : "Selecionar área de vida"}</span>;
    }
    if (currentSelected.length === 1) {
      const area = getLifeArea(currentSelected[0]);
      if (area) {
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: area.bgColor, color: area.textColor }}
          >
            {area.label}
          </span>
        );
      }
    }
    return <span className="text-sm">{currentSelected.length} áreas selecionadas</span>;
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm transition-colors hover:bg-muted/50">
        {renderSummary()}
        <ChevronDown
          size={16}
          className={cn(
            "text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className="grid grid-cols-2 gap-2">
          {LIFE_AREAS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => handleSelect(a.value)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border-2"
              style={{
                backgroundColor: a.bgColor,
                color: a.textColor,
                borderColor: currentSelected.includes(a.value) ? a.textColor : "transparent",
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
