"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  BackgroundFiltersProvider,
  useBackgroundFilters,
  type BackgroundFiltersContextValue,
} from "@stream-io/video-react-sdk";
import { toast } from "sonner";

type BlurApi = {
  /** The device can run background blur. */
  supported: boolean;
  active: boolean;
  loading: boolean;
  toggle: () => void;
};

const BlurContext = createContext<BlurApi>({ supported: false, active: false, loading: false, toggle: () => {} });

export const useBlur = () => useContext(BlurContext);

function Bridge({ onChange }: { onChange: (api: BackgroundFiltersContextValue) => void }) {
  const api = useBackgroundFilters();
  useEffect(() => onChange(api), [api, onChange]);
  return null;
}

/**
 * Background blur, loaded only the first time someone turns it on, so the
 * segmentation model never downloads for people who don't use it.
 */
export function BlurProvider({ children }: { children: React.ReactNode }) {
  const [supported, setSupported] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [api, setApi] = useState<BackgroundFiltersContextValue | null>(null);

  useEffect(() => {
    let alive = true;
    import("@stream-io/video-filters-web")
      .then((m) => m.isMediaPipePlatformSupported())
      .then((ok) => alive && setSupported(ok))
      .catch(() => alive && setSupported(false));
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<BlurApi>(
    () => ({
      supported,
      active: api?.backgroundFilter === "blur",
      loading: mounted && (!api || !api.isReady),
      toggle: () => {
        if (!mounted) {
          setMounted(true);
          return;
        }
        if (!api) return;
        if (api.backgroundFilter) api.disableBackgroundFilter();
        else api.applyBackgroundBlurFilter("high");
      },
    }),
    [api, mounted, supported],
  );

  return (
    <BlurContext.Provider value={value}>
      {mounted && (
        <BackgroundFiltersProvider
          backgroundFilter="blur"
          backgroundBlurLevel="high"
          onError={() => toast.error("Background blur stopped working on this device, so it's off.")}
        >
          <Bridge onChange={setApi} />
        </BackgroundFiltersProvider>
      )}
      {children}
    </BlurContext.Provider>
  );
}
