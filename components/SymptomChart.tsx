import { useState } from "react";
import { View, Text, useColorScheme } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { SymptomLog, formatDisplayDate, pastDateString } from "@/services/symptomService";
import Colors from "@/constants/Colors";

type Props = { weekLogs: SymptomLog[] };

export default function SymptomChart({ weekLogs }: Props) {
  const [chartWidth, setChartWidth] = useState(0);
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const bgColor = theme.card;

  // Build a 7-day grid (today and past 6 days)
  const days = Array.from({ length: 7 }, (_, i) => pastDateString(6 - i));
  const logMap = new Map(weekLogs.map((l) => [l.date, l]));

  const labels = days.map((d) => formatDisplayDate(d).split(" ")[0]); // Mon, Tue, etc.

  const data = days.map((d) => logMap.get(d)?.severity ?? 0);
  const hasAnyData = data.some((v) => v > 0);

  if (!hasAnyData) {
    return (
      <View className="items-center py-6">
        <Text className="text-gray-400 text-sm">No data yet — log your first symptoms below.</Text>
      </View>
    );
  }

  const maxDay = days.reduce((best, d) => {
    const v = logMap.get(d)?.severity ?? 0;
    return v > (logMap.get(best)?.severity ?? 0) ? d : best;
  }, days[0]);
  const maxVal = logMap.get(maxDay)?.severity ?? 0;
  const a11yLabel = `7-day severity trend chart. Peak severity ${maxVal} out of 5 on ${formatDisplayDate(maxDay)}.`;

  return (
    <View
      accessible
      accessibilityLabel={a11yLabel}
      accessibilityRole="image"
      onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
    >
      {chartWidth > 0 && (
        <LineChart
          data={{
            labels,
            datasets: [{ data, strokeWidth: 2 }],
          }}
          width={chartWidth}
          height={160}
          yAxisSuffix=""
          yAxisInterval={1}
          fromZero
          chartConfig={{
            backgroundGradientFrom: bgColor,
            backgroundGradientTo: bgColor,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
            labelColor: () => theme.subtext,
            paddingRight: 16,
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#16a34a",
            },
          }}
          bezier
          style={{ borderRadius: 12 }}
          withInnerLines={false}
          withOuterLines={false}
        />
      )}
    </View>
  );
}
