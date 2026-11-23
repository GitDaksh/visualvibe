"use client";

import { useEffect, useRef, useState } from "react";
import { glowBackground, lightFor } from "@/lib/lights";
import { cn } from "@/lib/utils";

type Props = {
  /** Session of the person whose video lights the room. */
  sessionId: string | null;
  /** Light from a specific video element instead (the lobby preview). */
  selector?: string;
  /** Stable key for their person light, used when their camera is off. */
  lightKey: string | null;
  enabled: boolean;
  className?: string;
};

const W = 32;
const H = 18;

/**
 * The room takes its light from whoever is on stage: their video is sampled a
 * few times a second into a tiny canvas, which is stretched and blurred behind
 * the stage. It never reads pixels back, so it costs almost nothing.
 */
export function AmbientLight({ sessionId, selector, lightKey, enabled, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lit, setLit] = useState(false);
  const litRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    litRef.current = false;
    setLit(false);
    const query = selector
      ? selector
      : sessionId
        ? `video.str-video__video[data-session-id="${CSS.escape(sessionId)}"]:not(.str-video__video--screen-share)`
        : null;
    if (!enabled || !query || !canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let first = true;
    const draw = () => {
      if (document.hidden) return;
      const video = document.querySelector<HTMLVideoElement>(query);
      const ready = video && video.readyState >= 2 && video.videoWidth > 0 && !video.classList.contains("str-video__video--not-playing");
      if (!ready) {
        if (litRef.current) {
          litRef.current = false;
          setLit(false);
        }
        return;
      }
      // Blend new frames in gradually so the light drifts instead of flickering.
      ctx.globalAlpha = first || reduced ? 1 : 0.22;
      ctx.drawImage(video, 0, 0, W, H);
      first = false;
      if (!litRef.current) {
        litRef.current = true;
        setLit(true);
      }
    };
    draw();
    const id = setInterval(draw, reduced ? 1000 : 160);
    return () => clearInterval(id);
  }, [enabled, selector, sessionId]);

  const light = lightFor(lightKey);

  return (
    <div aria-hidden className={cn("pointer-events-none absolute -inset-x-[12%] -inset-y-[14%] overflow-visible", className)}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className={cn(
          "absolute inset-[8%] h-[84%] w-[84%] blur-[90px] saturate-[1.6] transition-opacity duration-1000",
          enabled && lit ? "opacity-60" : "opacity-0",
        )}
      />
      <div
        className={cn("absolute inset-[18%] rounded-full blur-[80px] transition-opacity duration-1000", enabled && !lit && lightKey ? "opacity-40" : "opacity-0")}
        style={{ background: glowBackground(light, 0.5, "transparent") }}
      />
    </div>
  );
}
