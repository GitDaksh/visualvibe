"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-2xl font-semibold leading-tight tracking-[-0.015em] [font-stretch:115%]", className)}
      {...props}
    />
  );
});
export const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return <DialogPrimitive.Description ref={ref} className={cn("text-[15px] leading-relaxed text-fog", className)} {...props} />;
});

type ContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  hideClose?: boolean;
  overlayClassName?: string;
};

export const DialogContent = React.forwardRef<React.ComponentRef<typeof DialogPrimitive.Content>, ContentProps>(
  function DialogContent({ className, children, hideClose, overlayClassName, ...props }, ref) {
    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-[8px] data-[state=open]:animate-[light-in_200ms_ease-out]",
            overlayClassName,
          )}
        />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            // Phones: a sheet that rises from the bottom. Larger screens: a centered dialog.
            "fixed inset-x-0 bottom-0 z-50 max-h-[calc(100dvh-24px)] w-full overflow-y-auto rounded-t-[26px] border border-b-0 border-white/8 bg-panel pb-[env(safe-area-inset-bottom)] text-paper shadow-[0_40px_120px_rgba(0,0,0,0.6)] outline-none data-[state=open]:animate-[sheet-up_260ms_cubic-bezier(0.2,0.8,0.2,1)]",
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[calc(100dvh-48px)] sm:w-[calc(100vw-48px)] sm:max-w-[560px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[26px] sm:border-b sm:pb-0 sm:data-[state=open]:animate-pop",
            className,
          )}
          {...props}
        >
          {children}
          {!hideClose && (
            <DialogPrimitive.Close
              className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full text-paper transition-colors hover:bg-white/10"
              aria-label="Close"
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    );
  },
);
