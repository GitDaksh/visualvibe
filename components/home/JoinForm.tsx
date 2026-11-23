"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { parseMeetingInput } from "@/lib/meeting-code";
import { cn } from "@/lib/utils";

/** A meeting link or code field that opens the meeting. */
export function JoinForm({
  className,
  autoFocus,
  size = "md",
}: {
  className?: string;
  autoFocus?: boolean;
  size?: "md" | "lg";
}) {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = `${id}-code`;
  const errorId = `${id}-error`;

  return (
    <form
      className={cn("flex flex-col gap-1.5", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const id = parseMeetingInput(value);
        if (!id) {
          setError("That doesn't look like a meeting link or code.");
          return;
        }
        router.push(`/meeting/${id}`);
      }}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full border bg-white/[0.04] py-1 pl-[18px] pr-1 transition-[border-color,box-shadow] focus-within:border-paper/50 focus-within:ring-2 focus-within:ring-paper/20",
          size === "lg" ? "h-[54px] pr-1.5" : "h-12",
          error ? "border-tally-soft/60" : "border-white/10",
        )}
      >
        <label htmlFor={inputId} className="sr-only">
          Meeting link or code
        </label>
        <input
          id={inputId}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste a link or code"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="h-10 min-w-0 flex-1 bg-transparent text-base text-paper outline-none placeholder:text-fog sm:text-[14.5px]"
        />
        <Button
          type="submit"
          variant={size === "lg" ? "primary" : "subtle"}
          size="sm"
          className={cn("h-10 px-4 text-sm", size === "lg" && "h-[42px] px-5 text-[15px]")}
          disabled={!value.trim()}
        >
          Join
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="pl-4 text-[13px] text-tally-soft">
          {error}
        </p>
      )}
    </form>
  );
}

/** The row of primary actions on Home. Stacks neatly on phones. */
