import { AllergenData, AllergenLevel, DayForecast, PollenSnapshot } from "../types";

const BASE_URL = "https://pollen.googleapis.com/v1/forecast:lookup";

type GooglePollenCategory = "NONE" | "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

function categoryToLevel(cat: GooglePollenCategory | undefined): AllergenLevel {
  switch (cat) {
    case "VERY_LOW":
    case "LOW":
      return "low";
    case "MEDIUM":
      return "medium";
    case "HIGH":
      return "high";
    case "VERY_HIGH":
      return "extreme";
    default:
      return "none";
  }
}

type GooglePollenType = {
  displayName?: string;
  indexInfo?: {
    category?: GooglePollenCategory;
    value?: number;
  };
};

type GooglePollenDay = {
  date?: { year: number; month: number; day: number };
  pollenTypeInfo?: GooglePollenType[];
};

type GooglePollenResponse = {
  dailyInfo?: GooglePollenDay[];
};

function parseGoogleDay(day: GooglePollenDay): { date: string; allergens: AllergenData[] } {
  const d = day.date;
  const date = d
    ? `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`
    : new Date().toISOString().slice(0, 10);

  const allergens: AllergenData[] = (day.pollenTypeInfo ?? [])
    .map((pt) => ({
      name: pt.displayName ?? "Unknown",
      level: categoryToLevel(pt.indexInfo?.category),
      concentration: pt.indexInfo?.value,
    }))
    .filter((a) => a.level !== "none");

  return { date, allergens };
}

export async function fetchGooglePollen(
  latitude: number,
  longitude: number,
  apiKey: string
): Promise<PollenSnapshot> {
  const url =
    `${BASE_URL}?key=${apiKey}` +
    `&location.latitude=${latitude}` +
    `&location.longitude=${longitude}` +
    `&days=7`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Pollen API HTTP ${res.status}`);
  const json: GooglePollenResponse = await res.json();

  const days = json.dailyInfo ?? [];
  const [today, ...rest] = days.map(parseGoogleDay);

  return {
    location: { latitude, longitude },
    fetchedAt: new Date().toISOString(),
    allergens: today?.allergens ?? [],
    forecast: rest.map((d) => ({ date: d.date, allergens: d.allergens })),
    source: "Google Pollen",
  };
}
