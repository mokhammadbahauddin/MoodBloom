import { useState, useMemo } from "react";
import { useUserStore, DEFAULT_ACHIEVEMENTS } from "../lib/userStore";
import { useProductivityStore } from "../lib/productivityStore";;
import { useHabitsStore } from "../lib/habitsStore";
import { useSettingsStore } from '../lib/settingsStore';
import { auth } from "../lib/firebase";
import { getPast7Days } from "../lib/dateUtils";
import { getHealthBatteryInsight, generateFullWellnessAnalysis, generateWeeklySynthesis, generatePredictiveInsight } from "../services/heuristicInsightEngine";
import {
  calculateStreak,
  mapMoodToScore,
  mapSleepToHours,
  mapEnergyToLevel,
  calculateAverages,
  calculateFactorsData,
  calculateRadarData
} from "../utils/statsUtils";

export function useStatsData(isActive = true) {
  const [timeRange, setTimeRange] = useState("30D");
  const [isComparison, setIsComparison] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const userId = auth.currentUser?.uid || "GUEST-OASIS";
  const userName = useUserStore((state) => state.userName) || "User";
  const waterLogs = useHabitsStore((state) => state.waterLogs) || {};
  const moodLogs = useHabitsStore((state) => state.moodLogs) || {};
  const baseWaterGoal = useHabitsStore((state) => state.baseWaterGoal) || 2;
  const focusAreas = useUserStore(state => state.focusAreas) || [];
  const storeAchievements = useUserStore(state => state.achievements) || [];
  
  const achievements = useMemo(() => {
    return DEFAULT_ACHIEVEMENTS.map(defAch => {
      const stored = storeAchievements.find(a => a.id === defAch.id);
      return stored ? { ...defAch, unlockedAt: stored.unlockedAt } : defAch;
    });
  }, [storeAchievements]);
  
  const stepsLogs = useHabitsStore((state) => state.stepsLogs) || {};
  const stepGoal = useHabitsStore((state) => state.stepGoal) || 1000;
  const meditationLogs = useHabitsStore((state) => state.meditationLogs) || {};
  const meditationGoal = useHabitsStore((state) => state.meditationGoal) || 15;
  const prayerLogs = useHabitsStore(state => state.prayerLogs) || {};
  const focusLogs = useProductivityStore(state => state.focusLogs) || [];
  const settings = useSettingsStore((state) => state.settings) || { focusTarget: 120 };
  const focusTarget = settings.focusTarget || 120;
  const weeklyCoachingReport = useUserStore((state) => (state as any).weeklyCoachingReport);
  const aiAnalysis = useUserStore((state) => state.aiAnalysis);
  
  const stateForHeuristic = useMemo(() => {
    if (!isActive) return {} as any;
    return {
      userName,
      waterLogs,
      moodLogs,
      baseWaterGoal,
      stepsLogs,
      stepGoal,
      meditationLogs,
      meditationGoal,
      prayerLogs,
      focusLogs,
      settings,
      weeklyCoachingReport,
    } as any;
  }, [
    isActive,
    userName,
    waterLogs,
    moodLogs,
    baseWaterGoal,
    stepsLogs,
    stepGoal,
    meditationLogs,
    meditationGoal,
    prayerLogs,
    focusLogs,
    settings,
    weeklyCoachingReport,
  ]);

  const streakData = useMemo(() => {
    if (!isActive) return { currentStreak: 0, totalActive: 0, isActiveToday: false };
    return calculateStreak(moodLogs, waterLogs, baseWaterGoal);
  }, [isActive, moodLogs, waterLogs, baseWaterGoal]);

  const getPastDateStr = (dateStr: string, subtractDays: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - subtractDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const correlationData = useMemo(() => {
    if (!isActive) return [];
    const past7 = getPast7Days();
    return past7.map((d) => {
      const w = waterLogs[d.dateStr] || 0;
      const m = moodLogs[d.dateStr];
      const s = stepsLogs[d.dateStr] || 0;
      const med = (meditationLogs[d.dateStr] || 0) as number;
      const pray = (prayerLogs[d.dateStr]?.length || 0) as number;
      const focus = (focusLogs || []).filter(f => f.date === d.dateStr).reduce((sum, f) => sum + f.minutes, 0);
      
      const prevW = waterLogs[getPastDateStr(d.dateStr, 7)] || 0;
      const prevM = moodLogs[getPastDateStr(d.dateStr, 7)];

      const sleepHours = m ? mapSleepToHours(m.sleepValue) : 0;
      const prevSleepHours = prevM ? mapSleepToHours(prevM.sleepValue) : 0;

      return {
        date: d.dateStr,
        day: d.dayLabel,
        waterIntake: w,
        prevWaterIntake: prevW,
        steps: s,
        meditation: med,
        prayerCount: pray,
        focusMinutes: focus,
        sleepHours,
        prevSleepHours,
        moodScore: m ? mapMoodToScore(m.moodValue) : 0,
        prevMoodScore: prevM ? mapMoodToScore(prevM.moodValue) : 0,
        energyLevel: mapEnergyToLevel(w, sleepHours, baseWaterGoal),
        prevEnergyLevel: mapEnergyToLevel(prevW, prevSleepHours, baseWaterGoal),
        notes: m?.notes || "",
      };
    });
  }, [isActive, waterLogs, moodLogs, stepsLogs, meditationLogs, prayerLogs, focusLogs, baseWaterGoal]);

  const factorsData = useMemo(() => {
    if (!isActive) return [];
    return calculateFactorsData(moodLogs);
  }, [isActive, moodLogs]);

  const averages = useMemo(() => {
    if (!isActive) return { avgWater: 0, prevAvgWater: 0, avgSleep: 0, prevAvgSleep: 0, avgMood: 0, prevAvgMood: 0 };
    return calculateAverages(correlationData);
  }, [isActive, correlationData]);

  const stats = useMemo(() => {
    if (!isActive) return [];
    const { avgWater, prevAvgWater, avgSleep, prevAvgSleep, avgMood, prevAvgMood } = averages;
    const waterDelta = (avgWater - prevAvgWater).toFixed(1);
    const sleepDelta = (avgSleep - prevAvgSleep).toFixed(1);
    const moodDelta = Math.round(avgMood - prevAvgMood);

    const healthBattery = getHealthBatteryInsight(stateForHeuristic);

    return [
      {
        label: "Baterai Tubuh",
        value: healthBattery.value,
        interpretation: `Status: ${healthBattery.status}`,
        img: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Battery.png",
        color: "bg-emerald-500/10",
        desc: "Kesehatan Fisik & Mental",
        delta: streakData.totalActive > 0 ? "Live" : "No Data",
        deltaType: "up",
        status: healthBattery.status,
        statusColor: healthBattery.color,
      },
      {
        label: "Konsumsi Air",
        value: `${(Number(avgWater) || 0).toFixed(1)}L`,
        interpretation: (Number(avgWater) || 0) >= (Number(baseWaterGoal) || 2) ? "Mencapai Target" : "Kurang Hidrasi",
        img: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Droplet.png",
        color: "bg-blue-500/10",
        desc: `Target Harian: ${(Number(baseWaterGoal) || 2).toFixed(1)}L`,
        delta: `${parseFloat(waterDelta) >= 0 ? "+" : ""}${waterDelta}L`,
        deltaType: parseFloat(waterDelta) >= 0 ? "up" : "down",
        status: (Number(avgWater) || 0) >= (Number(baseWaterGoal) || 2) ? "Optimal" : "Perlu Minum",
        statusColor: (Number(avgWater) || 0) >= (Number(baseWaterGoal) || 2) ? "text-blue-500" : "text-amber-500",
      },
      {
        label: "Kualitas Tidur",
        value: `${(Number(avgSleep) || 0).toFixed(1)}j`,
        interpretation: (Number(avgSleep) || 0) >= 7 ? "Istirahat Cukup" : "Kurang Istirahat",
        img: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Crescent%20Moon.png",
        color: "bg-indigo-500/10",
        desc: "Ideal: 7-9 jam/malam",
        delta: `${parseFloat(sleepDelta) >= 0 ? "+" : ""}${sleepDelta}j`,
        deltaType: parseFloat(sleepDelta) >= 0 ? "up" : "down",
        status: avgSleep >= 7 ? "Stabil" : "Risiko Lelah",
        statusColor: avgSleep >= 7 ? "text-indigo-500" : "text-red-500",
      },
      {
        label: "Kesehatan Mental",
        value: `${Math.round(avgMood)}%`,
        interpretation: avgMood >= 75 ? "Kondisi Prima" : "Butuh Self-Care",
        img: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Sparkles.png",
        color: "bg-amber-500/10",
        desc: "Berdasarkan Jurnal Anda",
        delta: `${moodDelta >= 0 ? "+" : ""}${moodDelta}%`,
        deltaType: moodDelta >= 0 ? "up" : "down",
        status: avgMood >= 75 ? "Sangat Baik" : "Waspada Stres",
        statusColor: avgMood >= 75 ? "text-amber-500" : "text-rose-500",
      },
    ];
  }, [isActive, averages, baseWaterGoal, stateForHeuristic, streakData.totalActive]);

  const storySummary = useMemo(() => {
    if (!isActive) return "";
    return generateWeeklySynthesis(stateForHeuristic);
  }, [isActive, stateForHeuristic]);

  const fullWellnessAnalysis = useMemo(() => {
    if (!isActive) return { recommendations: [] } as any;
    return generateFullWellnessAnalysis(stateForHeuristic);
  }, [isActive, stateForHeuristic]);

  const dynamicRecommendations = useMemo(() => {
    if (!isActive) return [];
    return aiAnalysis?.recommendations || fullWellnessAnalysis.recommendations;
  }, [isActive, aiAnalysis, fullWellnessAnalysis.recommendations]);

  const radarData = useMemo(() => {
    if (!isActive) return [];
    return calculateRadarData(correlationData, baseWaterGoal, stepGoal, focusTarget);
  }, [isActive, correlationData, baseWaterGoal, stepGoal, focusTarget]);

  const predictiveInsight = useMemo(() => {
    if (!isActive) return "";
    return generatePredictiveInsight(stateForHeuristic);
  }, [isActive, stateForHeuristic]);

  return {
    timeRange, setTimeRange,
    isComparison, setIsComparison,
    selectedDay, setSelectedDay,
    userId, userName, waterLogs, moodLogs, focusAreas, achievements,
    streakData, correlationData, factorsData, averages, stats,
    storySummary, fullWellnessAnalysis, dynamicRecommendations, radarData,
    predictiveInsight,
    mapSleepToHours, mapEnergyToLevel, stateForHeuristic,
    baseWaterGoal, weeklyCoachingReport, aiAnalysis
  };
}
