"use client";

import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RelativeTime } from "@/components/meetings/RelativeTime";
import { shareInvite } from "@/lib/invite";
import { lightFor } from "@/lib/lights";
import type { JoinPerson, JoinPreview } from "@/lib/stream-types";
import { formatAgo, formatDayLabel, formatTimeRange } from "@/lib/time";
import { cn, firstNameOf, inviteLink } from "@/lib/utils";

type Me = { id: string; name: string; image?: string | null };

type Props = {
  meetingId: string;
  me: Me;
  preview: JoinPreview | null;
  /** Live list once the call client is connected, else the server's snapshot. */
  people: JoinPerson[];
  /** When the current session started, if anyone is in the call. */
  liveSince: string | null;
  timeZone: string;
  ready: boolean;
  joining: boolean;
  error: string | null;
  onJoin: () => void;
};

function peopleSentence(people: JoinPerson[]) {
  const names = people.map((p) => firstNameOf(p.name));
  if (names.length === 0) return "No one else is here yet";
  if (names.length === 1) return `${names[0]} is in the call`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are in the call`;
  if (names.length === 3) return `${names[0]}, ${names[1]} and ${names[2]} are in the call`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} others are in the call`;
}

function metaLine(preview: JoinPreview | null, me: Me, timeZone: string) {
  if (!preview) return null;
  if (preview.kind === "scheduled" && preview.startsAt) {
    const start = new Date(preview.startsAt);
    const end = preview.endsAt ? new Date(preview.endsAt) : null;
    return `${formatDayLabel(start, timeZone)}, ${formatTimeRange(start, end, timeZone)}`;
  }
  if (preview.kind === "personal") {
    return preview.hostId === me.id ? "Your personal room" : `${firstNameOf(preview.hostName)}'s personal room`;
  }
  return preview.hostId === me.id ? "You're the host" : `Hosted by ${firstNameOf(preview.hostName)}`;
}

function Spinner() {
  return <span aria-hidden className="size-[18px] animate-spin rounded-full border-2 border-studio/25 border-t-studio" />;
}

export function LobbyDetails({ meetingId, me, preview, people, liveSince, timeZone, ready, joining, error, onJoin }: Props) {
  const { signOut } = useClerk();
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState(false);
  const light = lightFor(meetingId);
  const title = preview?.title ?? "Meeting";
  const meta = metaLine(preview, me, timeZone);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    const update = () => setPhone(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(t);
  }, [copied]);

  const invite = async () => {
    const result = await shareInvite(meetingId, title, phone);
    if (result === "copied") {
      setCopied(true);
      if (phone) toast("Invite link copied");
    } else if (result === "failed") {
      toast.error(`Couldn't copy the link. It's ${inviteLink(meetingId)}`);
    }
  };

  const shown = people.slice(0, 3);
  const extra = people.length - shown.length;

  return (
    <div className="flex flex-col gap-6 lg:gap-7 short:gap-4">
      <div className="flex flex-col gap-3 lg:gap-3.5">
        <span
          aria-hidden
          className="size-3 rounded-full lg:size-3.5"
          style={{ background: light.hex, boxShadow: `0 0 22px 4px rgb(${light.rgb} / 0.6)` }}
        />
        <h1 className="text-balance text-[30px] font-[620] leading-[1.06] tracking-[-0.025em] [font-stretch:118%] sm:text-[38px] lg:text-[44px] short:text-[28px]">
          {title}
        </h1>
        {(meta || liveSince) && (
          <p className="text-[15px] leading-normal text-fog">
            {meta}
            {meta && liveSince ? ". " : ""}
            {liveSince && (
              <>
                {meta ? "Started " : "Started "}
                <RelativeTime iso={liveSince} mode="since" initial={formatAgo(new Date(liveSince))} />.
              </>
            )}
          </p>
        )}
        {preview?.notes && (
          <p className="line-clamp-3 whitespace-pre-line text-[14px] leading-relaxed text-haze">{preview.notes}</p>
        )}
      </div>

      <div className="flex min-h-[34px] items-center gap-3">
        {shown.length > 0 && (
          <span aria-hidden className="flex shrink-0">
            {shown.map((p, i) => (
              <Avatar
                key={p.id}
                name={p.name}
                image={p.image}
                lightKey={p.id}
                size={34}
                className={cn("shadow-[0_0_0_2px_var(--color-studio)]", i > 0 && "-ml-2.5")}
              />
            ))}
            {extra > 0 && (
              <span className="-ml-2.5 flex size-[34px] items-center justify-center rounded-full bg-[#2A2B30] text-xs font-semibold shadow-[0_0_0_2px_var(--color-studio)]">
                +{extra}
              </span>
            )}
          </span>
        )}
        <span className="text-[14px] leading-snug text-mist" aria-live="polite">
          {peopleSentence(people)}
        </span>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex gap-2.5 bg-gradient-to-t from-studio from-60% to-transparent px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-5 sm:static sm:mx-0 sm:flex-col sm:bg-none sm:p-0">
        <Button
          variant="primary"
          size="xl"
          className="h-14 flex-1 text-base [font-stretch:108%] sm:w-full sm:flex-none"
          disabled={!ready || joining}
          onClick={onJoin}
          aria-busy={joining}
        >
          {joining ? (
            <>
              <Spinner /> Joining…
            </>
          ) : !ready ? (
            <>
              <Spinner /> Getting ready…
            </>
          ) : (
            "Join now"
          )}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => void invite()}
          aria-label={phone ? "Share invite link" : undefined}
          className="h-14 w-14 px-0 sm:h-12 sm:w-full sm:px-5"
        >
          {copied ? <Check /> : <Link2 />}
          <span className="hidden sm:inline">{copied ? "Link copied" : "Copy invite link"}</span>
        </Button>
      </div>

      {error && (
        <p role="alert" className="-mt-2 rounded-2xl border border-tally-soft/25 bg-tally/10 px-4 py-3 text-[14px] leading-snug text-tally-soft sm:mt-0">
          {error}
        </p>
      )}

      <p className="text-[13px] leading-normal text-fog">
        Joining as {me.name}.{" "}
        <button
          type="button"
          onClick={() =>
            void signOut({ redirectUrl: `/sign-in?redirect_url=${encodeURIComponent(`/meeting/${meetingId}`)}` })
          }
          className="font-medium text-paper underline-offset-4 hover:underline"
        >
          Use a different account
        </button>
      </p>
    </div>
  );
}
