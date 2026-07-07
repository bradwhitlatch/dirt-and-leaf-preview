import { useEffect, useState } from "react";

export interface GeoState {
  lat: number | null;
  lon: number | null;
  status: "idle" | "loading" | "granted" | "denied" | "unsupported";
}

/**
 * One-shot browser geolocation lookup. Location powers weather-adjusted
 * care schedules (server/weather.ts + server/care-scheduling.ts) and the
 * "nearby nurseries" shop screen (server/nurseries.ts). Falls back
 * gracefully — never blocks the rest of the app if permission is denied.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ lat: null, lon: null, status: "idle" });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState((s) => ({ ...s, status: "unsupported" }));
      return;
    }
    setState((s) => ({ ...s, status: "loading" }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({ lat: pos.coords.latitude, lon: pos.coords.longitude, status: "granted" });
      },
      () => {
        // Fallback: St. George, UT-ish default so care schedules still have
        // something reasonable to compute against in denied/blocked contexts.
        setState({ lat: 37.1041, lon: -113.5841, status: "denied" });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  }, []);

  return state;
}
