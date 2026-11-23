import "server-only";

import { cookies } from "next/headers";
import { isValidTimeZone } from "./time";

export const TZ_COOKIE = "tz";

/** The viewer's IANA time zone, from the cookie TimeZoneSync sets. Falls back to UTC. */
export async function getViewerTimeZone() {
  const store = await cookies();
  const tz = store.get(TZ_COOKIE)?.value;
  return isValidTimeZone(tz) ? tz : "UTC";
}
