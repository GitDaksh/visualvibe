"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateMeetingCode } from "@/lib/meeting-code";
import {
  CALL_TYPE,
  clampRoomMinutes,
  limitsOverride,
  openPersonalRoom,
  personalRoomSettings,
  streamServerClient,
  syncStreamUser,
} from "@/lib/stream-server";
import { displayNameOf } from "@/lib/user";
import { firstNameOf } from "@/lib/utils";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/** The signed-in user, with their name and photo synced to Stream. */
async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("You need to be signed in.");
  const user = await currentUser();
  const name = displayNameOf(user);
  const image = user?.hasImage ? user.imageUrl : null;
  await syncStreamUser({ id: userId, name, image });
  return { userId, name, image };
}

function failure(error: unknown, fallback: string): { ok: false; error: string } {
  console.error(fallback, error);
  return { ok: false, error: fallback };
}

/** Starts a meeting right now and returns its code. */
export async function createInstantMeeting(): Promise<Result<{ id: string }>> {
  try {
    const { userId, name } = await requireUser();
    const id = generateMeetingCode();
    await streamServerClient()
      .video.call(CALL_TYPE, id)
      .getOrCreate({
        data: {
          created_by_id: userId,
          starts_at: new Date(),
          custom: { title: `${firstNameOf(name)}'s meeting`, kind: "instant" },
          settings_override: limitsOverride(),
        },
      });
    revalidatePath("/home");
    return { ok: true, data: { id } };
  } catch (error) {
    return failure(error, "Couldn't start a meeting. Check your connection and try again.");
  }
}

export type ScheduleInput = {
  title: string;
  startsAt: string;
  durationMinutes: number;
  notes?: string;
};

const DURATIONS = new Set([15, 30, 45, 60, 90, 120]);

/** Schedules a meeting for later and returns its code and details. */
export async function scheduleMeeting(
  input: ScheduleInput,
): Promise<Result<{ id: string; title: string; startsAt: string; durationMinutes: number; notes: string | null }>> {
  const title = (input.title ?? "").trim().slice(0, 80) || "Untitled meeting";
  const notes = (input.notes ?? "").trim().slice(0, 500) || null;
  const start = new Date(input.startsAt);
  const durationMinutes = DURATIONS.has(input.durationMinutes) ? input.durationMinutes : 30;
  if (Number.isNaN(start.getTime())) return { ok: false, error: "Pick a date and time for the meeting." };
  if (start.getTime() < Date.now() - 5 * 60_000) return { ok: false, error: "That time has already passed. Pick a later one." };
  if (start.getTime() > Date.now() + 366 * 86_400_000) return { ok: false, error: "Meetings can be scheduled up to a year ahead." };

  try {
    const { userId } = await requireUser();
    const id = generateMeetingCode();
    await streamServerClient()
      .video.call(CALL_TYPE, id)
      .getOrCreate({
        data: {
          created_by_id: userId,
          starts_at: start,
          custom: { title, notes, durationMinutes, kind: "scheduled" },
          settings_override: limitsOverride(),
        },
      });
    revalidatePath("/home");
    revalidatePath("/meetings");
    return { ok: true, data: { id, title, startsAt: start.toISOString(), durationMinutes, notes } };
  } catch (error) {
    return failure(error, "Couldn't schedule the meeting. Try again in a moment.");
  }
}

/** Creates the signed-in user's personal room if it doesn't exist yet. */
export async function ensurePersonalRoom(): Promise<Result<{ id: string }>> {
  try {
    const { userId, name, image } = await requireUser();
    const call = await openPersonalRoom(userId, name, image);
    return { ok: true, data: { id: call.id } };
  } catch (error) {
    return failure(error, "Couldn't open your room. Try again in a moment.");
  }
}

export type RoomSettingsInput = {
  muteOnJoin: boolean;
  cameraOffOnJoin: boolean;
  maxDurationMinutes: number;
};

/** Saves how people join the user's personal room. */
export async function updateRoomSettings(input: RoomSettingsInput): Promise<Result<RoomSettingsInput>> {
  try {
    const { userId, name, image } = await requireUser();
    const room = await openPersonalRoom(userId, name, image);
    const minutes = clampRoomMinutes(input.maxDurationMinutes);
    await streamServerClient()
      .video.call(CALL_TYPE, room.id)
      .update({
        // Keep the title and kind; only the time limit changes here.
        custom: { ...(room.custom ?? {}), kind: "personal", maxMinutes: minutes },
        settings_override: personalRoomSettings(input),
      });
    revalidatePath("/room");
    return {
      ok: true,
      data: { muteOnJoin: input.muteOnJoin, cameraOffOnJoin: input.cameraOffOnJoin, maxDurationMinutes: minutes },
    };
  } catch (error) {
    return failure(error, "Couldn't save your room settings. Try again.");
  }
}
