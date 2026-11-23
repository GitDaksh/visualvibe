"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CallingState,
  ParticipantsAudio,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { Grid2x2, LayoutPanelTop, MicOff, UserPlus, Volume2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tip } from "@/components/ui/tooltip";
import { lightFor } from "@/lib/lights";
import { shareInvite } from "@/lib/invite";
import { cn, inviteLink } from "@/lib/utils";
import { Dock, type DockVariant } from "./controls/Dock";
import { DeviceSettingsDialog } from "./controls/DeviceSettingsDialog";
import { useCallChat } from "./hooks/useCallChat";
import { useElapsed } from "./hooks/useElapsed";
import { DOCK_PANEL_QUERY, PHONE_QUERY, useMediaQuery } from "./hooks/useMediaQuery";
import { useRaisedHands } from "./hooks/useRaisedHands";
import { useReactions } from "./hooks/useReactions";
import { useWakeLock } from "./hooks/useWakeLock";
import { SidePanel, type PanelMode } from "./panels/SidePanel";
import { RoomContext, useRoom, type Layout, type Panel, type RoomState } from "./RoomContext";
import { Stage } from "./stage/Stage";

type Me = { id: string; name: string; image?: string | null };

type Props = {
  meetingId: string;
  me: Me;
  onLeave: () => void;
  onEndForEveryone: () => void;
  onRejoin: () => void;
  /** A personal room reached its time limit (enforced here, not by the server). */
  onTimeLimit: () => void;
};

const AMBIENT_KEY = "vv.ambient";

function readAmbient() {
  try {
    return localStorage.getItem(AMBIENT_KEY) !== "off";
  } catch {
    return true;
  }
}

function LayoutSwitch() {
  const { layout, setLayout } = useRoom();
  const options: { value: Layout; label: string; icon: React.ReactNode }[] = [
    { value: "speaker", label: "Speaker view", icon: <LayoutPanelTop className="size-[18px]" /> },
    { value: "grid", label: "Grid view", icon: <Grid2x2 className="size-[18px]" /> },
  ];
  return (
    <div role="group" aria-label="Layout" className="flex gap-0.5 rounded-full border border-white/6 bg-white/6 p-[3px]">
      {options.map((o) => (
        <Tip key={o.value} label={o.label} side="bottom">
          <button
            type="button"
            aria-pressed={layout === o.value}
            aria-label={o.label}
            onClick={() => setLayout(o.value)}
            className={cn(
              "inline-flex h-[34px] w-[38px] items-center justify-center rounded-full transition-colors",
              layout === o.value ? "bg-white/14 text-paper" : "text-fog hover:text-paper",
            )}
          >
            {o.icon}
          </button>
        </Tip>
      ))}
    </div>
  );
}

function TopBar({ phone }: { phone: boolean }) {
  const { meeting, copyInvite } = useRoom();
  const { useCallStartedAt, useIsCallRecordingInProgress } = useCallStateHooks();
  const elapsed = useElapsed(useCallStartedAt());
  const recording = useIsCallRecordingInProgress();
  const light = lightFor(meeting.id);

  return (
    <header
      className={cn(
        "z-20 flex shrink-0 items-center justify-between gap-3",
        phone
          ? "absolute inset-x-0 top-0 bg-gradient-to-b from-black/65 via-black/25 to-transparent pb-7 pl-[max(16px,env(safe-area-inset-left))] pr-[max(12px,env(safe-area-inset-right))] pt-[max(10px,env(safe-area-inset-top))]"
          : "relative h-[calc(64px+env(safe-area-inset-top))] px-4 pt-[env(safe-area-inset-top)] sm:px-6",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: light.hex, boxShadow: `0 0 14px 2px rgb(${light.rgb} / 0.65)` }}
        />
        <div className={cn("flex min-w-0", phone ? "flex-col" : "items-center gap-3")}>
          <h1 className={cn("truncate font-[620] [font-stretch:112%]", phone ? "text-[15px] leading-5" : "text-[15px]")}>
            {meeting.title}
          </h1>
          <div className="flex items-center gap-2">
            {elapsed && <span className="tabular text-[13px] text-fog sm:text-sm">{elapsed}</span>}
            {recording && (
              <span className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full bg-tally/16 px-2.5 text-[12px] font-semibold text-tally-soft sm:h-[26px] sm:text-[12.5px]">
                <span aria-hidden className="size-[7px] rounded-full bg-tally-bright" />
                Recording
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!phone && (
          <div className="hidden sm:block">
            <LayoutSwitch />
          </div>
        )}
        <Tip label="Copy invite link" side="bottom">
          <button
            type="button"
            onClick={copyInvite}
            aria-label="Invite people"
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-white/8 font-semibold transition-colors hover:bg-white/12 active:scale-95",
              phone ? "size-11 justify-center bg-black/30 backdrop-blur-md" : "h-10 bg-white/6 pl-3 pr-4 text-[13.5px]",
            )}
          >
            <UserPlus className="size-[18px]" />
            {!phone && "Invite"}
          </button>
        </Tip>
      </div>
    </header>
  );
}

