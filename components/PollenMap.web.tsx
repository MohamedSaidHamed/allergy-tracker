import { View, Text } from "react-native";
import { SavedLocation } from "@/services/locationService";
import { AllergenData } from "@/services/types";

type Props = {
  location: SavedLocation;
  allergens: AllergenData[];
};

export default function PollenMap({ location, allergens: _ }: Props) {
  const label = [location.city, location.region].filter(Boolean).join(", ") || "your location";

  return (
    <View className="flex-1 items-center justify-center bg-gray-100 dark:bg-gray-900 px-8">
      <Text className="text-4xl mb-4">🗺️</Text>
      <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 text-center mb-2">
        Map not available on web
      </Text>
      <Text className="text-sm text-gray-400 text-center">
        Showing pollen data for {label}. Open the app on your phone to view the interactive pollen map.
      </Text>
    </View>
  );
}
