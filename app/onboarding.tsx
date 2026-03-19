import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";

import { requestLocationPermissions } from "@/services/locationService";
import { requestNotificationPermissions } from "@/services/notificationService";
import { markOnboardingComplete } from "@/services/onboardingService";
import { ALL_ALLERGEN_OPTIONS } from "@/services/tipsService";

// ── Icons ──────────────────────────────────────────────────────────────────

function LeafIcon() {
  return (
    <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 8C8 10 5.9 16.17 3.82 19.34C2.93 20.7 3.74 21.98 4.82 21.5C8 20 11 16.5 13 14C15.76 11.24 19 10 22 9C22 9 22 3 17 2C17 2 17 6 12 8"
        stroke="#22c55e"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 21c2-3 4-6 7-8"
        stroke="#22c55e"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LocationIcon({ color = "#3b82f6" }: { color?: string }) {
  return (
    <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={9} r={2.5} stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

function BellIcon({ color = "#f97316" }: { color?: string }) {
  return (
    <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ color = "#22c55e" }: { color?: string }) {
  return (
    <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.6} />
      <Path
        d="M8 12l3 3 5-5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Step dot indicator ─────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <View className="flex-row justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`h-2 rounded-full transition-all ${
            i === current
              ? "w-6 bg-blue-500"
              : i < current
              ? "w-2 bg-blue-300"
              : "w-2 bg-gray-200 dark:bg-gray-700"
          }`}
        />
      ))}
    </View>
  );
}

// ── Toggle chip ────────────────────────────────────────────────────────────

