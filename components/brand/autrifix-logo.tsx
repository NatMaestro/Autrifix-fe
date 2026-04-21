import Image from "next/image";

import { cn } from "@/lib/utils";

type Props = { className?: string; size?: "sm" | "md" | "lg" };

const heightClass = {
  sm: "h-8",
  md: "h-10",
  lg: "h-14",
} as const;

/** Shared logo — matches landing `AutriFix-logo-n.png`. */
export function AutrifixLogo({ className, size = "md" }: Props) {
  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/brand/AutriFix-logo-n.png"
        alt="AutriFix"
        width={260}
        height={140}
        priority={size === "lg"}
        className={cn("w-auto object-contain object-left", heightClass[size])}
      />
    </div>
  );
}
