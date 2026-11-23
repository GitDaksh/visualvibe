import "server-only";

import { StreamClient, StreamError, nsToMs } from "@stream-io/node-sdk";
import type { CallResponse, CallSettingsRequest } from "@stream-io/node-sdk";
import { personalRoomCode } from "./meeting-code";
import type {
  JoinInfo,
  JoinPerson,
  JoinPreview,
  MeetingKind,
  MeetingSummary,
  RecordingSummary,
  RoomSettings,
} from "./stream-types";
import { firstNameOf } from "./utils";

export type { JoinInfo, JoinPerson, JoinPreview, MeetingKind, MeetingSummary, RecordingSummary, RoomSettings };

const CALL_TYPE = "default";

let client: StreamClient | null = null;

export function streamServerClient() {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const secret = process.env.STREAM_SECRET_KEY;
  if (!apiKey || !secret) {
    throw new Error(
      "Stream keys are missing. Set NEXT_PUBLIC_STREAM_API_KEY and STREAM_SECRET_KEY in .env.local.",
    );
  }
  client ??= new StreamClient(apiKey, secret, { timeout: 10_000 });
  return client;
}

function envInt(name: string, fallback: number, min: number, max: number) {
  const raw = Number(process.env[name]);
  if (!Number.isFinite(raw) || raw <= 0) return fallback;
  return Math.min(max, Math.max(min, Math.round(raw)));
}

/** Cost guardrails applied to every call we create. */
export function callLimits() {
  return {
    maxDurationMinutes: envInt("CALL_MAX_DURATION_MINUTES", 120, 5, 24 * 60),
    maxParticipants: envInt("CALL_MAX_PARTICIPANTS", 10, 2, 100),
  };
}

export function limitsOverride(maxDurationMinutes?: number): CallSettingsRequest {
  const { maxDurationMinutes: cap, maxParticipants } = callLimits();
  const minutes = Math.min(cap, maxDurationMinutes ?? cap);
  return {
    limits: {
      max_duration_seconds: minutes * 60,
      max_participants: maxParticipants,
    },
  };
}

/** A personal room's time limit, kept within the deployment's cap. */
export function clampRoomMinutes(minutes: number | undefined) {
  const { maxDurationMinutes: cap } = callLimits();
  return Math.min(cap, Math.max(15, Math.round(minutes || Math.min(cap, 120))));
}

/**
 * Personal rooms get a participant cap but no server-side timer: Stream ends
 * a call when its timer runs out, and an ended call can't be joined again,
 * which would break the room's permanent link. Their time limit is kept in
 * custom data (maxMinutes) and every client in the call enforces it.
 */
export function personalRoomSettings(input: { muteOnJoin: boolean; cameraOffOnJoin: boolean }): CallSettingsRequest {
  return {
    limits: { max_participants: callLimits().maxParticipants },
    audio: { default_device: "speaker", mic_default_on: !input.muteOnJoin },
    video: { camera_default_on: !input.cameraOffOnJoin },
  };
}

const iso = (ns: number | undefined | null) => (ns ? new Date(nsToMs(ns)).toISOString() : null);

export function toMeetingSummary(call: CallResponse, ownerId?: string): MeetingSummary {
  const custom = (call.custom ?? {}) as Record<string, unknown>;
  const isPersonal =
    custom.kind === "personal" || (ownerId ? call.id === personalRoomCode(ownerId) || call.id === ownerId : false);
  const kind: MeetingKind = isPersonal ? "personal" : custom.kind === "scheduled" ? "scheduled" : "instant";
  const startsAt = iso(call.starts_at);
  const duration = typeof custom.durationMinutes === "number" ? custom.durationMinutes : null;
  const endsAt = startsAt && duration ? new Date(new Date(startsAt).getTime() + duration * 60_000).toISOString() : null;
  const session = call.session;
  const sessionStartedAt = iso(session?.started_at);
  const sessionEndedAt = iso(session?.ended_at);
  const endedAt = iso(call.ended_at);
  const participantCount = session?.participants?.length ?? 0;
  const title =
    (typeof custom.title === "string" && custom.title.trim()) ||
    (typeof custom.description === "string" && custom.description.trim()) ||
    (kind === "personal" ? "Your room" : "Meeting");
  return {
    id: call.id,
    title,
    description: typeof custom.notes === "string" && custom.notes.trim() ? custom.notes.trim() : null,
    kind,
    startsAt,
    endsAt,
    sessionStartedAt,
    sessionEndedAt,
    endedAt,
    live: Boolean(sessionStartedAt && !sessionEndedAt && !endedAt && participantCount > 0),
    participantCount,
  };
}

