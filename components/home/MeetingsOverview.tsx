import Link from "next/link";
import { CopyLinkButton } from "@/components/meetings/CopyLinkButton";
import { MeetingDot, MeetingOrb } from "@/components/meetings/MeetingOrb";
import { RelativeTime } from "@/components/meetings/RelativeTime";
import { Button } from "@/components/ui/button";
import { lightFor } from "@/lib/lights";
import type { MeetingSummary } from "@/lib/stream-types";
import { formatDayLabel, formatDuration, formatStartsIn, formatTime, formatTimeRange } from "@/lib/time";

function UpNextCard({ meeting, timeZone }: { meeting: MeetingSummary; timeZone: string }) {
  const light = lightFor(meeting.id);
  const start = new Date(meeting.startsAt!);
  const end = meeting.endsAt ? new Date(meeting.endsAt) : null;
  const day = formatDayLabel(start, timeZone);
  return (
    <div
      className="flex flex-col gap-5 rounded-[22px] border border-white/7 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6"
      style={{
        background: `radial-gradient(420px 220px at 0% 50%, rgb(${light.rgb} / 0.16), rgb(${light.rgb} / 0) 70%), rgb(255 255 255 / 0.03)`,
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
        <MeetingOrb id={meeting.id} size={46} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <h3 className="truncate text-[21px] font-semibold leading-tight tracking-[-0.015em] [font-stretch:115%] sm:text-2xl">
              {meeting.title}
            </h3>
            <span className="inline-flex h-[26px] items-center rounded-full bg-paper/10 px-2.5 text-[12.5px] font-semibold">
              <span className="inline-block first-letter:uppercase">
                <RelativeTime iso={meeting.startsAt!} initial={formatStartsIn(start)} />
              </span>
            </span>
          </div>
          <p className="text-[14.5px] text-fog">
            {day}, {formatTimeRange(start, end, timeZone)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <CopyLinkButton meetingId={meeting.id} className="flex-1 sm:flex-none" />
        <Button asChild variant="primary" size="md" className="flex-1 px-5 sm:flex-none">
          <Link href={`/meeting/${meeting.id}`}>Start</Link>
        </Button>
      </div>
    </div>
  );
}

function LiveCard({ meeting }: { meeting: MeetingSummary }) {
  return (
    <div className="flex flex-col gap-4 rounded-[22px] border border-white/7 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:p-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-tally/16">
          <span className="size-2.5 rounded-full bg-tally-bright shadow-[0_0_12px_2px_rgba(255,90,78,0.6)]" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="truncate text-xl font-semibold [font-stretch:112%]">{meeting.title}</h3>
          <p className="text-[14.5px] text-fog">
            {meeting.participantCount} {meeting.participantCount === 1 ? "person" : "people"} in the call
            {meeting.sessionStartedAt ? (
              <>
                . Started <RelativeTime iso={meeting.sessionStartedAt} mode="since" initial="a moment ago" />
              </>
            ) : null}
          </p>
        </div>
      </div>
      <Button asChild variant="primary" size="md" className="px-6">
        <Link href={`/meeting/${meeting.id}`}>Join</Link>
      </Button>
    </div>
  );
}

function LaterList({ meetings, timeZone }: { meetings: MeetingSummary[]; timeZone: string }) {
  const groups = new Map<string, MeetingSummary[]>();
  for (const m of meetings) {
    const label = formatDayLabel(new Date(m.startsAt!), timeZone);
    groups.set(label, [...(groups.get(label) ?? []), m]);
  }
  return (
    <div className="flex flex-col">
      {[...groups.entries()].map(([label, items]) => (
        <div key={label} className="flex flex-col">
          <p className="mb-0.5 mt-3 text-[12.5px] font-semibold text-fog first:mt-1">{label}</p>
          {items.map((m) => {
            const start = new Date(m.startsAt!);
            const minutes = m.endsAt ? (new Date(m.endsAt).getTime() - start.getTime()) : null;
            return (
              <div key={m.id} className="group flex min-h-14 items-center gap-3 rounded-[14px] py-1 pl-3 pr-1.5 transition-colors hover:bg-white/[0.04] sm:gap-4">
                <span className="tabular w-[70px] shrink-0 text-sm text-mist">{formatTime(start, timeZone)}</span>
                <MeetingDot id={m.id} className="size-2" />
                <Link href={`/meeting/${m.id}`} className="min-w-0 flex-1 truncate text-[15px] font-[550] hover:underline hover:underline-offset-4">
                  {m.title}
                </Link>
                {minutes ? (
                  <span className="hidden text-[13px] text-fog sm:inline">{formatDuration(minutes).replace("minutes", "min")}</span>
                ) : null}
                <CopyLinkButton meetingId={m.id} iconOnly label={`Copy invite link for ${m.title}`} className="size-10" />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function MeetingsOverview({
  live,
  upcoming,
  timeZone,
}: {
  live: MeetingSummary[];
  upcoming: MeetingSummary[];
  timeZone: string;
}) {
  const next = upcoming[0];
  const later = upcoming.slice(1, 6);

  return (
    <div className="flex flex-col gap-11">
      {live.length > 0 && (
        <section aria-labelledby="live-heading" className="flex flex-col gap-3.5">
          <h2 id="live-heading" className="text-[15px] font-semibold text-fog">
            Happening now
          </h2>
          <div className="flex flex-col gap-3">
            {live.slice(0, 2).map((m) => (
              <LiveCard key={m.id} meeting={m} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="next-heading" className="flex flex-col gap-3.5">
        <h2 id="next-heading" className="text-[15px] font-semibold text-fog">
          Up next
        </h2>
        {next ? (
          <UpNextCard meeting={next} timeZone={timeZone} />
        ) : (
          <div className="flex flex-col items-start gap-1.5 rounded-[22px] border border-dashed border-white/10 px-5 py-6 sm:px-6">
            <p className="text-[15.5px] font-semibold">Nothing scheduled</p>
            <p className="text-[14.5px] text-fog">Schedule a meeting and it shows up here with its invite link.</p>
          </div>
        )}
      </section>

      {later.length > 0 && (
        <section aria-labelledby="later-heading" className="flex flex-col">
          <div className="mb-1 flex items-center justify-between">
            <h2 id="later-heading" className="text-[15px] font-semibold text-fog">
              Later
            </h2>
            <Link href="/meetings" className="text-[13.5px] text-mist hover:text-paper">
              All meetings
            </Link>
          </div>
          <LaterList meetings={later} timeZone={timeZone} />
        </section>
      )}
    </div>
  );
}

export function MeetingsOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-3.5" aria-busy="true" aria-label="Loading meetings">
      <div className="h-[18px] w-20 animate-pulse rounded-full bg-white/6" />
      <div className="h-[112px] animate-pulse rounded-[22px] bg-white/[0.04]" />
      <div className="mt-6 h-[18px] w-14 animate-pulse rounded-full bg-white/6" />
      <div className="h-14 animate-pulse rounded-[14px] bg-white/[0.03]" />
      <div className="h-14 animate-pulse rounded-[14px] bg-white/[0.03]" />
    </div>
  );
}
