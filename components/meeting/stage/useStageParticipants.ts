"use client";

import { useMemo, useRef } from "react";
import { hasScreenShare, useCallStateHooks, type StreamVideoParticipant } from "@stream-io/video-react-sdk";

function joinedAtMs(p: StreamVideoParticipant) {
  const s = Number(p.joinedAt?.seconds ?? 0);
  return s * 1000 + Math.round((p.joinedAt?.nanos ?? 0) / 1e6);
}

/**
 * Decides who is on stage. Pinned people win; otherwise the last remote person
 * who spoke stays on stage until someone else talks, so the view doesn't jump
 * around on every cough. You only take the stage when you're alone.
 */
export function useStageParticipants() {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const lastSpeaker = useRef<string | null>(null);

  return useMemo(() => {
    const local = participants.find((p) => p.isLocalParticipant) ?? null;
    const remotes = participants.filter((p) => !p.isLocalParticipant);
    const pinned = participants.find((p) => p.pin) ?? null;
    const screenSharer = participants.find((p) => hasScreenShare(p)) ?? null;
    const dominant = remotes.find((p) => p.isDominantSpeaker) ?? null;
    if (dominant) lastSpeaker.current = dominant.sessionId;
    const recent = remotes.find((p) => p.sessionId === lastSpeaker.current) ?? null;
    const active = pinned ?? recent ?? dominant ?? remotes[0] ?? local;

    // Stable order for grids and filmstrips: pinned first, then by join time.
    const ordered = [...participants].sort((a, b) => {
      if (Boolean(a.pin) !== Boolean(b.pin)) return a.pin ? -1 : 1;
      return joinedAtMs(a) - joinedAtMs(b);
    });

    return { participants: ordered, local, remotes, active, screenSharer, alone: remotes.length === 0 };
  }, [participants]);
}

/** Best column count for `count` tiles of ~16:9 inside a box. */
export function bestGrid(count: number, width: number, height: number, gap = 12) {
  if (count <= 1 || width <= 0 || height <= 0) return { cols: 1, rows: Math.max(1, count) };
  let best = { cols: 1, rows: count, area: 0 };
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const cellW = (width - gap * (cols - 1)) / cols;
    const cellH = (height - gap * (rows - 1)) / rows;
    if (cellW <= 0 || cellH <= 0) continue;
    const w = Math.min(cellW, (cellH * 16) / 9);
    const area = w * ((w * 9) / 16);
    if (area > best.area) best = { cols, rows, area };
  }
  return { cols: best.cols, rows: best.rows };
}
