import { getTodayDateString } from "./dateUtils";
import { WellnessState } from "../types/wellness";

/**
 * Wellness Logic Engine
 * 100-Year Experience approach: Pure, predictable, and robust.
 */

export const calculateDailyWellnessScore = (state: WellnessState, date: string = getTodayDateString()): number => {
  const water = state.waterLogs[date] || 0;
  const steps = state.stepsLogs[date] || 0;
  const meditation = state.meditationLogs[date] || 0;
  const prayers = state.prayerLogs[date]?.length || 0;

  // Weighted Scoring System (Professional Grade)
  const weights = {
    water: 0.2,      // 20%
    steps: 0.3,      // 30%
    meditation: 0.2, // 20%
    prayers: 0.3     // 30%
  };

  const scores = {
    water: Math.min(water / state.baseWaterGoal, 1),
    steps: Math.min(steps / state.stepGoal, 1),
    meditation: Math.min(meditation / state.meditationGoal, 1),
    prayers: Math.min(prayers / 5, 1) // Standard 5 prayers
  };

  const totalScore = (
    scores.water * weights.water +
    scores.steps * weights.steps +
    scores.meditation * weights.meditation +
    scores.prayers * weights.prayers
  ) * 100;

  return Math.round(totalScore);
};

export const shouldUpdateStreak = (lastUpdate: string | null, today: string = getTodayDateString()): boolean => {
  if (!lastUpdate) return true;
  if (lastUpdate === today) return false;

  const lastDate = new Date(lastUpdate);
  const todayDate = new Date(today);
  const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays === 1;
};

export const isStreakBroken = (lastUpdate: string | null, today: string = getTodayDateString()): boolean => {
  if (!lastUpdate) return false;
  const lastDate = new Date(lastUpdate);
  const todayDate = new Date(today);
  const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 1;
};
