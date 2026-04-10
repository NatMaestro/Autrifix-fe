import { cn } from "@/lib/utils";

type Props = { className?: string; size?: "sm" | "md" | "lg" };

export function AutrifixLogo({ className, size = "md" }: Props) {
  const s = size === "sm" ? "h-8" : size === "lg" ? "h-14" : "h-10";
  return (
    <div className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span
        className={cn(
          "relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#00E676] to-emerald-600 font-[family-name:var(--font-sora)] text-[#0B1F3A] shadow-[0_0_24px_rgba(0,230,118,0.35)]",
          s,
          size === "sm" ? "w-8 text-sm" : size === "lg" ? "w-14 text-xl" : "w-10 text-base",
        )}
      >
        A
      </span>
      <span className={cn("font-sora text-white", size === "lg" ? "text-2xl" : "text-lg")}>
        Autri<span className="text-[#00E676]">Fix</span>
      </span>
    </div>
  );
}
