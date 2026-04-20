"use client";

import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Pane,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  ZoomControl,
} from "react-leaflet";
import { divIcon } from "leaflet";

type MarkerPoint = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  subtitle?: string;
  avatarUrl?: string;
};
type LatLng = { lat: number; lng: number };

type Props = {
  center: LatLng;
  zoom?: number;
  markers?: MarkerPoint[];
  showUser?: boolean;
  routePath?: LatLng[];
  useAutoRoute?: boolean;
  theme?: "light" | "dark";
};

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
const mapboxStyleLight = process.env.NEXT_PUBLIC_MAPBOX_STYLE_LIGHT?.trim() || "mapbox/streets-v12";
const mapboxStyleDark = process.env.NEXT_PUBLIC_MAPBOX_STYLE_DARK?.trim() || "mapbox/dark-v11";

const cartoTileLayerUrls = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
} as const;
const cartoAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO';
const mapboxAttribution =
  '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const mapPinIcon = divIcon({
  className: "autrifix-map-pin",
  html: `<img src="/icons/map-pin-red.svg" alt="" class="h-11 w-11" />`,
  iconSize: [44, 44],
  iconAnchor: [22, 42],
  tooltipAnchor: [0, -34],
});

function RecenterMapView({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom, { animate: true });
  }, [center.lat, center.lng, zoom, map]);
  return null;
}

export function LeafletMapInner({
  center,
  zoom = 13,
  markers = [],
  showUser = true,
  routePath = [],
  useAutoRoute = true,
  theme = "dark",
}: Props) {
  const [autoRoutePath, setAutoRoutePath] = useState<LatLng[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchAutoRoute() {
      if (!useAutoRoute || routePath.length > 1 || !markers[0]) {
        setAutoRoutePath([]);
        return;
      }

      const destination = markers[0];
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${center.lng},${center.lat};${destination.lng},${destination.lat}` +
        `?overview=full&geometries=geojson`;

      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const data = (await res.json()) as {
          routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
        };
        const points =
          data.routes?.[0]?.geometry?.coordinates?.map(([lng, lat]) => ({ lat, lng })) ?? [];
        if (!cancelled) setAutoRoutePath(points);
      } catch {
        if (!cancelled) setAutoRoutePath([]);
      }
    }

    void fetchAutoRoute();
    return () => {
      cancelled = true;
    };
  }, [center.lat, center.lng, markers, routePath.length, useAutoRoute]);

  const effectiveRoute = routePath.length > 1 ? routePath : autoRoutePath;
  const routeLine =
    effectiveRoute.length > 1
      ? effectiveRoute.map((pt) => [pt.lat, pt.lng] as [number, number])
      : [];
  const dark = theme === "dark";
  const tileUrl = mapboxToken
    ? `https://api.mapbox.com/styles/v1/${dark ? mapboxStyleDark : mapboxStyleLight}/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`
    : cartoTileLayerUrls[dark ? "dark" : "light"];
  const tileAttribution = mapboxToken ? mapboxAttribution : cartoAttribution;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      zoomControl={false}
      style={{ width: "100%", height: "100%", minHeight: "320px" }}
      className="leaflet-autrifix-map"
    >
      <RecenterMapView center={center} zoom={zoom} />
      <ZoomControl position="bottomright" />
      <TileLayer attribution={tileAttribution} url={tileUrl} tileSize={mapboxToken ? 512 : 256} zoomOffset={mapboxToken ? -1 : 0} />

      <Pane name="route" style={{ zIndex: 450 }}>
        {routeLine.length ? (
          <Polyline
            positions={routeLine}
            pathOptions={{
              color: "#00E676",
              weight: 4,
              opacity: 0.7,
              dashArray: "8 10",
            }}
          />
        ) : null}
      </Pane>

      {showUser ? (
        <CircleMarker
          center={[center.lat, center.lng]}
          radius={8}
          pathOptions={{
            color: dark ? "#b5c9ec" : "#0B1F3A",
            fillColor: dark ? "#b5c9ec" : "#60a5fa",
            fillOpacity: 1,
            weight: 3,
          }}
        >
          <Popup>You are here</Popup>
        </CircleMarker>
      ) : null}

      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={mapPinIcon}>
          {m.label ? (
            <Tooltip direction="top" offset={[0, -8]} opacity={1} className="!border-0 !bg-transparent !shadow-none" sticky>
              <div
                className={`min-w-[190px] rounded-xl px-3 py-2 shadow-xl backdrop-blur-xl ${
                  dark
                    ? "border border-white/10 bg-[#1c2b42]/95 text-white"
                    : "border border-slate-300/70 bg-white/95 text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      alt={m.label}
                      className="h-7 w-7 rounded-full border border-white/20 object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-semibold text-emerald-300">
                      {m.label.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <p className="text-sm font-semibold">{m.label}</p>
                </div>
                {m.subtitle ? (
                  <p className={`mt-1 text-xs ${dark ? "text-white/70" : "text-slate-600"}`}>{m.subtitle}</p>
                ) : null}
              </div>
            </Tooltip>
          ) : null}
          {m.label ? <Popup>{m.label}</Popup> : null}
        </Marker>
      ))}
    </MapContainer>
  );
}
