import AsyncStorage from "@react-native-async-storage/async-storage";

export type SymptomLog = {
  id: string;
  date: string;      // YYYY-MM-DD
  timestamp: string; // ISO
  symptoms: string[];
  medications: string[];
  severity: number;  // 1–5
  notes?: string;
};

export const SYMPTOM_OPTIONS = [
  "Sneezing",
  "Runny nose",
  "Nasal congestion",
  "Itchy eyes",
  "Watery eyes",
  "Itchy throat",
  "Coughing",
  "Headache",
  "Fatigue",
  "Skin rash",
];

export const MEDICATION_OPTIONS = [
  "Antihistamine",
  "Nasal spray",
  "Eye drops",
  "Decongestant",
  "Inhaler",
  "Allergy shots",
];

const STORAGE_KEY = "symptom_logs";

async function readAll(): Promise<SymptomLog[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SymptomLog[];
  } catch {
    return [];
  }
}

async function writeAll(logs: SymptomLog[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export async function getAllLogs(): Promise<SymptomLog[]> {
  const logs = await readAll();
  return logs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function getLogsByDateRange(
  fromDate: string,
  toDate: string
): Promise<SymptomLog[]> {
  const logs = await readAll();
  return logs
    .filter((l) => l.date >= fromDate && l.date <= toDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getLogForDate(date: string): Promise<SymptomLog | null> {
  const logs = await readAll();
  return logs.find((l) => l.date === date) ?? null;
}

export async function saveLog(
  entry: Omit<SymptomLog, "id" | "timestamp">
): Promise<SymptomLog> {
  const logs = await readAll();
  // Replace existing log for the same date if present
  const idx = logs.findIndex((l) => l.date === entry.date);
  const log: SymptomLog = {
    ...entry,
    id: idx >= 0 ? logs[idx].id : `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  if (idx >= 0) {
    logs[idx] = log;
  } else {
    logs.push(log);
  }
  await writeAll(logs);
  return log;
}

export async function deleteLog(id: string): Promise<void> {
  const logs = await readAll();
  await writeAll(logs.filter((l) => l.id !== id));
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function pastDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
