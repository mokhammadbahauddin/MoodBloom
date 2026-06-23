import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Droplet,
  GlassWater,
  Coffee,
  CupSoda,
  ThermometerSun,
  Sparkles,
  X,
  Moon,
  RefreshCw,
  Trash2,
  Plus,
  TrendingUp,
  Settings2,
  Check,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { useUserStore } from "../lib/userStore";
import { useProductivityStore } from "../lib/productivityStore";
import { WaterEntry } from "../lib/habitsStore";;
import { useHabitsStore } from "../lib/habitsStore";
import { useSettingsStore } from '../lib/settingsStore';
import { getTodayDateString } from "../lib/dateUtils";
import { AIInsight } from "./AIInsight";
import { generateHeuristicInsight } from "../services/heuristicInsightEngine";
import { aiService } from "../services/aiService";
import { hapticFeedback } from "../lib/haptics";
import { renderFormattedText } from "../lib/utils";

const WaterInputArea = ({ onAdd, isFasting }: { onAdd: (amt: number) => void; isFasting: boolean }) => {
  const [customValue, setCustomValue] = useState("");

  const handleAdd = (ml: number) => {
    hapticFeedback("medium");
    onAdd(ml / 1000);
  };

  const handleCustomLog = (e: React.FormEvent) => {
    e.preventDefault();
    const ml = parseInt(customValue);
    if (!isNaN(ml) && ml > 0) {
      handleAdd(ml);
      setCustomValue("");
    }
  };

  if (isFasting) {
    return (
      <div className="glass-panel p-6 border-indigo-500/20 bg-surface-container/30 flex items-center justify-center gap-3 text-indigo-300 opacity-60">
        <Lock size={18} />
        <span className="font-bold text-sm tracking-widest uppercase">Input Locked (Fasting)</span>
      </div>
    );
  }

  const presets = [250, 500, 750, 1000];

  return (
    <div className="glass-panel p-6 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent rounded-2xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="font-headline font-bold text-xs text-primary tracking-widest uppercase mb-1 flex items-center gap-2">
            Log Hydration
          </h3>
          <p className="text-xs text-on-surface-variant font-medium">Select a preset or enter a custom amount</p>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {presets.map((ml) => (
          <button
            key={ml}
            onClick={() => handleAdd(ml)}
            className="flex flex-col items-center justify-center py-4 bg-surface-container/50 hover:bg-primary hover:text-white border border-outline-variant/30 rounded-2xl transition-all duration-300 active:scale-95 group text-on-surface hover:border-primary"
          >
            <span className="font-headline font-black text-sm">{ml}</span>
            <span className="text-xs font-bold opacity-60 group-hover:opacity-90">ml</span>
          </button>
        ))}
      </div>

      {/* Custom Numerical Input */}
      <form onSubmit={handleCustomLog} className="relative flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="number"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Custom ml..."
            className="w-full bg-surface-variant/30 border border-outline-variant/30 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary/50 font-bold text-on-surface"
            min="10"
            max="5000"
          />
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant opacity-60">ml</span>
        </div>
        <button
          type="submit"
          disabled={!customValue}
          className="bg-primary text-white p-4 rounded-2xl hover:bg-primary-dim transition-all shadow-md disabled:opacity-30 flex items-center justify-center cursor-pointer"
        >
          <Plus size={18} strokeWidth={3} />
        </button>
      </form>
    </div>
  );
};

const WaterWave = ({ percentage }: { percentage: number }) => {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none opacity-40">
      <motion.div
        className="absolute bottom-0 left-[-50%] w-[200%] h-[200%] bg-primary/30"
        style={{ borderRadius: "38%" }}
        animate={{
          y: `${100 - percentage / 2}%`,
          rotate: 360,
        }}
        transition={{
          y: { type: "spring", stiffness: 40, damping: 15 },
          rotate: { duration: 10, repeat: Infinity, ease: "linear" },
        }}
      />
      <motion.div
        className="absolute bottom-0 left-[-45%] w-[190%] h-[190%] bg-primary/20"
        style={{ borderRadius: "35%" }}
        animate={{
          y: `${100 - percentage / 2}%`,
          rotate: -360,
        }}
        transition={{
          y: { type: "spring", stiffness: 35, damping: 12 },
          rotate: { duration: 15, repeat: Infinity, ease: "linear" },
        }}
      />
    </div>
  );
};

