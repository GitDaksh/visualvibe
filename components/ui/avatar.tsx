"use client";

import { useState } from "react";
import { lightFor } from "@/lib/lights";
import { cn, initialsOf } from "@/lib/utils";

type AvatarProps = {
  name?: string | null;
  image?: string | null;
  /** Stable key for the person light (user ID). Falls back to the name. */
  lightKey?: string | null;
  size?: number;
  className?: string;
  ring?: boolean;
};

/** A person's photo, or their initials on their person light. */
export function Avatar({ name, image, lightKey, size = 32, className, ring }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const light = lightFor(lightKey || name);
  const style = { width: size, height: size };
  const ringClass = ring ? "shadow-[0_0_0_2px_var(--color-studio),0_0_0_3.5px_var(--color-paper)]" : "";
  if (image && !failed) {
    return (
      <img
        src={image}
        alt=""
        width={size}
        height={size}
        style={style}
        onError={() => setFailed(true)}
        className={cn("shrink-0 rounded-full object-cover", ringClass, className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ ...style, backgroundColor: light.hex, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-bold text-studio", ringClass, className)}
    >
      {initialsOf(name)}
    </span>
  );
}
