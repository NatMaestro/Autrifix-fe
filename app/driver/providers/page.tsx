"use client";

import { CalendarDays, CreditCard, Star } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeolocation } from "@/hooks/use-geolocation";
import { nearbyServices } from "@/services/services";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const MOCK = [
  {
    id: "1",
    name: "Marcus Thorne",
    vendor: "RoadFix Pro Elite",
    service: "Flat Tire",
    rating: 4.9,
    date: "Oct 24, 2023",
    amount: "$124.00",
    eta: 12,
    status: "completed",
  },
  {
    id: "2",
    name: "Elena Rodriguez",
    vendor: "Kinetic Haulage",
    service: "Accident Recovery",
    rating: 4.7,
    date: "Oct 18, 2023",
    amount: "$0.00",
    eta: 18,
    status: "cancelled",
  },
  {
    id: "3",
    name: "Jordan Smith",
    vendor: "Spark Services Ltd.",
    service: "Dead Battery",
    rating: 4.8,
    date: "Sep 30, 2023",
    amount: "$85.50",
    eta: 24,
    status: "completed",
  },
  {
    id: "4",
    name: "Silas Vane",
    vendor: "RapidRefill",
    service: "Out of Fuel",
    rating: 4.9,
    date: "Sep 12, 2023",
    amount: "$45.00",
    eta: 35,
    status: "completed",
  },
];

export default function ProvidersPage() {
  const { geo } = useGeolocation();
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "cancelled">("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [query, setQuery] = useState("");
  const center =
    geo.status === "ok"
      ? { lat: geo.lat, lng: geo.lng }
      : { lat: 5.6037, lng: -0.187 };

  const { isLoading } = useQuery({
    queryKey: ["nearby-list", center.lat, center.lng],
    queryFn: () => nearbyServices({ lat: center.lat, lng: center.lng }),
  });
  const serviceOptions = useMemo(
    () => ["all", ...Array.from(new Set(MOCK.map((m) => m.service.toLowerCase())))],
    [],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (serviceFilter !== "all" && item.service.toLowerCase() !== serviceFilter) return false;
      if (
        q &&
        !`${item.name} ${item.vendor} ${item.service}`.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [query, serviceFilter, statusFilter]);

  return (
    <div className="min-h-dvh px-4 pb-28 pt-8">
      <h1 className="font-sora text-5xl font-semibold text-white/90">Driver history</h1>
      <p className="mt-2 text-xl text-white/60">
        Review your past service requests and assistance logs.
      </p>
      <div className="mt-8 grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="space-y-4">
          <GlassCard className="border-white/10 bg-[#1b273a]/85">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8cc8a8]">
              Account summary
            </p>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-white/70">
                <span>Total trips</span>
                <span className="text-3xl font-semibold text-white">42</span>
              </div>
              <div className="flex items-center justify-between text-white/70">
                <span>Total spent</span>
                <span className="text-4xl font-semibold text-white">$1,482.50</span>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="border-white/10 bg-[#1b273a]/85">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8cc8a8]">
              Filter by status
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {[
                { id: "all", label: "All jobs" },
                { id: "completed", label: "Completed" },
                { id: "cancelled", label: "Cancelled" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStatusFilter(opt.id as "all" | "completed" | "cancelled")}
                  className={cn(
                    "rounded-full px-4 py-1 transition",
                    statusFilter === opt.id
                      ? "bg-[#bed1f8] text-[#21355a]"
                      : "text-white/70 hover:bg-white/10",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
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
                  className={cn(
                    "grid grid-cols-[1fr_auto] items-center gap-3 border-white/10 bg-[#212d40]/90",
                    p.status === "completed"
                      ? "shadow-[-3px_0_0_0_rgba(0,230,118,0.95)_inset]"
                      : "shadow-[-3px_0_0_0_rgba(255,113,108,0.95)_inset]",
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-sora text-3xl font-semibold text-white">{p.name}</p>
                        <p className="text-lg text-white/70">Provider: {p.vendor}</p>
                        <p className="mt-1 text-sm text-[#8bfdbb]">Service: {p.service}</p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                          p.status === "completed"
                            ? "bg-[#14583a] text-[#8bfdbb]"
                            : "bg-[#5a1f33] text-[#f8b0be]",
                        )}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/65">
                      <span className="inline-flex items-center gap-1 text-[#9ce9bc]">
                        <Star className="h-4 w-4" /> {p.rating}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" /> {p.date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CreditCard className="h-4 w-4" /> {p.amount}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-semibold text-white">{p.eta} min</p>
                    <p className="text-xs uppercase tracking-[0.14em] text-white/45">ETA</p>
                    <Link
                      href={`/driver/issues?rebook=${encodeURIComponent(p.service)}&source=${encodeURIComponent(p.id)}`}
                      className="mt-3 inline-block"
                    >
                      <Button size="sm" className="!px-3">
                        Rebook
                      </Button>
                    </Link>
                  </div>
                </GlassCard>
              ))}
          {!isLoading && !filtered.length ? (
            <GlassCard className="border-white/10 bg-[#1b273a]/80">
              <p className="text-white/70">No history items match this filter.</p>
            </GlassCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
