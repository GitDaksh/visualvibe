"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./AccountMenu";
import { NAV_ITEMS, isActive } from "./nav";

type Account = { userId: string; name: string; email?: string | null; image?: string | null };

/** Phone header: logo and account. */
export function MobileTopBar({ account }: { account: Account }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-studio/85 px-5 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-xl md:hidden">
      <Link href="/home" aria-label="VisualVibe home" className="text-paper">
        <LogoMark size={28} />
      </Link>
      <AccountMenu {...account} variant="compact" side="bottom" />
    </header>
  );
}

/** Phone tab bar, pinned above the home indicator. */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-white/6 bg-sidebar/92 px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-[52px] min-w-[72px] flex-col items-center justify-center gap-1 rounded-2xl text-[11.5px] transition-colors",
              active ? "font-semibold text-paper" : "font-[550] text-fog hover:text-paper",
            )}
          >
            <Icon className="size-[22px]" strokeWidth={1.75} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
