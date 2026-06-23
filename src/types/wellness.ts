/**
 * Wellness Types & Models
 * Professional definitions for the MoodBloom ecosystem.
 */

export type MoodValue = 1 | 2 | 3 | 4; // 1: Poor, 2: Neutral, 3: Good, 4: Excellent

export interface MoodLog {
  date: string; // YYYY-MM-DD
  moodValue: MoodValue;
  sleepValue: number; // Hours
  factors: string[];
  notes: string;
}

export interface WaterLog {
  [date: string]: number; // Total liters
}

export interface StepLog {
  [date: string]: number; // Total steps
}

export interface MeditationLog {
  [date: string]: number; // Total minutes
}

export interface PrayerLog {
  [date: string]: string[]; // List of prayer names logged
}

export interface WellnessState {
  waterLogs: WaterLog;
  moodLogs: { [date: string]: MoodLog };
  stepsLogs: StepLog;
  meditationLogs: MeditationLog;
  prayerLogs: PrayerLog;
  streakCount: number;
  lastStreakUpdate: string | null;
  baseWaterGoal: number;
  stepGoal: number;
  meditationGoal: number;
}

export interface Task {
  id: string;
  title: string;
  time: string;
  type: string;
  completed: boolean;
  priority: boolean;
  priorityLevel?: "Low" | "Medium" | "High";
  scheduleId?: string;
  subTasks?: { id: string; title: string; completed: boolean }[];
}

export interface ClassSchedule {
  id: string;
  className: string;
  room: string;
  day: number; // 0-6
  startTime: string;
  endTime: string;
  startDate?: string;
  endDate?: string;
}

export interface UserSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  waterGoalML: number;
  theme: "system" | "light" | "dark";
  accent: "blue" | "green" | "orange" | "purple";
  stravaConnected: boolean;
  appleHealthConnected: boolean;
}

export interface WellnessStateSnapshot {
  userName: string;
  focusAreas: string[];
  waterLogs: Record<string, number>;
  detailedWaterLogs: Record<string, any[]>;
  baseWaterGoal: number;
  moodLogs: Record<string, any>;
  streakCount: number;
  lastStreakUpdate: string | null;
  meditationLogs: Record<string, number>;
  meditationGoal: number;
  stepsLogs: Record<string, number>;
  detailedStepsLogs: Record<string, any[]>;
  stepGoal: number;
  prayerLogs: Record<string, string[]>;
  prayerAlarms: string[];
  schedules: any[];
  tasks: any[];
  settings: any;
  currentWeather: { temperature: number; conditionCode: number; isHot: boolean } | null;
}

