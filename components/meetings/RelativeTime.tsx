"use client";

import { useEffect, useState } from "react";
import { formatAgo, formatStartsIn } from "@/lib/time";

/** "in 18 min" / "4 minutes ago", kept fresh while the page is open. */
export function RelativeTime({
  iso,
  mode = "until",
  initial,
}: {
  iso: string;
  mode?: "until" | "since";
  /** Server-rendered text, shown until the client takes over. */
  initial: string;
}) {
  const [text, setText] = useState(initial);
  useEffect(() => {
    const date = new Date(iso);
    const update = () => setText(mode === "until" ? formatStartsIn(date) : formatAgo(date));
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [iso, mode]);
  return <span suppressHydrationWarning>{text}</span>;
}
