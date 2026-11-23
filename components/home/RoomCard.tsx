import Link from "next/link";
import { CopyLinkButton } from "@/components/meetings/CopyLinkButton";
import { Button } from "@/components/ui/button";

export function RoomCard({ roomId, displayLink }: { roomId: string; displayLink: string }) {
  return (
    <section
      aria-labelledby="room-heading"
      className="flex flex-col gap-4 rounded-[22px] border border-white/7 bg-white/[0.03] p-5 sm:p-[22px]"
    >
      <div className="flex flex-col gap-1.5">
        <h2 id="room-heading" className="text-lg font-semibold [font-stretch:112%]">
          Your room
        </h2>
        <p className="text-sm leading-relaxed text-fog">Always open at the same link. Good for quick calls you don&apos;t plan.</p>
      </div>
      <div className="flex h-11 items-center gap-2 rounded-xl border border-white/6 bg-black/25 pl-3.5 pr-1">
        <span className="min-w-0 flex-1 truncate text-[13.5px] text-mist">{displayLink}</span>
        <CopyLinkButton
          meetingId={roomId}
          iconOnly
          icon="copy"
          label="Copy your room link"
          toastMessage="Room link copied"
          variant="ghost"
          className="size-9 rounded-[9px]"
        />
      </div>
      <Button asChild variant="secondary" size="md">
        <Link href={`/meeting/${roomId}`}>Open your room</Link>
      </Button>
    </section>
  );
}
