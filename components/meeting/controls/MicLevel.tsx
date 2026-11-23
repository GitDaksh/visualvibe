"use client";

import { useEffect, useRef, useState } from "react";
import { createSoundDetector } from "@stream-io/video-react-sdk";
import { cn } from "@/lib/utils";

type Props = {
  stream: MediaStream | undefined;
  bars?: number;
  className?: string;
  /** Called once, the first time the mic clearly picks up sound. */
  onActive?: () => void;
};

/** A live level meter for a microphone stream. */
export function MicLevel({ stream, bars = 5, className, onActive }: Props) {
  const [level, setLevel] = useState(0);
  const onActiveRef = useRef(onActive);
  const fired = useRef(false);

  useEffect(() => {
    onActiveRef.current = onActive;
  });

  useEffect(() => {
    if (!stream) {
      setLevel(0);
      return;
    }
    let stop: (() => Promise<void>) | undefined;
    try {
      stop = createSoundDetector(
        stream,
        ({ audioLevel }) => {
          setLevel(audioLevel);
          if (!fired.current && audioLevel > 12) {
            fired.current = true;
            onActiveRef.current?.();
          }
        },
        { detectionFrequencyInMs: 80, destroyStreamOnStop: false },
      );
    } catch {
      // Some browsers refuse an AudioContext before a user gesture.
    }
    return () => {
      void stop?.().catch(() => {});
    };
  }, [stream]);

  const lit = Math.round((Math.min(100, level) / 100) * bars);
  return (
    <span aria-hidden className={cn("flex h-4 items-end gap-[3px]", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-[2px] transition-[height,background-color] duration-100", i < lit ? "bg-paper" : "bg-paper/25")}
          style={{ height: `${35 + (65 * (i + 1)) / bars}%` }}
        />
      ))}
    </span>
  );
}
