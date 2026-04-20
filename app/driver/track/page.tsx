"use client";

import { ArrowLeft, MessageCircle, Phone, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { AutriMap } from "@/components/map/autri-map";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { useRealtimeStore } from "@/store/realtime-store";
import { listJobs } from "@/services/jobs";

const C = { lat: 5.6037, lng: -0.187 };
const M = { lat: 5.612, lng: -0.178 };
const DRIVER_ROUTE = [
  { lat: 5.612, lng: -0.178 },
  { lat: 5.6105, lng: -0.1805 },
  { lat: 5.6078, lng: -0.1832 },
  { lat: 5.6054, lng: -0.1854 },
  { lat: 5.6037, lng: -0.187 },
];

export default function TrackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setActiveJob = useRealtimeStore((s) => s.setActiveJob);
  const clearActiveJob = useRealtimeStore((s) => s.clearActiveJob);
  const jobId = searchParams.get("jobId");
  const chatHref = jobId ? `/driver/chat/${jobId}` : "/driver/messages";
  const jobsQ = useQuery({
    queryKey: ["jobs", "driver-track"],
    queryFn: listJobs,
    staleTime: 10_000,
  });
  const jobs = jobsQ.data ?? [];
  const job = jobs.find((j) => j.id === jobId);
  const liveJob = job ?? jobs.find((j) => j.status === "active" || j.status === "pending_accept");
  const mechanicName = liveJob?.mechanic_name || "Assigned mechanic";
  const liveMechanicName = liveJob?.mechanic_name || mechanicName;
  const liveServiceName = liveJob?.service_category_name || "Roadside assistance";
  const liveStatus =
    liveJob?.status === "active"
      ? "On the way"
      : liveJob?.status === "pending_accept"
        ? "Pending acceptance"
        : "Awaiting update";

  useEffect(() => {
    setActiveJob("/driver/track", "Mechanic en route");
  }, [setActiveJob]);

  return (
    <div className="relative isolate h-dvh overflow-hidden">
      <div className="absolute inset-0 z-0">
        <AutriMap
          center={C}
          zoom={13}
          markers={[
            {
              id: "mech",
              lat: M.lat,
              lng: M.lng,
              label: liveMechanicName,
              subtitle: `${liveServiceName} · ${liveStatus}`,
            },
          ]}
          routePath={DRIVER_ROUTE}
          className="h-full w-full"
        />
      </div>
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-[60] flex items-center justify-between p-4">
        <Link href="/driver">
          <Button variant="ghost" size="sm" className="pointer-events-auto !px-3">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="pointer-events-auto flex gap-2">
          <Button variant="ghost" size="sm" className="!px-3">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="!px-3">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="absolute left-4 top-20 z-[60]">
        <GlassCard className="!py-2 border-[#00E676]/40 bg-[#1f2a3a]/90">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Estimated arrival</p>
          <p className="font-sora text-4xl font-semibold text-[#7cf7ac]">8-12 MIN</p>
        </GlassCard>
      </div>
      <div className="absolute bottom-24 left-4 right-4 z-[70] md:bottom-6">
        <GlassCard className="border-white/10 bg-[#273246]/90">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#305361] to-[#1e2f44]" />
            <div className="flex-1">
              <p className="font-sora text-3xl font-semibold text-white">{mechanicName}</p>
              <p className="text-sm text-white/65">
                <span className="text-[#8bfdbb]">★ 4.9</span> · On the way
              </p>
            </div>
            <span className="rounded-lg bg-[#1c2b42] px-2 py-1 text-xs text-white/70">VAN B-992-KF</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link href={chatHref}>
              <Button variant="ghost" className="w-full" size="lg">
                <MessageCircle className="h-4 w-4" /> Chat
              </Button>
            </Link>
            <Button className="w-full" size="lg">
              <Phone className="h-4 w-4" /> Call
            </Button>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-white/55">
            <p>Heading to: 42 Market St, SF</p>
            <button
              type="button"
              className="uppercase tracking-[0.16em] text-[#f4b8b7]"
              onClick={() => {
                clearActiveJob();
                router.replace("/driver");
              }}
            >
              Cancel job
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
