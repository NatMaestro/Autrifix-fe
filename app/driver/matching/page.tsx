"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CircleCheckBig, LoaderCircle, ShieldCheck, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { useRealtimeStore } from "@/store/realtime-store";
import { listJobs } from "@/services/jobs";

export default function MatchingPage() {
  const MATCH_TIMEOUT_MS = 30_000;
  const router = useRouter();
  const setActiveJob = useRealtimeStore((s) => s.setActiveJob);
  const setStatus = useRealtimeStore((s) => s.setStatus);
  const clearActiveJob = useRealtimeStore((s) => s.clearActiveJob);
  const pendingRequestId = useRealtimeStore((s) => s.pendingRequestId);
  const pendingRequestServiceLabel = useRealtimeStore((s) => s.pendingRequestServiceLabel);
  const pendingRequestRadiusKm = useRealtimeStore((s) => s.pendingRequestRadiusKm);
  const setPendingRequest = useRealtimeStore((s) => s.setPendingRequest);
  const setPendingRequestServiceLabel = useRealtimeStore((s) => s.setPendingRequestServiceLabel);
  const setPendingRequestRadiusKm = useRealtimeStore((s) => s.setPendingRequestRadiusKm);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [handledNoMatch, setHandledNoMatch] = useState(false);

  useEffect(() => {
    setActiveJob("/driver/matching", "Finding mechanic");
  }, [setActiveJob]);

  const startedAt = useMemo(() => Date.now(), []);
  useEffect(() => {
    const t = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 1000);
    return () => window.clearInterval(t);
  }, [startedAt]);
  const timedOut = elapsedMs >= MATCH_TIMEOUT_MS;

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs", "matching", pendingRequestId],
    queryFn: listJobs,
    enabled: Boolean(pendingRequestId),
    refetchInterval: (q) => {
      const rows = (q.state.data ?? []) as Array<{ service_request?: string; id?: string }>;
      const matched = rows.some((j) => j.service_request === pendingRequestId);
      return matched || timedOut ? false : 3000;
    },
  });

  const matchedJob = jobs.find((j) => j.service_request === pendingRequestId);

  useEffect(() => {
    if (!pendingRequestId) return;
    if (!matchedJob) return;
    setStatus("live");
    setActiveJob("/driver/track", "Mechanic en route");
    setPendingRequest(null);
    setPendingRequestServiceLabel(null);
    setPendingRequestRadiusKm(null);
    toast.success("Mechanic found. Heading to live tracking.");
    router.replace(`/driver/track?jobId=${matchedJob.id}`);
  }, [
    matchedJob,
    pendingRequestId,
    router,
    setActiveJob,
    setPendingRequest,
    setPendingRequestRadiusKm,
    setPendingRequestServiceLabel,
    setStatus,
  ]);

  useEffect(() => {
    if (!pendingRequestId || !timedOut || matchedJob || handledNoMatch) return;
    setHandledNoMatch(true);
    setStatus("idle");
    clearActiveJob();
    setPendingRequest(null);
    setPendingRequestServiceLabel(null);
    setPendingRequestRadiusKm(null);
    toast.error("No available mechanic at this time. Please try again later.");
    const t = window.setTimeout(() => router.replace("/driver"), 2200);
    return () => window.clearTimeout(t);
  }, [
    handledNoMatch,
    matchedJob,
    pendingRequestId,
    router,
    clearActiveJob,
    setPendingRequest,
    setPendingRequestRadiusKm,
    setPendingRequestServiceLabel,
    setStatus,
    timedOut,
  ]);
  const radiusMiles = ((pendingRequestRadiusKm ?? 25) * 0.621371).toFixed(1);

  return (
    <div className="mt-10 flex min-h-dvh flex-col items-center justify-center px-4">
      <GlassCard className="w-full max-w-2xl border-slate-300/70 bg-white/95 p-8 text-center dark:border-white/10 dark:bg-[#151f30]/80">
        <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
          <motion.span
            className="absolute h-full w-full rounded-full border-2 border-[#00E676]/40"
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.span
            className="absolute h-20 w-20 rounded-full border border-cyan-400/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00E676] to-emerald-700 shadow-[0_0_40px_rgba(0,230,118,0.4)]"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Wrench className="h-7 w-7 text-[#0d2539]" />
          </motion.span>
        </div>
        <div className="mt-4">
          <h1 className="font-sora text-5xl font-semibold text-slate-900 dark:text-white">
            {timedOut ? "No available mechanic right now" : "Finding the best help near you..."}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-xl text-slate-600 dark:text-white/60">
            {timedOut
              ? "No available mechanic at this time. Please try again later."
              : "Connecting with top-rated mechanics and roadside assistance in your area."}
          </p>
        </div>
        <GlassCard className="mx-auto mt-8 w-full max-w-xl border-slate-300/70 bg-slate-50 text-left dark:border-white/10 dark:bg-[#1b2739]/90">
          <div className="mb-4 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-slate-700 dark:text-white/75">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 dark:bg-[#0f1727]">
                <Wrench className="h-4 w-4 text-[#00E676]" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">Service type</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {pendingRequestServiceLabel ?? "Roadside assistance"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">Radius</p>
              <p className="font-semibold text-[#00E676]">{radiusMiles} miles</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <p className="flex items-center justify-between text-slate-700 dark:text-white/75">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#7fd9a9]" />
                Checking professional credentials
              </span>
              <CircleCheckBig className="h-4 w-4 text-[#00E676]" />
            </p>
            <p className="flex items-center justify-between text-slate-700 dark:text-white/75">
              <span className="inline-flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 text-[#7fd9a9]" />
                {timedOut ? "No mechanic accepted in time" : "Optimizing response time"}
              </span>
              {timedOut ? (
                <span className="h-4 w-4 rounded-full border border-amber-200/60" />
              ) : (
                <LoaderCircle className="h-4 w-4 animate-spin text-[#00E676]" />
              )}
            </p>
            <p className="flex items-center justify-between text-slate-500 dark:text-white/45">
              <span>Calculating fair-price estimates</span>
              <span className="h-4 w-4 rounded-full border border-slate-300 dark:border-white/20" />
            </p>
          </div>
        </GlassCard>
        <div className="mt-8 flex w-full justify-center gap-3">
          <Button
            className="px-8"
            size="lg"
            disabled={!matchedJob}
            onClick={() => router.push(`/driver/track${matchedJob?.id ? `?jobId=${matchedJob.id}` : ""}`)}
          >
            {matchedJob ? "Continue" : timedOut ? "No match found" : "Waiting for match..."}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => {
              clearActiveJob();
              setStatus("idle");
              setPendingRequest(null);
              setPendingRequestServiceLabel(null);
              setPendingRequestRadiusKm(null);
              router.replace("/driver");
            }}
          >
            {timedOut ? "Try again later" : "Cancel search"}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
