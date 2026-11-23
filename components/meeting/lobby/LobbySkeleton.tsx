"use client";

import type { JoinPreview } from "@/lib/stream-types";
import { LobbyDetails } from "./LobbyDetails";
import { LobbyLayout } from "./LobbyLayout";
import { LobbyMediaSkeleton } from "./LobbyMediaSkeleton";

type Me = { id: string; name: string; image?: string | null };

const noop = () => {};

/** The lobby with everything we already know filled in, while the call client loads. */
export function LobbySkeleton({
  meetingId,
  me,
  preview,
  timeZone,
}: {
  meetingId: string;
  me: Me;
  preview: JoinPreview | null;
  timeZone: string;
}) {
  return (
    <LobbyLayout
      me={me}
      media={<LobbyMediaSkeleton />}
      details={
        <LobbyDetails
          meetingId={meetingId}
          me={me}
          preview={preview}
          people={preview?.people ?? []}
          liveSince={preview?.sessionStartedAt ?? null}
          timeZone={timeZone}
          ready={false}
          joining={false}
          error={null}
          onJoin={noop}
        />
      }
    />
  );
}
