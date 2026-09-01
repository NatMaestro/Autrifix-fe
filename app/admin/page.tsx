"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { GlassCard } from "@/components/ui/glass-card";
import { getStats } from "@/services/administration";

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "warn";
}) {
  return (
    <GlassCard className="border-white/10 bg-[#1f2c3f]/90">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">{label}</p>
      <p
        className={`mt-2 font-sora text-4xl font-semibold ${
          tone === "warn" ? "text-amber-300" : "text-white"
        }`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
    </GlassCard>
  );
}

export default function AdminOverviewPage() {
  const statsQ = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getStats,
    staleTime: 30_000,
  });

  const stats = statsQ.data;

  return (
    <div>
      <h1 className="font-sora text-6xl font-semibold text-white">Systems Overview</h1>
      <p className="mt-1 text-white/55">Live counts from the platform.</p>

      {statsQ.isLoading || !stats ? (
        <p className="mt-6 text-sm text-white/50">Loading…</p>
      ) : (
        <>
          {/* Surfaced first because it is the only number here that represents work waiting
              on a person. Everything else is observation. */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Link href="/admin/verifications" className="contents">
              <Stat
                label="Verifications pending"
                value={stats.verifications_pending}
                hint="Providers blocked from accepting work until reviewed"
                tone={stats.verifications_pending > 0 ? "warn" : undefined}
              />
            </Link>
            <Stat label="Open requests" value={stats.requests_open} hint="Waiting for a provider" />
            <Stat label="Jobs active" value={stats.jobs_active} />
            <Stat
              label="Awaiting confirmation"
              value={stats.jobs_awaiting_confirmation}
              hint="Finished; waiting on the customer"
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Users" value={stats.users_total} />
            <Stat label="Customers" value={stats.customers} />
            <Stat label="Providers" value={stats.providers} />
            <Stat label="Jobs completed" value={stats.jobs_completed} />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Stat
              label="Closed by timeout"
              value={stats.jobs_auto_confirmed}
              // Worth watching rather than merely counting: each one is a customer charged
              // because they did not answer, not because they agreed.
              hint="Customers charged without confirming — investigate if this climbs"
              tone={stats.jobs_auto_confirmed > 0 ? "warn" : undefined}
            />
            <Stat
              label="Confirmed value"
              value={
                stats.confirmed_amount_total
                  ? `${stats.currency} ${stats.confirmed_amount_total}`
                  : "—"
              }
              hint="Recorded, not processed — settled directly between the parties"
            />
          </div>
        </>
      )}
    </div>
  );
}
