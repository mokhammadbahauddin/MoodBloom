import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getTodayDateString } from "./dateUtils";
import { shouldUpdateStreak, isStreakBroken } from "./wellnessUtils";
import { eventBus } from "./eventBus";

export interface WaterEntry {
  id: string;
  amount: number; // in L
  timestamp: string; // ISO string
  type: "cup" | "glass" | "bottle" | "other";
}

export interface MoodLog {
  date: string; // YYYY-MM-DD
  moodValue: number; // 1-4
  sleepValue: number; // 1-4
  sleepStart?: string; // HH:mm
  sleepEnd?: string;   // HH:mm
  sleepDuration?: number; // in hours
  factors: string[];
  notes: string;
}

export interface StepEntry {
  id: string;
  amount: number;
  timestamp: string; // ISO string
  source: "manual" | "google_fit" | "sensor" | "strava";
}

interface HabitsState {
  // Water
  waterLogs: Record<string, number>;
  detailedWaterLogs: Record<string, WaterEntry[]>;
  baseWaterGoal: number; // in L
  setWaterGoal: (amount: number) => void;
  logWater: (date: string, amount: number, type?: WaterEntry["type"]) => void;
  removeWaterLog: (date: string, logId: string) => void;

  // Mood
  moodLogs: Record<string, MoodLog>;
  streakCount: number;
  lastStreakUpdate: string | null;
  logMood: (log: MoodLog) => void;
  removeMoodLog: (date: string) => void;

  // Meditation
  meditationLogs: Record<string, number>;
  meditationGoal: number;
  setMeditationGoal: (goal: number) => void;
  logMeditation: (date: string, minutes: number) => void;
  removeMeditationLog: (date: string) => void;

  // Steps
  stepsLogs: Record<string, number>;
  detailedStepsLogs: Record<string, StepEntry[]>;
  stepGoal: number;
  setStepGoal: (goal: number) => void;
  logSteps: (date: string, steps: number, mode: "add" | "set", source?: StepEntry["source"]) => void;
  removeStepLog: (date: string, logId: string) => void;

  // Prayers
  prayerLogs: Record<string, string[]>;
  prayerAlarms: string[];
  logPrayer: (date: string, prayerName: string) => void;
  removePrayerLog: (date: string, prayerName: string) => void;
  togglePrayerAlarm: (name: string) => void;

  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // Sync
  setAll: (data: Partial<HabitsState>) => void;
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      waterLogs: {},
      detailedWaterLogs: {},
      baseWaterGoal: 3.0,
      moodLogs: {},
      streakCount: 0,
      lastStreakUpdate: null,
      meditationLogs: {},
      meditationGoal: 15,
      stepsLogs: {},
      detailedStepsLogs: {},
      stepGoal: 1000,
      prayerLogs: {},
      prayerAlarms: [],
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setWaterGoal: (amount) => set({ baseWaterGoal: amount }),

      logWater: (date, amount, type = "cup") =>
        set((state) => {
          const currentTotal = state.waterLogs[date] || 0;
          const newTotal = parseFloat((currentTotal + amount).toFixed(2));
          
          const newEntry: WaterEntry = {
            id: Math.random().toString(36).substring(2, 9),
            amount,
            timestamp: new Date().toISOString(),
            type,
          };

          const currentDetailed = state.detailedWaterLogs[date] || [];
          const updatedDetailed = [newEntry, ...currentDetailed];
          
          // Trigger gamification side effect via Event Seam
          eventBus.publish("WATER_LOGGED", { amount });
          
          return {
            waterLogs: { ...state.waterLogs, [date]: newTotal },
            detailedWaterLogs: { ...state.detailedWaterLogs, [date]: updatedDetailed },
          };
        }),

      removeWaterLog: (date, logId) =>
        set((state) => {
          const currentDetailed = state.detailedWaterLogs[date] || [];
          const logToRemove = currentDetailed.find((l) => l.id === logId);
          if (!logToRemove) return state;

          const newDetailed = currentDetailed.filter((l) => l.id !== logId);
          const currentTotal = state.waterLogs[date] || 0;
          const newTotal = parseFloat(Math.max(0, currentTotal - logToRemove.amount).toFixed(2));

          return {
            waterLogs: { ...state.waterLogs, [date]: newTotal },
            detailedWaterLogs: { ...state.detailedWaterLogs, [date]: newDetailed },
          };
        }),

