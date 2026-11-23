"use server";

import { auth } from "@clerk/nextjs/server";
import { streamServerClient } from "@/lib/stream-server";

/**
 * Issues a short-lived Stream token for the signed-in user.
 * The Stream SDK calls this again on its own before the token expires.
 */
export async function getStreamToken() {
  const { userId } = await auth();
  if (!userId) throw new Error("You need to be signed in to join a call.");
  return streamServerClient().generateUserToken({ user_id: userId, validity_in_seconds: 60 * 60 });
}
