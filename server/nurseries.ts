/**
 * Nearby plant nursery lookup via OpenStreetMap Overpass API (free, no key).
 * Searches for shop=garden_centre within a radius (meters) of a lat/lon.
 * Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
 */

export interface NurseryResult {
  name: string;
  lat: number;
  lon: number;
  distanceMiles: number;
  address?: string;
}

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const MILES_TO_METERS = 1609.34;

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export async function findNearbyNurseries(
  lat: number,
  lon: number,
  radiusMiles = 15
): Promise<NurseryResult[]> {
  const radiusMeters = Math.round(radiusMiles * MILES_TO_METERS);
  const query = `
    [out:json][timeout:15];
    (
      node["shop"="garden_centre"](around:${radiusMeters},${lat},${lon});
      way["shop"="garden_centre"](around:${radiusMeters},${lat},${lon});
      node["shop"="florist"]["plant"="yes"](around:${radiusMeters},${lat},${lon});
    );
    out center 20;
  `;
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: query,
    });
    if (!res.ok) throw new Error(`Overpass error ${res.status}`);
    const data = await res.json();
    const elements = data.elements ?? [];
    const results: NurseryResult[] = elements
      .map((el: any) => {
        const elLat = el.lat ?? el.center?.lat;
        const elLon = el.lon ?? el.center?.lon;
        if (elLat == null || elLon == null) return null;
        const name = el.tags?.name ?? "Local plant nursery";
        const addr = [el.tags?.["addr:housenumber"], el.tags?.["addr:street"], el.tags?.["addr:city"]]
          .filter(Boolean)
          .join(" ");
        return {
          name,
          lat: elLat,
          lon: elLon,
          distanceMiles: Math.round(haversineMiles(lat, lon, elLat, elLon) * 10) / 10,
          address: addr || undefined,
        };
      })
      .filter(Boolean) as NurseryResult[];
    return results.sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, 10);
  } catch (err) {
    console.error("[nurseries] Overpass lookup failed:", err);
    return [];
  }
}
