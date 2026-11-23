/**
 * Date formatting that always honours the viewer's time zone. Server
 * components pass the zone from the `tz` cookie (see TimeZoneSync); client
 * components can omit it and get the browser's zone.
 */

const LOCALE = "en-US";

function fmt(date: Date, timeZone: string | undefined, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(LOCALE, { timeZone, ...options }).format(date);
}

export function isValidTimeZone(tz: string | undefined | null): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat(LOCALE, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** "8:00 PM" */
export function formatTime(date: Date, timeZone?: string) {
  return fmt(date, timeZone, { hour: "numeric", minute: "2-digit" });
}

/** "8:00 – 8:45 PM", or "11:30 AM – 12:15 PM" when the meridiem changes. */
export function formatTimeRange(start: Date, end: Date | null, timeZone?: string) {
  if (!end) return formatTime(start, timeZone);
  const s = new Intl.DateTimeFormat(LOCALE, { timeZone, hour: "numeric", minute: "2-digit" }).formatToParts(start);
  const e = new Intl.DateTimeFormat(LOCALE, { timeZone, hour: "numeric", minute: "2-digit" }).formatToParts(end);
  const period = (parts: Intl.DateTimeFormatPart[]) => parts.find((p) => p.type === "dayPeriod")?.value;
  const clock = (parts: Intl.DateTimeFormatPart[]) =>
    parts
      .filter((p) => p.type !== "dayPeriod")
      .map((p) => p.value)
      .join("")
      .trim();
  if (period(s) && period(s) === period(e)) return `${clock(s)} – ${clock(e)} ${period(e)}`;
  return `${formatTime(start, timeZone)} – ${formatTime(end, timeZone)}`;
}

/** Calendar day key in a zone, e.g. "2026-11-23". */
export function dayKey(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts; // en-CA formats as YYYY-MM-DD
}

/** "Today", "Tomorrow", "Yesterday", or "Thursday, 26 November". */
export function formatDayLabel(date: Date, timeZone?: string, now = new Date()) {
  const key = dayKey(date, timeZone);
  const today = dayKey(now, timeZone);
  const tomorrow = dayKey(new Date(now.getTime() + 86_400_000), timeZone);
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000), timeZone);
  if (key === today) return "Today";
  if (key === tomorrow) return "Tomorrow";
  if (key === yesterday) return "Yesterday";
  const year = fmt(date, timeZone, { year: "numeric" });
  const sameYear = year === fmt(now, timeZone, { year: "numeric" });
  return sameYear ? formatLongDate(date, timeZone) : `${formatLongDate(date, timeZone)} ${year}`;
}

/** "Monday, 23 November" */
export function formatLongDate(date: Date, timeZone?: string) {
  const weekday = fmt(date, timeZone, { weekday: "long" });
  const day = fmt(date, timeZone, { day: "numeric" });
  const month = fmt(date, timeZone, { month: "long" });
  return `${weekday}, ${day} ${month}`;
}

/** "Friday, 20 November, 6:00 PM" */
export function formatDateTime(date: Date, timeZone?: string) {
  return `${formatLongDate(date, timeZone)}, ${formatTime(date, timeZone)}`;
}

/** "in 18 min", "in 2 hr", "now" */
export function formatStartsIn(start: Date, now = new Date()) {
  const minutes = Math.round((start.getTime() - now.getTime()) / 60_000);
  if (minutes <= 0) return "now";
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `in ${hours} hr`;
  const days = Math.round(hours / 24);
  return days === 1 ? "tomorrow" : `in ${days} days`;
}

/** "4 minutes ago", "1 hour ago" */
export function formatAgo(date: Date, now = new Date()) {
  const minutes = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

/** "48 minutes", "1 hr 12 min" */
export function formatDuration(ms: number) {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

/** "48:10" or "1:02:03" for media and call timers. */
export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

/** Greeting for the hour in the viewer's zone. */
export function greetingFor(date: Date, timeZone?: string) {
  const hour = Number(fmt(date, timeZone, { hour: "numeric", hourCycle: "h23" }));
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
