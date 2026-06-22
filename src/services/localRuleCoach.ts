import { getTodayDateString } from "../lib/dateUtils";
import { WellnessStateSnapshot } from "../types/wellness";

// SYNONYM DEFINITIONS
const KEYWORD_MAP = {
  FATIGUE: [/lelah/, /capek/, /lemas/, /ngantuk/, /letih/, /loyo/, /gantuk/, /tidur/, /sleep/, /tired/, /exhaust/, /fatigue/],
  STRESS: [/stres/, /cemas/, /khawatir/, /takut/, /panik/, /pening/, /pusing/, /sedih/, /gelisah/, /stress/, /anxio/, /sad/, /depres/, /marah/, /frustrasi/],
  HYDRATION: [/minum/, /air/, /haus/, /hidrasi/, /dehidrasi/, /water/, /drink/, /thirsty/, /glass/, /gelas/],
  PRODUCTIVITY: [/tugas/, /belajar/, /deadline/, /kuliah/, /kelas/, /pr/, /ujian/, /kuis/, /numpuk/, /sibuk/, /task/, /study/, /exam/, /busy/],
  FITNESS: [/langkah/, /jalan/, /gerak/, /kaki/, /olahraga/, /fisik/, /step/, /walk/, /run/, /workout/],
  MINDFULNESS: [/meditasi/, /napas/, /breathe/, /meditate/, /calm/, /tenang/, /rileks/, /relax/, /zen/],
  SPIRITUAL: [/sholat/, /ibadah/, /doa/, /shalat/, /pray/, /sujud/, /masjid/]
};

/**
 * LocalRuleCoach - High-Intelligence Offline Wellness Companion
 * 
 * Conducts synonym classification, multi-metric analysis, and cross-correlation 
 * scoring to formulate highly personalized, empathetic, and structured 
 * wellness advice for university students.
 */
