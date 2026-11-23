"use client";

import { useState } from "react";
import { OwnCapability, useCall, useCallStateHooks, useToggleCallRecording } from "@stream-io/video-react-sdk";
import {
  Aperture,
  ChevronUp,
  CircleDot,
  Copy,
  Grid2x2,
  Hand,
  LayoutPanelTop,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  PhoneOff,
  SlidersHorizontal,
  Smile,
  Sparkles,
  SwitchCamera,
  Users,
  Video,
  VideoOff,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useBlur } from "../BlurProvider";
import { REACTIONS } from "../hooks/useReactions";
import { useRoom } from "../RoomContext";
import { DockButton } from "./DockButton";

function permissionError(kind: "camera" | "microphone") {
  toast.error(
    kind === "camera"
      ? "Your camera is blocked. Allow it in your browser's site settings, then try again."
      : "Your microphone is blocked. Allow it in your browser's site settings, then try again.",
  );
}

function DeviceChevron({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <Tip label={label}>
        <DropdownMenuTrigger
          aria-label={label}
          className="inline-flex h-12 w-[30px] items-center justify-center rounded-r-full pr-1.5 text-fog transition-colors hover:bg-white/10 hover:text-paper data-[state=open]:text-paper"
        >
          <ChevronUp className="size-4" />
        </DropdownMenuTrigger>
      </Tip>
      <DropdownMenuContent side="top" align="start" className="w-[300px]">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MicControl({ withMenu }: { withMenu: boolean }) {
  const { useMicrophoneState, useSpeakerState } = useCallStateHooks();
  const { microphone, optionsAwareIsMute, devices, selectedDevice } = useMicrophoneState({ optimisticUpdates: true });
  const speaker = useSpeakerState();
  const { openDeviceSettings } = useRoom();
  const muted = optionsAwareIsMute;

  const toggle = () =>
    microphone.toggle().catch((error: unknown) => {
      if (error instanceof Error && /denied|not allowed|permission/i.test(error.message)) permissionError("microphone");
      else toast.error("Couldn't change your microphone. Try again.");
    });

  const button = (
    <Tip label={muted ? "Turn on microphone" : "Turn off microphone"} shortcut="M">
      <DockButton
        tone={muted ? "engaged" : "default"}
        aria-label={muted ? "Turn on microphone" : "Turn off microphone"}
        aria-pressed={muted}
        onClick={toggle}
        className={withMenu && !muted ? "bg-transparent hover:bg-white/10" : undefined}
      >
        {muted ? <MicOff /> : <Mic />}
      </DockButton>
    </Tip>
  );

  if (!withMenu) return button;
  return (
    <div className="flex h-12 items-center rounded-full bg-white/8">
      {button}
      <DeviceChevron label="Microphone and speaker options">
        <DropdownMenuLabel>Microphone</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={selectedDevice ?? ""} onValueChange={(id) => void microphone.select(id)}>
          {devices.length === 0 && <DropdownMenuItem disabled>No microphone found</DropdownMenuItem>}
          {devices.map((d, i) => (
            <DropdownMenuRadioItem key={d.deviceId} value={d.deviceId}>
              {d.label || `Microphone ${i + 1}`}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {speaker.isDeviceSelectionSupported && speaker.devices.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Speaker</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={speaker.selectedDevice || "default"} onValueChange={(id) => speaker.speaker.select(id)}>
              {speaker.devices.map((d, i) => (
                <DropdownMenuRadioItem key={d.deviceId} value={d.deviceId}>
                  {d.label || `Speaker ${i + 1}`}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={openDeviceSettings}>
          <SlidersHorizontal /> Audio and video settings
        </DropdownMenuItem>
      </DeviceChevron>
    </div>
  );
}

export function CameraControl({ withMenu }: { withMenu: boolean }) {
  const { useCameraState } = useCallStateHooks();
  const { camera, optionsAwareIsMute, devices, selectedDevice } = useCameraState({ optimisticUpdates: true });
  const blur = useBlur();
  const { openDeviceSettings } = useRoom();
  const off = optionsAwareIsMute;

  const toggle = () =>
    camera.toggle().catch((error: unknown) => {
      if (error instanceof Error && /denied|not allowed|permission/i.test(error.message)) permissionError("camera");
      else toast.error("Couldn't change your camera. Try again.");
    });

  const button = (
    <Tip label={off ? "Turn on camera" : "Turn off camera"} shortcut="V">
      <DockButton tone={off ? "engaged" : "default"} aria-label={off ? "Turn on camera" : "Turn off camera"} aria-pressed={off} onClick={toggle} className={withMenu && !off ? "bg-transparent hover:bg-white/10" : undefined}>
        {off ? <VideoOff /> : <Video />}
      </DockButton>
    </Tip>
  );

  if (!withMenu) return button;
  return (
    <div className="flex h-12 items-center rounded-full bg-white/8">
      {button}
      <DeviceChevron label="Camera options">
        <DropdownMenuLabel>Camera</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={selectedDevice ?? ""} onValueChange={(id) => void camera.select(id)}>
          {devices.length === 0 && <DropdownMenuItem disabled>No camera found</DropdownMenuItem>}
          {devices.map((d, i) => (
            <DropdownMenuRadioItem key={d.deviceId} value={d.deviceId}>
              {d.label || `Camera ${i + 1}`}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {blur.supported && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); blur.toggle(); }}>
              <Aperture /> {blur.active ? "Turn off background blur" : blur.loading ? "Loading background blur…" : "Blur my background"}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={openDeviceSettings}>
          <SlidersHorizontal /> Audio and video settings
        </DropdownMenuItem>
      </DeviceChevron>
    </div>
  );
}

export function canShareScreen() {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getDisplayMedia);
}

export function ShareControl() {
  const call = useCall();
  const { useScreenShareState, useHasOngoingScreenShare, useHasPermissions } = useCallStateHooks();
  const { optionsAwareIsMute } = useScreenShareState({ optimisticUpdates: true });
  const someoneSharing = useHasOngoingScreenShare();
  const allowed = useHasPermissions(OwnCapability.SCREENSHARE);
  const sharing = !optionsAwareIsMute;
  const blocked = someoneSharing && !sharing;

  if (!allowed || !canShareScreen()) return null;
  return (
    <Tip label={sharing ? "Stop presenting" : blocked ? "Someone else is presenting" : "Share your screen"}>
      <span>
        <DockButton
          tone={sharing ? "active" : "default"}
          aria-label={sharing ? "Stop presenting" : "Share your screen"}
          aria-pressed={sharing}
          disabled={blocked}
          onClick={() =>
            call?.screenShare.toggle().catch((e: unknown) => {
              if (e instanceof Error && /denied|not allowed|permission/i.test(e.message)) return; // user cancelled the picker
              toast.error("Couldn't start screen sharing.");
            })
          }
        >
          <MonitorUp />
        </DockButton>
      </span>
    </Tip>
  );
}

export function ReactionControl() {
  const { reactions } = useRoom();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tip label="Send a reaction">
        <PopoverTrigger asChild>
          <DockButton tone={open ? "active" : "default"} aria-label="Send a reaction">
            <Smile />
          </DockButton>
        </PopoverTrigger>
      </Tip>
      <PopoverContent side="top" align="center" sideOffset={14} className="flex gap-1 rounded-full p-1.5">
        {REACTIONS.map((r) => (
          <button
            key={r.code}
            type="button"
            aria-label={r.label}
            onClick={() => {
              reactions.send(r.emoji);
              setOpen(false);
            }}
            className="inline-flex size-11 items-center justify-center rounded-full text-2xl leading-none transition-[background-color,transform] hover:scale-110 hover:bg-white/10 active:scale-95"
          >
            {r.emoji}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function HandControl() {
  const { hands } = useRoom();
  return (
    <Tip label={hands.mineRaised ? "Lower hand" : "Raise hand"} shortcut="H">
      <DockButton tone={hands.mineRaised ? "engaged" : "default"} aria-label={hands.mineRaised ? "Lower hand" : "Raise hand"} aria-pressed={hands.mineRaised} onClick={hands.toggleMine}>
        <Hand />
      </DockButton>
    </Tip>
  );
}

export type MoreExtra = "hand" | "people" | "share" | "flip" | "invite";

export function MoreMenu({ extras = [] }: { extras?: MoreExtra[] }) {
  const call = useCall();
  const room = useRoom();
  const blur = useBlur();
  const { useHasPermissions, useParticipantCount, useCameraState } = useCallStateHooks();
  const canRecord = useHasPermissions(OwnCapability.START_RECORD_CALL) && room.meeting.isHost;
  const { toggleCallRecording, isAwaitingResponse, isCallRecordingInProgress } = useToggleCallRecording();
  const count = useParticipantCount();
  const { devices: cameras } = useCameraState();
  const [confirmStop, setConfirmStop] = useState(false);

  return (
    <>
      <DropdownMenu>
        <Tip label="More options">
          <DropdownMenuTrigger asChild>
            <DockButton aria-label="More options" className="data-[state=open]:bg-paper/20">
              <MoreHorizontal />
            </DockButton>
          </DropdownMenuTrigger>
        </Tip>
        <DropdownMenuContent side="top" align="end" className="w-[280px]">
          {extras.length > 0 && (
            <>
              {extras.includes("hand") && (
                <DropdownMenuItem onSelect={room.hands.toggleMine}>
                  <Hand /> {room.hands.mineRaised ? "Lower hand" : "Raise hand"}
                </DropdownMenuItem>
              )}
              {extras.includes("people") && (
                <DropdownMenuItem onSelect={() => room.togglePanel("people")}>
                  <Users /> People <span className="ml-auto text-fog">{count}</span>
                </DropdownMenuItem>
              )}
              {extras.includes("share") && canShareScreen() && (
                <DropdownMenuItem
                  onSelect={() =>
                    void call?.screenShare.toggle().catch((e: unknown) => {
                      if (e instanceof Error && /denied|not allowed|permission/i.test(e.message)) return;
                      toast.error("Couldn't start screen sharing.");
                    })
                  }
                >
                  <MonitorUp /> Share your screen
                </DropdownMenuItem>
              )}
              {extras.includes("flip") && cameras.length > 1 && (
                <DropdownMenuItem onSelect={() => void call?.camera.flip().catch(() => toast.error("Couldn't switch cameras."))}>
                  <SwitchCamera /> Flip camera
                </DropdownMenuItem>
              )}
              {extras.includes("invite") && (
                <DropdownMenuItem onSelect={room.copyInvite}>
                  <Copy /> {room.inviteLabel}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onSelect={() => room.setLayout(room.layout === "grid" ? "speaker" : "grid")}>
            {room.layout === "grid" ? <LayoutPanelTop /> : <Grid2x2 />}
            {room.layout === "grid" ? "Switch to speaker view" : "Switch to grid view"}
          </DropdownMenuItem>
          {blur.supported && (
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); blur.toggle(); }}>
              <Aperture /> {blur.active ? "Turn off background blur" : blur.loading ? "Loading background blur…" : "Blur my background"}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => room.setAmbient(!room.ambient)}>
            <Sparkles /> {room.ambient ? "Turn off room lighting" : "Turn on room lighting"}
          </DropdownMenuItem>
          {canRecord && (
            <DropdownMenuItem
              disabled={isAwaitingResponse}
              onSelect={() => {
                if (isCallRecordingInProgress) setConfirmStop(true);
                else
                  void toggleCallRecording()
                    .then(() => toast("Recording started. Everyone in the call can see it."))
                    .catch(() => toast.error("Couldn't start recording."));
              }}
            >
              <CircleDot /> {isAwaitingResponse ? "Working…" : isCallRecordingInProgress ? "Stop recording" : "Start recording"}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={room.openDeviceSettings}>
            <SlidersHorizontal /> Audio and video settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmStop} onOpenChange={setConfirmStop}>
        <DialogContent className="sm:max-w-[420px]" hideClose>
          <div className="flex flex-col gap-5 p-6 sm:p-7">
            <div className="flex flex-col gap-1.5">
              <DialogTitle className="text-xl">Stop recording?</DialogTitle>
              <DialogDescription>The recording so far will be in Recordings a few minutes after it stops.</DialogDescription>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setConfirmStop(false)}>
                Keep recording
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setConfirmStop(false);
                  void toggleCallRecording()
                    .then(() => toast("Recording stopped"))
                    .catch(() => toast.error("Couldn't stop recording."));
                }}
              >
                Stop recording
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PanelToggles() {
  const { panel, togglePanel, chat } = useRoom();
  const { useParticipantCount } = useCallStateHooks();
  const count = useParticipantCount();
  return (
    <>
      <Tip label="Chat" shortcut="C">
        <DockButton tone={panel === "chat" ? "active" : "default"} aria-label="Chat" aria-pressed={panel === "chat"} onClick={() => togglePanel("chat")} badge={panel === "chat" ? 0 : chat.unread}>
          <MessageSquare />
        </DockButton>
      </Tip>
      <Tip label="People" shortcut="P">
        <button
          type="button"
          aria-label={`People, ${count} in the call`}
          aria-pressed={panel === "people"}
          onClick={() => togglePanel("people")}
          className={cn(
            "tabular inline-flex h-12 items-center gap-1.5 rounded-full pl-[13px] pr-3.5 text-sm font-semibold transition-colors active:scale-95 [&_svg]:size-5",
            panel === "people" ? "bg-paper/20 hover:bg-paper/25" : "bg-white/8 hover:bg-white/14",
          )}
        >
          <Users />
          {count}
        </button>
      </Tip>
    </>
  );
}

export function LeaveControl({ phone }: { phone: boolean }) {
  const { meeting, leave, endForEveryone } = useRoom();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const canEnd = meeting.isHost && !meeting.isPersonal;

  const endDialog = (
    <Dialog open={confirmEnd} onOpenChange={setConfirmEnd}>
      <DialogContent className="sm:max-w-[440px]" hideClose>
        <div className="flex flex-col gap-5 p-6 sm:p-7">
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-xl">End the meeting for everyone?</DialogTitle>
            <DialogDescription>Everyone is removed from the call, and the link stops working.</DialogDescription>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setConfirmEnd(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={endForEveryone}>
              End for everyone
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (!canEnd) {
    return (
      <Tip label="Leave the call">
        <button
          type="button"
          onClick={leave}
          className={cn(
            "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-tally font-semibold text-white transition-colors hover:bg-tally-hover active:scale-95 [&_svg]:size-[18px]",
            phone ? "w-16 max-[379px]:w-14" : "px-[18px] pl-4 text-sm",
          )}
          aria-label="Leave the call"
        >
          <PhoneOff />
          {!phone && "Leave"}
        </button>
      </Tip>
    );
  }

  return (
    <>
      <div className="flex h-12 items-center rounded-full bg-tally text-white">
        <button
          type="button"
          onClick={leave}
          aria-label="Leave the call"
          className={cn(
            "inline-flex h-12 items-center gap-2 rounded-l-full font-semibold transition-colors hover:bg-tally-hover active:scale-95 [&_svg]:size-[18px]",
            phone ? "w-14 justify-center pl-1 max-[379px]:w-12" : "pl-4 pr-3.5 text-sm",
          )}
        >
          <PhoneOff />
          {!phone && "Leave"}
        </button>
        <span aria-hidden className="h-6 w-px bg-black/25" />
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="More ways to leave"
            className="inline-flex h-12 w-[38px] items-center justify-center rounded-r-full pr-1 transition-colors hover:bg-tally-hover data-[state=open]:bg-tally-hover"
          >
            <ChevronUp className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-[280px]">
            <DropdownMenuItem onSelect={leave} className="flex-col items-start gap-0.5 py-2.5">
              <span className="text-sm font-semibold">Leave meeting</span>
              <span className="text-[12.5px] text-fog">The call keeps going without you.</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setConfirmEnd(true)} tone="danger" className="flex-col items-start gap-0.5 py-2.5">
              <span className="text-sm font-semibold">End meeting for everyone</span>
              <span className="text-[12.5px] text-fog">Everyone is removed from the call.</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {endDialog}
    </>
  );
}

export type DockVariant = "compact" | "medium" | "full";

/**
 * The bottom controls. Phones and small tablets get one compact row with the
 * extras tucked into More; wider screens get the full dock.
 */
export function Dock({ variant }: { variant: DockVariant }) {
  const { meeting, copyInvite } = useRoom();

  if (variant === "compact") {
    return (
      <div role="toolbar" aria-label="Call controls" className="glass mx-auto flex w-full max-w-[440px] items-center justify-between gap-1 rounded-full p-1.5 max-[379px]:gap-0.5 shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
        <MicControl withMenu={false} />
        <CameraControl withMenu={false} />
        <ReactionControl />
        <PanelChatButton />
        <MoreMenu extras={["hand", "people", "share", "flip", "invite"]} />
        <LeaveControl phone />
      </div>
    );
  }

  if (variant === "medium") {
    return (
      <div className="flex w-full items-center justify-center gap-3">
        <div role="toolbar" aria-label="Call controls" className="glass flex items-center gap-2 rounded-full p-2 shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
          <MicControl withMenu />
          <CameraControl withMenu />
          <span aria-hidden className="mx-0.5 h-6 w-px bg-white/10" />
          <ShareControl />
          <ReactionControl />
          <MoreMenu extras={["hand", "invite"]} />
        </div>
        <div className="flex items-center gap-2">
          <PanelToggles />
          <LeaveControl phone={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
      <div className="flex min-w-0 items-center">
        <Tip label="Copy invite link">
          <button
            type="button"
            onClick={copyInvite}
            className="inline-flex h-10 min-w-0 items-center gap-2 rounded-full px-3 text-[13px] text-fog transition-colors hover:bg-white/8 hover:text-paper"
          >
            <Copy className="size-4 shrink-0" />
            <span className="truncate tracking-[0.02em]">{meeting.id}</span>
          </button>
        </Tip>
      </div>
      <div role="toolbar" aria-label="Call controls" className="glass flex items-center gap-2 rounded-full p-2 shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
        <MicControl withMenu />
        <CameraControl withMenu />
        <span aria-hidden className="mx-0.5 h-6 w-px bg-white/10" />
        <ShareControl />
        <ReactionControl />
        <HandControl />
        <MoreMenu />
      </div>
      <div className="flex items-center justify-end gap-2">
        <PanelToggles />
        <LeaveControl phone={false} />
      </div>
    </div>
  );
}

function PanelChatButton() {
  const { panel, togglePanel, chat } = useRoom();
  return (
    <DockButton tone={panel === "chat" ? "active" : "default"} aria-label="Chat" aria-pressed={panel === "chat"} onClick={() => togglePanel("chat")} badge={panel === "chat" ? 0 : chat.unread}>
      <MessageSquare />
    </DockButton>
  );
}
