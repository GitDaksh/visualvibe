"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { copyText, inviteLink } from "@/lib/utils";

type Props = Omit<ButtonProps, "onClick" | "children"> & {
  meetingId: string;
  label?: string;
  /** Icon-only button; pass a label for screen readers. */
  iconOnly?: boolean;
  icon?: "link" | "copy";
  toastMessage?: string;
};

export function CopyLinkButton({
  meetingId,
  label = "Copy invite link",
  iconOnly,
  icon = "link",
  toastMessage = "Invite link copied",
  variant,
  size,
  ...rest
}: Props) {
  const [copied, setCopied] = useState(false);
  const Icon = copied ? Check : icon === "copy" ? Copy : Link2;

  async function onClick() {
    const ok = await copyText(inviteLink(meetingId));
    if (ok) {
      setCopied(true);
      toast(toastMessage);
      setTimeout(() => setCopied(false), 1800);
    } else {
      toast.error("Couldn't copy. Long-press or right-click the link to copy it.");
    }
  }

  if (iconOnly) {
    return (
      <Button variant={variant ?? "quiet"} size={size ?? "icon-sm"} aria-label={label} onClick={onClick} {...rest}>
        <Icon />
      </Button>
    );
  }
  return (
    <Button variant={variant ?? "secondary"} size={size ?? "md"} onClick={onClick} {...rest}>
      <Icon />
      {copied ? "Copied" : label}
    </Button>
  );
}
