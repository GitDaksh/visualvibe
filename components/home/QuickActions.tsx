"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Video } from "lucide-react";
import { toast } from "sonner";
import { createInstantMeeting } from "@/actions/meeting.actions";
import { ScheduleDialog } from "@/components/meetings/ScheduleDialog";
import { Button } from "@/components/ui/button";
import { JoinForm } from "./JoinForm";

export function StartMeetingButton({ className, size = "lg" }: { className?: string; size?: "lg" | "xl" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="primary"
      size={size}
      className={className}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await createInstantMeeting();
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          router.push(`/meeting/${result.data.id}`);
        })
      }
    >
      <Video strokeWidth={1.9} />
      {pending ? "Starting…" : "Start a meeting"}
    </Button>
  );
}

export function QuickActions() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
      <div className="grid grid-cols-2 gap-2.5 sm:flex sm:gap-2.5">
        <StartMeetingButton className="w-full px-4 sm:w-auto sm:px-5" />
        <ScheduleDialog>
          <Button variant="secondary" size="lg" className="w-full sm:w-auto">
            <CalendarDays strokeWidth={1.75} />
            Schedule
          </Button>
        </ScheduleDialog>
      </div>
      <JoinForm className="w-full sm:max-w-[420px] sm:flex-1" />
    </div>
  );
}
