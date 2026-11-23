"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CalendarPlus, Check, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { scheduleMeeting } from "@/actions/meeting.actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { downloadIcs, googleCalendarUrl } from "@/lib/calendar-export";
import { formatLongDate, formatTimeRange } from "@/lib/time";
import { cn, copyText, inviteLink } from "@/lib/utils";

const LENGTHS = [
  { minutes: 15, label: "15 min" },
  { minutes: 30, label: "30 min" },
  { minutes: 45, label: "45 min" },
  { minutes: 60, label: "1 hr" },
];

type Scheduled = { id: string; title: string; startsAt: string; durationMinutes: number; notes: string | null };

function nextSlot() {
  const d = new Date(Date.now() + 15 * 60_000);
  d.setSeconds(0, 0);
  const m = d.getMinutes();
  d.setMinutes(m <= 30 ? (m === 0 ? 0 : 30) : 60);
  return d;
}

function minutesOfDay(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

function timeLabel(minutes: number) {
  const d = new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(d);
}

export function ScheduleDialog({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [initial] = useState(nextSlot);
  const [title, setTitle] = useState("");
  const [day, setDay] = useState<Date>(() => new Date(initial.getFullYear(), initial.getMonth(), initial.getDate()));
  const [minutes, setMinutes] = useState(() => minutesOfDay(initial));
  const [length, setLength] = useState(30);
  const [notes, setNotes] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Scheduled | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const isToday = new Date().toDateString() === day.toDateString();
  const times = useMemo(() => {
    const nowMinutes = minutesOfDay(new Date());
    const all = Array.from({ length: 96 }, (_, i) => i * 15);
    return isToday ? all.filter((t) => t > nowMinutes) : all;
  }, [isToday]);

  const effectiveMinutes = times.includes(minutes) ? minutes : (times[0] ?? minutes);

  function reset() {
    const slot = nextSlot();
    setTitle("");
    setDay(new Date(slot.getFullYear(), slot.getMonth(), slot.getDate()));
    setMinutes(minutesOfDay(slot));
    setLength(30);
    setNotes("");
    setError(null);
    setDone(null);
    setCopied(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(effectiveMinutes / 60), effectiveMinutes % 60);
    startTransition(async () => {
      const result = await scheduleMeeting({
        title: title.trim() || "Untitled meeting",
        startsAt: start.toISOString(),
        durationMinutes: length,
        notes,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(result.data);
      router.refresh();
    });
  }

  const event = done
    ? {
        id: done.id,
        title: done.title,
        start: new Date(done.startsAt),
        end: new Date(new Date(done.startsAt).getTime() + done.durationMinutes * 60_000),
        link: inviteLink(done.id),
        notes: done.notes,
      }
    : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTimeout(reset, 200);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[580px]"
        onOpenAutoFocus={(e) => {
          // On phones, don't pop the keyboard over the sheet straight away.
          if (window.matchMedia("(max-width: 639px)").matches) e.preventDefault();
        }}
      >
        {!done || !event ? (
          <form onSubmit={submit} className="flex flex-col">
            <div className="px-6 pb-2 pr-16 pt-6 sm:px-7 sm:pt-7">
              <DialogTitle>Schedule a meeting</DialogTitle>
            </div>
            <div className="flex flex-col gap-5 px-6 py-4 sm:px-7">
              <div className="flex flex-col gap-2">
                <Label htmlFor="meeting-title">Title</Label>
                <Input
                  id="meeting-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's the meeting called?"
                  maxLength={80}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-2">
                  <span className="text-[13.5px] font-semibold text-mist" id="date-label">
                    Date
                  </span>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-labelledby="date-label date-value"
                        className="flex h-12 w-full items-center gap-2.5 rounded-[14px] border border-white/10 bg-white/[0.05] px-4 text-left text-base text-paper transition-colors hover:bg-white/[0.08] data-[state=open]:border-paper/50 sm:text-[15px]"
                      >
                        <CalendarDays className="size-[18px] text-fog" aria-hidden />
                        <span id="date-value">{formatLongDate(day)}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        value={day}
                        min={new Date()}
                        onChange={(d) => {
                          setDay(d);
                          setDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="meeting-time">Starts at</Label>
                  <Select
                    id="meeting-time"
                    value={effectiveMinutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                  >
                    {times.length === 0 ? (
                      <option value={minutes}>Pick another day</option>
                    ) : (
                      times.map((t) => (
                        <option key={t} value={t}>
                          {timeLabel(t)}
                        </option>
                      ))
                    )}
                  </Select>
                </div>
              </div>

              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-[13.5px] font-semibold text-mist">Length</legend>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Length">
                  {LENGTHS.map((l) => {
                    const selected = l.minutes === length;
                    return (
                      <button
                        key={l.minutes}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setLength(l.minutes)}
                        className={cn(
                          "h-10 rounded-full border px-4 text-sm font-semibold transition-colors",
                          selected
                            ? "border-paper bg-paper text-studio"
                            : "border-white/12 bg-white/[0.04] text-paper hover:bg-white/10",
                        )}
                      >
                        {l.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex flex-col gap-2">
                <Label htmlFor="meeting-notes">
                  Notes for guests <span className="font-medium text-fog">(optional)</span>
                </Label>
                <Textarea
                  id="meeting-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agenda, links, anything people should read first"
                  maxLength={500}
                  rows={3}
                />
              </div>

              {error && (
                <p role="alert" className="rounded-xl bg-tally/12 px-3.5 py-2.5 text-sm text-tally-soft">
                  {error}
                </p>
              )}
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-white/6 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="text-[13px] leading-snug text-fog">Anyone with the link can join after signing in.</p>
              <Button type="submit" variant="primary" size="lg" disabled={pending || times.length === 0} className="sm:min-w-[172px]">
                {pending ? "Scheduling…" : "Schedule meeting"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-6 px-6 pb-6 pt-8 sm:px-7">
            <div className="flex flex-col items-start gap-4 pr-10">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-paper text-studio">
                <Check className="size-[22px]" strokeWidth={2.4} aria-hidden />
              </span>
              <div className="flex flex-col gap-1.5">
                <DialogTitle className="text-[26px] sm:text-[28px]">{done.title} is scheduled</DialogTitle>
                <DialogDescription>
                  {formatLongDate(event.start)}, {formatTimeRange(event.start, event.end)}
                </DialogDescription>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[13.5px] font-semibold text-mist">Invite link</span>
              <div className="flex items-center gap-2 rounded-[14px] border border-white/8 bg-black/25 py-1.5 pl-4 pr-1.5">
                <span className="min-w-0 flex-1 truncate text-[15px] text-[#E2E1DC]">{event.link.replace(/^https?:\/\//, "")}</span>
                <Button
                  variant="primary"
                  size="sm"
                  className="h-10 rounded-[10px]"
                  onClick={async () => {
                    if (await copyText(event.link)) {
                      setCopied(true);
                      toast("Invite link copied");
                      setTimeout(() => setCopied(false), 1800);
                    }
                  }}
                >
                  {copied ? <Check /> : <Copy />}
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button asChild variant="secondary" size="md">
                <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
                  <CalendarPlus />
                  Add to Google Calendar
                </a>
              </Button>
              <Button variant="secondary" size="md" onClick={() => downloadIcs(event)}>
                <Download />
                Download .ics
              </Button>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-white/6 pt-5 sm:flex-row sm:justify-end">
              <Button variant="ghost" size="md" onClick={reset}>
                Schedule another
              </Button>
              <Button variant="primary" size="md" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