export function getLocalChatResponse(message: string, state: WellnessStateSnapshot): string {
  const lowerMsg = message.toLowerCase();
  const today = getTodayDateString();

  // 1. Gather Rich Context from injected state snapshot
  const userName = state.userName || "Sobat";
  const focusAreas = state.focusAreas || [];
  
  const waterLogs = state.waterLogs || {};
  const stepsLogs = state.stepsLogs || {};
  const moodLogs = state.moodLogs || {};
  const meditationLogs = state.meditationLogs || {};
  const baseWaterGoal = state.baseWaterGoal || 2;
  const stepGoal = state.stepGoal || 1000;
  const meditationGoal = state.meditationGoal || 15;
  const prayerAlarms = state.prayerAlarms || [];

  const schedules = state.schedules || [];
  const tasks = state.tasks || [];

  const waterToday = waterLogs[today] || 0;
  const stepsToday = stepsLogs[today] || 0;
  const meditationToday = meditationLogs[today] || 0;
  const moodToday = moodLogs[today] || null;
  const pendingTasks = tasks.filter((t: any) => !t.completed);

  // 2. Classify Message Intent via Synonym Mapping
  let matchedCategory: keyof typeof KEYWORD_MAP | null = null;
  for (const [category, regexes] of Object.entries(KEYWORD_MAP)) {
    if (regexes.some(rx => rx.test(lowerMsg))) {
      matchedCategory = category as keyof typeof KEYWORD_MAP;
      break;
    }
  }

  // 3. Compute Complex Health Alerts (Multivariate Analysis)
  const isDehydrated = waterToday < baseWaterGoal * 0.5;
  const isSleepDeprived = moodToday ? moodToday.sleepValue <= 2 : false;
  const isStressedOut = moodToday ? moodToday.moodValue <= 2 : false;
  const isSedentary = stepsToday < stepGoal * 0.4;
  const hasHighWorkload = pendingTasks.length >= 3;
  const needMindfulness = meditationToday === 0;

  // Calculate Health Battery Score
  const waterScore = Math.min((waterToday / baseWaterGoal) * 40, 40);
  const sleepVal = moodToday ? moodToday.sleepValue : 3;
  const sleepScore = Math.min((sleepVal / 5) * 40, 40);
  const stepScore = Math.min((stepsToday / stepGoal) * 20, 20);
  const healthBattery = Math.round(waterScore + sleepScore + stepScore);

  // 4. Generate Empathetic Validation based on Matched Category
  let validationText = "";
  switch (matchedCategory) {
    case "FATIGUE":
      validationText = `Halo ${userName}, saya mendengar kelelahanmu. Kehidupan perkuliahan dengan jadwal padat dan tugas menumpuk memang sangat menguras energi fisik maupun mental. Wajar sekali jika kamu merasa lelah saat ini.`;
      break;
    case "STRESS":
      validationText = `Halo ${userName}, saya merasakan beban berat yang sedang kamu pikul. Tekanan akademis, kekhawatiran tentang tugas, atau kecemasan harian adalah hal nyata yang sering dihadapi mahasiswa. Tarik napas dalam-dalam, kamu tidak sendirian menghadapi ini.`;
      break;
    case "HYDRATION":
      validationText = `Halo ${userName}, mari kita bahas pola hidrasimu hari ini. Air adalah bahan bakar utama otak kita. Saat asupan cairan berkurang, daya konsentrasi belajarmu bisa menurun drastis.`;
      break;
    case "PRODUCTIVITY":
      validationText = `Halo ${userName}, mari kita urai kesibukan belajarmu hari ini. Menghadapi daftar tugas yang menumpuk seringkali membuat kita merasa kewalahan (*productivity anxiety*). Kuncinya adalah fokus pada satu langkah kecil saja.`;
      break;
    case "FITNESS":
      validationText = `Halo ${userName}, senang sekali kamu memperhatikan aktivitas fisikmu. Duduk terlalu lama di kelas atau di depan laptop saat belajar bisa membuat tubuh kaku dan menurunkan fokus mental.`;
      break;
    case "MINDFULNESS":
      validationText = `Halo ${userName}, mari luangkan waktu sejenak untuk menenangkan pikiran. Di sela-sela hiruk-pikuk aktivitas kuliah, memberikan ruang tenang untuk napas adalah bentuk *self-care* terbaik.`;
      break;
    case "SPIRITUAL":
      validationText = `Halo ${userName}, menyempatkan ibadah dan doa di tengah padatnya tugas adalah cara luar biasa untuk menjaga kestabilan jiwa dan ketenangan batin.`;
      break;
    default:
      validationText = `Halo ${userName}, saya di sini sebagai partner setiamu dalam menjaga keseimbangan hidup mahasiswa. Mari kita evaluasi kondisimu hari ini dan temukan titik harmoni terbaik.`;
  }

  // 5. Cross-Metric Correlation Synthesis
  let correlationText = "";
  if (matchedCategory === "FATIGUE" && isSleepDeprived) {
    const hours = moodToday?.sleepValue === 1 ? 4 : 5;
    correlationText = ` Analisis data mencatat tidurmu semalam hanya sekitar ${hours} jam. Ketika waktu istirahat berada di bawah batas ideal, akumulasi asam laktat membuat otot lelah dan daya pikir melambat.`;
  } else if (matchedCategory === "FATIGUE" && isDehydrated) {
    correlationText = ` Saya melihat hidrasimu baru mencapai ${waterToday}L hari ini. Dehidrasi ringan adalah pemicu utama kelelahan kronis (*fatigue*) karena volume darah menurun, memaksa jantung bekerja lebih keras.`;
  } else if (matchedCategory === "STRESS" && hasHighWorkload) {
    correlationText = ` Stres yang kamu rasakan berkorelasi erat dengan ${pendingTasks.length} tugas yang belum selesai. Menunda pengerjaan sering meningkatkan kecemasan di latar belakang pikiranmu.`;
  } else if (matchedCategory === "STRESS" && isSleepDeprived) {
    correlationText = ` Kurang tidur terdeteksi hari ini, yang memperlemah amigdala otak sehingga kamu lebih rentan merasa cemas dan stres terhadap hal-hal kecil.`;
  } else if (isDehydrated && isSleepDeprived) {
    correlationText = ` Kombinasi kurang hidrasi (${waterToday}L) dan kurang tidur hari ini sangat memengaruhi 'Baterai Tubuh'-mu yang saat ini berada di angka ${healthBattery}%. Ini adalah kondisi rawan kelelahan akademis (*burnout*).`;
  } else {
    correlationText = ` Saat ini Baterai Tubuhmu berada di angka ${healthBattery}% (${healthBattery >= 80 ? "Optimal" : healthBattery >= 60 ? "Baik" : "Butuh Pemulihan"}).`;
  }

  // Find Next Class Time for Context
  const now = new Date();
  const currentTimeStr = now.toTimeString().slice(0, 5);
  const todayClasses = schedules
    .filter((s: any) => s.day === now.getDay())
    .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
  const nextClassObj = todayClasses.find((s: any) => s.startTime > currentTimeStr);
  const nextClassText = nextClassObj 
    ? `Kelas terdekatmu berikutnya adalah **${nextClassObj.className}** pukul **${nextClassObj.startTime}**.`
    : "Kamu tidak memiliki kelas kuliah lagi hari ini.";

  // 6. Build 3 Concrete Actionable Recommendations
  const actions: string[] = [];

  // Recommendation 1: Dynamic primary action based on category & metric
  if (matchedCategory === "HYDRATION" || isDehydrated) {
    actions.push(`**Minum air sekarang**: Minumlah 1-2 gelas air putih (sekitar 300-500ml) sekarang juga untuk melancarkan kembali sirkulasi oksigen ke otak.`);
  } else if (matchedCategory === "MINDFULNESS" || needMindfulness) {
    actions.push(`**Rehat Meditasi 3 Menit**: Buka tab Meditasi dan jalankan panduan pernapasan dalam 4-7-8 untuk menenangkan sistem saraf simpatikmu.`);
  } else if (matchedCategory === "PRODUCTIVITY" || hasHighWorkload) {
    actions.push(`**Gunakan Teknik Pomodoro**: Pilih satu tugas termudah dari ${pendingTasks.length} tugas tertunda di tab Produktivitas. Pasang timer fokus 25 menit, lalu matikan semua distrasi HP.`);
  } else if (matchedCategory === "FATIGUE" || isSleepDeprived) {
    actions.push(`**Power Nap atau Istirahat Mata**: Lakukan mikro-istirahat selama 10-15 menit tanpa melihat layar gadget, atau jadwalkan tidur malam 30 menit lebih awal.`);
  } else {
    actions.push(`**Regangkan Tubuh**: Lakukan peregangan ringan pada area leher, bahu, dan punggung bawah selama 2 menit.`);
  }

  // Recommendation 2: Secondary habit nudges
  if (isSedentary && stepsToday < stepGoal) {
    actions.push(`**Cari Langkah Tambahan**: Hari ini kamu baru berjalan ${stepsToday} langkah. Cobalah berjalan kaki singkat selama 10 menit di sekitar area kampus atau kos.`);
  } else if (hasHighWorkload && pendingTasks.length > 0) {
    actions.push(`**Tentukan Satu Prioritas**: ${nextClassText} Sebelum kelas dimulai atau tugas menumpuk, pilih 1 tugas utama yang ingin kamu selesaikan sore ini.`);
  } else {
    actions.push(`**Catat Jurnal Emosimu**: Tuliskan 1-2 kalimat refleksi pendek di tab Mood mengenai bagaimana harimu berjalan untuk melatih kesadaran diri.`);
  }

  // Recommendation 3: Bedtime/Recovery rules
  if (isSleepDeprived || isStressedOut) {
    actions.push(`**Digital Detox Sebelum Tidur**: Malam ini, matikan seluruh notifikasi media sosial minimal 30 menit sebelum kamu memejamkan mata agar kualitas tidur lebih mendalam.`);
  } else {
    actions.push(`**Jaga Momentum Positif**: Baterai tubuhmu yang cukup baik hari ini adalah aset. Pertahankan hidrasi dan batasi kafein setelah jam 3 sore.`);
  }

  // Assemble final rich, multi-paragraph response
  const finalResponse = `${validationText}${correlationText}

Berikut adalah **3 langkah konkret** yang sangat saya sarankan untuk mendampingi aktivitas belajarmu hari ini:

1. 💧 ${actions[0]}
2. 🎯 ${actions[1]}
3. 🌙 ${actions[2]}

Tetap semangat belajar dengan seimbang, ${userName}! Kesehatanmu adalah modal utama kesuksesan akademismu. 🌸`;

  return finalResponse;
}
