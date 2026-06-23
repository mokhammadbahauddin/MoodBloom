import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppSettings {
  focusDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  waterGoalML: number; // in ml
  theme: "system" | "light" | "dark";
  accent: "blue" | "green" | "orange" | "purple";
  stravaConnected?: boolean;
  stravaAccessToken?: string;
  stravaRefreshToken?: string;
  stravaExpiresAt?: number;
  appleHealthConnected?: boolean;
  religion: "islam" | "other"; // To toggle Islamic features
  manualLocation?: string; // e.g. "Jakarta, Indonesia"
  manualLat?: number;
  manualLng?: number;
  focusTarget: number; // in minutes
  userAvatar?: string;
  userBio?: string;
  notificationPreferences?: {
    focus: boolean;
    water: boolean;
    mood: boolean;
  };
}

interface SettingsState {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setAllSettings: (settings: AppSettings) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  syncStatus: 'saved' | 'saving' | 'error';
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        focusDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        waterGoalML: 3000,
        theme: "system",
        accent: "blue",
        religion: "islam",
        focusTarget: 120,
        userAvatar: "👤",
        userBio: "Penjelajah Oasis",
        notificationPreferences: {
          focus: true,
          water: true,
          mood: true,
        },
        stravaConnected: false,
        appleHealthConnected: false,
      },
      syncStatus: 'saved',
      updateSettings: (partialSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...partialSettings },
        })),
      setAllSettings: (settings) => set({ settings }),
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "moodbloom-settings",
      partialize: (state) => {
        const { _hasHydrated, syncStatus, ...rest } = state;
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
