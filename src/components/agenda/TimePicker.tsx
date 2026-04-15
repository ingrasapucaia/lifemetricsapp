import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TimePickerProps {
  value: string;
  onChange: (val: string) => void;
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  return (
    <div className="space-y-2">
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-md border border-input bg-background px-3 text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
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
