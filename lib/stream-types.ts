/**
 * Shapes shared between the server helpers in stream-server.ts and the client
 * components that render them. Safe to import anywhere.
 */

export type MeetingKind = "instant" | "scheduled" | "personal";

export type MeetingSummary = {
  id: string;
  title: string;
  description: string | null;
  kind: MeetingKind;
  /** ISO strings so the data can cross to client components. */
  startsAt: string | null;
  endsAt: string | null;
  sessionStartedAt: string | null;
  sessionEndedAt: string | null;
  endedAt: string | null;
  live: boolean;
  participantCount: number;
};

export type RecordingSummary = {
  id: string;
  meetingId: string;
  title: string;
  url: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
};

export type RoomSettings = {
  muteOnJoin: boolean;
  cameraOffOnJoin: boolean;
  maxDurationMinutes: number;
};

export type JoinPerson = { id: string; name: string; image: string | null };

export type JoinPreview = {
  id: string;
  title: string;
  kind: MeetingKind;
  notes: string | null;
  startsAt: string | null;
  endsAt: string | null;
  sessionStartedAt: string | null;
  hostId: string;
  hostName: string;
  /** People in the call right now, not counting the viewer. */
  people: JoinPerson[];
};

export type JoinInfo =
  | { status: "open"; preview: JoinPreview }
  | {
      status: "ended";
      title: string;
      endedAt: string;
      durationMs: number | null;
      isHost: boolean;
      recordingCount: number;
    }
  | { status: "missing" }
  /** Stream couldn't be reached; the client tries again on its own. */
  | { status: "unknown" };
