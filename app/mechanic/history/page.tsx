"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { listJobs, patchJob } from "@/services/jobs";

export default function MechanicHistoryPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending_accept" | "completed" | "cancelled">("all");
  const jobsQ = useQuery({
    queryKey: ["jobs", "mechanic-history"],
    queryFn: listJobs,
    staleTime: 10_000,
  });
  const qc = useQueryClient();
  const rejectMut = useMutation({
    mutationFn: (jobId: string) => patchJob(jobId, { status: "cancelled" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["jobs", "mechanic-history"] });
      toast.success("Pending job rejected.");
    },
    onError: () => {
      toast.error("Could not reject this pending job.");
    },
  });

  const jobs = jobsQ.data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (statusFilter !== "all" && job.status !== statusFilter) return false;
      if (!q) return true;
      const text = `${job.id} ${job.service_category_name ?? ""} ${job.driver_name ?? ""} ${job.status}`.toLowerCase();
      return text.includes(q);
    });
  }, [jobs, query, statusFilter]);
  const completedCount = jobs.filter((j) => j.status === "completed").length;
  const activeCount = jobs.filter((j) => j.status === "active" || j.status === "pending_accept").length;
  const cancelCount = jobs.filter((j) => j.status === "cancelled").length;

  const statusBadgeClass = (status: string) =>
    status === "completed"
      ? "bg-[#1f5a49] text-[#8ef7bb]"
      : status === "active" || status === "pending_accept"
        ? "bg-[#173153] text-[#9dd3ff]"
        : "bg-[#4a2630] text-[#ffc2ca]";

  return (
    <div className="px-4 py-6">
      <p className="text-xs uppercase tracking-[0.16em] text-white/45">Mechanic hub</p>
      <h1 className="font-sora text-6xl text-white">Job History</h1>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <GlassCard className="border-[#00E676]/40 bg-[#253247]/90">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Total jobs</p>
          <p className="font-sora text-5xl text-[#8ef7bb]">{jobs.length}</p>
          <p className="text-sm text-white/55">Across current account history</p>
        </GlassCard>
        <GlassCard className="border-white/10 bg-[#253247]/90">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Jobs completed</p>
          <p className="font-sora text-5xl text-white">{completedCount}</p>
          <p className="text-sm text-white/55">{activeCount} active/pending now</p>
        </GlassCard>
        <GlassCard className="border-white/10 bg-[#253247]/90">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Cancelled jobs</p>
          <p className="font-sora text-5xl text-white">{cancelCount}</p>
          <p className="text-sm text-white/55">Track avoidable drop-offs</p>
        </GlassCard>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <label className="inline-flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#0f1727] px-3 py-2 text-white/65">
          <Search className="h-4 w-4" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Search by driver, category or job ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <Button variant={statusFilter === "all" ? "primary" : "ghost"} onClick={() => setStatusFilter("all")}>
          All
        </Button>
        <Button
          variant={statusFilter === "completed" ? "primary" : "ghost"}
          onClick={() => setStatusFilter("completed")}
        >
          Completed
        </Button>
        <Button variant={statusFilter === "active" ? "primary" : "ghost"} onClick={() => setStatusFilter("active")}>
          Active
        </Button>
        <Button
          variant={statusFilter === "pending_accept" ? "primary" : "ghost"}
          onClick={() => setStatusFilter("pending_accept")}
        >
          Pending
        </Button>
        <Button
          variant={statusFilter === "cancelled" ? "primary" : "ghost"}
          onClick={() => setStatusFilter("cancelled")}
        >
          Cancelled
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {jobsQ.isLoading ? (
          <GlassCard className="border-white/10 bg-[#253247]/90 !py-4">
            <p className="text-white/70">Loading jobs...</p>
          </GlassCard>
        ) : jobsQ.isError ? (
          <GlassCard className="border-red-500/30 bg-[#3a1e29]/80 !py-4">
            <p className="text-red-200">Could not load jobs. Please retry.</p>
          </GlassCard>
        ) : filtered.length ? (
          filtered.map((job) => (
            <GlassCard key={job.id} className="border-white/10 bg-[#253247]/90 !py-3 transition hover:border-[#00E676]/40">
              <div className="grid items-center gap-3 md:grid-cols-[1fr_220px_220px]">
                <Link href={`/mechanic/job/${job.id}`} className="min-w-0">
                  <div>
                    <p className="font-sora text-3xl text-white">{job.service_category_name || "Roadside service"}</p>
                    <p className="text-sm text-white/45">JOB #{job.id}</p>
                    <p className="text-sm text-white/65">Driver: {job.driver_name || "Driver"}</p>
                  </div>
                </Link>
                <p className="text-sm text-white/65">{job.created_at ? new Date(job.created_at).toLocaleString() : "Unknown date"}</p>
                <div className="flex items-center gap-2">
                  <p
                    className={`justify-self-start rounded-full px-3 py-1 text-xs uppercase tracking-wider ${statusBadgeClass(job.status)}`}
                  >
                    {job.status.replace("_", " ")}
                  </p>
                  <Link href={`/mechanic/job/${job.id}`}>
                    <Button size="sm" variant="ghost">
                      Open
                    </Button>
                  </Link>
                  {job.status === "pending_accept" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={rejectMut.isPending}
                      onClick={() => rejectMut.mutate(job.id)}
                    >
                      Reject
                    </Button>
                  ) : null}
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <GlassCard className="border-white/10 bg-[#253247]/90 !py-4">
            <p className="text-white/70">No jobs match your current filter/search.</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
