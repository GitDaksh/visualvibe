"use client";

import { useEffect, useRef, useState } from "react";
import { useCall, useCallStateHooks, type StreamVideoParticipant } from "@stream-io/video-react-sdk";
import { MonitorX, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AmbientLight } from "../AmbientLight";
import { ParticipantTile } from "../ParticipantTile";
import { useRoom } from "../RoomContext";
import { bestGrid, useStageParticipants } from "./useStageParticipants";

function FloatingReactions() {
  const { reactions } = useRoom();
  return (
    <div aria-live="polite" className="pointer-events-none absolute bottom-[calc(var(--dock-h,96px)+120px)] left-4 z-30 h-0 w-48 sm:bottom-32 sm:left-2">
      {reactions.floating.map((r) => (
        <span
          key={r.id}
          className="absolute bottom-0 flex animate-float flex-col items-center gap-1"
          style={{ left: r.offset }}
        >
          <span className="text-[34px] leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)] sm:text-4xl">{r.emoji}</span>
          <span className="pill-scrim whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold">{r.name}</span>
        </span>
      ))}
    </div>
  );
}

function AloneCard({ compact }: { compact?: boolean }) {
  const { copyInvite, inviteLabel } = useRoom();
  return (
    <div
      className={cn(
        "glass pointer-events-auto absolute left-1/2 z-10 flex w-[min(92%,420px)] -translate-x-1/2 flex-col items-center gap-3 rounded-3xl p-5 text-center shadow-[0_20px_60px_rgba(0,0,0,0.45)] animate-pop",
        compact ? "top-1/2 -translate-y-1/2" : "bottom-6",
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold [font-stretch:110%]">You&apos;re the only one here</p>
        <p className="text-sm text-haze">Share the link and people can join straight away.</p>
      </div>
      <Button variant="primary" size="md" onClick={copyInvite}>
        <UserPlus />
        {inviteLabel}
      </Button>
    </div>
  );
}

function PresentingBanner() {
  const call = useCall();
  return (
    <div className="glass absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full py-1.5 pl-4 pr-1.5 text-sm font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      You&apos;re presenting
      <Button variant="danger" size="sm" onClick={() => void call?.screenShare.disable()}>
        <MonitorX />
        Stop
      </Button>
    </div>
  );
}

/** Measures an element so the grid can pick the best column count. */
function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((s) => (Math.abs(s.width - width) > 1 || Math.abs(s.height - height) > 1 ? { width, height } : s));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

function GridView({ participants }: { participants: StreamVideoParticipant[] }) {
  const [ref, size] = useSize<HTMLDivElement>();
  const gap = size.width < 640 ? 8 : 12;
  const { cols, rows } = bestGrid(participants.length, size.width, size.height, gap);
  const scroll = participants.length > 16;
  return (
    <div ref={ref} className={cn("relative size-full min-h-0", scroll && "overflow-y-auto")}>
      <div
        className="grid size-full"
        style={{
          gap,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: scroll ? undefined : `repeat(${rows}, minmax(0, 1fr))`,
          gridAutoRows: scroll ? "minmax(160px, 1fr)" : undefined,
        }}
      >
        {participants.map((p) => (
          <ParticipantTile key={p.sessionId} participant={p} variant="grid" className="min-h-0" />
        ))}
      </div>
    </div>
  );
}

function Filmstrip({ participants, vertical }: { participants: StreamVideoParticipant[]; vertical?: boolean }) {
  if (participants.length === 0) return null;
  return (
    <div
      className={cn(
        "flex shrink-0 gap-3",
        vertical
          ? "w-[236px] flex-col overflow-y-auto"
          : "justify-center-safe overflow-x-auto pb-0.5 [@media(max-height:560px)]:hidden",
      )}
    >
      {participants.map((p) => (
        <ParticipantTile
          key={p.sessionId}
          participant={p}
          variant="strip"
          className={cn(
            "aspect-video shrink-0",
            // Up to four fit side by side; more scroll sideways.
            vertical ? "w-full" : "w-[clamp(132px,calc((100%-36px)/4),min(220px,calc(14vh*16/9)))]",
          )}
        />
      ))}
    </div>
  );
}

/** The stage on tablets and computers. */
function DesktopStage() {
  const { layout, ambient } = useRoom();
  const { participants, local, active, screenSharer, alone } = useStageParticipants();
  const { useDominantSpeaker } = useCallStateHooks();
  const dominant = useDominantSpeaker();

  if (screenSharer) {
    const others = participants;
    return (
      <div className="relative flex size-full min-h-0 gap-4">
        <div className="relative min-h-0 min-w-0 flex-1">
          <ParticipantTile participant={screenSharer} variant="stage" trackType="screenShareTrack" className="absolute inset-0" />
          {screenSharer.isLocalParticipant && <PresentingBanner />}
        </div>
        <div className="hidden xl:flex">
          <Filmstrip participants={others} vertical />
        </div>
      </div>
    );
  }

  if (layout === "grid" && participants.length > 1) {
    const lightSource = dominant ?? active;
    return (
      <div className="relative size-full min-h-0">
        <AmbientLight sessionId={lightSource?.sessionId ?? null} lightKey={lightSource?.userId ?? null} enabled={ambient} />
        <GridView participants={participants} />
      </div>
    );
  }

  const stage = active;
  const others = participants.filter((p) => p.sessionId !== stage?.sessionId);
  return (
    <div className="relative flex size-full min-h-0 flex-col gap-3">
      <div className="relative min-h-0 flex-1 [container-type:size]">
        {/* The speaker keeps a 16:9 frame; the light fills the space around it. */}
        <div className="absolute inset-0 m-auto h-[min(100cqh,calc(100cqw*9/16))] w-[min(100cqw,calc(100cqh*16/9))]">
          <AmbientLight sessionId={stage?.sessionId ?? null} lightKey={stage?.userId ?? null} enabled={ambient && !alone} />
          {stage && <ParticipantTile participant={stage} variant="stage" className="absolute inset-0" />}
        </div>
        {alone && local && <AloneCard />}
      </div>
      <Filmstrip participants={others} />
    </div>
  );
}

/** The stage on phones: the speaker fills the screen, you sit in the corner. */
function PhoneStage() {
  const { layout } = useRoom();
  const { participants, local, active, screenSharer, alone } = useStageParticipants();

  if (layout === "grid" && participants.length > 1 && !screenSharer) {
    return (
      <div className="absolute inset-x-2 bottom-[calc(var(--dock-h,96px)+8px)] top-[calc(env(safe-area-inset-top)+64px)]">
        <GridView participants={participants} />
      </div>
    );
  }

  const stage = screenSharer ?? active;
  const others = participants.filter((p) => p.sessionId !== stage?.sessionId && !p.isLocalParticipant);
  const showPip = local && stage && stage.sessionId !== local.sessionId;

  return (
    <div className="absolute inset-0">
      {stage && (
        <ParticipantTile
          participant={stage}
          variant="stage"
          trackType={screenSharer ? "screenShareTrack" : "videoTrack"}
          className="absolute inset-0 !rounded-none !shadow-none"
          highlight={false}
        />
      )}
      {screenSharer?.isLocalParticipant && <PresentingBanner />}
      {showPip && (
        <ParticipantTile
          participant={local}
          variant="pip"
          className="absolute right-3 top-[calc(env(safe-area-inset-top)+68px)] z-10 h-[132px] w-24 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
        />
      )}
      {others.length > 0 && (
        <div className="absolute inset-x-0 bottom-[calc(var(--dock-h,96px)+12px)] z-10 flex gap-2.5 overflow-x-auto px-3">
          {others.map((p) => (
            <ParticipantTile key={p.sessionId} participant={p} variant="mini" className="size-[68px] shrink-0" />
          ))}
        </div>
      )}
      {alone && <AloneCard compact />}
    </div>
  );
}

export function Stage({ phone }: { phone: boolean }) {
  return (
    <section aria-label="People in the call" className="relative size-full min-h-0">
      {phone ? <PhoneStage /> : <DesktopStage />}
      <FloatingReactions />
    </section>
  );
}
