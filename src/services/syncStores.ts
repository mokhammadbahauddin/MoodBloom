import { SyncableStore } from "./SyncableStore";
import { useSettingsStore } from "../lib/settingsStore";
import { useUserStore } from "../lib/userStore";
import { useHabitsStore } from "../lib/habitsStore";
import { useProductivityStore } from "../lib/productivityStore";
import { deepEqual } from "../lib/utils";

// --- Settings Store Sync Adapter ---
export const settingsSyncStore: SyncableStore = {
  key: "settings",
  getSyncData() {
    return useSettingsStore.getState().settings;
  },
  mergeIncoming(incoming) {
    useSettingsStore.getState().updateSettings(incoming);
  },
  subscribe(listener) {
    return useSettingsStore.subscribe(listener);
  }
};

// --- User Store Sync Adapter ---
export const userSyncStore: SyncableStore = {
  key: "user",
  getSyncData() {
    const s = useUserStore.getState();
    if (!s) return null;
    const { 
      userName, hasCompletedOnboarding, focusAreas, 
      achievements, xp, level, aiAnalysis, 
      weeklyCoachingReport, currentWeather, activeChatContext, isFasting
    } = s;
    return { 
      userName, hasCompletedOnboarding, focusAreas, 
      achievements, xp, level, aiAnalysis, 
      weeklyCoachingReport, currentWeather, activeChatContext, isFasting
    };
  },
  mergeIncoming(incoming) {
    useUserStore.getState().setAll(incoming);
  },
  subscribe(listener) {
    return useUserStore.subscribe(listener);
  }
};

// --- Productivity Store Sync Adapter ---
export const productivitySyncStore: SyncableStore = {
  key: "productivity",
  getSyncData() {
    const s = useProductivityStore.getState();
    if (!s) return null;
    const { schedules, tasks, focusLogs } = s;
    return { schedules, tasks, focusLogs };
  },
  mergeIncoming(incoming) {
    useProductivityStore.getState().setAll(incoming);
  },
  subscribe(listener) {
    return useProductivityStore.subscribe(listener);
  }
};

// --- Habits Store Sync Adapter (With LWW & Steps Merging) ---
export const habitsSyncStore: SyncableStore = {
  key: "habits",
  getSyncData() {
    const s = useHabitsStore.getState();
    if (!s) return null;
    const { 
      waterLogs, detailedWaterLogs, baseWaterGoal, 
      moodLogs, streakCount, lastStreakUpdate, 
      meditationLogs, meditationGoal,
      stepsLogs, detailedStepsLogs, stepGoal,
      prayerLogs, prayerAlarms
    } = s;
    return { 
      waterLogs, detailedWaterLogs, baseWaterGoal, 
      moodLogs, streakCount, lastStreakUpdate, 
      meditationLogs, meditationGoal,
      stepsLogs, detailedStepsLogs, stepGoal,
      prayerLogs, prayerAlarms
    };
  },
  mergeIncoming(incomingHabits, incomingTimestamp, lastLocalTimestamp) {
    const localState = useHabitsStore.getState();
    
    // 1. Merge steps logs using array-merging
    const { mergedDetailed, mergedStepsLogs } = mergeSteps(localState, incomingHabits);
    
    // 2. Determine base state for other fields using Last-Write-Wins (LWW)
    const isIncomingNewer = incomingTimestamp > lastLocalTimestamp;
    const baseState = isIncomingNewer ? incomingHabits : localState;
    
    const mergedHabits = {
      ...baseState,
      detailedStepsLogs: mergedDetailed,
      stepsLogs: mergedStepsLogs,
    };

    useHabitsStore.getState().setAll(mergedHabits);
  },
  subscribe(listener) {
    return useHabitsStore.subscribe(listener);
  }
};

// Helper for Habits Steps Merging
function mergeSteps(localState: any, incomingHabits: any) {
  const localDetailed = localState.detailedStepsLogs || {};
  const incomingDetailed = incomingHabits.detailedStepsLogs || {};
  
  const mergedDetailed: any = {};
  const mergedStepsLogs: any = {};

  const allDates = new Set([
    ...Object.keys(localDetailed),
    ...Object.keys(incomingDetailed)
  ]);

  for (const date of allDates) {
    const localList = localDetailed[date] || [];
    const incomingList = incomingDetailed[date] || [];

    const mergedList = [...localList];
    for (const item of incomingList) {
      if (!mergedList.some(x => x.id === item.id)) {
        mergedList.push(item);
      }
    }

    mergedList.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    mergedDetailed[date] = mergedList;
    mergedStepsLogs[date] = mergedList.reduce((sum: number, entry: any) => sum + entry.amount, 0);
  }

  return { mergedDetailed, mergedStepsLogs };
}

// Get all stores
export function getSyncStores(): SyncableStore[] {
  return [settingsSyncStore, habitsSyncStore, userSyncStore, productivitySyncStore];
}