function AllergenChip({
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
      className={`px-4 py-2.5 rounded-xl mr-2 mb-3 border-2 ${
        selected
          ? "bg-green-500 border-green-500"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      }`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      <Text
        className={`text-sm font-semibold ${
          selected ? "text-white" : "text-gray-600 dark:text-gray-300"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Screens ────────────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Image
        source={require("../assets/images/icon.png")}
        style={{ width: 100, height: 100, borderRadius: 22 }}
        className="mb-6"
      />
      <Text className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-3">
        Allergy Tracker
      </Text>
      <Text className="text-base text-gray-500 dark:text-gray-400 text-center leading-6 mb-10">
        Monitor pollen levels in your area, log your symptoms, and get personalized
        tips to help you plan your day.
      </Text>
      <View className="w-full gap-4">
        <View className="flex-row items-start">
          <Text className="text-2xl mr-3">🌿</Text>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-800 dark:text-white">Real-time pollen data</Text>
            <Text className="text-xs text-gray-400">Local forecasts updated every 30 minutes</Text>
          </View>
        </View>
        <View className="flex-row items-start">
          <Text className="text-2xl mr-3">📋</Text>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-800 dark:text-white">Symptom tracking</Text>
            <Text className="text-xs text-gray-400">Log and visualize your allergy history</Text>
          </View>
        </View>
        <View className="flex-row items-start">
          <Text className="text-2xl mr-3">🔔</Text>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-800 dark:text-white">Spike alerts</Text>
            <Text className="text-xs text-gray-400">Get notified when pollen levels surge</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        className="w-full bg-blue-500 rounded-2xl py-4 mt-12"
        onPress={onNext}
      >
        <Text className="text-white text-center font-bold text-base">Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

function LocationStep({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "granted" | "denied">("idle");

  const handleRequest = async () => {
    const perms = await requestLocationPermissions();
    setStatus(perms.foreground ? "granted" : "denied");
    if (perms.foreground) setTimeout(onNext, 800);
  };

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="mb-6">
        <LocationIcon color={status === "denied" ? "#ef4444" : "#3b82f6"} />
      </View>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
        Your location
      </Text>
      <Text className="text-base text-gray-500 dark:text-gray-400 text-center leading-6 mb-4">
        Allergy Tracker needs your location to show pollen levels specific to
        your area and send timely alerts.
      </Text>

      <View className="w-full bg-blue-50 dark:bg-blue-950 rounded-xl p-4 mb-8">
        <Text className="text-sm text-blue-700 dark:text-blue-300 leading-5">
          <Text className="font-semibold">Why background location?{"\n"}</Text>
          Background access lets us check pollen levels while the app is closed
          and alert you to sudden spikes.
        </Text>
      </View>

      {status === "granted" && (
        <View className="mb-4 items-center">
          <Text className="text-green-500 font-semibold">✓ Location granted</Text>
        </View>
      )}
      {status === "denied" && (
        <View className="mb-4">
          <Text className="text-red-400 text-sm text-center">
            Permission denied. You can enable it later in Settings.
          </Text>
        </View>
      )}

      {status === "idle" && (
        <TouchableOpacity
          className="w-full bg-blue-500 rounded-2xl py-4 mb-3"
          onPress={handleRequest}
        >
          <Text className="text-white text-center font-bold text-base">
            Allow Location Access
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={onSkip} className="py-3">
        <Text className="text-gray-400 text-sm text-center">
          {status === "denied" ? "Continue without location →" : "Skip for now"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function AllergenStep({
  selected,
  onToggle,
  onNext,
}: {
  selected: string[];
  onToggle: (a: string) => void;
  onNext: () => void;
}) {
  return (
    <View className="flex-1 px-6">
      <View className="items-center mb-6 pt-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
          What are you allergic to?
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center leading-5">
          Select the allergens you want to track. You can change this anytime in
          Settings.
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="flex-row flex-wrap mb-6">
          {ALL_ALLERGEN_OPTIONS.map((a) => (
            <AllergenChip
              key={a}
              label={a}
              selected={selected.includes(a)}
              onPress={() => onToggle(a)}
            />
          ))}
        </View>

        <View className="bg-green-50 dark:bg-green-950 rounded-xl p-4 mb-6">
          <Text className="text-sm text-green-700 dark:text-green-300 leading-5">
            <Text className="font-semibold">Tip:{"\n"}</Text>
            Selecting your specific allergens helps us filter tips and alerts
            that are most relevant to you.
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        className="bg-blue-500 rounded-2xl py-4 mb-4"
        onPress={onNext}
      >
        <Text className="text-white text-center font-bold text-base">
          {selected.length > 0
            ? `Track ${selected.length} allergen${selected.length > 1 ? "s" : ""}`
            : "Track all allergens"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function NotificationStep({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "granted" | "denied">("idle");

  const handleRequest = async () => {
    const granted = await requestNotificationPermissions();
    setStatus(granted ? "granted" : "denied");
    if (granted) setTimeout(onNext, 800);
  };

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="mb-6">
        <BellIcon color={status === "denied" ? "#ef4444" : "#f97316"} />
      </View>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
        Stay ahead of pollen
      </Text>
      <Text className="text-base text-gray-500 dark:text-gray-400 text-center leading-6 mb-8">
        We'll notify you when pollen levels spike for your tracked allergens so
        you can take action before symptoms start.
      </Text>

      {status === "granted" && (
        <View className="mb-4">
          <Text className="text-green-500 font-semibold text-center">✓ Notifications enabled</Text>
        </View>
      )}
      {status === "denied" && (
        <View className="mb-4">
          <Text className="text-red-400 text-sm text-center">
            Notifications disabled. You can enable them later in Settings.
          </Text>
        </View>
      )}

      {status === "idle" && (
        <TouchableOpacity
          className="w-full bg-orange-500 rounded-2xl py-4 mb-3"
          onPress={handleRequest}
        >
          <Text className="text-white text-center font-bold text-base">
            Enable Notifications
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={onSkip} className="py-3">
        <Text className="text-gray-400 text-sm text-center">
          {status === "denied" ? "Continue without notifications →" : "Not now"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function DoneStep({ onFinish }: { onFinish: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="mb-6">
        <CheckIcon />
      </View>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
        You're all set!
      </Text>
      <Text className="text-base text-gray-500 dark:text-gray-400 text-center leading-6 mb-10">
        Allergy Tracker is ready to help you anticipate and manage your seasonal
        allergies.
      </Text>
      <TouchableOpacity
        className="w-full bg-green-500 rounded-2xl py-4"
        onPress={onFinish}
      >
        <Text className="text-white text-center font-bold text-base">
          Go to Dashboard
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Root onboarding flow ───────────────────────────────────────────────────

const TOTAL_STEPS = 5; // welcome, location, allergens, notifications, done

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(
    ALL_ALLERGEN_OPTIONS
  );

  const next = () => setStep((s) => s + 1);

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen]
    );
  };

  const finish = async () => {
    await markOnboardingComplete(selectedAllergens);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      {/* Step dots (hidden on welcome and done screens) */}
      {step > 0 && step < TOTAL_STEPS - 1 && (
        <View className="pt-4">
          <StepDots total={TOTAL_STEPS - 2} current={step - 1} />
        </View>
      )}

      {step === 0 && <WelcomeStep onNext={next} />}
      {step === 1 && <LocationStep onNext={next} onSkip={next} />}
      {step === 2 && (
        <AllergenStep
          selected={selectedAllergens}
          onToggle={toggleAllergen}
          onNext={next}
        />
      )}
      {step === 3 && <NotificationStep onNext={next} onSkip={next} />}
      {step === 4 && <DoneStep onFinish={finish} />}
    </SafeAreaView>
  );
}
