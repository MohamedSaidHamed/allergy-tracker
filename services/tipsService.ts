import { AllergenData, AllergenLevel, PollenSnapshot } from "./types";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Tip = {
  id: string;
  title: string;
  body: string;
  urgency: "info" | "caution" | "warning";
};

const PREFERRED_ALLERGENS_KEY = "preferred_allergens";

// All known allergen types the user can track
export const ALL_ALLERGEN_OPTIONS = [
  "Grass",
  "Birch Tree",
  "Alder Tree",
  "Ragweed",
  "Mugwort",
  "Olive Tree",
  "Air Quality",
];

export async function getPreferredAllergens(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(PREFERRED_ALLERGENS_KEY);
    if (!raw) return ALL_ALLERGEN_OPTIONS; // default: track all
    return JSON.parse(raw) as string[];
  } catch {
    return ALL_ALLERGEN_OPTIONS;
  }
}

export async function setPreferredAllergens(allergens: string[]): Promise<void> {
  await AsyncStorage.setItem(PREFERRED_ALLERGENS_KEY, JSON.stringify(allergens));
}

// Per-allergen tip templates keyed by level
const ALLERGEN_TIPS: Record<
  string,
  Partial<Record<AllergenLevel, { title: string; body: string }>>
> = {
  Grass: {
    low: {
      title: "Grass pollen is low",
      body: "Good day for outdoor activities. Pollen levels are manageable.",
    },
    medium: {
      title: "Moderate grass pollen",
      body: "Grass pollen peaks between 11 AM–3 PM. Consider limiting yard work.",
    },
    high: {
      title: "High grass pollen",
      body: "Avoid mowing and prolonged outdoor exposure. Shower after coming indoors to wash off pollen.",
    },
    extreme: {
      title: "Extreme grass pollen!",
      body: "Stay indoors during peak hours (10 AM–4 PM). Keep windows closed and use air purifiers.",
    },
  },
  "Birch Tree": {
    medium: {
      title: "Birch tree pollen rising",
      body: "Birch pollen peaks in spring mornings. Wear wraparound sunglasses outdoors.",
    },
    high: {
      title: "High birch pollen",
      body: "Birch is one of the most allergenic trees. Avoid parks with birch trees and keep windows closed.",
    },
    extreme: {
      title: "Extreme birch pollen!",
      body: "Stay indoors with windows closed. Consider wearing a face mask if you must go outside.",
    },
  },
  "Alder Tree": {
    high: {
      title: "High alder pollen",
      body: "Alder often triggers reactions in birch-allergic individuals. Limit outdoor time this morning.",
    },
    extreme: {
      title: "Extreme alder pollen!",
      body: "Alder pollen levels are dangerously high. Stay indoors and consult your doctor if symptoms worsen.",
    },
  },
  Ragweed: {
    low: {
      title: "Ragweed pollen is low",
      body: "Ragweed season is underway but levels are manageable today.",
    },
    medium: {
      title: "Moderate ragweed pollen",
      body: "Ragweed peaks between 10 AM–3 PM and on windy days. Pre-medicate if sensitive.",
    },
    high: {
      title: "High ragweed — take precautions",
      body: "Ragweed is a strong allergen. Avoid outdoor exercise and rinse your sinuses after outdoor activities.",
    },
    extreme: {
      title: "Extreme ragweed levels!",
      body: "Stay indoors 5–10 AM and 5–7 PM when ragweed peaks. Run HEPA air purifiers indoors.",
    },
  },
  Mugwort: {
    high: {
      title: "High mugwort pollen",
      body: "Mugwort season is here. Avoid rural areas and fields. Change clothes after being outdoors.",
    },
    extreme: {
      title: "Extreme mugwort pollen!",
      body: "Stay indoors. Mugwort can cross-react with certain foods — consult your allergist.",
    },
  },
  "Olive Tree": {
    high: {
      title: "High olive pollen",
      body: "Olive pollen can cause intense reactions. Avoid areas with olive trees and keep car vents closed.",
    },
    extreme: {
      title: "Extreme olive pollen!",
      body: "Olive pollen counts are very high. Use antihistamines proactively and stay indoors when possible.",
    },
  },
  "Air Quality": {
    medium: {
      title: "Moderate air quality",
      body: "Air quality is reduced today. Those with respiratory conditions should reduce outdoor exercise.",
    },
    high: {
      title: "Poor air quality",
      body: "Avoid strenuous outdoor exercise. Use air purifiers indoors and wear a mask if going out.",
    },
    extreme: {
      title: "Very poor air quality!",
      body: "Stay indoors with windows closed. Vulnerable groups should avoid all outdoor exposure.",
    },
  },
};

// General tips shown regardless of allergen type
const GENERAL_TIPS: Partial<Record<AllergenLevel, Tip>> = {
  high: {
    id: "general_high",
    title: "High pollen day",
    body: "Check pollen count before planning outdoor activities. Shower and change clothes after being outside.",
    urgency: "warning",
  },
  extreme: {
    id: "general_extreme",
    title: "Extreme pollen alert",
    body: "Keep windows closed, run air purifiers, and take any prescribed antihistamines before symptoms start.",
    urgency: "warning",
  },
};

const URGENCY_MAP: Record<AllergenLevel, Tip["urgency"]> = {
  none: "info",
  low: "info",
  medium: "caution",
  high: "warning",
  extreme: "warning",
};

const LEVEL_ORDER: Record<AllergenLevel, number> = {
  none: 0, low: 1, medium: 2, high: 3, extreme: 4,
};

function overallLevel(allergens: AllergenData[]): AllergenLevel {
  if (allergens.length === 0) return "none";
  return allergens.reduce<AllergenLevel>(
    (max, a) => (LEVEL_ORDER[a.level] > LEVEL_ORDER[max] ? a.level : max),
    "none"
  );
}

export function generateTips(
  snapshot: PollenSnapshot,
  preferredAllergens: string[]
): Tip[] {
  const tips: Tip[] = [];
  const seen = new Set<string>();

  const relevant = snapshot.allergens.filter(
    (a) => preferredAllergens.includes(a.name) && a.level !== "none"
  );

  for (const allergen of relevant) {
    const templates = ALLERGEN_TIPS[allergen.name];
    if (!templates) continue;

    // Find the highest matching level template
    const levels: AllergenLevel[] = ["extreme", "high", "medium", "low"];
    for (const lvl of levels) {
      if (LEVEL_ORDER[allergen.level] >= LEVEL_ORDER[lvl] && templates[lvl]) {
        const tpl = templates[lvl]!;
        const id = `${allergen.name}_${lvl}`;
        if (!seen.has(id)) {
          seen.add(id);
          tips.push({
            id,
            title: tpl.title,
            body: tpl.body,
            urgency: URGENCY_MAP[allergen.level],
          });
        }
        break;
      }
    }
  }

  // Add a general tip if overall level is high+
  const top = overallLevel(relevant);
  const general = GENERAL_TIPS[top];
  if (general && !seen.has(general.id)) {
    tips.unshift(general);
  }

  return tips;
}
