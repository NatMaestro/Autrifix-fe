"use client";

import Link from "next/link";

import { AutriMap } from "@/components/map/autri-map";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

const ACCRA = { lat: 5.6037, lng: -0.187 };

export default function DemoMapPage() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between gap-2 p-4">
        <GlassCard className="!p-3 text-xs text-white/80">
          Public preview · no account
        </GlassCard>
        <Link href="/auth/phone">
          <Button size="sm">Sign in</Button>
        </Link>
      </div>
      <div className="min-h-dvh flex-1">
        <AutriMap
          center={ACCRA}
          zoom={12}
          markers={[
            { id: "1", lat: 5.61, lng: -0.19, label: "Mechanic" },
            { id: "2", lat: 5.595, lng: -0.175, label: "Tow" },
          ]}
        />
      </div>
    </div>
  );
}
