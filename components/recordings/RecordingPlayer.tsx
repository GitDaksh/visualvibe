"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { RecordingSummary } from "@/lib/stream-types";
import { formatClock, formatDateTime } from "@/lib/time";

const SPEEDS = [1, 1.25, 1.5, 2];

/** Plays a recording in place, with a scrubber, speed control and download. */
export function RecordingPlayer({ recording, onClose }: { recording: RecordingSummary | null; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setPlaying(false);
    setTime(0);
    setDuration(recording ? recording.durationMs / 1000 : 0);
    setFailed(false);
  }, [recording]);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => setFailed(true));
    else v.pause();
  }, []);

  const seek = (seconds: number) => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(seconds)) return;
    v.currentTime = Math.max(0, Math.min(seconds, v.duration || duration));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      toggle();
    } else if (e.key === "ArrowRight") seek(time + 10);
    else if (e.key === "ArrowLeft") seek(time - 10);
  };

  const progress = duration ? (time / duration) * 100 : 0;

  return (
    <Dialog open={Boolean(recording)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="bg-studio p-0 sm:max-w-[960px] sm:bg-transparent sm:border-0 sm:shadow-none"
        overlayClassName="bg-black/75"
        onKeyDown={onKeyDown}
      >
        {recording && (
          <div className="flex flex-col gap-4 p-4 pt-5 sm:p-0">
            <div className="flex items-start justify-between gap-4 pr-12 sm:pr-14">
              <div className="flex min-w-0 flex-col gap-1">
                <DialogTitle className="truncate text-xl sm:text-[22px]">{recording.title}</DialogTitle>
                <DialogDescription className="text-[13.5px]">{formatDateTime(new Date(recording.startedAt))}</DialogDescription>
              </div>
              <Button asChild variant="secondary" size="md" className="hidden sm:inline-flex">
                <a href={recording.url} target="_blank" rel="noopener noreferrer" download>
                  <Download />
                  Download
                </a>
              </Button>
            </div>

            <div
              ref={frameRef}
              className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-[#0D0E10] shadow-[0_40px_100px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)] sm:rounded-[20px]"
            >
              <video
                ref={videoRef}
                src={recording.url}
                className="size-full bg-black object-contain"
                playsInline
                preload="metadata"
                onClick={toggle}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => {
                  if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration);
                  e.currentTarget.playbackRate = speed;
                }}
                onError={() => setFailed(true)}
                muted={muted}
              />

              {failed && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-6 text-center">
                  <p className="font-semibold">This recording can&apos;t play here</p>
                  <p className="max-w-[40ch] text-sm text-haze">The link may have expired. Download it instead, or refresh the page for a fresh link.</p>
                </div>
              )}

              {!playing && !failed && (
                <button
                  type="button"
                  onClick={toggle}
                  aria-label="Play"
                  className="absolute left-1/2 top-1/2 inline-flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-paper text-studio shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-transform hover:scale-105"
                >
                  <Play className="ml-1 size-7 fill-current" />
                </button>
              )}

              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-2.5 pt-10 sm:px-4 sm:pb-3.5">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={time}
                  onChange={(e) => seek(Number(e.target.value))}
                  aria-label="Seek"
                  aria-valuetext={`${formatClock(time)} of ${formatClock(duration)}`}
                  className="h-4 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-paper [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-paper"
                  style={{
                    background: `linear-gradient(to right, #F3F2EE ${progress}%, rgba(243,242,238,0.22) ${progress}%) center / 100% 4px no-repeat`,
                  }}
                />
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                  <Button variant="subtle" size="icon" onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="size-10 sm:size-11">
                    {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"} className="size-10 sm:size-11">
                    {muted ? <VolumeX /> : <Volume2 />}
                  </Button>
                  <span className="tabular text-[13px] text-[#E2E1DC] sm:text-[13.5px]">
                    {formatClock(time)} / {formatClock(duration)}
                  </span>
                  <span className="flex-1" />
                  <Button
                    variant="subtle"
                    size="sm"
                    className="tabular h-9 min-w-[52px] px-3"
                    aria-label={`Playback speed ${speed}x`}
                    onClick={() => {
                      const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
                      setSpeed(next);
                      if (videoRef.current) videoRef.current.playbackRate = next;
                    }}
                  >
                    {speed}×
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Full screen"
                    className="size-10 sm:size-11"
                    onClick={() => {
                      const el = frameRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
                      const video = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
                      if (el?.requestFullscreen) void el.requestFullscreen();
                      else if (video?.webkitEnterFullscreen) video.webkitEnterFullscreen();
                    }}
                  >
                    <Maximize />
                  </Button>
                </div>
              </div>
            </div>

            <Button asChild variant="secondary" size="lg" className="sm:hidden">
              <a href={recording.url} target="_blank" rel="noopener noreferrer" download>
                <Download />
                Download
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
