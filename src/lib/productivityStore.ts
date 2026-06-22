import { create } from "zustand";
import { persist } from "zustand/middleware";
import { eventBus } from "./eventBus";

export interface Task {
  id: string;
  title: string;
  time: string;
  type: string;
  completed: boolean;
  priority?: boolean;
  priorityLevel?: "Low" | "Medium" | "High";
  scheduleId?: string;
  subTasks?: { id: string; title: string; completed: boolean }[];
}

export interface ClassSchedule {
  id: string;
  className: string;
  room: string;
  day: number; // 0-6 (Sun-Sat)
  startTime: string;
  endTime: string;
  startDate?: string;
  endDate?: string;
}

export interface FocusLog {
  id: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  taskId?: string;
}

interface ProductivityState {
  schedules: ClassSchedule[];
  tasks: Task[];
  focusLogs: FocusLog[];
  activeFocusTaskId: string | null;
  deepFocusActive: boolean;
  meditationActive: boolean;

  setSchedules: (schedules: ClassSchedule[] | ((prev: ClassSchedule[]) => ClassSchedule[])) => void;
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
  setActiveFocusTask: (taskId: string | null) => void;
  setDeepFocusActive: (active: boolean) => void;
  setMeditationActive: (active: boolean) => void;
  logFocusSession: (minutes: number, taskId?: string | null) => void;
  resetStore: () => void;
  
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setAll: (data: Partial<ProductivityState>) => void;
}

export const useProductivityStore = create<ProductivityState>()(
  persist(
    (set, get) => ({
      schedules: [
        {
          id: "1",
          className: "Logika Informatika",
          room: "Lab Komputasi",
          day: 1,
          startTime: "08:00",
          endTime: "10:30",
        },
        {
          id: "2",
          className: "Pemrograman Web",
          room: "Lab Komputer 1",
          day: 1,
          startTime: "10:00",
          endTime: "12:30",
        },
      ],
      tasks: [
        {
          id: "1",
          title: "Review Jurnal AI",
          time: "09:00",
          type: "Fokus",
          completed: false,
          priority: true,
        },
        {
          id: "2",
          title: "Meeting Tim Proyek",
          time: "13:00",
          type: "Kuliah",
          completed: false,
        },
        {
          id: "3",
          title: "Update Dashboard",
          time: "15:30",
          type: "Kerja",
          completed: false,
        },
      ],
      focusLogs: [],
      activeFocusTaskId: null,
      deepFocusActive: false,
      meditationActive: false,
      _hasHydrated: false,

      setSchedules: (updater) => set((state) => ({
        schedules: typeof updater === "function" ? updater(state.schedules) : updater,
      })),
      setTasks: (updater) => set((state) => ({
        tasks: typeof updater === "function" ? updater(state.tasks) : updater,
      })),
      setActiveFocusTask: (taskId) => set({ activeFocusTaskId: taskId }),
      setDeepFocusActive: (active) => set({ deepFocusActive: active }),
      setMeditationActive: (active) => set({ meditationActive: active }),
      logFocusSession: (minutes: number, taskId = null) => set((state) => {
        const newFocusLogs = [
          ...(state.focusLogs || []),
          {
            id: Math.random().toString(36).substring(2, 9),
            date: new Date().toISOString().split('T')[0],
            minutes,
            taskId: taskId || undefined,
          },
        ];
        
        // Trigger achievements and XP inside userStore via Event Seam
        eventBus.publish("FOCUS_SESSION_COMPLETED", { minutes, totalSessions: newFocusLogs.length });

        return { focusLogs: newFocusLogs };
      }),
      resetStore: () => set({
        schedules: [],
        tasks: [],
        focusLogs: [],
        activeFocusTaskId: null,
        deepFocusActive: false,
        meditationActive: false,
      }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setAll: (data) => set((state) => ({ ...state, ...data })),
    }),
    {
      name: "moodbloom-productivity",
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
