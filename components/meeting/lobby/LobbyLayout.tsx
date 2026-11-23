import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/avatar";

type Me = { id: string; name: string; image?: string | null };

/**
 * The pre-join screen's frame: camera check on one side, meeting details on
 * the other. Stacks on phones and tablets, sits side by side from laptops up.
 */
export function LobbyLayout({ me, media, details }: { me: Me; media: React.ReactNode; details: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-studio text-paper">
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 pb-2 pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] pt-[max(14px,env(safe-area-inset-top))] sm:px-8 sm:pt-5">
        <Link href="/home" aria-label="VisualVibe home" className="rounded-full">
          <Logo size={26} />
        </Link>
        <div className="flex min-w-0 items-center gap-2.5 text-sm text-fog">
          <span className="hidden max-w-[220px] truncate sm:inline">{me.name}</span>
          <Avatar name={me.name} image={me.image} lightKey={me.id} size={32} />
        </div>
      </header>
      <main className="relative z-[1] flex flex-1 items-start justify-center pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] pt-2 sm:items-center sm:px-8 sm:pb-12 lg:pb-16">
        <div className="grid w-full max-w-[1200px] grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-14 short:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] short:gap-6">
          <section aria-label="Camera and microphone check" className="mx-auto w-full min-w-0 max-w-[760px] lg:max-w-none short:max-w-none">
            {media}
          </section>
          <section aria-label="Meeting details" className="mx-auto w-full min-w-0 max-w-[560px] lg:mx-0 lg:max-w-none short:mx-0 short:max-w-none">
            {details}
          </section>
        </div>
      </main>
    </div>
  );
}
