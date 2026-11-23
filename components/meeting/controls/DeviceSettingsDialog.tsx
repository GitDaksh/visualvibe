"use client";

import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Label, Select } from "@/components/ui/field";
import { MicLevel } from "./MicLevel";

function deviceLabel(d: MediaDeviceInfo, i: number, kind: string) {
  return d.label || `${kind} ${i + 1}`;
}

/** Microphone, camera and speaker pickers. Works the same on phones and computers. */
export function DeviceSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { useMicrophoneState, useCameraState, useSpeakerState } = useCallStateHooks();
  const mic = useMicrophoneState();
  const cam = useCameraState();
  const speaker = useSpeakerState();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <div className="flex flex-col gap-6 px-6 pb-6 pt-6 sm:px-7 sm:pt-7">
          <div className="flex flex-col gap-1.5 pr-10">
            <DialogTitle>Audio and video</DialogTitle>
            <DialogDescription>Changes apply straight away.</DialogDescription>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="device-mic">Microphone</Label>
            <Select
              id="device-mic"
              value={mic.selectedDevice ?? ""}
              onChange={(e) => void mic.microphone.select(e.target.value)}
              disabled={mic.devices.length === 0}
            >
              {mic.devices.length === 0 && <option value="">No microphone found</option>}
              {mic.devices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {deviceLabel(d, i, "Microphone")}
                </option>
              ))}
            </Select>
            <div className="flex items-center gap-3 pl-1 pt-1 text-[13px] text-fog">
              <MicLevel stream={mic.isMute ? undefined : mic.mediaStream} bars={12} />
              {mic.isMute ? "Your mic is off" : "Speak to test your mic"}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="device-cam">Camera</Label>
            <Select
              id="device-cam"
              value={cam.selectedDevice ?? ""}
              onChange={(e) => void cam.camera.select(e.target.value)}
              disabled={cam.devices.length === 0}
            >
              {cam.devices.length === 0 && <option value="">No camera found</option>}
              {cam.devices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {deviceLabel(d, i, "Camera")}
                </option>
              ))}
            </Select>
          </div>

          {speaker.isDeviceSelectionSupported && speaker.devices.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="device-speaker">Speaker</Label>
              <Select id="device-speaker" value={speaker.selectedDevice || "default"} onChange={(e) => speaker.speaker.select(e.target.value)}>
                {speaker.devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {deviceLabel(d, i, "Speaker")}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
