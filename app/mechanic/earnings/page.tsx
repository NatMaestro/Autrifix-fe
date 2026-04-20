"use client";

import { Download, Wallet } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { listJobs, type JobListItem } from "@/services/jobs";

function estimateJobAmount(job: JobListItem) {
  const category = (job.service_category_name || "").toLowerCase();
  if (category.includes("battery")) return 85;
  if (category.includes("tire")) return 120;
  if (category.includes("engine")) return 170;
  if (category.includes("elect")) return 140;
  if (category.includes("diagnostic")) return 95;
  return 110;
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
    queryKey: ["jobs", "mechanic-earnings"],
    queryFn: listJobs,
    staleTime: 10_000,
  });
  const jobs = jobsQ.data ?? [];

  const completedJobs = jobs.filter((j) => j.status === "completed");
  const cancelledJobs = jobs.filter((j) => j.status === "cancelled");
  const activeOrPendingJobs = jobs.filter((j) => j.status === "active" || j.status === "pending_accept");
  const estimatedTotal = completedJobs.reduce((sum, job) => sum + estimateJobAmount(job), 0);
  const avgPerCompleted = completedJobs.length ? estimatedTotal / completedJobs.length : 0;
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
        buckets[index] += estimateJobAmount(job);
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
    const header = ["job_id", "service_name", "status", "driver_name", "created_at", "estimated_amount_ghs"];
    const rows = ledgerRows.map((job) => [
      job.id,
      job.service_category_name || "Roadside service",
      job.status,
      job.driver_name || "Driver",
      job.created_at || "",
      estimateJobAmount(job).toFixed(2),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mechanic-metrics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported.");
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-sora text-6xl font-semibold text-white">Earnings Terminal</h1>
          <p className="mt-1 text-lg text-white/55">Live mechanic metrics and estimated earnings from completed jobs.</p>
        </div>
        <Button
          size="lg"
          className="gap-2"
          onClick={() => toast.message("Payout flow coming soon.")}
        >
          <Wallet className="h-4 w-4" /> Withdraw funds
        </Button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
        <GlassCard className="border-white/10 bg-[#253247]/90">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Estimated earnings (all completed)</p>
          <p className="mt-2 font-sora text-7xl font-semibold text-white">
            {formatGhs(estimatedTotal)}
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
            const estimated = estimateJobAmount(job);
            const statusLabel = job.status.replace("_", " ");
            return (
              <GlassCard key={job.id} className="border-white/10 bg-[#253247]/90 !py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-sora text-3xl text-white">{job.service_category_name || "Roadside service"}</p>
                    <p className="text-sm text-white/45">
                      Job #{job.id.slice(0, 8)} · {job.created_at ? new Date(job.created_at).toLocaleString() : "Unknown time"}
                    </p>
                    <p className="text-xs text-white/50">Driver: {job.driver_name || "Driver"}</p>
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
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Est. Earnings</p>
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
            <p className="text-white/70">No jobs yet. Earnings metrics will appear after your first jobs.</p>
          </GlassCard>
        )}
        </div>
        <p className="mt-2 text-xs text-white/45">
          Amounts shown are estimates based on service categories until payout billing is fully integrated.
        </p>
      </div>
    </div>
  );
}
