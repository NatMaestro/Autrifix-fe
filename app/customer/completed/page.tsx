"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, Star } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { jobStatusLabel } from "@/lib/api-schema";
import { listJobs } from "@/services/jobs";
import { useRealtimeStore } from "@/store/realtime-store";

/**
 * A completed job, read from the API.
 *
 * This page used to be entirely fabricated: a made-up job id, a line-item invoice
 * (GH₵85.00 + GH₵120.00 + a "tech service fee"), a total, and "Visa • 4482". None of it was
 * real, and the card line was actively false — Autrifix does not process payments at all;
 * money is recorded and settled directly between customer and provider (backend ADR-022).
 * A customer reading that receipt would believe they had already paid.
 */
export default function CompletedPage() {
  const clearActiveJob = useRealtimeStore((s) => s.clearActiveJob);
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  useEffect(() => {
    clearActiveJob();
  }, [clearActiveJob]);

  const jobsQ = useQuery({
    queryKey: ["jobs", "completed"],
    queryFn: listJobs,
    staleTime: 30_000,
  });

  const jobs = jobsQ.data ?? [];
  const completed = jobs.filter((j) => j.status === "completed");
  const job = (jobId ? jobs.find((j) => j.id === jobId) : null) ?? completed[0] ?? null;

  if (jobsQ.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-sm text-white/50">Loading…</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 pb-28 pt-8">
        <div className="w-full max-w-lg text-center">
          <h1 className="font-sora text-4xl font-semibold text-white">No completed jobs yet</h1>
          <p className="mt-2 text-white/60">
            Once a job is finished and you have confirmed the amount, it will appear here.
          </p>
          <Link href="/customer" className="mt-6 block">
            <Button className="w-full" size="lg">
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const completedOn = job.completed_at
    ? new Date(job.completed_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 pb-28 pt-8">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#174634] text-[#87f9b7]">
            <Check className="h-10 w-10" />
          </span>
          <h1 className="mt-4 font-sora text-5xl font-semibold text-white">
            {jobStatusLabel(job.status)}
          </h1>
          {job.auto_confirmed ? (
            <p className="mt-2 text-sm text-amber-200">
              This job was closed automatically because it was not confirmed in time.
            </p>
          ) : null}
        </div>

        <GlassCard className="border-white/10 bg-[#273246]/90">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#8deab8]">Service</p>
              <p className="font-sora text-3xl font-semibold text-white">
                {job.service_category_name ?? "Roadside assistance"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Completed</p>
              <p className="text-xl text-white">{completedOn}</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-[#1e2c3d] p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Provider</p>
            <p className="font-semibold text-white">{job.provider_name}</p>
          </div>

          {job.final_amount ? (
            <div className="mt-4 rounded-2xl bg-[#1d4c42]/85 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">
                Agreed amount
              </p>
              <p className="font-sora text-5xl font-semibold text-[#91f9be]">
                {job.currency} {job.final_amount}
              </p>
              {/* Said plainly, because the previous version of this page implied a card had
                  already been charged. */}
              <p className="mt-2 text-xs text-white/55">
                Paid directly to your provider. Autrifix does not handle the payment.
              </p>
            </div>
          ) : null}
        </GlassCard>

        <Link href={`/customer/rate?jobId=${job.id}`} className="mt-6 block">
          <Button className="w-full gap-2" size="lg">
            <Star className="h-4 w-4" /> Rate your provider
          </Button>
        </Link>
      </div>
    </div>
  );
}
