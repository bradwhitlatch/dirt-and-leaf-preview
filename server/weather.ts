/**
 * Open-Meteo integration (https://open-meteo.com/) — free, no API key required.
 * Used to fetch current conditions + a short forecast for a lat/lon so care
 * schedules can be adjusted for season/humidity/temperature per SPEC section 2.
 */

export interface WeatherSnapshot {
  temperatureF: number;
  humidityPct: number;
  season: "winter" | "spring" | "summer" | "fall";
  isDormantSeason: boolean; // true in winter for most common houseplants
}

function seasonForLatitudeAndDate(lat: number, date: Date): WeatherSnapshot["season"] {
  const month = date.getUTCMonth(); // 0-11
  // Meteorological seasons, Northern Hemisphere by default.
  const northernSeasons: WeatherSnapshot["season"][] = [
    "winter", "winter", "spring", "spring", "spring", "summer",
    "summer", "summer", "fall", "fall", "fall", "winter",
  ];
  const isSouthern = lat < 0;
  const idx = month;
  const season = northernSeasons[idx];
  if (!isSouthern) return season;
  // Flip for southern hemisphere.
  const flip: Record<WeatherSnapshot["season"], WeatherSnapshot["season"]> = {
    winter: "summer", summer: "winter", spring: "fall", fall: "spring",
  };
  return flip[season];
}

export async function getWeatherSnapshot(lat: number, lon: number): Promise<WeatherSnapshot> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m&temperature_unit=fahrenheit`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo error ${res.status}`);
    const data = await res.json();
    const temperatureF = data.current?.temperature_2m ?? 70;
    const humidityPct = data.current?.relative_humidity_2m ?? 40;
    const season = seasonForLatitudeAndDate(lat, new Date());
    return {
      temperatureF,
      humidityPct,
      season,
      isDormantSeason: season === "winter",
    };
  } catch (err) {
    console.error("[weather] Open-Meteo call failed, using seasonal-only fallback:", err);
    const season = seasonForLatitudeAndDate(lat, new Date());
    return { temperatureF: 70, humidityPct: 40, season, isDormantSeason: season === "winter" };
  }
}

/** Reverse geocode via Open-Meteo's free geocoding API (no key) for a human-readable label. */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}`;
    // Open-Meteo geocoding is forward-only; for reverse we use Nominatim (OSM) with a descriptive UA.
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(nominatimUrl, {
      headers: { "User-Agent": "DirtAndLeafApp/1.0 (houseplant care app)" },
    });
    if (!res.ok) throw new Error(`Nominatim error ${res.status}`);
    const data = await res.json();
    const addr = data.address ?? {};
    const city = addr.city || addr.town || addr.village || addr.county;
    const region = addr.state;
    return [city, region].filter(Boolean).join(", ") || data.display_name || "Unknown location";
  } catch (err) {
    console.error("[weather] reverse geocode failed:", err);
    return "Unknown location";
  }
}

/**
 * Approximate USDA hardiness zone lookup.
 * There is no free official USDA API; this uses a coarse latitude-band
 * approximation for the continental US as a reasonable placeholder.
 * TODO(research): replace with a proper zip/lat-lon -> zone lookup table
 * sourced from the USDA Plant Hardiness Zone Map (https://planthardiness.ars.usda.gov/)
 * for production accuracy.
 */
export function approximateHardinessZone(lat: number): string {
  if (lat >= 47) return "4b-5a";
  if (lat >= 43) return "5b-6a";
  if (lat >= 39) return "6b-7a";
  if (lat >= 35) return "7b-8a";
  if (lat >= 31) return "8b-9a";
  if (lat >= 27) return "9b-10a";
  return "10b-11";
}
