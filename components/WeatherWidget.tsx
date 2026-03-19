import { View, Text } from "react-native";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { WeatherData } from "@/services/types";

function ThermometerIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2a3 3 0 0 0-3 3v8.17A4 4 0 1 0 15 16V5a3 3 0 0 0-3-3z"
        stroke="#0ea5e9"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={17} r={2} fill="#0ea5e9" />
    </Svg>
  );
}

function DropletIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 2 5 10 5 14a7 7 0 0 0 14 0c0-4-7-12-7-12z"
        stroke="#3b82f6"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WindIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.59 4.59A2 2 0 1 1 11 8H2"
        stroke="#64748b"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.59 19.41A2 2 0 1 0 14 16H2"
        stroke="#64748b"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.35 11.65A2 2 0 1 1 8 8H2"
        stroke="#64748b"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function windDegreesToCompass(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

type StatTileProps = {
  icon: React.ReactNode;
  value: string;
  label: string;
};

function StatTile({ icon, value, label }: StatTileProps) {
  return (
    <View
      className="flex-1 items-center bg-white dark:bg-gray-800 rounded-xl py-3 px-2 mx-1"
      accessible
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="text"
    >
      <View accessible={false}>{icon}</View>
      <Text className="text-lg font-bold text-gray-800 dark:text-white mt-1" accessible={false}>
        {value}
      </Text>
      <Text className="text-xs text-gray-400" accessible={false}>{label}</Text>
    </View>
  );
}

type Props = { weather: WeatherData };

export default function WeatherWidget({ weather }: Props) {
  return (
    <View className="w-full mb-4">
      <Text className="text-xs font-semibold text-sky-500 uppercase tracking-wide mb-2">
        Weather
      </Text>

      {weather.description && (
        <Text className="text-sm text-gray-500 dark:text-gray-400 capitalize mb-2">
          {weather.description}
        </Text>
      )}

      <View className="flex-row -mx-1">
        {weather.temperature != null && (
          <StatTile
            icon={<ThermometerIcon />}
            value={`${Math.round(weather.temperature)}°C`}
            label="Temperature"
          />
        )}
        {weather.humidity != null && (
          <StatTile
            icon={<DropletIcon />}
            value={`${weather.humidity}%`}
            label="Humidity"
          />
        )}
        {weather.windSpeed != null && (
          <StatTile
            icon={<WindIcon />}
            value={`${Math.round(weather.windSpeed)} km/h${
              weather.windDirection != null
                ? ` ${windDegreesToCompass(weather.windDirection)}`
                : ""
            }`}
            label="Wind"
          />
        )}
      </View>
    </View>
  );
}
