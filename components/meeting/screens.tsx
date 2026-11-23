import Link from "next/link";
import { CircleDot } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { JoinForm } from "@/components/home/JoinForm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The quiet full-page screens around a call: not found, ended, left,
 * removed, disconnected. One centered column with the next step as a button.
 */
export function StatusScreen({
  children,
  className,
  homeHref = "/home",
}: {
  children: React.ReactNode;
  className?: string;
  homeHref?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-studio text-paper">
      <header className="shrink-0 pl-[max(20px,env(safe-area-inset-left))] pr-[max(20px,env(safe-area-inset-right))] pt-[max(18px,env(safe-area-inset-top))] sm:px-7 sm:pt-5">
        <Link href={homeHref} aria-label="VisualVibe home" className="inline-flex rounded-full">
          <Logo size={26} />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-[max(56px,env(safe-area-inset-bottom))] pt-6 sm:px-7 sm:pb-[72px]">
        <div className={cn("flex w-full max-w-[480px] flex-col items-center gap-6 text-center", className)}>{children}</div>
      </main>
    </div>
  );
}

export function StatusHeading({ title, body }: { title: React.ReactNode; body?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h1 className="text-balance text-[28px] font-[620] leading-[1.1] tracking-[-0.02em] [font-stretch:116%] sm:text-[34px]">{title}</h1>
      {body && <p className="text-pretty text-[15px] leading-relaxed text-fog">{body}</p>}
    </div>
  );
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full flex-col gap-2.5 min-[420px]:w-auto min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:justify-center">{children}</div>;
}

function HomeButton({ primary }: { primary?: boolean }) {
  return (
    <Button asChild variant={primary ? "primary" : "secondary"} size="lg">
      <Link href="/home">Back to home</Link>
    </Button>
  );
}

export function NotFoundScreen() {
  return (
    <StatusScreen>
      <StatusHeading
        title="We couldn't find that meeting"
        body="Check the link for typos, or ask the host to send it again. You can also paste it below."
      />
      <JoinForm className="w-full text-left" />
      <Link href="/home" className="text-sm text-mist underline-offset-4 hover:text-paper hover:underline">
        Back to home
      </Link>
    </StatusScreen>
  );
}

export function EndedScreen({ detail, showRecordings }: { detail: string; showRecordings: boolean }) {
  return (
    <StatusScreen>
      <StatusHeading title="This meeting has ended" body={detail} />
      {showRecordings && (
        <div className="flex w-full items-center gap-3.5 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3.5 text-left">
          <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tally/16 text-tally-bright">
            <CircleDot className="size-4" />
          </span>
          <p className="text-[14px] leading-snug text-mist">
            This call was recorded. It shows up in Recordings once it&apos;s processed, usually within a few minutes.
          </p>
        </div>
      )}
      <Actions>
        <HomeButton primary />
        {showRecordings && (
          <Button asChild variant="secondary" size="lg">
            <Link href="/recordings">Go to recordings</Link>
          </Button>
        )}
      </Actions>
    </StatusScreen>
  );
}

export function LeftScreen({
  title,
  detail,
  lightHex,
  onRejoin,
}: {
  title: string;
  detail: string;
  lightHex: string;
  onRejoin: () => void;
}) {
  return (
    <StatusScreen>
      <span aria-hidden className="size-3 rounded-full opacity-55" style={{ background: lightHex }} />
      <StatusHeading title={`You left ${title}`} body={detail} />
      <Actions>
        <Button variant="primary" size="lg" onClick={onRejoin}>
          Rejoin
        </Button>
        <HomeButton />
      </Actions>
    </StatusScreen>
  );
}

export function RemovedScreen({ title }: { title: string }) {
  return (
    <StatusScreen>
      <StatusHeading title="You were removed from the meeting" body={`The host removed you from ${title}.`} />
      <Actions>
        <HomeButton primary />
      </Actions>
    </StatusScreen>
  );
}

export function DisconnectedScreen({ onRejoin }: { onRejoin: () => void }) {
  return (
    <StatusScreen>
      <StatusHeading
        title="You were disconnected"
        body="Your connection dropped and we couldn't get you back in. Rejoin once your internet is steady."
      />
      <Actions>
        <Button variant="primary" size="lg" onClick={onRejoin}>
          Rejoin
        </Button>
        <HomeButton />
      </Actions>
    </StatusScreen>
  );
}

export function ErrorScreen({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return (
    <StatusScreen>
      <StatusHeading title={title} body={message} />
      <Actions>
        {onRetry && (
          <Button variant="primary" size="lg" onClick={onRetry}>
            Try again
          </Button>
        )}
        <HomeButton primary={!onRetry} />
      </Actions>
    </StatusScreen>
  );
}
