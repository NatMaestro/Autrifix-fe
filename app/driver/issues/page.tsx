"use client";

import { Battery, Car, CircleAlert, Fuel, Lock, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";
import { createRequest } from "@/services/jobs";
import { nearbyServices, routeIssue } from "@/services/services";
import { useRealtimeStore } from "@/store/realtime-store";
import { cn } from "@/lib/utils";

const ISSUE_TYPES = [
  {
    id: "flat",
    title: "Flat Tire",
    desc: "Puncture, blowout, or low pressure requiring immediate replacement or repair.",
    Icon: Car,
  },
  {
    id: "battery",
    title: "Dead Battery",
    desc: "Vehicle won't start, requires a jump-start or battery diagnostics.",
    Icon: Battery,
  },
  {
    id: "engine",
    title: "Engine Smoke",
    desc: "Overheating, unusual smells, or visible smoke from the hood area.",
    Icon: Wrench,
  },
  {
    id: "locked",
    title: "Locked Out",
    desc: "Keys inside vehicle or lost. Professional lockout assistance required.",
    Icon: Lock,
  },
  {
    id: "fuel",
    title: "Out of Fuel",
    desc: "Stranded with an empty tank. Fuel delivery for Gas or Diesel.",
    Icon: Fuel,
  },
  {
    id: "accident",
    title: "Accident",
    desc: "Collision or fender bender. Requires towing and insurance support.",
    Icon: CircleAlert,
  },
] as const;

export default function IssuesPage() {
  const FALLBACK = { lat: 5.6037, lng: -0.187 };
  const router = useRouter();
  const params = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const [customIssue, setCustomIssue] = useState("");
  const { geo } = useGeolocation();
  const center = geo.status === "ok" ? { lat: geo.lat, lng: geo.lng } : FALLBACK;
  const setStatus = useRealtimeStore((s) => s.setStatus);
  const setActiveJob = useRealtimeStore((s) => s.setActiveJob);
  const setPendingRequest = useRealtimeStore((s) => s.setPendingRequest);
  const setPendingRequestServiceLabel = useRealtimeStore((s) => s.setPendingRequestServiceLabel);
  const setPendingRequestRadiusKm = useRealtimeStore((s) => s.setPendingRequestRadiusKm);

  useEffect(() => {
    const rebook = (params.get("rebook") ?? "").trim();
    if (!rebook) return;
    setCustomIssue(rebook);
    const mapped = ISSUE_TYPES.find((x) => rebook.toLowerCase().includes(x.title.toLowerCase()));
    if (mapped) setSelected(mapped.id);
  }, [params]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!selected && !customIssue.trim()) {
      toast.error("Select an issue type or describe the problem.");
      return;
    }
    const issueText = `${customIssue.trim()}${selected ? ` ${selected}` : ""}`.trim();
    try {
      const routed = await routeIssue(issueText);
      let categoryId = routed?.category_id ?? null;
      if (!categoryId) throw new Error("Could not route your issue right now.");

      const nearby = await nearbyServices({ lat: center.lat, lng: center.lng, radius_km: 25 });
      const radiusKm =
        typeof nearby === "object" && nearby && "radius_km" in nearby
          ? Number((nearby as { radius_km?: number }).radius_km ?? 25)
          : 25;

      const created = await createRequest({
        category: categoryId,
        description: customIssue.trim() || `Issue reported: ${selected ?? "general assistance"}`,
        latitude: center.lat,
        longitude: center.lng,
        preferred_vehicle: null,
      });
      if (!created?.id || !created?.status) throw new Error("Could not create request.");

      const serviceLabel =
        routed?.category_slug
          ?.replace(/[-_]+/g, " ")
          .replace(/\b\w/g, (m) => m.toUpperCase()) ?? "Roadside assistance";
      setPendingRequest(created.id);
      setPendingRequestServiceLabel(serviceLabel);
      setPendingRequestRadiusKm(Number.isFinite(radiusKm) ? radiusKm : 25);
      setStatus("connecting");
      setActiveJob("/driver/matching", "Finding mechanic");
      toast.success("Issue captured. Starting service matching.");
      router.push("/driver/matching");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start matching.");
    }
  }

  return (
    <div className="min-h-dvh px-4 pb-28 pt-6">
      <h1 className="font-sora text-3xl font-semibold text-slate-900 dark:text-white">Select issue type</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-white/60">
        Choose the category that best describes your vehicle&apos;s current condition.
      </p>
      <GlassCard className="mt-6 border-slate-300/60 bg-white/90 dark:border-white/10 dark:bg-[#1b273a]/80">
        <form onSubmit={save} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {ISSUE_TYPES.map(({ id, title, desc, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelected(id)}
                className={cn(
                  "rounded-3xl border p-4 text-left transition-all",
                  selected === id
                    ? "border-[#00E676]/70 bg-emerald-50 shadow-[0_0_0_1px_rgba(0,230,118,0.45)] dark:bg-[#233145]"
                    : "border-slate-300/70 bg-white hover:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/25",
                )}
              >
                <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-[#0f1727]">
                  <Icon className="h-4 w-4 text-[#00E676]" />
                </span>
                <p className="font-sora text-xl font-semibold text-slate-900 dark:text-white">{title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-white/60">{desc}</p>
              </button>
            ))}
          </div>
          <label className="block text-sm text-slate-700 dark:text-white/75">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-white/40">
              Something else?
            </span>
            <input
              value={customIssue}
              onChange={(e) => setCustomIssue(e.target.value)}
              className="w-full rounded-2xl border border-slate-300/70 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:placeholder:text-white/35"
              placeholder="Describe your issue"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link href="/driver" className="sm:order-1">
              <Button type="button" variant="ghost" className="w-full">
                Back to map
              </Button>
            </Link>
            <Button type="submit" className="w-full">
              Request help
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
