"use client";

import { useEffect, useState } from "react";

import { toWsBase } from "@/services/chat";
import type { NearbyMechanicPreview } from "@/services/services";
import { useAuthStore } from "@/store/auth-store";

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la = (a.lat * Math.PI) / 180;
  const lb = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

type MechanicUpdatePayload = {
  id: string;
  business_name: string;
  latitude: number | null;
  longitude: number | null;
  is_available: boolean;
  rating_avg: number;
  rating_count: number;
};

function mergeMechanicUpdate(
  list: NearbyMechanicPreview[],
  m: MechanicUpdatePayload,
  center: { lat: number; lng: number },
  radiusKm: number,
): NearbyMechanicPreview[] {
  const next = list.filter((row) => row.id !== m.id);
  if (!m.is_available || m.latitude == null || m.longitude == null) {
    return next;
  }
  const d = haversineKm(center, { lat: m.latitude, lng: m.longitude });
  if (d > radiusKm + 1e-6) {
    return next;
  }
  const row: NearbyMechanicPreview = {
    id: m.id,
    business_name: m.business_name,
    latitude: m.latitude,
    longitude: m.longitude,
    rating_avg: m.rating_avg,
    rating_count: m.rating_count,
    distance_km: Math.round(d * 100) / 100,
  };
  return [...next, row].sort((a, b) => a.distance_km - b.distance_km);
}

type Options = {
  center: { lat: number; lng: number };
  radiusKm?: number;
  enabled?: boolean;
};

/**
 * Live nearby mechanics for drivers: WebSocket snapshot + incremental updates
 * when mechanics toggle availability or change workshop coordinates.
 */
export function useDriverNearbyMechanicsWs({ center, radiusKm = 25, enabled = true }: Options) {
  const access = useAuthStore((s) => s.access);
  const role = useAuthStore((s) => s.user?.role);
  const [liveMechanics, setLiveMechanics] = useState<NearbyMechanicPreview[] | null>(null);

  useEffect(() => {
    if (!enabled || !access || role !== "driver") {
      setLiveMechanics(null);
      return;
    }

    const ws = new WebSocket(`${toWsBase()}/ws/mechanics/nearby/?token=${encodeURIComponent(access)}`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as
          | { kind: "snapshot"; mechanics: NearbyMechanicPreview[] }
          | { kind: "mechanic_update"; mechanic: MechanicUpdatePayload }
          | { kind: string };
        if (msg.kind === "snapshot" && Array.isArray((msg as { mechanics?: unknown }).mechanics)) {
          setLiveMechanics((msg as { mechanics: NearbyMechanicPreview[] }).mechanics);
          return;
        }
        if (msg.kind === "mechanic_update" && (msg as { mechanic?: unknown }).mechanic) {
          const mechanic = (msg as { mechanic: MechanicUpdatePayload }).mechanic;
          setLiveMechanics((prev) => {
            const base = prev ?? [];
            return mergeMechanicUpdate(base, mechanic, center, radiusKm);
          });
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          kind: "subscribe",
          lat: center.lat,
          lng: center.lng,
          radius_km: radiusKm,
        }),
      );
    };

    ws.onerror = () => {
      setLiveMechanics(null);
    };

    return () => {
      ws.onmessage = null;
      ws.close();
      setLiveMechanics(null);
    };
  }, [enabled, access, role, center.lat, center.lng, radiusKm]);

  return { liveMechanics };
}
