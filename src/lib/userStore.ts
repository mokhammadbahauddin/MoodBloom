import { create } from "zustand";
import { persist } from "zustand/middleware";
import { eventBus } from "./eventBus";
import { checkMoodStreakAchievements } from "./domain/gamification";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: string | null;
  icon: string;
}

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_water",
    title: "Tetesan Pertama",
    description: "Mencatat minum air untuk pertama kalinya.",
    unlockedAt: null,
    icon: "💧",
  },
  {
    id: "water_master_3",
    title: "Si Unta",
    description: "Mencapai target air 3 hari berturut-turut.",
    unlockedAt: null,
    icon: "🐪",
  },
  {
    id: "focus_master",
    title: "Master Fokus",
    description: "Menyelesaikan timer fokus.",
    unlockedAt: null,
    icon: "🧠",
  },
  {
    id: "mood_explorer",
    title: "Jejak Perasaan",
    description: "Mengisi jurnal mood pertama kali.",
    unlockedAt: null,
    icon: "🌟",
  },
  {
    id: "streak_7",
    title: "Konsisten Seminggu",
    description: "Mencapai 7 hari streak check-in mood.",
    unlockedAt: null,
    icon: "🔥",
  },
  {
    id: "streak_30",
    title: "Bulan Bersemi",
    description: "Mencapai 30 hari streak check-in mood.",
    unlockedAt: null,
    icon: "🏅",
  },
  {
    id: "streak_100",
    title: "Legenda Oasis",
    description: "Mencapai 100 hari streak check-in mood.",
    unlockedAt: null,
    icon: "👑",
  },
  {
    id: "zen_master",
    title: "Zen Master",
    description: "Mencapai total 60 menit meditasi.",
    unlockedAt: null,
    icon: "🧘",
  },
];

interface UserState {
  userName: string;
  hasCompletedOnboarding: boolean;
  focusAreas: string[];
  achievements: Achievement[];
  xp: number;
  level: number;
  aiAnalysis: any | null;
  weeklyCoachingReport: any | null;
  currentWeather: { temperature: number; conditionCode: number; isHot: boolean } | null;
  activeChatContext: string | null;
  isFasting: boolean;

  setUserName: (name: string) => void;
  completeOnboarding: (name: string, areas: string[]) => void;
  unlockAchievement: (id: string) => void;
  addXP: (amount: number) => void;
  setAiAnalysis: (analysis: any) => void;
  setWeeklyCoachingReport: (report: any) => void;
  setWeather: (weather: any) => void;
  setActiveChatContext: (context: string | null) => void;
  setIsFasting: (fasting: boolean) => void;
  
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setAll: (data: Partial<UserState>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userName: "",
      hasCompletedOnboarding: false,
      focusAreas: [],
      achievements: DEFAULT_ACHIEVEMENTS,
      xp: 0,
      level: 1,
      aiAnalysis: null,
      weeklyCoachingReport: null,
      currentWeather: null,
      activeChatContext: null,
      isFasting: false,
      _hasHydrated: false,

      setUserName: (name) => set({ userName: name }),
      completeOnboarding: (name, areas) => set({
        hasCompletedOnboarding: true,
        userName: name,
        focusAreas: areas,
      }),
      unlockAchievement: (id) => set((state) => {
        const ach = state.achievements.find((a) => a.id === id);
        if (ach && !ach.unlockedAt) {
          return {
            achievements: state.achievements.map((a) =>
              a.id === id ? { ...a, unlockedAt: new Date().toISOString() } : a
            ),
          };
        }
        return state;
      }),
      addXP: (amount) => set((state) => {
        if (!amount || isNaN(amount)) return {};
        const newXP = (state.xp || 0) + amount;
        const nextLevelXP = (state.level || 1) * 1000;
        if (newXP >= nextLevelXP) {
          return { xp: newXP - nextLevelXP, level: (state.level || 1) + 1 };
        }
        return { xp: newXP };
      }),
      setAiAnalysis: (analysis) => set({ aiAnalysis: analysis }),
      setWeeklyCoachingReport: (report) => set({ weeklyCoachingReport: report }),
      setWeather: (weather) => set({ currentWeather: weather }),
      setActiveChatContext: (context) => set({ activeChatContext: context }),
      setIsFasting: (fasting) => set({ isFasting: fasting }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setAll: (data) => set((state) => ({ ...state, ...data })),
    }),
    {
      name: "moodbloom-user",
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

// Subscribe to domain events to apply gamification logic
eventBus.subscribe("WATER_LOGGED", () => {
  useUserStore.getState().addXP(10);
});

eventBus.subscribe("MOOD_LOGGED", ({ streak }) => {
  const store = useUserStore.getState();
  store.addXP(50);
  const achievementsToUnlock = checkMoodStreakAchievements(streak);
  achievementsToUnlock.forEach(id => store.unlockAchievement(id));
});

eventBus.subscribe("MEDITATION_LOGGED", ({ minutes, totalMinutes }) => {
  const store = useUserStore.getState();
  store.addXP(minutes * 5);
  if (totalMinutes >= 60) {
    store.unlockAchievement("zen_master");
  }
});

eventBus.subscribe("PRAYER_LOGGED", () => {
  useUserStore.getState().addXP(30);
});

eventBus.subscribe("FOCUS_SESSION_COMPLETED", ({ minutes, totalSessions }) => {
  const store = useUserStore.getState();
  store.addXP(Math.round(minutes * 5));
  if (totalSessions >= 1) {
    store.unlockAchievement("focus_master");
  }
});

