"use client";

import * as React from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuGroup = Menu.Group;
export const DropdownMenuRadioGroup = Menu.RadioGroup;

export const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof Menu.Content>,
  React.ComponentPropsWithoutRef<typeof Menu.Content>
>(function DropdownMenuContent({ className, sideOffset = 10, collisionPadding = 12, ...props }, ref) {
  return (
    <Menu.Portal>
      <Menu.Content
        ref={ref}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "z-50 min-w-[232px] max-w-[min(340px,calc(100vw-24px))] rounded-2xl border border-white/10 bg-raised p-1.5 text-paper shadow-[0_20px_50px_rgba(0,0,0,0.55)] outline-none data-[state=open]:animate-pop",
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  );
});

const itemBase =
  "relative flex min-h-10 cursor-pointer select-none items-center gap-3 rounded-[10px] px-2.5 py-2 text-[13.5px] outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:text-fog data-[highlighted]:bg-white/8 [&_svg]:size-4 [&_svg]:shrink-0";

export const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof Menu.Item>,
  React.ComponentPropsWithoutRef<typeof Menu.Item> & { tone?: "default" | "danger" }
>(function DropdownMenuItem({ className, tone = "default", ...props }, ref) {
  return <Menu.Item ref={ref} className={cn(itemBase, tone === "danger" && "text-tally-soft", className)} {...props} />;
});

export const DropdownMenuRadioItem = React.forwardRef<
  React.ComponentRef<typeof Menu.RadioItem>,
  React.ComponentPropsWithoutRef<typeof Menu.RadioItem>
>(function DropdownMenuRadioItem({ className, children, ...props }, ref) {
  return (
    <Menu.RadioItem ref={ref} className={cn(itemBase, "pl-9", className)} {...props}>
      <span className="absolute left-2.5 flex size-4 items-center justify-center">
        <Menu.ItemIndicator>
          <Check />
        </Menu.ItemIndicator>
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </Menu.RadioItem>
  );
});

export function DropdownMenuLabel({ className, ...props }: React.ComponentPropsWithoutRef<typeof Menu.Label>) {
  return <Menu.Label className={cn("px-2.5 pb-1 pt-2 text-xs font-semibold text-fog", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentPropsWithoutRef<typeof Menu.Separator>) {
  return <Menu.Separator className={cn("mx-1.5 my-1.5 h-px bg-white/8", className)} {...props} />;
}