/** Recent meetings created by this user, newest first. */
export async function listMyMeetings(userId: string, limit = 60): Promise<MeetingSummary[]> {
  const { calls } = await streamServerClient().video.queryCalls({
    filter_conditions: { created_by_user_id: userId },
    sort: [{ field: "created_at", direction: -1 }],
    limit,
  });
  return calls.map(({ call }) => toMeetingSummary(call, userId));
}

const STALE_AFTER_MS = 2 * 60 * 60 * 1000;

/** Splits meetings into live, upcoming and past for the dashboard. */
export function partitionMeetings(meetings: MeetingSummary[], now = Date.now()) {
  const live: MeetingSummary[] = [];
  const upcoming: MeetingSummary[] = [];
  const past: MeetingSummary[] = [];
  for (const m of meetings) {
    const start = m.startsAt ? new Date(m.startsAt).getTime() : null;
    const finished = Boolean(m.endedAt || m.sessionEndedAt);
    if (m.live) {
      live.push(m);
    } else if (m.kind !== "personal" && !m.endedAt && start !== null && start > now - STALE_AFTER_MS && !m.sessionStartedAt) {
      upcoming.push(m);
    } else if (finished && m.sessionStartedAt) {
      past.push(m);
    }
  }
  upcoming.sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime());
  past.sort((a, b) => sortKey(b) - sortKey(a));
  return { live, upcoming, past };
}

function sortKey(m: MeetingSummary) {
  return new Date(m.sessionStartedAt ?? m.startsAt ?? 0).getTime();
}

