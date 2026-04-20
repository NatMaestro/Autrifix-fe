"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const LeafletMapInner = dynamic(
  () => import("./leaflet-map-inner").then((mod) => mod.LeafletMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-full rounded-2xl bg-slate-100/70 dark:bg-[#0B1F3A]/80">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
    ),
  },
);

type Props = {
  center: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  markers?: {
    id: string;
    lat: number;
    lng: number;
    label?: string;
    subtitle?: string;
    avatarUrl?: string;
  }[];
  showUser?: boolean;
  routePath?: { lat: number; lng: number }[];
  useAutoRoute?: boolean;
  children?: React.ReactNode;
};

export function AutriMap(props: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <div className={cn("relative h-full min-h-[320px] w-full overflow-hidden", props.className)}>
      <LeafletMapInner
        center={props.center}
        zoom={props.zoom}
        markers={props.markers}
        showUser={props.showUser}
        routePath={props.routePath}
        useAutoRoute={props.useAutoRoute}
        theme={isDark ? "dark" : "light"}
      />
      {props.children}
    </div>
  );
}
