import type { Metadata } from "next";
import { cache } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { MeetingEntry } from "@/components/meeting/MeetingEntry";
import { EndedScreen, ErrorScreen, NotFoundScreen } from "@/components/meeting/screens";
import { isValidMeetingId, personalRoomCode } from "@/lib/meeting-code";
import { getJoinInfo } from "@/lib/stream-server";
import { formatAgo, formatDuration } from "@/lib/time";
import { getViewerTimeZone } from "@/lib/timezone";
import { displayNameOf } from "@/lib/user";

type Props = { params: Promise<{ id: string }> };

const CODE_PATTERN = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/i;

function meetingIdFrom(raw: string) {
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return "";
  }
}

const getViewer = cache(async () => {
  const user = await currentUser();
  if (!user) return null;
  return { id: user.id, name: displayNameOf(user), image: user.hasImage ? user.imageUrl : null };
});

// Shared by generateMetadata and the page, so Stream is asked once per request.
const getInfo = cache(async (id: string) => {
  const viewer = await getViewer();
  if (!viewer) return null;
  return getJoinInfo(id, viewer);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = meetingIdFrom((await params).id);
  const robots = { index: false, follow: false };
  if (!isValidMeetingId(id)) return { title: "Meeting not found", robots };
  const info = await getInfo(id);
  switch (info?.status) {
    case "open":
      return { title: info.preview.title, robots };
    case "ended":
      return { title: `${info.title} has ended`, robots };
    case "missing":
      return { title: "Meeting not found", robots };
    default:
      return { title: "Meeting", robots };
  }
}

export default async function MeetingPage({ params }: Props) {
  const id = meetingIdFrom((await params).id);
  if (!isValidMeetingId(id)) return <NotFoundScreen />;

  // Codes are lowercase; fix links that were typed in capitals.
  if (CODE_PATTERN.test(id) && id !== id.toLowerCase()) redirect(`/meeting/${id.toLowerCase()}`);

  const viewer = await getViewer();
  if (!viewer) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/meeting/${id}`)}`);

  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  if (!apiKey) {
    return (
      <ErrorScreen
        title="Video calls aren't set up yet"
        message="Add your Stream API key and secret to the environment (see the README), then restart the app."
      />
    );
  }

  const info = await getInfo(id);
  if (info?.status === "missing") return <NotFoundScreen />;

  if (info?.status === "ended") {
    const ago = formatAgo(new Date(info.endedAt));
    const detail =
      info.durationMs && info.durationMs > 60_000
        ? `${info.title} ran for ${formatDuration(info.durationMs)} and ended ${ago}.`
        : `${info.title} ended ${ago}.`;
    return <EndedScreen detail={detail} showRecordings={info.isHost && info.recordingCount > 0} />;
  }

  const timeZone = await getViewerTimeZone();
  return (
    <MeetingEntry
      apiKey={apiKey}
      meetingId={id}
      me={viewer}
      preview={info?.status === "open" ? info.preview : null}
      isOwnRoom={id === personalRoomCode(viewer.id) || id === viewer.id}
      timeZone={timeZone}
    />
  );
}
