import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Initials for an avatar fallback: "Rohan Das" → "RD", "meera" → "M". */
export function initialsOf(name: string | undefined | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

/** First name for friendly copy: "Daksh Pushpad" → "Daksh". */
export function firstNameOf(name: string | undefined | null) {
  return (name ?? "").trim().split(/\s+/)[0] || "there";
}

/** The site's public origin. Uses NEXT_PUBLIC_BASE_URL when set, else the browser origin. */
export function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/** A short invite link like https://site/m/abc-defg-hij */
export function inviteLink(meetingId: string) {
  return `${siteOrigin()}/m/${meetingId}`;
}

/** Copy text to the clipboard, falling back to a hidden textarea on older browsers. */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}
