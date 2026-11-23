import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Glow, Photo } from "@/components/landing/CallPreview";

/** Sign in and sign up: the form on one side, a quiet call scene on the other. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-studio text-paper">
      <main className="flex min-w-0 flex-1 flex-col pb-10 pl-[max(20px,env(safe-area-inset-left))] pr-[max(20px,env(safe-area-inset-right))] pt-[max(18px,env(safe-area-inset-top))] sm:px-10 sm:pt-7">
        <Link href="/" aria-label="VisualVibe home" className="self-start rounded-full">
          <Logo size={26} />
        </Link>
        <div className="flex flex-1 items-start justify-center pt-10 sm:items-center sm:py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </main>

      <aside aria-hidden className="hidden min-w-0 flex-1 p-4 lg:block">
        <div className="relative h-full min-h-[560px] overflow-hidden rounded-[28px] bg-[#0E0F11]">
          <Glow
            person="arjun"
            className="absolute left-[2%] top-[4%] h-[88%] w-[96%] opacity-70 [mask-image:radial-gradient(closest-side,#000_30%,transparent)]"
          />
          <div className="absolute inset-0 flex flex-col justify-center gap-4 p-10 xl:p-14">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[20px] shadow-[0_0_0_2px_rgba(243,242,238,0.9),0_40px_100px_rgba(0,0,0,0.5)]">
              <Photo person="arjun" sizes="(min-width: 1024px) 44vw, 1px" className="absolute inset-0 size-full object-[50%_30%]" />
              <span className="pill-scrim absolute bottom-3.5 left-3.5 flex h-[30px] items-center rounded-full px-3 text-[13px] font-semibold">
                Arjun Mehta
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["kabir", "sofia"] as const).map((p) => (
                <div key={p} className="relative aspect-[16/10] overflow-hidden rounded-[14px]">
                  <Photo person={p} sizes="(min-width: 1024px) 14vw, 1px" className="absolute inset-0 size-full object-[50%_30%]" />
                </div>
              ))}
              <div className="flex aspect-[16/10] items-center justify-center rounded-[14px] bg-[radial-gradient(circle_at_50%_42%,rgba(77,182,166,0.3),rgba(77,182,166,0)_62%),#17181B]">
                <span className="flex size-10 items-center justify-center rounded-full bg-light-teal text-sm font-[650] text-studio">RD</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