/** Connection trouble. The call is still open underneath, so people can always leave. */
function ConnectionOverlay({ onRejoin }: { onRejoin: () => void }) {
  const { leave } = useRoom();
  const { useCallCallingState } = useCallStateHooks();
  const state = useCallCallingState();
  const failed = state === CallingState.RECONNECTING_FAILED;
  const offline = state === CallingState.OFFLINE;
  const show = failed || offline || state === CallingState.RECONNECTING || state === CallingState.MIGRATING;
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-5 backdrop-blur-[2px] animate-[light-in_200ms_ease-out]">
      <div
        role="alertdialog"
        aria-live="assertive"
        aria-label={failed ? "Connection lost" : offline ? "You're offline" : "Reconnecting"}
        className="glass flex w-full max-w-[380px] flex-col items-center gap-4 rounded-3xl px-6 py-7 text-center shadow-[0_30px_80px_rgba(0,0,0,0.55)] animate-pop"
      >
        {failed || offline ? (
          <WifiOff className="size-7 text-paper" aria-hidden />
        ) : (
          <span aria-hidden className="size-7 animate-spin rounded-full border-[2.5px] border-paper/20 border-t-paper" />
        )}
        <div className="flex flex-col gap-1.5">
          <p className="text-xl font-semibold [font-stretch:112%]">
            {failed ? "Connection lost" : offline ? "You're offline" : "Reconnecting"}
          </p>
          <p className="text-sm leading-relaxed text-haze">
            {failed
              ? "We couldn't get you back into the call. Rejoin when your connection is steady."
              : "Your connection dropped. You'll be back in the call as soon as it returns."}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 pt-1 sm:flex-row-reverse">
          {failed && (
            <Button variant="primary" className="flex-1" onClick={onRejoin}>
              Rejoin
            </Button>
          )}
          <Button variant={failed ? "secondary" : "ghost"} className="flex-1" onClick={leave}>
            Leave call
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Small nudges that go through the toast stack, so they never pile up on the controls. */
function useCallNudges(panelRef: React.RefObject<Panel>) {
  const call = useCall()!;
  const { useMicrophoneState, useIsAutoplayBlocked } = useCallStateHooks();
  const { isSpeakingWhileMuted, microphone } = useMicrophoneState();
  const autoplayBlocked = useIsAutoplayBlocked();
  const lastMutedHint = useRef(0);

  // "You're muted" when your mic picks up speech while off, at most every 40 seconds.
  useEffect(() => {
    if (!isSpeakingWhileMuted) return;
    const now = Date.now();
    if (now - lastMutedHint.current < 40_000) return;
    lastMutedHint.current = now;
    toast("You're muted", {
      id: "speaking-muted",
      icon: <MicOff className="text-tally" />,
      duration: 5000,
      action: { label: "Unmute", onClick: () => void microphone.enable().catch(() => {}) },
    });
  }, [isSpeakingWhileMuted, microphone]);

  // Some browsers block sound until you interact with the page.
  useEffect(() => {
    if (!autoplayBlocked) {
      toast.dismiss("autoplay");
      return;
    }
    toast("Your browser paused the sound", {
      id: "autoplay",
      icon: <Volume2 />,
      duration: Infinity,
      action: { label: "Turn on", onClick: () => void call.resumeAudio() },
    });
  }, [autoplayBlocked, call]);

  // "Meera joined", kept quiet in big calls and while chat (which shows it) is open.
  useEffect(() => {
    const mountedAt = Date.now();
    return call.on("call.session_participant_joined", (event) => {
      const user = event.participant?.user;
      if (!user || user.id === call.currentUserId) return;
      if (Date.now() - mountedAt < 3000 || panelRef.current === "chat") return;
      if (call.state.participantCount > 8) return;
      toast(`${user.name || "Someone"} joined`);
    });
  }, [call, panelRef]);
}

/**
 * Warns before a call's time limit and, for personal rooms, closes the call
 * when it's reached. Other meetings are ended by the server's own timer.
 */
function useTimeLimit(onReached: () => void) {
  const { useCallSession, useCallCustomData, useCallStartedAt } = useCallStateHooks();
  const session = useCallSession();
  const custom = useCallCustomData();
  const startedAt = useCallStartedAt();
  const onReachedRef = useRef(onReached);
  useEffect(() => {
    onReachedRef.current = onReached;
  });

  const serverEnds = session?.timer_ends_at ? new Date(session.timer_ends_at).getTime() : null;
  const roomMinutes = custom?.kind === "personal" && typeof custom.maxMinutes === "number" ? custom.maxMinutes : null;
  const roomEnds = roomMinutes && startedAt ? startedAt.getTime() + roomMinutes * 60_000 : null;
  const deadline = serverEnds ?? roomEnds;
  const enforce = !serverEnds && roomEnds !== null;

  useEffect(() => {
    if (!deadline) return;
    const now = Date.now();
    if (deadline <= now) return; // A session that outlived its limit isn't cut off mid-join.
    const timers: number[] = [];
    const at = (time: number, fn: () => void) => {
      const delay = time - now;
      if (delay > 0 && delay < 2 ** 31) timers.push(window.setTimeout(fn, delay));
    };
    at(deadline - 5 * 60_000, () =>
      toast("5 minutes left", { description: "This call has a time limit and closes on its own.", duration: 8000 }),
    );
    at(deadline - 60_000, () => toast("1 minute left", { description: "The call closes in a minute.", duration: 8000 }));
    if (enforce) at(deadline, () => onReachedRef.current());
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [deadline, enforce]);
}

/** Single-key shortcuts for keyboards. Ignored while typing or when a menu or dialog is open. */
function useShortcuts(handlers: Record<string, () => void>) {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.defaultPrevented) return;
      if (document.querySelector('[role="dialog"][data-state="open"], [role="menu"][data-state="open"], [role="alertdialog"]')) return;
      const key = e.key.toLowerCase();
      const target = e.target as HTMLElement | null;
      const typing = Boolean(target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)));
      if (typing && key !== "escape") return;
      const fn = ref.current[key];
      if (!fn) return;
      e.preventDefault();
      fn();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

