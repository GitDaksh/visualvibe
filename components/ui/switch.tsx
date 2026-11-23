"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        "relative inline-flex h-[26px] w-11 shrink-0 items-center rounded-full bg-white/16 transition-colors data-[state=checked]:bg-paper disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-5 translate-x-[3px] rounded-full bg-paper transition-[transform,background-color] duration-150 data-[state=checked]:translate-x-[21px] data-[state=checked]:bg-studio" />
    </SwitchPrimitive.Root>
  );
});
