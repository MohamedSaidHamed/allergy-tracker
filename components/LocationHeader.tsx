import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import Svg, { Path } from "react-native-svg";
import { SavedLocation } from "@/services/locationService";

function PinIcon({ color = "#3b82f6" }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill={color}
      />
      <Path
        d="M12 11.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
        fill="white"
      />
    </Svg>
  );
}

function ChevronIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke="#9ca3af"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function formatLocation(location: SavedLocation | null): string {
  if (!location) return "Unknown location";
  const parts = [location.city, location.region].filter(Boolean);
  return parts.length > 0
    ? parts.join(", ")
    : `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;
}

type Props = {
  location: SavedLocation | null;
  loading: boolean;
  onPressSearch: () => void;
};

export default function LocationHeader({ location, loading, onPressSearch }: Props) {
  const locationLabel = formatLocation(location);
  return (
    <TouchableOpacity
      className="flex-row items-center bg-blue-50 dark:bg-blue-950 rounded-2xl px-4 py-3 mb-5"
      onPress={onPressSearch}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Current location: ${locationLabel}. Tap to search for a different location.`}
      accessibilityHint="Opens location search"
    >
      <View accessible={false}>
        <PinIcon />
      </View>
      <View className="flex-1 ml-2" accessible={false}>
        <Text className="text-xs text-blue-400 font-medium">Your location</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#3b82f6" style={{ alignSelf: "flex-start" }} accessibilityLabel="Detecting location" />
        ) : (
          <Text className="text-base font-bold text-gray-800 dark:text-white" numberOfLines={1}>
            {locationLabel}
          </Text>
        )}
      </View>
      <View accessible={false}>
        <ChevronIcon />
      </View>
    </TouchableOpacity>
  );
}
