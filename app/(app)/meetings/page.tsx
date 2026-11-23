import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { CalendarPlus, Plus } from "lucide-react";
import { PastList, UpcomingList } from "@/components/meetings/MeetingList";
import { ScheduleDialog } from "@/components/meetings/ScheduleDialog";
import { Button } from "@/components/ui/button";
import { listMyMeetings, listMyRecordings, partitionMeetings } from "@/lib/stream-server";
import { getViewerTimeZone } from "@/lib/timezone";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Meetings" };

type Tab = "upcoming" | "past";

async function MeetingsContent({ userId, tab, timeZone }: { userId: string; tab: Tab; timeZone: string }) {
  try {
    const meetings = await listMyMeetings(userId);
    const { live, upcoming, past } = partitionMeetings(meetings);

    if (tab === "upcoming") {
      const list = [...live.filter((m) => m.kind !== "personal"), ...upcoming];
      if (list.length === 0) {
        return (
          <Empty
            title="No upcoming meetings"
            body="Schedule one and it shows up here, with a link you can share right away."
            action={
              <ScheduleDialog>
                <Button variant="primary" size="md">
                  <CalendarPlus />
                  Schedule a meeting
                </Button>
              </ScheduleDialog>
            }
          />
        );
      }
      return <UpcomingList meetings={list} timeZone={timeZone} />;
    }

    if (past.length === 0) {
      return <Empty title="No past meetings yet" body="Meetings you host show up here after they end." />;
    }
    let recordedIds = new Set<string>();
    try {
      recordedIds = new Set((await listMyRecordings(userId)).map((r) => r.meetingId));
    } catch {
      // Recordings are a nice-to-have on this screen.
    }
    return <PastList meetings={past} timeZone={timeZone} recordedIds={recordedIds} />;
  } catch (error) {
    console.error("Failed to load meetings", error);
    return <Empty title="Couldn't load your meetings" body="Check your connection and refresh the page to try again." />;
  }
}

function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-[22px] border border-dashed border-white/10 px-5 py-8 sm:px-7">
      <div className="flex flex-col gap-1.5">
        <p className="text-base font-semibold">{title}</p>
        <p className="max-w-[46ch] text-[14.5px] leading-relaxed text-fog">{body}</p>
      </div>
      {action}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading meetings">
      <div className="mb-2 h-4 w-16 animate-pulse rounded-full bg-white/6" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[68px] animate-pulse rounded-2xl bg-white/[0.03]" />
      ))}
    </div>
  );
}

export default async function MeetingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { userId } = await auth();
  const { tab: rawTab } = await searchParams;
  const tab: Tab = rawTab === "past" ? "past" : "upcoming";
  const timeZone = await getViewerTimeZone();

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-[32px] font-semibold leading-none tracking-[-0.025em] [font-stretch:118%] sm:text-4xl">Meetings</h1>
        <ScheduleDialog>
          <Button variant="primary" size="md" className="px-4 sm:pl-3.5 sm:pr-[18px]">
            <Plus />
            <span>Schedule</span>
          </Button>
        </ScheduleDialog>
      </div>

      <nav aria-label="Meetings" className="flex self-start rounded-full border border-white/6 bg-white/[0.05] p-1">
        {(["upcoming", "past"] as const).map((t) => (
          <Link
            key={t}
            href={t === "upcoming" ? "/meetings" : "/meetings?tab=past"}
            aria-current={tab === t ? "page" : undefined}
            scroll={false}
            className={cn(
              "flex h-[38px] items-center rounded-full px-[18px] text-sm font-semibold capitalize transition-colors",
              tab === t ? "bg-paper text-studio" : "text-mist hover:text-paper",
            )}
          >
            {t}
          </Link>
        ))}
      </nav>

      <Suspense key={tab} fallback={<ListSkeleton />}>
        <MeetingsContent userId={userId!} tab={tab} timeZone={timeZone} />
      </Suspense>
    </div>
  );
}
