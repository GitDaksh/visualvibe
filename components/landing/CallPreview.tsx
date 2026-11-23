import { Hand, Mic, MonitorUp, PhoneOff, SendHorizontal, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export type Person = "arjun" | "kabir" | "sofia";

const SIZES: Record<Person, [number, number]> = {
  arjun: [480, 960],
  kabir: [240, 480],
  sofia: [240, 480],
};

/** A landing-page photo with a 1x/2x pair so small tiles stay sharp. */
export function Photo({
  person,
  sizes,
  className,
  eager,
}: {
  person: Person;
  sizes: string;
  className?: string;
  eager?: boolean;
}) {
  const [small, large] = SIZES[person];
  return (
    <img
      src={`/landing/${person}-${small}.webp`}
      srcSet={`/landing/${person}-${small}.webp ${small}w, /landing/${person}-${large}.webp ${large}w`}
      sizes={sizes}
      alt=""
      width={large}
      height={large}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={cn("object-cover", className)}
    />
  );
}

/** A soft wash of someone's colors, used as the light around their video. */
export function Glow({ person, className }: { person: Person; className?: string }) {
  return (
    <img
      src={`/landing/${person}-glow.webp`}
      alt=""
      aria-hidden
      width={48}
      height={48}
      decoding="async"
      className={cn("pointer-events-none select-none object-cover", className)}
    />
  );
}

function SpeakingBars() {
  return (
    <span aria-hidden className="flex h-3 items-center gap-[2px]">
      <span className="vv-bar h-3 w-[3px] rounded-[2px] bg-paper" />
      <span className="vv-bar h-3 w-[3px] rounded-[2px] bg-paper" />
      <span className="vv-bar h-3 w-[3px] rounded-[2px] bg-paper" />
    </span>
  );
}

function NamePill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "pill-scrim absolute bottom-2 left-2 flex h-6 items-center rounded-full px-[9px] text-[11.5px] font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Tile({ person, name }: { person: Person; name: string }) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-[10px] bg-panel sm:rounded-[14px]">
      <Photo person={person} sizes="(min-width: 1024px) 190px, 25vw" className="absolute inset-0 size-full object-[50%_28%]" />
      <NamePill className="hidden sm:flex">{name}</NamePill>
    </div>
  );
}

/** A camera-off tile: initials on the person's own light. */
function QuietTile({ initials, name, rgb }: { initials: string; name: string; rgb: string }) {
  return (
    <div
      className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[10px] sm:rounded-[14px]"
      style={{ background: `radial-gradient(circle at 50% 42%, rgb(${rgb} / 0.3), rgb(${rgb} / 0) 62%), #17181B` }}
    >
      <span
        className="flex size-7 items-center justify-center rounded-full text-[11px] font-[650] text-studio sm:size-10 sm:text-sm"
        style={{ background: `rgb(${rgb})` }}
      >
        {initials}
      </span>
      <NamePill className="hidden sm:flex">{name}</NamePill>
    </div>
  );
}

