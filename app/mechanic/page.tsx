"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, TrendingUp, Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { IncomingRequestModal } from "@/features/mechanic/components/incoming-request-modal";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useRealtimeStore } from "@/store/realtime-store";
import { acceptJob, listJobs, listNearbyOpenRequests, patchJob, type NearbyRequestItem } from "@/services/jobs";

export default function MechanicHomePage() {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [incoming, setIncoming] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dismissedRequestIds, setDismissedRequestIds] = useState<string[]>([]);
  const [snoozedUntil, setSnoozedUntil] = useState<number | null>(null);
  const lastAlertedRequestId = useRef<string | null>(null);
  const setStatus = useRealtimeStore((s) => s.setStatus);
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["mechanic-profile"],
    queryFn: async () => {
      const { data } = await api.get("/mechanics/profile/");
      return data as {
        is_available: boolean;
        rating_avg: number;
        business_name: string;
        base_latitude?: number | null;
        base_longitude?: number | null;
      };
    },
  });
  const jobsQ = useQuery({
    queryKey: ["jobs"],
    queryFn: listJobs,
    staleTime: 10_000,
  });
  const activeJob = (jobsQ.data ?? []).find((j) => j.status === "active" || j.status === "pending_accept");
  const activeJobHref = activeJob ? `/mechanic/job/${activeJob.id}` : "/mechanic/history";
  const jobs = jobsQ.data ?? [];
  const pendingJobs = jobs.filter((j) => j.status === "pending_accept");
  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const activeJobsCount = jobs.filter((j) => j.status === "active" || j.status === "pending_accept").length;
  const cancelledJobs = jobs.filter((j) => j.status === "cancelled").length;
  const completionRate = jobs.length ? Math.round((completedJobs / jobs.length) * 100) : 0;
  const displayName = profile?.business_name?.trim() || "Mechanic";
  const queryCoords =
    coords ??
    (typeof profile?.base_latitude === "number" && typeof profile?.base_longitude === "number"
      ? { lat: profile.base_latitude, lng: profile.base_longitude }
      : null);
  const nearbyRequestsQ = useQuery({
    queryKey: ["nearby-open-requests", queryCoords?.lat, queryCoords?.lng],
    queryFn: () => listNearbyOpenRequests(queryCoords!.lat, queryCoords!.lng, 50),
    enabled: online && Boolean(queryCoords),
    refetchInterval: online ? 12_000 : false,
    staleTime: 5_000,
  });
  const visibleIncomingRequest =
    (nearbyRequestsQ.data ?? []).find((r) => {
      if (dismissedRequestIds.includes(r.id)) return false;
      return true;
    }) ?? null;
  const snoozedActive = typeof snoozedUntil === "number" && Date.now() < snoozedUntil;
  const showIncoming = online && Boolean(visibleIncomingRequest) && !snoozedActive && incoming;

  function requestCategoryLabel(item: NearbyRequestItem) {
    if (typeof item.category === "string") return item.category;
    return item.category?.name || "Roadside issue";
  }

  function requestDistanceMiles(item: NearbyRequestItem) {
    if (!coords) return null;
    const toRad = (n: number) => (n * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(item.latitude - coords.lat);
    const dLng = toRad(item.longitude - coords.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(coords.lat)) * Math.cos(toRad(item.latitude)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const km = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const miles = km * 0.621371;
    return miles.toFixed(1);
  }

  const patchAvailability = useMutation({
    mutationFn: async (payload: { next: boolean; lat?: number; lng?: number }) => {
      const body: Record<string, unknown> = { is_available: payload.next };
      if (typeof payload.lat === "number" && typeof payload.lng === "number") {
        body.base_latitude = payload.lat;
        body.base_longitude = payload.lng;
      }
      const { data } = await api.patch("/mechanics/profile/", body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mechanic-profile"] });
    },
  });
  const rejectPendingMut = useMutation({
    mutationFn: (jobId: string) => patchJob(jobId, { status: "cancelled" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Pending job rejected.");
    },
    onError: () => {
      toast.error("Could not reject pending job.");
    },
  });

  useEffect(() => {
    if (profile && typeof profile.is_available === "boolean") {
      setOnline(profile.is_available);
      if (
        typeof profile.base_latitude === "number" &&
        typeof profile.base_longitude === "number" &&
        !coords
      ) {
        setCoords({
          lat: profile.base_latitude,
          lng: profile.base_longitude,
        });
      }
    }
  }, [profile]);

  useEffect(() => {
    if (!online) {
      setIncoming(false);
      setSnoozedUntil(null);
      setDismissedRequestIds([]);
      return;
    }
    const requestGeo = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          toast.error("Location permission is required to receive nearby requests.");
        },
        { enableHighAccuracy: true, maximumAge: 60_000, timeout: 12_000 },
      );
    };
    requestGeo();
    const id = window.setInterval(requestGeo, 45_000);
    return () => window.clearInterval(id);
  }, [online]);

  useEffect(() => {
    if (!online) {
      setIncoming(false);
      return;
    }
    setIncoming(Boolean(visibleIncomingRequest));
  }, [online, visibleIncomingRequest]);

  async function resolveLocationForOnline() {
    const savedLat = typeof profile?.base_latitude === "number" ? profile.base_latitude : null;
    const savedLng = typeof profile?.base_longitude === "number" ? profile.base_longitude : null;
    if (savedLat !== null && savedLng !== null) return { lat: savedLat, lng: savedLng };
    if (coords) return coords;
    if (!navigator.geolocation) return null;

    const fresh = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 12_000 },
      );
    });
    if (fresh) setCoords(fresh);
    return fresh;
  }

  async function setAvailability(next: boolean) {
    if (next === online) return;
    if (next) {
      const resolved = await resolveLocationForOnline();
      const onlineLat = resolved?.lat;
      const onlineLng = resolved?.lng;
      if (typeof onlineLat !== "number" || typeof onlineLng !== "number") {
        toast.error("Enable location first so drivers can find you on the map.");
        return;
      }
    }
    setOnline(next);
    if (next) {
      setDismissedRequestIds([]);
      setSnoozedUntil(null);
    } else {
      setIncoming(false);
    }
    patchAvailability.mutate(
      {
        next,
        lat: next
          ? (typeof profile?.base_latitude === "number"
              ? profile.base_latitude
              : coords?.lat)
          : undefined,
        lng: next
          ? (typeof profile?.base_longitude === "number"
              ? profile.base_longitude
              : coords?.lng)
          : undefined,
      },
      {
        onError: () => {
          toast.error("Could not update availability.");
          setOnline(!next);
        },
        onSuccess: () => {
          toast.success(next ? "You are now online." : "You are now offline.");
        },
      },
    );
    setStatus(next ? "live" : "idle");
  }

  useEffect(() => {
    if (!showIncoming || !visibleIncomingRequest?.id) return;
    if (lastAlertedRequestId.current === visibleIncomingRequest.id) return;
    lastAlertedRequestId.current = visibleIncomingRequest.id;
    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const tone = (start: number, freq: number, gain: number, duration = 0.16) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + start);
        g.gain.setValueAtTime(0.0001, now + start);
        g.gain.exponentialRampToValueAtTime(gain, now + start + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + duration + 0.03);
      };
      tone(0, 880, 0.08);
      tone(0.2, 1175, 0.08);
      window.setTimeout(() => void ctx.close(), 700);
    } catch {
      // best-effort only
    }
  }, [showIncoming, visibleIncomingRequest?.id]);

  return (
    <div className="px-4 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-sora text-6xl font-semibold text-white">Welcome back, {displayName}.</h1>
          <p className="text-sm text-white/55">
            Your workshop is currently{" "}
            <span className="text-[#8df6ba]">{online ? "accepting priority calls." : "marked offline."}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#212c3d] p-2">
          <button
            type="button"
            onClick={() => {
              void setAvailability(true);
            }}
            className={`rounded-xl px-6 py-2 text-sm font-semibold ${
              online ? "bg-[#7ef8b1] text-[#153227]" : "text-white/55"
            }`}
          >
            ONLINE
          </button>
          <button
            type="button"
            onClick={() => {
              void setAvailability(false);
            }}
            className={`rounded-xl px-6 py-2 text-sm font-semibold ${
              !online ? "bg-[#7ef8b1] text-[#153227]" : "text-white/55"
            }`}
          >
            OFFLINE
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_280px]">
        <Link href="/mechanic/earnings">
          <GlassCard className="border-white/10 bg-[#253247]/90 transition hover:-translate-y-0.5 hover:border-[#00E676]/40">
            <p className="text-xs uppercase tracking-wider text-white/45">Workload snapshot</p>
            <p className="mt-2 font-sora text-7xl font-semibold text-white">{jobs.length}</p>
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#1f5a49] px-3 py-1 text-xs text-[#89f7bb]">
              <TrendingUp className="h-3 w-3" /> {activeJobsCount} active now
            </p>
            <div className="mt-6 grid h-28 grid-cols-3 items-end gap-2">
              <div className="rounded-t-lg bg-[#00E676]/55" style={{ height: `${Math.min(completedJobs * 12, 100)}%` }} />
              <div className="rounded-t-lg bg-[#59c3ff]/55" style={{ height: `${Math.min(activeJobsCount * 18, 100)}%` }} />
              <div className="rounded-t-lg bg-[#ff6b6b]/50" style={{ height: `${Math.min(cancelledJobs * 18, 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-white/55">Tap to open earnings metrics</p>
          </GlassCard>
        </Link>
        <Link href="/mechanic/history">
          <GlassCard className="border-white/10 bg-[#253247]/90 transition hover:-translate-y-0.5 hover:border-[#00E676]/40">
            <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#24433f]">
              <CheckCircle2 className="h-8 w-8 text-[#8df6ba]" />
            </span>
            <p className="font-sora text-8xl font-semibold text-white">{completedJobs}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Jobs completed</p>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#00E676]" style={{ width: `${completionRate}%` }} />
            </div>
            <p className="mt-2 text-xs text-white/55">{completionRate}% completion rate</p>
          </GlassCard>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-sora text-4xl font-semibold text-white">Upcoming tasks</h2>
            <Link href="/mechanic/history" className="text-sm text-[#8df6ba]">
              View schedule →
            </Link>
          </div>
          <div className="space-y-3">
            {jobsQ.isLoading ? (
              <GlassCard className="border-white/10 bg-[#253247]/90">
                <Skeleton className="h-16 w-full" />
              </GlassCard>
            ) : pendingJobs.length ? (
              pendingJobs.slice(0, 3).map((job) => (
                <GlassCard key={job.id} className="border-white/10 bg-[#253247]/90 transition hover:-translate-y-0.5 hover:border-[#00E676]/40">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/mechanic/job/${job.id}`} className="contents">
                      <p className="rounded-xl bg-[#323f55] px-3 py-2 text-xl font-semibold text-white/80">
                        {job.status.replace("_", " ")}
                      </p>
                      <div className="flex-1">
                        <p className="font-sora text-3xl text-white">
                          {job.service_category_name || "Roadside service"}
                        </p>
                        <p className="text-sm text-white/60">
                          Driver: {job.driver_name || "Driver"} · Job #{job.id.slice(0, 8)}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Link href={`/mechanic/job/${job.id}`}>
                        <Button size="sm" className="!px-3">
                          Open
                        </Button>
                      </Link>
                      {job.status === "pending_accept" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={rejectPendingMut.isPending}
                          onClick={() => rejectPendingMut.mutate(job.id)}
                        >
                          Reject
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </GlassCard>
              ))
            ) : (
              <GlassCard className="border-white/10 bg-[#253247]/90">
                <p className="text-white/70">No pending jobs right now. New requests will appear here.</p>
              </GlassCard>
            )}
          </div>
        </div>
        <Link href={activeJobHref}>
          <GlassCard className="border-white/10 bg-[#253247]/90 transition hover:-translate-y-0.5 hover:border-[#00E676]/40">
            <h3 className="font-sora text-4xl text-white">Current status</h3>
            <div className="mt-4 space-y-4 text-sm">
              <p className="text-white/75">Active jobs: {activeJobsCount}</p>
              <p className="text-white/75">Completed jobs: {completedJobs}</p>
              <p className="text-white/75">Cancelled jobs: {cancelledJobs}</p>
              <p className="text-white/75">
                Rating: {isLoading ? "..." : `${profile?.rating_avg?.toFixed?.(1) ?? "—"}★`}
              </p>
            </div>
            <Button variant="ghost" className="mt-6 w-full">
              Open active job
            </Button>
          </GlassCard>
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={activeJobHref}>
          <Button>Open job detail</Button>
        </Link>
        <Link href="/mechanic/navigate">
          <Button variant="outline">Start navigation</Button>
        </Link>
        <Link href="/mechanic/earnings">
          <Button variant="ghost">Earnings terminal</Button>
        </Link>
      </div>

      <div className="mt-6 hidden">
        <GlassCard>
          <p className="text-xs uppercase tracking-wider text-white/45">
            Rating
          </p>
          <div className="mt-2 font-sora text-2xl text-white">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `${profile?.rating_avg?.toFixed?.(1) ?? "—"}★`}
          </div>
          <Wrench className="h-10 w-10 text-[#00E676]/40" />
        </GlassCard>
      </div>

      <IncomingRequestModal
        open={showIncoming}
        request={
          visibleIncomingRequest
            ? {
                customerName: visibleIncomingRequest.driver_name || "Driver",
                vehicleLabel: visibleIncomingRequest.vehicle_summary || "Vehicle details pending",
                issueTitle: requestCategoryLabel(visibleIncomingRequest),
                issueDescription: visibleIncomingRequest.description,
                distanceLabel: requestDistanceMiles(visibleIncomingRequest)
                  ? `${requestDistanceMiles(visibleIncomingRequest)} miles`
                  : "Nearby",
              }
            : null
        }
        onClose={() => setIncoming(false)}
        onAccept={async () => {
          if (!visibleIncomingRequest?.id) return;
          try {
            const created = await acceptJob(visibleIncomingRequest.id);
            setIncoming(false);
            setDismissedRequestIds((prev) => [...prev, visibleIncomingRequest.id]);
            qc.invalidateQueries({ queryKey: ["jobs"] });
            toast.success("Accepted — opening job.");
            setStatus("live");
            router.replace(`/mechanic/job/${created.id}`);
          } catch {
            toast.error("Could not accept request.");
          }
        }}
        onReject={() => {
          setIncoming(false);
          if (visibleIncomingRequest?.id) {
            setDismissedRequestIds((prev) => [...prev, visibleIncomingRequest.id]);
          }
          toast.message("Request declined");
        }}
        onSnooze={() => {
          setIncoming(false);
          setSnoozedUntil(Date.now() + 5 * 60_000);
          toast.message("Incoming requests snoozed for 5 minutes.");
        }}
      />
    </div>
  );
}
