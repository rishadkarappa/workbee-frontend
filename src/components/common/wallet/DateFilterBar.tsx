import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DateFilterMode = "range" | "single";

export function DateFilterBar({
  mode,
  onModeChange,
  range,
  onRangeChange,
  single,
  onSingleChange,
  onClear,
  hasActiveFilter,
}: {
  mode: DateFilterMode;
  onModeChange: (m: DateFilterMode) => void;
  range: DateRange | undefined;
  onRangeChange: (r: DateRange | undefined) => void;
  single: Date | undefined;
  onSingleChange: (d: Date | undefined) => void;
  onClear: () => void;
  hasActiveFilter: boolean;
}) {
  const [open, setOpen] = useState(false);

  const label = useMemo(() => {
    if (mode === "single") {
      return single ? format(single, "d MMM yyyy") : "Pick a date";
    }
    if (range?.from && range?.to) {
      return `${format(range.from, "d MMM yyyy")} – ${format(range.to, "d MMM yyyy")}`;
    }
    if (range?.from) {
      return `${format(range.from, "d MMM yyyy")} – ...`;
    }
    return "Pick a date range";
  }, [mode, range, single]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded-full bg-muted p-0.5 text-xs font-medium">
        <button
          onClick={() => onModeChange("single")}
          className={cn(
            "px-3 py-1 rounded-full transition-colors",
            mode === "single" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Single Day
        </button>
        <button
          onClick={() => onModeChange("range")}
          className={cn(
            "px-3 py-1 rounded-full transition-colors",
            mode === "range" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Date Range
        </button>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("justify-start text-left font-normal", !hasActiveFilter && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {label}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          {mode === "single" ? (
            <Calendar
              mode="single"
              selected={single}
              onSelect={(d) => {
                onSingleChange(d);
                setOpen(false);
              }}
              disabled={(d) => d > new Date()}
            />
          ) : (
            <>
              <Calendar
                mode="range"
                selected={range}
                onSelect={onRangeChange}
                numberOfMonths={2}
                disabled={(d) => d > new Date()}
              />
              <div className="flex justify-end gap-2 border-t p-2">
                <Button variant="ghost" size="sm" onClick={() => onRangeChange(undefined)}>
                  Reset
                </Button>
                <Button size="sm" disabled={!range?.from || !range?.to} onClick={() => setOpen(false)}>
                  Apply
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      {hasActiveFilter && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear} title="Clear date filter">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}