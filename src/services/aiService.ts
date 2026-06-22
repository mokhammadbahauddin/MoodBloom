import { useUserStore } from "../lib/userStore";
import { useProductivityStore } from "../lib/productivityStore";
import { useHabitsStore } from "../lib/habitsStore";
import { useSettingsStore } from "../lib/settingsStore";
import { getTodayDateString } from "../lib/dateUtils";
import { calculateDailyWellnessScore } from "../lib/wellnessUtils";
import { getLocalChatResponse } from "./localRuleCoach";
import { 
  analyzeSentimentLocal, 
  generateHeuristicInsight, 
  generateFullWellnessAnalysis, 
  generateWeeklySynthesis,
  generateUserContextBlob
} from "./heuristicInsightEngine";
import { WellnessStateSnapshot } from "../types/wellness";

export interface AIContext {
  water: { current: number; target: number };
  steps: { current: number; target: number };
  meditation: { current: number; target: number };
  tasks: {
    pending: number;
    total: number;
    nextClass: string;
  };
  mood: any;
  overallScore: number;
}

export interface AIAnalysisResult {
  summary: string;
  nudge: {
    message: string;
    isUrgent: boolean;
    targetHabit: string;
  };
  patterns: string[];
  recommendations: { title: string; desc: string; action: string; type: string }[];
}

class AIService {
  private static instance: AIService;
  private lastAnalysisTime: number = 0;
  private readonly THROTTLE_MS = 2 * 60 * 1000; // 2 minutes window

  private constructor() {
    console.log("AIService: Central Intelligence initialized locally.");
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private async postToAiApi(promptOrContents: string | any[], systemMessage?: string): Promise<string> {
    const body: any = { systemMessage };
    if (typeof promptOrContents === "string") {
      body.prompt = promptOrContents;
    } else {
      body.contents = promptOrContents;
    }

    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.text) {
      throw new Error("Missing text in API response");
    }
    return data.text;
  }

  public generateStateSnapshot(): WellnessStateSnapshot {
    const user = useUserStore.getState();
    const habits = useHabitsStore.getState();
    const productivity = useProductivityStore.getState();
    const settings = useSettingsStore.getState().settings;

    return {
      userName: user.userName,
      focusAreas: user.focusAreas,
      waterLogs: habits.waterLogs,
      detailedWaterLogs: habits.detailedWaterLogs,
      baseWaterGoal: habits.baseWaterGoal,
      moodLogs: habits.moodLogs,
      streakCount: habits.streakCount,
      lastStreakUpdate: habits.lastStreakUpdate,
      meditationLogs: habits.meditationLogs,
      meditationGoal: habits.meditationGoal,
      stepsLogs: habits.stepsLogs,
      detailedStepsLogs: habits.detailedStepsLogs,
      stepGoal: habits.stepGoal,
      prayerLogs: habits.prayerLogs,
      prayerAlarms: habits.prayerAlarms,
      schedules: productivity.schedules,
      tasks: productivity.tasks,
      settings,
      currentWeather: user.currentWeather
    };
  }

  public generateContext(): AIContext {
    const today = getTodayDateString();
    const now = new Date();
    const currentTimeStr = now.toTimeString().slice(0, 5); // "HH:MM"
    
    const habitsStore = useHabitsStore.getState();
    const prodStore = useProductivityStore.getState();
    
    const water = habitsStore.waterLogs[today] || 0;
    const steps = habitsStore.stepsLogs[today] || 0;
    const meditation = habitsStore.meditationLogs[today] || 0;
    const pendingTasks = (prodStore.tasks || []).filter((t: any) => !t.completed);
    
    const todayClasses = (prodStore.schedules || [])
      .filter((s: any) => s.day === now.getDay())
      .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
    
    const nextClassObj = todayClasses.find((s: any) => s.startTime > currentTimeStr);
    const nextClass = nextClassObj 
      ? `${nextClassObj.className} ('${nextClassObj.startTime}')`
      : "No more classes today";

    const nextPrayer = habitsStore.prayerAlarms 
      ? Object.entries(habitsStore.prayerAlarms)
          .filter(([_, time]) => typeof time === 'string' && time > currentTimeStr)
          .sort(([_, a], [__, b]) => (a as string).localeCompare(b as string))[0]
      : null;

    const snapshot = this.generateStateSnapshot();
    const overallScore = calculateDailyWellnessScore(snapshot as any, today);

    return {
      water: { current: water, target: habitsStore.baseWaterGoal },
      steps: { current: steps, target: habitsStore.stepGoal },
      meditation: { current: meditation, target: habitsStore.meditationGoal },
      tasks: {
        pending: pendingTasks.length,
        total: (prodStore.tasks || []).length,
        nextClass,
      },
      mood: habitsStore.moodLogs[today] || { moodValue: 3, notes: "No journal entry today." },
      overallScore,
      // @ts-ignore - Extending context dynamically
      currentTime: currentTimeStr,
      nextPrayer: nextPrayer ? `${nextPrayer[0]} at ${nextPrayer[1]}` : "Done for today",
    };
  }

