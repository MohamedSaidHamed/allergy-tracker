import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { useLocation } from "@/hooks/useLocation";
import { usePollenData } from "@/hooks/usePollenData";
import ForecastDayCard from "@/components/ForecastDayCard";
import { AllergenLevel, DayForecast } from "@/services/types";

const LEVEL_ORDER: Record<AllergenLevel, number> = {
  none: 0, low: 1, medium: 2, high: 3, extreme: 4,
};

const LEVEL_DOT_COLOR: Record<AllergenLevel, string> = {
  none: "#d1d5db",
  low: "#4ade80",
  medium: "#facc15",
  high: "#fb923c",
  extreme: "#ef4444",
};

const LEVEL_SELECTED_BG: Record<AllergenLevel, string> = {
  none: "#6b7280",
  low: "#16a34a",
  medium: "#ca8a04",
  high: "#ea580c",
  extreme: "#dc2626",
};

function overallLevel(forecast: DayForecast): AllergenLevel {
  if (forecast.allergens.length === 0) return "none";
  return forecast.allergens.reduce<AllergenLevel>(
    (max, a) => (LEVEL_ORDER[a.level] > LEVEL_ORDER[max] ? a.level : max),
    "none"
  );
}

function formatLocation(
  city?: string,
  region?: string
): string {
  const parts = [city, region].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "your location";
}

type MarkedDates = Record<
  string,
  {
    dots?: { key: string; color: string }[];
    selected?: boolean;
    selectedColor?: string;
    marked?: boolean;
  }
>;

export default function ForecastScreen() {
  const { location } = useLocation();
  const { data: pollenData, loading, error, refresh } = usePollenData(location);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build calendar marked dates from forecast
  const markedDates: MarkedDates = useMemo(() => {
    const marks: MarkedDates = {};
    if (!pollenData?.forecast) return marks;

    for (const day of pollenData.forecast) {
      const level = overallLevel(day);
      marks[day.date] = {
        dots: [{ key: "pollen", color: LEVEL_DOT_COLOR[level] }],
      };
    }

    if (selectedDate) {
      const level = pollenData.forecast.find((d) => d.date === selectedDate)
        ? overallLevel(
            pollenData.forecast.find((d) => d.date === selectedDate)!
          )
        : "none";
      marks[selectedDate] = {
        ...(marks[selectedDate] ?? {}),
        selected: true,
        selectedColor: LEVEL_SELECTED_BG[level],
      };
    }

    return marks;
  }, [pollenData, selectedDate]);

  const selectedForecast = selectedDate
    ? pollenData?.forecast.find((d) => d.date === selectedDate) ?? null
    : null;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#3b82f6" />
        }
      >
        {/* Header */}
        <View className="px-5 pt-5 pb-3">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Forecast
          </Text>
          <Text className="text-sm text-gray-400 mt-0.5">
            Pollen outlook for{" "}
            {formatLocation(location?.city, location?.region)}
          </Text>
        </View>

        {/* Error */}
        {error && (
          <View className="mx-5 mb-3 bg-yellow-50 dark:bg-yellow-950 rounded-xl px-4 py-3">
            <Text className="text-yellow-700 dark:text-yellow-300 text-sm">{error}</Text>
          </View>
        )}

        {/* Calendar */}
        <View className="mx-5 mb-4 rounded-2xl overflow-hidden bg-white dark:bg-gray-800">
          <Calendar
            markingType="multi-dot"
            markedDates={markedDates}
            minDate={today}
            onDayPress={(day: DateData) => {
              setSelectedDate((prev) =>
                prev === day.dateString ? null : day.dateString
              );
            }}
            theme={{
              backgroundColor: "transparent",
              calendarBackground: "transparent",
              textSectionTitleColor: "#9ca3af",
              selectedDayBackgroundColor: "#3b82f6",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#3b82f6",
              dayTextColor: "#374151",
              textDisabledColor: "#d1d5db",
              arrowColor: "#3b82f6",
              monthTextColor: "#111827",
              indicatorColor: "#3b82f6",
            }}
          />

          {/* Legend */}
          <View className="flex-row justify-center gap-4 pb-3">
            {(["low", "medium", "high", "extreme"] as AllergenLevel[]).map((l) => (
              <View key={l} className="flex-row items-center gap-1">
                <View
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: LEVEL_DOT_COLOR[l] }}
                />
                <Text className="text-xs text-gray-400 capitalize">{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Selected day detail */}
        {selectedForecast && (
          <View className="px-5 mb-2">
            <Text className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">
              Selected day
            </Text>
            <ForecastDayCard forecast={selectedForecast} highlighted />
          </View>
        )}

        {/* 7-day list */}
        <View className="px-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {pollenData
                ? `${pollenData.forecast.length}-day outlook`
                : "Upcoming days"}
            </Text>
            {pollenData?.source && (
              <Text className="text-xs text-gray-400">via {pollenData.source}</Text>
            )}
          </View>

          {loading && !pollenData ? (
            <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
          ) : pollenData?.forecast && pollenData.forecast.length > 0 ? (
            pollenData.forecast.map((day) => (
              <ForecastDayCard
                key={day.date}
                forecast={day}
                highlighted={day.date === selectedDate}
              />
            ))
          ) : (
            <View className="items-center py-12">
              <Text className="text-4xl mb-3">🗓️</Text>
              <Text className="text-gray-400 text-sm text-center">
                {pollenData
                  ? "No forecast data available for this location."
                  : "Pull down to load forecast data."}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
