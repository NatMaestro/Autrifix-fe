"use client";

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useMemo } from "react";

import { GOOGLE_MAPS_KEY } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { MapFallback } from "./map-fallback";

const containerStyle = { width: "100%", height: "100%" };

type Props = {
  center: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  markers?: { id: string; lat: number; lng: number; label?: string }[];
  showUser?: boolean;
  children?: React.ReactNode;
};

export function AutriMap(props: Props) {
  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className={cn("relative h-full min-h-[320px] w-full", props.className)}>
        <MapFallback />
        {props.children}
      </div>
    );
  }
  return <GoogleMapInner {...props} />;
}

function GoogleMapInner({
  center,
  zoom = 13,
  className,
  markers = [],
  showUser = true,
  children,
}: Props) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "autrifix-map",
    googleMapsApiKey: GOOGLE_MAPS_KEY,
  });

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#0b1f3a" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0b1f3a" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8ec5ff" }] },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#1a3357" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#071525" }],
        },
      ],
    }),
    [],
  );

  if (loadError || !isLoaded) {
    return (
      <div className={cn("relative h-full min-h-[320px] w-full", className)}>
        {loadError ? <MapFallback /> : <div className="h-full bg-[#0B1F3A]/80" />}
        {children}
      </div>
    );
  }

  return (
    <div className={cn("relative h-full min-h-[320px] w-full", className)}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        options={mapOptions}
      >
        {showUser && (
          <Marker
            position={center}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#00E676",
              fillOpacity: 1,
              strokeColor: "#0B1F3A",
              strokeWeight: 3,
            }}
          />
        )}
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={{ lat: m.lat, lng: m.lng }}
            title={m.label}
          />
        ))}
      </GoogleMap>
      {children}
    </div>
  );
}
