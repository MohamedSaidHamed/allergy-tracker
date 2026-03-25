// NOTE: card colours are also used as the native splash background in app.json.
// If you change card here, update "splash.backgroundColor" and "splash.dark.backgroundColor" in app.json too.
const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export default {
  light: {
    text: '#111827',
    background: '#fff',
    card: '#ffffff',
    subtext: '#6b7280',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#f9fafb',
    background: '#000',
    card: '#1f2937',
    subtext: '#9ca3af',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};
