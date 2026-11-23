import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Video } from "lucide-react";
import { CopyLinkButton } from "@/components/meetings/CopyLinkButton";
import { RoomSettingsForm } from "@/components/room/RoomSettingsForm";
import { Button } from "@/components/ui/button";
import { lightFor, orbBackground } from "@/lib/lights";
import { personalRoomCode } from "@/lib/meeting-code";
import { displayInviteLink } from "@/lib/origin";
import { callLimits, getRoomSettings } from "@/lib/stream-server";
import { displayNameOf } from "@/lib/user";
import { firstNameOf } from "@/lib/utils";

export const metadata: Metadata = { title: "Your room" };

export default async function RoomPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const roomId = personalRoomCode(user.id);
  const link = await displayInviteLink(roomId);
  const light = lightFor(user.id);
  const { maxDurationMinutes } = callLimits();
  let settings: Awaited<ReturnType<typeof getRoomSettings>> | null = null;
  try {
    settings = await getRoomSettings(user.id);
  } catch {
    settings = null;
  }

  return (
    <div className="flex max-w-[880px] flex-col gap-7">
      <h1 className="text-[32px] font-semibold leading-none tracking-[-0.025em] [font-stretch:118%] sm:text-4xl">Your room</h1>

      <section
        aria-labelledby="room-name"
        className="flex flex-col gap-6 rounded-3xl border border-white/7 p-5 sm:p-7"
        style={{
          background: `radial-gradient(520px 260px at 0% 0%, rgb(${light.rgb} / 0.16), rgb(${light.rgb} / 0) 70%), rgb(255 255 255 / 0.03)`,
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-[18px]">
          <span
            aria-hidden
            className="size-[52px] shrink-0 rounded-full"
            style={{ background: orbBackground(light), boxShadow: `0 0 36px 6px rgb(${light.rgb} / 0.32)` }}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 id="room-name" className="text-2xl font-semibold leading-tight tracking-[-0.015em] [font-stretch:116%] sm:text-[26px]">
              {firstNameOf(displayNameOf(user))}&apos;s room
            </h2>
            <p className="max-w-[56ch] text-[14.5px] leading-relaxed text-fog">
              Always open at the same link. Share it once and people can drop in whenever you&apos;re there.
            </p>
          </div>
          <span className="inline-flex h-[30px] items-center gap-2 self-start rounded-full bg-white/6 px-3 text-[13px] text-mist sm:self-center">
            <span
              aria-hidden
              className={settings?.live ? "size-[7px] rounded-full bg-tally-bright shadow-[0_0_10px_rgba(255,90,78,0.7)]" : "size-[7px] rounded-full bg-fog"}
            />
            {settings?.live ? "Someone is in your room" : "Empty right now"}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex min-h-[52px] items-center gap-3 rounded-[14px] border border-white/6 bg-black/[0.22] py-1.5 pl-4 pr-1.5">
            <span className="w-11 shrink-0 text-[13px] text-fog sm:w-16">Link</span>
            <span className="min-w-0 flex-1 truncate text-[14.5px] text-[#E2E1DC]">{link}</span>
            <CopyLinkButton meetingId={roomId} icon="copy" label="Copy" toastMessage="Room link copied" variant="subtle" size="sm" className="h-10 rounded-[10px]" />
          </div>
          <div className="flex min-h-[52px] items-center gap-3 rounded-[14px] border border-white/6 bg-black/[0.22] py-1.5 pl-4 pr-1.5">
            <span className="w-11 shrink-0 text-[13px] text-fog sm:w-16">Code</span>
            <span className="min-w-0 flex-1 truncate text-[15px] tracking-[0.06em] text-[#E2E1DC]">{roomId}</span>
          </div>
        </div>

        <Button asChild variant="primary" size="lg" className="self-stretch sm:self-start">
          <Link href={`/meeting/${roomId}`}>
            <Video strokeWidth={1.9} />
            Open your room
          </Link>
        </Button>
      </section>

      <section aria-labelledby="room-settings" className="flex flex-col gap-3">
        <h2 id="room-settings" className="text-[15px] font-semibold text-fog">
          When people join your room
        </h2>
        {settings ? (
          <RoomSettingsForm
            initial={{
              muteOnJoin: settings.muteOnJoin,
              cameraOffOnJoin: settings.cameraOffOnJoin,
              maxDurationMinutes: Math.min(settings.maxDurationMinutes, maxDurationMinutes),
            }}
            maxMinutes={maxDurationMinutes}
          />
        ) : (
          <p className="rounded-2xl bg-white/[0.03] px-4 py-4 text-[14.5px] text-fog">
            Couldn&apos;t load your room settings. Refresh the page to try again.
          </p>
        )}
      </section>
    </div>
  );
}