/**
 * SplashEffect Component
 * Creative physics-based droplets that fly out on add.
 */
const SplashEffect = ({ trigger }: { trigger: number }) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    
    const newParticles = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
    }));
    
    setParticles(newParticles);
    const timer = setTimeout(() => setParticles([]), 1000);
    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
            animate={{ 
              opacity: 0, 
              scale: [1, 1.5, 0],
              x: p.x, 
              y: p.y - 100 
             }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute w-4 h-4 bg-primary rounded-full blur-[2px] shadow-[0_0_10px_var(--theme-primary-dim)]"
          >
            <Droplet size={12} className="text-white fill-white absolute inset-0 m-auto" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default function Water({
  onOpenChat,
  isActive = true,
}: {
  onOpenChat?: () => void;
  isActive?: boolean;
}) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [splashTrigger, setSplashTrigger] = useState(0);
  
  const currentWeather = useUserStore((state) => (state as any).currentWeather);
  const temperature = currentWeather?.temperature || 28;
  const loadingWeather = !currentWeather;
   const today = getTodayDateString();
  const waterLogs = useHabitsStore((state) => state.waterLogs);
  const detailedWaterLogs = useHabitsStore((state) => state.detailedWaterLogs);
  const logWater = useHabitsStore((state) => state.logWater);
  const removeWaterLog = useHabitsStore((state) => state.removeWaterLog);
  const isFasting = useUserStore(state => state.isFasting);
  const setIsFasting = useUserStore(state => state.setIsFasting);
  const settings = useSettingsStore((state) => state.settings);
  const religion = settings?.religion || "islam";
  
  // For dynamic insight
  const setActiveChatContext = useUserStore(state => state.setActiveChatContext);
  
  const consumed = waterLogs[today] || 0;
  const history = useMemo(() => detailedWaterLogs[today] || [], [detailedWaterLogs, today]);

  const isHot = temperature >= 30;
  const baseGoal = (settings?.waterGoalML || 2000) / 1000;
  const goal = isHot ? baseGoal + 0.5 : baseGoal;
  const percentage = Math.round((Math.min(consumed, goal) / goal) * 100);

  const unlockAchievement = useUserStore(state => state.unlockAchievement);

  const addWater = (amount: number, type: WaterEntry["type"] = "cup") => {
    logWater(today, amount, type);
    unlockAchievement("first_water");
    setSplashTrigger(prev => prev + 1);

    if (consumed < goal && (consumed + amount) >= goal) {
      // Play goal success sound
      new Audio("/sounds/success.mp3").play().catch(() => {});
      
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#60a5fa", "#93c5fd", "#ffffff"],
      });
    } else {
      // Play achievement/log sound
      new Audio("/sounds/achievement.mp3").play().catch(() => {});
    }
  };

  useEffect(() => {
    if (!isActive) return;
    setLastSync(new Date());
  }, [isActive, currentWeather]);

  useEffect(() => {
    if (!isActive) return;
    const aiInsight = generateHeuristicInsight(aiService.generateStateSnapshot(), "Water (Hidrasi)");
    setInsight(aiInsight.message);
  }, [isActive, temperature, goal, consumed, percentage]); // Keep deps to trigger re-eval but avoid infinite loops

  useEffect(() => {
    if (!isActive) return;
    if (insight && isHot && !loadingInsight) {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [isActive, insight, isHot, loadingInsight]);

  const getIcon = (type: WaterEntry["type"]) => {
    switch (type) {
      case "cup": return CupSoda;
      case "glass": return GlassWater;
      case "bottle": return Coffee;
      default: return Droplet;
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isActive) {
    return <div className="min-h-[400px]" />;
  }

  return (
    <div className="space-y-8 md:space-y-12 pt-2 md:pt-4 pb-12 relative">
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -80, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute top-0 left-0 right-0 z-50 px-4"
          >
            <div className="glass-panel w-full p-4 shadow-2xl flex items-start gap-3 border border-orange-500/30 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 shadow-inner">
                <ThermometerSun size={20} />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex justify-between items-center mb-0.5">
                  <h4 className="font-bold text-sm text-on-surface">
                    MoodBloom
                  </h4>
                  <span className="text-[10px] text-on-surface-variant font-medium">
                    now
                  </span>
                </div>
                <p className="font-body text-xs text-on-surface-variant leading-snug">
                  {renderFormattedText(insight || "")}
                </p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 -mt-1 bg-surface-container rounded-full"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div>
          <h2 className="font-headline text-3xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-1 md:mb-2">
            Hydration
          </h2>
          <p className="font-body text-on-surface-variant text-base md:text-lg opacity-70">
            Nourish your body, clear your mind.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3 glass-panel h-[44px] px-4 text-sm font-medium text-on-surface-variant relative overflow-hidden group">
              {isHot && <div className="absolute inset-0 bg-orange-500/10 animate-pulse" />}
              {loadingWeather ? (
                <RefreshCw className="animate-spin text-primary" size={16} />
              ) : (
                <ThermometerSun
                  size={16}
                  className={isHot ? "text-orange-500" : "text-primary"}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {loadingWeather ? "Syncing..." : `${temperature}°C`}
                {!loadingWeather && (
                  <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold text-outline ml-1 bg-surface-container px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                  </span>
                )}
              </span>
            </div>
            {!loadingWeather && (
              <span className="text-xs text-on-surface-variant font-medium mr-1">
                Updated {lastSync.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            )}
          </div>
          {religion === "islam" && (
            <button
              onClick={() => {
                hapticFeedback("light");
                setIsFasting(!isFasting);
              }}
              className={`flex items-center justify-center gap-2 font-bold h-[44px] px-4 rounded-xl transition-all shadow-sm text-sm ${
                isFasting
                  ? "bg-primary text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]"
                  : "glass-panel text-primary hover:bg-primary/10"
              }`}
            >
              <Moon size={18} className="shrink-0" />
              <span>{isFasting ? "Mode Puasa Aktif" : "Sedang Puasa?"}</span>
            </button>
          )}
        </div>
      </section>

      {isFasting && religion === "islam" && (
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative p-8 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-[0_20px_50px_rgba(var(--primary-rgb),0.1)] group bg-surface-container-low"
        >
          {/* Animated Background Pulse */}
          <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-on-primary shadow-lg shadow-primary/20 shrink-0 border-4 border-surface-container">
              <Moon size={40} strokeWidth={2} />
            </div>
            <div className="text-center md:text-left">
              <h4 className="font-bold font-headline text-3xl mb-3 text-on-surface tracking-tight flex items-center justify-center md:justify-start gap-3">
                Fokus pada Ibadah <Sparkles size={24} className="text-primary" />
              </h4>
              <p className="text-lg font-body text-on-surface font-medium leading-relaxed max-w-2xl">
                Karena kamu sedang puasa, hidrasi diprioritaskan antara <span className="text-primary font-black px-1.5 py-0.5 bg-primary/10 rounded-md">Maghrib hingga Imsak</span>. 
                Fitur pengisian air harian secara otomatis dikunci sementara agar tidak mengganggu fokus ibadah siang harimu.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 ${isFasting ? "" : ""}`}>
        {/* Progress Gauge */}
        <div className="lg:col-span-7 space-y-6 md:space-y-8">
          <div className="glass-panel p-6 md:p-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[380px] md:min-h-[420px] group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
            
            <div className="w-full flex justify-between items-start mb-6 md:mb-8 z-10">
              <div>
                <h3 className="font-headline font-bold text-2xl text-on-surface flex items-center gap-2">
                  Progress <TrendingUp size={20} className="text-primary" />
                </h3>
                <p className="text-xs text-on-surface-variant font-medium mt-1">
                  Keep flowing toward your goal
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-on-surface">
                  {goal.toFixed(1)}L Goal
                </div>
                {isHot && (
                  <div className="flex flex-col items-end">
                    <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1 border border-orange-500/30 animate-pulse">
                      +0.5L Heat Auto-Adjust
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg
                className="w-full h-full absolute transform -rotate-90 drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  fill="none"
                  r="46"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="6"
                ></circle>
                <motion.circle
                  cx="50"
                  cy="50"
                  fill="none"
                  r="46"
                  stroke="currentColor"
                  strokeDasharray="289"
                  initial={{ strokeDashoffset: 289 }}
                  animate={{ strokeDashoffset: 289 - (percentage / 100) * 289 }}
                  transition={{ type: "spring", stiffness: 60, damping: 15 }}
                  strokeLinecap="round"
                  strokeWidth="6"
                  className={`${isHot ? "text-orange-500" : "text-primary"} transition-colors`}
                />
              </svg>

              <div className={`absolute inset-6 rounded-full overflow-hidden bg-surface-container-low shadow-inner ${isFasting ? 'opacity-30' : ''}`}>
                <WaterWave percentage={percentage} />
                <SplashEffect trigger={splashTrigger} />
                
                <motion.div
                  className="absolute inset-0 flex flex-col items-center justify-center z-20"
                  key={consumed}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="font-headline font-bold text-5xl text-on-surface tracking-tight flex items-baseline">
                    {(consumed * 1000).toLocaleString()}
                    <span className="text-xl text-on-surface-variant ml-0.5 font-medium">ml</span>
                  </div>
                  <div className="font-body text-xs font-bold text-primary mt-1.5 px-3 py-1 bg-primary/10 rounded-full">
                    {percentage}%
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 mt-8 z-10">
              <div className="bg-surface-container/50 p-4 rounded-2xl border border-outline-variant text-center">
                <div className="text-xs uppercase font-bold text-on-surface-variant mb-1">Remaining</div>
                <div className="text-xl font-headline font-extrabold text-on-surface">
                  {Math.max(0, goal - consumed).toFixed(2)}<span className="text-xs ml-0.5">L</span>
                </div>
              </div>
              <div className="bg-surface-container/50 p-4 rounded-2xl border border-outline-variant text-center">
                <div className="text-xs uppercase font-bold text-on-surface-variant mb-1">Status</div>
                <div className={`text-xl font-headline font-extrabold ${percentage >= 100 ? "text-green-400" : "text-primary"}`}>
                  {percentage >= 100 ? "Full" : "Hydrating"}
                </div>
              </div>
            </div>
          </div>

          <WaterInputArea onAdd={(amt) => addWater(amt, "other")} isFasting={isFasting} />
        </div>
          {/* Log & AI */}
        <div className="lg:col-span-5 space-y-8">
          <div className={`${isHot ? "animate-pulse" : ""}`}>
            {loadingInsight ? (
              <div className="glass-panel p-6 bg-surface-container animate-pulse h-[140px] flex flex-col gap-2">
                <div className="h-4 bg-primary/20 rounded w-full"></div>
                <div className="h-4 bg-primary/20 rounded w-5/6"></div>
              </div>
            ) : (
              <AIInsight
                message={insight || "Stay hydrated to maintain peak cognitive performance."}
                actionText="Analisis Detail"
                onAction={() => {
                  if (insight) setActiveChatContext(insight);
                  onOpenChat?.();
                }}
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-headline font-bold text-sm text-on-surface-variant tracking-widest uppercase">
                Session Flow
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                {history.length} Logs Today
              </span>
            </div>

            <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {history.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 glass-panel !bg-transparent border-dashed border-2 border-outline-variant"
                  >
                    <Droplet size={32} className="text-outline mb-2" />
                    <p className="text-sm font-medium text-on-surface-variant">No logs today yet.</p>
                  </motion.div>
                ) : (
                  history.map((log) => {
                    const Icon = getIcon(log.type);
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-4 p-4 glass-panel !rounded-2xl hover:bg-surface-container/80 transition-all border border-outline-variant group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                          <Icon size={24} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-on-surface text-sm capitalize">
                            {log.type === "other" ? "Custom" : log.type} Intake
                          </h4>
                          <p className="text-xs text-on-surface-variant font-bold uppercase tracking-tight">
                            {formatTime(log.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-headline font-extrabold text-on-surface text-lg">
                              {(log.amount * 1000).toFixed(0)}<span className="text-xs ml-0.5 font-bold">ml</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              hapticFeedback("medium");
                              removeWaterLog(today, log.id);
                            }}
                            className="p-2.5 text-error/60 hover:text-error hover:bg-error/10 rounded-xl transition-all border border-transparent hover:border-error/20"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
