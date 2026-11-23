/**
 * Lets Clerk's sign-in and sign-up forms sit on the page like the rest of the
 * app instead of inside a floating card. Colors come from the provider theme
 * in app/layout.tsx; this only reshapes the layout and type.
 */
export const authAppearance = {
  elements: {
    rootBox: "w-full",
    cardBox: "!w-full !max-w-none !rounded-none !border-0 !bg-transparent !shadow-none",
    card: "!gap-7 !rounded-none !border-0 !bg-transparent !px-0 !pb-0 !pt-0 !shadow-none",
    header: "!items-start !gap-2.5 !text-left",
    headerTitle: "!text-[32px] !font-[620] !leading-[1.05] !tracking-[-0.025em] ![font-stretch:118%] sm:!text-[36px]",
    headerSubtitle: "!text-[15px] !leading-normal !text-fog",
    logoBox: "!hidden",
    socialButtonsBlockButton:
      "!h-12 !rounded-[14px] !border !border-white/12 !bg-white/[0.04] !shadow-none transition-colors hover:!bg-white/[0.08]",
    socialButtonsBlockButtonText: "!text-[15px] !font-semibold !text-paper",
    dividerLine: "!bg-white/8",
    dividerText: "!text-[13px] !text-fog",
    formFieldLabel: "!text-[13.5px] !font-semibold !text-mist",
    formFieldInput: "!h-12 !rounded-[14px] !text-base !shadow-none sm:!text-[15px]",
    formButtonPrimary: "!h-12 !rounded-[14px] !text-[15px] !font-semibold !shadow-none",
    footer: "!mt-1 !bg-none !bg-transparent !p-0 [&>*]:!bg-transparent",
    footerAction: "!justify-start !px-0 !py-0",
    footerActionText: "!text-[14.5px] !text-fog",
    footerActionLink: "!text-[14.5px] !font-semibold !text-paper underline-offset-4 hover:!underline",
  },
};
