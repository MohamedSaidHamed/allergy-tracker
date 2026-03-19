import AsyncStorage from "@react-native-async-storage/async-storage";
import { setPreferredAllergens, ALL_ALLERGEN_OPTIONS } from "./tipsService";

const ONBOARDING_KEY = "onboarding_complete";

export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(
  selectedAllergens: string[]
): Promise<void> {
  const allergens =
    selectedAllergens.length > 0 ? selectedAllergens : ALL_ALLERGEN_OPTIONS;
  await setPreferredAllergens(allergens);
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
}
