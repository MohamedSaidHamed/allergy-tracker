import { View, Text } from "react-native";
import { AllergenData, AllergenLevel } from "@/services/types";

const LEVEL_BAR_WIDTH: Record<AllergenLevel, string> = {
  none: "w-0",
  low: "w-1/4",
  medium: "w-2/4",
  high: "w-3/4",
  extreme: "w-full",
};

const LEVEL_BAR_COLOR: Record<AllergenLevel, string> = {
  none: "bg-gray-200",
  low: "bg-green-400",
  medium: "bg-yellow-400",
  high: "bg-orange-400",
  extreme: "bg-red-500",
};

const LEVEL_BADGE_BG: Record<AllergenLevel, string> = {
  none: "bg-gray-100 dark:bg-gray-800",
  low: "bg-green-100 dark:bg-green-900",
  medium: "bg-yellow-100 dark:bg-yellow-900",
  high: "bg-orange-100 dark:bg-orange-900",
  extreme: "bg-red-100 dark:bg-red-900",
};

const LEVEL_BADGE_TEXT: Record<AllergenLevel, string> = {
  none: "text-gray-500",
  low: "text-green-700 dark:text-green-300",
  medium: "text-yellow-700 dark:text-yellow-300",
  high: "text-orange-700 dark:text-orange-300",
  extreme: "text-red-700 dark:text-red-300",
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type Props = { allergen: AllergenData };

export default function AllergenRow({ allergen }: Props) {
  const concLabel = allergen.concentration != null
    ? `, ${allergen.concentration.toFixed(0)} grains per cubic metre`
    : "";
  return (
    <View
      className="mb-3"
      accessible
      accessibilityLabel={`${allergen.name}: ${capitalize(allergen.level)} pollen level${concLabel}`}
      accessibilityRole="text"
    >
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {allergen.name}
        </Text>
        <View className={`px-2 py-0.5 rounded-full ${LEVEL_BADGE_BG[allergen.level]}`}>
          <Text className={`text-xs font-semibold ${LEVEL_BADGE_TEXT[allergen.level]}`}>
            {capitalize(allergen.level)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <View
          className={`h-full rounded-full ${LEVEL_BAR_COLOR[allergen.level]} ${LEVEL_BAR_WIDTH[allergen.level]}`}
        />
      </View>

      {allergen.concentration != null && (
        <Text className="text-xs text-gray-400 mt-0.5">
          {allergen.concentration.toFixed(0)} grains/m³
        </Text>
      )}
    </View>
  );
}
