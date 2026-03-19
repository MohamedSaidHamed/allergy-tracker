import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SYMPTOM_OPTIONS,
  MEDICATION_OPTIONS,
  SymptomLog,
  todayDateString,
} from "@/services/symptomService";

type Props = {
  visible: boolean;
  existing?: SymptomLog | null;
  onSave: (entry: Omit<SymptomLog, "id" | "timestamp">) => void;
  onDismiss: () => void;
};

function ToggleChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-3 py-1.5 rounded-full mr-2 mb-2 border ${
        selected
          ? "bg-green-500 border-green-500"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      }`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      <Text
        className={`text-sm font-medium ${
          selected ? "text-white" : "text-gray-600 dark:text-gray-300"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SeverityPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const labels = ["", "Mild", "Low", "Moderate", "High", "Severe"];
  const colors = [
    "",
    "bg-green-400",
    "bg-lime-400",
    "bg-yellow-400",
    "bg-orange-400",
    "bg-red-500",
  ];
  return (
    <View className="flex-row justify-between mt-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => onChange(n)}
          className="items-center flex-1 mx-1"
          accessibilityRole="radio"
          accessibilityState={{ checked: value === n }}
          accessibilityLabel={`Severity ${n}: ${labels[n]}`}
        >
          <View
            className={`w-10 h-10 rounded-full items-center justify-center border-2 ${
              value === n
                ? `${colors[n]} border-transparent`
                : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            }`}
          >
            <Text
              className={`font-bold text-base ${
                value === n ? "text-white" : "text-gray-500"
              }`}
            >
              {n}
            </Text>
          </View>
          <Text className="text-xs text-gray-400 mt-1">{labels[n]}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function LogSymptomSheet({
  visible,
  existing,
  onSave,
  onDismiss,
}: Props) {
  const [symptoms, setSymptoms] = useState<string[]>(
    existing?.symptoms ?? []
  );
  const [medications, setMedications] = useState<string[]>(
    existing?.medications ?? []
  );
  const [severity, setSeverity] = useState(existing?.severity ?? 1);
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const toggle = (
    list: string[],
    setList: (v: string[]) => void,
    item: string
  ) => {
    setList(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  };

  const handleSave = () => {
    onSave({
      date: todayDateString(),
      symptoms,
      medications,
      severity,
      notes: notes.trim() || undefined,
    });
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 bg-white dark:bg-gray-900">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
            <TouchableOpacity
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text className="text-gray-400 font-medium">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-base font-bold text-gray-800 dark:text-white">
              Log Today's Symptoms
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={symptoms.length === 0}
              accessibilityRole="button"
              accessibilityLabel="Save symptom log"
              accessibilityState={{ disabled: symptoms.length === 0 }}
            >
              <Text
                className={`font-semibold ${
                  symptoms.length > 0
                    ? "text-green-500"
                    : "text-gray-300 dark:text-gray-600"
                }`}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1 px-5"
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Symptoms */}
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Symptoms
            </Text>
            <View className="flex-row flex-wrap mb-4">
              {SYMPTOM_OPTIONS.map((s) => (
                <ToggleChip
                  key={s}
                  label={s}
                  selected={symptoms.includes(s)}
                  onPress={() => toggle(symptoms, setSymptoms, s)}
                />
              ))}
            </View>

            {/* Severity */}
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Severity
            </Text>
            <SeverityPicker value={severity} onChange={setSeverity} />

            <View className="h-px bg-gray-100 dark:bg-gray-800 my-5" />

            {/* Medications */}
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Medications taken
            </Text>
            <View className="flex-row flex-wrap mb-4">
              {MEDICATION_OPTIONS.map((m) => (
                <ToggleChip
                  key={m}
                  label={m}
                  selected={medications.includes(m)}
                  onPress={() => toggle(medications, setMedications, m)}
                />
              ))}
            </View>

            {/* Notes */}
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Notes (optional)
            </Text>
            <TextInput
              className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-800 dark:text-white text-sm min-h-20"
              placeholder="Any additional observations..."
              placeholderTextColor="#9ca3af"
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Additional notes"
              accessibilityHint="Optional field for any extra observations"
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
