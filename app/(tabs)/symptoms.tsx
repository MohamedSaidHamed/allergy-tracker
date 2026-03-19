import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import { useSymptoms } from "@/hooks/useSymptoms";
import LogSymptomSheet from "@/components/LogSymptomSheet";
import SymptomChart from "@/components/SymptomChart";
import { SymptomLog, formatDisplayDate, todayDateString } from "@/services/symptomService";

function PlusIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke="white" strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function TrashIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
        stroke="#ef4444"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const SEVERITY_LABELS = ["", "Mild", "Low", "Moderate", "High", "Severe"];
const SEVERITY_BG = [
  "",
  "bg-green-100 dark:bg-green-900",
  "bg-lime-100 dark:bg-lime-900",
  "bg-yellow-100 dark:bg-yellow-900",
  "bg-orange-100 dark:bg-orange-900",
  "bg-red-100 dark:bg-red-900",
];
const SEVERITY_TEXT = [
  "",
  "text-green-700 dark:text-green-300",
  "text-lime-700 dark:text-lime-300",
  "text-yellow-700 dark:text-yellow-300",
  "text-orange-700 dark:text-orange-300",
  "text-red-700 dark:text-red-300",
];

function LogCard({ log, onDelete }: { log: SymptomLog; onDelete: () => void }) {
  const isToday = log.date === todayDateString();
  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-semibold text-gray-800 dark:text-white">
          {isToday ? "Today" : formatDisplayDate(log.date)}
        </Text>
        <View className="flex-row items-center gap-2">
          <View className={`px-2 py-0.5 rounded-full ${SEVERITY_BG[log.severity]}`}>
            <Text className={`text-xs font-semibold ${SEVERITY_TEXT[log.severity]}`}>
              {SEVERITY_LABELS[log.severity]}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Delete log for ${isToday ? "today" : formatDisplayDate(log.date)}`}
          >
            <TrashIcon />
          </TouchableOpacity>
        </View>
      </View>

      {log.symptoms.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mb-1">
          {log.symptoms.map((s) => (
            <View
              key={s}
              className="bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5"
            >
              <Text className="text-xs text-gray-600 dark:text-gray-300">{s}</Text>
            </View>
          ))}
        </View>
      )}

      {log.medications.length > 0 && (
        <Text className="text-xs text-gray-400 mt-1">
          Meds: {log.medications.join(", ")}
        </Text>
      )}

      {log.notes && (
        <Text className="text-xs text-gray-400 mt-1 italic">{log.notes}</Text>
      )}
    </View>
  );
}

export default function SymptomsScreen() {
  const { logs, weekLogs, todayLog, loading, addLog, removeLog, reload } =
    useSymptoms();
  const [showSheet, setShowSheet] = useState(false);
  const insets = useSafeAreaInsets();

  // FAB sits 24px above the tab bar (bottom inset already accounted for by SafeAreaView)
  const fabBottom = 24;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          // Extra space so last card isn't hidden behind FAB
          paddingBottom: fabBottom + 64,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor="#22c55e" />
        }
      >
        {/* Header — title only, FAB moved to fixed overlay below */}
        <View className="mb-5">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Symptom Tracker
          </Text>
          <Text className="text-sm text-gray-400">Daily allergy log</Text>
        </View>

        {/* Today's status */}
        <TouchableOpacity
          className={`rounded-2xl p-5 mb-5 ${
            todayLog
              ? "bg-green-50 dark:bg-green-950"
              : "bg-white dark:bg-gray-800"
          }`}
          onPress={() => setShowSheet(true)}
          activeOpacity={0.8}
        >
          {todayLog ? (
            <>
              <Text className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">
                Today logged ✓
              </Text>
              <View className="flex-row items-center gap-2">
                <View
                  className={`px-2 py-0.5 rounded-full ${SEVERITY_BG[todayLog.severity]}`}
                >
                  <Text
                    className={`text-sm font-bold ${SEVERITY_TEXT[todayLog.severity]}`}
                  >
                    {SEVERITY_LABELS[todayLog.severity]} ({todayLog.severity}/5)
                  </Text>
                </View>
              </View>
              {todayLog.symptoms.length > 0 && (
                <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {todayLog.symptoms.join(", ")}
                </Text>
              )}
              <Text className="text-xs text-green-500 mt-2">Tap to update</Text>
            </>
          ) : (
            <>
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Today
              </Text>
              <Text className="text-base font-semibold text-gray-500 dark:text-gray-400">
                No symptoms logged yet
              </Text>
              <Text className="text-xs text-blue-400 mt-2">Tap to log →</Text>
            </>
          )}
        </TouchableOpacity>

        {/* 7-day trend chart */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-5">
          <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            7-day severity trend
          </Text>
          <SymptomChart weekLogs={weekLogs} />
        </View>

        {/* Log history */}
        <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          History
        </Text>
        {logs.length === 0 ? (
          <View className="items-center py-10">
            <Text className="text-4xl mb-3">📋</Text>
            <Text className="text-gray-400 text-sm text-center">
              Your symptom history will appear here.{"\n"}Tap + to log your first entry.
            </Text>
          </View>
        ) : (
          logs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              onDelete={() => removeLog(log.id)}
            />
          ))
        )}
      </ScrollView>

      {/* Fixed FAB — bottom right, above tab bar */}
      <TouchableOpacity
        onPress={() => setShowSheet(true)}
        accessibilityRole="button"
        accessibilityLabel="Log today's symptoms"
        accessibilityHint="Opens the symptom logging form"
        style={{
          position: "absolute",
          bottom: fabBottom,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#22c55e",
          alignItems: "center",
          justifyContent: "center",
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
            },
            android: { elevation: 6 },
          }),
        }}
      >
        <PlusIcon />
      </TouchableOpacity>

      <LogSymptomSheet
        visible={showSheet}
        existing={todayLog}
        onSave={addLog}
        onDismiss={() => setShowSheet(false)}
      />
    </SafeAreaView>
  );
}
