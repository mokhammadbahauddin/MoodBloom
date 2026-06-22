import { getTodayDateString } from "../lib/dateUtils";
import { WellnessStateSnapshot } from "../types/wellness";

export interface DashboardInsight {
  message: string;
}

export function generateHeuristicInsight(state: WellnessStateSnapshot, tabName: string = "Beranda Utama"): DashboardInsight {
  const today = getTodayDateString();
  const todayMood = state.moodLogs?.[today];
  const consumedWater = state.waterLogs?.[today] || 0;
  const settings = state.settings;
  const waterGoal = (settings?.waterGoalML || 3000) / 1000;
  const todaySteps = state.stepsLogs?.[today] || 0;
  const stepGoal = state.stepGoal || 1000;
  const pendingTasks = state.tasks?.filter((t: any) => !t.completed) || [];
  const meditationMinutes = state.meditationLogs?.[today] || 0;
  const currentWeather = state.currentWeather;
  
  const hour = new Date().getHours();

  // HEURISTIC LOGIC FOR WATER TAB
  if (tabName === "Water (Hidrasi)" || tabName === "Hidrasi") {
    if (currentWeather?.isHot && consumedWater < waterGoal * 0.4) {
      return { message: "Cuaca panas! Kamu baru minum sedikit. Yuk, minum segelas lagi sekarang." };
    }
    if (consumedWater >= waterGoal) {
      return { message: "Hebat! Kamu sudah mencapai target air hari ini. Tetap pertahankan hidrasi ini." };
    }
    if (consumedWater > waterGoal * 0.7) {
      return { message: "Hampir sampai! Sedikit lagi mencapai target hidrasi harianmu." };
    }
    return { message: "Hidrasi yang cukup membantu otak bekerja 14% lebih cepat. Jangan lupa minum!" };
  }

  // HEURISTIC LOGIC FOR MOOD TAB
  if (tabName === "Mood & Tidur" || tabName === "Mood") {
    if (todayMood) {
      if (todayMood.moodValue >= 3) {
        return { message: "Senang melihat harimu berjalan baik! Pertahankan energi positif ini." };
      } else {
        return { message: "Hari yang menantang? Tidak apa-apa. Cobalah teknik pernapasan dalam untuk sedikit rileks." };
      }
    }
    return { message: "Bagaimana perasaanmu hari ini? Luangkan waktu sejenak untuk mengenali emosimu." };
  }

  // DEFAULT/HOME LOGIC
  // 1. Critical Priority: High Heat + Low Water
  if (currentWeather?.isHot && consumedWater < waterGoal * 0.4) {
    return { message: "Cuaca cukup terik hari ini. Jangan lupa minum air lebih banyak agar tetap fokus dan segar!" };
  }

  // 2. Morning Focus: High Energy + Pending Tasks
  if (hour < 11 && pendingTasks.length > 0) {
    if (todayMood?.moodValue >= 3) {
      return { message: "Energimu sedang bagus pagi ini! Waktu yang tepat untuk menyelesaikan tugas yang paling sulit." };
    }
    return { message: "Awali pagimu dengan satu kemenangan kecil. Pilih tugas termudah di daftar barumu!" };
  }

  // 3. Afternoon Check-in: Midday Slump
  if (hour >= 13 && hour < 17) {
    if (consumedWater < waterGoal * 0.5) {
      return { message: "Sudah tengah hari. Hidrasi kembali tubuhmu untuk menghindari kantuk di sore hari." };
    }
    if (pendingTasks.length === 0) {
      return { message: "Semua tugas beres! Mungkin ini waktu yang tepat untuk meditasi sejenak atau jalan santai?" };
    }
    return { message: "Tetap semangat! Sisihkan waktu 5 menit untuk istirahat sejenak sebelum lanjut fokus." };
  }

  // 4. Achievement Focus: Near Goals
  if (todaySteps > stepGoal * 0.8 && todaySteps < stepGoal) {
    return { message: "Sedikit lagi mencapai target langkah! Yuk, jalan sebentar lagi untuk menutup harimu dengan prestasi." };
  }

  if (consumedWater > waterGoal * 0.8 && consumedWater < waterGoal) {
    return { message: "Target minum air sudah hampir tercapai. Tinggal 1-2 gelas lagi!" };
  }

  // 5. Emotional Support
  if (todayMood?.moodValue <= 2) {
    return { message: "Hari yang berat? Tidak apa-apa untuk beristirahat. Ingat, kesehatan mentalmu adalah prioritas utama." };
  }

  // 6. Productivity Cheer
  if (pendingTasks.length === 0 && tasksWasDoneToday(state)) {
    return { message: "Kerja bagus hari ini! Semua tugas selesai tepat waktu. Selamat beristirahat." };
  }

  // 7. General Motivation / Evening Reflection
  if (hour >= 20) {
    if (meditationMinutes > 0) {
       return { message: "Meditasi yang bagus. Semoga tidurmu lebih nyenyak dan berkualitas malam ini." };
    }
    return { message: "Sudah malam. Waktunya untuk tenang dan bersiap istirahat. Kamu telah berusaha yang terbaik hari ini." };
  }

  // Fallback default
  return { message: "Keseimbangan adalah kunci. Tetap jaga ritme harianmu untuk hidup yang lebih harmonis." };
}

