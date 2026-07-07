/**
 * Care scheduling — combines a species' base care_profile with live
 * location/weather/season data to compute next-water and next-feed dates.
 * Re-run this (e.g. via recomputeScheduleForPlant) periodically — not just
 * once at save time — so schedules stay adjusted as season/conditions change.
 * See SPEC.md section 2 for the requirement this implements.
 */
import type { CareProfile } from "@shared/schema";
import { getWeatherSnapshot, type WeatherSnapshot } from "./weather";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ScheduleResult {
  nextWaterDate: number; // epoch ms
  nextFeedDate: number | null; // null = skip feeding entirely this cycle (dormant, no dormant interval)
  weatherUsed: WeatherSnapshot;
}

/**
 * Adjusts a base [min,max] watering interval using humidity/temperature/season:
 * - Higher humidity or winter dormancy -> lengthen interval (water less often)
 * - Hot/dry or active growing season -> shorten interval (water more often)
 */
function adjustWaterIntervalDays(profile: CareProfile, weather: WeatherSnapshot): number {
  const base = (profile.waterIntervalDaysMin + profile.waterIntervalDaysMax) / 2;
  let multiplier = 1;

  if (weather.isDormantSeason) multiplier += 0.35; // water less often in winter dormancy
  if (weather.season === "summer") multiplier -= 0.15; // water more often in hot growing season

  if (weather.humidityPct >= 60) multiplier += 0.1; // humid air = slower soil drying
  else if (weather.humidityPct <= 30) multiplier -= 0.15; // dry air = faster soil drying

  if (weather.temperatureF >= 85) multiplier -= 0.15; // hot = faster drying
  else if (weather.temperatureF <= 55) multiplier += 0.2; // cold = slower drying, less uptake

  const adjusted = base * Math.max(0.5, multiplier);
  return Math.round(Math.max(2, adjusted));
}

function feedIntervalDays(profile: CareProfile, weather: WeatherSnapshot): number | null {
  if (weather.isDormantSeason) {
    return profile.feedIntervalDaysDormant; // may be null -> skip feeding
  }
  return profile.feedIntervalDaysActive;
}

export async function computeSchedule(
  profile: CareProfile,
  lat: number | null,
  lon: number | null,
  from: Date = new Date()
): Promise<ScheduleResult> {
  const weather = lat != null && lon != null
    ? await getWeatherSnapshot(lat, lon)
    : { temperatureF: 70, humidityPct: 40, season: "spring" as const, isDormantSeason: false };

  const waterDays = adjustWaterIntervalDays(profile, weather);
  const feedDays = feedIntervalDays(profile, weather);

  return {
    nextWaterDate: from.getTime() + waterDays * DAY_MS,
    nextFeedDate: feedDays != null ? from.getTime() + feedDays * DAY_MS : null,
    weatherUsed: weather,
  };
}
