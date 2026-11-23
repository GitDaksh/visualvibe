"use client";

import { useEffect, useState } from "react";
import { formatLongDate, greetingFor } from "@/lib/time";

function clockParts(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).formatToParts(date);
  const time = parts
    .filter((p) => p.type !== "dayPeriod")
    .map((p) => p.value)
    .join("")
    .trim();
  const period = parts.find((p) => p.type === "dayPeriod")?.value ?? "";
  return { time, period };
}

/**
 * The big clock on Home. Renders the server's best guess first (using the
 * viewer's time zone cookie), then keeps ticking in the browser's own zone.
 */
export function LiveClock({ initialNow, timeZone, firstName }: { initialNow: string; timeZone: string; firstName: string }) {
  const [now, setNow] = useState(() => new Date(initialNow));
  const [zone, setZone] = useState<string | undefined>(timeZone);

  useEffect(() => {
    setZone(undefined); // the browser's own zone from here on
    setNow(new Date());
    let interval: ReturnType<typeof setInterval> | undefined;
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    }, msToNextMinute + 50);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  const { time, period } = clockParts(now, zone);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[15px] text-fog" suppressHydrationWarning>
        {formatLongDate(now, zone)}
      </p>
      <p className="tabular flex items-baseline gap-3 sm:gap-3.5" aria-label={`${time} ${period}`} suppressHydrationWarning>
        <span className="text-[76px] font-light leading-[0.95] tracking-[-0.04em] [font-stretch:125%] sm:text-[96px] lg:text-[112px]">
          {time}
        </span>
        <span className="text-[22px] font-[450] text-fog [font-stretch:115%] sm:text-[26px] lg:text-[28px]">{period}</span>
      </p>
      <h1 className="mt-2 text-[17px] font-medium leading-snug text-paper/85 sm:text-[19px]" suppressHydrationWarning>
        {greetingFor(now, zone)}, {firstName}.
      </h1>
    </div>
  );
}