function ChatMessage({
  person,
  initials,
  name,
  time,
  text,
}: {
  person?: Person;
  initials?: string;
  name: string;
  time: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {person ? (
        <Photo person={person} sizes="28px" className="size-7 shrink-0 rounded-full" />
      ) : (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-light-iris text-[10.5px] font-[650] text-studio">
          {initials}
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-[3px]">
        <span className="text-[12.5px] font-[620]">
          {name} <span className="font-normal text-fog">{time}</span>
        </span>
        <span className="text-[13.5px] leading-[1.4] text-[#E2E1DC]">{text}</span>
      </div>
    </div>
  );
}

/**
 * The hero illustration: a call in speaker view with Arjun talking. Built
 * from markup rather than a screenshot so it stays sharp at every size.
 */
export function CallPreview() {
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-x-[12%] -bottom-[24%] -top-[18%] animate-light">
        <Glow
          person="arjun"
          className="absolute left-[4%] top-[4%] h-[88%] w-[70%] opacity-75 [mask-image:radial-gradient(closest-side,#000_25%,transparent)]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_42%_48%,rgb(18_19_22/0)_0%,rgb(18_19_22/0.6)_70%,#121316_100%)]" />
      </div>

      <div
        role="img"
        aria-label="A VisualVibe call: Arjun is speaking on the main stage, four others are in the filmstrip below, the chat is open on the side, and the call controls sit in a dock at the bottom."
        className="relative flex animate-rise flex-col gap-2.5 rounded-[20px] border border-white/8 bg-studio/72 p-2.5 shadow-[0_50px_140px_rgba(0,0,0,0.6)] [animation-delay:120ms] sm:gap-3 sm:rounded-[28px] sm:p-3.5"
      >
        <div className="flex items-center justify-between gap-3 px-1.5 pb-0.5 pt-1">
          <span className="flex items-center gap-2.5 text-[13px] font-[620] [font-stretch:112%] sm:text-[13.5px]">
            <span className="size-2 rounded-full bg-light-amber shadow-[0_0_12px_2px_rgba(232,162,91,0.65)]" />
            Design review
            <span className="tabular font-normal text-fog">42:17</span>
          </span>
          <span className="flex gap-1.5">
            <span className="size-[9px] rounded-full bg-white/12" />
            <span className="size-[9px] rounded-full bg-white/12" />
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_288px]">
          <div className="flex min-w-0 flex-col gap-2 sm:gap-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] shadow-[0_0_0_2px_rgba(243,242,238,0.9),0_0_60px_6px_rgba(255,196,112,0.22)] min-[480px]:aspect-video sm:rounded-[18px]">
              <Photo
                person="arjun"
                eager
                sizes="(min-width: 1200px) 800px, (min-width: 1024px) 64vw, 92vw"
                className="absolute inset-0 size-full object-[50%_30%]"
              />
              <span className="pill-scrim absolute bottom-3 left-3 flex h-8 items-center gap-2 rounded-full pl-2.5 pr-3 text-[13px] font-semibold [font-stretch:108%] sm:bottom-4 sm:left-4 sm:text-[13.5px]">
                <SpeakingBars />
                Arjun Mehta
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              <Tile person="sofia" name="Sofia Fernandes" />
              <Tile person="kabir" name="Kabir Rao" />
              <QuietTile initials="RD" name="Rohan Das" rgb="77 182 166" />
              <QuietTile initials="You" name="You" rgb="141 134 230" />
            </div>
          </div>

          <div className="hidden min-h-0 flex-col gap-4 rounded-[18px] border border-white/8 bg-panel/86 p-3 lg:flex">
            <div className="flex gap-0.5 self-start rounded-full bg-white/6 p-[3px] text-[13px] font-semibold">
              <span className="rounded-full bg-white/12 px-3.5 py-2">Chat</span>
              <span className="px-3.5 py-2 text-mist">
                People <span className="font-medium text-fog">5</span>
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-end gap-4 px-1">
              <ChatMessage person="kabir" name="Kabir Rao" time="8:03 PM" text="Is background blur on by default?" />
              <ChatMessage person="sofia" name="Sofia Fernandes" time="8:04 PM" text="Off by default. You can switch it on in the lobby." />
              <ChatMessage initials="You" name="You" time="8:04 PM" text="Sending the link to Rohan now." />
            </div>
            <div className="flex h-[42px] items-center rounded-full border border-white/8 bg-white/6 pl-4 pr-1.5 text-[13.5px] text-fog">
              <span className="flex-1">Message everyone</span>
              <span className="flex size-8 items-center justify-center rounded-full bg-paper text-studio">
                <SendHorizontal className="size-4" />
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-center pb-0.5 pt-1">
          <span className="flex items-center gap-1.5 rounded-full border border-white/8 bg-[rgb(30_31_35/0.9)] p-1.5 sm:gap-2 sm:p-[7px] [&_svg]:size-4 sm:[&_svg]:size-[18px]">
            {[Mic, Video, MonitorUp, Hand].map((Icon, i) => (
              <span key={i} className="flex size-8 items-center justify-center rounded-full bg-white/8 sm:size-10">
                <Icon strokeWidth={1.75} />
              </span>
            ))}
            <span className="flex h-8 items-center gap-1.5 rounded-full bg-tally px-3 text-[12px] font-[620] sm:h-10 sm:px-4 sm:text-[13px]">
              <PhoneOff strokeWidth={1.9} />
              Leave
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
