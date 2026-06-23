import { useHabitsStore } from "../lib/habitsStore";
import React, { useState, Component, ErrorInfo, ReactNode, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity, Database, TrendingUp, Target, ArrowUpRight,
  Droplet, Wind, Compass, Heart, ShieldCheck, Book, Clock, Layers, Zap,
  Flame, Award, FileText, Moon, Sparkles, Loader2
} from "lucide-react";
import {
  LineChart as RechartsLine, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, ScatterChart, Scatter, ZAxis, Cell, ReferenceArea,
  ReferenceLine, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { AIAvatar } from "./AIInsight";
import toast from "react-hot-toast";
import { renderFormattedText } from "../lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { ProgressBar } from "./ui/ProgressBar";
import { useStatsData } from "../hooks/useStatsData";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError(_: Error) { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("Stats Error:", error, errorInfo); }
  render() { 
    if ((this as any).state.hasError) return (this as any).props.fallback; 
    return (this as any).props.children; 
  }
}

const RefArea = ReferenceArea as any;
const RefLine = ReferenceLine as any;

export default function Stats({
  onOpenChat,
  onNavigate,
  isActive = true,
}: {
  onOpenChat?: () => void;
  onNavigate?: (tab: any, subTab?: any) => void;
  isActive?: boolean;
}) {
  const {
    timeRange, setTimeRange, selectedDay, setSelectedDay,
    userId, userName, waterLogs, moodLogs, focusAreas, achievements,
    streakData, correlationData, factorsData, stats,
    storySummary, dynamicRecommendations, radarData,
    predictiveInsight, mapSleepToHours, mapEnergyToLevel, baseWaterGoal,
    weeklyCoachingReport, aiAnalysis
  } = useStatsData(isActive);

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    if (isActive && !weeklyCoachingReport && !isGeneratingReport) {
      handleGenerateWeeklyReport();
    }
  }, [isActive, weeklyCoachingReport]);

  const handleGenerateWeeklyReport = async () => {
    setIsGeneratingReport(true);
    try {
      const { aiService } = await import("../services/aiService");
      // Call both in parallel to fully update coaching report and dynamic recommendations
      await Promise.all([
        aiService.getWeeklyReport(),
        aiService.analyzeWellness(true)
      ]);
      toast.success("Analisis & rekomendasi AI berhasil diperbarui!");
    } catch (err) {
      console.error("Failed to generate weekly report:", err);
      toast.error("Gagal memperbarui analisis AI. Silakan coba lagi.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleRecAction = (rec: any) => {
    if (!onNavigate) return;

    // Convert strings to uppercase/lowercase for case-insensitive matching
    const actionNormalized = (rec.action || "").toUpperCase().trim();
    const typeNormalized = (rec.type || "").toLowerCase().trim();
    const titleNormalized = (rec.title || "").toUpperCase().trim();

    // 1. Water/Hydration check
    if (
      actionNormalized.includes("MINUM") || 
      actionNormalized.includes("DRINK") || 
      actionNormalized.includes("AIR") || 
      actionNormalized.includes("HIDRASI") ||
      typeNormalized === "health" ||
      typeNormalized === "hydration" ||
      titleNormalized.includes("MINUM") ||
      titleNormalized.includes("HIDRASI")
    ) {
      onNavigate("health", "water");
    }
    // 2. Schedule/Tasks check
    else if (
      actionNormalized.includes("JADWAL") || 
      actionNormalized.includes("SCHEDULE") || 
      actionNormalized.includes("ATUR") || 
      actionNormalized.includes("WAKTU") || 
      actionNormalized.includes("FOKUS") || 
      actionNormalized.includes("TIMER") ||
      typeNormalized === "focus" ||
      typeNormalized === "recovery" ||
      typeNormalized === "productivity" ||
      titleNormalized.includes("JADWAL") ||
      titleNormalized.includes("FOKUS")
    ) {
      onNavigate("productivity", "schedule");
    }
    // 3. Mood/Journaling check
    else if (
      actionNormalized.includes("JURNAL") || 
      actionNormalized.includes("CATAT") || 
      actionNormalized.includes("MOOD") || 
      actionNormalized.includes("EMOSI") || 
      actionNormalized.includes("REFLEKSI") ||
      (typeNormalized === "stability" && actionNormalized.includes("CATAT")) ||
      titleNormalized.includes("JURNAL") ||
      titleNormalized.includes("MOOD")
    ) {
      onNavigate("health", "mood");
    }
    // 4. Step goals / Walk check
    else if (
      actionNormalized.includes("LANGKAH") ||
      actionNormalized.includes("JALAN") ||
      actionNormalized.includes("STEPS") ||
      actionNormalized.includes("WALK") ||
      typeNormalized === "steps" ||
      titleNormalized.includes("LANGKAH") ||
      titleNormalized.includes("JALAN")
    ) {
      onNavigate("health", "steps");
    }
    // 5. Meditation check
    else if (
      actionNormalized.includes("MEDITASI") ||
      actionNormalized.includes("TENANG") ||
      actionNormalized.includes("MEDITATE") ||
      actionNormalized.includes("BREATHE") ||
      typeNormalized === "meditation" ||
      titleNormalized.includes("MEDITASI")
    ) {
      onNavigate("health", "meditation");
    }
    // 6. Maintenance / Default (Home)
    else {
      onNavigate("home");
    }
  };

  const [isExporting] = useState(false);
  const [activeMetrics, setActiveMetrics] = useState<string[]>([
    "moodScore",
    "energyLevel",
    "waterIntake",
    "sleepHours",
    "focusMinutes"
  ]);

  const availableMetrics = [
    { id: "moodScore", label: "Mood Score", color: "#6366f1" },
    { id: "energyLevel", label: "Energi", color: "#10b981" },
    { id: "waterIntake", label: "Air (L)", color: "#0ea5e9" },
    { id: "sleepHours", label: "Tidur (j)", color: "#a855f7" },
    { id: "focusMinutes", label: "Fokus (m)", color: "#f43f5e" },
  ];

  const exportReport = () => window.print();

  const consolidatedKPIs = useMemo(() => {
    const baseStats = stats.map((stat) => {
      let icon;
      switch (stat.label) {
        case "Baterai Tubuh":
          icon = <Zap size={18} className="text-emerald-500" />;
          break;
        case "Konsumsi Air":
          icon = <Droplet size={18} className="text-blue-500" />;
          break;
        case "Kualitas Tidur":
          icon = <Moon size={18} className="text-indigo-500" />;
          break;
        case "Kesehatan Mental":
          icon = <Heart size={18} className="text-rose-500" />;
          break;
        default:
          icon = <Activity size={18} className="text-primary" />;
      }
      return {
        ...stat,
        icon,
      };
    });

    const streakCard = {
      label: "Streak Harian",
      value: `${streakData.currentStreak} Hari`,
      interpretation: streakData.isActiveToday ? "Momentum Terjaga" : "Belum Log Hari Ini",
      icon: <Flame size={18} className={streakData.isActiveToday ? "text-orange-500 animate-pulse" : "text-on-surface-variant/40"} />,
      color: "bg-orange-500/10",
      desc: "Konsistensi Aktivitas",
      delta: `${streakData.totalActive} Total`,
      deltaType: "up",
      status: streakData.isActiveToday ? "Aktif" : "Mulai Log",
      statusColor: streakData.isActiveToday ? "text-orange-500" : "text-on-surface-variant",
    };

    const bestHabitCard = {
      label: "Kebiasaan Terbaik",
      value: "Hidrasi",
      interpretation: "Konsistensi Tinggi",
      icon: <Award size={18} className="text-amber-500 animate-pulse" />,
      color: "bg-amber-500/10",
      desc: "Berdasarkan frekuensi",
      delta: "Top 1",
      deltaType: "up",
      status: "Optimal",
      statusColor: "text-amber-500",
    };

    return [...baseStats, streakCard, bestHabitCard];
  }, [stats, streakData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-3 border-outline-variant shadow-lg backdrop-blur-md bg-surface-container/90 rounded-2xl">
          <p className="font-bold text-sm text-on-surface mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${entry.dataKey}-${index}`} className="flex items-center gap-2 text-xs font-medium">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-on-surface-variant flex-1">{entry.name}:</span>
              <span className="text-on-surface font-bold">
                {entry.value} {entry.name.includes("Minum") && entry.name !== "Total Catatan" ? "L" : entry.name.includes("Tidur") ? "Jam" : ""}
              </span>
            </div>
          ))}
        </Card>
      );
    }
    return null;
  };

  if (!isActive) {
    return <div className="min-h-[500px]" />;
  }

  return (
    <ErrorBoundary fallback={
      <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center text-3xl">⚠️</div>
        <h2 className="text-xl font-bold text-on-surface">Data Visualisasi Gagal Dimuat</h2>
        <Button onClick={() => window.location.reload()}>Muat Ulang</Button>
      </div>
    }>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pt-4 pb-12 w-full max-w-full overflow-hidden print:overflow-visible print:p-0 print:space-y-4">
        {/* Print Header */}
        <div className="hidden print:flex flex-col gap-6 mb-12 border-b-4 border-primary pb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black text-primary uppercase tracking-tighter">Wellness Intelligence Report</h1>
              <p className="text-lg font-bold text-on-surface-variant">Generated by MoodBloom Oasis System</p>
            </div>
            <div className="text-right">
              <p className="font-black text-on-surface text-xl">{userName}</p>
              <p className="text-sm font-bold text-primary uppercase tracking-widest">ID: {userId?.substring(0,8)}</p>
            </div>
          </div>
        </div>

        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-outline/10">
              <Database size={20} />
            </div>
            <div>
              <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">Intelligence Briefing</h2>
              <p className="text-on-surface-variant font-medium text-[10px] opacity-75 uppercase tracking-wider mt-1">Advanced Report</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportReport} disabled={isExporting} className="shadow-lg print:hidden">
              <Layers size={14} className="mr-2" /> {isExporting ? "Memproses PDF..." : "Export Report (PDF)"}
            </Button>
            <div className="bg-surface-container-low p-1 rounded-2xl border border-outline/10 flex gap-1">
              {["7D", "30D", "All"].map((r) => (
                <Button key={r} variant={timeRange === r ? "default" : "ghost"} size="sm" onClick={() => setTimeRange(r)} className="text-[10px] font-black tracking-widest uppercase">
                  {r}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Consolidated KPI Grid (6 cards) */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {consolidatedKPIs.map((stat) => (
            <motion.div whileHover={{ y: -4 }} key={`stat-card-${stat.label}`} className="h-full">
              <Card className="p-4 h-full flex flex-col justify-between transition-all duration-300 relative overflow-hidden group shadow-sm border border-outline/20 rounded-2xl bg-surface hover:border-primary/40">
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${stat.color} border border-outline/10`}>
                    {stat.icon}
                  </div>
                  <Badge variant="outline" className={`text-[8px] uppercase tracking-wider ${stat.statusColor} bg-surface-container border-transparent rounded-full px-2 py-0.5`}>{stat.status}</Badge>
                </div>
                <div className="relative z-10">
                  <div className="flex flex-col mb-3">
                    <span className="text-[9px] font-semibold text-on-surface-variant uppercase tracking-wider mb-0.5 opacity-75">{stat.label}</span>
                    <div className="flex items-baseline gap-1.5">
                      <p className="font-headline text-2xl font-bold text-on-surface tracking-tight">{stat.value}</p>
                      <span className={`text-[10px] font-bold ${stat.deltaType === "up" ? "text-emerald-500" : "text-rose-500"}`}>{stat.delta}</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low/40 p-2.5 rounded-xl border border-outline/10 space-y-1">
                     <p className="text-[11px] font-bold text-on-surface leading-tight">{stat.interpretation}</p>
                     <p className="text-[9px] font-medium text-on-surface-variant leading-tight opacity-75">{stat.desc}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Targets & Badges */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 border border-outline/20 shadow-sm rounded-2xl bg-surface">
            <CardHeader className="p-0 mb-3 flex-row items-center gap-2 space-y-0">
              <Target className="text-secondary" size={16} /> <CardTitle className="text-sm font-semibold">Target Fokusmu</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-wrap gap-1.5">
              {focusAreas.length > 0 ? focusAreas.map((area, i) => (
                <Badge key={i} variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wider rounded-full">{area}</Badge>
              )) : <span className="text-on-surface-variant text-xs flex-1">Belum mengatur target fokus.</span>}
            </CardContent>
          </Card>
          <Card className="p-5 border border-outline/20 shadow-sm rounded-2xl bg-surface">
            <CardHeader className="p-0 mb-3 flex-row items-center gap-2 space-y-0">
              <Award className="text-amber-500 animate-pulse" size={16} />
              <CardTitle className="text-sm font-semibold">Lencana & Pencapaian</CardTitle>
            </CardHeader>
            <CardContent className="p-0 grid grid-cols-4 gap-2">
              {achievements.map((ach) => (
                <div key={ach.id} className="relative group text-center flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${ach.unlockedAt ? "bg-amber-500/10 border border-amber-500/20 text-amber-500" : "bg-surface-container border border-outline/10 grayscale opacity-45 group-hover:grayscale-0 group-hover:opacity-100"}`}>{ach.icon}</div>
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 bg-surface-container border border-outline-variant rounded-2xl p-2.5 shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    <p className="text-xs font-semibold text-on-surface">{ach.title}</p>
                    <p className="text-[9px] text-on-surface-variant font-medium mt-1">{ach.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Multi-Metric Chart with Interactive Toggles */}
        <motion.div variants={itemVariants}>
          <Card className="p-4 md:p-6 border border-outline/20 shadow-sm bg-surface rounded-2xl">
            <CardHeader className="p-0 flex flex-col md:flex-row items-center justify-between gap-3 mb-6 border-b border-outline/10 pb-4 space-y-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-outline/10 shrink-0"><Activity size={20} /></div>
                <div className="text-center md:text-left">
                  <CardTitle className="font-headline font-bold text-lg text-on-surface tracking-tight">Korelasi Metrik Utama</CardTitle>
                  <CardDescription className="text-[10px] font-semibold text-on-surface-variant opacity-75 uppercase tracking-wider mt-0.5">Aktivitas Fisik vs Keseimbangan Emosi</CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {availableMetrics.map((m) => {
                  const isActive = activeMetrics.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setActiveMetrics((prev) =>
                          prev.includes(m.id)
                            ? prev.filter((id) => id !== m.id)
                            : [...prev, m.id]
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-surface-container-low border-outline/10 text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: m.color }}
                      />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full relative" style={{ height: '360px', minHeight: '360px' }}>
                {activeMetrics.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-on-surface-variant/60 font-semibold uppercase tracking-wider gap-2 bg-surface-container/10 rounded-2xl">
                    <Activity size={24} className="opacity-40 animate-pulse" />
                    Pilih metrik di atas untuk menampilkan grafik korelasi
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={correlationData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.08} />
                      <RefArea yAxisId="right" y1={7} y2={9} fill="var(--color-primary, #6366f1)" fillOpacity={0.04} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }} dy={10} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }} domain={[0, 100]} width={30} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }} domain={[0, 10]} width={30} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: "9px", fontWeight: "semibold", textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: "15px", width: '100%', opacity: 0.8 }} />
                      
                      {activeMetrics.includes("moodScore") && (
                        <Area yAxisId="left" type="monotone" dataKey="moodScore" name="Mood Score" stroke="var(--color-primary, #6366f1)" strokeWidth={2} fillOpacity={1} fill="url(#colorMood)" activeDot={{ r: 5, strokeWidth: 0, fill: "var(--color-primary, #6366f1)" }} onClick={(data: any) => { if (data && data.payload) setSelectedDay(data.payload); }} className="cursor-pointer" />
                      )}
                      {activeMetrics.includes("energyLevel") && (
                        <Bar yAxisId="left" dataKey="energyLevel" name="Energi" fill="#10b981" radius={[3, 3, 0, 0]} barSize={10} fillOpacity={0.6} onClick={(data: any) => { if (data) setSelectedDay(data); }} className="cursor-pointer" />
                      )}
                      {activeMetrics.includes("waterIntake") && (
                        <Bar yAxisId="right" dataKey="waterIntake" name="Air (L)" barSize={16} fill="#0ea5e9" radius={[4, 4, 0, 0]} fillOpacity={0.6} />
                      )}
                      {activeMetrics.includes("sleepHours") && (
                        <Line yAxisId="right" type="monotone" dataKey="sleepHours" name="Tidur (j)" stroke="#a855f7" strokeWidth={2} dot={{ r: 3, strokeWidth: 1.5, fill: "var(--color-surface, #fff)" }} activeDot={{ r: 5, strokeWidth: 0, fill: "#a855f7" }} onClick={(data: any) => { if (data && data.payload) setSelectedDay(data.payload); }} className="cursor-pointer" />
                      )}
                      {activeMetrics.includes("focusMinutes") && (
                        <Line yAxisId="left" type="monotone" dataKey="focusMinutes" name="Fokus (m)" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="3 3" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: "#f43f5e" }} onClick={(data: any) => { if (data && data.payload) setSelectedDay(data.payload); }} className="cursor-pointer" />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category & Factors Analytics Grid (4 Columns) */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Dominasi Pikiran */}
          <Card className="p-5 md:p-6 border border-outline/20 shadow-sm bg-surface flex flex-col rounded-2xl col-span-1">
            <CardHeader className="p-0 flex flex-col justify-between gap-3 mb-6 border-b border-outline/10 pb-4 space-y-0">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0 border border-outline/10">
                   <FileText className="text-secondary" size={20} />
                 </div>
                 <div>
                   <CardTitle className="font-headline font-bold text-base text-on-surface tracking-tight">Dominasi Pikiran</CardTitle>
                   <CardDescription className="text-[10px] font-semibold text-on-surface-variant opacity-75 uppercase tracking-wider mt-0.5">Topik Jurnal Terpopuler</CardDescription>
                 </div>
               </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="h-[240px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={factorsData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" opacity={0.08} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "currentColor", opacity: 0.6 }} />
                    <YAxis dataKey="factor" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "currentColor", opacity: 0.7 }} width={70} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                    <Bar dataKey="count" name="Total Catatan" radius={[0, 4, 4, 0]} barSize={16}>
                      {factorsData.map((entry, index) => (
                        <Cell key={`factors-${index}`} fill={["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#a855f7"][index % 5]} fillOpacity={0.7} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Keseimbangan Oase (Radar Chart) */}
          <Card className="p-5 md:p-6 border border-outline/20 shadow-sm bg-surface flex flex-col rounded-2xl col-span-1">
            <CardHeader className="p-0 flex items-center gap-3 mb-6 border-b border-outline/10 pb-4 space-y-0 flex-row">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-outline/10">
                 <Activity className="text-primary" size={20} />
              </div>
              <div>
                <CardTitle className="font-headline font-bold text-base text-on-surface tracking-tight">Keseimbangan Oase</CardTitle>
                <CardDescription className="text-[10px] font-semibold text-on-surface-variant opacity-75 uppercase tracking-wider mt-0.5">Life Balance Radar</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-center min-h-[240px] relative z-10">
              {radarData.length > 0 ? (
                 <ResponsiveContainer width="100%" height={240}>
                   <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                     <PolarGrid stroke="currentColor" strokeDasharray="3 3" opacity={0.12} />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: "currentColor", fontSize: 9, opacity: 0.7 }} />
                     <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                     <Radar name="Skor Keseimbangan" dataKey="A" stroke="var(--color-primary, #6366f1)" strokeWidth={2} fill="var(--color-primary, #6366f1)" fillOpacity={0.2} />
                     <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.05)'}} contentStyle={{backgroundColor: 'var(--color-surface-container, #1e293b)', border: '1px solid var(--color-outline-variant, #475569)', borderRadius: '12px', color: 'var(--color-on-surface, #fff)', fontWeight: 'semibold', fontSize: '12px'}} />
                   </RadarChart>
                 </ResponsiveContainer>
              ) : (
                 <div className="flex flex-col items-center justify-center h-full text-on-surface-variant opacity-50">
                   <ShieldCheck size={40} className="mb-2 opacity-50" />
                   <p className="text-xs font-semibold">Belum cukup data</p>
                 </div>
              )}
            </CardContent>
          </Card>

          {/* Life Balance Matrix */}
          <Card className="p-5 border border-outline/20 bg-surface shadow-sm rounded-2xl col-span-1 flex flex-col">
             <CardHeader className="p-0 flex items-center gap-3 mb-6 border-b border-outline/10 pb-4 space-y-0 flex-row">
               <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0 border border-outline/10">
                  <Heart size={20} className="text-rose-500" />
               </div>
               <div>
                  <CardTitle className="font-headline font-bold text-base text-on-surface tracking-tight">Keseimbangan Hidup</CardTitle>
                  <CardDescription className="text-[10px] font-semibold text-on-surface-variant opacity-75 uppercase tracking-wider mt-0.5">Life Balance Matrix</CardDescription>
               </div>
             </CardHeader>
             <CardContent className="p-0 space-y-4 flex-1 flex flex-col justify-center">
                {[
                  { label: "Kejernihan Mental", value: 88, color: "bg-amber-500", text: "text-amber-500" },
                  { label: "Kekuatan Fisik", value: 65, color: "bg-emerald-500", text: "text-emerald-500" },
                  { label: "Harmoni Sosial", value: 72, color: "bg-blue-500", text: "text-blue-500" },
                ].map((m) => (
                  <div key={m.label}>
                     <div className="flex justify-between text-[9px] font-semibold uppercase tracking-wider mb-1.5 opacity-75">
                        <span>{m.label}</span><span className={m.text}>{m.value}%</span>
                     </div>
                     <ProgressBar value={m.value} className="h-1 [&>div]:bg-current" style={{ color: m.color.replace('bg-', '') }} />
                  </div>
                ))}
             </CardContent>
          </Card>

          {/* Daily Rhythm */}
          <Card className="p-5 border border-outline/20 bg-surface shadow-sm rounded-2xl flex flex-col justify-between col-span-1">
             <CardHeader className="p-0 flex items-center gap-3 mb-6 border-b border-outline/10 pb-4 space-y-0 flex-row">
               <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-outline/10">
                  <Clock size={20} className="text-indigo-500" />
               </div>
               <div>
                  <CardTitle className="font-headline font-bold text-base text-on-surface tracking-tight">Ritme Harian</CardTitle>
                  <CardDescription className="text-[10px] font-semibold text-on-surface-variant opacity-75 uppercase tracking-wider mt-0.5">Daily Rhythm</CardDescription>
               </div>
             </CardHeader>
             <CardContent className="p-0 flex-1 flex flex-col justify-center">
                <div className="flex items-end gap-1 h-20 mb-4">
                   {[30, 45, 80, 95, 85, 60, 40, 55, 70, 90, 75, 40].map((h, i) => (
                      <div key={i} style={{ height: `${h}%` }} className={`flex-1 rounded-t-sm ${h > 80 ? "bg-primary" : "bg-primary/20"}`} />
                   ))}
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-primary/5 rounded-xl border border-primary/10">
                   <Clock size={14} className="text-primary" />
                   <div>
                      <p className="text-[9px] font-semibold text-on-surface-variant uppercase tracking-wider opacity-60">Prime Time</p>
                      <p className="text-xs font-bold text-on-surface">{correlationData.length > 5 ? "08:30 - 10:45 AM" : "09:00 - 11:30 AM"}</p>
                   </div>
                </div>
             </CardContent>
          </Card>
        </motion.div>

        {/* Intelligence Hub AI Panel */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 md:p-8 border border-outline/20 shadow-sm relative overflow-hidden flex flex-col lg:flex-row gap-8 bg-surface rounded-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] -mr-48 -mt-48 rounded-full pointer-events-none" />
            
            <div className="lg:w-48 flex flex-col items-center justify-start gap-4 relative z-10 pt-2 shrink-0">
              <div onClick={onOpenChat} className="w-36 h-36 relative flex items-center justify-center cursor-pointer group mb-2">
                <div className="relative z-10 w-full h-full rounded-full border border-outline/20 shadow-none overflow-hidden bg-surface-container-highest flex items-center justify-center">
                  <AIAvatar className="w-full h-full scale-110" />
                </div>
              </div>
              <div className="text-center">
                <h4 className="font-headline font-bold text-sm text-on-surface">AI Guardian</h4>
                <p className="text-[9px] font-semibold text-primary uppercase tracking-wider">Wellness Coach</p>
              </div>
            </div>
            
            <div className="flex-1 relative z-10 flex flex-col justify-between">
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-outline/10">
                  <div>
                    <h3 className="font-headline font-bold text-2xl text-on-surface tracking-tight mb-1">Intelligence Hub AI</h3>
                    <p className="text-xs font-semibold text-on-surface-variant opacity-75 uppercase tracking-wider">Sintesis Keseimbangan Mingguan & Forecast</p>
                  </div>
                  <Button 
                    onClick={handleGenerateWeeklyReport}
                    disabled={isGeneratingReport}
                    className="flex items-center gap-1.5 py-2 px-4 text-xs font-black bg-primary text-white hover:bg-primary-dim transition-all shadow-md active:scale-95 shrink-0"
                  >
                    {isGeneratingReport ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menganalisis...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Analisis AI
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="relative mb-6">
                  {weeklyCoachingReport?.content ? (
                    <div className="space-y-3">
                      <p className="font-body text-sm md:text-base text-on-surface leading-relaxed pl-4 border-l-2 border-primary/30 opacity-95 whitespace-pre-line font-medium">
                        {renderFormattedText(weeklyCoachingReport.content)}
                      </p>
                      {weeklyCoachingReport.analyzedAt && (
                        <p className="text-[9px] font-semibold text-on-surface-variant opacity-50 uppercase tracking-widest pl-4">
                          Terakhir dianalisis: {new Date(weeklyCoachingReport.analyzedAt).toLocaleString("id-ID")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-body text-sm md:text-base text-on-surface italic leading-relaxed pl-4 border-l-2 border-primary/30 opacity-90 font-medium">
                        "{renderFormattedText(storySummary)}"
                      </p>
                      <p className="text-[10px] font-semibold text-amber-600 pl-4 animate-pulse">
                        ⚠️ Menampilkan data evaluasi lokal. Tekan tombol "Analisis AI" di atas untuk hasil bertenaga Gemini.
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wider mb-1 block">Wellness Forecast</span>
                    <p className="text-xs font-bold text-on-surface leading-relaxed">"{predictiveInsight}"</p>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent rounded-full px-2 py-0.5 text-[9px] whitespace-nowrap flex items-center shrink-0">
                    <ShieldCheck size={10} className="mr-1"/> Data-Driven Forecast
                  </Badge>
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 mb-3">
                  <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Rekomendasi Tindakan Mandiri</h4>
                  {aiAnalysis?.analyzedAt && (
                    <span className="text-[9px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">
                      Terakhir diperbarui: {new Date(aiAnalysis.analyzedAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dynamicRecommendations.map((rec, i) => (
                    <Card key={`rec-${i}`} className="p-4 rounded-2xl bg-surface-container/20 border border-outline/10 shadow-none flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                         <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-white/5 border border-outline/10 flex items-center justify-center text-xl shadow-none shrink-0">
                            {rec.type === 'stability' ? '🌙' : rec.type === 'focus' ? '✨' : rec.type === 'health' ? '💧' : '📋'}
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{rec.title}</h4>
                            <p className="text-xs font-medium text-on-surface-variant leading-relaxed opacity-75 mb-3">{rec.desc}</p>
                            <Button 
                               onClick={() => handleRecAction(rec)}
                               variant="ghost" 
                               size="sm" 
                               className="text-[9px] font-semibold text-primary uppercase tracking-wider p-0 h-auto hover:bg-transparent flex items-center"
                             >
                                {rec.action} <ArrowUpRight size={12} className="ml-1" />
                             </Button>
                         </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Journal Highlights */}
        <motion.div variants={itemVariants}>
          <Card className="p-5 md:p-6 border border-outline/20 shadow-sm bg-surface mt-6 rounded-2xl">
            <CardHeader className="p-0 flex items-center gap-3 mb-6 space-y-0 flex-row">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-outline/10">
                 <Book className="text-indigo-500" size={20} />
              </div>
              <div>
                <CardTitle className="font-headline font-bold text-lg text-on-surface tracking-tight">Journal & Activity Highlights</CardTitle>
                <CardDescription className="text-[10px] font-semibold text-on-surface-variant opacity-75 uppercase tracking-wider mt-0.5">Recent Reflections & Life Context</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
               {Object.entries(moodLogs).slice(-5).reverse().map(([date, log]) => (
                  <Card key={`reflection-${date}`} className="p-4 rounded-2xl bg-surface-container/30 border border-outline/10 shadow-none">
                     <div className="flex justify-between items-center mb-2">
                        <p className="text-[9px] font-semibold text-primary uppercase tracking-wider">{date}</p>
                        <div className="flex gap-1">
                           {log.factors.map((f, fi) => (
                             <Badge key={`factor-${date}-${f}-${fi}`} variant="outline" className="text-[8px] px-2 py-0.5 bg-primary/10 text-primary border-transparent rounded-full uppercase">{f}</Badge>
                           ))}
                        </div>
                     </div>
                     <p className="text-xs font-medium text-on-surface italic leading-relaxed">
                        "{log.notes || "Tidak ada catatan untuk hari ini."}"
                     </p>
                     <div className="mt-3 flex gap-4 text-[9px] font-semibold uppercase tracking-wider opacity-60">
                        <span>Mood: {log.moodValue}/4</span>
                        <span>Energi: {mapEnergyToLevel(waterLogs[date] || 0, mapSleepToHours(log.sleepValue), baseWaterGoal)}%</span>
                        <span>Tidur: {mapSleepToHours(log.sleepValue)}j</span>
                     </div>
                  </Card>
               ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Modal */}
        <AnimatePresence>
          {selectedDay && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDay(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative z-10 w-full max-w-lg">
                <Card className="p-8 border-white/20 shadow-2xl bg-surface text-on-surface rounded-2xl">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">{selectedDay.date}</p>
                      <h3 className="font-headline text-3xl font-black tracking-tight">{selectedDay.day} Detail</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)} className="rounded-full bg-surface-container hover:bg-surface-container-highest">
                      <Wind size={20} className="rotate-45" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <Card className="p-4 bg-primary/5 border-primary/10 shadow-none rounded-2xl">
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Mood Score</p>
                      <p className="text-2xl font-black">{selectedDay.moodScore}%</p>
                    </Card>
                    <Card className="p-4 bg-blue-500/5 border-blue-500/10 shadow-none rounded-2xl">
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Hydration</p>
                      <p className="text-2xl font-black">{selectedDay.waterIntake}L</p>
                    </Card>
                    <Card className="p-4 bg-indigo-500/5 border-indigo-500/10 shadow-none rounded-2xl">
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Sleep</p>
                      <p className="text-2xl font-black">{selectedDay.sleepHours}h</p>
                    </Card>
                    <Card className="p-4 bg-emerald-500/5 border-emerald-500/10 shadow-none rounded-2xl">
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Steps</p>
                      <p className="text-2xl font-black">{selectedDay.steps}</p>
                    </Card>
                  </div>
                  {selectedDay.notes && (
                    <div className="mb-8 p-6 bg-surface-container-low rounded-2xl border border-outline/5 italic text-sm text-on-surface-variant">
                      "{selectedDay.notes}"
                    </div>
                  )}
                  <div className="flex gap-4">
                    <Button onClick={() => setSelectedDay(null)} className="flex-1 py-6 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20">
                      Close Insight
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </ErrorBoundary>
  );
}
