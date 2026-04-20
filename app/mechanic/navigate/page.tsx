"use client";

import { AlertTriangle, Layers3, Navigation, Radar } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { AutriMap } from "@/components/map/autri-map";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { listJobs, listNearbyOpenRequests } from "@/services/jobs";

const DRIVER = { lat: 5.598, lng: -0.182 };
const MECH = { lat: 5.605, lng: -0.175 };
const MECHANIC_ROUTE = [
  { lat: 5.605, lng: -0.175 },
  { lat: 5.6038, lng: -0.1768 },
  { lat: 5.6025, lng: -0.1784 },
  { lat: 5.6009, lng: -0.1801 },
  { lat: 5.5992, lng: -0.1814 },
  { lat: 5.598, lng: -0.182 },
];

export default function MechanicNavigatePage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const jobsQ = useQuery({
    queryKey: ["jobs"],
    queryFn: listJobs,
    staleTime: 10_000,
  });
  const activeJob = (jobsQ.data ?? []).find((j) => j.status === "active" || j.status === "pending_accept");
  const detailsHref = activeJob ? `/mechanic/job/${activeJob.id}` : "/mechanic/history";
  const nearbyQ = useQuery({
    queryKey: ["nearby-open-requests", coords?.lat, coords?.lng],
    queryFn: () => listNearbyOpenRequests(coords!.lat, coords!.lng, 50),
    enabled: Boolean(coords),
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
  const target = nearbyQ.data?.[0];

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 12_000 },
    );
  }, []);

  const mapCenter = useMemo(() => {
    if (coords) return coords;
    return MECH;
  }, [coords]);
  const driverPoint = useMemo(() => {
    if (target) {
      return { lat: target.latitude, lng: target.longitude };
    }
    return DRIVER;
  }, [target]);
  const driverName = target?.driver_name || "Driver";
  const vehicleSummary = target?.vehicle_summary || "Vehicle details pending";
  const issueName = typeof target?.category === "string" ? target.category : target?.category?.name || "Roadside issue";
  const fallbackDriverName = activeJob?.driver_name || driverName;
  const fallbackIssueName = activeJob?.service_category_name || issueName;
  const dynamicRoute = useMemo(
    () => [
      mapCenter,
      {
        lat: (mapCenter.lat + driverPoint.lat) / 2,
        lng: (mapCenter.lng + driverPoint.lng) / 2,
      },
      driverPoint,
    ],
    [mapCenter, driverPoint],
  );

  return (
    <div className="relative min-h-[70vh] px-4 pb-6 pt-6">
      <AutriMap
        center={mapCenter}
        zoom={13}
        showUser
        markers={[
          {
            id: "driver",
            lat: driverPoint.lat,
            lng: driverPoint.lng,
            label: target ? driverName : fallbackDriverName,
            subtitle: target ? `${vehicleSummary} · ${issueName}` : `Active job · ${fallbackIssueName}`,
          },
        ]}
        routePath={target ? dynamicRoute : MECHANIC_ROUTE}
        className="relative z-0 overflow-hidden rounded-3xl border border-white/10"
      />
      <div className="absolute mt-10 left-4 right-4 z-30 md:left-8 md:right-8">
        <GlassCard className="space-y-3 border-white/10 bg-[#253247]/90 !py-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1f2d41] px-3 py-2">
            <div className="inline-flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#00E676]/15">
                <Navigation className="h-4 w-4 text-[#00E676]" />
              </span>
              <div>
                <p className="font-sora text-2xl text-[#8ef7bb]">450 ft</p>
                <p className="text-sm text-white/70">Turn right onto Market Street</p>
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Live route</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="font-medium text-white">{driverName}</p>
              <p className="mt-1 text-xs text-white/65">{vehicleSummary}</p>
              <p className="mt-2 text-xs text-[#8ef7bb]">Issue: {issueName}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-sora text-3xl text-white">4</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Min</p>
              </div>
              <div>
                <p className="font-sora text-3xl text-white">10:42</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">ETA</p>
              </div>
              <div>
                <p className="font-sora text-3xl text-white">AM</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Period</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button className="rounded-full border border-white/10 bg-[#202c3e]/90 p-3 text-white/70">
                <Radar className="h-4 w-4" />
              </button>
              <button className="rounded-full border border-white/10 bg-[#202c3e]/90 p-3 text-white/70">
                <Layers3 className="h-4 w-4" />
              </button>
              <button className="rounded-full border border-red-500/20 bg-red-500/10 p-3 text-red-300">
                <AlertTriangle className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <Link href={detailsHref}>
                <Button variant="ghost" type="button">
                  Details
                </Button>
              </Link>
              <Button type="button" className="gap-2">
                ARRIVED
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
