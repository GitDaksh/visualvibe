"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, SendHorizontal } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ChatItem } from "../hooks/useCallChat";
import { useRoom } from "../RoomContext";

const URL_PATTERN = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?])/g;

function Linkified({ text }: { text: string }) {
  const parts = text.split(URL_PATTERN);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="break-all underline decoration-paper/40 underline-offset-2 hover:decoration-paper">
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function timeOf(at: number) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(at);
}

function isContinuation(prev: ChatItem | undefined, item: ChatItem) {
  return (
    prev?.kind === "message" && item.kind === "message" && prev.userId === item.userId && item.at - prev.at < 3 * 60_000
  );
}

export function ChatPanel() {
  const { chat, me } = useRoom();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [missed, setMissed] = useState(0);
  const lastCount = useRef(chat.items.length);

  // Stick to the newest message unless the reader has scrolled up.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const added = chat.items.length - lastCount.current;
    lastCount.current = chat.items.length;
    if (added <= 0) return;
    const last = chat.items[chat.items.length - 1];
    if (atBottom || (last?.kind === "message" && last.mine)) {
      el.scrollTop = el.scrollHeight;
      setMissed(0);
    } else {
      setMissed((m) => m + added);
    }
  }, [chat.items, atBottom]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Grow the composer with its content, up to four lines.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [draft]);

  const submit = () => {
    if (!draft.trim()) return;
    void chat.send(draft);
    setDraft("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        <div
          ref={listRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
            setAtBottom(bottom);
            if (bottom) setMissed(0);
          }}
          className="absolute inset-0 overflow-y-auto overscroll-contain px-4 pb-4"
          aria-live="polite"
          aria-relevant="additions"
        >
          {chat.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-1.5 px-4 text-center">
              <p className="text-[15px] font-semibold">No messages yet</p>
              <p className="max-w-[30ch] text-sm leading-relaxed text-fog">Links and questions you drop here reach everyone in the call.</p>
            </div>
          ) : (
            <div className="flex min-h-full flex-col justify-end">
              {chat.items.map((item, i) => {
                if (item.kind === "system") {
                  return (
                    <p key={item.id} className="mt-4 text-center text-[12.5px] text-fog">
                      {item.text}
                    </p>
                  );
                }
                const cont = isContinuation(chat.items[i - 1], item);
                const failed = item.status === "failed";
                return (
                  <div key={item.id} className={cn("flex gap-2.5", cont ? "mt-1" : "mt-4")}>
                    <div className="w-7 shrink-0">
                      {!cont && <Avatar name={item.name} image={item.image} lightKey={item.userId} size={28} className="mt-0.5" />}
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      {!cont && (
                        <div className="flex items-baseline gap-2">
                          <span className="truncate text-[13px] font-[620] [font-stretch:106%]">{item.mine ? "You" : item.name}</span>
                          <span className="shrink-0 text-xs text-fog">{timeOf(item.at)}</span>
                        </div>
                      )}
                      {failed ? (
                        <button
                          type="button"
                          onClick={() => void chat.send(item.text, item.id)}
                          className="text-left text-[14px] leading-[1.45] text-paper/60"
                        >
                          <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">{item.text}</span>
                          <span className="mt-0.5 block text-xs font-semibold text-tally-soft">Didn&apos;t send. Tap to try again.</span>
                        </button>
                      ) : (
                        <p
                          className={cn(
                            "whitespace-pre-wrap text-[14px] leading-[1.45] text-paper/92 [overflow-wrap:anywhere]",
                            item.status === "sending" && "text-paper/60",
                          )}
                        >
                          <Linkified text={item.text} />
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {missed > 0 && (
          <button
            type="button"
            onClick={() => {
              const el = listRef.current;
              if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
            }}
            className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-paper px-3.5 py-1.5 text-[12.5px] font-semibold text-studio shadow-[0_8px_24px_rgba(0,0,0,0.4)] animate-pop"
          >
            <ArrowDown className="size-3.5" />
            {missed === 1 ? "1 new message" : `${missed} new messages`}
          </button>
        )}
      </div>

      <form
        className="shrink-0 border-t border-white/6 px-3 pb-[max(14px,env(safe-area-inset-bottom))] pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex items-end gap-2 rounded-[22px] border border-white/8 bg-white/[0.06] py-[5px] pl-4 pr-[5px] transition-[border-color,box-shadow] focus-within:border-paper/40 focus-within:ring-2 focus-within:ring-paper/15">
          <label htmlFor="chat-input" className="sr-only">
            Message everyone
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={1}
            value={draft}
            maxLength={1000}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Message everyone"
            className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-[7px] text-base leading-[22px] text-paper outline-none placeholder:text-fog sm:text-[14px]"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!draft.trim()}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-paper text-studio transition-[background-color,opacity,transform] hover:bg-white active:scale-95 disabled:opacity-35"
          >
            <SendHorizontal className="size-4" />
          </button>
        </div>
        <p className="mt-2.5 px-1.5 text-xs leading-snug text-fog">
          Only people in the call can see messages. They&apos;re cleared when the call ends.
        </p>
        <span className="sr-only">Signed in as {me.name}</span>
      </form>
    </div>
  );
}