export function analyzeSentimentLocal(text: string): { sentiment: string; recommendation: string } {
  const lowerText = text.toLowerCase();
  
  const negativeKeywords = ["sedih", "buruk", "penat", "stres", "lelah", "capek", "marah", "kecewa", "sad", "stressed", "tired", "angry"];
  const positiveKeywords = ["senang", "bahagia", "semangat", "hebat", "baik", "bagus", "happy", "joy", "great", "good"];

  if (negativeKeywords.some(word => lowerText.includes(word))) {
    return {
      sentiment: "stressed",
      recommendation: "Sepertinya kamu sedang penat. Yuk coba meditasi 5-10 menit untuk menenangkan pikiran."
    };
  }

  if (positiveKeywords.some(word => lowerText.includes(word))) {
    return {
      sentiment: "happy",
      recommendation: "Energi positifmu sangat bagus! Terus pertahankan ritme ini."
    };
  }

  return {
    sentiment: "neutral",
    recommendation: "Terima kasih sudah mencatat perasaanmu hari ini."
  };
}

export function tasksWasDoneToday(state: WellnessStateSnapshot): boolean {
  const today = getTodayDateString();
  const tasks = state.tasks || [];
  return tasks.some((t: any) => t.completed && t.completedAt && typeof t.completedAt === 'string' && t.completedAt.includes(today));
}

