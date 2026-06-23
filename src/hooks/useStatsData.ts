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
  calculateRadarData,
  calculatePearsonCorrelation,
  runKMeansClustering,
  KMeanPoint,
  KMeansResult
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

  function getCorrelationDesc(r: number): string {
    if (isNaN(r) || r === 0) return "Tidak cukup data";
    const absR = Math.abs(r);
    let strength = "";
    if (absR >= 0.7) strength = "Sangat Kuat";
    else if (absR >= 0.4) strength = "Sedang / Signifikan";
    else if (absR >= 0.1) strength = "Lemah";
    else strength = "Sangat Lemah";
    
    return `${strength} (${r >= 0 ? "Positif" : "Negatif"})`;
  }

  const { correlationResults, kmeansResult } = useMemo(() => {
    if (!isActive) {
      return {
        correlationResults: [],
        kmeansResult: { centroids: [], points: [], clusterDescriptions: [] } as KMeansResult
      };
    }
    
    const allDates = Array.from(new Set([
      ...Object.keys(moodLogs),
      ...Object.keys(waterLogs),
      ...Object.keys(stepsLogs),
      ...Object.keys(meditationLogs),
      ...(focusLogs || []).map(f => f.date)
    ])).sort();
    
    const sleepArray: number[] = [];
    const waterArray: number[] = [];
    const stepsArray: number[] = [];
    const meditationArray: number[] = [];
    const focusArray: number[] = [];
    const moodArray: number[] = [];
    
    const points: KMeanPoint[] = [];
    
    allDates.forEach((dateStr) => {
      const w = waterLogs[dateStr] || 0;
      const m = moodLogs[dateStr];
      const s = stepsLogs[dateStr] || 0;
      const med = (meditationLogs[dateStr] || 0) as number;
      const focus = (focusLogs || []).filter(f => f.date === dateStr).reduce((sum, f) => sum + f.minutes, 0);
      
      const sleepHours = m ? mapSleepToHours(m.sleepValue) : 0;
      const moodScore = m ? mapMoodToScore(m.moodValue) : 0;
      
      if (m) {
        sleepArray.push(sleepHours);
        waterArray.push(w);
        stepsArray.push(s);
        meditationArray.push(med);
        focusArray.push(focus);
        moodArray.push(moodScore);
      }
      
      points.push({
        date: dateStr,
        features: [sleepHours || 6, w || 1.5, s || 3000, med || 10, focus || 30, moodScore || 60]
      });
    });
    
    const rSleep = calculatePearsonCorrelation(sleepArray, moodArray);
    const rWater = calculatePearsonCorrelation(waterArray, moodArray);
    const rSteps = calculatePearsonCorrelation(stepsArray, moodArray);
    const rMeditation = calculatePearsonCorrelation(meditationArray, moodArray);
    const rFocus = calculatePearsonCorrelation(focusArray, moodArray);
    
    const correlationResults = [
      { name: "Durasi Tidur", r: rSleep, desc: getCorrelationDesc(rSleep) },
      { name: "Asupan Air", r: rWater, desc: getCorrelationDesc(rWater) },
      { name: "Langkah Kaki", r: rSteps, desc: getCorrelationDesc(rSteps) },
      { name: "Meditasi (menit)", r: rMeditation, desc: getCorrelationDesc(rMeditation) },
      { name: "Waktu Fokus (menit)", r: rFocus, desc: getCorrelationDesc(rFocus) },
    ];
    
    const kmeansResult = runKMeansClustering(points, Math.min(3, points.length));
    
    return { correlationResults, kmeansResult };
  }, [isActive, moodLogs, waterLogs, stepsLogs, meditationLogs, focusLogs]);

  const stats = useMemo(() => {
    if (!isActive) return [];
    const { avgWater, prevAvgWater, avgSleep, prevAvgSleep, avgMood, prevAvgMood } = averages;
    const waterDelta = (avgWater - prevAvgWater).toFixed(1);
    const sleepDelta = (avgSleep - prevAvgSleep).toFixed(1);
    const moodDelta = Math.round(avgMood - prevAvgMood);

    // K-Means powered Body Battery calculations
    let batteryValue = "75%";
    let batteryStatus = "Seimbang";
    let batteryInterpretation = "Kondisi tubuh cukup stabil.";
    let batteryColor = "text-indigo-500";
    let statusBgColor = "bg-indigo-500/10";

    if (kmeansResult && kmeansResult.points && kmeansResult.points.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayAssignment = kmeansResult.points.find((p: any) => p.point.date === todayStr);
      const todayClusterIdx = todayAssignment ? todayAssignment.clusterIndex : 0;
      const todayClusterLabel = kmeansResult.clusterDescriptions[todayClusterIdx] || "";

      if (todayClusterLabel.includes("Oasis")) {
        batteryValue = "95%";
        batteryStatus = "Prima";
        batteryInterpretation = "Fisik & Mental di kondisi puncak.";
        batteryColor = "text-emerald-500";
        statusBgColor = "bg-emerald-500/10";
      } else if (todayClusterLabel.includes("Kritis")) {
        batteryValue = "45%";
        batteryStatus = "Lelah";
        batteryInterpretation = "Risiko stres tinggi. Butuh self-care.";
        batteryColor = "text-rose-500";
        statusBgColor = "bg-rose-500/10";
      } else {
        batteryValue = "75%";
        batteryStatus = "Cukup";
        batteryInterpretation = "Kondisi fisik stabil dan berimbang.";
        batteryColor = "text-indigo-500";
        statusBgColor = "bg-indigo-500/10";
      }
    } else {
      const hb = getHealthBatteryInsight(stateForHeuristic);
      batteryValue = hb.value;
      batteryStatus = hb.status;
      batteryInterpretation = hb.status === "Optimal" ? "Prima (Optimal)" : hb.status === "Perlu Pemulihan" ? "Lelah (Butuh Rehat)" : "Cukup (Normal)";
      batteryColor = hb.color === "text-emerald-500" ? "text-emerald-500" : hb.color === "text-rose-500" ? "text-rose-500" : "text-indigo-500";
      statusBgColor = hb.color === "text-emerald-500" ? "bg-emerald-500/10" : hb.color === "text-rose-500" ? "bg-rose-500/10" : "bg-indigo-500/10";
    }

    return [
      {
        label: "Baterai Tubuh",
        value: batteryValue,
        interpretation: batteryInterpretation,
        img: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Battery.png",
        color: statusBgColor,
        desc: "Kesehatan Fisik & Mental",
        delta: streakData.totalActive > 0 ? "Live" : "No Data",
        deltaType: "up",
        status: batteryStatus,
        statusColor: batteryColor,
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
  }, [isActive, averages, baseWaterGoal, stateForHeuristic, streakData.totalActive, kmeansResult]);

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

  const lifeBalanceData = useMemo(() => {
    if (!isActive) {
      return [
        { label: "Kejernihan Mental", value: 50, color: "bg-amber-500", text: "text-amber-500" },
        { label: "Kekuatan Fisik", value: 50, color: "bg-emerald-500", text: "text-emerald-500" },
        { label: "Harmoni Sosial", value: 50, color: "bg-blue-500", text: "text-blue-500" },
      ];
    }
    const { avgMood, avgWater } = averages;
    const stepsAvg = correlationData.reduce((sum, d) => sum + d.steps, 0) / (correlationData.length || 1);
    
    const mentalClarity = Math.min(100, Math.max(0, Math.round(avgMood || 70)));
    const physicalStrength = Math.min(100, Math.max(0, Math.round(((avgWater / baseWaterGoal) * 50) + ((stepsAvg / stepGoal) * 50))));
    
    const noteCount = correlationData.filter(d => d.notes && d.notes.trim().length > 3).length;
    const socialHarmony = Math.min(100, Math.max(30, Math.round(40 + (noteCount * 10))));

    return [
      { label: "Kejernihan Mental", value: mentalClarity, color: "bg-amber-500", text: "text-amber-500" },
      { label: "Kekuatan Fisik", value: physicalStrength, color: "bg-emerald-500", text: "text-emerald-500" },
      { label: "Harmoni Sosial", value: socialHarmony, color: "bg-blue-500", text: "text-blue-500" },
    ];
  }, [isActive, averages, correlationData, baseWaterGoal, stepGoal]);

  return {
    timeRange, setTimeRange,
    isComparison, setIsComparison,
    selectedDay, setSelectedDay,
    userId, userName, waterLogs, moodLogs, focusAreas, achievements,
    streakData, correlationData, factorsData, averages, stats,
    storySummary, fullWellnessAnalysis, dynamicRecommendations, radarData,
    predictiveInsight,
    mapSleepToHours, mapEnergyToLevel, stateForHeuristic,
    baseWaterGoal, weeklyCoachingReport, aiAnalysis,
    correlationResults, kmeansResult, lifeBalanceData
  };
}
