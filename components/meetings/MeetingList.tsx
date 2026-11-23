import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MeetingSummary } from "@/lib/stream-types";
import { formatDayLabel, formatDuration, formatStartsIn, formatTime, formatTimeRange } from "@/lib/time";
import { cn } from "@/lib/utils";
import { CopyLinkButton } from "./CopyLinkButton";
import { MeetingDot } from "./MeetingOrb";
import { RelativeTime } from "./RelativeTime";

function groupByDay(meetings: MeetingSummary[], timeZone: string, pick: (m: MeetingSummary) => string | null) {
  const groups = new Map<string, MeetingSummary[]>();
  for (const m of meetings) {
    const iso = pick(m);
    const label = iso ? formatDayLabel(new Date(iso), timeZone) : "Earlier";
    groups.set(label, [...(groups.get(label) ?? []), m]);
  }
  return [...groups.entries()];
}

export function UpcomingList({ meetings, timeZone }: { meetings: MeetingSummary[]; timeZone: string }) {
  return (
    <div className="flex flex-col">
      {groupByDay(meetings, timeZone, (m) => m.startsAt).map(([label, items], gi) => (
        <section key={label} aria-label={label} className={cn("flex flex-col", gi > 0 && "mt-6")}>
          <h2 className="mb-1.5 text-[13px] font-semibold text-fog">{label}</h2>
          {items.map((m, i) => {
            const start = new Date(m.startsAt!);
            const end = m.endsAt ? new Date(m.endsAt) : null;
            const soon = gi === 0 && i === 0;
            const live = m.live;
            return (
              <div
                key={m.id}
                className={cn(
                  "flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl px-3.5 py-3 transition-colors hover:bg-white/[0.04] sm:flex-nowrap sm:gap-x-[18px]",
                  soon && "bg-white/[0.03]",
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-[18px]">
                  <span className="tabular hidden w-[132px] shrink-0 text-sm text-mist sm:block">{formatTimeRange(start, end, timeZone)}</span>
                  <MeetingDot id={m.id} />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[15.5px] font-semibold">{m.title}</span>
                    <span className="truncate text-[13px] text-fog">
                      <span className="sm:hidden">{formatTimeRange(start, end, timeZone)}, </span>
                      {live ? (
                        <span className="font-semibold text-tally-soft">live now</span>
                      ) : (
                        <RelativeTime iso={m.startsAt!} initial={formatStartsIn(start)} />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex w-full items-center justify-end gap-1.5 sm:w-auto">
                  <CopyLinkButton meetingId={m.id} iconOnly label={`Copy invite link for ${m.title}`} className="size-10" />
                  <Button asChild variant={soon || live ? "primary" : "secondary"} size="sm" className="h-10 px-[18px] text-sm">
                    <Link href={`/meeting/${m.id}`}>{live ? "Join" : "Start"}</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}

export function PastList({
  meetings,
  timeZone,
  recordedIds,
}: {
  meetings: MeetingSummary[];
  timeZone: string;
  recordedIds: Set<string>;
}) {
  return (
    <div className="flex flex-col">
      {groupByDay(meetings, timeZone, (m) => m.sessionStartedAt ?? m.startsAt).map(([label, items], gi) => (
        <section key={label} aria-label={label} className={cn("flex flex-col", gi > 0 && "mt-6")}>
          <h2 className="mb-1.5 text-[13px] font-semibold text-fog">{label}</h2>
          {items.map((m) => {
            const started = m.sessionStartedAt ? new Date(m.sessionStartedAt) : m.startsAt ? new Date(m.startsAt) : null;
            const ended = m.sessionEndedAt ?? m.endedAt;
            const duration = started && ended ? new Date(ended).getTime() - started.getTime() : null;
            return (
              <div
                key={m.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl px-3.5 py-3 transition-colors hover:bg-white/[0.04] sm:flex-nowrap sm:gap-x-[18px]"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-[18px]">
                  <span className="tabular hidden w-[132px] shrink-0 text-sm text-mist sm:block">
                    {started ? formatTime(started, timeZone) : ""}
                  </span>
                  <MeetingDot id={m.id} dim />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[15.5px] font-semibold">{m.title}</span>
                    <span className="truncate text-[13px] text-fog">
                      <span className="sm:hidden">{started ? `${formatTime(started, timeZone)}, ` : ""}</span>
                      {duration ? formatDuration(duration) : "Ended"}
                    </span>
                  </div>
                </div>
                {recordedIds.has(m.id) && (
                  <div className="flex w-full justify-end sm:w-auto">
                    <Button asChild variant="secondary" size="sm" className="h-10 px-4 text-sm">
                      <Link href={`/recordings?meeting=${m.id}`}>
                        <Play className="fill-current" />
                        Watch recording
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
