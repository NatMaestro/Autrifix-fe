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
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, []);

  useEffect(() => {
    request();
  }, [request]);

  return { geo: state, refresh: request };
}