const LANDSCAPE_PHONE_QUERY = "(max-height: 520px) and (pointer: coarse)";
const NARROW_QUERY = "(max-width: 639px)";

export function CallRoom({ meetingId, me, onLeave, onEndForEveryone, onRejoin, onTimeLimit }: Props) {
  const call = useCall()!;
  const { useCallCustomData, useCallCreatedBy, useParticipantCount, useRemoteParticipants, useMicrophoneState, useCameraState } =
    useCallStateHooks();
  const custom = useCallCustomData();
  const createdBy = useCallCreatedBy();
  const count = useParticipantCount();
  const remoteParticipants = useRemoteParticipants();
  const { microphone } = useMicrophoneState();
  const { camera } = useCameraState();

  const narrow = useMediaQuery(NARROW_QUERY);
  const landscapePhone = useMediaQuery(LANDSCAPE_PHONE_QUERY);
  const phone = useMediaQuery(PHONE_QUERY) || landscapePhone;
  const docked = useMediaQuery(DOCK_PANEL_QUERY);
  const medium = useMediaQuery("(min-width: 768px)");
  const wide = useMediaQuery("(min-width: 1152px)");

  const dockVariant: DockVariant = phone ? "compact" : wide ? "full" : medium ? "medium" : "compact";
  const panelMode: PanelMode = phone ? (narrow ? "sheet" : "overlay") : docked ? "docked" : "float";

  const [panel, setPanelState] = useState<Panel>(null);
  const [layout, setLayout] = useState<Layout>("speaker");
  const [ambient, setAmbientState] = useState(readAmbient);
  const [devicesOpen, setDevicesOpen] = useState(false);
  const panelRef = useRef<Panel>(null);
  useEffect(() => {
    panelRef.current = panel;
  }, [panel]);

  useWakeLock(true);
  useCallNudges(panelRef);
  useTimeLimit(onTimeLimit);

  const chat = useCallChat(call, me, panel === "chat");
  const hands = useRaisedHands(call, me);
  const reactions = useReactions(call, me);

  const title =
    (typeof custom?.title === "string" && custom.title.trim()) ||
    (typeof custom?.description === "string" && custom.description.trim()) ||
    "Meeting";
  const isPersonal = custom?.kind === "personal";
  const isHost = Boolean(createdBy?.id && createdBy.id === me.id);

  // Lift toasts above the controls and stop the page from bouncing on phones.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.inCall = "";
    return () => {
      delete root.dataset.inCall;
    };
  }, []);

  const setPanel = useCallback((p: Panel) => setPanelState(p), []);
  const togglePanel = useCallback((p: Exclude<Panel, null>) => setPanelState((cur) => (cur === p ? null : p)), []);
  const setAmbient = useCallback((on: boolean) => {
    setAmbientState(on);
    try {
      localStorage.setItem(AMBIENT_KEY, on ? "on" : "off");
    } catch {
      // Private browsing can refuse storage; the setting just won't stick.
    }
  }, []);

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const inviteLabel = phone && canShare ? "Share invite link" : "Copy invite link";
  const copyInvite = useCallback(async () => {
    const result = await shareInvite(meetingId, title, phone);
    if (result === "copied") toast("Invite link copied");
    else if (result === "failed") toast.error(`Couldn't copy the link. It's ${inviteLink(meetingId)}`);
  }, [meetingId, phone, title]);

  useShortcuts({
    m: () => void microphone.toggle().catch(() => toast.error("Couldn't change your microphone.")),
    v: () => void camera.toggle().catch(() => toast.error("Couldn't change your camera.")),
    h: hands.toggleMine,
    c: () => togglePanel("chat"),
    p: () => togglePanel("people"),
    g: () => setLayout((l) => (l === "grid" ? "speaker" : "grid")),
    escape: () => setPanelState(null),
  });

  const value = useMemo<RoomState>(
    () => ({
      meeting: { id: meetingId, title, isHost, isPersonal },
      me,
      panel,
      setPanel,
      togglePanel,
      layout,
      setLayout,
      ambient,
      setAmbient,
      chat,
      hands,
      reactions,
      copyInvite: () => void copyInvite(),
      inviteLabel,
      leave: onLeave,
      endForEveryone: onEndForEveryone,
      openDeviceSettings: () => setDevicesOpen(true),
    }),
    [ambient, chat, copyInvite, hands, inviteLabel, isHost, isPersonal, layout, me, meetingId, onEndForEveryone, onLeave, panel, reactions, setAmbient, setPanel, title, togglePanel],
  );

  return (
    <RoomContext.Provider value={value}>
      <div
        className="relative flex h-dvh flex-col overflow-hidden bg-studio text-paper"
        style={{ ["--dock-h" as string]: "calc(60px + max(12px, env(safe-area-inset-bottom)))" }}
      >
        <ParticipantsAudio participants={remoteParticipants} />
        <TopBar phone={phone} />

        <main className={cn("relative flex min-h-0 flex-1", !phone && "gap-4 px-3 sm:px-4")}>
          <div className="relative min-h-0 min-w-0 flex-1">
            <Stage phone={phone} />
          </div>
          <SidePanel mode={panelMode} />
        </main>

        <footer
          className={cn(
            "z-20 flex shrink-0 items-center",
            phone
              ? "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pb-[max(12px,env(safe-area-inset-bottom))] pl-[max(12px,env(safe-area-inset-left))] pr-[max(12px,env(safe-area-inset-right))] pt-8"
              : "relative h-[calc(88px+env(safe-area-inset-bottom))] px-4 pb-[env(safe-area-inset-bottom)] sm:px-6",
          )}
        >
          <Dock variant={dockVariant} />
        </footer>

        <ConnectionOverlay onRejoin={onRejoin} />
        <DeviceSettingsDialog open={devicesOpen} onOpenChange={setDevicesOpen} />
        <span className="sr-only" aria-live="polite">
          {count} {count === 1 ? "person" : "people"} in the call
        </span>
      </div>
    </RoomContext.Provider>
  );
}
