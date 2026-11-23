import "server-only";

import { headers } from "next/headers";

/** The public origin for links rendered on the server. */
export async function getOrigin() {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** "visualvibe.vercel.app/m/abc-defg-hij" for display. */
export async function displayInviteLink(meetingId: string) {
  const origin = await getOrigin();
  return `${origin.replace(/^https?:\/\//, "")}/m/${meetingId}`;
}