  public async analyzeWellness(force: boolean = false): Promise<AIAnalysisResult | null> {
    const now = Date.now();
    if (!force && now - this.lastAnalysisTime < this.THROTTLE_MS) {
      return null;
    }

    const state = this.generateStateSnapshot();
    console.debug("AIService: Running hybrid wellness analysis...");

    // Pre-calculate local heuristics as fallback/grounding context
    const localData = generateFullWellnessAnalysis(state);

    try {
      const systemMessage = `Anda adalah asisten analisis kesehatan (Wellness Analyst) MoodBloom untuk mahasiswa.
Tugas Anda adalah memformulasikan kesimpulan analisis wellness yang indah, personal, dan empatik berdasarkan data ringkasan lokal.
Data Ringkasan Lokal:
- Ringkasan Pola Mingguan: "${localData.summary}"
- Pola Rekomendasi/Tindakan yang Disarankan: ${JSON.stringify(localData.recommendations)}

FORMAT KELUARAN (JSON):
Kembalikan respons HANYA dalam format JSON valid dengan struktur berikut (jangan tambahkan teks markdown luar atau pembungkus):
{
  "summary": "1-2 kalimat ringkasan wellness yang personal dan menyemangati dalam Bahasa Indonesia.",
  "nudge": {
    "message": "Nudge/kalimat pendek penyemangat (maksimal 8 kata).",
    "isUrgent": false,
    "targetHabit": "general"
  },
  "patterns": ["Skor Baterai Tubuh: ...", "Status: ..."],
  "recommendations": [
    {
      "title": "Judul rekomendasi singkat",
      "desc": "Penjelasan singkat cara melakukannya",
      "action": "Tombol aksi",
      "type": "tipe kategori"
    }
  ]
}`;

      const prompt = "Analisis data wellness pengguna tersebut secara mendalam.";
      const apiResponse = await this.postToAiApi(prompt, systemMessage);
      
      const jsonText = apiResponse.replace(/```json|```/g, "").trim();
      const parsedData = JSON.parse(jsonText);

      const data = {
        summary: parsedData.summary || localData.summary,
        nudge: parsedData.nudge || localData.nudge,
        patterns: parsedData.patterns || localData.patterns,
        recommendations: parsedData.recommendations || localData.recommendations,
        analyzedAt: new Date().toISOString(),
      };

      this.lastAnalysisTime = now;
      const appState = useUserStore.getState() as any;
      if (typeof appState.setAiAnalysis === 'function') {
        appState.setAiAnalysis(data);
      }
      return data;
    } catch (error) {
      console.warn("[AIService] Hybrid analysis failed, falling back to Local Heuristic Engine:", error);
      
      this.lastAnalysisTime = now;
      const appState = useUserStore.getState() as any;
      if (typeof appState.setAiAnalysis === 'function') {
        appState.setAiAnalysis({
          ...localData,
          analyzedAt: new Date().toISOString(),
        });
      }
      return localData;
    }
  }

  public async breakdownTask(taskTitle: string): Promise<string[]> {
    console.info(`AIService: Decomposing task "${taskTitle}"...`);
    return [
      `Riset awal terkait "${taskTitle}"`,
      "Pembuatan kerangka dan poin-poin utama",
      "Pengerjaan draf pertama",
      "Review dan revisi akhir"
    ];
  }

  public async getWeeklyReport(): Promise<any> {
    const state = this.generateStateSnapshot();
    console.log("AIService: Generating hybrid weekly synthesis.");

    const localReport = generateWeeklySynthesis(state);

    try {
      const systemMessage = `Anda adalah AI Wellness Coach untuk mahasiswa.
Tugas Anda adalah menulis laporan mingguan yang empatik, mendalam, dan terstruktur berdasarkan data evaluasi lokal berikut.
Evaluasi Lokal: "${localReport}"

PANDUAN PENULISAN:
- Gunakan Bahasa Indonesia yang ramah dan menyemangati.
- Bagilah ke dalam bagian-bagian menarik dengan bullet points yang jelas.
- Berikan saran akademis yang realistis bagi mahasiswa yang sedang stres/lelah kuliah.
- Batasi tulisan maksimal 180 kata.`;

      const prompt = "Tulis laporan mingguan berdasarkan data evaluasi lokal.";
      const reportContent = await this.postToAiApi(prompt, systemMessage);
      
      const data = {
        title: "Laporan Keseimbangan Mingguan",
        content: reportContent,
        analyzedAt: new Date().toISOString()
      };

      const appState = useUserStore.getState() as any;
      if (typeof appState.setWeeklyCoachingReport === 'function') {
        appState.setWeeklyCoachingReport(data);
      }
      return data;
    } catch (error) {
      console.warn("[AIService] Hybrid weekly report failed, falling back to Local Heuristics:", error);
      
      const data = {
        title: "Laporan Keseimbangan Mingguan",
        content: localReport,
        analyzedAt: new Date().toISOString()
      };

      const appState = useUserStore.getState() as any;
      if (typeof appState.setWeeklyCoachingReport === 'function') {
        appState.setWeeklyCoachingReport(data);
      }
      return data;
    }
  }

