"use client";

import { useQuery } from "@tanstack/react-query";
import { Home, MapPin, X } from "lucide-react";
import { useState } from "react";

import { AutriMap } from "@/components/map/autri-map";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { getCustomerProfile } from "@/services/me";

export type LatLng = { lat: number; lng: number };

/**
 * Where the vehicle should end up.
 *
 * Required for categories the backend marks `requires_destination` — those relocate the
 * vehicle, and a tow request without a destination is rejected. Until this existed the web
 * app never asked, so the entire towing side of the product could not be used.
 *
 * Deliberately map-first rather than an address field: there is no geocoder in the stack,
 * and a stranded customer is more likely to recognise a place on a map than to type an
 * address a driver could act on.
 */
export function DestinationPicker({
  origin,
  onConfirm,
  onCancel,
}: {
  origin: LatLng;
  onConfirm: (destination: LatLng) => void;
  onCancel: () => void;
}) {
  const [picked, setPicked] = useState<LatLng | null>(null);

  // There is no geocoder in the stack, so a saved home location is the only shortcut
  // available to someone who cannot find their destination by eye. Worth offering: "tow it
  // back to my place" is a common case, and the coordinate is already stored.
  const profileQ = useQuery({
    queryKey: ["customer-profile"],
    queryFn: getCustomerProfile,
    staleTime: 5 * 60_000,
  });
  const home =
    profileQ.data?.latitude != null && profileQ.data?.longitude != null
      ? { lat: profileQ.data.latitude, lng: profileQ.data.longitude }
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <GlassCard className="w-full max-w-2xl border-white/10 bg-[#111d2f]/95 sm:rounded-3xl">
        <div className="flex items-start gap-3">
          <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#00E676]" />
          <div className="flex-1">
            <p className="font-sora text-2xl font-semibold text-white">Where should it go?</p>
            <p className="mt-1 text-sm text-white/60">
              This job moves your vehicle, so your provider needs a destination. Tap the map to
              set it.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="rounded-lg p-1 text-white/50 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 h-[320px] overflow-hidden rounded-2xl">
          <AutriMap
            center={picked ?? origin}
            zoom={13}
            onPick={setPicked}
            showUser={false}
            useAutoRoute={false}
            markers={[
              { id: "origin", lat: origin.lat, lng: origin.lng, label: "Your vehicle" },
              ...(picked
                ? [{ id: "destination", lat: picked.lat, lng: picked.lng, label: "Destination" }]
                : []),
            ]}
          />
        </div>

        {home ? (
          <button
            type="button"
            onClick={() => setPicked(home)}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#1b2739]/60 px-3 py-2 text-sm text-white/80 hover:border-white/30"
          >
            <Home className="h-4 w-4 text-[#00E676]" /> Use my saved location
          </button>
        ) : null}

        <p className="mt-3 text-xs text-white/45">
          {picked
            ? `Destination set at ${picked.lat.toFixed(4)}, ${picked.lng.toFixed(4)}. Tap again to move it.`
            : "Tap anywhere on the map to drop the destination pin."}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" disabled={!picked} onClick={() => picked && onConfirm(picked)}>
            Confirm destination
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
