import { AllergenData, AllergenLevel, PollenSnapshot, WeatherData } from "../types";

const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const AIR_URL = "https://api.openweathermap.org/data/2.5/air_pollution";

// AQI index to allergen-style level
function aqiToLevel(aqi: number): AllergenLevel {
  if (aqi <= 1) return "low";
  if (aqi <= 2) return "medium";
  if (aqi <= 3) return "high";
  if (aqi <= 4) return "high";
  return "extreme";
}

type OWMWeatherResponse = {
  main?: { temp?: number; humidity?: number };
  wind?: { speed?: number; deg?: number };
  weather?: { description?: string }[];
};

type OWMAirResponse = {
  list?: {
    main?: { aqi?: number };
    components?: {
      pm2_5?: number;
      pm10?: number;
      no2?: number;
      o3?: number;
    };
  }[];
};

export async function fetchOpenWeatherData(
  latitude: number,
  longitude: number,
  apiKey: string
): Promise<{ weather: WeatherData; allergens: AllergenData[] }> {
  const [weatherRes, airRes] = await Promise.allSettled([
    fetch(
      `${WEATHER_URL}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
    ),
    fetch(`${AIR_URL}?lat=${latitude}&lon=${longitude}&appid=${apiKey}`),
  ]);

  let weather: WeatherData = {};
  if (weatherRes.status === "fulfilled" && weatherRes.value.ok) {
    const json: OWMWeatherResponse = await weatherRes.value.json();
    weather = {
      temperature: json.main?.temp,
      humidity: json.main?.humidity,
      windSpeed: json.wind?.speed != null ? json.wind.speed * 3.6 : undefined, // m/s → km/h
      windDirection: json.wind?.deg,
      description: json.weather?.[0]?.description,
    };
  }

  const allergens: AllergenData[] = [];
  if (airRes.status === "fulfilled" && airRes.value.ok) {
    const json: OWMAirResponse = await airRes.value.json();
    const aqi = json.list?.[0]?.main?.aqi;
    if (aqi != null) {
      allergens.push({ name: "Air Quality", level: aqiToLevel(aqi) });
    }
  }

  return { weather, allergens };
}

export async function buildOpenWeatherSnapshot(
  latitude: number,
  longitude: number,
  apiKey: string
): Promise<PollenSnapshot> {
  const { weather, allergens } = await fetchOpenWeatherData(latitude, longitude, apiKey);
  return {
    location: { latitude, longitude },
    fetchedAt: new Date().toISOString(),
    allergens,
    weather,
    forecast: [],
    source: "OpenWeatherMap",
  };
}
