"use client";

import { useMemo, useState } from "react";
import { Download, Link2, Play, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { lightFor } from "@/lib/lights";
import type { RecordingSummary } from "@/lib/stream-types";
import { formatClock, formatDateTime } from "@/lib/time";
import { copyText } from "@/lib/utils";
import { RecordingPlayer } from "./RecordingPlayer";

export function RecordingsBrowser({ recordings, openMeetingId }: { recordings: RecordingSummary[]; openMeetingId?: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<RecordingSummary | null>(
    () => (openMeetingId ? recordings.find((r) => r.meetingId === openMeetingId) ?? null : null),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? recordings.filter((r) => r.title.toLowerCase().includes(q)) : recordings;
  }, [query, recordings]);

  return (
    <div className="flex flex-col gap-5">
      {recordings.length > 4 && (
        <div className="flex h-11 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.05] px-4 focus-within:border-paper/50 focus-within:ring-2 focus-within:ring-paper/20 sm:max-w-[320px]">
          <Search className="size-4 text-fog" aria-hidden />
          <label htmlFor="recording-search" className="sr-only">
            Search recordings
          </label>
          <input
            id="recording-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recordings"
            className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-fog sm:text-sm"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="px-1 text-[14.5px] text-fog">No recordings match &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {filtered.map((r) => {
            const light = lightFor(r.meetingId);
            return (
              <li key={r.id} className="flex items-center gap-3.5 rounded-2xl p-2 transition-colors hover:bg-white/[0.04] sm:gap-4 sm:p-2.5">
                <button
                  type="button"
                  onClick={() => setOpen(r)}
                  aria-label={`Play ${r.title} recording`}
                  className="relative flex h-[54px] w-24 shrink-0 items-center justify-center overflow-hidden rounded-[10px] sm:h-[63px] sm:w-28"
                  style={{
                    background: `radial-gradient(120% 120% at 20% 20%, rgb(${light.rgb} / 0.45), rgb(${light.rgb} / 0.08) 60%), #17181B`,
                  }}
                >
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-paper/95 text-studio shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
                    <Play className="ml-0.5 size-3.5 fill-current" />
                  </span>
                </button>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <button type="button" onClick={() => setOpen(r)} className="truncate text-left text-[15px] font-semibold hover:underline hover:underline-offset-4 sm:text-[15.5px]">
                    {r.title}
                  </button>
                  <span className="truncate text-[13px] text-fog">
                    {formatDateTime(new Date(r.startedAt))}
                    <span className="sm:hidden">, {formatClock(r.durationMs / 1000)}</span>
                  </span>
                </div>
                <span className="tabular hidden w-16 text-[13.5px] text-mist sm:block">{formatClock(r.durationMs / 1000)}</span>
                <div className="hidden items-center gap-1 sm:flex">
                  <Button asChild variant="quiet" size="icon-sm" className="size-10">
                    <a href={r.url} target="_blank" rel="noopener noreferrer" download aria-label={`Download ${r.title} recording`}>
                      <Download />
                    </a>
                  </Button>
                  <Button
                    variant="quiet"
                    size="icon-sm"
                    className="size-10"
                    aria-label={`Copy link to ${r.title} recording`}
                    onClick={async () => {
                      if (await copyText(r.url)) toast("Recording link copied");
                    }}
                  >
                    <Link2 />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <RecordingPlayer recording={open} onClose={() => setOpen(null)} />
    </div>
  );
}
