"use client";

import { useCallback, useEffect, useState } from "react";

export type GeoState =
  | { status: "idle" | "pending" }
  | { status: "ok"; lat: number; lng: number }
  | { status: "error"; message: string };

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: "idle" });

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        status: "error",
        message: "Geolocation not supported",
      });
      return;
    }
    setState({ status: "pending" });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: "ok",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () =>
        setState({
          status: "error",
          message: "Location permission denied",
        }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10_000 },
    );
  }, []);

  useEffect(() => {
    request();
  }, [request]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) =>
        setState({
          status: "ok",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => {},
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { geo: state, refresh: request };
}
