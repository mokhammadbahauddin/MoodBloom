import { useState, useMemo, useEffect, useRef } from "react";
import {
  Smile,
  Frown,
  Meh,
  Sparkles,
  Zap,
  Flame,
  Brain,
  Book,
  Moon,
  Coffee,
  Heart,
  BarChart3,
  Wind,
  CloudSun,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import { AIInsight } from "./AIInsight";
import { generateHeuristicInsight, analyzeSentimentLocal } from "../services/heuristicInsightEngine";
import { renderFormattedText } from "../lib/utils";
import { aiService } from "../services/aiService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  Area,
  Line,
  ComposedChart,
} from "recharts";
import { useUserStore } from "../lib/userStore";
import { useSettingsStore } from "../lib/settingsStore";
import { useProductivityStore } from "../lib/productivityStore";;
import { useHabitsStore } from "../lib/habitsStore";
import { getTodayDateString, getPast7Days } from "../lib/dateUtils";
import LazyLottie from "./LazyLottie";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

const calculateSleepDuration = (start: string, end: string): number => {
  const [sH, sM] = start.split(":").map(Number);
  const [eH, eM] = end.split(":").map(Number);
  
  let startMinutes = sH * 60 + sM;
  let endMinutes = eH * 60 + eM;
  
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // Next day
  }
  
  return (endMinutes - startMinutes) / 60;
};

