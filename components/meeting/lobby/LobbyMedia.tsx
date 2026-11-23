"use client";

import { useEffect, useRef, useState } from "react";
import { useCallStateHooks } from "@stream-io/video-react-sdk";
import {
  Aperture,
  ChevronDown,
  Mic,
  MicOff,
  SlidersHorizontal,
  SwitchCamera,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tip } from "@/components/ui/tooltip";
import { glowBackground, lightFor } from "@/lib/lights";
import { playTestSound } from "@/lib/sound";
import { cn, initialsOf } from "@/lib/utils";
import { AmbientLight } from "../AmbientLight";
import { useBlur } from "../BlurProvider";
import { DeviceSettingsDialog } from "../controls/DeviceSettingsDialog";
import { MicLevel } from "../controls/MicLevel";

type Me = { id: string; name: string; image?: string | null };

const PREVIEW_SELECTOR = "video[data-vv-preview]";

function blockedMessage(kind: "camera" | "microphone") {
  return `Your ${kind} is blocked. Allow it in your browser's site settings, then try again.`;
}

function isPermissionError(error: unknown) {
  return error instanceof Error && /denied|not allowed|permission/i.test(`${error.name} ${error.message}`);
}

function PreviewVideo({ stream, mirror, onPlaying }: { stream: MediaStream; mirror: boolean; onPlaying: (on: boolean) => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    onPlaying(false);
    video.srcObject = stream;
    void video.play().catch(() => {});
    return () => {
      video.srcObject = null;
    };
  }, [stream, onPlaying]);
  return (
    <video
      ref={ref}
      data-vv-preview=""
      autoPlay
      playsInline
      muted
      onPlaying={() => onPlaying(true)}
      className={cn("absolute inset-0 size-full object-cover", mirror && "-scale-x-100")}
    />
  );
}

/** The round buttons over the preview. "Engaged" (white) means off, like in the call. */
function PreviewButton({
  label,
  engaged,
  pressed,
  onClick,
  children,
}: {
  label: string;
  engaged?: boolean;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tip label={label}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
        className={cn(
          "inline-flex size-[52px] items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 active:scale-95 max-[379px]:size-11 [&_svg]:size-[22px] max-[379px]:[&_svg]:size-5",
          engaged
            ? "bg-paper text-studio hover:bg-white"
            : "border border-white/14 bg-black/45 text-paper backdrop-blur-md hover:bg-black/60",
        )}
      >
        {children}
      </button>
    </Tip>
  );
}

