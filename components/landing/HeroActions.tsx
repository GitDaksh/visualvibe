"use client";

import { useState } from "react";
import Link from "next/link";
import { Video, X } from "lucide-react";
import { JoinForm } from "@/components/home/JoinForm";
import { Button } from "@/components/ui/button";

/** Start a meeting, or swap in a code field to join one. */
export function HeroActions() {
  const [joining, setJoining] = useState(false);

  if (joining) {
    return (
      <div className="flex w-full max-w-[520px] items-start gap-2 animate-pop">
        <JoinForm className="min-w-0 flex-1" autoFocus size="lg" />
        <button
          type="button"
          onClick={() => setJoining(false)}
          aria-label="Cancel joining"
          className="inline-flex size-[54px] shrink-0 items-center justify-center rounded-full text-mist transition-colors hover:bg-white/10 hover:text-paper"
        >
          <X className="size-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button asChild variant="primary" size="xl" className="h-[54px] pl-5 pr-[26px] text-base">
        <Link href="/sign-up">
          <Video strokeWidth={1.9} />
          Start a meeting
        </Link>
      </Button>
      <Button variant="secondary" size="xl" className="h-[54px] px-[22px] text-base" onClick={() => setJoining(true)}>
        Join with a code
      </Button>
    </div>
  );
}