export function generateWeeklySynthesis(state: WellnessStateSnapshot): string {
  const moodLogs = state.moodLogs || {};
  const waterLogs = state.waterLogs || {};
  const stepsLogs = state.stepsLogs || {};
  const waterGoal = (state.settings?.waterGoalML || 3000) / 1000;
  const stepGoal = state.stepGoal || 1000;

  const dates = Object.keys(moodLogs).sort().slice(-7);
  if (dates.length === 0) return "Belum ada cukup data untuk analisis mingguan. Teruslah mencatat aktivitasmu!";

  const avgMood = dates.reduce((sum, d) => sum + (moodLogs[d]?.moodValue || 0), 0) / dates.length;
  const avgSleep = dates.reduce((sum, d) => sum + (moodLogs[d]?.sleepValue || 0), 0) / dates.length; // 1-5 scale usually
  const avgWater = dates.reduce((sum, d) => sum + (waterLogs[d] || 0), 0) / dates.length;
  const avgSteps = dates.reduce((sum, d) => sum + (stepsLogs[d] || 0), 0) / dates.length;

  let report = "Analisis Mingguan: ";

  // Journal Pattern Analysis (joreport)
  const allNotes = dates.map(d => moodLogs[d]?.notes || "").join(" ").toLowerCase();
  const stressedPattern = ["tugas", "ujian", "deadline", "sibuk", "stres", "capek", "lelah"].filter(w => allNotes.includes(w));
  const happyPattern = ["senang", "bahagia", "semangat", "seru", "makan", "nugas bareng"].filter(w => allNotes.includes(w));

  if (stressedPattern.length > 2) {
    report += `Sepertinya jurnalmu banyak mencatat soal ${stressedPattern.slice(0, 2).join(" & ")}, yang memengaruhi beban pikiranmu. `;
  } else if (happyPattern.length > 0) {
    report += `Momen menyenangkan soal ${happyPattern[0]} memberikan aura positif pada jurnalmu minggu ini. `;
  }

  // Mood Analysis
  if (avgMood >= 4) report += "Mood kamu sangat stabil dan positif minggu ini. ";
  else if (avgMood >= 3) report += "Mood kamu cukup fluktuatif namun cenderung stabil. ";
  else report += "Sepertinya minggu ini cukup menantang bagi perasaanmu. ";

  // Sleep Correlation (assuming 1-5 maps to hours roughly)
  // mapSleepToHours: 1->4, 2->5, 3->7, 4->8, 5->9
  if (avgSleep >= 4) report += "Kualitas tidurmu yang baik (rata-rata 8+ jam) menjadi pondasi energi utamamu. ";
  else if (avgSleep < 3) report += "Kurangnya waktu istirahat mungkin memengaruhi fokusmu belakangan ini. ";

  // Physical Activity
  if (avgSteps >= stepGoal) report += "Kamu sangat aktif bergerak, ini bagus untuk kesehatan jantungmu. ";
  else if (avgSteps < stepGoal * 0.5) report += "Cobalah untuk lebih sering berjalan kaki agar sirkulasi darah lebih lancar. ";

  // Hydration
  if (avgWater >= waterGoal) report += "Pola hidrasimu luar biasa, tubuhmu pasti terasa lebih segar. ";
  else if (avgWater < waterGoal * 0.7) report += "Tingkatkan asupan air putih untuk menjaga konsentrasi tetap tajam. ";

  // Heuristic Synthesis
  if (avgMood < 3 && avgSleep < 3) {
    report += "Kombinasi kurang tidur dan mood rendah terdeteksi. Prioritaskan istirahat malam ini.";
  } else if (avgMood >= 4 && avgSteps >= stepGoal) {
    report += "Kamu sedang berada dalam kondisi prima (High Flow). Manfaatkan energi ini!";
  } else {
    report += "Terus jaga keseimbangan antara aktivitas dan istirahat.";
  }

  return report;
}

export function getHealthBatteryInsight(state: WellnessStateSnapshot): { value: string; status: string; color: string } {
  const today = getTodayDateString();
  const water = state.waterLogs?.[today] || 0;
  const sleep = state.moodLogs?.[today]?.sleepValue || 0;
  const steps = state.stepsLogs?.[today] || 0;
  const waterGoal = (state.settings?.waterGoalML || 3000) / 1000;
  const stepGoal = state.stepGoal || 1000;

  const waterScore = Math.min((water / waterGoal) * 40, 40);
  const sleepScore = Math.min((sleep / 5) * 40, 40);
  const stepScore = Math.min((steps / stepGoal) * 20, 20);

  const total = Math.round(waterScore + sleepScore + stepScore);

  if (total >= 85) return { value: `${total}%`, status: "Optimal", color: "text-emerald-500" };
  if (total >= 60) return { value: `${total}%`, status: "Baik", color: "text-blue-500" };
  if (total >= 40) return { value: `${total}%`, status: "Cukup", color: "text-amber-500" };
  return { value: `${total}%`, status: "Rendah", color: "text-rose-500" };
}

export function generatePredictiveInsight(state: WellnessStateSnapshot): string {
  const meditationLogs = state.meditationLogs || {};
  const current7 = Object.keys(meditationLogs).slice(-7);
  const avgMeditation = current7.reduce((sum, d) => sum + (meditationLogs[d] || 0), 0) / (current7.length || 1);
  
  const hour = new Date().getHours();
  
  if (avgMeditation > 10) {
    return `Berdasarkan pola meditasimu, fokus tertinggimu diprediksi akan tetap stabil besok pagi. Gunakan waktu pukul ${hour < 9 ? "08:30" : "09:15"} untuk deep work.`;
  }
  
  return `Berdasarkan pola aktivitasmu, energimu diprediksi akan memuncak besok pukul ${hour < 10 ? "10:00" : "09:30"}. Siapkan daftar prioritasmu malam ini!`;
}