  public getAffirmation(): string {
    const randomIndex = Math.floor(Math.random() * STUDENT_AFFIRMATIONS.length);
    return STUDENT_AFFIRMATIONS[randomIndex];
  }

  public summarizeNotes(notes: string): string {
    if (!notes || notes.length < 10) return "Catatan terlalu pendek untuk diringkas.";
    const sentences = notes.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 5);
    if (sentences.length <= 2) return `Catatan Penting: ${notes}`;
    return `Ringkasan Catatan:\n• ${sentences.slice(0, 3).join("\n• ")}`;
  }

  public analyzeSentiment(text: string): { sentiment: string; recommendation: string | null } {
    if (!text || text.length < 5) return { sentiment: "neutral", recommendation: null };
    const res = analyzeSentimentLocal(text);
    return {
      sentiment: res.sentiment,
      recommendation: res.recommendation
    };
  }

  public async chatWithAI(
    message: string,
    history: Array<{ role?: string; sender?: string; content?: string; text?: string }> = []
  ): Promise<string> {
    const state = this.generateStateSnapshot();
    const contextBlob = generateUserContextBlob(state);
    const localFallback = getLocalChatResponse(message, state);

    try {
      const systemMessage = `Anda adalah partner/coach kesehatan mental akademis mahasiswa bernama MoodBloom.
Gunakan informasi status kesehatan harian pengguna berikut untuk membantu menjawab pertanyaan mereka secara kontekstual:
${contextBlob}

PANDUAN RESPONS:
- Berikan saran yang ramah, hangat, personal, dan menyemangati dalam bahasa Indonesia yang santai tapi profesional.
- Batasi respons di bawah 120 kata agar mudah dibaca di mobile app.
- JANGAN mengulang informasi status kesehatan mentah secara verbatim kecuali relevan dengan respons Anda.
- Jika pengguna curhat tentang kelelahan/stres, berikan validasi emosi terlebih dahulu.`;

      const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

      // Add last 20 messages of history (10 turns) to avoid exceeding token/rate limits
      const sliceStart = Math.max(0, history.length - 20);
      const historySlice = history.slice(sliceStart);

      for (const msg of historySlice) {
        const text = msg.content || msg.text || "";
        if (!text.trim()) continue;

        // Skip onboarding/welcome default prompts
        if (text.includes("Selamat datang") || text.includes("Hai! Ada yang bisa")) {
          continue;
        }

        const role = (msg.role === "user" || msg.sender === "user") ? "user" : "model";
        contents.push({
          role,
          parts: [{ text }]
        });
      }

      // Add current user prompt
      const currentPrompt = `Pertanyaan Pengguna: "${message}"\n\n(Catatan: Respons ini didukung oleh evaluasi metrik lokal yang menyimpulkan: "${localFallback.slice(0, 150)}")`;
      contents.push({
        role: "user",
        parts: [{ text: currentPrompt }]
      });

      return await this.postToAiApi(contents, systemMessage);
    } catch (err) {
      console.warn("[AIService] API Chat failed, falling back to Local Rule Coach:", err);
      return localFallback;
    }
  }

  public generateTabInsight(tabName: string, contextData?: any): { message: string; actionText: string } {
    try {
      const state = this.generateStateSnapshot();
      if (contextData?.currentWeather) {
        state.currentWeather = contextData.currentWeather;
      }
      const insight = generateHeuristicInsight(state, tabName);
      return {
        message: insight.message,
        actionText: "Diskusikan Bersama AI"
      };
    } catch {
      return {
        message: "Ritme harianmu menunjukkan pola menarik. Mari kita lihat lebih dalam.",
        actionText: "Diskusikan Bersama AI",
      };
    }
  }

  private handleError(error: any, context: string) {
    console.error(`AIService [${context}]: Critical Failure`, error);
  }
}

export const aiService = AIService.getInstance();

const STUDENT_AFFIRMATIONS = [
  "Fokus pada proses, bukan hanya hasil akhir.",
  "Setiap langkah kecil membawamu lebih dekat ke impianmu.",
  "Kesehatanmu adalah investasi terbaik untuk masa depanmu.",
  "Satu tugas hari ini meringankan beban esok hari.",
  "Ambil napas dalam-dalam, kamu melakukan pekerjaan yang hebat.",
  "Keseimbangan antara belajar dan istirahat adalah kunci sukses.",
  "Kemajuanmu hari ini, sekecil apa pun, tetaplah sebuah kemajuan.",
  "Kamu mampu menghadapi tantangan akademis ini dengan kepala dingin.",
  "Belajar adalah maraton, beri dirimu ruang untuk bernapas."
];
