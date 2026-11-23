"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { Tip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./AccountMenu";
import { NAV_ITEMS, isActive } from "./nav";

type Account = { userId: string; name: string; email?: string | null; image?: string | null };

/** Full sidebar on laptops and up, an icon rail on tablets, hidden on phones. */
export function Sidebar({ account }: { account: Account }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-white/6 bg-sidebar md:flex md:w-[76px] lg:w-[248px]">
      <div className="flex h-full flex-col gap-7 px-3 py-6 lg:px-4">
        <Link href="/home" className="flex items-center justify-center rounded-xl px-1 lg:justify-start lg:px-2.5" aria-label="VisualVibe home">
          <span className="hidden lg:inline-flex">
            <Logo />
          </span>
          <LogoMark className="text-paper lg:hidden" size={30} />
        </Link>

        <nav aria-label="Main" className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            const link = (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={cn(
                  "flex h-11 items-center justify-center gap-3 rounded-xl px-3 text-[14.5px] font-[550] transition-colors lg:justify-start",
                  active ? "bg-white/8 font-semibold text-paper" : "text-[#A3A3AB] hover:bg-white/6 hover:text-paper",
                )}
              >
                <Icon className="size-[19px] shrink-0" strokeWidth={1.75} aria-hidden />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
            return (
              <div key={href} className="contents">
                <span className="hidden md:contents lg:hidden">
                  <Tip label={label} side="right">
                    {link}
                  </Tip>
                </span>
                <span className="contents md:hidden lg:contents">{link}</span>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto">
          <div className="hidden lg:block">
            <AccountMenu {...account} variant="full" side="top" />
          </div>
          <div className="flex justify-center lg:hidden">
            <AccountMenu {...account} variant="compact" side="right" />
          </div>
        </div>
      </div>
    </aside>
  );
}
