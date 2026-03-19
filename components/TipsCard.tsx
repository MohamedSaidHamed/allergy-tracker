import { View, Text } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { Tip } from "@/services/tipsService";

function InfoIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 16v-4M12 8h.01"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function WarningIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 9v4M12 17h.01"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const URGENCY_STYLES = {
  info: {
    container: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
    icon: <InfoIcon color="#3b82f6" />,
    title: "text-blue-800 dark:text-blue-200",
    body: "text-blue-600 dark:text-blue-400",
  },
  caution: {
    container: "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800",
    icon: <InfoIcon color="#ca8a04" />,
    title: "text-yellow-800 dark:text-yellow-200",
    body: "text-yellow-700 dark:text-yellow-400",
  },
  warning: {
    container: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
    icon: <WarningIcon color="#dc2626" />,
    title: "text-red-800 dark:text-red-200",
    body: "text-red-600 dark:text-red-400",
  },
};

function TipItem({ tip }: { tip: Tip }) {
  const styles = URGENCY_STYLES[tip.urgency];
  return (
    <View
      className={`flex-row rounded-xl border px-4 py-3 mb-3 ${styles.container}`}
      accessible
      accessibilityLabel={`${tip.urgency === "warning" ? "Alert" : "Tip"}: ${tip.title}. ${tip.body}`}
      accessibilityRole="text"
    >
      <View className="mt-0.5 mr-3" accessible={false}>{styles.icon}</View>
      <View className="flex-1">
        <Text className={`text-sm font-semibold mb-0.5 ${styles.title}`}>
          {tip.title}
        </Text>
        <Text className={`text-sm leading-5 ${styles.body}`}>{tip.body}</Text>
      </View>
    </View>
  );
}

type Props = { tips: Tip[] };

export default function TipsCard({ tips }: Props) {
  if (tips.length === 0) return null;

  return (
    <View className="mb-4">
      <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Tips &amp; Alerts
      </Text>
      {tips.map((tip) => (
        <TipItem key={tip.id} tip={tip} />
      ))}
    </View>
  );
}
