export type AllergenLevel = "none" | "low" | "medium" | "high" | "extreme";

export type AllergenData = {
  name: string;
  level: AllergenLevel;
  concentration?: number; // grains/m³ or equivalent
};

export type WeatherData = {
  temperature?: number; // °C
  humidity?: number; // %
  windSpeed?: number; // km/h
  windDirection?: number; // degrees
  description?: string;
};

export type DayForecast = {
  date: string; // ISO date string YYYY-MM-DD
  allergens: AllergenData[];
  weather?: WeatherData;
};

export type PollenSnapshot = {
  location: { latitude: number; longitude: number };
  fetchedAt: string; // ISO timestamp
  allergens: AllergenData[];
  weather?: WeatherData;
  forecast: DayForecast[]; // next N days
  source: string;
};
