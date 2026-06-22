export function calculateStreak(
  moodLogs: Record<string, any>,
  waterLogs: Record<string, number>,
  baseWaterGoal: number
) {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentDate = new Date(today);
  const getFormat = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const checkDate = (dateStr: string) => {
    return !!moodLogs[dateStr] || (waterLogs[dateStr] || 0) >= baseWaterGoal;
  };

  if (checkDate(getFormat(currentDate))) {
    streak += 1;
  }

  currentDate.setDate(currentDate.getDate() - 1);

  let historicalStreak = 0;
  let maxSafety = 1000;
  while (maxSafety > 0) {
    maxSafety--;
    if (checkDate(getFormat(currentDate))) {
      historicalStreak += 1;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  const allDates = new Set([
    ...Object.keys(moodLogs),
    ...Object.keys(waterLogs),
  ]);

  return {
    currentStreak: streak + historicalStreak,
    totalActive: allDates.size,
    isActiveToday: streak > 0,
  };
}

export function mapMoodToScore(val?: number): number {
  if (!val) return 0;
  if (val >= 5) return 100;
  if (val === 4) return 80;
  if (val === 3) return 60;
  if (val === 2) return 40;
  if (val === 1) return 20;
  return 0;
}

export function mapSleepToHours(val?: number): number {
  if (!val) return 0;
  if (val >= 5) return 9;
  if (val === 4) return 8;
  if (val === 3) return 7;
  if (val === 2) return 5;
  if (val === 1) return 4;
  return 0;
}

export function mapEnergyToLevel(water: number, sleep: number, baseWaterGoal: number): number {
  const wScore = Math.min((Number(water) / (Number(baseWaterGoal) || 2)) * 50, 50);
  const sScore = Math.min((Number(sleep) / 8) * 50, 50);
  return Math.round(wScore + sScore);
}

export function calculateAverages(correlationData: any[]) {
  const current7 = correlationData.filter(
    (d) => d.moodScore > 0 || d.waterIntake > 0,
  );
  const prev7 = correlationData.filter(
    (d) => d.prevMoodScore > 0 || d.prevWaterIntake > 0,
  );

  const avgWater =
    current7.reduce((sum, d) => sum + d.waterIntake, 0) /
    (current7.length || 1);
  const prevAvgWater =
    prev7.reduce((sum, d) => sum + d.prevWaterIntake, 0) /
    (prev7.length || 1);

  const avgSleep =
    current7.reduce((sum, d) => sum + d.sleepHours, 0) /
    (current7.length || 1);
  const prevAvgSleep =
    prev7.reduce((sum, d) => sum + d.prevSleepHours, 0) / (prev7.length || 1);

  const avgMood =
    current7.reduce((sum, d) => sum + d.moodScore, 0) /
    (current7.length || 1);
  const prevAvgMood =
    prev7.reduce((sum, d) => sum + d.prevMoodScore, 0) / (prev7.length || 1);

  return {
    avgWater,
    prevAvgWater,
    avgSleep,
    prevAvgSleep,
    avgMood,
    prevAvgMood,
    current7,
    prev7
  };
}

export function calculateFactorsData(moodLogs: Record<string, any>) {
  const labels = ["Fokus", "Energi", "Kuliah", "Stres", "Hubungan"];
  const counts: Record<string, number> = {};
  labels.forEach((l) => (counts[l] = 0));

  Object.values(moodLogs || {}).forEach((log) => {
    if (!log) return;
    (log.factors || []).forEach((fIdx: string) => {
      const idx = parseInt(fIdx);
      if (idx >= 0 && idx < labels.length) {
        counts[labels[idx]]++;
      }
    });
  });

  return Object.entries(counts)
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count);
}

export function calculateRadarData(
  correlationData: any[],
  baseWaterGoal: number,
  stepGoal: number,
  focusTarget: number
) {
  const validDays = correlationData.filter(d => d.moodScore > 0);
  if (validDays.length === 0) return [];
  
  const avgSleep = validDays.reduce((s, d) => s + d.sleepHours, 0) / validDays.length;
  const avgWater = validDays.reduce((s, d) => s + d.waterIntake, 0) / validDays.length;
  const avgSteps = validDays.reduce((s, d) => s + d.steps, 0) / validDays.length;
  const avgFocus = validDays.reduce((s, d) => s + d.focusMinutes, 0) / validDays.length;
  const avgMood = validDays.reduce((s, d) => s + d.moodScore, 0) / validDays.length;
  
  const sleepScore = Math.min(100, Math.round((avgSleep / 8) * 100));
  const waterScore = Math.min(100, Math.round((avgWater / baseWaterGoal) * 100));
  const stepScore = Math.min(100, Math.round((avgSteps / Math.max(stepGoal, 1)) * 100));
  const focusScore = Math.min(100, Math.round((avgFocus / Math.max(focusTarget, 1)) * 100));
  
  return [
    { subject: "Fokus", A: focusScore, fullMark: 100 },
    { subject: "Hidrasi", A: waterScore, fullMark: 100 },
    { subject: "Tidur", A: sleepScore, fullMark: 100 },
    { subject: "Fisik", A: stepScore, fullMark: 100 },
    { subject: "Mood", A: Math.round(avgMood), fullMark: 100 },
  ];
}
