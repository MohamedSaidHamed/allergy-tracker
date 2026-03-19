import { useState, useEffect } from "react";
import { generateTips, getPreferredAllergens, Tip } from "@/services/tipsService";
import { PollenSnapshot } from "@/services/pollenService";

export function useTips(snapshot: PollenSnapshot | null) {
  const [tips, setTips] = useState<Tip[]>([]);

  useEffect(() => {
    if (!snapshot) {
      setTips([]);
      return;
    }
    getPreferredAllergens().then((preferred) => {
      setTips(generateTips(snapshot, preferred));
    });
  }, [snapshot]);

  return tips;
}