function DevicePicker({
  icon,
  label,
  emptyLabel,
  devices,
  selected,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  emptyLabel: string;
  devices: MediaDeviceInfo[];
  selected: string | undefined;
  onSelect: (deviceId: string) => void;
}) {
  const index = devices.findIndex((d) => d.deviceId === selected);
  const current = index >= 0 ? devices[index] : devices[0];
  const name = current ? current.label || `${label} ${Math.max(0, index) + 1}` : emptyLabel;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${label}: ${name}`}
        disabled={devices.length === 0}
        className="flex h-12 w-full min-w-0 items-center gap-2.5 rounded-[14px] border border-white/8 bg-white/[0.05] px-3.5 text-left text-[13.5px] text-paper transition-colors hover:bg-white/[0.08] disabled:opacity-60 data-[state=open]:border-white/16 data-[state=open]:bg-white/[0.08] [&_svg]:size-[17px] [&_svg]:shrink-0"
      >
        <span className="text-fog">{icon}</span>
        <span className="min-w-0 flex-1 truncate">{name}</span>
        <ChevronDown className="text-fog" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[260px]">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={current?.deviceId ?? ""} onValueChange={onSelect}>
          {devices.map((d, i) => (
            <DropdownMenuRadioItem key={d.deviceId || i} value={d.deviceId}>
              {d.label || `${label} ${i + 1}`}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SpeakerRow() {
  const { useSpeakerState } = useCallStateHooks();
  const { speaker, devices, selectedDevice, isDeviceSelectionSupported } = useSpeakerState();
  const [playing, setPlaying] = useState(false);

  const test = async () => {
    setPlaying(true);
    const ok = await playTestSound(selectedDevice || undefined);
    if (!ok) toast.error("Couldn't play a sound. Check your volume and try again.");
    window.setTimeout(() => setPlaying(false), 1200);
  };

  const testButton = (
    <button
      type="button"
      onClick={() => void test()}
      disabled={playing}
      className="h-8 shrink-0 rounded-full px-3 text-[12.5px] font-semibold text-paper transition-colors hover:bg-white/10 disabled:text-fog"
    >
      {playing ? "Playing…" : "Test"}
    </button>
  );

  if (!isDeviceSelectionSupported || devices.length === 0) {
    return (
      <div className="flex h-12 min-w-0 items-center gap-2.5 rounded-[14px] border border-white/8 bg-white/[0.05] pl-3.5 pr-2 text-[13.5px]">
        <Volume2 className="size-[17px] shrink-0 text-fog" aria-hidden />
        <span className="min-w-0 flex-1 truncate">Speakers</span>
        {testButton}
      </div>
    );
  }

  const index = devices.findIndex((d) => d.deviceId === (selectedDevice || "default"));
  const current = index >= 0 ? devices[index] : devices[0];
  return (
    <div className="flex h-12 min-w-0 items-center rounded-[14px] border border-white/8 bg-white/[0.05] pr-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Speaker: ${current?.label || "Default"}`}
          className="flex h-full min-w-0 flex-1 items-center gap-2.5 rounded-l-[14px] pl-3.5 pr-2 text-left text-[13.5px] transition-colors hover:bg-white/[0.04] [&_svg]:size-[17px] [&_svg]:shrink-0"
        >
          <Volume2 className="text-fog" />
          <span className="min-w-0 flex-1 truncate">{current?.label || "Default speaker"}</span>
          <ChevronDown className="text-fog" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[260px]">
          <DropdownMenuLabel>Speaker</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={current?.deviceId ?? "default"} onValueChange={(id) => speaker.select(id)}>
            {devices.map((d, i) => (
              <DropdownMenuRadioItem key={d.deviceId || i} value={d.deviceId}>
                {d.label || `Speaker ${i + 1}`}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <span aria-hidden className="mx-1 h-5 w-px bg-white/10" />
      {testButton}
    </div>
  );
}

/** Your camera preview with mic, camera and blur toggles, plus device pickers. */
export function LobbyMedia({ me }: { me: Me }) {
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const cam = useCameraState({ optimisticUpdates: true });
  const mic = useMicrophoneState({ optimisticUpdates: true });
  const blur = useBlur();
  const [playing, setPlaying] = useState(false);
  const [micHeard, setMicHeard] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const camOn = !cam.optionsAwareIsMute;
  const micOn = !mic.optionsAwareIsMute;
  const stream = camOn ? cam.mediaStream : undefined;
  const showVideo = Boolean(stream) && camOn;
  const mirror = cam.direction !== "back";
  const light = lightFor(me.id);

  const toggleCamera = () =>
    void cam.camera.toggle().catch((error: unknown) => {
      toast.error(isPermissionError(error) ? blockedMessage("camera") : "Couldn't turn on your camera. Is another app using it?");
    });
  const toggleMic = () =>
    void mic.microphone.toggle().catch((error: unknown) => {
      toast.error(isPermissionError(error) ? blockedMessage("microphone") : "Couldn't turn on your microphone. Try again.");
    });
  const flip = () => void cam.camera.flip().catch(() => toast.error("Couldn't switch cameras."));

  let cameraNote = "Your camera is off";
  if (cam.isBrowserPermissionBlocked) cameraNote = "Camera blocked. Allow it in your browser's site settings.";
  else if (cam.isPromptingPermission) cameraNote = "Allow camera access so people can see you";
  else if (camOn && !playing) cameraNote = "Starting your camera…";

  const micStatus = mic.isBrowserPermissionBlocked
    ? { icon: <MicOff className="size-4 text-tally-soft" />, text: "Microphone blocked" }
    : !micOn
      ? { icon: <MicOff className="size-4 text-tally-soft" />, text: "You'll join muted" }
      : {
          icon: <MicLevel stream={mic.mediaStream} bars={5} onActive={() => setMicHeard(true)} />,
          text: micHeard ? "Your mic is working" : "Say something to test your mic",
        };

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="relative">
        <AmbientLight sessionId={null} selector={PREVIEW_SELECTOR} lightKey={me.id} enabled={showVideo && playing} />
        <div className="relative aspect-[3/4] max-h-[min(50dvh,560px)] w-full overflow-hidden rounded-[24px] bg-panel shadow-[0_30px_80px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.08)] min-[480px]:aspect-[4/3] sm:aspect-video sm:max-h-[calc(100dvh-140px)]">
          {showVideo && stream && <PreviewVideo stream={stream} mirror={mirror} onPlaying={setPlaying} />}
          {(!showVideo || !playing) && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 px-6 text-center"
              style={{ background: glowBackground(light, 0.26) }}
            >
              {me.image ? (
                <img src={me.image} alt="" className="size-20 rounded-full object-cover shadow-[0_8px_30px_rgba(0,0,0,0.35)] sm:size-[88px]" />
              ) : (
                <span
                  aria-hidden
                  className="flex size-20 items-center justify-center rounded-full text-[28px] font-semibold text-studio [font-stretch:110%] sm:size-[88px] sm:text-[32px]"
                  style={{ backgroundColor: light.hex }}
                >
                  {initialsOf(me.name)}
                </span>
              )}
              <span className="max-w-[30ch] text-[14.5px] leading-snug text-mist sm:text-[15px]">{cameraNote}</span>
            </div>
          )}

          <div className="pill-scrim absolute left-3 top-3 flex h-9 max-w-[calc(100%-24px)] items-center gap-2.5 rounded-full pl-3 pr-3.5 text-[13px] font-semibold sm:left-4 sm:top-4">
            <span className="flex shrink-0 items-center">{micStatus.icon}</span>
            <span className="truncate">{micStatus.text}</span>
          </div>

          <div role="toolbar" aria-label="Preview controls" className="absolute inset-x-0 bottom-3 flex justify-center gap-2.5 px-3 max-[379px]:gap-2 sm:bottom-4">
            <PreviewButton label={micOn ? "Turn off microphone" : "Turn on microphone"} engaged={!micOn} pressed={!micOn} onClick={toggleMic}>
              {micOn ? <Mic /> : <MicOff />}
            </PreviewButton>
            <PreviewButton label={camOn ? "Turn off camera" : "Turn on camera"} engaged={!camOn} pressed={!camOn} onClick={toggleCamera}>
              {camOn ? <Video /> : <VideoOff />}
            </PreviewButton>
            {cam.devices.length > 1 && (
              <span className="sm:hidden">
                <PreviewButton label="Flip camera" onClick={flip}>
                  <SwitchCamera />
                </PreviewButton>
              </span>
            )}
            {blur.supported && (
              <PreviewButton
                label={blur.active ? "Turn off background blur" : blur.loading ? "Loading background blur" : "Blur my background"}
                pressed={blur.active}
                onClick={blur.toggle}
              >
                <Aperture className={cn(blur.loading && "animate-spin-slow")} />
              </PreviewButton>
            )}
            <span className="sm:hidden">
              <PreviewButton label="Audio and video settings" onClick={() => setSettingsOpen(true)}>
                <SlidersHorizontal />
              </PreviewButton>
            </span>
          </div>
        </div>
      </div>

      <div className="hidden gap-2.5 sm:grid sm:grid-cols-3">
        <DevicePicker
          icon={<Mic />}
          label="Microphone"
          emptyLabel={mic.isBrowserPermissionBlocked ? "Microphone blocked" : "No microphone found"}
          devices={mic.devices}
          selected={mic.selectedDevice}
          onSelect={(id) => void mic.microphone.select(id)}
        />
        <DevicePicker
          icon={<Video />}
          label="Camera"
          emptyLabel={cam.isBrowserPermissionBlocked ? "Camera blocked" : "No camera found"}
          devices={cam.devices}
          selected={cam.selectedDevice}
          onSelect={(id) => void cam.camera.select(id)}
        />
        <SpeakerRow />
      </div>

      <DeviceSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
