"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { GlassCard } from "@/components/ui/glass-card";
import { jobStatusLabel } from "@/lib/api-schema";
import { listAdminJobs } from "@/services/administration";

const FILTERS = [
  { value: "", label: "All" },
  { value: "pending_accept", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "awaiting_confirmation", label: "Awaiting confirmation" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

/** Job history — the operational view for answering "what happened on this job?". */
export default function AdminHistoryPage() {
  const [status, setStatus] = useState<string>("");

  const jobsQ = useQuery({
    queryKey: ["admin-jobs", status],
    queryFn: () => listAdminJobs({ status: status || undefined }),
    staleTime: 15_000,
  });

  const jobs = jobsQ.data ?? [];

  return (
    <div>
      <h1 className="font-sora text-5xl text-white">Job History</h1>
      <p className="mt-1 text-white/55">Every job on the platform, newest first.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatus(option.value)}
            className={`rounded-xl border px-3 py-1.5 text-sm transition-colors ${
              status === option.value
                ? "border-[#00E676]/70 bg-[#00E676]/10 text-white"
                : "border-white/15 bg-white/5 text-white/60 hover:border-white/30"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {jobsQ.isLoading ? (
        <p className="mt-6 text-sm text-white/50">Loading…</p>
      ) : jobs.length === 0 ? (
        <GlassCard className="mt-6 border-white/10 bg-[#1f2c3f]/90">
          <p className="text-white/60">No jobs match that filter.</p>
        </GlassCard>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.16em] text-white/40">
                <th className="pb-2">Service</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Provider</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-white/5">
                  <td className="py-3 text-white/90">{job.service_category_name ?? "—"}</td>
                  <td className="py-3 text-white/60">{job.customer_name}</td>
                  <td className="py-3 text-white/60">{job.provider_name || "—"}</td>
                  <td className="py-3 text-white/70">
                    {jobStatusLabel(job.status)}
                    {job.auto_confirmed ? (
                      // Distinguished because it means the customer never agreed — the job
                      // closed on a timeout.
                      <span className="ml-2 rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] uppercase text-amber-200">
                        by timeout
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 text-white/80">
                    {job.final_amount ? `${job.currency} ${job.final_amount}` : "—"}
                  </td>
                  <td className="py-3 text-white/50">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
