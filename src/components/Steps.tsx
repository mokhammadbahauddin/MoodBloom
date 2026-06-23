import React, { useState, useEffect } from "react";
import { useUserStore } from "../lib/userStore";
import { useHabitsStore } from "../lib/habitsStore";
import { useProductivityStore } from "../lib/productivityStore";;
import { useSettingsStore } from '../lib/settingsStore';
import { getTodayDateString } from "../lib/dateUtils";
import { hapticFeedback } from "../lib/haptics";
import { 
  Activity, 
  Footprints, 
  Plus, 
  RefreshCw, 
  Zap, 
  Map, 
  Flame, 
  Trophy, 
  Smartphone, 
  Trash2, 
  Check, 
  Clock,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from "recharts";
import toast from "react-hot-toast";

export default function Steps({ isActive = true }: { isActive?: boolean }) {
  const stepsLogs = useHabitsStore(state => state.stepsLogs);
  const detailedStepsLogs = useHabitsStore(state => state.detailedStepsLogs);
  const logSteps = useHabitsStore(state => state.logSteps);
  const removeStepLog = useHabitsStore(state => state.removeStepLog);
  const stepGoal = useHabitsStore(state => state.stepGoal);
  const today = getTodayDateString();
  const todaySteps = stepsLogs[today] || 0;
  const todayDetailed = detailedStepsLogs[today] || [];

  const [manualInput, setManualInput] = useState("");
  const [liveSteps, setLiveSteps] = useState(0);
  const [isSensorActive, setIsSensorActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { settings, updateSettings } = useSettingsStore();
  const isConnectedStrava = settings.stravaConnected && settings.stravaAccessToken;
  const [isSyncing, setIsSyncing] = useState(false);

  const handleConnectStrava = async () => {
    const { initiateStravaAuth } = await import("../services/strava");
    initiateStravaAuth();
  };

  const handleRefreshSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
       let totalAdded = 0;
       const state = useHabitsStore.getState();
       
       if (isConnectedStrava && settings.stravaAccessToken) {
         let token = settings.stravaAccessToken;
         const isExpired = settings.stravaExpiresAt ? Date.now() > settings.stravaExpiresAt : true;
         if (isExpired && settings.stravaRefreshToken) {
           const refreshRes = await fetch("/api/strava/refresh", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ refresh_token: settings.stravaRefreshToken }),
           });
           if (refreshRes.ok) {
             const refreshData = await refreshRes.json();
             token = refreshData.access_token;
             updateSettings({
               stravaAccessToken: refreshData.access_token,
               stravaRefreshToken: refreshData.refresh_token,
               stravaExpiresAt: refreshData.expires_at * 1000,
             });
           } else {
             updateSettings({
               stravaConnected: false,
               stravaAccessToken: undefined,
               stravaRefreshToken: undefined,
               stravaExpiresAt: undefined,
             });
             toast.error("Sesi Strava telah kedaluwarsa. Silakan hubungkan kembali.");
             setIsSyncing(false);
             return;
           }
         }

         const { fetchStravaSteps } = await import("../services/strava");
         const { steps: total } = await fetchStravaSteps(token);
         
         const currentDetailed = state.detailedStepsLogs[today] || [];
         const sourceTotalSoFar = currentDetailed
            .filter((l: any) => l.source === "strava")
            .reduce((sum: number, l: any) => sum + l.amount, 0);
         
         const delta = Math.max(0, total - sourceTotalSoFar);
         if (delta > 0) {
            logSteps(today, total, "set", "strava");
            totalAdded += delta;
         }
       }

       if (totalAdded > 0) {
         toast.success(`+${totalAdded.toLocaleString()} langkah berhasil disinkronkan!`, { icon: '✨' });
       } else {
         toast("Data sudah paling mutakhir", { icon: '👍' });
       }
    } catch (e) {
       toast.error("Gagal sinkronisasi data");
    } finally {
       setTimeout(() => setIsSyncing(false), 1000);
    }
  };

  const progress = Math.min((todaySteps / stepGoal) * 100, 100);
  const distanceKm = (todaySteps * 0.000762).toFixed(2); 
  const calories = (todaySteps * 0.04).toFixed(0); 

  const weeklyData = [
    { day: "M", steps: 4500 },
    { day: "S", steps: 3200 },
    { day: "S", steps: 5100 },
    { day: "R", steps: 2800 },
    { day: "K", steps: 6000 },
    { day: "J", steps: 4200 },
    { day: "S", steps: todaySteps },
  ];

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(manualInput);
    if (!isNaN(val) && val > 0) {
      logSteps(today, val, "add", "manual");
      setManualInput("");
      toast.success(`${val} langkah ditambahkan secara manual`);

      if (todaySteps + val >= stepGoal && todaySteps < stepGoal) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const startPedometer = async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== "granted") {
          setErrorMsg("Izin sensor gerak ditolak.");
          return;
        }
      } catch (err) {
        setErrorMsg("Gagal meminta izin sensor.");
        return;
      }
    }

    if (!window.DeviceMotionEvent) {
      setErrorMsg("Perangkat Anda tidak mendukung sensor gerak.");
      return;
    }

    setIsSensorActive(true);
    let stepCount = 0;
    let unsavedSteps = 0;
    let lastMagnitude = 0;
    const threshold = 2.5; // Acceleration deviation threshold (m/s^2)
    let isStepValid = true;
    let saveTimeout: any = null;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      
      const { x, y, z } = acc;
      // Calculate 3D vector magnitude
      const magnitude = Math.sqrt((x || 0)**2 + (y || 0)**2 + (z || 0)**2);
      const deltaMagnitude = Math.abs(magnitude - lastMagnitude);

      // Ignore the initial giant spike when lastMagnitude is 0
      if (lastMagnitude !== 0 && deltaMagnitude > threshold && isStepValid) {
        stepCount++;
        unsavedSteps++;
        setLiveSteps(stepCount);
        
        // Debounce saving: Wait for 3 seconds of inactivity before saving to store
        // This prevents bombarding the store/Firebase with updates while walking
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
           if (unsavedSteps > 0) {
              logSteps(getTodayDateString(), unsavedSteps, "add", "sensor");
              unsavedSteps = 0; // Reset after saving
           }
        }, 3000);

        isStepValid = false;
        setTimeout(() => { isStepValid = true; }, 400); // 400ms minimum between steps
      }
      lastMagnitude = magnitude;
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  };

  if (!isActive) {
    return <div className="min-h-[400px]" />;
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-32">
      {/* Metrics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 md:p-8 shadow-2xl relative overflow-hidden group">
           <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] group-hover:bg-primary/10 transition-all duration-1000" />
           <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
              <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center">
                 <svg className="w-full h-full -rotate-90">
                    <circle cx="80" cy="80" r="72" className="stroke-surface-container-highest fill-none md:hidden" strokeWidth="10" />
                    <circle cx="96" cy="96" r="88" className="stroke-surface-container-highest fill-none hidden md:block" strokeWidth="12" />
                    <motion.circle
                      cx="80" cy="80" r="72"
                      className="stroke-primary fill-none md:hidden"
                      strokeWidth="10"
                      strokeDasharray="452"
                      initial={{ strokeDashoffset: 452 }}
                      animate={{ strokeDashoffset: 452 - (452 * progress) / 100 }}
                      strokeLinecap="round"
                    />
                    <motion.circle
                      cx="96" cy="96" r="88"
                      className="stroke-primary fill-none hidden md:block"
                      strokeWidth="12"
                      strokeDasharray="553"
                      initial={{ strokeDashoffset: 553 }}
                      animate={{ strokeDashoffset: 553 - (553 * progress) / 100 }}
                      strokeLinecap="round"
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <Footprints size={24} className="text-primary mb-1 animate-bounce" />
                    <span className="text-4xl font-headline font-black text-on-surface leading-none">{Math.round(progress)}%</span>
                    <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-60">Target</span>
                 </div>
              </div>

              <div className="flex-1 space-y-6 text-center md:text-left w-full">
                 <div>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant mb-2">Kinetic Progress</h2>
                    <div className="flex items-baseline gap-2 justify-center md:justify-start">
                       <span className="text-5xl md:text-6xl font-headline font-black text-on-surface tracking-tighter">{todaySteps.toLocaleString()}</span>
                       <span className="text-sm font-bold text-on-surface-variant opacity-60">/ {stepGoal.toLocaleString()}</span>
                    </div>
                 </div>
                 <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700">
                       <Flame size={18} fill="currentColor" />
                       <div className="flex flex-col leading-none">
                          <span className="text-lg font-black">{calories}</span>
                          <span className="text-xs font-black uppercase tracking-widest opacity-60">Kkal</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700">
                       <Map size={18} fill="currentColor" />
                       <div className="flex flex-col leading-none">
                          <span className="text-lg font-black">{distanceKm}</span>
                          <span className="text-xs font-black uppercase tracking-widest opacity-60">KM</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* ECOSYSTEM CARD */}
        <div className="space-y-6">
           <div className="glass-panel p-6 bg-surface-container-low shadow-xl flex flex-col h-full">
              <h3 className="font-headline font-black text-xs uppercase tracking-widest text-on-surface mb-6 flex items-center gap-2">
                 <Smartphone size={16} className="text-primary" /> Health Ecosystem
              </h3>
              
              <div className="space-y-4 mb-6">
                  {/* Strava */}
                  <div className="flex items-center justify-between p-3 bg-surface-container rounded-xl border border-outline/5">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#FC642D] text-white rounded-lg flex items-center justify-center shadow-sm">
                           <Activity size={18} />
                        </div>
                        <span className="text-xs font-bold text-on-surface">Strava</span>
                     </div>
                     {isConnectedStrava ? (
                        <div className="flex items-center gap-2">
                           <button onClick={handleRefreshSync} disabled={isSyncing} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-emerald-500/20 transition-all">
                              <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                              {isSyncing ? "Syncing..." : "Sync"}
                           </button>
                           <button onClick={() => { updateSettings({ stravaConnected: false, stravaAccessToken: undefined, stravaRefreshToken: undefined, stravaExpiresAt: undefined }); toast.success("Koneksi Strava diputuskan"); }} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all" title="Putuskan Strava">
                              <Trash2 size={14} />
                           </button>
                        </div>
                     ) : (
                        <button onClick={handleConnectStrava} className="px-3 py-1.5 bg-[#FC642D] text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-[#FC642D]/90 transition-all">
                           Hubungkan
                        </button>
                     )}
                 </div>

              </div>

               <div className="pt-6 border-t border-outline/10 mt-auto">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                     {[1000, 2000, 5000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                             logSteps(today, amt, "add", "manual");
                             toast.success(`${amt.toLocaleString()} langkah ditambahkan!`);
                             hapticFeedback("medium");
                             if (todaySteps + amt >= stepGoal && todaySteps < stepGoal) {
                               confetti({
                                 particleCount: 100,
                                 spread: 70,
                                 origin: { y: 0.6 },
                               });
                             }
                          }}
                          className="py-2.5 bg-surface-container/50 hover:bg-primary hover:text-white border border-outline-variant/30 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 text-on-surface hover:border-primary active:scale-95 cursor-pointer"
                        >
                           +{amt.toLocaleString()}
                        </button>
                     ))}
                  </div>
                  <form onSubmit={handleAddManual} className="relative">
                     <input
                       type="number"
                       value={manualInput}
                       onChange={(e) => setManualInput(e.target.value)}
                       placeholder="Tambah manual..."
                       className="w-full bg-surface-variant/30 border border-outline/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary/30 font-bold text-on-surface"
                     />
                     <button type="submit" disabled={!manualInput} className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white p-2.5 rounded-xl hover:bg-primary-dim transition-all shadow-md disabled:opacity-30 cursor-pointer">
                        <Plus size={18} strokeWidth={3} />
                     </button>
                  </form>
               </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Kinetic Engine (Pedometer) */}
         <div className="glass-panel p-8 bg-white/60 shadow-2xl relative overflow-hidden group h-full">
            <div className="relative z-10 flex flex-col justify-between h-full">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="font-headline font-black text-sm uppercase tracking-widest text-on-surface">Kinetic Engine</h3>
                  {isSensorActive && <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
               </div>
               <div className="mb-8">
                  {!isSensorActive ? (
                    <button onClick={startPedometer} className="w-full bg-on-surface text-surface py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                      Aktifkan Pedometer
                    </button>
                  ) : (
                    <div className="flex items-end gap-2">
                       <span className="text-5xl font-headline font-black leading-none text-on-surface">{liveSteps}</span>
                       <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-40 mb-1">Live Langkah</span>
                    </div>
                  )}
               </div>
               <p className="text-xs text-on-surface-variant font-medium leading-relaxed opacity-60">
                  Melacak pergerakan akselerometer perangkat secara real-time. Simpan setiap 10 langkah.
               </p>
            </div>
         </div>

         {/* Weekly Chart */}
         <div className="lg:col-span-2 glass-panel p-8 bg-white/40 shadow-xl">
            <h3 className="font-headline font-black text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-8">Weekly Flow</h3>
            <div className="h-48 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                     <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: 'var(--color-on-surface-variant)', opacity: 0.5 }} />
                     <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 8 }} content={({ active, payload }) => (
                       active && payload && payload.length ? (
                         <div className="bg-on-surface text-surface px-3 py-2 rounded-xl text-xs font-black shadow-2xl">{payload[0].value.toLocaleString()} STEPS</div>
                       ) : null
                     )} />
                     <Bar dataKey="steps" radius={[6, 6, 6, 6]}>
                        {weeklyData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={index === 6 ? 'var(--color-primary)' : 'var(--color-primary-container)'} opacity={index === 6 ? 1 : 0.6} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* DETAILED LOG SECTION */}
      <div className="space-y-6">
         <div className="flex items-center justify-between px-2">
            <h3 className="font-headline font-black text-lg text-on-surface flex items-center gap-2">
               <Clock size={20} className="text-primary" /> Riwayat Aktivitas
            </h3>
            <span className="text-xs font-black uppercase tracking-widest opacity-40">{todayDetailed.length} Sesi Hari Ini</span>
         </div>

         <div className="space-y-3">
            <AnimatePresence mode="popLayout">
               {todayDetailed.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-10 text-center border-dashed border-outline/20">
                     <Footprints size={40} className="mx-auto text-on-surface-variant/20 mb-4" />
                     <p className="text-sm font-medium text-on-surface-variant opacity-60">Belum ada aktivitas yang tercatat hari ini.</p>
                  </motion.div>
               ) : (
                  todayDetailed.map((log) => (
                     <motion.div
                        key={log.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-panel p-4 flex items-center justify-between group hover:border-primary/30 transition-all"
                     >
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                              log.source === 'manual' ? 'bg-indigo-500/10 text-indigo-500' : 
                              log.source === 'google_fit' ? 'bg-white border border-outline/10 text-on-surface' :
                              log.source === 'sensor' ? 'bg-primary/10 text-primary' : 'bg-orange-500/10 text-orange-500'
                           }`}>
                              {log.source === 'manual' && <Plus size={20} strokeWidth={3} />}
                              {log.source === 'google_fit' && <Smartphone size={20} className="text-primary" />}
                              {log.source === 'sensor' && <Zap size={20} fill="currentColor" />}
                              {log.source === 'strava' && <span className="font-black text-sm">S</span>}
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                 <span className="text-xl font-headline font-black text-on-surface">+{log.amount.toLocaleString()}</span>
                                 <span className="text-xs font-black uppercase tracking-widest opacity-40">langkah</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant opacity-60 uppercase tracking-wider">
                                 <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                 <span>•</span>
                                 <span className="flex items-center gap-1">
                                    {log.source === 'google_fit' ? 'Google Fit Sync' : 
                                     log.source === 'sensor' ? 'Kinetic Engine' : 
                                     log.source === 'strava' ? 'Strava Activity' : 'Input Manual'}
                                 </span>
                              </div>
                           </div>
                        </div>
                        <button 
                           onClick={() => { hapticFeedback("medium"); removeStepLog(today, log.id); toast.error("Entri langkah dihapus"); }}
                           className="p-3 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-all cursor-pointer"
                        >
                           <Trash2 size={18} />
                        </button>
                     </motion.div>
                  ))
               )}
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
}
