import { View, Text } from "react-native";
import Svg, { Rect, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { AllergenLevel } from "@/services/types";

const LEVELS: AllergenLevel[] = ["none", "low", "medium", "high", "extreme"];

const LEVEL_LABELS: Record<AllergenLevel, string> = {
  none: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
  extreme: "Extreme",
};

const LEVEL_INDEX: Record<AllergenLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  extreme: 4,
};

const GRADIENT_COLORS = ["#22c55e", "#86efac", "#facc15", "#f97316", "#ef4444"];

type Props = {
  level: AllergenLevel;
  label?: string;
};

export default function StrengthScale({ level, label }: Props) {
  const activeIndex = LEVEL_INDEX[level];
  const BAR_W = 280;
  const BAR_H = 14;
  const RADIUS = 7;
  const VPAD = RADIUS + 3; // vertical padding so the circle isn't clipped at the top

  // Indicator position (center of active segment)
  const segmentW = BAR_W / LEVELS.length;
  const indicatorX = segmentW * activeIndex + segmentW / 2;

  return (
    <View
      className="items-center w-full"
      accessible
      accessibilityLabel={`Pollen strength scale: ${LEVEL_LABELS[level]}`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 4, now: activeIndex, text: LEVEL_LABELS[level] }}
    >
      {label && (
        <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          {label}
        </Text>
      )}

      <Svg width={BAR_W} height={VPAD + BAR_H + 20} viewBox={`0 0 ${BAR_W} ${VPAD + BAR_H + 20}`} accessible={false}>
        <Defs>
          <LinearGradient id="scaleGrad" x1="0" y1="0" x2="1" y2="0">
            {GRADIENT_COLORS.map((color, i) => (
              <Stop
                key={i}
                offset={`${(i / (GRADIENT_COLORS.length - 1)) * 100}%`}
                stopColor={color}
              />
            ))}
          </LinearGradient>
        </Defs>

        {/* Background track */}
        <Rect
          x={0}
          y={VPAD}
          width={BAR_W}
          height={BAR_H}
          rx={RADIUS}
          fill="url(#scaleGrad)"
          opacity={0.25}
        />

        {/* Filled portion */}
        <Rect
          x={0}
          y={VPAD}
          width={indicatorX}
          height={BAR_H}
          rx={RADIUS}
          fill="url(#scaleGrad)"
          opacity={0.9}
        />

        {/* Indicator dot */}
        {level !== "none" && (
          <Circle
            cx={indicatorX}
            cy={VPAD + BAR_H / 2}
            r={RADIUS + 2}
            fill="white"
            stroke={GRADIENT_COLORS[activeIndex]}
            strokeWidth={2.5}
          />
        )}
      </Svg>

      {/* Tick labels */}
      <View className="flex-row justify-between w-full mt-1" style={{ width: BAR_W }}>
        {LEVELS.filter((l) => l !== "none").map((l) => (
          <Text
            key={l}
            className={`text-xs ${
              l === level
                ? "font-bold text-gray-800 dark:text-white"
                : "text-gray-400 dark:text-gray-600"
            }`}
          >
            {LEVEL_LABELS[l]}
          </Text>
        ))}
      </View>
    </View>
  );
}
