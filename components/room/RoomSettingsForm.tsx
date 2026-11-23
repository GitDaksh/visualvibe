"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateRoomSettings, type RoomSettingsInput } from "@/actions/meeting.actions";
import { Select } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

const DURATIONS = [30, 60, 120, 240, 480];

function durationLabel(minutes: number) {
  if (minutes < 60) return `After ${minutes} minutes`;
  const h = minutes / 60;
  return `After ${h} ${h === 1 ? "hour" : "hours"}`;
}

export function RoomSettingsForm({ initial, maxMinutes }: { initial: RoomSettingsInput; maxMinutes: number }) {
  const [settings, setSettings] = useState(initial);
  const [, startTransition] = useTransition();
  const options = [...new Set([...DURATIONS.filter((d) => d <= maxMinutes), Math.min(settings.maxDurationMinutes, maxMinutes)])].sort(
    (a, b) => a - b,
  );

  function save(next: RoomSettingsInput) {
    const previous = settings;
    setSettings(next);
    startTransition(async () => {
      const result = await updateRoomSettings(next);
      if (result.ok) {
        setSettings(result.data);
        toast("Room settings saved");
      } else {
        setSettings(previous);
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.05]">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-semibold">Start people muted</span>
          <span className="text-[13.5px] leading-snug text-fog">They can unmute themselves any time.</span>
        </span>
        <Switch checked={settings.muteOnJoin} onCheckedChange={(v) => save({ ...settings, muteOnJoin: v })} />
      </label>
      <label className="flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.05]">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-semibold">Start with cameras off</span>
          <span className="text-[13.5px] leading-snug text-fog">Good for drop-in calls where people may not be ready.</span>
        </span>
        <Switch checked={settings.cameraOffOnJoin} onCheckedChange={(v) => save({ ...settings, cameraOffOnJoin: v })} />
      </label>
      <div className="flex flex-col gap-3 rounded-2xl bg-white/[0.03] px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <label htmlFor="room-limit" className="text-[15px] font-semibold">
            End calls automatically
          </label>
          <span className="text-[13.5px] leading-snug text-fog">Stops a forgotten tab from keeping the room open for hours.</span>
        </span>
        <div className="sm:w-[190px]">
          <Select
            id="room-limit"
            value={settings.maxDurationMinutes}
            onChange={(e) => save({ ...settings, maxDurationMinutes: Number(e.target.value) })}
            className="h-11 text-[14px]"
          >
            {options.map((m) => (
              <option key={m} value={m}>
                {durationLabel(m)}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