      logMood: (log) =>
        set((state) => {
          const today = getTodayDateString();
          let newStreak = state.streakCount;
          
          if (isStreakBroken(state.lastStreakUpdate, today)) {
            newStreak = 1;
          } else if (shouldUpdateStreak(state.lastStreakUpdate, today)) {
            newStreak += 1;
          }

          // Trigger gamification side effect via Event Seam
          eventBus.publish("MOOD_LOGGED", { moodValue: log.moodValue, streak: newStreak });

          return {
            moodLogs: { ...state.moodLogs, [log.date]: log },
            streakCount: newStreak,
            lastStreakUpdate: today,
          };
        }),

      removeMoodLog: (date) =>
        set((state) => {
          const newMoodLogs = { ...state.moodLogs };
          delete newMoodLogs[date];
          return { moodLogs: newMoodLogs };
        }),

      setMeditationGoal: (goal) => set({ meditationGoal: goal }),

      logMeditation: (date, minutes) =>
        set((state) => {
          const current = state.meditationLogs[date] || 0;
          const newTotal = current + minutes;
          
          // Trigger gamification side effect via Event Seam
          eventBus.publish("MEDITATION_LOGGED", { minutes, totalMinutes: newTotal });

          return {
            meditationLogs: { ...state.meditationLogs, [date]: newTotal },
          };
        }),

      removeMeditationLog: (date) =>
        set((state) => {
          const newMeditationLogs = { ...state.meditationLogs };
          delete newMeditationLogs[date];
          return { meditationLogs: newMeditationLogs };
        }),

      setStepGoal: (goal) => set({ stepGoal: goal }),

      logSteps: (date, steps, mode, source = "manual") =>
        set((state) => {
          const currentTotal = state.stepsLogs[date] || 0;
          const currentDetailed = state.detailedStepsLogs[date] || [];
          let addedSteps = 0;
          let newTotal = 0;

          if (mode === "add") {
            addedSteps = steps;
            newTotal = currentTotal + steps;
          } else {
            // mode === "set"
            const sourceTotalSoFar = currentDetailed
              .filter(l => l.source === source)
              .reduce((sum, l) => sum + l.amount, 0);
            
            addedSteps = Math.max(0, steps - sourceTotalSoFar);
            newTotal = currentTotal + addedSteps;
          }

          if (addedSteps <= 0) return state;
          
          const newEntry: StepEntry = {
            id: Math.random().toString(36).substring(2, 9),
            amount: addedSteps,
            timestamp: new Date().toISOString(),
            source,
          };
          const updatedDetailed = [newEntry, ...currentDetailed];

          return {
            stepsLogs: {
              ...state.stepsLogs,
              [date]: newTotal,
            },
            detailedStepsLogs: {
              ...state.detailedStepsLogs,
              [date]: updatedDetailed,
            }
          };
        }),

      removeStepLog: (date, logId) =>
        set((state) => {
          const currentDetailed = state.detailedStepsLogs[date] || [];
          const logToRemove = currentDetailed.find(l => l.id === logId);
          if (!logToRemove) return state;

          const newDetailed = currentDetailed.filter(l => l.id !== logId);
          const currentTotal = state.stepsLogs[date] || 0;
          const newTotal = Math.max(0, currentTotal - logToRemove.amount);

          return {
            stepsLogs: { ...state.stepsLogs, [date]: newTotal },
            detailedStepsLogs: { ...state.detailedStepsLogs, [date]: newDetailed },
          };
        }),

      logPrayer: (date, prayerName) =>
        set((state) => {
          const current = state.prayerLogs[date] || [];
          if (current.includes(prayerName)) return state;
          
          // Trigger gamification side effect via Event Seam
          eventBus.publish("PRAYER_LOGGED", { prayerName });
          
          return {
            prayerLogs: {
              ...state.prayerLogs,
              [date]: [...current, prayerName],
            },
          };
        }),

      removePrayerLog: (date, prayerName) =>
        set((state) => ({
          prayerLogs: {
            ...state.prayerLogs,
            [date]: (state.prayerLogs[date] || []).filter(p => p !== prayerName),
          },
        })),

      togglePrayerAlarm: (name) =>
        set((state) => ({
          prayerAlarms: state.prayerAlarms.includes(name)
            ? state.prayerAlarms.filter((a) => a !== name)
            : [...state.prayerAlarms, name],
        })),

      setAll: (data) => set((state) => ({ ...state, ...data })),
    }),
    {
      name: "moodbloom-habits",
      partialize: (state) => {
        const { _hasHydrated, ...rest } = state;
        return rest;
      },
      onRehydrateStorage: () => (state, error) => {
        if (!error && state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
