"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Toasts render as a light pill near the bottom of the screen. On phones they
 * span the width like a snackbar, with any action at the far edge.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      offset={28}
      mobileOffset={16}
      gap={8}
      visibleToasts={3}
      toastOptions={{
        unstyled: true,
        duration: 2400,
        classNames: {
          toast:
            "flex items-center gap-2.5 rounded-full bg-paper py-2.5 pl-4 pr-5 text-[14px] font-semibold text-studio shadow-[0_12px_32px_rgba(0,0,0,0.4)] max-[600px]:rounded-2xl max-[600px]:py-3 [&:has([data-button])]:pr-2 [&_[data-icon]]:flex [&_[data-icon]_svg]:size-4",
          error: "!bg-raised !text-paper border border-white/10 [&_[data-icon]]:text-tally-soft",
          content: "min-w-0",
          title: "leading-snug",
          description: "text-[13px] font-medium text-studio/70",
          actionButton:
            "ml-2 shrink-0 rounded-full bg-studio px-3.5 py-1.5 text-[13px] font-semibold text-paper transition-colors hover:bg-black max-[600px]:ml-auto",
        },
      }}
    />
  );
}