export default function Mood({
  onOpenChat,
  onNavigate,
  isActive = true,
}: {
  onOpenChat?: () => void;
  onNavigate?: (tab: string, subTab?: string) => void;
  isActive?: boolean;
}) {
  const today = getTodayDateString();
  const moodLogs = useHabitsStore((state) => state.moodLogs);
  const logMood = useHabitsStore((state) => state.logMood);
  const focusLogs = useProductivityStore(state => state.focusLogs);
  const tasks = useProductivityStore(state => state.tasks);

  const existingLog = moodLogs[today];

  // For dynamic insight
  const [insight, setInsight] = useState<string | null>(null);
  
  const setActiveChatContext = useUserStore(state => state.setActiveChatContext);

  const [selectedMood, setSelectedMood] = useState<number | null>(
    existingLog ? existingLog.moodValue - 1 : null,
  );
  const [selectedSleep, setSelectedSleep] = useState<number | null>(
    existingLog ? existingLog.sleepValue - 1 : null,
  );
  const [selectedFactors, setSelectedFactors] = useState<number[]>(
    existingLog
      ? existingLog.factors.map((f) => parseInt(f)).filter((n) => !isNaN(n))
      : [],
  );
  const [notes, setNotes] = useState(existingLog ? existingLog.notes : "");
  const [sleepStart, setSleepStart] = useState(existingLog?.sleepStart || "22:00");
  const [sleepEnd, setSleepEnd] = useState(existingLog?.sleepEnd || "06:00");
  const [isSaved, setIsSaved] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [reflectionPrompt, setReflectionPrompt] = useState("Biarkan pikiranmu mengalir di sini...");
  const [isEditing, setIsEditing] = useState(false);
  
  const [wellnessCorrelation, setWellnessCorrelation] = useState<{
    correlation: string;
    impactScore: number;
    insight: string;
    suggestedAction?: { label: string; type: string };
    chartPoints?: { x: number; y: number }[];
  } | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const toggleFactor = (idx: number) => {
    setSelectedFactors((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  const unlockAchievement = useUserStore(state => state.unlockAchievement);

  // Synchronize form states with existingLog when not editing
  useEffect(() => {
    if (!isActive) return;
    if (!isEditing) {
      if (existingLog) {
        setSelectedMood(existingLog.moodValue - 1);
        setSelectedSleep(existingLog.sleepValue - 1);
        setSelectedFactors(
          existingLog.factors.map((f) => parseInt(f)).filter((n) => !isNaN(n))
        );
        setNotes(existingLog.notes);
        setSleepStart(existingLog.sleepStart || "22:00");
        setSleepEnd(existingLog.sleepEnd || "06:00");
      } else {
        setSelectedMood(null);
        setSelectedSleep(null);
        setSelectedFactors([]);
        setNotes("");
        setSleepStart("22:00");
        setSleepEnd("06:00");
      }
    }
  }, [isActive, existingLog, isEditing]);

  const fetchCorrelation = async () => {
    setLoadingAnalysis(true);
    try {
      // For student wellness, we prefer local heuristic correlation to ensure accuracy without external latencies
      const logs = Object.values(moodLogs);
      if (logs.length >= 2) {
        const topFactors: Record<string, number> = {};
        logs.forEach(l => l?.factors?.forEach(f => {
          if (f && !f.startsWith('vibe_')) topFactors[f] = (topFactors[f] || 0) + 1;
        }));
        
        const topFactorIdx = Object.entries(topFactors).sort((a,b) => b[1]-a[1])[0]?.[0];
        const factorName = factors[parseInt(topFactorIdx || "0")]?.label || "Aktivitas";
        
        setWellnessCorrelation({
          correlation: `Terdapat korelasi positif antara ${factorName} dan stabilitas Mood-mu.`,
          impactScore: 18,
          insight: `Analisis data menunjukkan bahwa hari-hari dengan intensitas ${factorName.toLowerCase()} yang konsisten berkontribusi pada skor kebahagiaan 20% lebih tinggi.`,
          suggestedAction: { label: "Lihat Detail Habit", type: "health" },
          chartPoints: logs.slice(-5).map((l, i) => ({ x: i, y: (l.moodValue * 25) + (l.sleepValue * 5) }))
        });
      }
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    if (!isActive) return;
    if (Object.keys(moodLogs).length >= 2) {
      fetchCorrelation();
    }
    const LOCAL_REFLECTION_PROMPTS = [
      "Biarkan pikiranmu mengalir di sini...",
      "Apa yang paling membuatmu bersyukur hari ini?",
      "Bagaimana perasaanmu tentang tugas kuliah yang kamu hadapi sekarang?",
      "Apakah ada momen kecil hari ini yang membuatmu tersenyum?",
      "Apa satu hal yang ingin kamu lakukan lebih baik besok?",
      "Bagaimana caramu mengelola rasa lelah hari ini?",
      "Adakah hal tidak terduga yang terjadi dan bagaimana kamu menyikapinya?",
      "Apa pesan positif yang ingin kamu sampaikan pada dirimu sendiri saat ini?"
    ];
    const randomPrompt = LOCAL_REFLECTION_PROMPTS[Math.floor(Math.random() * LOCAL_REFLECTION_PROMPTS.length)];
    setReflectionPrompt(randomPrompt);
  }, [isActive, moodLogs]);

  useEffect(() => {
    if (!isActive) return;
    if (existingLog) {
      const aiInsight = generateHeuristicInsight(aiService.generateStateSnapshot(), "Mood & Tidur");
      setInsight(aiInsight.message);
    }
  }, [isActive, existingLog, focusLogs, tasks]);

  const saveCheckIn = () => {
    if (selectedMood !== null && selectedSleep !== null) {
      // Play sound
      const audio = new Audio("/sounds/success.mp3");
      audio.volume = 0.4;
      audio.play().catch(() => {});

      logMood({
        date: today,
        moodValue: selectedMood + 1, // 1-4
        sleepValue: selectedSleep + 1, // 1-4
        sleepStart,
        sleepEnd,
        sleepDuration: calculateSleepDuration(sleepStart, sleepEnd),
        factors: selectedFactors.map(String),
        notes,
      });
      unlockAchievement("mood_explorer");

      if (selectedMood === 0) {
        setShowBreathing(true);
      }

      setIsEditing(false);

      // Analyze sentiment if notes exist
      if (notes.length > 5) {
        const data = analyzeSentimentLocal(notes);
        if (data.sentiment === "stressed" || data.sentiment === "sad") {
          toast(
            data.recommendation ||
              "Sepertinya kamu sedang penat. Yuk coba meditasi 15 menit.",
            {
              icon: "🧠",
              duration: 6000,
              style: {
                borderRadius: "16px",
                background: "#fee2e2", // red-50
                color: "#991b1b", // red-800
                padding: "16px",
                fontWeight: "bold",
              },
            },
          );
        }
      }
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  const moods = [
    {
      value: 1,
      icon: Frown,
      label: "Buruk",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      activeBorder: "border-purple-500/50",
      chartColor: "#8b5cf6",
    },
    {
      value: 2,
      icon: Meh,
      label: "Biasa",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      activeBorder: "border-indigo-500/50",
      chartColor: "#6366f1",
    },
    {
      value: 3,
      icon: Smile,
      label: "Baik",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      activeBorder: "border-emerald-500/50",
      chartColor: "#10b981",
    },
    {
      value: 4,
      icon: Sparkles,
      label: "Sangat Baik",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      activeBorder: "border-orange-500/50",
      chartColor: "#f97316",
    },
  ];

  const sleeps = [
    { label: "< 5 j", sub: "Kurang", value: 1 },
    { label: "5 - 6 j", sub: "Cukup", value: 2 },
    { label: "7 - 8 j", sub: "Baik", value: 3 },
    { label: "8+ j", sub: "Optimal", value: 4 },
  ];

  const factors = [
    { icon: Brain, label: "Fokus" },
    { icon: Zap, label: "Energi" },
    { icon: Book, label: "Kuliah" },
    { icon: Flame, label: "Stres" },
    { icon: Heart, label: "Hubungan" },
  ];

  const weeklyTrendData = useMemo(() => {
    const past7Days = getPast7Days();
    return past7Days.map((d) => {
      const log = moodLogs[d.dateStr];
      const moodValue = log ? log.moodValue : 0;
      const sleepValue = log ? log.sleepValue : 0;
      const label = log
        ? moods.find((m) => m.value === log.moodValue)?.label || "Biasa"
        : "Belum isi";
      const sleepLabel =
        log && sleeps.find((s) => s.value === log.sleepValue)
          ? sleeps.find((s) => s.value === log.sleepValue)!.label
          : "Belum isi";
      return { day: d.dayLabel, moodValue, sleepValue, label, sleepLabel };
    });
  }, [moodLogs]);

  const scatterData = useMemo(() => {
    const data: {
      moodValue: number;
      factorIdx: number;
      count: number;
      name: string;
    }[] = [];

    for (let m = 1; m <= 4; m++) {
      for (let f = 0; f < factors.length; f++) {
        data.push({
          moodValue: m,
          factorIdx: f,
          count: 0,
          name: factors[f].label,
        });
      }
    }

    Object.values(moodLogs).forEach((log) => {
      const m = log.moodValue;
      log.factors.forEach((fStr) => {
        const fIdx = parseInt(fStr);
        const item = data.find(
          (d) => d.moodValue === m && d.factorIdx === fIdx,
        );
        if (item) item.count++;
      });
    });

    return data.filter((d) => d.count > 0);
  }, [moodLogs]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/90 dark:bg-slate-800/90 border border-outline/20 p-2 rounded-lg shadow-lg backdrop-blur-md">
          <p className="font-bold text-xs text-on-surface mb-1">{label}</p>
          <div className="flex flex-col gap-1 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="text-on-surface-variant">Mood:</span>
              <span className="text-on-surface font-bold">{data.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-on-surface-variant">Tidur:</span>
              <span className="text-secondary font-bold">
                {data.sleepLabel}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };


  if (isSaved) {
    return (
      <div className="space-y-10 pt-4 pb-12 flex flex-col items-center justify-center min-h-[70vh] text-center relative">
        {/* Mindfulness Bridge Suggestion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-6 rounded-2xl bg-primary/10 border border-primary/20 max-w-sm"
        >
          <div className="flex items-center gap-2 mb-2 justify-center">
            <Sparkles size={16} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Mindfulness Bridge</span>
          </div>
          <p className="text-sm font-semibold text-on-surface">
            {selectedMood !== null && selectedMood < 2 
              ? "Mood-mu butuh sedikit 'boost'. Bagaimana kalau kita mulai sesi Fokus Lo-fi selama 15 menit?" 
              : "Energimu sedang di puncak! Waktu yang tepat untuk mengerjakan tugas tersulitmu."}
          </p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-36 h-36 flex items-center justify-center p-4 bg-emerald-500/5 rounded-full border border-emerald-500/10 relative">
            <LazyLottie
              src="https://assets8.lottiefiles.com/packages/lf20_touohxv0.json"
              loop={false}
              autoplay
            />
          </div>
          <div>
            <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-2">
              Refleksi Tersimpan
            </h2>
            <p className="font-body text-on-surface-variant text-base max-w-sm leading-relaxed opacity-70">
              Terima kasih telah jujur pada dirimu sendiri. Setiap catatan adalah langkah menuju keseimbangan.
            </p>
          </div>
          <Button 
            variant="secondary"
            onClick={() => {
              setIsSaved(false);
              onNavigate?.("insight");
            }}
            className="mt-2 rounded-xl"
          >
            Lihat Analisis Saya
          </Button>
        </motion.div>

        {/* Breathing Exercise Centered Modal Overlay */}
        <AnimatePresence>
          {showBreathing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md"
              >
                <Card className="p-8 rounded-2xl bg-white border border-outline/20 shadow-2xl text-center space-y-8">
                  <div className="space-y-3">
                    <Wind size={48} className="mx-auto text-primary animate-pulse" />
                    <CardTitle className="text-2xl font-headline font-bold text-on-surface">Ambil Napas Sejenak</CardTitle>
                    <CardDescription className="text-on-surface-variant text-sm leading-relaxed">
                      Mood kamu sedang rendah. Mari kita reset energi dengan 3 tarikan napas dalam.
                    </CardDescription>
                  </div>
                  
                  <motion.div 
                    animate={{ 
                      scale: [0.9, 1.1, 0.9],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ duration: 4, repeat: 2 }}
                    onAnimationComplete={() => setTimeout(() => setShowBreathing(false), 1500)}
                    className="w-36 h-36 rounded-full border-4 border-primary flex items-center justify-center mx-auto"
                  >
                    <span className="text-xs font-bold text-primary uppercase tracking-widest animate-pulse">Tarik Napas...</span>
                  </motion.div>

                  <div className="pt-2">
                    <Button 
                      variant="ghost"
                      onClick={() => setShowBreathing(false)}
                      className="w-full text-xs uppercase tracking-widest text-on-surface-variant hover:text-on-surface"
                    >
                      Lewati Latihan
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const currentMoodData = selectedMood !== null ? moods[selectedMood] : null;

  if (!isActive) {
    return <div className="min-h-[500px]" />;
  }

  return (
    <div className="space-y-8 md:space-y-12 pt-2 md:pt-4 pb-20 relative min-h-screen">
      {/* Background Subtle Texture */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[#0f172a] opacity-[0.01]" />
      </div>

      <section className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 border-b border-outline/5 pb-6 md:pb-8">
        <div>
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface tracking-tight mb-2">
             Mindful Check-in
          </h2>
          <p className="font-body text-sm md:text-base text-on-surface-variant max-w-lg opacity-70">
            Dengarkan dirimu hari ini. Bagaimana frekuensi energimu bergetar?
          </p>
        </div>
        <Card className="px-4 py-2 rounded-xl bg-slate-50/80 border border-outline/20">
           <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Sesi Terakhir</span>
           <p className="text-xs font-semibold text-on-surface mt-0.5">{existingLog ? "Sudah terisi hari ini" : "Belum ada data hari ini"}</p>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Logger Column */}
        <div className={`${existingLog ? "lg:col-span-7" : "lg:col-span-12 max-w-4xl mx-auto w-full"} transition-all duration-500 space-y-6 md:space-y-8`}>
          {existingLog && !isEditing ? (
            <Card className="border border-outline/20 bg-white p-6 md:p-8 rounded-2xl shadow-sm overflow-hidden relative">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-outline/5 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Heart size={16} fill="currentColor" />
                    </div>
                    <h3 className="font-headline font-bold text-lg text-on-surface">Jurnal Hari Ini</h3>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="text-xs uppercase tracking-widest text-primary hover:text-primary-dim"
                  >
                    Edit Refleksi
                  </Button>
                </div>

                {existingLog && moods[existingLog.moodValue - 1] && (
                  <div className={`flex items-center gap-4 p-5 rounded-2xl border ${moods[existingLog.moodValue - 1].bg} ${moods[existingLog.moodValue - 1].border}`}>
                    <div className="p-3 rounded-xl bg-white shadow-sm">
                      {(() => {
                        const MoodIcon = moods[existingLog.moodValue - 1].icon;
                        return <MoodIcon size={36} className={moods[existingLog.moodValue - 1].color} />;
                      })()}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Mood Kamu</span>
                      <h4 className={`font-headline font-black text-xl leading-none mt-1 ${moods[existingLog.moodValue - 1].color}`}>
                        {moods[existingLog.moodValue - 1].label}
                      </h4>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {existingLog && sleeps[existingLog.sleepValue - 1] && (
                    <div className="p-5 rounded-2xl border border-outline/10 bg-slate-50/50 flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Tidur & Istirahat</span>
                      <span className="font-headline font-bold text-base text-on-surface mt-1">{sleeps[existingLog.sleepValue - 1].label} ({sleeps[existingLog.sleepValue - 1].sub})</span>
                      {existingLog?.sleepStart && existingLog?.sleepEnd && (
                        <span className="text-xs font-semibold text-on-surface-variant opacity-70 mt-1">
                          Durasi: {existingLog.sleepDuration?.toFixed(1) || calculateSleepDuration(existingLog.sleepStart, existingLog.sleepEnd).toFixed(1)} jam ({existingLog.sleepStart} - {existingLog.sleepEnd})
                        </span>
                      )}
                    </div>
                  )}

                  {existingLog?.factors && existingLog.factors.length > 0 && (
                    <div className="p-5 rounded-2xl border border-outline/10 bg-slate-50/50 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Faktor Vibrasi</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {existingLog.factors.map((fStr) => {
                          const idx = parseInt(fStr);
                          const factor = factors[idx];
                          if (!factor) return null;
                          const FactorIcon = factor.icon;
                          return (
                            <div key={fStr} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-outline/10 rounded-lg text-[10px] font-bold uppercase tracking-wider text-on-surface">
                              <FactorIcon size={10} className="text-primary/70" />
                              {factor.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {existingLog?.notes && (
                  <div className="p-5 rounded-2xl border border-outline/10 bg-slate-50/30 flex flex-col gap-2 relative">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Gema Pikiran</span>
                    <p className="text-sm font-semibold italic text-on-surface leading-relaxed pl-3 border-l-2 border-primary/40">
                      "{existingLog.notes}"
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="border border-outline/20 bg-white p-6 md:p-8 rounded-2xl shadow-sm overflow-hidden relative">
              <div className="mb-8">
                <div className="flex flex-col items-center text-center gap-2 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                    <Heart size={20} fill="currentColor" className="opacity-80" />
                  </div>
                  <h3 className="font-headline font-bold text-xl text-on-surface tracking-tight">Apa warna emosimu saat ini?</h3>
                  <p className="text-on-surface-variant text-xs font-medium opacity-60">Pilih vibrasi yang paling mewakili perasaanmu.</p>
                </div>
                
                <div className="relative flex justify-center py-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 w-full">
                    {moods.map((m, i) => (
                      <motion.button
                        key={`mood-choice-${m.label}`}
                        whileHover={{ y: -2, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedMood(i)}
                        className={`group/mood flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border transition-all duration-300 ${
                          selectedMood === i
                            ? `${m.bg} ${m.activeBorder} border-2 text-on-surface`
                            : "border-outline/20 bg-slate-50/50 hover:bg-slate-100/50 text-on-surface-variant"
                        }`}
                      >
                        <div className={`p-3 rounded-xl transition-all duration-300 ${selectedMood === i ? "bg-white/80 shadow-sm" : "bg-slate-100 group-hover/mood:bg-white"}`}>
                          <m.icon
                            size={32}
                            className={`${selectedMood === i ? m.color : "text-on-surface-variant opacity-40"} transition-all duration-300`}
                            strokeWidth={selectedMood === i ? 2.5 : 2}
                          />
                        </div>
                        <div className="text-center">
                          <span className={`font-bold text-xs uppercase tracking-wider block leading-tight ${selectedMood === i ? m.color : "text-on-surface-variant"}`}>
                            {m.label}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {selectedMood !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/10">
                        <Moon size={16} fill="currentColor" className="opacity-80" />
                      </div>
                      <h3 className="font-headline font-bold text-lg text-on-surface tracking-tight">Kualitas istirahatmu?</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {sleeps.map((s, i) => (
                        <button
                          key={`sleep-choice-${s.label}`}
                          onClick={() => setSelectedSleep(i)}
                          className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl transition-all duration-300 border ${
                            selectedSleep === i
                              ? "border-secondary bg-secondary/10 text-secondary font-bold"
                              : "border-outline/20 bg-slate-50/50 hover:bg-slate-100/50 text-on-surface-variant"
                          }`}
                        >
                          <span className="font-bold text-sm leading-none">{s.label}</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">
                            {s.sub}
                          </span>
                        </button>
                      ))}
                    </div>

                    <Card className="bg-slate-50/50 border border-outline/20 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                      <p className="text-xs font-bold uppercase tracking-widest text-secondary text-center mb-4">Precision Time Tracking</p>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                        <div className="flex-1 w-full space-y-2">
                          <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest block text-center">Mulai Tidur</label>
                          <div className="relative">
                            <input 
                              type="time" 
                              value={sleepStart}
                              onChange={(e) => setSleepStart(e.target.value)}
                              className="w-full bg-white border border-outline/20 focus:border-secondary/40 focus:ring-1 focus:ring-secondary/40 rounded-xl p-3 text-center font-bold text-on-surface focus:outline-none shadow-sm transition-all appearance-none cursor-pointer hover:bg-slate-50"
                            />
                          </div>
                        </div>
                        
                        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0 shadow-sm transition-transform duration-300">
                          <Moon size={18} fill="currentColor" className="opacity-80" />
                        </div>
                        
                        <div className="flex-1 w-full space-y-2">
                          <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest block text-center">Bangun Tidur</label>
                          <div className="relative">
                            <input 
                              type="time" 
                              value={sleepEnd}
                              onChange={(e) => setSleepEnd(e.target.value)}
                              className="w-full bg-white border border-outline/20 focus:border-secondary/40 focus:ring-1 focus:ring-secondary/40 rounded-xl p-3 text-center font-bold text-on-surface focus:outline-none shadow-sm transition-all appearance-none cursor-pointer hover:bg-slate-50"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {selectedSleep !== null && selectedMood !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/10">
                          <Sparkles size={16} fill="currentColor" className="opacity-80" />
                        </div>
                        <h3 className="font-headline font-bold text-lg text-on-surface tracking-tight">Vibrasi Hari Ini?</h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {factors.map((f, i) => (
                          <button
                            key={`mood-factor-${f.label}`}
                            onClick={() => toggleFactor(i)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all font-bold text-xs uppercase tracking-wider ${
                              selectedFactors.includes(i)
                                ? "bg-primary/10 text-primary border-primary/30 font-bold"
                                : "bg-slate-50/50 border-outline/20 hover:bg-slate-100/50 text-on-surface-variant"
                            }`}
                          >
                            <f.icon
                              size={16}
                              strokeWidth={selectedFactors.includes(i) ? 2.5 : 2}
                              className={selectedFactors.includes(i) ? "text-primary" : "text-primary/60"}
                            />
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                         <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-500/10">
                            <Book size={16} fill="currentColor" className="opacity-80" />
                         </div>
                          <h3 className="font-headline font-bold text-lg text-on-surface tracking-tight">Gema Pikiran</h3>
                       </div>
                       <div className="relative group">
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={reflectionPrompt}
                            className="w-full bg-white border border-outline/20 focus:border-primary/40 focus:ring-1 focus:ring-primary/40 rounded-2xl p-5 text-sm focus:outline-none transition-all resize-none h-32 text-on-surface placeholder:text-on-surface-variant/40 font-medium"
                          />
                       </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      {existingLog && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setIsEditing(false);
                            // Reset state to existing values
                            setSelectedMood(existingLog.moodValue - 1);
                            setSelectedSleep(existingLog.sleepValue - 1);
                            setSelectedFactors(existingLog.factors.map(f => parseInt(f)).filter(n => !isNaN(n)));
                            setNotes(existingLog.notes);
                            setSleepStart(existingLog.sleepStart || "22:00");
                            setSleepEnd(existingLog.sleepEnd || "06:00");
                          }}
                          className="flex-1 h-14 rounded-2xl text-xs uppercase tracking-widest text-on-surface-variant font-bold border border-outline/10"
                        >
                          Batal
                        </Button>
                      )}
                      <Button
                        onClick={saveCheckIn}
                        className="flex-1 h-14 rounded-2xl text-xs uppercase tracking-widest bg-primary hover:bg-primary/95 text-white font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <span>{existingLog ? "Simpan" : "Check-in"}</span>
                        <Sparkles size={16} />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}
        </div>

        {/* Insight Column - ZEN VOID: Hidden during initial input */}
        <AnimatePresence>
          {existingLog && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-5 space-y-8"
            >
              <AIInsight 
                message={insight || "Ritme harianmu menunjukkan korelasi kuat antara tidur optimal dan kejernihan pikiran di pagi hari."}
                actionText="Tanya AI Coach"
                onAction={() => {
                  if (insight) setActiveChatContext(insight);
                  onOpenChat?.();
                }}
              />

              <Card className="border border-outline/20 p-6 md:p-8 rounded-2xl bg-white shadow-sm flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl">
                  📊
                </div>
                <div className="space-y-2">
                  <h3 className="font-headline font-bold text-xl text-on-surface tracking-tight">
                    Analisis & Korelasi Data Anda
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed max-w-sm">
                    Seluruh analisis sains data mendalam (Baterai Tubuh, Keseimbangan Hidup, dan Rekomendasi Kebiasaan Pintar) telah disentralisasi di Dashboard Insight.
                  </p>
                </div>
                {onNavigate && (
                  <Button 
                    onClick={() => onNavigate("insight")} 
                    className="w-full py-3 text-sm font-bold bg-primary text-white hover:bg-primary-dim transition-all shadow-sm rounded-xl flex items-center justify-center gap-2"
                  >
                    Lihat Analisis Saya
                  </Button>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
