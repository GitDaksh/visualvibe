"use client";

import { useMemo, useState } from "react";
import {
  OwnCapability,
  hasAudio,
  hasVideo,
  useCall,
  useCallStateHooks,
  type StreamVideoParticipant,
} from "@stream-io/video-react-sdk";
import { Link2, MicOff, MoreHorizontal, Pin, PinOff, Search, UserX, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatAgo } from "@/lib/time";
import { useRoom } from "../RoomContext";

function PersonRow({
  p,
  hostId,
  canMute,
  canKick,
  onRemove,
}: {
  p: StreamVideoParticipant;
  hostId?: string;
  canMute: boolean;
  canKick: boolean;
  onRemove: (p: StreamVideoParticipant) => void;
}) {
  const call = useCall();
  const muted = !hasAudio(p);
  const camOff = !hasVideo(p);
  const isMe = p.isLocalParticipant;
  const subtitle = [p.userId === hostId ? "Host" : null, p.isSpeaking && !muted ? "Speaking" : null].filter(Boolean).join(", ");
  const pinned = Boolean(p.pin);

  return (
    <div className="group flex min-h-[52px] items-center gap-3 rounded-xl pl-2.5 pr-1 transition-colors hover:bg-white/[0.06]">
      <Avatar name={p.name} image={p.image} lightKey={p.userId} size={32} ring={p.isSpeaking && !muted} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">
          {p.name || "Guest"}
          {isMe ? " (you)" : ""}
        </span>
        {subtitle && <span className="truncate text-xs text-fog">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-1.5 text-fog">
        {camOff && <VideoOff className="size-4" aria-label="Camera off" />}
        {muted && <MicOff className="size-4 text-tally-soft" aria-label="Muted" />}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Options for ${p.name || "this person"}`}
          className="inline-flex size-10 items-center justify-center rounded-full text-fog transition-colors hover:bg-white/10 hover:text-paper data-[state=open]:bg-white/12 data-[state=open]:text-paper"
        >
          <MoreHorizontal className="size-[18px]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" className="w-[232px]">
          <DropdownMenuItem onSelect={() => (pinned ? call?.unpin(p.sessionId) : call?.pin(p.sessionId))}>
            {pinned ? <PinOff /> : <Pin />}
            {pinned ? "Unpin" : "Pin for me"}
          </DropdownMenuItem>
          {canMute && !isMe && (
            <DropdownMenuItem
              disabled={muted}
              onSelect={() =>
                void call
                  ?.muteUser(p.userId, "audio")
                  .then(() => toast(`${p.name || "They"} muted`))
                  .catch(() => toast.error("Couldn't mute them."))
              }
            >
              <MicOff />
              {muted ? "Already muted" : "Mute"}
            </DropdownMenuItem>
          )}
          {canKick && !isMe && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem tone="danger" onSelect={() => onRemove(p)}>
                <UserX /> Remove from call
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function PeoplePanel() {
  const call = useCall();
  const { hands, copyInvite, inviteLabel, meeting } = useRoom();
  const { useParticipants, useHasPermissions, useCallCreatedBy } = useCallStateHooks();
  const participants = useParticipants();
  const createdBy = useCallCreatedBy();
  const canMute = useHasPermissions(OwnCapability.MUTE_USERS);
  const canKick = useHasPermissions(OwnCapability.KICK_USER);
  const [query, setQuery] = useState("");
  const [removing, setRemoving] = useState<StreamVideoParticipant | null>(null);

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    return participants
      .filter((p) => !q || (p.name || "").toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.isLocalParticipant !== b.isLocalParticipant) return a.isLocalParticipant ? -1 : 1;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [participants, query]);

  const raised = Object.values(hands.hands).sort((a, b) => a.at - b.at);
  const isHost = meeting.isHost;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-3 pb-2 pt-1">
        <div className="flex h-10 items-center gap-2.5 rounded-full border border-white/8 bg-white/[0.06] px-3.5 focus-within:border-paper/40">
          <Search className="size-4 shrink-0 text-fog" aria-hidden />
          <label htmlFor="people-search" className="sr-only">
            Search people
          </label>
          <input
            id="people-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people"
            className="h-9 min-w-0 flex-1 bg-transparent text-base text-paper outline-none placeholder:text-fog sm:text-sm"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2">
        {raised.length > 0 && (
          <section aria-label="Raised hands" className="mb-3">
            <p className="px-2.5 pb-1.5 pt-2 text-[12.5px] text-fog">Raised hands ({raised.length})</p>
            {raised.map((h) => {
              const person = participants.find((p) => p.userId === h.userId);
              return (
                <div key={h.userId} className="flex min-h-14 items-center gap-3 rounded-xl bg-paper/[0.06] px-2.5">
                  <Avatar name={h.name} image={person?.image} lightKey={h.userId} size={32} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold">{person?.isLocalParticipant ? "You" : h.name}</span>
                    <span className="text-xs text-fog">Raised {formatAgo(new Date(h.at))}</span>
                  </div>
                  {(isHost || person?.isLocalParticipant) && (
                    <Button variant="secondary" size="sm" className="h-8 px-3 text-[12.5px]" onClick={() => hands.lower(h.userId)}>
                      Lower hand
                    </Button>
                  )}
                </div>
              );
            })}
          </section>
        )}

        <p className="px-2.5 pb-1.5 pt-2 text-[12.5px] text-fog">In the call ({participants.length})</p>
        {sorted.map((p) => (
          <PersonRow key={p.sessionId} p={p} hostId={createdBy?.id} canMute={canMute} canKick={canKick} onRemove={setRemoving} />
        ))}
        {sorted.length === 0 && <p className="px-2.5 py-4 text-sm text-fog">No one matches &ldquo;{query}&rdquo;.</p>}
      </div>

      <div className="flex shrink-0 gap-2 border-t border-white/6 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
        {canMute && (
          <Button
            variant="secondary"
            size="md"
            className="flex-1 px-3"
            onClick={() =>
              void call
                ?.muteAllUsers("audio")
                .then(() => toast("Everyone is muted"))
                .catch(() => toast.error("Couldn't mute everyone."))
            }
          >
            <MicOff />
            Mute everyone
          </Button>
        )}
        <Button variant="secondary" size="md" className="flex-1 px-3" onClick={copyInvite}>
          <Link2 />
          {inviteLabel}
        </Button>
      </div>

      <Dialog open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent className="sm:max-w-[420px]" hideClose>
          <div className="flex flex-col gap-5 p-6 sm:p-7">
            <div className="flex flex-col gap-1.5">
              <DialogTitle className="text-xl">Remove {removing?.name || "them"} from the call?</DialogTitle>
              <DialogDescription>They can join again with the invite link.</DialogDescription>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setRemoving(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  const person = removing;
                  setRemoving(null);
                  if (!person) return;
                  void call
                    ?.kickUser({ user_id: person.userId })
                    .then(() => toast(`${person.name || "They"} removed`))
                    .catch(() => toast.error("Couldn't remove them."));
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