export function generateFullWellnessAnalysis(state: WellnessStateSnapshot): {
  summary: string;
  nudge: { message: string; isUrgent: boolean; targetHabit: string };
  patterns: string[];
  recommendations: { title: string; desc: string; action: string; type: string }[];
} {
  const synthesis = generateWeeklySynthesis(state);
  const battery = getHealthBatteryInsight(state);

  // Dynamic Recommendations based on User Patterns
  const recs: { title: string; desc: string; action: string; type: string }[] = [];
  const today = getTodayDateString();
  const sleepToday = state.moodLogs?.[today]?.sleepValue || 0;
  const moodToday = state.moodLogs?.[today]?.moodValue || 0;
  const waterToday = state.waterLogs?.[today] || 0;

  // Pattern 1: Sleep -> Mood Correlation (from user image)
  if (sleepToday >= 4) {
    recs.push({
      title: "TIDUR CUKUP = HARI YANG HEBAT!",
      desc: "Ternyata, kalau kamu tidur lebih dari 7 jam, kemungkinan besar skor mood kamu stabil. Lanjutkan kebiasaan baik ini!",
      action: "PERTAHANKAN",
      type: "stability"
    });
  } else if (sleepToday > 0 && sleepToday < 3) {
    recs.push({
      title: "ISTIRAHAT EKSTRA DIBUTUHKAN",
      desc: "Data menunjukkan mood-mu cenderung menurun saat tidur kurang dari 5 jam. Coba tidur 30 menit lebih awal malam ini.",
      action: "ATUR JADWAL",
      type: "recovery"
    });
  }

  // Pattern 2: Focus -> Energy Correlation
  const focusLogs = state.meditationLogs || {};
  const focusValues = Object.values(focusLogs) as number[];
  const recentFocus = focusValues.slice(-3);
  const totalFocus = recentFocus.reduce((a, b) => a + (Number(b) || 0), 0);
  const avgFocus = totalFocus / (recentFocus.length || 1);
  if (avgFocus > 15) {
    recs.push({
      title: "\"FOKUS\" MEMBUATMU SEMANGAT!",
      desc: "Momen yang berkaitan dengan \"Fokus\" ternyata berdampak sangat baik untuk kesehatan mentalmu belakangan ini. Sering-sering eksplor hal ini!",
      action: "EKSPLORASI JURNAL",
      type: "focus"
    });
  }

  // Pattern 3: Hydration
  if (waterToday < 1) {
    recs.push({
      title: "HIDRASI ADALAH KUNCI",
      desc: "Konsumsi air minummu hari ini masih sangat rendah. Ini bisa memicu sakit kepala dan turunnya konsentrasi.",
      action: "MINUM SEKARANG",
      type: "health"
    });
  }

  return {
    summary: synthesis,
    nudge: {
      message: battery.status === "Rendah" ? "Energi rendah, prioritaskan istirahat." : "Terus jaga ritme positifmu!",
      isUrgent: battery.status === "Rendah",
      targetHabit: "general"
    },
    patterns: [
      `Baterai tubuh: ${battery.value}`,
      `Status: ${battery.status}`
    ],
    recommendations: recs.length > 0 ? recs : [
      { title: "MULAI MENCATAT", desc: "Catat aktivitasmu hari ini untuk mendapatkan analisis yang lebih akurat.", action: "CATAT SEKARANG", type: "general" }
    ]
  };
}

/**
 * generateUserContextBlob
 * Creates a comprehensive string of the user's current status for the AI Chat.
 */
export function generateUserContextBlob(state: WellnessStateSnapshot): string {
  const today = getTodayDateString();
  const battery = getHealthBatteryInsight(state);
  const synthesis = generateWeeklySynthesis(state);
  
  const ctx = `
USER WELLNESS CONTEXT (DO NOT REPEAT VERBATIM):
- Current Health Battery: ${battery.value} (${battery.status})
- Today's Logs: 
  * Water: ${state.waterLogs?.[today] || 0}L
  * Steps: ${state.stepsLogs?.[today] || 0} steps
  * Mood: ${state.moodLogs?.[today]?.moodValue || "N/A"}/5
  * Sleep: ${state.moodLogs?.[today]?.sleepValue || "N/A"}/5
- Weekly Synthesis: ${synthesis}
- Recent Habits: ${Object.keys(state.moodLogs || {}).length} days logged.
`;
  return ctx;
}
