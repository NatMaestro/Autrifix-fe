"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Battery, Car, CircleAlert, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ISSUE_QUICK_TAGS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap = {
  engine: Wrench,
  tire: Car,
  battery: Battery,
  accident: CircleAlert,
} as const;

type Props = {
  onRequest?: (issue: string, tag: string | null) => Promise<void> | void;
};

export function LiveRequestPanel({ onRequest }: Props) {
  const [detail, setDetail] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!detail.trim() && !tag) {
      toast.error("Describe the issue or pick a quick tag.");
      return;
    }
    setSubmitting(true);
    try {
      await onRequest?.(detail, tag);
      toast.success("Dispatch signal sent.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not submit request.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 px-3 pb-6 pt-2"
    >
      <GlassCard className="mx-auto max-w-lg border-[#00E676]/15 shadow-[0_-8px_40px_rgba(0,0,0,0.45)]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="font-sora text-sm font-semibold text-slate-900 dark:text-white">
              What&apos;s wrong?
            </p>
            <p className="text-xs text-slate-500 dark:text-white/50">
              Choose issue category and we&apos;ll route the right mechanic.
            </p>
          </div>
          <span className="rounded-full bg-[#00E676]/15 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[#00E676]">
            Live
          </span>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {ISSUE_QUICK_TAGS.map((t) => {
            const Icon = iconMap[t.icon];
            const active = tag === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTag(active ? null : t.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-medium transition-all",
                  active
                    ? "border-[#00E676]/60 bg-[#00E676]/15 text-[#00E676]"
                    : "border-slate-300/70 bg-white/80 text-slate-700 hover:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:border-white/20",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Something else? Describe your issue..."
          rows={2}
          className="mb-4 w-full resize-none rounded-2xl border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#00E676]/40 dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-white/35"
        />
        <div className="grid grid-cols-2 gap-2">
          <Link href="/driver/issues">
            <Button type="button" className="w-full" size="lg" variant="ghost">
              All issues
            </Button>
          </Link>
          <Button type="button" className="w-full" size="lg" onClick={submit} disabled={submitting}>
            {submitting ? "Requesting..." : "Request help"} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
