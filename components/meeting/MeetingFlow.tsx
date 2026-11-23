"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CallingState,
  SfuModels,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
  type Call,
} from "@stream-io/video-react-sdk";
import { toast } from "sonner";
import { ensurePersonalRoom } from "@/actions/meeting.actions";
import { getStreamToken } from "@/actions/stream.actions";
import { lightFor } from "@/lib/lights";
import type { JoinPerson, JoinPreview, MeetingKind } from "@/lib/stream-types";
import { formatDuration } from "@/lib/time";
import { BlurProvider } from "./BlurProvider";
import { CallRoom } from "./CallRoom";
import { LobbyDetails } from "./lobby/LobbyDetails";
import { LobbyLayout } from "./lobby/LobbyLayout";
import { LobbyMedia } from "./lobby/LobbyMedia";
import { LobbySkeleton } from "./lobby/LobbySkeleton";
import { DisconnectedScreen, EndedScreen, ErrorScreen, LeftScreen, NotFoundScreen, RemovedScreen } from "./screens";

type Me = { id: string; name: string; image?: string | null };

export type MeetingFlowProps = {
  apiKey: string;
  meetingId: string;
  me: Me;
  /** What the server already knows about the meeting, if Stream answered in time. */
  preview: JoinPreview | null;
  /** The viewer opened their own personal room's code. */
  isOwnRoom: boolean;
  timeZone: string;
};

type Ended = { by: string | null; byMe: boolean; reason: string | null; durationMs: number | null; recorded: boolean; limitMinutes: number | null };

type Phase =
  | { kind: "loading" }
  | { kind: "lobby" }
  | { kind: "joining" }
  | { kind: "in-call" }
  | { kind: "left"; stayedMs: number; remaining: number }
  | ({ kind: "ended" } & Ended)
  | { kind: "removed" }
  | { kind: "disconnected" }
  | { kind: "not-found" }
  | { kind: "error"; message: string };

const CALL_TYPE = "default";

function isNotFound(error: unknown) {
  const e = error as { code?: number | null; status?: number } | null;
  return Boolean(e && (e.code === 16 || e.status === 404));
}

function joinErrorMessage(error: unknown) {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (/participant.?limit|max.?participants|is full|capacity|too many participants/i.test(text)) {
    return "This meeting is full. Ask the host to make room, then try again.";
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) return "You're offline. Reconnect to the internet, then try again.";
  if (/not allowed|permission|forbidden|403/i.test(text)) return "You don't have access to this meeting. Ask the host to check the link.";
  return "Couldn't join the meeting. Check your connection and try again.";
}

function titleOf(call: Call | null, preview: JoinPreview | null) {
  const custom = call?.state.custom ?? {};
  const fromCall =
    (typeof custom.title === "string" && custom.title.trim()) || (typeof custom.description === "string" && custom.description.trim());
  return fromCall || preview?.title || "the meeting";
}

/** Builds lobby details from the call itself when the server couldn't. */
function previewFromCall(call: Call): JoinPreview {
  const custom = call.state.custom ?? {};
  const kind: MeetingKind = custom.kind === "personal" ? "personal" : custom.kind === "scheduled" ? "scheduled" : "instant";
  const startsAt = call.state.startsAt?.toISOString() ?? null;
  const duration = typeof custom.durationMinutes === "number" ? custom.durationMinutes : null;
  const createdBy = call.state.createdBy;
  return {
    id: call.id,
    title: titleOf(call, null) === "the meeting" ? "Meeting" : titleOf(call, null),
    kind,
    notes: typeof custom.notes === "string" && custom.notes.trim() ? custom.notes.trim() : null,
    startsAt,
    endsAt: startsAt && duration ? new Date(new Date(startsAt).getTime() + duration * 60_000).toISOString() : null,
    sessionStartedAt: null,
    hostId: createdBy?.id ?? "",
    hostName: createdBy?.name || "the host",
    people: [],
  };
}

/**
 * A personal room's owner can choose to start guests muted or with cameras
 * off. The SDK prefers each person's remembered choice, so apply it here.
 */
async function applyRoomDefaults(call: Call) {
  if (call.state.custom?.kind !== "personal" || call.isCreatedByMe) return;
  const settings = call.state.settings;
  try {
    if (settings?.audio && !settings.audio.mic_default_on) await call.microphone.disable();
    if (settings?.video && !settings.video.camera_default_on) await call.camera.disable();
  } catch {
    // Device trouble shows up in the lobby; joining still works.
  }
}

