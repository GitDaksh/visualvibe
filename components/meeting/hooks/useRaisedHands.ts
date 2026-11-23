"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Call } from "@stream-io/video-react-sdk";
import { toast } from "sonner";

const HAND_EVENT = "vv.hand";

export type RaisedHand = { userId: string; name: string; at: number };

type Me = { id: string; name: string };

/**
 * Raised hands, shared over custom events. Each client re-announces its own
 * raised hand when someone new joins, so late joiners see it too.
 */
export function useRaisedHands(call: Call, me: Me) {
  const [hands, setHands] = useState<Record<string, RaisedHand>>({});
  const mineRef = useRef(false);

  const set = useCallback((userId: string, value: RaisedHand | null) => {
    setHands((prev) => {
      if (!value && !prev[userId]) return prev;
      const next = { ...prev };
      if (value) next[userId] = value;
      else delete next[userId];
      return next;
    });
  }, []);

  const announce = useCallback(
    (raised: boolean, target?: string) => call.sendCustomEvent({ type: HAND_EVENT, raised, target }).catch(() => {}),
    [call],
  );

  useEffect(() => {
    const offCustom = call.on("custom", (event) => {
      const payload = event.custom as { type?: string; raised?: unknown; target?: unknown } | undefined;
      if (payload?.type !== HAND_EVENT) return;
      const sender = event.user;
      const target = typeof payload.target === "string" ? payload.target : sender.id;
      if (payload.raised === true && target === sender.id) {
        set(target, { userId: target, name: sender.name || "Someone", at: Date.now() });
      } else if (payload.raised === false) {
        set(target, null);
        if (target === me.id && sender.id !== me.id && mineRef.current) {
          mineRef.current = false;
          toast(`${sender.name || "The host"} lowered your hand`);
        }
      }
    });
    const offJoined = call.on("call.session_participant_joined", (event) => {
      if (event.participant?.user?.id !== me.id && mineRef.current) void announce(true);
    });
    const offLeft = call.on("call.session_participant_left", (event) => {
      const userId = event.participant?.user?.id;
      if (!userId) return;
      const stillHere = call.state.participants.some((p) => p.userId === userId);
      if (!stillHere) set(userId, null);
    });
    return () => {
      offCustom();
      offJoined();
      offLeft();
    };
  }, [announce, call, me.id, set]);

  const toggleMine = useCallback(() => {
    const raised = !mineRef.current;
    mineRef.current = raised;
    set(me.id, raised ? { userId: me.id, name: me.name, at: Date.now() } : null);
    void announce(raised);
    toast(raised ? "Hand raised. Everyone can see it." : "Hand lowered");
  }, [announce, me.id, me.name, set]);

  const lower = useCallback(
    (userId: string) => {
      if (userId === me.id) {
        if (mineRef.current) toggleMine();
        return;
      }
      set(userId, null);
      void announce(false, userId);
    },
    [announce, me.id, set, toggleMine],
  );

  return { hands, mineRaised: Boolean(hands[me.id]), toggleMine, lower };
}
