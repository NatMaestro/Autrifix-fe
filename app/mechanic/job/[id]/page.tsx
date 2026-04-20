"use client";

import { MessageCircle, Play, Wrench } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { DRIVER_VEHICLE_PACK_STORAGE_KEY, type VehiclePackSnapshot } from "@/lib/vehicle-profile";
import { getJob, listJobs, patchJob } from "@/services/jobs";

const DEMO = {
  title: "2023 Tesla Model S",
  subtitle: "Midnight silver metallic",
  plate: "7KEM924",
  vinLast4: "4920",
};

function vinLastFour(vin?: string | null) {
  const s = String(vin ?? "").replace(/\s/g, "");
  if (s.length < 4) return s || "—";
  return s.slice(-4);
}

function readVehiclePack(): VehiclePackSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRIVER_VEHICLE_PACK_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VehiclePackSnapshot;
    if (parsed?.vehicle?.make && parsed?.vehicle?.model) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export default function MechanicJobPage() {
  const { id } = useParams<{ id: string }>();
  const chatHref = id ? `/mechanic/chat/${id}` : "/mechanic/messages";
  const [pack, setPack] = useState<VehiclePackSnapshot | null>(null);
  const qc = useQueryClient();
  const jobsQ = useQuery({
    queryKey: ["jobs", "mechanic-job", id],
    queryFn: listJobs,
    staleTime: 10_000,
    enabled: Boolean(id),
  });
  const detailQ = useQuery({
    queryKey: ["job-detail", id],
    queryFn: () => getJob(id),
    enabled: Boolean(id),
    staleTime: 5_000,
  });
  const patchMut = useMutation({
    mutationFn: (body: { status: "pending_accept" | "active" | "completed" | "cancelled" }) => patchJob(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["job-detail", id] });
    },
    onError: () => toast.error("Could not update job status."),
  });

  useEffect(() => {
    function refresh() {
      setPack(readVehiclePack());
    }
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const v = pack?.vehicle;
  const headline = v
    ? `${v.year ? `${v.year} ` : ""}${v.make} ${v.model}`.trim()
    : DEMO.title;
  const subtitle = v?.color?.trim() || v?.trim?.trim() || (!v ? DEMO.subtitle : "—");
  const plate = v?.license_plate?.trim() || (!v ? DEMO.plate : "—");
  const vin4 = v?.vin ? vinLastFour(v.vin) : !v ? DEMO.vinLast4 : "—";
  const job = (jobsQ.data ?? []).find((row) => row.id === id);
  const effectiveJob = detailQ.data ?? job;
  const driverName = effectiveJob?.driver_name || "Driver";
  const issueLabel = effectiveJob?.service_category_name || "Roadside service";
  const statusLabel = (effectiveJob?.status || "pending_accept").replace("_", " ");

  return (
    <div className="px-4 py-6">
      <p className="text-xs uppercase tracking-[0.18em] text-white/45">
        Active jobs · <span className="text-[#8ef7bb]">Job ID: {id}</span>
      </p>
      <h1 className="mt-2 font-sora text-6xl text-white">{issueLabel}</h1>
      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <GlassCard className="border-white/10 bg-[#253247]/90 p-0">
            <div className="h-56 rounded-t-2xl bg-gradient-to-br from-[#0f2a3b] to-[#1a3040]" />
            <div className="m-4 rounded-2xl border border-[#00E676]/30 bg-[#1d2b3d] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#8ef7bb]">Precise location</p>
              <p className="font-sora text-4xl text-white">I-280 North, Exit 52B</p>
              <p className="text-sm text-white/60">Shoulder parking near the green signage</p>
            </div>
          </GlassCard>
          <GlassCard className="border-white/10 bg-[#253247]/90">
            <div className="inline-flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#24433f]">
                <Wrench className="h-6 w-6 text-[#8ef7bb]" />
              </span>
              <div>
                <p className="rounded-full bg-[#1f5a49] px-2 py-1 text-[10px] uppercase tracking-wider text-[#8ef7bb]">
                  {statusLabel}
                </p>
                <p className="mt-1 font-sora text-5xl text-white">{issueLabel}</p>
              </div>
            </div>
            <p className="mt-2 text-white/65">
              Estimated equipment: Heavy duty jack, spare kit.
              {v?.tire_size ? (
                <span className="mt-2 block text-[#8ef7bb]">Driver tire size on file: {v.tire_size}</span>
              ) : null}
            </p>
          </GlassCard>
        </div>
        <div className="space-y-4">
          <GlassCard className="border-white/10 bg-[#253247]/90">
            <p className="font-sora text-4xl text-white">{driverName}</p>
            <p className="text-sm text-white/60">Verified member since 2022</p>
            <Link href={chatHref} className="mt-4 block">
              <Button variant="ghost" className="w-full gap-2" type="button">
                <MessageCircle className="h-4 w-4" /> Chat with driver
              </Button>
            </Link>
          </GlassCard>
          <GlassCard className="border-white/10 bg-[#253247]/90">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Vehicle identity</p>
              {pack ? (
                <span className="shrink-0 rounded-full bg-[#00E676]/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#8ef7bb]">
                  Snapshot
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/45">
                  Demo
                </span>
              )}
            </div>
            <p className="mt-1 font-sora text-3xl text-white">{headline}</p>
            <p className="text-sm text-white/60">{subtitle}</p>
            {pack?.readiness != null ? (
              <p className="mt-2 text-xs text-white/50">
                Fleet readiness score (driver primary):{" "}
                <span className="text-[#8ef7bb]">{pack.readiness}%</span>
              </p>
            ) : null}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-[#1d2b3d] p-2">
                <p className="text-[10px] uppercase tracking-wider text-white/45">License plate</p>
                <p className="text-white">{plate}</p>
              </div>
              <div className="rounded-lg bg-[#1d2b3d] p-2">
                <p className="text-[10px] uppercase tracking-wider text-white/45">VIN (last 4)</p>
                <p className="text-white">{vin4}</p>
              </div>
            </div>
            {v && (v.battery_group || v.belt_part_number || v.engine) ? (
              <div className="mt-3 grid gap-2 text-xs text-white/70">
                {v.engine ? (
                  <p>
                    <span className="text-white/45">Engine: </span>
                    {v.engine}
                  </p>
                ) : null}
                {v.battery_group ? (
                  <p>
                    <span className="text-white/45">Battery group: </span>
                    {v.battery_group}
                  </p>
                ) : null}
                {v.belt_part_number ? (
                  <p>
                    <span className="text-white/45">Belt part #: </span>
                    {v.belt_part_number}
                  </p>
                ) : null}
              </div>
            ) : null}
            {!pack ? (
              <p className="mt-3 text-xs text-amber-200/80">
                No driver snapshot yet. When the driver saves vehicles at{" "}
                <span className="text-white">/driver/vehicles</span>, this card fills from local preview storage
                (until job APIs attach real vehicle context).
              </p>
            ) : (
              <p className="mt-3 text-xs text-white/45">{pack.disclaimer}</p>
            )}
          </GlassCard>
          <GlassCard className="border-white/10 bg-[#253247]/90">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Driver notes</p>
            <p className="mt-2 text-white/70">
              {v?.notes?.trim()
                ? `“${v.notes.trim()}”`
                : "“The tire blew out while cruising at 65mph. I’m parked safely on the right shoulder but the ground is slightly uneven.”"}
            </p>
          </GlassCard>
          <GlassCard className="border border-dashed border-white/15 bg-[#1b2739]/60">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Coming soon</p>
            <p className="mt-2 text-sm text-white/60">
              Parts compatibility matrix from VIN, job-tied permissions (no pre-match snooping), and live vehicle
              payload on accept.
            </p>
          </GlassCard>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              className="gap-2"
              onClick={async () => {
                await patchMut.mutateAsync({ status: "active" });
                toast.success("Job started.");
              }}
              disabled={patchMut.isPending || effectiveJob?.status === "active" || effectiveJob?.status === "completed"}
            >
              <Play className="h-4 w-4" /> Start job
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await patchMut.mutateAsync({ status: "completed" });
                toast.success("Job marked complete.");
              }}
              disabled={patchMut.isPending || effectiveJob?.status === "completed"}
            >
              Complete job
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
