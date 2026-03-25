import { useRef } from "react";
import { useColorScheme } from "react-native";
import { WebView } from "react-native-webview";
import { SavedLocation } from "@/services/locationService";
import { AllergenData, AllergenLevel } from "@/services/types";
import Colors from "@/constants/Colors";

const LEVEL_ORDER: Record<AllergenLevel, number> = {
  none: 0, low: 1, medium: 2, high: 3, extreme: 4,
};

const LEVEL_FILL: Record<AllergenLevel, string> = {
  none: "rgba(156,163,175,0.15)",
  low: "rgba(34,197,94,0.18)",
  medium: "rgba(234,179,8,0.22)",
  high: "rgba(249,115,22,0.25)",
  extreme: "rgba(239,68,68,0.28)",
};

const LEVEL_STROKE: Record<AllergenLevel, string> = {
  none: "rgba(156,163,175,0.4)",
  low: "rgba(34,197,94,0.6)",
  medium: "rgba(234,179,8,0.7)",
  high: "rgba(249,115,22,0.8)",
  extreme: "rgba(239,68,68,0.9)",
};

const LEVEL_RADIUS: Record<AllergenLevel, number> = {
  none: 2000,
  low: 5000,
  medium: 10000,
  high: 18000,
  extreme: 28000,
};

const LEVEL_LABEL: Record<AllergenLevel, string> = {
  none: "Clear", low: "Low", medium: "Moderate", high: "High", extreme: "Extreme",
};

const LEVEL_PIN: Record<AllergenLevel, string> = {
  none: "#9ca3af",
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  extreme: "#ef4444",
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
  const webViewRef = useRef<WebView>(null);
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const level = overallLevel(allergens);

  const lat = location.latitude;
  const lng = location.longitude;
  const locationLabel = [location.city, location.region].filter(Boolean).join(", ") || "Your location";

  const topAllergens = allergens
    .filter((a) => a.level !== "none")
    .sort((a, b) => LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level])
    .slice(0, 3);

  const popupLines = topAllergens.length > 0
    ? topAllergens.map((a) => `• ${a.name}: ${LEVEL_LABEL[a.level]}`).join("<br>")
    : "No significant pollen";

  const tileUrl = colorScheme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { height: 100%; width: 100%; background: ${theme.background}; }
    .leaflet-popup-content-wrapper { background: ${theme.card}; color: ${theme.text}; }
    .leaflet-popup-tip { background: ${theme.card}; }
    .leaflet-popup-content { font-family: -apple-system, sans-serif; font-size: 13px; color: ${theme.text}; }
    .leaflet-popup-content b { font-size: 14px; color: ${theme.text}; }
    .popup-level { font-weight: 700; margin: 4px 0; color: ${LEVEL_PIN[level]}; }
    .popup-allergen { color: ${theme.subtext}; margin-top: 2px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: true })
      .setView([${lat}, ${lng}], 12);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('${tileUrl}', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    L.circle([${lat}, ${lng}], {
      radius: ${LEVEL_RADIUS[level]},
      color: '${LEVEL_STROKE[level]}',
      fillColor: '${LEVEL_FILL[level]}',
      fillOpacity: 1,
      weight: 2
    }).addTo(map);

    var marker = L.marker([${lat}, ${lng}]).addTo(map);
    marker.bindPopup(
      '<b>${locationLabel}</b>' +
      '<div class="popup-level">Overall: ${LEVEL_LABEL[level]}</div>' +
      '<div class="popup-allergen">${popupLines}</div>'
    ).openPopup();
  </script>
</body>
</html>`;

  return (
    <WebView
      ref={webViewRef}
      source={{ html }}
      style={{ flex: 1 }}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={["*"]}
    />
  );
}
