"use client";

import { Car } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";

import { AutrifixLogo } from "@/components/brand/autrifix-logo";
import { AutriMap } from "@/components/map/autri-map";
import { LiveRequestPanel } from "@/features/driver/components/live-request-panel";
import { useDriverNearbyMechanicsWs } from "@/hooks/use-driver-nearby-mechanics-ws";
import { useGeolocation } from "@/hooks/use-geolocation";
import { vehicleReadiness } from "@/lib/vehicle-profile";
import { createRequest } from "@/services/jobs";
import { listVehicles } from "@/services/vehicles";
import { listServiceCategories, nearbyServices, routeIssue } from "@/services/services";
import { useRealtimeStore } from "@/store/realtime-store";
import { useAuthStore } from "@/store/auth-store";

const FALLBACK = { lat: 5.6037, lng: -0.187 };
const FIELD_NUDGE_LABEL: Record<string, string> = {
  vin: "VIN",
  engine: "Engine",
  license_plate: "Plate",
  tire_size: "Tire size",
  battery_group: "Battery group",
  belt_part_number: "Belt part #",
  oil_spec: "Oil spec",
  coolant_type: "Coolant",
  notes: "Notes",
  year: "Year",
  trim: "Trim",
  color: "Color",
  make: "Make",
  model: "Model",
};

const ISSUE_TO_CATEGORY_HINT: Record<string, string[]> = {
  engine: ["engine", "mechanical", "repair"],
  tire: ["tire", "tyre", "wheel"],
  battery: ["battery", "electrical", "jump"],
  accident: ["tow", "accident", "recovery"],
};

