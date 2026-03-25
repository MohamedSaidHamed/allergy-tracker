import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as Location from "expo-location";
import {
  requestLocationPermissions,
  getCurrentLocation,
  reverseGeocode,
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
  storeLocation,
  getStoredLocation,
  storeLocationSource,
  getLocationSource,
  SavedLocation,
} from "@/services/locationService";

export type LocationPermissions = {
  foreground: boolean;
  background: boolean;
};

type LocationContextValue = {
  location: SavedLocation | null;
  permissions: LocationPermissions | null;
  loading: boolean;
  error: string | null;
  setLocation: (location: SavedLocation) => void;
  refresh: () => Promise<void>;
};

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<SavedLocation | null>(null);
  const [permissions, setPermissions] = useState<LocationPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const perms = await requestLocationPermissions();
      setPermissions(perms);

      if (!perms.foreground) {
        const stored = await getStoredLocation();
        setLocationState(stored);
        setLoading(false);
        setError("Location permission denied. Using last known location.");
        return;
      }

      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;
      const geo = await reverseGeocode(latitude, longitude);
      const newLocation: SavedLocation = { latitude, longitude, ...geo };

      await storeLocation(newLocation);
      await storeLocationSource("gps");

      if (perms.background) {
        await startBackgroundLocationUpdates();
      }

      setLocationState(newLocation);
      setLoading(false);
    } catch {
      const stored = await getStoredLocation();
      setLocationState(stored);
      setLoading(false);
      setError("Failed to get location. Using last known location.");
    }
  }, []);

  const setLocation = useCallback((loc: SavedLocation) => {
    storeLocation(loc).catch(console.error);
    storeLocationSource("manual").catch(console.error);
    stopBackgroundLocationUpdates().catch(console.error);
    setLocationState(loc);
  }, []);

  useEffect(() => {
    async function init() {
      const stored = await getStoredLocation();
      if (stored) setLocationState(stored);

      // Passive check only — never prompt on mount
      const { status: fgStatus } = await Location.getForegroundPermissionsAsync();
      const foregroundGranted = fgStatus === "granted";

      if (!foregroundGranted) {
        // Permission not yet granted — wait for the user to allow it in onboarding
        setPermissions({ foreground: false, background: false });
        setLoading(false);
        return;
      }

      // Returning user with permission already granted — load silently
      const source = await getLocationSource();
      if (source === "manual") {
        const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
        setPermissions({ foreground: true, background: bgStatus === "granted" });
        setLoading(false);
      } else {
        refresh(); // Safe: foreground already granted, no dialog will appear
      }
    }
    init();
  }, [refresh]);

  return (
    <LocationContext.Provider value={{ location, permissions, loading, error, setLocation, refresh }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within a LocationProvider");
  return ctx;
}
