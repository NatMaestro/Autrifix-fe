"use client";

import { MapPin, Star } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeolocation } from "@/hooks/use-geolocation";
import { nearbyServices } from "@/services/services";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function ProvidersPage() {
  const { geo } = useGeolocation();
  const [query, setQuery] = useState("");
  const center =
    geo.status === "ok"
      ? { lat: geo.lat, lng: geo.lng }
      : { lat: 5.6037, lng: -0.187 };

  const { data: nearby, isLoading } = useQuery({
    queryKey: ["nearby-list", center.lat, center.lng],
    queryFn: () => nearbyServices({ lat: center.lat, lng: center.lng }),
  });
  const serviceOptions = useMemo(
    () => ["all", ...Array.from(new Set((nearby?.categories ?? []).map((c) => (c.name || c.slug || "").toLowerCase()).filter(Boolean)))],
    [nearby?.categories],
  );
  const [serviceFilter, setServiceFilter] = useState("all");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (nearby?.mechanics ?? []).filter((item) => {
      if (serviceFilter !== "all") {
        // nearby mechanics endpoint does not include per-mechanic service labels yet
        // so service filter is treated as category intent only.
      }
      if (q && !`${item.business_name}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [nearby?.mechanics, query, serviceFilter]);

  return (
    <div className="min-h-dvh px-4 pb-28 pt-8">
      <h1 className="font-sora text-5xl font-semibold text-white/90">Nearby mechanics</h1>
      <p className="mt-2 text-xl text-white/60">
        Live providers close to your current location.
      </p>
      <div className="mt-8 grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="space-y-4">
          <GlassCard className="border-white/10 bg-[#1b273a]/85">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8cc8a8]">
              Availability
            </p>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-white/70">
                <span>Nearby mechanics</span>
                <span className="text-3xl font-semibold text-white">{nearby?.nearby_mechanics_count ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-white/70">
                <span>Search radius</span>
                <span className="text-3xl font-semibold text-white">{Math.round(nearby?.radius_km ?? 25)} km</span>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="border-white/10 bg-[#1b273a]/85">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8cc8a8]">
              Filter
            </p>
            <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#8cc8a8]">Filter by service</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {serviceOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setServiceFilter(s)}
                  className={cn(
                    "rounded-full px-3 py-1 transition",
                    serviceFilter === s ? "bg-[#14583a] text-[#8bfdbb]" : "text-white/65 hover:bg-white/10",
                  )}
                >
                  {s === "all" ? "All services" : s.replace(/\b\w/g, (m) => m.toUpperCase())}
                </button>
              ))}
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search provider or service..."
              className="mt-4 w-full rounded-xl border border-white/10 bg-[#0f1727] px-3 py-2 text-sm text-white placeholder:text-white/35"
            />
          </GlassCard>
        </div>
        <div className="space-y-3">
          {isLoading
            ? [1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))
            : filtered.map((p) => (
                <GlassCard
                  key={p.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 border-white/10 bg-[#212d40]/90 shadow-[-3px_0_0_0_rgba(0,230,118,0.95)_inset]"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-sora text-3xl font-semibold text-white">{p.business_name || "Mechanic"}</p>
                        <p className="mt-1 text-sm text-[#8bfdbb]">Available nearby</p>
                      </div>
                      <span className="rounded-full bg-[#14583a] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#8bfdbb]">
                        online
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/65">
                      <span className="inline-flex items-center gap-1 text-[#9ce9bc]">
                        <Star className="h-4 w-4" /> {p.rating_avg.toFixed(1)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {p.distance_km.toFixed(1)} km away
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-semibold text-white">~{Math.max(3, Math.round((p.distance_km / 35) * 60))} min</p>
                    <p className="text-xs uppercase tracking-[0.14em] text-white/45">ETA (est)</p>
                    <Link
                      href={`/driver/issues?source=${encodeURIComponent(p.id)}`}
                      className="mt-3 inline-block"
                    >
                      <Button size="sm" className="!px-3">
                        Request
                      </Button>
                    </Link>
                  </div>
                </GlassCard>
              ))}
          {!isLoading && !filtered.length ? (
            <GlassCard className="border-white/10 bg-[#1b273a]/80">
              <p className="text-white/70">No nearby mechanics found right now.</p>
            </GlassCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
