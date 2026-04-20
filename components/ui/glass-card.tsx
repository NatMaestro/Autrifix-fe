import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-300/50 bg-white/80 p-5 text-slate-900 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
