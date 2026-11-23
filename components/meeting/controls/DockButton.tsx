"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** "engaged" turns the button white: muted, camera off, hand raised. */
  tone?: "default" | "engaged" | "active" | "danger";
  size?: "md" | "lg";
  badge?: number;
};

/** A round control in the call dock. */
export const DockButton = forwardRef<HTMLButtonElement, Props>(function DockButton(
  { tone = "default", size = "md", badge, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 active:scale-95 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-5 [&_svg]:shrink-0",
        size === "md" ? "size-12 max-[379px]:size-11" : "size-[52px]",
        tone === "default" && "bg-white/8 text-paper hover:bg-white/14",
        tone === "active" && "bg-paper/20 text-paper hover:bg-paper/25",
        tone === "engaged" && "bg-paper text-studio hover:bg-white",
        tone === "danger" && "bg-tally text-white hover:bg-tally-hover",
        className,
      )}
      {...props}
    >
      {children}
      {badge ? (
        <span className="tabular absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-paper px-[5px] text-[11px] font-bold text-studio shadow-[0_0_0_2px_var(--color-studio)]">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  );
});