function uniqueRemoteUsers(call: Call) {
  return new Set(call.state.remoteParticipants.map((p) => p.userId)).size;
}

function endedFrom(call: Call, extra: Partial<Ended> = {}): Ended {
  const started = call.state.startedAt;
  const limitSeconds = call.state.settings?.limits?.max_duration_seconds;
  return {
    by: null,
    byMe: false,
    reason: null,
    durationMs: started ? Date.now() - started.getTime() : null,
    recorded: false,
    limitMinutes: limitSeconds ? Math.round(limitSeconds / 60) : null,
    ...extra,
  };
}

function endedDetail(e: Ended, title: string) {
  const after = e.durationMs && e.durationMs > 60_000 ? ` after ${formatDuration(e.durationMs)}` : "";
  if (e.reason && /duration|limit|timeout/i.test(e.reason)) {
    if (!e.limitMinutes) return `${title} reached its time limit.`;
    const label = e.limitMinutes % 60 === 0 ? `${e.limitMinutes / 60}-hour` : `${e.limitMinutes}-minute`;
    return `${title} reached its ${label} limit.`;
  }
  if (e.byMe) return `You ended ${title} for everyone${after}.`;
  if (e.by) return `${e.by} ended ${title} for everyone${after}.`;
  return `${title} ended${after}.`;
}

/** Who's in the call right now, from the live session (not counting you). */
function useLivePeople(meId: string) {
  const { useCallSession } = useCallStateHooks();
  const session = useCallSession();
  return useMemo(() => {
    if (!session) return null;
    const seen = new Set<string>([meId]);
    const people: JoinPerson[] = [];
    for (const p of session.participants ?? []) {
      if (seen.has(p.user.id)) continue;
      seen.add(p.user.id);
      people.push({ id: p.user.id, name: p.user.name || "Guest", image: p.user.image ?? null });
    }
    const live = people.length > 0 && Boolean(session.started_at) && !session.ended_at;
    return { people, since: live ? (session.started_at ?? null) : null };
  }, [meId, session]);
}

function Lobby({
  call,
  meetingId,
  me,
  preview,
  timeZone,
  joining,
  error,
  onJoin,
}: {
  call: Call;
  meetingId: string;
  me: Me;
  preview: JoinPreview | null;
  timeZone: string;
  joining: boolean;
  error: string | null;
  onJoin: () => void;
}) {
  const live = useLivePeople(me.id);
  const details = useMemo(() => preview ?? previewFromCall(call), [call, preview]);
  return (
    <LobbyLayout
      me={me}
      media={<LobbyMedia me={me} />}
      details={
        <LobbyDetails
          meetingId={meetingId}
          me={me}
          preview={details}
          people={live?.people ?? details.people}
          liveSince={live ? live.since : details.sessionStartedAt}
          timeZone={timeZone}
          ready
          joining={joining}
          error={error}
          onJoin={onJoin}
        />
      }
    />
  );
}

/**
 * Everything on a meeting page after the server render: connects to Stream,
 * checks the meeting, runs the lobby, the call, and the screens after it.
 */
