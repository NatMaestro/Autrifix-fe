"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleSlash, XCircle } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { api } from "@/lib/api";
import type { Schemas } from "@/lib/api-schema";

async function getHealth() {
  const { data } = await api.get<Schemas["HealthResponse"]>("/health/");
  return data;
}

function Row({
  label,
  state,
  detail,
}: {
  label: string;
  state: "ok" | "down" | "absent";
  detail: string;
}) {
  const Icon = state === "ok" ? CheckCircle2 : state === "down" ? XCircle : CircleSlash;
  const tone =
    state === "ok" ? "text-[#8ef7bb]" : state === "down" ? "text-red-300" : "text-white/40";

  return (
    <GlassCard className="border-white/10 bg-[#253247]/90">
      <p className="text-xs uppercase tracking-[0.16em] text-white/45">{label}</p>
      <p className={`mt-2 inline-flex items-center gap-2 ${tone}`}>
        <Icon className="h-4 w-4" />
        {state === "ok" ? "Operational" : state === "down" ? "Unreachable" : "Not built"}
      </p>
      <p className="mt-2 text-xs text-white/45">{detail}</p>
    </GlassCard>
  );
}

/**
 * System status.
 *
 * This page previously showed three invented indicators — "API Gateway: Operational",
 * "Dispatch Queue: Nominal", "Payments: Degraded". Two of those describe systems that do not
 * exist: discovery is pull-based with no dispatch queue (backend ADR-005), and the platform
 * processes no payments at all (ADR-022). "Payments: Degraded" implied a broken subsystem
 * rather than an absent one, which is a materially different thing for an operator to read.
 *
 * What remains is one real check and honest statements about the rest.
 */
export default function AdminSystemStatusPage() {
  const healthQ = useQuery({
    queryKey: ["admin-health"],
    queryFn: getHealth,
    refetchInterval: 30_000,
    retry: false,
  });

  const apiState = healthQ.isLoading ? "ok" : healthQ.isError ? "down" : "ok";

  return (
    <div>
      <h1 className="font-sora text-5xl text-white">System Status</h1>
      <p className="mt-1 text-white/60">
        One live check. The rest is stated rather than measured — see the notes.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Row
          label="API"
          state={apiState}
          detail={
            healthQ.isError
              ? "The health endpoint did not respond."
              : `GET /health/ — ${healthQ.data?.status ?? "checking"}`
          }
        />
        <Row
          label="Dispatch"
          state="absent"
          detail="By design: providers browse and claim work. There is no dispatch queue (ADR-005)."
        />
        <Row
          label="Payments"
          state="absent"
          detail="By design: amounts are recorded, never processed. Settled directly (ADR-022)."
        />
      </div>

      <GlassCard className="mt-4 border-white/10 bg-[#1f2c3f]/90">
        <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Not monitored here</p>
        <p className="mt-2 text-sm text-white/60">
          Redis, Celery, the WebSocket layer, and the scheduled sweep have no health probe.
          The sweep in particular fails silently: if it stops running, jobs simply stall in
          <span className="text-white/80"> awaiting confirmation</span> and requests never
          expire, with no error anywhere.
        </p>
      </GlassCard>
    </div>
  );
}
