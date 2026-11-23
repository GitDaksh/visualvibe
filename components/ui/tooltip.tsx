"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;

type TipProps = {
  label: React.ReactNode;
  shortcut?: string;
  side?: "top" | "bottom" | "left" | "right";
  children: React.ReactElement;
};

/** Wraps a control with a small label (and optional keyboard shortcut) on hover and focus. */
export function Tip({ label, shortcut, side = "top", children }: TipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={350}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={10}
          collisionPadding={10}
          className={cn(
            "z-[60] flex items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-[12.5px] font-semibold text-studio shadow-[0_8px_24px_rgba(0,0,0,0.4)] data-[state=delayed-open]:animate-pop",
          )}
        >
          {label}
          {shortcut && (
            <kbd className="rounded-md bg-studio/10 px-1.5 py-px font-sans text-[11px] font-semibold text-studio/70">
              {shortcut}
            </kbd>
          )}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
