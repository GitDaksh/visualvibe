import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { RecordingsBrowser } from "@/components/recordings/RecordingsBrowser";
import { listMyRecordings } from "@/lib/stream-server";

export const metadata: Metadata = { title: "Recordings" };

async function RecordingsContent({ userId, openMeetingId }: { userId: string; openMeetingId?: string }) {
  try {
    const recordings = await listMyRecordings(userId);
    if (recordings.length === 0) {
      return (
        <div className="flex flex-col gap-1.5 rounded-[22px] border border-dashed border-white/10 px-5 py-8 sm:px-7">
          <p className="text-base font-semibold">No recordings yet</p>
          <p className="max-w-[52ch] text-[14.5px] leading-relaxed text-fog">
            When you host a call, open More in the call controls and choose Start recording. It shows up here a few minutes after the call ends.
          </p>
        </div>
      );
    }
    return <RecordingsBrowser recordings={recordings} openMeetingId={openMeetingId} />;
  } catch (error) {
    console.error("Failed to load recordings", error);
    return (
      <div role="alert" className="rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-6 sm:px-6">
        <p className="text-[15.5px] font-semibold">Couldn&apos;t load your recordings</p>
        <p className="mt-1 text-[14.5px] text-fog">Check your connection and refresh the page to try again.</p>
      </div>
    );
  }
}

export default async function RecordingsPage({ searchParams }: { searchParams: Promise<{ meeting?: string }> }) {
  const { userId } = await auth();
  const { meeting } = await searchParams;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="text-[32px] font-semibold leading-none tracking-[-0.025em] [font-stretch:118%] sm:text-4xl">Recordings</h1>
        <p className="text-[14.5px] text-fog">Calls you recorded as host. New recordings show up a few minutes after the call ends.</p>
      </div>
      <Suspense
        fallback={
          <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading recordings">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[74px] animate-pulse rounded-2xl bg-white/[0.03] sm:h-[83px]" />
            ))}
          </div>
        }
      >
        <RecordingsContent userId={userId!} openMeetingId={meeting} />
      </Suspense>
    </div>
  );
}
