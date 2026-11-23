"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Call } from "@stream-io/video-react-sdk";
import { toast } from "sonner";

export type ChatItem =
  | {
      kind: "message";
      id: string;
      userId: string;
      name: string;
      image?: string;
      text: string;
      at: number;
      mine: boolean;
      status: "sent" | "sending" | "failed";
    }
  | { kind: "system"; id: string; text: string; at: number };

type Me = { id: string; name: string; image?: string | null };

const MAX_LENGTH = 1000;
const MAX_ITEMS = 300;
const CHAT_EVENT = "vv.chat";

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

/**
 * In-call chat over Stream custom events. Messages reach everyone in the call
 * in real time and are not stored anywhere, so they disappear when it ends.
 */
export function useCallChat(call: Call, me: Me, isPanelOpen: boolean) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [unread, setUnread] = useState(0);
  const openRef = useRef(isPanelOpen);
  const ownIds = useRef(new Set<string>());

  useEffect(() => {
    openRef.current = isPanelOpen;
    if (isPanelOpen) setUnread(0);
  }, [isPanelOpen]);

  const push = useCallback((item: ChatItem) => {
    setItems((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev;
      const next = [...prev, item];
      return next.length > MAX_ITEMS ? next.slice(next.length - MAX_ITEMS) : next;
    });
  }, []);

  useEffect(() => {
    const offCustom = call.on("custom", (event) => {
      const payload = event.custom as { type?: string; id?: string; text?: unknown } | undefined;
      if (payload?.type !== CHAT_EVENT || typeof payload.text !== "string") return;
      const id = payload.id ?? newId();
      if (ownIds.current.has(id)) return;
      const user = event.user;
      push({
        kind: "message",
        id,
        userId: user.id,
        name: user.name || "Someone",
        image: user.image,
        text: payload.text.slice(0, MAX_LENGTH),
        at: Date.parse(event.created_at) || Date.now(),
        mine: user.id === me.id,
        status: "sent",
      });
      if (!openRef.current && user.id !== me.id) setUnread((n) => n + 1);
    });
    const offJoined = call.on("call.session_participant_joined", (event) => {
      const user = event.participant?.user;
      if (!user || user.id === me.id) return;
      push({ kind: "system", id: `join-${event.participant.user_session_id}`, text: `${user.name || "Someone"} joined`, at: Date.now() });
    });
    const offLeft = call.on("call.session_participant_left", (event) => {
      const user = event.participant?.user;
      if (!user || user.id === me.id) return;
      push({ kind: "system", id: `left-${event.participant.user_session_id}`, text: `${user.name || "Someone"} left`, at: Date.now() });
    });
    return () => {
      offCustom();
      offJoined();
      offLeft();
    };
  }, [call, me.id, push]);

  const send = useCallback(
    async (raw: string, retryId?: string) => {
      const text = raw.trim().slice(0, MAX_LENGTH);
      if (!text) return;
      const id = retryId ?? newId();
      ownIds.current.add(id);
      if (retryId) {
        setItems((prev) => prev.map((m) => (m.id === id && m.kind === "message" ? { ...m, status: "sending" } : m)));
      } else {
        push({
          kind: "message",
          id,
          userId: me.id,
          name: me.name,
          image: me.image ?? undefined,
          text,
          at: Date.now(),
          mine: true,
          status: "sending",
        });
      }
      try {
        await call.sendCustomEvent({ type: CHAT_EVENT, id, text });
        setItems((prev) => prev.map((m) => (m.id === id && m.kind === "message" ? { ...m, status: "sent" } : m)));
      } catch {
        setItems((prev) => prev.map((m) => (m.id === id && m.kind === "message" ? { ...m, status: "failed" } : m)));
        toast.error("Your message didn't send. Tap it to try again.");
      }
    },
    [call, me.id, me.image, me.name, push],
  );

  return { items, unread, send };
}
