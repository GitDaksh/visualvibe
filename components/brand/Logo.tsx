import { cn } from "@/lib/utils";

/** The VisualVibe mark: two beams meeting at a point of light. */
export function LogoMark({ size = 28, className, title }: { size?: number; className?: string; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M7 7.5 13.6 21.5" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" />
      <path d="M25 7.5 18.4 21.5" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" />
      <circle cx="16" cy="25.6" r="2.5" fill="#FFC98A" />
    </svg>
  );
}

export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-paper", className)}>
      <LogoMark size={size} />
      <span className="text-[17px] font-[680] tracking-[-0.01em] [font-stretch:115%]">VisualVibe</span>
    </span>
  );
}
