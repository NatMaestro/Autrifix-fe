"use client";

import { Download, Wallet } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { jobStatusLabel } from "@/lib/api-schema";
import { GlassCard } from "@/components/ui/glass-card";
import { listJobs, type Job } from "@/services/jobs";

/**
 * What the customer confirmed for this job, or 0 if there is no agreed amount.
 *
 * Replaces a function that guessed from the category name. Those figures were invented,
 * summed, and shown to providers as their earnings.
 */
function jobAmount(job: Job): number {
  return job.final_amount ? Number(job.final_amount) : 0;
}

function formatGhs(amount: number) {
  const raw = new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return raw.replace(/^GH₵\s?/, "₵");
}

export default function EarningsPage() {
  const jobsQ = useQuery({
    queryKey: ["jobs", "provider-earnings"],
    queryFn: listJobs,
    staleTime: 10_000,
  });
  // Memoised so the identity is stable: `?? []` alone yields a new array each
  // render, which defeats every hook that depends on it.
  const jobs = useMemo(() => jobsQ.data ?? [], [jobsQ.data]);

  const completedJobs = jobs.filter((j) => j.status === "completed");
  const cancelledJobs = jobs.filter((j) => j.status === "cancelled");
  const confirmedTotal = completedJobs.reduce((sum, job) => sum + jobAmount(job), 0);
  const avgPerCompleted = completedJobs.length ? confirmedTotal / completedJobs.length : 0;
  const completionRate = jobs.length ? Math.round((completedJobs.length / jobs.length) * 100) : 0;
  const cancelRate = jobs.length ? Math.round((cancelledJobs.length / jobs.length) * 100) : 0;

  const ledgerRows = useMemo(
    () =>
      [...jobs]
        .sort((a, b) => {
          const aMs = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bMs = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bMs - aMs;
        })
        .slice(0, 8),
    [jobs],
  );

  const weeklyBars = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    const now = Date.now();
    for (const job of completedJobs) {
      const ts = job.completed_at || job.created_at;
      if (!ts) continue;
      const daysAgo = Math.floor((now - new Date(ts).getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo >= 0 && daysAgo < 7) {
        const index = 6 - daysAgo;
        buckets[index] += jobAmount(job);
      }
    }
    const max = Math.max(...buckets, 1);
    return buckets.map((value) => Math.max(10, Math.round((value / max) * 100)));
  }, [completedJobs]);

  function exportCsv() {
    if (!ledgerRows.length) {
      toast.message("No jobs to export yet.");
      return;
    }
    const header = ["job_id", "service_name", "status", "customer_name", "created_at", "confirmed_amount_ghs"];
    const rows = ledgerRows.map((job) => [
      job.id,
      job.service_category_name || "Roadside service",
      job.status,
      job.customer_name || "Customer",
      job.created_at || "",
      jobAmount(job).toFixed(2),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `provider-metrics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported.");
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-sora text-6xl font-semibold text-white">Earnings</h1>
          <p className="mt-1 text-lg text-white/55">
            Amounts your customers confirmed on completed jobs.
          </p>
        </div>
        {/* No "Withdraw funds" button: there is no wallet and no payout. Providers collect
            from the customer directly, so a withdraw affordance would promise something the
            platform cannot do. */}
        <div className="hidden max-w-[240px] rounded-xl border border-white/10 bg-[#1b2739]/60 px-3 py-2 sm:block">
          <p className="inline-flex items-center gap-2 text-xs text-white/55">
            <Wallet className="h-4 w-4 shrink-0 text-white/40" />
            Collected directly from customers — Autrifix does not hold or transfer funds.
          </p>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
        <GlassCard className="border-white/10 bg-[#253247]/90">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Confirmed earnings (all completed)</p>
          <p className="mt-2 font-sora text-7xl font-semibold text-white">
            {formatGhs(confirmedTotal)}
          </p>
          <div className="mt-4 grid h-28 grid-cols-7 items-end gap-2">
            {weeklyBars.map((h, i) => (
              <div
                key={i}
                className={i === 5 ? "rounded-t-lg bg-[#74e796]" : "rounded-t-lg bg-white/15"}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </GlassCard>
        <div className="space-y-3">
          <GlassCard className="border-white/10 bg-[#253247]/90">
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Jobs completed</p>
            <p className="font-sora text-5xl text-white">{completedJobs.length}</p>
          </GlassCard>
          <GlassCard className="border-white/10 bg-[#253247]/90">
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Avg. per job</p>
            <p className="font-sora text-5xl text-white">
              {formatGhs(avgPerCompleted)}
            </p>
          </GlassCard>
          <GlassCard className="border-white/10 bg-[#253247]/90">
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Completion / cancel</p>
            <p className="font-sora text-5xl text-white">{completionRate}%</p>
            <p className="text-sm text-white/55">{cancelRate}% cancelled</p>
          </GlassCard>
        </div>
      </div>
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-sora text-4xl text-white">Recent Job Ledger</h2>
          <button onClick={exportCsv} className="inline-flex items-center gap-1 text-sm text-[#8ef7bb]">
            Export CSV <Download className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
        {jobsQ.isLoading ? (
          <GlassCard className="border-white/10 bg-[#253247]/90 !py-4">
            <p className="text-white/70">Loading metrics...</p>
          </GlassCard>
        ) : ledgerRows.length ? (
          ledgerRows.map((job) => {
            const estimated = jobAmount(job);
            const statusLabel = jobStatusLabel(job.status);
            return (
              <GlassCard key={job.id} className="border-white/10 bg-[#253247]/90 !py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-sora text-3xl text-white">{job.service_category_name || "Roadside service"}</p>
                    <p className="text-sm text-white/45">
                      Job #{job.id.slice(0, 8)} · {job.created_at ? new Date(job.created_at).toLocaleString() : "Unknown time"}
                    </p>
                    <p className="text-xs text-white/50">Customer: {job.customer_name || "Customer"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Status</p>
                    <p
                      className={`rounded-full px-2 py-1 text-xs ${
                        job.status === "completed"
                          ? "bg-[#1f5a49] text-[#8ef7bb]"
                          : job.status === "cancelled"
                            ? "bg-[#4a2630] text-[#ffc2ca]"
                            : "bg-white/10 text-white/65"
                      }`}
                    >
                      {statusLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Amount</p>
                    <p className="font-sora text-3xl text-[#8ef7bb]">
                      +{formatGhs(estimated)}
                    </p>
                  </div>
                </div>
              </GlassCard>
            );
          })
        ) : (
          <GlassCard className="border-white/10 bg-[#253247]/90 !py-4">
            <p className="text-white/70">No jobs yet. Earnings appear once a customer confirms an amount.</p>
          </GlassCard>
        )}
        </div>
        <p className="mt-2 text-xs text-white/45">
          Amounts are what each customer confirmed. Autrifix records them; payment is made
          to you directly.
        </p>
      </div>
    </div>
  );
}
