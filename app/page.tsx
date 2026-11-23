import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { MonitorUp, Video } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { CallPreview, Glow, Photo } from "@/components/landing/CallPreview";
import { HeroActions } from "@/components/landing/HeroActions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: { absolute: "VisualVibe: video meetings in your browser" },
};

const SOURCE_URL = "https://github.com/GitDaksh/visualvibe";

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-5 sm:px-8 lg:px-10 ${className}`}>{children}</div>;
}

function SpeakerFigure({ person, caption }: { person: "arjun" | "sofia"; caption: string }) {
  return (
    <figure className="flex flex-col gap-3 sm:gap-3.5">
      <div className="relative aspect-[4/3]">
        <Glow
          person={person}
          className="absolute -inset-[18%] size-[136%] opacity-70 [mask-image:radial-gradient(closest-side,#000_35%,transparent)]"
        />
        <div className="absolute inset-0 overflow-hidden rounded-[16px] shadow-[0_0_0_2px_rgba(243,242,238,0.9)] sm:rounded-[22px]">
          <Photo person={person} sizes="(min-width: 1024px) 330px, 45vw" className="size-full object-[50%_30%]" />
        </div>
      </div>
      <figcaption className="text-[13px] text-haze sm:text-sm">{caption}</figcaption>
    </figure>
  );
}

function Feature({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-[18px]">
      <div aria-hidden className="flex h-[176px] flex-col justify-end gap-3">
        {children}
      </div>
      <h3 className="mt-2 text-[21px] font-[620] tracking-[-0.01em] [font-stretch:112%]">{title}</h3>
      <p className="text-[15.5px] leading-relaxed text-haze">{body}</p>
    </div>
  );
}

function ScreenShareArt() {
  return (
    <>
      <span className="flex h-8 items-center gap-2 self-start rounded-full bg-white/8 px-3 text-[13px] font-semibold">
        <MonitorUp className="size-4" strokeWidth={1.75} />
        Kabir Rao is presenting
      </span>
      <div className="h-[118px] overflow-hidden whitespace-nowrap rounded-xl border border-white/7 bg-[#17181C] px-4 py-3.5 font-mono text-[12px] leading-[1.75] text-[#C9CCD3]">
        <div>
          <span className="text-[#C3A6FF]">export function</span> <span className="text-[#82B4FF]">useAmbientLight</span>(video) {"{"}
        </div>
        <div className="pl-4">
          <span className="text-[#C3A6FF]">const</span> ctx = canvas.<span className="text-[#82B4FF]">getContext</span>(
          <span className="text-[#B5D98C]">&apos;2d&apos;</span>);
        </div>
        <div className="pl-4">
          ctx.<span className="text-[#82B4FF]">drawImage</span>(video, <span className="text-[#F4A77A]">0</span>,{" "}
          <span className="text-[#F4A77A]">0</span>, <span className="text-[#F4A77A]">32</span>,{" "}
          <span className="text-[#F4A77A]">18</span>);
        </div>
        <div>{"}"}</div>
      </div>
    </>
  );
}

function RecordingsArt() {
  return (
    <>
      <div className="flex items-center gap-3.5 rounded-2xl bg-white/[0.04] p-2.5">
        <span className="grid h-[54px] w-24 shrink-0 grid-cols-2 gap-px overflow-hidden rounded-[9px]">
          <Photo person="arjun" sizes="48px" className="size-full" />
          <Photo person="kabir" sizes="48px" className="size-full" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-semibold">Design review</span>
          <span className="text-[12.5px] text-fog">Friday, 20 November</span>
        </span>
        <span className="tabular pr-1.5 text-[13px] text-mist">48:10</span>
      </div>
      <div className="flex items-center gap-3.5 rounded-2xl p-2.5 opacity-60">
        <span className="h-[54px] w-24 shrink-0 rounded-[9px] bg-[#1E1F23]" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-semibold">Weekly sync</span>
          <span className="text-[12.5px] text-fog">Monday, 16 November</span>
        </span>
      </div>
    </>
  );
}

function DevicesArt() {
  return (
    <div className="flex items-end gap-4">
      <div className="relative h-[150px] w-[78px] shrink-0 overflow-hidden rounded-[16px] border-[3px] border-[#2A2B30] bg-panel">
        <Photo person="sofia" sizes="78px" className="absolute inset-0 size-full object-[50%_30%]" />
        <span className="absolute right-1.5 top-2 h-7 w-5 overflow-hidden rounded-[5px] ring-1 ring-white/30">
          <Photo person="kabir" sizes="20px" className="size-full" />
        </span>
        <span className="absolute inset-x-2 bottom-2 flex justify-center gap-1">
          <span className="size-3.5 rounded-full bg-white/25" />
          <span className="size-3.5 rounded-full bg-white/25" />
          <span className="h-3.5 w-5 rounded-full bg-tally" />
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center">
        <div className="grid aspect-[16/10] w-full max-w-[220px] grid-cols-2 grid-rows-2 gap-[3px] overflow-hidden rounded-t-[10px] border-[3px] border-b-0 border-[#2A2B30] bg-[#2A2B30]">
          <Photo person="arjun" sizes="110px" className="size-full min-h-0" />
          <Photo person="kabir" sizes="110px" className="size-full min-h-0" />
          <Photo person="sofia" sizes="110px" className="size-full min-h-0" />
          <span className="flex min-h-0 items-center justify-center bg-[radial-gradient(circle_at_50%_45%,rgba(77,182,166,0.3),rgba(77,182,166,0)_65%),#17181B]">
            <span className="flex size-6 items-center justify-center rounded-full bg-light-teal text-[9px] font-[650] text-studio">RD</span>
          </span>
        </div>
        <div className="h-2 w-[calc(100%+24px)] max-w-[244px] rounded-b-[6px] bg-[#2A2B30]" />
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/home");

  return (
    <div className="relative overflow-x-clip bg-studio text-paper">
      <header className="relative z-10">
        <Container className="flex items-center justify-between gap-4 pb-5 pt-[max(18px,env(safe-area-inset-top))] sm:pt-[22px]">
          <Link href="/" aria-label="VisualVibe home" className="rounded-full">
            <Logo size={28} />
          </Link>
          <nav aria-label="Account" className="flex items-center gap-1.5 sm:gap-2">
            <Button asChild variant="ghost" className="h-[42px] px-4 text-[14.5px] font-semibold">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild variant="primary" className="hidden h-[42px] px-[18px] text-[14.5px] font-semibold min-[400px]:inline-flex">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </nav>
        </Container>
      </header>

      <main>
        <section aria-labelledby="hero-title">
          <Container className="pt-10 sm:pt-14">
            <div className="relative z-10 flex max-w-[780px] animate-rise flex-col gap-5 sm:gap-6">
              <h1
                id="hero-title"
                className="text-balance text-[clamp(40px,6.4vw,84px)] font-semibold leading-[0.98] tracking-[-0.04em] [font-stretch:122%]"
              >
                Meet face to face, right in your browser.
              </h1>
              <p className="max-w-[560px] text-[17px] leading-[1.55] text-haze sm:text-[19px]">
                Start a call in one click, send the link, and you&apos;re talking. Chat, screen sharing and recordings
                are built in. Nothing to install.
              </p>
              <div className="mt-1">
                <HeroActions />
              </div>
            </div>
            <div className="mt-12 sm:mt-[72px]">
              <CallPreview />
            </div>
          </Container>
        </section>

        <section aria-labelledby="light-title">
          <Container className="pt-28 sm:pt-40">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-14">
              <div className="flex flex-col gap-4 sm:gap-[18px]">
                <h2
                  id="light-title"
                  className="text-balance text-[clamp(30px,3.6vw,46px)] font-semibold leading-[1.04] tracking-[-0.03em] [font-stretch:118%]"
                >
                  The room takes its light from whoever&apos;s talking.
                </h2>
                <p className="text-base leading-relaxed text-haze sm:text-[17px]">
                  When someone speaks, they move to the stage and their video softly lights the space around it. You
                  can tell who has the floor at a glance, even with a dozen people in the call.
                </p>
              </div>
              <div aria-hidden className="grid grid-cols-2 gap-4 sm:gap-7">
                <SpeakerFigure person="arjun" caption="Arjun speaking" />
                <SpeakerFigure person="sofia" caption="Sofia speaking" />
              </div>
            </div>
          </Container>
        </section>

        <section aria-label="What's built in">
          <Container className="grid grid-cols-1 gap-x-10 gap-y-14 pt-24 sm:grid-cols-2 sm:pt-32 lg:grid-cols-3">
            <Feature
              title="Share your screen in one click"
              body="Present a tab, a window or your whole screen. The room goes neutral while you share so your content is easy to read."
            >
              <ScreenShareArt />
            </Feature>
            <Feature
              title="Recordings you can find later"
              body="Hosts can record any call and watch it back right in the app, at the speed they like."
            >
              <RecordingsArt />
            </Feature>
            <Feature
              title="Works great on phones"
              body="Phones, tablets and laptops each get a layout made for them. Open the link and you're in, no app needed."
            >
              <DevicesArt />
            </Feature>
          </Container>
        </section>

        <section aria-labelledby="cta-title">
          <Container className="pb-24 pt-28 sm:pb-[120px] sm:pt-40">
            <div className="flex flex-wrap items-end justify-between gap-8 border-t border-white/8 pt-12 sm:pt-14">
              <div className="flex max-w-[620px] flex-col gap-3.5">
                <h2
                  id="cta-title"
                  className="text-balance text-[clamp(32px,4.4vw,58px)] font-semibold leading-none tracking-[-0.035em] [font-stretch:122%]"
                >
                  Your room is one click away.
                </h2>
                <p className="text-base leading-normal text-haze sm:text-[17px]">
                  Sign up in a few seconds and you get a personal room with a link that never changes.
                </p>
              </div>
              <Button asChild variant="primary" size="xl" className="h-14 pl-[22px] pr-7 text-base">
                <Link href="/sign-up">
                  <Video strokeWidth={1.9} />
                  Start a meeting
                </Link>
              </Button>
            </div>
          </Container>
        </section>
      </main>

      <footer className="border-t border-white/6">
        <Container className="flex flex-wrap items-center justify-between gap-4 pb-[max(40px,env(safe-area-inset-bottom))] pt-7 text-[13.5px] text-fog">
          <span className="flex items-center gap-2.5">
            <LogoMark size={22} className="text-paper" />
            Built with Next.js, Clerk and Stream.
          </span>
          <a href={SOURCE_URL} className="text-mist underline-offset-4 hover:text-paper hover:underline">
            Source on GitHub
          </a>
        </Container>
      </footer>
    </div>
  );
}
