/** A still placeholder for the camera check while the call client loads. */
export function LobbyMediaSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="relative aspect-[3/4] max-h-[min(50dvh,560px)] w-full overflow-hidden rounded-[24px] bg-panel shadow-[0_30px_80px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.08)] min-[480px]:aspect-[4/3] sm:aspect-video sm:max-h-[calc(100dvh-140px)]">
        <div className="absolute inset-0 flex items-center justify-center">
          <span aria-hidden className="size-7 animate-spin rounded-full border-[2.5px] border-paper/15 border-t-paper/70" />
          <span className="sr-only">Starting your camera</span>
        </div>
      </div>
      <div className="hidden gap-2.5 sm:grid sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 rounded-[14px] border border-white/8 bg-white/[0.05]" />
        ))}
      </div>
    </div>
  );
}

