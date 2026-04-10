import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
          size === "sm" && "px-3 py-2 text-sm",
          size === "md" && "px-5 py-3 text-sm",
          size === "lg" && "px-6 py-4 text-base",
          variant === "primary" &&
            "bg-[#00E676] text-[#0B1F3A] shadow-[0_0_24px_rgba(0,230,118,0.25)] hover:bg-[#5efca3]",
          variant === "ghost" &&
            "border border-white/10 bg-white/5 text-white hover:bg-white/10",
          variant === "outline" &&
            "border border-[#00E676]/40 text-[#00E676] hover:bg-[#00E676]/10",
          variant === "danger" && "bg-red-500/90 text-white hover:bg-red-500",
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
