/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  // NativeWind v4 uses "media" strategy to honour the OS dark/light setting
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        // Brand palette — use these for consistent theming
        brand: {
          primary: "#3b82f6",   // blue-500
          success: "#22c55e",   // green-500
          warning: "#f97316",   // orange-500
          danger:  "#ef4444",   // red-500
        },
      },
    },
  },
  plugins: [],
};
