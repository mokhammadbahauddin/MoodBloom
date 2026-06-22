import { useEffect } from "react";
import { useUserStore } from "../lib/userStore";
import { useProductivityStore } from "../lib/productivityStore";;
import { useHabitsStore } from "../lib/habitsStore";
import { getTodayDateString } from "../lib/dateUtils";
import { aiService } from "../services/aiService";

/**
 * AIBrainObserver - Phase 1 Clean Implementation
 * A headless observer that delegates complex logic to the AIService.
 * Monitors critical state changes and triggers reactive analysis.
 */
export default function AIBrainObserver() {
  const waterLogs = useHabitsStore((state) => state.waterLogs);
  const stepsLogs = useHabitsStore(state => state.stepsLogs);
  const meditationLogs = useHabitsStore((state) => state.meditationLogs);
  const moodLogs = useHabitsStore((state) => state.moodLogs);
  const tasks = useProductivityStore(state => state.tasks);
  const today = getTodayDateString();

  // Watch for significant behavioral changes
  useEffect(() => {
    // Debounce to avoid spamming the service during rapid interactions
    const timer = setTimeout(() => {
      aiService.analyzeWellness();
    }, 15000); // 15s adaptive window

    return () => clearTimeout(timer);
  }, [
    waterLogs[today],
    stepsLogs[today],
    meditationLogs[today],
    moodLogs[today]?.moodValue,
    tasks.filter((t) => !t.completed).length,
  ]);

  // Periodic deep check (Circadian Refresh)
  useEffect(() => {
    const heartbeat = setInterval(() => {
      aiService.analyzeWellness();
    }, 10 * 60 * 1000); // Every 10 minutes

    return () => clearInterval(heartbeat);
  }, []);

  return null; // Headless
}
