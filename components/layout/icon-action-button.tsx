import type { LucideIcon } from "lucide-react";

type Props = {
  Icon: LucideIcon;
  label: string;
  onClick?: () => void;
  className?: string;
  active?: boolean;
};

export function IconActionButton({ Icon, label, onClick, className, active = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`rounded-xl border p-2.5 text-slate-700 transition-colors ${
        active
          ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-300/30 dark:bg-emerald-500/15 dark:text-[#8df6ba]"
          : "border-slate-300/70 bg-white/80 hover:bg-white dark:border-white/10 dark:bg-transparent dark:text-white/70 dark:hover:bg-white/10"
      } ${className ?? ""}`}
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}
