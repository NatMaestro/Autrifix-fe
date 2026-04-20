"use client";

import { ArrowRight, CheckCircle2, MapPin, MessageCircle, Phone, Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { AutriMap } from "@/components/map/autri-map";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { useRealtimeStore } from "@/store/realtime-store";
import { listJobs } from "@/services/jobs";

const C = { lat: 5.6037, lng: -0.187 };
const M = { lat: 5.6075, lng: -0.181 };

export default function InProgressPage() {
  const searchParams = useSearchParams();
  const setActiveJob = useRealtimeStore((s) => s.setActiveJob);
  const jobId = searchParams.get("jobId");
  const chatHref = jobId ? `/driver/chat/${jobId}` : "/driver/messages";
  const jobsQ = useQuery({
    queryKey: ["jobs", "driver-in-progress"],
    queryFn: listJobs,
    staleTime: 10_000,
  });
  const jobs = jobsQ.data ?? [];
  const job = jobs.find((j) => j.id === jobId);
  const liveJob = job ?? jobs.find((j) => j.status === "active" || j.status === "pending_accept");
  const mechanicName = liveJob?.mechanic_name || "Assigned mechanic";
  const liveServiceName = liveJob?.service_category_name || "Roadside assistance";
  const liveStatus =
    liveJob?.status === "active"
      ? "In progress"
      : liveJob?.status === "pending_accept"
        ? "Assigned"
        : "Awaiting update";

  useEffect(() => {
    setActiveJob("/driver/in-progress", "Service in progress");
  }, [setActiveJob]);

  return (
    <div className="relative isolate h-dvh overflow-hidden">
      <div className="absolute inset-0 z-0">
        <AutriMap
          center={C}
          zoom={13}
          markers={[
            { id: "me", lat: C.lat, lng: C.lng, label: "You", subtitle: "Driver location" },
            {
              id: "mech",
              lat: M.lat,
              lng: M.lng,
              label: mechanicName,
              subtitle: `${liveServiceName} · ${liveStatus}`,
            },
          ]}
          className="h-full w-full"
        />
      </div>
      <div className="absolute left-4 top-20 z-10">
        <GlassCard className="!py-2 border-[#00E676]/30 bg-[#1a2a3b]/90">
          <p className="inline-flex items-center gap-2 font-medium text-[#8cf4b8]">
            <span className="h-2 w-2 rounded-full bg-[#00E676]" /> Mechanic is on-site
          </p>
        </GlassCard>
      </div>
      <div className="absolute bottom-24 left-4 right-4 z-10 grid gap-3 xl:bottom-6 xl:grid-cols-[360px_1fr]">
        <GlassCard className="border-white/10 bg-[#273246]/90">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="font-sora text-5xl font-semibold text-white">Repair in progress</p>
              <p className="text-white/60">
                Est. completion: <span className="text-[#8bfdbb]">14:45</span>
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#34445d]">
              <Wrench className="h-5 w-5 text-[#9ce9bc]" />
            </span>
          </div>
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-white/80">
              <CheckCircle2 className="h-4 w-4 text-[#8bfdbb]" /> Arrival at location
            </p>
            <p className="inline-flex items-center gap-2 text-white/80">
              <CheckCircle2 className="h-4 w-4 text-[#8bfdbb]" /> Initial diagnostic
            </p>
            <p className="inline-flex items-center gap-2 text-white">
              <span className="h-4 w-4 rounded-full border-2 border-[#8bfdbb]" /> Fixing alternator
            </p>
            <p className="inline-flex items-center gap-2 text-white/40">
              <span className="h-4 w-4 rounded-full border border-white/20" /> Final quality check
            </p>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/10">
            <div className="h-full w-2/3 rounded-full bg-[#00E676]" />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-[#1d2b3d] p-3">
            <div>
              <p className="font-semibold text-white">{mechanicName}</p>
              <p className="text-sm text-white/60">Certified master technician</p>
            </div>
            <div className="flex gap-2">
              <Link href={chatHref}>
                <Button size="sm" variant="ghost" className="!px-3">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="sm" className="!px-3">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </GlassCard>
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <GlassCard className="border-white/10 bg-[#273246]/90">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Vehicle status</p>
              <p className="mt-1 font-semibold text-white">Tesla Model 3</p>
              <p className="text-sm text-white/60">Space Gray · 774-KNT</p>
            </GlassCard>
            <GlassCard className="border-white/10 bg-[#273246]/90">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Payment method</p>
              <p className="mt-1 font-semibold text-white">Apple Pay</p>
              <p className="text-sm text-white/60">Linked to **** 9012</p>
            </GlassCard>
          </div>
          <GlassCard className="border-white/10 bg-[#273246]/90">
            <div className="flex items-center justify-between">
              <p className="font-medium text-white">Need immediate assistance?</p>
              <Link href="/driver/completed">
                <Button size="sm">
                  <MapPin className="h-4 w-4" /> Continue
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
      <div className="absolute right-4 top-20 z-20">
        <Link href="/driver/track">
          <Button variant="ghost" size="sm">
            Back to live route <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
