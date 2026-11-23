"use client";

type SinkAudio = HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };

/**
 * Plays a short two-note chime, through a chosen speaker where the browser
 * allows picking one. Used to test speakers before joining.
 */
export async function playTestSound(sinkId?: string) {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return false;
  const ctx = new Ctx();
  const destination = ctx.createMediaStreamDestination();
  const notes = [659.25, 987.77]; // E5 then B5

  notes.forEach((frequency, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + 0.05 + i * 0.16;
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
    osc.connect(gain).connect(destination);
    osc.start(start);
    osc.stop(start + 0.75);
  });

  const audio = new Audio() as SinkAudio;
  audio.srcObject = destination.stream;
  if (sinkId && sinkId !== "default" && typeof audio.setSinkId === "function") {
    await audio.setSinkId(sinkId).catch(() => {});
  }
  try {
    await audio.play();
  } catch {
    void ctx.close();
    return false;
  }
  window.setTimeout(() => {
    audio.pause();
    audio.srcObject = null;
    void ctx.close();
  }, 1400);
  return true;
}
