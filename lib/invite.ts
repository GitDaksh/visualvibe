"use client";

import { copyText, inviteLink } from "./utils";

export type InviteResult = "shared" | "copied" | "cancelled" | "failed";

/**
 * On phones, opens the system share sheet; everywhere else (or if sharing
 * isn't available), copies the invite link.
 */
export async function shareInvite(meetingId: string, title: string, preferShare: boolean): Promise<InviteResult> {
  const link = inviteLink(meetingId);
  if (preferShare && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text: `Join "${title}" on VisualVibe`, url: link });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // Otherwise fall through and copy instead.
    }
  }
  return (await copyText(link)) ? "copied" : "failed";
}
