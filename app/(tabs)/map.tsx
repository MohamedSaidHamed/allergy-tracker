import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import { useLocation } from "@/hooks/useLocation";
import { usePollenData } from "@/hooks/usePollenData";
import PollenMap from "@/components/PollenMap";
import { AllergenLevel } from "@/services/types";

const LEVEL_ORDER: Record<AllergenLevel, number> = {
  none: 0, low: 1, medium: 2, high: 3, extreme: 4,
};

const LEGEND_ITEMS: { level: AllergenLevel; color: string; label: string }[] = [
  { level: "low",     color: "#22c55e", label: "Low" },
  { level: "medium",  color: "#eab308", label: "Moderate" },
  { level: "high",    color: "#f97316", label: "High" },
  { level: "extreme", color: "#ef4444", label: "Extreme" },
];

function LocateIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={4} stroke="white" strokeWidth={2} />
      <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="white" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function overallLevel(levels: AllergenLevel[]): AllergenLevel {
  return levels.reduce<AllergenLevel>(
    (max, l) => (LEVEL_ORDER[l] > LEVEL_ORDER[max] ? l : max),
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

const LEVEL_LABEL: Record<AllergenLevel, string> = {
  none: "Clear", low: "Low", medium: "Moderate", high: "High", extreme: "Extreme",
};

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  android: { elevation: 4 },
  default: {},
});

export default function MapScreen() {
  const { location, loading: locationLoading, refresh: refreshLocation } = useLocation();
  const { data: pollenData, loading: pollenLoading } = usePollenData(location);
  const insets = useSafeAreaInsets();

  const allergens = pollenData?.allergens ?? [];
  const topLevel = overallLevel(allergens.map((a) => a.level));
  const isLoading = locationLoading || pollenLoading;

  // Bottom overlays sit 16px above where the tab bar ends
  const overlayBottom = insets.bottom + 16;

  return (
    <View style={{ flex: 1 }}>
      {/* Map fills the entire screen */}
      {location ? (
        <PollenMap location={location} allergens={allergens} />
      ) : (
        <View className="flex-1 items-center justify-center bg-gray-100 dark:bg-gray-900">
          {isLoading ? (
            <ActivityIndicator size="large" color="#3b82f6" />
          ) : (
            <Text className="text-gray-400 text-sm text-center px-8">
              Location unavailable.{"\n"}Enable location access to see the pollen map.
            </Text>
          )}
        </View>
      )}

      {/* Overlay: header bar — respects top safe area (notch / Dynamic Island / status bar) */}
      <SafeAreaView
        style={{ position: "absolute", top: 0, left: 0, right: 0 }}
        edges={["top"]}
        pointerEvents="box-none"
      >
        <View
          style={[
            {
              marginHorizontal: 16,
              marginTop: 8,
              backgroundColor: "white",
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: "row",
              alignItems: "center",
            },
            cardShadow,
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text className="text-base font-bold text-gray-900 dark:text-white">
              Pollen Map
            </Text>
            {location && (
              <Text className="text-xs text-gray-400" numberOfLines={1}>
                {[location.city, location.region].filter(Boolean).join(", ")}
              </Text>
            )}
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <View className={`px-3 py-1 rounded-full ${LEVEL_BG[topLevel]}`}>
              <Text className={`text-xs font-bold ${LEVEL_TEXT[topLevel]}`}>
                {LEVEL_LABEL[topLevel]}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Overlay: re-centre button — anchored above the tab bar */}
      {location && (
        <TouchableOpacity
          onPress={refreshLocation}
          accessibilityLabel="Re-centre map on your location"
          accessibilityRole="button"
          style={[
            {
              position: "absolute",
              bottom: overlayBottom,
              right: 20,
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "#3b82f6",
              alignItems: "center",
              justifyContent: "center",
            },
            cardShadow,
          ]}
        >
          <LocateIcon />
        </TouchableOpacity>
      )}

      {/* Overlay: legend — anchored above the tab bar */}
      <View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            bottom: overlayBottom,
            left: 20,
            backgroundColor: "white",
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
          },
          cardShadow,
        ]}
      >
        <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
          Pollen
        </Text>
        {LEGEND_ITEMS.map(({ level, color, label }) => (
          <View key={level} className="flex-row items-center mb-1">
            <View
              style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, opacity: 0.85, marginRight: 8 }}
            />
            <Text className="text-xs text-gray-600 dark:text-gray-300">{label}</Text>
          </View>
        ))}
      </View>

      {/* Hint toast */}
      {location && pollenData && (
        <View
          pointerEvents="none"
          style={{ position: "absolute", top: insets.top + 80, left: 0, right: 0, alignItems: "center" }}
        >
          <View style={{ backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
            <Text style={{ color: "white", fontSize: 12 }}>Tap the pin for allergen details</Text>
          </View>
        </View>
      )}
    </View>
  );
}
