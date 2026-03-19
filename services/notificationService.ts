import * as Notifications from "expo-notifications";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { fetchPollenData } from "./pollenService";
import { getStoredLocation } from "./locationService";
import { generateTips, getPreferredAllergens } from "./tipsService";
import { AllergenLevel } from "./types";

export const POLLEN_CHECK_TASK = "pollen-spike-check";

const SPIKE_THRESHOLD: AllergenLevel = "high";
const LEVEL_ORDER: Record<AllergenLevel, number> = {
  none: 0, low: 1, medium: 2, high: 3, extreme: 4,
};

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Background task: fetch pollen → notify on spikes
TaskManager.defineTask(POLLEN_CHECK_TASK, async () => {
  try {
    const location = await getStoredLocation();
    if (!location) return BackgroundFetch.BackgroundFetchResult.NoData;

    const snapshot = await fetchPollenData(
      location.latitude,
      location.longitude,
      true // force refresh
    );

    const preferred = await getPreferredAllergens();
    const spikes = snapshot.allergens.filter(
      (a) =>
        preferred.includes(a.name) &&
        LEVEL_ORDER[a.level] >= LEVEL_ORDER[SPIKE_THRESHOLD]
    );

    if (spikes.length === 0) return BackgroundFetch.BackgroundFetchResult.NoData;

    const tips = generateTips(snapshot, preferred);
    const topTip = tips.find((t) => t.urgency === "warning") ?? tips[0];

    if (topTip) {
      await scheduleLocalNotification(topTip.title, topTip.body);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return false;

  // Android: create a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("pollen-alerts", {
      name: "Pollen Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#f97316",
    });
  }

  return true;
}

export async function registerBackgroundPollenCheck(): Promise<void> {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  try {
    await BackgroundFetch.registerTaskAsync(POLLEN_CHECK_TASK, {
      minimumInterval: 60 * 60, // 1 hour
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {
    // Task may already be registered — safe to ignore
  }
}

export async function unregisterBackgroundPollenCheck(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(POLLEN_CHECK_TASK);
  } catch {
    // Not registered — ignore
  }
}

export async function scheduleLocalNotification(
  title: string,
  body: string
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: { type: "pollen-alert" },
    },
    trigger: null, // fire immediately
  });
}

export async function scheduleDailyPollenReminder(
  hour: number,
  minute: number
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Daily Pollen Update",
      body: "Check today's pollen levels and plan your day accordingly.",
      data: { type: "daily-reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
