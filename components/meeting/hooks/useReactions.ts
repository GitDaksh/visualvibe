"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Call } from "@stream-io/video-react-sdk";

export const REACTIONS = [
  { emoji: "👍", code: ":like:", label: "Thumbs up" },
  { emoji: "❤️", code: ":heart:", label: "Heart" },
  { emoji: "😂", code: ":laughing:", label: "Laughing" },
  { emoji: "🎉", code: ":tada:", label: "Celebrate" },
  { emoji: "👏", code: ":clap:", label: "Clap" },
  { emoji: "😮", code: ":open_mouth:", label: "Surprised" },
] as const;

const BY_CODE: Record<string, string> = Object.fromEntries(REACTIONS.map((r) => [r.code, r.emoji]));

export type FloatingReaction = { id: string; emoji: string; name: string; offset: number };

type Me = { id: string; name: string };

/** Emoji reactions: a float-up animation for everyone plus a short badge on the sender's tile. */
export function useReactions(call: Call, me: Me) {
  const [floating, setFloating] = useState<FloatingReaction[]>([]);
  const [recent, setRecent] = useState<Record<string, string>>({});
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  }, []);

  const show = useCallback(
    (emoji: string, userId: string, name: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setFloating((prev) => [...prev.slice(-12), { id, emoji, name, offset: Math.round(Math.random() * 120) }]);
      setRecent((prev) => ({ ...prev, [userId]: emoji }));
      later(() => setFloating((prev) => prev.filter((r) => r.id !== id)), 2800);
      later(
        () =>
          setRecent((prev) => {
            if (prev[userId] !== emoji) return prev;
            const next = { ...prev };
            delete next[userId];
            return next;
          }),
        3600,
      );
    },
    [later],
  );

  useEffect(() => {
    const off = call.on("call.reaction_new", (event) => {
      const reaction = event.reaction;
      if (!reaction?.user || reaction.user.id === me.id) return;
      const emoji = (reaction.custom?.emoji as string | undefined) ?? (reaction.emoji_code ? BY_CODE[reaction.emoji_code] : undefined);
      if (emoji) show(emoji, reaction.user.id, reaction.user.name || "Someone");
    });
    const pending = timers.current;
    return () => {
      off();
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, [call, me.id, show]);

  const send = useCallback(
    (emoji: string) => {
      const def = REACTIONS.find((r) => r.emoji === emoji);
      show(emoji, me.id, "You");
      void call.sendReaction({ type: "reaction", emoji_code: def?.code, custom: { emoji } }).catch(() => {});
    },
    [call, me.id, show],
  );

  return { floating, recent, send };
}
