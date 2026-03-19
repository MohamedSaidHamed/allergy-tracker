import AsyncStorage from "@react-native-async-storage/async-storage";
import { PollenSnapshot } from "./types";
import { fetchOpenMeteo, fetchOpenMeteoWeather } from "./adapters/openMeteoAdapter";
import { fetchGooglePollen } from "./adapters/googlePollenAdapter";
import { fetchOpenWeatherData } from "./adapters/openWeatherAdapter";
import Constants from "expo-constants";

// Re-export types for convenience
export type { PollenSnapshot, AllergenData, AllergenLevel, WeatherData, DayForecast } from "./types";

const CACHE_KEY_PREFIX = "pollen_cache_";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function cacheKey(lat: number, lon: number): string {
  return `${CACHE_KEY_PREFIX}${lat.toFixed(2)}_${lon.toFixed(2)}`;
}

type CachedEntry = {
  snapshot: PollenSnapshot;
  cachedAt: number;
};

async function readCache(lat: number, lon: number): Promise<PollenSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(lat, lon));
    if (!raw) return null;
    const entry: CachedEntry = JSON.parse(raw);
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) return null;
    return entry.snapshot;
  } catch {
    return null;
  }
}

async function writeCache(lat: number, lon: number, snapshot: PollenSnapshot): Promise<void> {
  try {
    const entry: CachedEntry = { snapshot, cachedAt: Date.now() };
    await AsyncStorage.setItem(cacheKey(lat, lon), JSON.stringify(entry));
  } catch {
    // Non-critical — swallow cache write errors
  }
}

async function readStaleCache(lat: number, lon: number): Promise<PollenSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(lat, lon));
    if (!raw) return null;
    const entry: CachedEntry = JSON.parse(raw);
    return entry.snapshot;
  } catch {
    return null;
  }
}

function getApiKeys(): { google?: string; openWeather?: string } {
  const extra = Constants.expoConfig?.extra ?? {};
  return {
    google: extra.GOOGLE_POLLEN_API_KEY as string | undefined,
    openWeather: extra.OPEN_WEATHER_API_KEY as string | undefined,
  };
}

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 800
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

/**
 * Merges a weather-only result into a pollen snapshot.
 */
function mergeWeather(snapshot: PollenSnapshot, weather: object): PollenSnapshot {
  return { ...snapshot, weather: weather as PollenSnapshot["weather"] };
}

/**
 * Fetches pollen data using a priority fallback chain:
 * 1. Google Pollen API (if key available)
 * 2. Open-Meteo Air Quality (free, no key)
 * 3. OpenWeatherMap (if key available)
 * Falls back to stale cache on full failure.
 */
export async function fetchPollenData(
  latitude: number,
  longitude: number,
  forceRefresh = false
): Promise<PollenSnapshot> {
  if (!forceRefresh) {
    const cached = await readCache(latitude, longitude);
    if (cached) return cached;
  }

  const keys = getApiKeys();
  let snapshot: PollenSnapshot | null = null;

  // 1. Google Pollen (best data quality when key is available)
  if (keys.google && !snapshot) {
    try {
      snapshot = await fetchWithRetry(() =>
        fetchGooglePollen(latitude, longitude, keys.google!)
      );
    } catch (e) {
      console.warn("[PollenService] Google Pollen failed:", e);
    }
  }

  // 2. Open-Meteo (free, no key required — primary fallback)
  if (!snapshot) {
    try {
      snapshot = await fetchWithRetry(() => fetchOpenMeteo(latitude, longitude));
    } catch (e) {
      console.warn("[PollenService] Open-Meteo failed:", e);
    }
  }

  // 3. OpenWeatherMap (key required, air quality only)
  if (!snapshot && keys.openWeather) {
    try {
      const { weather, allergens } = await fetchWithRetry(() =>
        fetchOpenWeatherData(latitude, longitude, keys.openWeather!)
      );
      snapshot = {
        location: { latitude, longitude },
        fetchedAt: new Date().toISOString(),
        allergens,
        weather,
        forecast: [],
        source: "OpenWeatherMap",
      };
    } catch (e) {
      console.warn("[PollenService] OpenWeatherMap failed:", e);
    }
  }

  // Weather enrichment: always try to get weather from Open-Meteo if missing
  if (snapshot && !snapshot.weather) {
    try {
      const weather = await fetchOpenMeteoWeather(latitude, longitude);
      snapshot = mergeWeather(snapshot, weather);
    } catch {
      // Weather is supplemental — ignore failure
    }
  }

  // Weather enrichment via OpenWeatherMap if key present and weather still missing
  if (snapshot && !snapshot.weather && keys.openWeather) {
    try {
      const { weather } = await fetchOpenWeatherData(
        latitude,
        longitude,
        keys.openWeather
      );
      snapshot = mergeWeather(snapshot, weather);
    } catch {
      // Supplemental — ignore
    }
  }

  if (snapshot) {
    await writeCache(latitude, longitude, snapshot);
    return snapshot;
  }

  // All sources failed — return stale cache if available
  const stale = await readStaleCache(latitude, longitude);
  if (stale) {
    console.warn("[PollenService] All sources failed, serving stale cache");
    return { ...stale, source: `${stale.source} (cached)` };
  }

  throw new Error("Unable to fetch pollen data and no cached data available.");
}

export async function clearPollenCache(latitude: number, longitude: number): Promise<void> {
  await AsyncStorage.removeItem(cacheKey(latitude, longitude));
}
