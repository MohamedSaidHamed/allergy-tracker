import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import {
  searchLocations,
  GeocodeSuggestion,
  SavedLocation,
} from "@/services/locationService";

type Props = {
  onSelect: (location: SavedLocation) => void;
  onDismiss: () => void;
  onUseGPS: () => void;
};

export default function LocationSearch({ onSelect, onDismiss, onUseGPS }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchLocations(text);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const handleSelect = useCallback(
    (suggestion: GeocodeSuggestion) => {
      const parts = suggestion.displayName.split(",");
      const city = parts[0]?.trim();
      const region = parts[1]?.trim();
      const country = parts[parts.length - 1]?.trim();
      onSelect({
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        city,
        region,
        country,
      });
    },
    [onSelect]
  );

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 px-4 pt-6">
      <View className="flex-row items-center mb-4">
        <Text className="text-xl font-bold text-gray-800 dark:text-white flex-1">
          Search Location
        </Text>
        <TouchableOpacity
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Cancel location search"
        >
          <Text className="text-blue-500 font-semibold text-base">Cancel</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 mb-3">
        <TextInput
          className="flex-1 text-base text-gray-800 dark:text-white"
          placeholder="Type a city or region..."
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={handleChangeText}
          autoFocus
          returnKeyType="search"
          accessibilityLabel="Search for a location"
          accessibilityHint="Type a city or region name to search"
        />
        {searching && <ActivityIndicator size="small" color="#3b82f6" />}
      </View>

      <TouchableOpacity
        className="flex-row items-center py-4 border-b border-gray-100 dark:border-gray-800 mb-1"
        onPress={onUseGPS}
        accessibilityRole="button"
        accessibilityLabel="Use current GPS location"
      >
        <Text className="text-blue-500 font-semibold text-base">
          Use current location
        </Text>
      </TouchableOpacity>

      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.placeId}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity
            className="py-4 border-b border-gray-100 dark:border-gray-800"
            onPress={() => handleSelect(item)}
            accessibilityRole="button"
            accessibilityLabel={`Select ${item.displayName}`}
          >
            <Text
              className="text-gray-800 dark:text-gray-100 text-base"
              numberOfLines={2}
            >
              {item.displayName}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.length >= 2 && !searching ? (
            <Text className="text-gray-400 text-center mt-8">
              No results found
            </Text>
          ) : null
        }
      />
    </View>
  );
}