export default function DriverHomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { geo } = useGeolocation();
  const center =
    geo.status === "ok"
      ? { lat: geo.lat, lng: geo.lng }
      : FALLBACK;
  const liveCenter = useMemo(
    () => ({
      lat: Number(center.lat.toFixed(4)),
      lng: Number(center.lng.toFixed(4)),
    }),
    [center.lat, center.lng],
  );

  const { data: nearby } = useQuery({
    queryKey: ["nearby", liveCenter.lat, liveCenter.lng],
    queryFn: () =>
      nearbyServices({ lat: liveCenter.lat, lng: liveCenter.lng, radius_km: 25 }),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
  const { liveMechanics } = useDriverNearbyMechanicsWs({
    center: liveCenter,
    radiusKm: 25,
    enabled: Boolean(user?.role === "driver"),
  });
  const mechanicsForMap = liveMechanics ?? nearby?.mechanics ?? [];
  const nearbyCount =
    liveMechanics !== null ? liveMechanics.length : nearby?.nearby_mechanics_count ?? 0;
  const liveMechanicMarkers = mechanicsForMap.slice(0, 25).map((m) => ({
    id: m.id,
    lat: m.latitude,
    lng: m.longitude,
    label: m.business_name || "Mechanic",
    subtitle: `Mechanic · ${m.rating_avg.toFixed(1)} ★ · ${m.distance_km.toFixed(1)} km away`,
  }));

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: listVehicles,
    staleTime: 45_000,
  });

  const primaryVehicle = vehicles?.find((v) => v.is_primary) ?? vehicles?.[0];
  const readiness = primaryVehicle ? vehicleReadiness(primaryVehicle) : null;
  const topMissing = readiness?.missing.slice(0, 3) ?? [];

  const setStatus = useRealtimeStore((s) => s.setStatus);
  const setActiveJob = useRealtimeStore((s) => s.setActiveJob);
  const setPendingRequest = useRealtimeStore((s) => s.setPendingRequest);
  const setPendingRequestServiceLabel = useRealtimeStore((s) => s.setPendingRequestServiceLabel);
  const setPendingRequestRadiusKm = useRealtimeStore((s) => s.setPendingRequestRadiusKm);

  return (
    <div className="relative isolate h-dvh overflow-hidden">
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-[60] flex items-start justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <AutrifixLogo size="sm" />
          <div className="hidden rounded-2xl border border-slate-300/70 bg-white/85 px-3 py-1.5 text-xs text-slate-700 backdrop-blur-md dark:border-white/10 dark:bg-black/30 dark:text-white/70 sm:block">
            <span className="text-[#00E676]">
              {nearby || liveMechanics !== null ? String(nearbyCount) : "—"}
            </span>{" "}
            nearby technicians
            {liveMechanics !== null ? (
              <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-[#8ef7bb]">
                Live
              </span>
            ) : null}
          </div>
        </div>
        <div className="pointer-events-auto" />
      </header>

      <div className="absolute inset-0 z-0">
        <AutriMap
          center={center}
          zoom={14}
          className="h-full w-full"
          markers={liveMechanicMarkers}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[300px] z-[68] flex justify-center px-3 sm:bottom-[320px]">
        <div className="pointer-events-auto w-full max-w-lg rounded-2xl border border-slate-300/70 bg-white/90 px-4 py-3 text-xs text-slate-700 backdrop-blur-md dark:border-white/10 dark:bg-black/45 dark:text-white/75">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#163b34]">
                <Car className="h-4 w-4 text-[#8cf4b8]" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white">Vehicle profile</p>
                {primaryVehicle && readiness ? (
                  <p className="mt-0.5 truncate text-slate-600 dark:text-white/60">
                    {primaryVehicle.label ? `${primaryVehicle.label} · ` : ""}
                    {primaryVehicle.make} {primaryVehicle.model}
                    <span className="text-[#8ef7bb]"> · {readiness.score}%</span> ready
                  </p>
                ) : (
                  <p className="mt-0.5 text-slate-600 dark:text-white/60">Add a primary vehicle so dispatch can pre-match parts.</p>
                )}
              </div>
            </div>
            <Link
              href="/driver/vehicles"
              className="shrink-0 rounded-full border border-[#00E676]/45 bg-[#00E676]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 hover:bg-[#00E676]/20 dark:border-[#00E676]/35 dark:text-[#8ef7bb]"
            >
              Edit
            </Link>
          </div>
          {primaryVehicle && topMissing.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {topMissing.map((key) => (
                <span
                  key={key}
                  className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-white/10 dark:text-white/70"
                >
                  Missing: {FIELD_NUDGE_LABEL[key] ?? key}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-2 border-t border-slate-300/70 pt-2 text-[10px] uppercase tracking-wider text-slate-500 dark:border-white/10 dark:text-white/40">
            Coming soon: SMS / push nudges after service visits
          </p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-24 z-[70]">
        <LiveRequestPanel
          onRequest={async (issue, tag) => {
            const issueText = `${issue.trim()}${tag ? ` ${tag}` : ""}`.trim();
            if (!issueText) {
              throw new Error("Enter a description for your issue.");
            }

            // Hybrid rules+ML is handled in the backend. Frontend just sends free text
            // and uses the returned `category_id` to create the request.
            const routed = await routeIssue(issueText);
            let categoryId = routed?.category_id ?? null;
            if (!categoryId) {
              // Last-resort fallback so driver flow still proceeds even if AI route
              // endpoint cannot classify due category sync issues.
              const categories = await listServiceCategories();
              categoryId = categories[0]?.id ?? null;
            }
            if (!categoryId) throw new Error("No service categories are available on the server.");
            const serviceLabel =
              routed?.category_slug
                ?.replace(/[-_]+/g, " ")
                .replace(/\b\w/g, (m) => m.toUpperCase()) ?? "Roadside assistance";
            const radiusKm = Number(nearby?.radius_km ?? 25);

            const payload = {
              category: categoryId,
              description: issue.trim() || `Issue reported: ${tag ?? "general assistance"}`,
              latitude: center.lat,
              longitude: center.lng,
              preferred_vehicle: null,
            };
            const created = await createRequest(payload);
            if (!created?.id || !created?.status) {
              throw new Error("Request created but server response was incomplete. Please retry.");
            }
            setPendingRequest(created.id);
            setPendingRequestServiceLabel(serviceLabel);
            setPendingRequestRadiusKm(Number.isFinite(radiusKm) ? radiusKm : 25);
            setStatus("connecting");
            setActiveJob("/driver/matching", "Finding mechanic");
            router.push("/driver/matching");
          }}
        />
      </div>

      <div className="pointer-events-none absolute bottom-28 left-4 right-4 z-[55] flex justify-center sm:hidden">
        <div className="pointer-events-auto rounded-2xl border border-slate-300/70 bg-white/90 px-4 py-2 text-center text-xs text-slate-700 backdrop-blur-md dark:border-white/10 dark:bg-black/50 dark:text-white/70">
          Signed in as{" "}
          <span className="font-medium text-[#00E676]">
            {user?.phone ?? user?.email ?? "—"}
          </span>
        </div>
      </div>

    </div>
  );
}
