"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut, MoreHorizontal, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  name: string;
  email?: string | null;
  image?: string | null;
  /** "full" shows the name next to the avatar; "compact" is avatar only. */
  variant?: "full" | "compact";
  side?: "top" | "bottom" | "right";
};

export function AccountMenu({ userId, name, email, image, variant = "full", side = "top" }: Props) {
  const clerk = useClerk();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "full" ? (
          <button
            type="button"
            className="group flex w-full items-center gap-2.5 rounded-[14px] border border-white/5 bg-white/[0.03] p-2.5 text-left transition-colors hover:bg-white/[0.06] data-[state=open]:bg-white/[0.06]"
          >
            <Avatar name={name} image={image} lightKey={userId} size={34} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13.5px] font-semibold">{name}</span>
              <span className="truncate text-xs text-fog">Account and sign out</span>
            </span>
            <MoreHorizontal className="size-[18px] text-fog transition-colors group-hover:text-paper" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Account menu"
            className={cn("rounded-full transition-shadow data-[state=open]:shadow-[0_0_0_2px_var(--color-studio),0_0_0_4px_var(--color-paper)]")}
          >
            <Avatar name={name} image={image} lightKey={userId} size={36} />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={variant === "full" ? "start" : "end"} className="w-[248px]">
        <DropdownMenuLabel className="flex flex-col gap-0.5 pb-2">
          <span className="truncate text-[13.5px] font-semibold text-paper">{name}</span>
          {email && <span className="truncate font-medium">{email}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => clerk.openUserProfile()}>
          <UserRound /> Manage account
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => clerk.signOut({ redirectUrl: "/" })}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
