import { lightFor, orbBackground } from "@/lib/lights";
import { cn } from "@/lib/utils";

/** A meeting's identity: a small point of its own light. */
export function MeetingDot({ id, className, dim }: { id: string; className?: string; dim?: boolean }) {
  const light = lightFor(id);
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{
        backgroundColor: light.hex,
        boxShadow: dim ? undefined : `0 0 12px 2px rgb(${light.rgb} / 0.55)`,
        opacity: dim ? 0.55 : 1,
      }}
    />
  );
}

export function MeetingOrb({ id, size = 46, className }: { id: string; size?: number; className?: string }) {
  const light = lightFor(id);
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: orbBackground(light),
        boxShadow: `0 0 ${Math.round(size * 0.74)}px ${Math.round(size * 0.13)}px rgb(${light.rgb} / 0.35)`,
      }}
    />
  );
}
