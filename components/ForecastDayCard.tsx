import { View, Text } from "react-native";
import { DayForecast, AllergenLevel } from "@/services/types";

const LEVEL_ORDER: Record<AllergenLevel, number> = {
  none: 0, low: 1, medium: 2, high: 3, extreme: 4,
};

function overallLevel(forecast: DayForecast): AllergenLevel {
  if (forecast.allergens.length === 0) return "none";
  return forecast.allergens.reduce<AllergenLevel>(
    (max, a) => (LEVEL_ORDER[a.level] > LEVEL_ORDER[max] ? a.level : max),
    "none"
  );
}

const LEVEL_BG: Record<AllergenLevel, string> = {
  none: "bg-gray-100 dark:bg-gray-800",
  low: "bg-green-100 dark:bg-green-900",
  medium: "bg-yellow-100 dark:bg-yellow-900",
  high: "bg-orange-100 dark:bg-orange-900",
  extreme: "bg-red-100 dark:bg-red-900",
};

const LEVEL_TEXT: Record<AllergenLevel, string> = {
  none: "text-gray-500",
  low: "text-green-700 dark:text-green-300",
  medium: "text-yellow-700 dark:text-yellow-300",
  high: "text-orange-700 dark:text-orange-300",
  extreme: "text-red-700 dark:text-red-300",
};

const LEVEL_DOT: Record<AllergenLevel, string> = {
  none: "bg-gray-300",
  low: "bg-green-400",
  medium: "bg-yellow-400",
  high: "bg-orange-400",
  extreme: "bg-red-500",
};

const LEVEL_LABEL: Record<AllergenLevel, string> = {
  none: "Clear",
  low: "Low",
  medium: "Moderate",
  high: "High",
  extreme: "Extreme",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseDate(dateStr: string): Date {
  // Parse YYYY-MM-DD without timezone shift
  return new Date(dateStr + "T12:00:00");
}

function formatDay(dateStr: string): { dayName: string; dayNum: string; month: string } {
  const d = parseDate(dateStr);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  return {
    dayName: isToday ? "Today" : DAY_NAMES[d.getDay()],
    dayNum: String(d.getDate()),
    month: MONTH_NAMES[d.getMonth()],
  };
}

type Props = { forecast: DayForecast; highlighted?: boolean };

export default function ForecastDayCard({ forecast, highlighted }: Props) {
  const level = overallLevel(forecast);
  const { dayName, dayNum, month } = formatDay(forecast.date);
  const topAllergens = forecast.allergens
    .filter((a) => a.level !== "none")
    .sort((a, b) => LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level])
    .slice(0, 3);

  return (
    <View
      className={`flex-row items-center rounded-2xl p-4 mb-3 ${
        highlighted
          ? "border-2 border-blue-400 bg-blue-50 dark:bg-blue-950"
          : "bg-white dark:bg-gray-800"
      }`}
    >
      {/* Date column */}
      <View className="w-14 items-center mr-4">
        <Text className="text-xs font-semibold text-gray-400">{dayName}</Text>
        <Text className="text-2xl font-bold text-gray-800 dark:text-white leading-tight">
          {dayNum}
        </Text>
        <Text className="text-xs text-gray-400">{month}</Text>
      </View>

      {/* Level indicator */}
      <View className="mr-4 items-center">
        <View className={`w-3 h-3 rounded-full ${LEVEL_DOT[level]} mb-1`} />
        <View className={`px-2 py-0.5 rounded-full ${LEVEL_BG[level]}`}>
          <Text className={`text-xs font-semibold ${LEVEL_TEXT[level]}`}>
            {LEVEL_LABEL[level]}
          </Text>
        </View>
      </View>

      {/* Top allergens */}
      <View className="flex-1">
        {topAllergens.length > 0 ? (
          topAllergens.map((a) => (
            <View key={a.name} className="flex-row items-center mb-0.5">
              <View className={`w-2 h-2 rounded-full mr-2 ${LEVEL_DOT[a.level]}`} />
              <Text className="text-sm text-gray-600 dark:text-gray-300">
                {a.name}
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-sm text-gray-400">No significant pollen</Text>
        )}
      </View>
    </View>
  );
}
