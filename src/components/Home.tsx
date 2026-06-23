import React, { useState, useEffect } from "react";
import { useUserStore } from "../lib/userStore";
import { useProductivityStore } from "../lib/productivityStore";
import { useHabitsStore } from "../lib/habitsStore";
import { useSettingsStore } from "../lib/settingsStore";
import { getTodayDateString } from "../lib/dateUtils";
import { motion, AnimatePresence } from "motion/react";
import { AIInsight } from "./AIInsight";
import { generateHeuristicInsight } from "../services/heuristicInsightEngine";
import { aiService } from "../services/aiService";
import {
  Droplet,
  Smile,
  Footprints,
  Brain,
  ChevronRight,
  CheckCircle2,
  ListTodo,
  Flame,
  Calendar,
  Zap,
  Star,
  Bell,
  Clock,
  Moon,
  Sparkles,
  ThermometerSun,
  User,
} from "lucide-react";
import { auth } from "../lib/firebase";
import {
  getStreakDayStatus,
  getGreetingMessage,
  getMoodDetails,
  getTodaysClasses,
} from "../lib/homeHelpers";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

const StreakTracker = ({ moodLogs, streakCount }: { moodLogs: any; streakCount: number }) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date();

  return (
    <div className="glass-panel p-6 relative overflow-hidden group">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/25 shadow-inner">
             <Flame className="text-primary" size={20} fill="currentColor" />
           </div>
           <div>
             <span className="font-headline font-bold text-on-surface text-2xl tracking-tight">{streakCount}</span>
             <span className="text-xs font-bold text-on-surface-variant ml-1 uppercase tracking-wider opacity-60">Day Streak</span>
           </div>
        </div>
        <div className="flex items-center gap-1 bg-surface-container-highest/50 px-3 py-1.5 rounded-full border border-outline/5">
           <Zap size={12} className="text-primary" fill="currentColor" />
           <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant opacity-60">High Focus</span>
        </div>
      </div>

      <div className="flex justify-between items-end gap-1.5">
        {days.map((day, i) => {
          const status = getStreakDayStatus(i, moodLogs, today);
          return (
            <div key={day} className="flex flex-col items-center gap-2.5 flex-1 group/day">
               <span className={`text-xs font-bold uppercase tracking-wider transition-all duration-300 ${status === "today" ? "text-primary opacity-100" : "text-on-surface-variant opacity-30 group-hover/day:opacity-60"}`}>
                {day}
              </span>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-500 relative ${
                status === "completed" 
                  ? "bg-gradient-to-br from-primary to-primary-dim text-white shadow-md shadow-primary/20" 
                  : status === "today"
                  ? "bg-surface border-2 border-primary/50 text-primary shadow-inner"
                  : "bg-surface-container-highest/40 border border-outline/5 text-on-surface-variant/20"
              }`}>
                {status === "completed" ? (
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                ) : (
                  <div className={`w-1.5 h-1.5 rounded-full ${status === "today" ? "bg-primary animate-pulse" : "bg-current"}`} />
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Home({
  onNavigate,
  onOpenChat,
  isActive = true,
}: {
  onNavigate?: (tab: string, subTab?: string) => void;
  onOpenChat?: () => void;
  isActive?: boolean;
}) {
  const [greeting, setGreeting] = useState<string>("Halo");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const waterLogs = useHabitsStore((state) => state.waterLogs);
  const baseWaterGoal = useHabitsStore((state) => state.baseWaterGoal);
  const moodLogs = useHabitsStore((state) => state.moodLogs);
  const streakCount = useHabitsStore((state) => state.streakCount);
  const schedules = useProductivityStore(state => state.schedules);
  const userName = useUserStore((state) => state.userName) || "Sobat";
  const stepsLogs = useHabitsStore((state) => state.stepsLogs);
  const stepGoal = useHabitsStore((state) => state.stepGoal);
  const meditationLogs = useHabitsStore((state) => state.meditationLogs);
  const meditationGoal = useHabitsStore((state) => state.meditationGoal);
  const tasks = useProductivityStore(state => state.tasks);
  const prayerAlarms = useHabitsStore(state => state.prayerAlarms);
  const isFasting = useUserStore(state => state.isFasting);
  const settings = useSettingsStore((state) => state.settings);
  const religion = settings?.religion || "islam";
  const currentWeather = useUserStore((state) => (state as any).currentWeather);
  const xp = useUserStore((state) => (state as any).xp || 0);
  const level = useUserStore((state) => (state as any).level || 1);
  const nextLevelXP = level * 1000;
  const xpPercentage = (xp / nextLevelXP) * 100;
  
  const [insight, setInsight] = useState<string | null>(null);
  const setActiveChatContext = useUserStore(state => state.setActiveChatContext);

  const today = getTodayDateString();
  const consumedWater = waterLogs[today] || 0;
  const todaySteps = stepsLogs[today] || 0;
  const todayMeditation = meditationLogs[today] || 0;
  const pendingTasks = tasks.filter((t) => !t.completed);
  const todayMood = moodLogs[today];

  const [prayerTimes, setPrayerTimes] = useState<{ name: string; time: string }[]>([]);

  useEffect(() => {
    if (!isActive) return;
    const fetchTimes = async () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`);
            const data = await res.json();
            if (data?.data?.timings) {
              const t = data.data.timings;
              setPrayerTimes([
                { name: "Subuh", time: t.Fajr },
                { name: "Dzuhur", time: t.Dhuhr },
                { name: "Ashar", time: t.Asr },
                { name: "Maghrib", time: t.Maghrib },
                { name: "Isya", time: t.Isha },
              ]);
            }
          } catch (e) {
            console.error(e);
          }
        });
      }
    };
    fetchTimes();
  }, [isActive]);

  const moodDetails = getMoodDetails(todayMood?.moodValue);
  const moodLabel = moodDetails.label;
  const auraColor = moodDetails.colorClass;
  const auraBg = moodDetails.bgClass;
  
  const moodIcon = moodDetails.iconName === "Sparkles" 
    ? <Sparkles size={24} className={auraColor} /> 
    : <Smile size={24} className={auraColor} />;

  const currentDayStr = new Date().getDay();
  const todaysClasses = getTodaysClasses(schedules as any[], currentDayStr);

  useEffect(() => {
    if (!isActive) return;
    const hour = new Date().getHours();
    setGreeting(getGreetingMessage(hour));
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    const aiInsight = generateHeuristicInsight(aiService.generateStateSnapshot(), "Beranda Utama");
    setInsight(aiInsight.message);
  }, [
    isActive,
    userName,
    schedules,
    tasks,
    prayerAlarms,
    isFasting,
    settings,
    waterLogs,
    baseWaterGoal,
    moodLogs,
    streakCount,
    stepsLogs,
    stepGoal,
    meditationLogs,
    meditationGoal,
  ]);

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
  };
  const formattedDate = new Intl.DateTimeFormat("id-ID", dateOptions).format(
    new Date(),
  );

  if (!isActive) {
    return <div className="min-h-[500px]" />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pt-6 pb-20 max-w-2xl mx-auto px-1"
    >
      {/* Header Section */}
      <motion.section variants={itemVariants} className="relative px-2 py-4">
        <div className="relative flex justify-between items-start gap-3">
          <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-white p-1 rounded-full shadow-2xl border border-white/50 overflow-hidden shrink-0"
            >
              <div className="w-full h-full bg-surface-variant rounded-full flex items-center justify-center shadow-inner overflow-hidden">
                {((settings?.userAvatar === "👤" || !settings?.userAvatar) && auth.currentUser?.photoURL) ? (
                  <img 
                    src={auth.currentUser.photoURL} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  settings?.userAvatar && settings.userAvatar !== "👤" ? (
                    <span className="p-2 text-3xl">{settings?.userAvatar}</span>
                  ) : (
                    <User className="text-on-surface-variant/85 w-8 h-8 sm:w-10 sm:h-10" />
                  )
                )}
              </div>
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-black uppercase tracking-wider ${auraColor} opacity-70 mb-1 truncate`}>{greeting}</p>
              <h1 className="text-2xl sm:text-3xl font-headline font-black leading-none tracking-tighter text-on-surface truncate">
                {userName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                  <div className="px-2.5 sm:px-3 py-1 rounded-full bg-white/50 border border-white/40 flex items-center gap-2 shadow-sm shrink-0">
                    <Calendar size={12} className={auraColor} />
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{formattedDate}</span>
                  </div>
                  {currentWeather && (
                    <div className="px-3 py-1 rounded-full bg-white/50 border border-white/40 flex items-center gap-2 shadow-sm">
                      <ThermometerSun size={12} className={currentWeather.isHot ? "text-orange-500" : "text-blue-500"} />
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{currentWeather.temperature}°C</span>
                    </div>
                  )}
               </div>

               {/* LEVEL PROGRESS BAR */}
               <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4 hidden sm:flex">
                 <div className="flex-1 w-full max-w-[320px]">
                   <div className="flex justify-between items-end mb-1.5">
                     <span className="text-xs font-black uppercase tracking-wider text-on-surface-variant opacity-60">Aura Level {level}</span>
                     <span className="text-xs font-bold text-on-surface-variant opacity-40">{xp}/{nextLevelXP} XP</span>
                   </div>
                   <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden border border-outline/5 shadow-inner">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-primary to-primary/60"
                        initial={{ width: 0 }}
                        animate={{ width: `${xpPercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                   </div>
                 </div>
               </div>
            </div>
          </div>
        
        <div className="relative shrink-0">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="w-12 h-12 rounded-2xl bg-white border border-outline/10 flex items-center justify-center text-on-surface-variant shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
             <Bell size={20} />
             {pendingTasks.length > 0 && (
               <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
             )}
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-72 glass-panel p-4 z-50 shadow-2xl border-white/40"
              >
                <h4 className="font-headline font-black text-xs uppercase tracking-wider text-on-surface-variant mb-3">Pemberitahuan</h4>
                <div className="space-y-3">
                  {pendingTasks.length > 0 ? (
                    <div className="flex items-start gap-3 p-2 rounded-xl bg-primary/5 border border-primary/10">
                      <Zap size={14} className="text-primary mt-0.5" />
                      <p className="text-xs font-bold text-on-surface leading-snug">Kamu punya {pendingTasks.length} tugas yang belum selesai hari ini.</p>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-on-surface-variant px-2">Tidak ada pemberitahuan baru.</p>
                  )}
                  {streakCount > 0 && (
                    <div className="flex items-start gap-3 p-2 rounded-xl bg-primary/5 border border-primary/10">
                      <Flame size={14} className="text-primary mt-0.5" />
                      <p className="text-xs font-bold text-on-surface leading-snug">Hebat! Kamu sudah {streakCount} hari konsisten.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* LEVEL PROGRESS BAR (Mobile) */}
      <div className="mt-2 flex flex-col items-stretch gap-4 sm:hidden relative z-10 px-2">
         <div className="glass-panel p-4 flex flex-col gap-3">
            <div className="flex-1 w-full">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-on-surface-variant opacity-60">Aura Level {level}</span>
                <span className="text-xs font-bold text-on-surface-variant opacity-40">{xp}/{nextLevelXP} XP</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden border border-outline/5 shadow-inner">
                 <motion.div 
                   className="h-full bg-gradient-to-r from-primary to-primary/60"
                   initial={{ width: 0 }}
                   animate={{ width: `${xpPercentage}%` }}
                   transition={{ duration: 1, ease: "easeOut" }}
                 />
              </div>
            </div>
         </div>
      </div>
    </motion.section>

      {/* AI Guardian (Coaching First) */}
      <motion.div variants={itemVariants}>
        <AIInsight 
          message={insight || "Keseimbangan adalah kunci. Energi pagimu sangat bagus untuk mengerjakan tugas sulit."}
          actionText="Ngobrol dengan Guardian"
          onAction={() => {
            if (insight) setActiveChatContext(insight);
            if (onOpenChat) onOpenChat();
          }}
        />
      </motion.div>

      {/* Daily Streak Tracker */}
      <motion.div variants={itemVariants}>
        <StreakTracker moodLogs={moodLogs} streakCount={streakCount} />
      </motion.div>

      {/* Hero Widget: What's Next */}
      <motion.div
        variants={itemVariants}
        onClick={() => onNavigate && onNavigate("productivity")}
        className="relative group cursor-pointer"
      >
        <div className="relative glass-panel p-8 rounded-2xl bg-gradient-to-br from-white/60 to-white/20 border-white/40 shadow-2xl overflow-hidden min-h-[160px] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
                <Calendar size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black uppercase tracking-wider text-primary/60">Agenda Terdekat</span>
                <h3 className="font-headline font-black text-xl sm:text-2xl text-on-surface tracking-tight mt-0.5 truncate">
                   {todaysClasses.length > 0 ? todaysClasses[0].className : pendingTasks.length > 0 ? `${pendingTasks.length} Tugas Pending` : "Semua Beres!"}
                </h3>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-container-highest/30 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shrink-0 self-end sm:self-auto">
               <ChevronRight size={18} className="sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6 relative z-10">
             {todaysClasses.length > 0 ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/50 border border-white/20 text-xs font-bold text-on-surface-variant">
                   <Clock size={14} className="text-primary" />
                   <span>{todaysClasses[0].startTime} • {todaysClasses[0].room}</span>
                </div>
             ) : pendingTasks.length > 0 ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/10 text-xs font-bold text-primary">
                   <Star size={14} className="text-primary" fill="currentColor" />
                   <span>Siap untuk fokus?</span>
                </div>
             ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/10 text-xs font-bold text-emerald-600">
                   <CheckCircle2 size={14} className="text-emerald-500" />
                   <span>Nikmati waktu luangmu</span>
                </div>
             )}
          </div>
        </div>
      </motion.div>

      {/* Minimalist Card Grid: Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Mood Card */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4 }}
          onClick={() => onNavigate && onNavigate("health", "mood")}
          className="glass-panel rounded-2xl p-6 bg-white/60 border border-white shadow-xl flex flex-col justify-between cursor-pointer group min-h-[200px]"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-black text-on-surface-variant uppercase tracking-wider opacity-60">Mental</span>
              <h3 className="font-headline font-black text-2xl text-on-surface tracking-tight leading-tight mt-1">
                {moodLabel}
              </h3>
            </div>
            <div className={`w-10 h-10 rounded-2xl ${auraBg} flex items-center justify-center ${auraColor} shadow-inner shrink-0`}>
              {moodIcon}
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center gap-2 bg-white/40 border border-white/60 w-fit px-3 py-1 rounded-xl shadow-sm">
              <div className={`w-2 h-2 rounded-full ${auraColor.replace('text-', 'bg-')} animate-pulse`} />
              <span className="text-xs font-black text-on-surface uppercase tracking-wider">Aura Aktif</span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium mt-3 opacity-60">Klik untuk refleksi harian.</p>
          </div>
        </motion.div>

        {/* Water Card */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2 }}
          onClick={() => onNavigate && onNavigate("health")}
          className="glass-panel rounded-2xl p-6 bg-primary/5 border border-primary/20 shadow-sm flex flex-col justify-between cursor-pointer group min-h-[200px]"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider opacity-60">Hidrasi</span>
              <h3 className="font-headline font-bold text-2xl text-primary tracking-tight leading-tight mt-1">
                {consumedWater.toFixed(1)} L
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/15 shadow-inner shrink-0">
              <Droplet size={20} fill="currentColor" />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-on-surface-variant uppercase tracking-wider opacity-60">
              <span>Target: {baseWaterGoal} L</span>
              <span>{Math.round(Math.min((consumedWater / baseWaterGoal) * 100, 100))}%</span>
            </div>
            <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((consumedWater / baseWaterGoal) * 100, 100)}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full bg-primary rounded-full shadow-[0_0_8px_var(--theme-primary-dim)]"
              />
            </div>
          </div>
        </motion.div>

        {/* Tasks Card */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2 }}
          onClick={() => onNavigate && onNavigate("productivity")}
          className="glass-panel rounded-2xl p-6 bg-primary/5 border border-primary/20 shadow-sm flex flex-col justify-between cursor-pointer group min-h-[200px]"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider opacity-60">Tugas</span>
              <h3 className="font-headline font-bold text-2xl text-primary tracking-tight leading-tight mt-1">
                {tasks.length - pendingTasks.length} / {tasks.length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/15 shadow-inner shrink-0">
              <ListTodo size={20} />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-on-surface-variant uppercase tracking-wider opacity-60">
              <span>{pendingTasks.length} pending</span>
              <span>{tasks.length > 0 ? Math.round(Math.min(((tasks.length - pendingTasks.length) / tasks.length) * 100, 100)) : 0}%</span>
            </div>
            <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tasks.length > 0 ? Math.min(((tasks.length - pendingTasks.length) / tasks.length) * 100, 100) : 0}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full bg-primary rounded-full shadow-[0_0_8px_var(--theme-primary-dim)]"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Prayer Times Section */}
      {religion === "islam" && (
        <motion.div 
          variants={itemVariants} 
          className="px-1"
          onClick={() => onNavigate && onNavigate("prayer")}
        >
           <div className="glass-panel p-6 bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/[0.08] transition-all group/prayer">
              <div className="flex justify-between items-center mb-5">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/25 shadow-inner">
                       <Moon size={18} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-sm text-on-surface tracking-tight">Waktu Sholat</h4>
                      <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider">Regional Updates</p>
                    </div>
                 </div>
                 <ChevronRight size={18} className="text-primary/70 group-hover/prayer:translate-x-1 transition-transform" />
              </div>
              <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
                 {prayerTimes.length > 0 ? prayerTimes.map((pt) => (
                   <div key={pt.name} className={`flex flex-col items-center min-w-[68px] p-2.5 rounded-2xl transition-all ${prayerAlarms.includes(pt.name) ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white/40 border border-outline/5 group-hover/prayer:bg-white/60"}`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">{pt.name}</span>
                      <span className="text-xs font-headline font-bold tracking-tight">{pt.time}</span>
                   </div>
                 )) : (
                   <div className="w-full text-center py-2 text-xs font-bold text-on-surface-variant opacity-50 italic">Mencari lokasi...</div>
                 )}
              </div>
           </div>
        </motion.div>
      )}

      {/* Activity Details Grid */}
      <motion.div variants={itemVariants} className="space-y-5">
        {/* Steps Tracker: Refined Readability */}
        <div
          onClick={() => onNavigate && onNavigate("health", "steps")}
          className="bg-white/60 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-outline/25 shadow-sm flex flex-col md:flex-row items-center md:justify-between cursor-pointer group hover:scale-[1.01] transition-all relative overflow-hidden text-center md:text-left gap-6 md:gap-0"
        >
          <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 relative z-10 w-full md:w-auto">
            <div className="w-16 h-16 sm:w-18 sm:h-18 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner border border-primary/10">
              <Footprints size={28} className="sm:w-8 sm:h-8" strokeWidth={2} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider">Kesehatan Fisik</h4>
              <h3 className="font-headline font-bold text-on-surface text-xl sm:text-2xl tracking-tight">
                Langkah Kaki
              </h3>
            </div>
          </div>
          <div className="relative z-10 flex flex-col items-center md:items-end w-full md:w-auto">
             <div className="flex items-baseline gap-2 mb-1">
                <span className="font-headline font-bold text-3xl sm:text-4xl text-on-surface tracking-tight leading-none">{todaySteps.toLocaleString()}</span>
                <span className="text-xs font-bold text-on-surface-variant/40">Langkah</span>
             </div>
             <div className="text-xs font-bold text-primary/60 uppercase tracking-wider">Target: {stepGoal.toLocaleString()}</div>
             <div className="mt-4 w-full md:w-48 h-3 bg-primary/10 rounded-full overflow-hidden p-0.5 border border-outline/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((todaySteps / stepGoal) * 100, 100)}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className="h-full bg-gradient-to-r from-primary to-primary-dim rounded-full shadow-[0_0_12px_var(--theme-primary-dim)]"
                />
             </div>
          </div>
        </div>

        {/* Meditation Tracker: Refined Readability */}
        <div
          onClick={() => onNavigate && onNavigate("health", "meditation")}
          className="bg-white/60 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-outline/25 shadow-sm flex flex-col md:flex-row items-center md:justify-between cursor-pointer group hover:scale-[1.01] transition-all relative overflow-hidden text-center md:text-left gap-6 md:gap-0"
        >
          <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 relative z-10 w-full md:w-auto">
            <div className="w-16 h-16 sm:w-18 sm:h-18 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner border border-primary/10">
              <Brain size={28} className="sm:w-8 sm:h-8" strokeWidth={2} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider">Ketajaman Pikiran</h4>
              <h3 className="font-headline font-bold text-on-surface text-xl sm:text-2xl tracking-tight">
                Meditasi
              </h3>
            </div>
          </div>
          <div className="relative z-10 flex flex-col items-center md:items-end w-full md:w-auto">
             <div className="flex items-baseline gap-2 mb-1">
                <span className="font-headline font-bold text-3xl sm:text-4xl text-on-surface tracking-tight leading-none">{todayMeditation}</span>
                <span className="text-xs font-bold text-on-surface-variant/40">Menit</span>
             </div>
             <div className="text-xs font-bold text-primary/60 uppercase tracking-wider">Target: {meditationGoal} mnt</div>
             <div className="mt-4 w-full md:w-48 h-3 bg-primary/10 rounded-full overflow-hidden p-0.5 border border-outline/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((todayMeditation / meditationGoal) * 100, 100)}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className="h-full bg-gradient-to-r from-primary to-primary-dim rounded-full shadow-[0_0_12px_var(--theme-primary-dim)]"
                />
             </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
