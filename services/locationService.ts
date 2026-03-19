import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as SecureStore from "expo-secure-store";

export const BACKGROUND_LOCATION_TASK = "background-location-task";
const STORED_LOCATION_KEY = "saved_location";
const LOCATION_SOURCE_KEY = "location_source";

export type LocationSource = "gps" | "manual";

export async function storeLocationSource(source: LocationSource): Promise<void> {
  await SecureStore.setItemAsync(LOCATION_SOURCE_KEY, source);
}

export async function getLocationSource(): Promise<LocationSource> {
  const raw = await SecureStore.getItemAsync(LOCATION_SOURCE_KEY);
  return raw === "manual" ? "manual" : "gps";
}

export type SavedLocation = {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
};

// Register the background task definition (must be at module top-level)
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("[LocationService] Background task error:", error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations.length > 0) {
      const latest = locations[locations.length - 1];
      storeLocation({
        latitude: latest.coords.latitude,
        longitude: latest.coords.longitude,
      }).catch(console.error);
    }
  }
});

export async function requestLocationPermissions(): Promise<{
  foreground: boolean;
  background: boolean;
}> {
  const { status: foregroundStatus } =
    await Location.requestForegroundPermissionsAsync();
  const foregroundGranted = foregroundStatus === "granted";

  let backgroundGranted = false;
  if (foregroundGranted) {
    const { status: backgroundStatus } =
      await Location.requestBackgroundPermissionsAsync();
    backgroundGranted = backgroundStatus === "granted";
  }

  return { foreground: foregroundGranted, background: backgroundGranted };
}

export async function getCurrentLocation(): Promise<Location.LocationObject> {
  return Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<Partial<SavedLocation>> {
  const results = await Location.reverseGeocodeAsync({ latitude, longitude });
  if (results.length === 0) return {};
  const place = results[0];
  return {
    city: place.city ?? place.subregion ?? undefined,
    region: place.region ?? undefined,
    country: place.country ?? undefined,
  };
}

export async function startBackgroundLocationUpdates(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_LOCATION_TASK
  );
  if (!isRegistered) {
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 15 * 60 * 1000, // 15 minutes
      distanceInterval: 1000, // 1 km
      showsBackgroundLocationIndicator: false,
      foregroundService: {
        notificationTitle: "Allergy Tracker",
        notificationBody: "Checking pollen levels for your area",
      },
    });
  }
}

export async function stopBackgroundLocationUpdates(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_LOCATION_TASK
  );
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}

export async function storeLocation(location: SavedLocation): Promise<void> {
  await SecureStore.setItemAsync(
    STORED_LOCATION_KEY,
    JSON.stringify(location)
  );
}

export async function getStoredLocation(): Promise<SavedLocation | null> {
  const raw = await SecureStore.getItemAsync(STORED_LOCATION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SavedLocation;
  } catch {
    return null;
  }
}

export type GeocodeSuggestion = {
  placeId: string;
  displayName: string;
  latitude: number;
  longitude: number;
};

export async function searchLocations(
  query: string
): Promise<GeocodeSuggestion[]> {
  if (query.trim().length < 2) return [];
  const encoded = encodeURIComponent(query);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=5&addressdetails=1`;
  const response = await fetch(url, {
    headers: { "User-Agent": "SeasonalAllergyTracker/1.0" },
  });
  if (!response.ok) return [];
  const results = await response.json();
  return results.map((r: Record<string, unknown>) => ({
    placeId: String(r.place_id),
    displayName: String(r.display_name),
    latitude: parseFloat(String(r.lat)),
    longitude: parseFloat(String(r.lon)),
  }));
}
