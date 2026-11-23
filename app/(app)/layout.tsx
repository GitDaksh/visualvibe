import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { MobileTabBar, MobileTopBar } from "@/components/shell/MobileNav";
import { Sidebar } from "@/components/shell/Sidebar";
import { displayNameOf } from "@/lib/user";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const account = {
    userId: user.id,
    name: displayNameOf(user),
    email: user.primaryEmailAddress?.emailAddress ?? null,
    image: user.hasImage ? user.imageUrl : null,
  };

  return (
    <div className="flex min-h-dvh">
      <Sidebar account={account} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar account={account} />
        <main className="flex-1 px-5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-6 sm:px-8 md:pb-14 md:pt-10 lg:px-12">
          <div className="mx-auto w-full max-w-[1040px]">{children}</div>
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
