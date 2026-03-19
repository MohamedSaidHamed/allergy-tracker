import { useState, useEffect, useCallback } from "react";
import { fetchPollenData, PollenSnapshot } from "@/services/pollenService";
import { SavedLocation } from "@/services/locationService";

type State = {
  data: PollenSnapshot | null;
  loading: boolean;
  error: string | null;
};

export function usePollenData(location: SavedLocation | null) {
  const [state, setState] = useState<State>({
    data: null,
    loading: false,
    error: null,
  });

  const fetch = useCallback(
    async (forceRefresh = false) => {
      if (!location) return;
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const snapshot = await fetchPollenData(
          location.latitude,
          location.longitude,
          forceRefresh
        );
        setState({ data: snapshot, loading: false, error: null });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to fetch pollen data";
        setState((prev) => ({ ...prev, loading: false, error: msg }));
      }
    },
    [location]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refresh: () => fetch(true) };
}
