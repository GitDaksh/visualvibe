import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TimeZoneSync } from "@/components/shell/TimeZoneSync";
import "./globals.css";

const mona = localFont({
  src: "./fonts/MonaSans-Variable.woff2",
  variable: "--font-mona",
  weight: "200 900",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "75% 125%" }],
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "VisualVibe: video meetings in your browser",
    template: "%s – VisualVibe",
  },
  description:
    "Start a video call in one click, share the link and talk face to face. Chat, screen sharing and recordings are built in.",
  applicationName: "VisualVibe",
  openGraph: {
    type: "website",
    siteName: "VisualVibe",
    title: "VisualVibe: video meetings in your browser",
    description: "Start a call in one click, send the link and you're talking. Chat, screen sharing and recordings are built in.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // On Android, the keyboard shrinks the page instead of covering the chat box.
  interactiveWidget: "resizes-content",
  themeColor: "#121316",
  colorScheme: "dark",
};

const clerkLocalization = {
  signIn: {
    start: {
      title: "Sign in",
      subtitle: "Welcome back to VisualVibe.",
      actionText: "New here?",
      actionLink: "Create an account",
    },
  },
  signUp: {
    start: {
      title: "Create your account",
      subtitle: "You'll get a personal room with a link that never changes.",
      actionText: "Already have an account?",
      actionLink: "Sign in",
    },
  },
};

const clerkAppearance = {
  variables: {
    colorPrimary: "#F3F2EE",
    colorPrimaryForeground: "#121316",
    colorBackground: "#1A1B1F",
    colorForeground: "#F3F2EE",
    colorMuted: "#222328",
    colorMutedForeground: "#8E8E96",
    colorInput: "rgba(255,255,255,0.05)",
    colorInputForeground: "#F3F2EE",
    colorNeutral: "#F3F2EE",
    colorBorder: "rgba(255,255,255,0.10)",
    colorRing: "rgba(243,242,238,0.45)",
    colorDanger: "#FF8A80",
    colorSuccess: "#93B66C",
    colorShadow: "rgba(0,0,0,0.5)",
    colorModalBackdrop: "rgba(0,0,0,0.6)",
    fontFamily: "var(--font-mona), ui-sans-serif, system-ui, sans-serif",
    borderRadius: "14px",
  },
  options: {
    socialButtonsVariant: "blockButton" as const,
    socialButtonsPlacement: "top" as const,
  },
  elements: {
    formButtonPrimary: "!rounded-[14px] !h-12 !text-[15px] !font-semibold",
    footerActionLink: "!text-paper underline-offset-4 hover:!underline",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={mona.variable}>
      <body className="min-h-dvh bg-studio font-sans text-paper antialiased">
        <ClerkProvider
          appearance={clerkAppearance}
          localization={clerkLocalization}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/home"
          signUpFallbackRedirectUrl="/home"
          afterSignOutUrl="/"
        >
          <TooltipProvider delayDuration={350} skipDelayDuration={150}>
            {children}
          </TooltipProvider>
          <Toaster />
          <TimeZoneSync />
        </ClerkProvider>
      </body>
    </html>
  );
}
