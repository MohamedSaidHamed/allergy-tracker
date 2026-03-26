import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocation } from "@/hooks/useLocation";
import { usePollenData } from "@/hooks/usePollenData";
import { useTips } from "@/hooks/useTips";
import LocationSearch from "@/components/LocationSearch";
import LocationHeader from "@/components/LocationHeader";
import StrengthScale from "@/components/StrengthScale";
import AllergenRow from "@/components/AllergenRow";
import WeatherWidget from "@/components/WeatherWidget";
import TipsCard from "@/components/TipsCard";
import { SavedLocation } from "@/services/locationService";
import { AllergenLevel } from "@/services/types";

const LEVEL_ORDER: Record<AllergenLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  extreme: 4,
};

function overallLevel(levels: AllergenLevel[]): AllergenLevel {
  if (levels.length === 0) return "none";
  return levels.reduce((max, l) =>
    LEVEL_ORDER[l] > LEVEL_ORDER[max] ? l : max
  );
}

const OVERALL_BG: Record<AllergenLevel, string> = {
  none: "bg-gray-50 dark:bg-gray-800",
  low: "bg-green-50 dark:bg-green-950",
  medium: "bg-yellow-50 dark:bg-yellow-950",
  high: "bg-orange-50 dark:bg-orange-950",
  extreme: "bg-red-50 dark:bg-red-950",
};

const OVERALL_HEADLINE: Record<AllergenLevel, string> = {
  none: "Air looks clear",
  low: "Low pollen today",
  medium: "Moderate pollen",
  high: "High pollen — take care",
  extreme: "Extreme pollen levels!",
};

const SEASON_LABEL: Record<number, string> = {
  0: "Winter", 1: "Winter",
  2: "Spring", 3: "Spring", 4: "Spring",
  5: "Summer", 6: "Summer", 7: "Summer",
  8: "Autumn", 9: "Autumn", 10: "Autumn",
  11: "Winter",
};

function currentSeason(): string {
  return SEASON_LABEL[new Date().getMonth()];
}

export default function DashboardScreen() {
  const {
    location,
    loading: locationLoading,
    error: locationError,
    permissions,
    refresh: refreshLocation,
    setLocation,
  } = useLocation();

  const {
    data: pollenData,
    loading: pollenLoading,
    error: pollenError,
    refresh: refreshPollen,
  } = usePollenData(location);

  const tips = useTips(pollenData);

  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleSelectLocation = (selected: SavedLocation) => {
    setLocation(selected);
    setShowSearch(false);
  };

  const handleUseGPS = () => {
    setShowSearch(false);
    refreshLocation();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([refreshLocation(), refreshPollen()]);
    setRefreshing(false);
  };

  const allergenLevels = pollenData?.allergens.map((a) => a.level) ?? [];
  const topLevel = overallLevel(allergenLevels);
  const isLoading = locationLoading || pollenLoading;
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />
        }
      >
        {/* App Header */}
        <View className="flex-row items-center justify-between mb-5">
          <View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              Allergy Tracker
            </Text>
            <Text className="text-sm text-gray-400">{currentSeason()} season</Text>
          </View>
          {isLoading && <ActivityIndicator size="small" color="#3b82f6" />}
        </View>

        {/* Location selector */}
        <LocationHeader
          location={location}
          loading={locationLoading}
          onPressSearch={() => setShowSearch(true)}
        />

        {/* Permission / Error banners */}
        {permissions?.foreground === false && (
          <View className="bg-red-50 dark:bg-red-950 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-600 dark:text-red-400 text-sm font-medium">
              Location access denied. Search manually or enable in Settings.
            </Text>
          </View>
        )}
        {(locationError || pollenError) && (
          <View className="bg-yellow-50 dark:bg-yellow-950 rounded-xl px-4 py-3 mb-4">
            <Text className="text-yellow-700 dark:text-yellow-300 text-sm">
              {locationError ?? pollenError}
            </Text>
          </View>
        )}

        {/* Overall Strength Card */}
        <View className={`rounded-2xl p-5 mb-4 ${OVERALL_BG[topLevel]}`}>
          <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Overall pollen risk
          </Text>
          <Text className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            {OVERALL_HEADLINE[topLevel]}
          </Text>
          <StrengthScale level={topLevel} />
        </View>

        {/* Top Allergens */}
        <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Top allergens
            </Text>
            {pollenData?.source && (
              <Text className="text-xs text-gray-400">via {pollenData.source}</Text>
            )}
          </View>

          {pollenLoading ? (
            <ActivityIndicator size="small" color="#f97316" />
          ) : pollenData?.allergens && pollenData.allergens.length > 0 ? (
            pollenData.allergens
              .slice()
              .sort((a, b) => LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level])
              .map((a) => <AllergenRow key={a.name} allergen={a} />)
          ) : pollenData ? (
            <View className="items-center py-4">
              <Text className="text-3xl mb-2">✓</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm text-center">
                No significant pollen detected in your area
              </Text>
            </View>
          ) : (
            <Text className="text-gray-400 text-sm">Fetching pollen data...</Text>
          )}
        </View>

        {/* Tips & Alerts */}
        <TipsCard tips={tips} />

        {/* Weather Widget */}
        {pollenData?.weather && (
          <View className="bg-sky-50 dark:bg-sky-950 rounded-2xl p-5 mb-4">
            <WeatherWidget weather={pollenData.weather} />
          </View>
        )}

        {/* Last updated */}
        {pollenData && (
          <Text className="text-xs text-gray-400 text-center mb-2">
            Updated {new Date(pollenData.fetchedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" · "}Pull down to refresh
          </Text>
        )}
      </ScrollView>

      {/* Manual Location Search Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearch(false)}
      >
        <LocationSearch
          onSelect={handleSelectLocation}
          onDismiss={() => setShowSearch(false)}
          onUseGPS={handleUseGPS}
        />
      </Modal>
    </SafeAreaView>
  );
}
