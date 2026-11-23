"use client";

import { useEffect, useRef, useState } from "react";
import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoom } from "../RoomContext";
import { ChatPanel } from "./ChatPanel";
import { PeoplePanel } from "./PeoplePanel";

/**
 * sheet: phones in portrait, a bottom sheet you can swipe down.
 * overlay: phones in landscape, a drawer over a dimmed call.
 * float: tablets, a drawer over the stage that leaves the controls usable.
 * docked: laptops and up, a column next to the stage.
 */
export type PanelMode = "sheet" | "overlay" | "float" | "docked";

/**
 * How much of the layout viewport the on-screen keyboard covers. iOS and
 * iPadOS keep fixed elements behind the keyboard, so panels lift by this much.
 */
function useKeyboardInset() {
  const [kb, setKb] = useState({ inset: 0, height: 0 });
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const covered = window.innerHeight - vv.height - vv.offsetTop;
      setKb((prev) => {
        const inset = covered > 80 ? Math.round(covered) : 0;
        const height = Math.round(vv.height);
        return prev.inset === inset && prev.height === height ? prev : { inset, height };
      });
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return kb;
}

/** Swipe-down-to-close for the phone sheet. Taps still reach the buttons. */
function useSwipeToClose(enabled: boolean, onClose: () => void) {
  const sheetRef = useRef<HTMLElement>(null);
  const drag = useRef<{ id: number; startY: number; dy: number; at: number; active: boolean } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (!enabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    drag.current = { id: e.pointerId, startY: e.clientY, dy: 0, at: performance.now(), active: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    const sheet = sheetRef.current;
    if (!d || d.id !== e.pointerId || !sheet) return;
    const dy = Math.max(0, e.clientY - d.startY);
    if (!d.active) {
      if (dy < 8) return;
      d.active = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      sheet.style.transition = "none";
    }
    d.dy = dy;
    sheet.style.transform = `translateY(${dy}px)`;
  };

  const onPointerEnd = () => {
    const d = drag.current;
    const sheet = sheetRef.current;
    drag.current = null;
    if (!d?.active || !sheet) return;
    const speed = d.dy / Math.max(1, performance.now() - d.at);
    sheet.style.transition = "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)";
    if (d.dy > 110 || speed > 0.55) {
      sheet.style.transform = "translateY(105%)";
      window.setTimeout(onClose, 190);
    } else {
      sheet.style.transform = "";
    }
  };

  return {
    sheetRef,
    handleProps: enabled
      ? { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd }
      : {},
  };
}

/** Chat and People, placed to suit the screen (see PanelMode). */
export function SidePanel({ mode: preferred }: { mode: PanelMode }) {
  const { panel, setPanel, chat } = useRoom();
  const { useParticipantCount } = useCallStateHooks();
  const count = useParticipantCount();
  const kb = useKeyboardInset();
  // A docked column can't move out of the keyboard's way, so it floats while typing.
  const mode: PanelMode = preferred === "docked" && kb.inset > 0 ? "float" : preferred;
  const { sheetRef, handleProps } = useSwipeToClose(mode === "sheet", () => setPanel(null));

  if (!panel) return null;

  const lifted = kb.inset > 0 && mode !== "docked";
  const style: React.CSSProperties | undefined = lifted
    ? { bottom: kb.inset + (mode === "sheet" ? 0 : 8), maxHeight: kb.height - (mode === "sheet" ? 8 : 16) }
    : undefined;

  return (
    <>
      {(mode === "sheet" || mode === "overlay") && (
        <button
          type="button"
          aria-label="Close panel"
          tabIndex={-1}
          onClick={() => setPanel(null)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] animate-[light-in_200ms_ease-out]"
        />
      )}
      <aside
        ref={sheetRef}
        aria-label={panel === "chat" ? "Chat" : "People"}
        style={style}
        className={cn(
          "flex min-h-0 flex-col overflow-hidden border-white/8 bg-panel/95 backdrop-blur-2xl",
          mode === "sheet" &&
            "fixed inset-x-0 bottom-0 z-50 h-[min(80dvh,680px)] rounded-t-[26px] border-t shadow-[0_-20px_60px_rgba(0,0,0,0.5)] animate-[sheet-up_280ms_cubic-bezier(0.2,0.8,0.2,1)]",
          mode === "overlay" &&
            "fixed bottom-[max(8px,env(safe-area-inset-bottom))] right-[max(8px,env(safe-area-inset-right))] top-[max(8px,env(safe-area-inset-top))] z-50 w-[min(380px,calc(100vw-16px))] rounded-[22px] border shadow-[0_24px_70px_rgba(0,0,0,0.5)] animate-pop",
          mode === "float" &&
            "fixed bottom-[calc(100px+env(safe-area-inset-bottom))] right-3 top-[calc(64px+env(safe-area-inset-top))] z-30 w-[min(380px,calc(100vw-24px))] rounded-[22px] border shadow-[0_24px_70px_rgba(0,0,0,0.5)] animate-pop",
          mode === "docked" && "relative w-[360px] shrink-0 rounded-[22px] border bg-panel/86",
        )}
      >
        <div {...handleProps} className={cn("shrink-0", mode === "sheet" && "touch-none select-none")}>
          {mode === "sheet" && <div aria-hidden className="mx-auto mt-2.5 h-[5px] w-10 rounded-full bg-white/20" />}
          <div className={cn("flex items-center justify-between gap-2 px-3 pb-2", mode === "sheet" ? "pt-2" : "pt-3")}>
            <div role="tablist" aria-label="Side panel" className="flex gap-0.5 rounded-full bg-white/6 p-[3px]">
              <button
                type="button"
                role="tab"
                aria-selected={panel === "chat"}
                onClick={() => setPanel("chat")}
                className={cn(
                  "inline-flex h-[38px] items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold transition-colors",
                  panel === "chat" ? "bg-white/12 text-paper" : "text-mist hover:text-paper",
                )}
              >
                Chat
                {panel !== "chat" && chat.unread > 0 && (
                  <span className="size-1.5 rounded-full bg-paper" aria-label={`${chat.unread} unread`} />
                )}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={panel === "people"}
                onClick={() => setPanel("people")}
                className={cn(
                  "tabular inline-flex h-[38px] items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold transition-colors",
                  panel === "people" ? "bg-white/12 text-paper" : "text-mist hover:text-paper",
                )}
              >
                People <span className="font-medium text-fog">{count}</span>
              </button>
            </div>
            <button
              type="button"
              aria-label="Close panel"
              onClick={() => setPanel(null)}
              className="inline-flex size-10 items-center justify-center rounded-full text-paper transition-colors hover:bg-white/10"
            >
              <X className="size-[18px]" />
            </button>
          </div>
        </div>
        {panel === "chat" ? <ChatPanel /> : <PeoplePanel />}
      </aside>
    </>
  );
}
