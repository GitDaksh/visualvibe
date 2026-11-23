"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CalendarProps = {
  value: Date;
  onChange: (date: Date) => void;
  /** Days before this one can't be picked. */
  min?: Date;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** A compact month view in the viewer's local time. */
export function Calendar({ value, onChange, min }: CalendarProps) {
  const [month, setMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const minDay = min ? startOfDay(min) : null;
  const today = startOfDay(new Date());

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = Array.from({ length: first.getDay() }, () => null);
    for (let d = 1; d <= count; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
    return cells;
  }, [month]);

  const canGoBack = !minDay || new Date(month.getFullYear(), month.getMonth(), 1) > new Date(minDay.getFullYear(), minDay.getMonth(), 1);
  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(month);

  return (
    <div className="w-[284px] select-none">
      <div className="mb-2.5 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          disabled={!canGoBack}
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="inline-flex size-9 items-center justify-center rounded-full text-paper transition-colors hover:bg-white/10 disabled:text-white/25 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-semibold [font-stretch:110%]" aria-live="polite">
          {label}
        </span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="inline-flex size-9 items-center justify-center rounded-full text-paper transition-colors hover:bg-white/10"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div aria-hidden className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[11.5px] font-semibold text-fog">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div role="grid" aria-label={label} className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          if (!day) return <span key={`blank-${i}`} />;
          const disabled = Boolean(minDay && day < minDay);
          const selected = sameDay(day, value);
          const isToday = sameDay(day, today);
          return (
            <button
              key={day.toISOString()}
              type="button"
              role="gridcell"
              disabled={disabled}
              aria-selected={selected}
              aria-label={new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(day) + (isToday ? ", today" : "")}
              onClick={() => onChange(day)}
              className={cn(
                "tabular h-9 rounded-full text-[13px] font-medium transition-colors",
                selected ? "bg-paper font-semibold text-studio" : "text-paper hover:bg-white/10",
                isToday && !selected && "font-semibold ring-1 ring-inset ring-paper/45",
                disabled && "text-white/25 hover:bg-transparent",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
