import { useState, useEffect, useCallback } from "react";
import {
  getAllLogs,
  getLogsByDateRange,
  saveLog,
  deleteLog,
  SymptomLog,
  todayDateString,
  pastDateString,
} from "@/services/symptomService";

export function useSymptoms() {
  const [logs, setLogs] = useState<SymptomLog[]>([]);
  const [weekLogs, setWeekLogs] = useState<SymptomLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [all, week] = await Promise.all([
      getAllLogs(),
      getLogsByDateRange(pastDateString(6), todayDateString()),
    ]);
    setLogs(all);
    setWeekLogs(week);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addLog = useCallback(
    async (entry: Omit<SymptomLog, "id" | "timestamp">) => {
      await saveLog(entry);
      await load();
    },
    [load]
  );

  const removeLog = useCallback(
    async (id: string) => {
      await deleteLog(id);
      await load();
    },
    [load]
  );

  const todayLog = logs.find((l) => l.date === todayDateString()) ?? null;

  return { logs, weekLogs, todayLog, loading, addLog, removeLog, reload: load };
}
