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

export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let num = 0;
  let denX = 0;
  let denY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }
  
  if (denX === 0 || denY === 0) return 0;
  return num / Math.sqrt(denX * denY);
}

export interface KMeanPoint {
  date: string;
  features: number[];
}

export interface KMeansResult {
  centroids: number[][];
  points: { point: KMeanPoint; clusterIndex: number }[];
  clusterDescriptions: string[];
}

export function runKMeansClustering(data: KMeanPoint[], k = 3, maxIterations = 20): KMeansResult {
  const n = data.length;
  if (n === 0) {
    return { centroids: [], points: [], clusterDescriptions: [] };
  }

  // 1. Min-Max normalization for features (so steps doesn't dominate other features)
  const numFeatures = data[0].features.length;
  const mins = Array(numFeatures).fill(Infinity);
  const maxs = Array(numFeatures).fill(-Infinity);
  
  data.forEach((p) => {
    p.features.forEach((v, j) => {
      if (v < mins[j]) mins[j] = v;
      if (v > maxs[j]) maxs[j] = v;
    });
  });

  const normalizedPoints = data.map((p) => {
    const normFeatures = p.features.map((v, j) => {
      const range = maxs[j] - mins[j];
      return range === 0 ? 0.5 : (v - mins[j]) / range;
    });
    return { original: p, normFeatures };
  });

  // 2. Initialize centroids randomly from points
  let centroids: number[][] = [];
  const selectedIndices = new Set<number>();
  while (selectedIndices.size < Math.min(k, n)) {
    const idx = Math.floor(Math.random() * n);
    if (!selectedIndices.has(idx)) {
      selectedIndices.add(idx);
      centroids.push([...normalizedPoints[idx].normFeatures]);
    }
  }

  // Handle case where n < k
  while (centroids.length < k) {
    centroids.push(Array(numFeatures).fill(0.5));
  }

  let assignments = Array(n).fill(-1);
  let changed = true;
  let iteration = 0;

  const getDistance = (v1: number[], v2: number[]) => {
    return Math.sqrt(v1.reduce((sum, val, idx) => sum + (val - v2[idx]) ** 2, 0));
  };

  while (changed && iteration < maxIterations) {
    changed = false;
    iteration++;

    // Assign points to nearest centroid
    normalizedPoints.forEach((p, idx) => {
      let minDist = Infinity;
      let closestCluster = 0;
      centroids.forEach((centroid, cIdx) => {
        const dist = getDistance(p.normFeatures, centroid);
        if (dist < minDist) {
          minDist = dist;
          closestCluster = cIdx;
        }
      });

      if (assignments[idx] !== closestCluster) {
        assignments[idx] = closestCluster;
        changed = true;
      }
    });

    // Recompute centroids
    const sums = Array.from({ length: k }, () => Array(numFeatures).fill(0));
    const counts = Array(k).fill(0);

    assignments.forEach((cIdx, idx) => {
      normalizedPoints[idx].normFeatures.forEach((v, j) => {
        sums[cIdx][j] += v;
      });
      counts[cIdx]++;
    });

    for (let cIdx = 0; cIdx < k; cIdx++) {
      if (counts[cIdx] > 0) {
        centroids[cIdx] = sums[cIdx].map((s) => s / counts[cIdx]);
      }
    }
  }

  // Denormalize centroids to display original scale coordinates
  const denormalizedCentroids = centroids.map((c) => {
    return c.map((v, j) => {
      const range = maxs[j] - mins[j];
      return mins[j] + v * range;
    });
  });

  // Compile final results
  const resultPoints = data.map((p, idx) => ({
    point: p,
    clusterIndex: assignments[idx],
  }));

  // Analyze clusters to assign descriptive labels based on denormalized centroids
  // Centroid feature structure: [sleepHours, waterIntake, steps, meditation, focus, moodScore]
  const clusterScores = denormalizedCentroids.map((c, idx) => {
    const sleepNorm = c[0] / 8;
    const waterNorm = c[1] / 2;
    const stepNorm = c[2] / 5000;
    const medNorm = (c[3] || 0) / 20;
    const focusNorm = (c[4] || 0) / 120;
    const moodNorm = (c[5] || 0) / 100;
    const overallScore = (sleepNorm + waterNorm + stepNorm + medNorm + focusNorm + moodNorm) / 6;
    return { index: idx, score: overallScore };
  });

  // Sort clusters by score: highest score is Cluster 1, lowest is Cluster 3
  const sortedClusters = [...clusterScores].sort((a, b) => b.score - a.score);
  
  const clusterDescriptions = Array(k).fill("");
  const nameMapping = ["Oasis (Sehat & Produktif)", "Seimbang (Normal / Cukup)", "Kritis (Stres & Kurang Istirahat/Hidrasi)"];
  
  sortedClusters.forEach((c, rankIdx) => {
    clusterDescriptions[c.index] = nameMapping[rankIdx] || "Klaster Kustom";
  });

  return {
    centroids: denormalizedCentroids,
    points: resultPoints,
    clusterDescriptions,
  };
}