/** Recordings across this user's recent meetings, newest first. */
export async function listMyRecordings(userId: string): Promise<RecordingSummary[]> {
  const meetings = await listMyMeetings(userId, 40);
  const candidates = meetings.filter((m) => m.sessionStartedAt).slice(0, 25);
  const client = streamServerClient();
  const results = await Promise.allSettled(
    candidates.map(async (m) => {
      const { recordings } = await client.video.call(CALL_TYPE, m.id).listRecordings();
      return recordings.map<RecordingSummary>((r) => {
        const startedMs = nsToMs(r.start_time);
        const endedMs = nsToMs(r.end_time);
        return {
          id: r.filename,
          meetingId: m.id,
          title: m.title,
          url: r.url,
          startedAt: new Date(startedMs).toISOString(),
          endedAt: new Date(endedMs).toISOString(),
          durationMs: Math.max(0, endedMs - startedMs),
        };
      });
    }),
  );
  return results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

/** The current settings of a user's personal room (defaults if it doesn't exist yet). */
export async function getRoomSettings(userId: string): Promise<RoomSettings & { exists: boolean; live: boolean }> {
  const defaults = { muteOnJoin: true, cameraOffOnJoin: false, maxDurationMinutes: clampRoomMinutes(undefined) };
  try {
    const { call } = await streamServerClient().video.call(CALL_TYPE, personalRoomCode(userId)).get();
    const settings = call.settings;
    const custom = (call.custom ?? {}) as Record<string, unknown>;
    const seconds = settings?.limits?.max_duration_seconds;
    const summary = toMeetingSummary(call, userId);
    return {
      exists: true,
      live: summary.live,
      muteOnJoin: settings?.audio ? !settings.audio.mic_default_on : defaults.muteOnJoin,
      cameraOffOnJoin: settings?.video ? !settings.video.camera_default_on : defaults.cameraOffOnJoin,
      maxDurationMinutes:
        typeof custom.maxMinutes === "number"
          ? clampRoomMinutes(custom.maxMinutes)
          : seconds
            ? clampRoomMinutes(Math.round(seconds / 60))
            : defaults.maxDurationMinutes,
    };
  } catch {
    return { exists: false, live: false, ...defaults };
  }
}

/**
 * Makes sure Stream knows the user's current name and photo before a call is
 * created for them, so other people see who the host is.
 */
export async function syncStreamUser(user: { id: string; name: string; image?: string | null }) {
  await streamServerClient().upsertUsers([{ id: user.id, name: user.name, image: user.image ?? undefined }]);
}

/** Creates someone's personal room if it isn't there yet. Existing rooms are left as they are. */
export async function openPersonalRoom(userId: string, name: string, image?: string | null) {
  const id = personalRoomCode(userId);
  await syncStreamUser({ id: userId, name, image });
  const { call } = await streamServerClient()
    .video.call(CALL_TYPE, id)
    .getOrCreate({
      data: {
        created_by_id: userId,
        starts_at: new Date(),
        custom: { title: `${firstNameOf(name)}'s room`, kind: "personal", maxMinutes: clampRoomMinutes(undefined) },
        settings_override: personalRoomSettings({ muteOnJoin: true, cameraOffOnJoin: false }),
      },
    });
  return call;
}

function isNotFound(error: unknown) {
  return error instanceof StreamError && (error.code === 16 || error.metadata?.responseCode === 404);
}

/**
 * What the meeting page needs before the call client loads: whether the
 * meeting exists, whether it has ended, and who's in it. Opening your own
 * personal room code creates the room on first use.
 */
export async function getJoinInfo(id: string, viewer: { id: string; name: string; image?: string | null }): Promise<JoinInfo> {
  let call: CallResponse;
  try {
    ({ call } = await streamServerClient().video.call(CALL_TYPE, id).get());
  } catch (error) {
    if (!isNotFound(error)) {
      console.error("Couldn't look up meeting", id, error);
      return { status: "unknown" };
    }
    if (id !== personalRoomCode(viewer.id)) return { status: "missing" };
    try {
      call = await openPersonalRoom(viewer.id, viewer.name, viewer.image);
    } catch (createError) {
      console.error("Couldn't create personal room", createError);
      return { status: "unknown" };
    }
  }

  const summary = toMeetingSummary(call, call.created_by.id);
  const isHost = call.created_by.id === viewer.id;

  if (call.ended_at) {
    const endedMs = nsToMs(call.ended_at);
    const startedMs = call.session?.started_at ? nsToMs(call.session.started_at) : null;
    let recordingCount = 0;
    if (isHost) {
      try {
        const { recordings } = await streamServerClient().video.call(CALL_TYPE, id).listRecordings();
        recordingCount = recordings.length;
      } catch {
        // Not worth failing the page over.
      }
    }
    return {
      status: "ended",
      title: summary.title,
      endedAt: new Date(endedMs).toISOString(),
      durationMs: startedMs ? Math.max(0, endedMs - startedMs) : null,
      isHost,
      recordingCount,
    };
  }

  const seen = new Set<string>([viewer.id]);
  const people: JoinPerson[] = [];
  for (const p of summary.live ? (call.session?.participants ?? []) : []) {
    if (seen.has(p.user.id)) continue;
    seen.add(p.user.id);
    people.push({ id: p.user.id, name: p.user.name || "Guest", image: p.user.image ?? null });
  }

  return {
    status: "open",
    preview: {
      id: call.id,
      title: summary.title,
      kind: summary.kind,
      notes: summary.description,
      startsAt: summary.startsAt,
      endsAt: summary.endsAt,
      sessionStartedAt: summary.live ? summary.sessionStartedAt : null,
      hostId: call.created_by.id,
      hostName: call.created_by.name || "the host",
      people,
    },
  };
}

export { CALL_TYPE };