export default function MeetingFlow({ apiKey, meetingId, me, preview, isOwnRoom, timeZone: serverTimeZone }: MeetingFlowProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [joinError, setJoinError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const intentional = useRef(false);
  const removed = useRef(false);
  const ended = useRef<Partial<Ended> | null>(null);
  const recorded = useRef(false);
  const joinedAt = useRef<number | null>(null);

  // The browser knows the viewer's zone for sure; the server only had a cookie.
  const timeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || serverTimeZone;
    } catch {
      return serverTimeZone;
    }
  }, [serverTimeZone]);

  // One Stream client per signed-in user while the page is open.
  useEffect(() => {
    const next = new StreamVideoClient({
      apiKey,
      user: { id: me.id, name: me.name, image: me.image ?? undefined },
      tokenProvider: () => getStreamToken(),
      options: { logLevel: "warn" },
    });
    setClient(next);
    return () => {
      setClient(null);
      void next.disconnectUser().catch(() => {});
    };
  }, [apiKey, me.id, me.image, me.name]);

  // Look the meeting up (creating your own room if needed) and open the lobby.
  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    const next = client.call(CALL_TYPE, meetingId);
    setPhase({ kind: "loading" });

    (async () => {
      try {
        try {
          await next.get();
        } catch (error) {
          if (!isNotFound(error) || !isOwnRoom) throw error;
          const created = await ensurePersonalRoom();
          if (!created.ok) throw new Error(created.error);
          await next.get();
        }
        if (cancelled) {
          void next.leave().catch(() => {});
          return;
        }
        await applyRoomDefaults(next);
        if (cancelled) {
          void next.leave().catch(() => {});
          return;
        }
        setCall(next);
        if (next.state.endedAt) setPhase({ kind: "ended", ...endedFrom(next, { durationMs: null }) });
        else setPhase({ kind: "lobby" });
      } catch (error) {
        if (cancelled) return;
        if (isNotFound(error)) setPhase({ kind: "not-found" });
        else setPhase({ kind: "error", message: "Couldn't reach the video service. Check your connection and try again." });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt, client, isOwnRoom, meetingId]);

  // Leave the call (and release the camera) when it's replaced or the page
  // closes. The release waits a tick so a dev-mode remount can cancel it.
  const pendingRelease = useRef<{ call: Call; timer: number } | null>(null);
  useEffect(() => {
    if (!call) return;
    if (pendingRelease.current?.call === call) {
      window.clearTimeout(pendingRelease.current.timer);
      pendingRelease.current = null;
    }
    const release = () => {
      if (call.state.callingState !== CallingState.LEFT) void call.leave().catch(() => {});
    };
    window.addEventListener("pagehide", release);
    return () => {
      window.removeEventListener("pagehide", release);
      pendingRelease.current = { call, timer: window.setTimeout(release, 0) };
    };
  }, [call]);

  // Watch for the meeting ending, being removed, and dropped connections.
  useEffect(() => {
    if (!call) return;
    const offEnded = call.on("call.ended", (event) => {
      ended.current = {
        by: event.user?.name || null,
        byMe: event.user?.id === me.id,
        reason: event.reason ?? null,
      };
      // Someone ended it while you were still in the lobby.
      setPhase((current) =>
        current.kind === "lobby" ? { kind: "ended", ...endedFrom(call, { ...ended.current, durationMs: null }) } : current,
      );
    });
    const offKicked = call.on("call.kicked_user", (event) => {
      if (event.user.id === me.id) removed.current = true;
    });
    const offBlocked = call.on("call.blocked_user", (event) => {
      if (event.user.id === me.id) removed.current = true;
    });
    const offSfuEnded = call.on("callEnded", (event) => {
      if (event.reason === SfuModels.CallEndedReason.KICKED) removed.current = true;
      else ended.current ??= {};
    });
    const offRecording = call.on("call.recording_started", () => {
      recorded.current = true;
    });
    const sub = call.state.callingState$.subscribe((state) => {
      if (state !== CallingState.LEFT || intentional.current) return;
      setPhase((current) => {
        if (current.kind !== "in-call" && current.kind !== "joining") return current;
        if (removed.current) return { kind: "removed" };
        if (ended.current || call.state.endedAt) {
          return { kind: "ended", ...endedFrom(call, { ...ended.current, recorded: recorded.current }) };
        }
        return { kind: "disconnected" };
      });
    });
    return () => {
      offEnded();
      offKicked();
      offBlocked();
      offSfuEnded();
      offRecording();
      sub.unsubscribe();
    };
  }, [call, me.id]);

  const enterCall = useCallback((joined: Call) => {
    joinedAt.current = Date.now();
    recorded.current = joined.state.recording;
    setPhase({ kind: "in-call" });
  }, []);

  const resetFlags = useCallback(() => {
    intentional.current = false;
    removed.current = false;
    ended.current = null;
    recorded.current = false;
  }, []);

  const join = useCallback(async () => {
    if (!call) return;
    resetFlags();
    setJoinError(null);
    setPhase({ kind: "joining" });
    try {
      await call.join();
      enterCall(call);
    } catch (error) {
      if (call.state.endedAt) {
        setPhase({ kind: "ended", ...endedFrom(call, { durationMs: null }) });
        return;
      }
      setPhase({ kind: "lobby" });
      setJoinError(joinErrorMessage(error));
    }
  }, [call, enterCall, resetFlags]);

  // A left call can't be joined again, so rejoining starts a fresh one.
  const rejoin = useCallback(async () => {
    if (!client) return;
    const fresh = client.call(CALL_TYPE, meetingId);
    resetFlags();
    setJoinError(null);
    setCall(fresh);
    setPhase({ kind: "joining" });
    try {
      await fresh.get();
      if (fresh.state.endedAt) {
        setPhase({ kind: "ended", ...endedFrom(fresh, { durationMs: null }) });
        return;
      }
      await fresh.join();
      enterCall(fresh);
    } catch (error) {
      if (isNotFound(error)) {
        setPhase({ kind: "not-found" });
        return;
      }
      setPhase({ kind: "lobby" });
      setJoinError(joinErrorMessage(error));
    }
  }, [client, enterCall, meetingId, resetFlags]);

  const leave = useCallback(() => {
    if (!call) return;
    intentional.current = true;
    const remaining = uniqueRemoteUsers(call);
    const stayedMs = joinedAt.current ? Date.now() - joinedAt.current : 0;
    setPhase({ kind: "left", stayedMs, remaining });
    if (call.state.callingState !== CallingState.LEFT) void call.leave().catch(() => {});
  }, [call]);

  const endForEveryone = useCallback(async () => {
    if (!call) return;
    intentional.current = true;
    const info = endedFrom(call, { by: me.name, byMe: true, recorded: recorded.current || call.state.recording });
    try {
      await call.endCall();
    } catch {
      intentional.current = false;
      toast.error("Couldn't end the meeting. Try again.");
      return;
    }
    setPhase({ kind: "ended", ...info });
    if (call.state.callingState !== CallingState.LEFT) void call.leave().catch(() => {});
  }, [call, me.name]);

  // Personal rooms have no server timer, so the room closes itself at its limit.
  const timeLimitReached = useCallback(() => {
    if (!call) return;
    intentional.current = true;
    const minutes = call.state.custom?.maxMinutes;
    setPhase({
      kind: "ended",
      ...endedFrom(call, { reason: "limit", limitMinutes: typeof minutes === "number" ? minutes : null, durationMs: null }),
    });
    if (call.state.callingState !== CallingState.LEFT) void call.leave().catch(() => {});
  }, [call]);

  const handleEnd = useCallback(() => void endForEveryone(), [endForEveryone]);
  const handleRejoin = useCallback(() => void rejoin(), [rejoin]);
  const handleJoin = useCallback(() => void join(), [join]);
  const title = titleOf(call, preview);

  switch (phase.kind) {
    case "not-found":
      return <NotFoundScreen />;
    case "error":
      return (
        <ErrorScreen title="We couldn't open this meeting" message={phase.message} onRetry={() => setAttempt((n) => n + 1)} />
      );
    case "ended":
      return <EndedScreen detail={endedDetail(phase, title)} showRecordings={phase.recorded && Boolean(call?.isCreatedByMe)} />;
    case "removed":
      return <RemovedScreen title={title} />;
    case "disconnected":
      return <DisconnectedScreen onRejoin={handleRejoin} />;
    case "left": {
      const stayed = phase.stayedMs < 60_000 ? "less than a minute" : formatDuration(phase.stayedMs);
      const still =
        phase.remaining > 0 ? ` It's still going with ${phase.remaining} ${phase.remaining === 1 ? "person" : "people"}.` : "";
      return (
        <LeftScreen
          title={title}
          detail={`You were in the call for ${stayed}.${still}`}
          lightHex={lightFor(meetingId).hex}
          onRejoin={handleRejoin}
        />
      );
    }
  }

  if (!client || !call || phase.kind === "loading") {
    return <LobbySkeleton meetingId={meetingId} me={me} preview={preview} timeZone={timeZone} />;
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <BlurProvider>
          {phase.kind === "in-call" ? (
            <CallRoom
              meetingId={meetingId}
              me={me}
              onLeave={leave}
              onEndForEveryone={handleEnd}
              onRejoin={handleRejoin}
              onTimeLimit={timeLimitReached}
            />
          ) : (
            <Lobby
              call={call}
              meetingId={meetingId}
              me={me}
              preview={preview}
              timeZone={timeZone}
              joining={phase.kind === "joining"}
              error={joinError}
              onJoin={handleJoin}
            />
          )}
        </BlurProvider>
      </StreamCall>
    </StreamVideo>
  );
}
