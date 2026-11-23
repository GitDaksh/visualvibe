import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-paper text-studio hover:bg-white",
        secondary: "border border-white/12 bg-white/[0.04] text-paper hover:bg-white/10",
        subtle: "bg-white/8 text-paper hover:bg-white/14",
        ghost: "bg-transparent text-paper hover:bg-white/10",
        quiet: "bg-transparent text-mist hover:bg-white/8 hover:text-paper",
        danger: "bg-tally text-white hover:bg-tally-hover",
        on: "bg-paper text-studio hover:bg-white",
      },
      size: {
        sm: "h-9 px-3.5 text-[13px] [&_svg]:size-4",
        md: "h-11 px-[18px] text-sm [&_svg]:size-[17px]",
        lg: "h-12 px-5 text-[15px] [&_svg]:size-[18px]",
        xl: "h-14 px-7 text-base [&_svg]:size-5",
        "icon-sm": "size-9 [&_svg]:size-4",
        icon: "size-11 [&_svg]:size-[18px]",
        "icon-lg": "size-12 [&_svg]:size-5",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});
