import { AllergenData, AllergenLevel, DayForecast, PollenSnapshot, WeatherData } from "../types";

const BASE_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

// Pollen concentration thresholds in grains/m³
function concentrationToLevel(value: number | null | undefined): AllergenLevel {
  if (value == null || value <= 0) return "none";
  if (value <= 30) return "low";
  if (value <= 80) return "medium";
  if (value <= 200) return "high";
  return "extreme";
}

type OpenMeteoResponse = {
  current?: Record<string, number | null>;
  hourly?: Record<string, (number | null)[]>;
  hourly_units?: Record<string, string>;
  current_units?: Record<string, string>;
};

const ALLERGEN_FIELDS = [
  { key: "grass_pollen", name: "Grass" },
  { key: "birch_pollen", name: "Birch Tree" },
  { key: "alder_pollen", name: "Alder Tree" },
  { key: "mugwort_pollen", name: "Mugwort" },
  { key: "ragweed_pollen", name: "Ragweed" },
  { key: "olive_pollen", name: "Olive Tree" },
];

function parseCurrentAllergens(current: Record<string, number | null>): AllergenData[] {
  return ALLERGEN_FIELDS
    .map(({ key, name }) => {
      const val = current[key] ?? null;
      return {
        name,
        level: concentrationToLevel(val),
        concentration: val ?? undefined,
      } as AllergenData;
    })
    .filter((a) => a.level !== "none");
}

function parseForecastDays(hourly: Record<string, (number | null)[]>): DayForecast[] {
  const times: string[] = (hourly["time"] as unknown as string[]) ?? [];
  const dayMap = new Map<string, Record<string, number[]>>();

  times.forEach((iso, idx) => {
    const date = iso.slice(0, 10);
    if (!dayMap.has(date)) dayMap.set(date, {});
    const day = dayMap.get(date)!;
    ALLERGEN_FIELDS.forEach(({ key }) => {
      const val = hourly[key]?.[idx];
      if (val != null && val > 0) {
        if (!day[key]) day[key] = [];
        day[key].push(val);
      }
    });
  });

  return Array.from(dayMap.entries())
    .slice(0, 7)
    .map(([date, dayData]) => {
      const allergens: AllergenData[] = ALLERGEN_FIELDS.map(({ key, name }) => {
        const vals = dayData[key] ?? [];
        const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        return { name, level: concentrationToLevel(avg), concentration: avg || undefined };
      }).filter((a) => a.level !== "none");
      return { date, allergens };
    });
}

// CAMS pollen model covers Europe only (approx. 35–72°N, 25°W–45°E)
function isInEurope(lat: number, lon: number): boolean {
  return lat >= 35 && lat <= 72 && lon >= -25 && lon <= 45;
}

export async function fetchOpenMeteo(
  latitude: number,
  longitude: number
): Promise<PollenSnapshot> {
  const pollenKeys = ALLERGEN_FIELDS.map((f) => f.key).join(",");

  // "time" must NOT appear in the hourly parameter — it is always returned automatically
  const hourlyFields = pollenKeys;

  // Only request pollen variables for European coordinates; elsewhere use AQI only
  const inEurope = isInEurope(latitude, longitude);

  const currentParam = inEurope
    ? `&current=${pollenKeys}`
    : "&current=european_aqi,us_aqi";

  const hourlyParam = inEurope
    ? `&hourly=${hourlyFields}&forecast_days=7`
    : "";

  const url =
    `${BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
    currentParam +
    hourlyParam +
    `&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Open-Meteo HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const json: OpenMeteoResponse = await res.json();

  const allergens = json.current ? parseCurrentAllergens(json.current) : [];
  const forecast = json.hourly ? parseForecastDays(json.hourly) : [];

  return {
    location: { latitude, longitude },
    fetchedAt: new Date().toISOString(),
    allergens,
    forecast,
    source: "Open-Meteo",
  };
}

// Lightweight current-weather fetch via open-meteo weather API (no key needed)
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

type OpenMeteoWeatherResponse = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    weather_code?: number;
  };
};

function weatherCodeDescription(code: number | undefined): string | undefined {
  if (code == null) return undefined;
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 49) return "Fog";
  if (code <= 69) return "Drizzle / Rain";
  if (code <= 79) return "Snow";
  if (code <= 99) return "Thunderstorm";
  return undefined;
}

export async function fetchOpenMeteoWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  const url =
    `${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code` +
    `&wind_speed_unit=kmh&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo weather HTTP ${res.status}`);
  const json: OpenMeteoWeatherResponse = await res.json();
  const c = json.current ?? {};
  return {
    temperature: c.temperature_2m,
    humidity: c.relative_humidity_2m,
    windSpeed: c.wind_speed_10m,
    windDirection: c.wind_direction_10m,
    description: weatherCodeDescription(c.weather_code),
  };
}
