"use client";

import { useEffect, useState } from "react";
import { formatClock } from "@/lib/time";

/** "42:17" since `start`, updated every second. */
export function useElapsed(start: Date | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!start) return null;
  return formatClock((now - start.getTime()) / 1000);
}
