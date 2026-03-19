import { useRef, useEffect } from "react";
import { View, Text, Platform } from "react-native";
import MapView, { Circle, Marker, Callout, PROVIDER_DEFAULT, Region } from "react-native-maps";
import { SavedLocation } from "@/services/locationService";
import { AllergenData, AllergenLevel } from "@/services/types";

const LEVEL_ORDER: Record<AllergenLevel, number> = {
  none: 0, low: 1, medium: 2, high: 3, extreme: 4,
};

const LEVEL_FILL: Record<AllergenLevel, string> = {
  none: "rgba(156,163,175,0.15)",
  low: "rgba(34,197,94,0.15)",
  medium: "rgba(234,179,8,0.18)",
  high: "rgba(249,115,22,0.22)",
  extreme: "rgba(239,68,68,0.25)",
};

const LEVEL_STROKE: Record<AllergenLevel, string> = {
  none: "rgba(156,163,175,0.4)",
  low: "rgba(34,197,94,0.5)",
  medium: "rgba(234,179,8,0.6)",
  high: "rgba(249,115,22,0.7)",
  extreme: "rgba(239,68,68,0.8)",
};

const LEVEL_PIN: Record<AllergenLevel, string> = {
  none: "#9ca3af",
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  extreme: "#ef4444",
};

const LEVEL_LABEL: Record<AllergenLevel, string> = {
  none: "Clear",
  low: "Low",
  medium: "Moderate",
  high: "High",
  extreme: "Extreme",
};

// Radius in metres — grows with severity so low pollen feels contained
const LEVEL_RADIUS: Record<AllergenLevel, number> = {
  none: 2000,
  low: 5000,
  medium: 10000,
  high: 18000,
  extreme: 28000,
};

function overallLevel(allergens: AllergenData[]): AllergenLevel {
  if (allergens.length === 0) return "none";
  return allergens.reduce<AllergenLevel>(
    (max, a) => (LEVEL_ORDER[a.level] > LEVEL_ORDER[max] ? a.level : max),
    "none"
  );
}

type Props = {
  location: SavedLocation;
  allergens: AllergenData[];
};

export default function PollenMap({ location, allergens }: Props) {
  const mapRef = useRef<MapView>(null);
  const level = overallLevel(allergens);

  const region: Region = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.3,
    longitudeDelta: 0.3,
  };

  // Re-centre map when location changes
  useEffect(() => {
    mapRef.current?.animateToRegion(region, 600);
  }, [location.latitude, location.longitude]);

  const topAllergens = allergens
    .filter((a) => a.level !== "none")
    .sort((a, b) => LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level])
    .slice(0, 3);

  const locationLabel = [location.city, location.region]
    .filter(Boolean)
    .join(", ") || "Your location";

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      provider={PROVIDER_DEFAULT}
      initialRegion={region}
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass
      toolbarEnabled={false}
    >
      {/* Pollen hotspot circle */}
      <Circle
        center={{ latitude: location.latitude, longitude: location.longitude }}
        radius={LEVEL_RADIUS[level]}
        fillColor={LEVEL_FILL[level]}
        strokeColor={LEVEL_STROKE[level]}
        strokeWidth={2}
      />

      {/* Location marker with pollen level callout */}
      <Marker
        coordinate={{ latitude: location.latitude, longitude: location.longitude }}
        title={locationLabel}
        pinColor={LEVEL_PIN[level]}
      >
        <Callout tooltip={false} style={{ width: 180 }}>
          <View style={{ padding: 8 }}>
            <Text style={{ fontWeight: "700", fontSize: 13, marginBottom: 4, color: "#111827" }}>
              {locationLabel}
            </Text>
            <Text style={{ fontSize: 12, color: LEVEL_PIN[level], fontWeight: "600", marginBottom: 4 }}>
              Overall: {LEVEL_LABEL[level]}
            </Text>
            {topAllergens.length > 0 ? (
              topAllergens.map((a) => (
                <Text key={a.name} style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>
                  • {a.name}: {LEVEL_LABEL[a.level]}
                </Text>
              ))
            ) : (
              <Text style={{ fontSize: 11, color: "#6b7280" }}>No significant pollen</Text>
            )}
          </View>
        </Callout>
      </Marker>
    </MapView>
  );
}
