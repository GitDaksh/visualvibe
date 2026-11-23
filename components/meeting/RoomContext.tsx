"use client";

import { createContext, useContext } from "react";
import type { ChatItem } from "./hooks/useCallChat";
import type { FloatingReaction } from "./hooks/useReactions";
import type { RaisedHand } from "./hooks/useRaisedHands";

export type Panel = "chat" | "people" | null;
export type Layout = "speaker" | "grid";

export type RoomState = {
  meeting: { id: string; title: string; isHost: boolean; isPersonal: boolean };
  me: { id: string; name: string; image?: string | null };
  panel: Panel;
  setPanel: (panel: Panel) => void;
  togglePanel: (panel: Exclude<Panel, null>) => void;
  layout: Layout;
  setLayout: (layout: Layout) => void;
  ambient: boolean;
  setAmbient: (on: boolean) => void;
  chat: { items: ChatItem[]; unread: number; send: (text: string, retryId?: string) => Promise<void> };
  hands: { hands: Record<string, RaisedHand>; mineRaised: boolean; toggleMine: () => void; lower: (userId: string) => void };
  reactions: { floating: FloatingReaction[]; recent: Record<string, string>; send: (emoji: string) => void };
  copyInvite: () => void;
  /** "Share invite link" where the system share sheet opens, else "Copy invite link". */
  inviteLabel: string;
  leave: () => void;
  endForEveryone: () => void;
  openDeviceSettings: () => void;
};

export const RoomContext = createContext<RoomState | null>(null);

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used inside the call room");
  return ctx;
}
