"use client";

import { forwardRef, memo } from "react";
import {
  ParticipantView,
  SfuModels,
  hasAudio,
  useCall,
  useParticipantViewContext,
  type StreamVideoParticipant,
  type VideoPlaceholderProps,
} from "@stream-io/video-react-sdk";
import { Hand, MicOff, Pin, PinOff } from "lucide-react";
import { glowBackground, lightFor } from "@/lib/lights";
import { cn, initialsOf } from "@/lib/utils";
import { useRoom } from "./RoomContext";

export type TileVariant = "stage" | "grid" | "strip" | "pip" | "mini";

function SpeakingBars({ size = "md" }: { size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-2.5" : "h-3";
  return (
    <span aria-hidden className={cn("flex items-center gap-[2px]", h)}>
      <span className={cn("vv-bar w-[3px] rounded-[2px] bg-paper", h)} />
      <span className={cn("vv-bar w-[3px] rounded-[2px] bg-paper", h)} />
      <span className={cn("vv-bar w-[3px] rounded-[2px] bg-paper", h)} />
    </span>
  );
}

/** Shown in a tile when the person's camera is off. */
const CameraOffPlaceholder = forwardRef<HTMLDivElement, VideoPlaceholderProps>(function CameraOffPlaceholder(
  { participant, style },
  ref,
) {
  const light = lightFor(participant.userId || participant.name);
  return (
    <div
      ref={ref}
      style={{ ...style, inset: 0, background: glowBackground(light) }}
      className="flex items-center justify-center [container-type:size]"
    >
      {participant.image ? (
        <img
          src={participant.image}
          alt=""
          className="size-[min(38cqmin,96px)] min-h-9 min-w-9 rounded-full object-cover shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
        />
      ) : (
        <span
          aria-hidden
          className="flex size-[min(38cqmin,96px)] min-h-9 min-w-9 items-center justify-center rounded-full font-semibold text-studio [font-size:min(13cqmin,30px)] [font-stretch:110%]"
          style={{ backgroundColor: light.hex }}
        >
          {initialsOf(participant.name)}
        </span>
      )}
    </div>
  );
});

function TileOverlay({ variant }: { variant: TileVariant }) {
  const { participant, trackType } = useParticipantViewContext();
  const call = useCall();
  const { hands, reactions, me } = useRoom();
  const isScreen = trackType === "screenShareTrack";
  const muted = !hasAudio(participant);
  const raised = hands.hands[participant.userId];
  const reaction = reactions.recent[participant.userId];
  const poor = participant.connectionQuality === SfuModels.ConnectionQuality.POOR;
  const isMe = participant.isLocalParticipant;
  const name = isMe ? (variant === "stage" ? `${participant.name || me.name} (you)` : "You") : participant.name || "Guest";
  const small = variant === "mini" || variant === "pip";
  const pinned = Boolean(participant.pin);

  return (
    <div className="pointer-events-none absolute inset-0">
      {variant !== "mini" && (
        <div
          className={cn(
            "pill-scrim absolute flex max-w-[calc(100%-16px)] items-center gap-1.5 rounded-full font-semibold [font-stretch:106%]",
            small ? "bottom-1.5 left-1.5 h-[22px] px-2 text-[11.5px]" : variant === "stage" ? "bottom-3 left-3 h-8 px-3 text-[13.5px] sm:bottom-4 sm:left-4" : "bottom-2 left-2 h-[26px] px-2.5 text-xs sm:bottom-2.5 sm:left-2.5",
          )}
        >
          {isScreen ? null : muted ? (
            <MicOff className={cn("shrink-0", small ? "size-3" : "size-3.5")} aria-label="Muted" />
          ) : participant.isSpeaking ? (
            <SpeakingBars size={small ? "sm" : "md"} />
          ) : null}
          <span className="truncate">{isScreen ? `${participant.name || "Someone"} is presenting` : name}</span>
        </div>
      )}

      {raised && !isScreen && (
        <span
          className={cn(
            "absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-paper font-semibold text-studio animate-pop",
            small || variant === "strip" ? "size-7 justify-center" : "h-7 pl-2 pr-2.5 text-xs",
          )}
        >
          <Hand className="size-3.5" strokeWidth={2} aria-hidden />
          {small || variant === "strip" ? <span className="sr-only">Hand raised</span> : "Hand raised"}
        </span>
      )}

      {reaction && !isScreen && (
        <span
          role="img"
          aria-label={`${name} reacted`}
          className={cn(
            "pill-scrim absolute right-2 top-2 flex items-center justify-center rounded-full leading-none animate-pop",
            small ? "size-7 text-[15px]" : "size-9 text-lg",
          )}
        >
          {reaction}
        </span>
      )}

      {poor && !reaction && !small && !isScreen && (
        <span className="pill-scrim absolute right-2 top-2 flex h-[26px] items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold">
          <span aria-hidden className="flex h-[11px] items-end gap-[2px]">
            <span className="h-1 w-[3px] rounded-[1px] bg-paper" />
            <span className="h-[7px] w-[3px] rounded-[1px] bg-paper/30" />
            <span className="h-[11px] w-[3px] rounded-[1px] bg-paper/30" />
          </span>
          Weak connection
        </span>
      )}

      {call && !small && !isScreen && (
        <button
          type="button"
          onClick={() => (pinned ? call.unpin(participant.sessionId) : call.pin(participant.sessionId))}
          aria-label={pinned ? `Unpin ${name}` : `Pin ${name}`}
          className={cn(
            "pointer-events-auto absolute bottom-2 right-2 inline-flex size-9 items-center justify-center rounded-full bg-black/45 text-paper backdrop-blur-md transition-opacity hover:bg-black/60 focus-visible:opacity-100",
            pinned ? "opacity-100" : "opacity-0 group-hover/tile:opacity-100 [@media(pointer:coarse)]:hidden",
          )}
        >
          {pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
        </button>
      )}
    </div>
  );
}

type TileProps = {
  participant: StreamVideoParticipant;
  variant: TileVariant;
  trackType?: "videoTrack" | "screenShareTrack";
  className?: string;
  /** Show the white speaking ring and a soft glow in the person's light. */
  highlight?: boolean;
};

export const ParticipantTile = memo(function ParticipantTile({
  participant,
  variant,
  trackType = "videoTrack",
  className,
  highlight,
}: TileProps) {
  const speaking = highlight ?? (participant.isSpeaking && hasAudio(participant));
  const light = lightFor(participant.userId || participant.name);
  return (
    <div
      className={cn(
        "group/tile relative isolate overflow-hidden bg-panel transition-shadow duration-300",
        variant === "stage" && "rounded-[20px]",
        variant === "grid" && "rounded-[18px]",
        variant === "strip" && "rounded-[14px]",
        variant === "pip" && "rounded-2xl",
        variant === "mini" && "rounded-2xl",
        trackType === "screenShareTrack" && "bg-[#0D0E10]",
        className,
      )}
      style={{
        boxShadow:
          speaking && trackType !== "screenShareTrack"
            ? `0 0 0 2px rgb(243 242 238 / 0.92), 0 0 44px 4px rgb(${light.rgb} / 0.28)`
            : "inset 0 0 0 1px rgb(255 255 255 / 0.06)",
      }}
      data-session-id={participant.sessionId}
    >
      <ParticipantView
        participant={participant}
        trackType={trackType}
        muteAudio
        VideoPlaceholder={CameraOffPlaceholder}
        ParticipantViewUI={<TileOverlay variant={variant} />}
      />
    </div>
  );
});
