import type { Metadata } from "next";
import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LiveClock } from "@/components/home/LiveClock";
import { MeetingsOverview, MeetingsOverviewSkeleton } from "@/components/home/MeetingsOverview";
import { QuickActions } from "@/components/home/QuickActions";
import { RoomCard } from "@/components/home/RoomCard";
import { personalRoomCode } from "@/lib/meeting-code";
import { displayInviteLink } from "@/lib/origin";
import { listMyMeetings, partitionMeetings } from "@/lib/stream-server";
import { getViewerTimeZone } from "@/lib/timezone";
import { displayNameOf } from "@/lib/user";
import { firstNameOf } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };

async function Overview({ userId, timeZone }: { userId: string; timeZone: string }) {
  try {
    const meetings = await listMyMeetings(userId);
    const { live, upcoming } = partitionMeetings(meetings);
    return <MeetingsOverview live={live} upcoming={upcoming} timeZone={timeZone} />;
  } catch (error) {
    console.error("Failed to load meetings", error);
    return (
      <div role="alert" className="rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-6 sm:px-6">
        <p className="text-[15.5px] font-semibold">Couldn&apos;t load your meetings</p>
        <p className="mt-1 text-[14.5px] text-fog">Check your connection and refresh the page to try again.</p>
      </div>
    );
  }
}

export default async function HomePage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const timeZone = await getViewerTimeZone();
  const roomId = personalRoomCode(user.id);
  const roomLink = await displayInviteLink(roomId);

  return (
    <div className="flex flex-col gap-10 md:gap-11">
      <section aria-label="Now" className="flex flex-col gap-6">
        <LiveClock initialNow={new Date().toISOString()} timeZone={timeZone} firstName={firstNameOf(displayNameOf(user))} />
        <QuickActions />
      </section>

      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Suspense fallback={<MeetingsOverviewSkeleton />}>
          <Overview userId={user.id} timeZone={timeZone} />
        </Suspense>
        <div className="lg:pt-[34px]">
          <RoomCard roomId={roomId} displayLink={roomLink} />
        </div>
      </div>
    </div>
  );
}
