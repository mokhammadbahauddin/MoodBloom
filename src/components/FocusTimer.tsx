import React, { useState } from "react";
import {
   Brain,
   Timer,
   Settings as SettingsIcon,
   ChevronRight,
   Music,
   Zap,
   CheckCircle2,
} from "lucide-react";
import { useUserStore } from "../lib/userStore";
import { useProductivityStore } from "../lib/productivityStore";;
import { useSettingsStore } from '../lib/settingsStore';
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";

export default function FocusTimer() {
   const settings = useSettingsStore((state) => state.settings);
   const updateSettings = useSettingsStore((state) => state.updateSettings);
   const setDeepFocusActive = useProductivityStore(state => state.setDeepFocusActive);

   const [localSettings, setLocalSettings] = useState({
      focus: settings.focusDuration,
      break: settings.shortBreakDuration,
   });

   const handleSaveSettings = () => {
      updateSettings({
         focusDuration: localSettings.focus,
         shortBreakDuration: localSettings.break,
      });
      toast.success("Timer disesuaikan!");
   };

   return (
      <div className="space-y-10 pt-4 pb-32 animate-in fade-in duration-500 max-w-2xl mx-auto px-1">
         {/* Header Section */}
         <section className="px-2">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-outline/10">
                  <Timer size={20} />
               </div>
               <div>
                  <h1 className="font-headline text-3xl font-bold text-on-surface tracking-tight">
                     Pusat Fokus
                  </h1>
                  <p className="text-on-surface-variant font-medium text-[10px] opacity-75 uppercase tracking-wider">
                     Metode Pomodoro
                  </p>
               </div>
            </div>
         </section>

          {/* Daily Progress: Focus Target */}
          <section className="px-2">
            <div className="bg-surface border border-outline/20 p-5 rounded-2xl shadow-sm relative overflow-hidden">
               <div className="absolute right-0 top-0 p-4 opacity-[0.03]">
                  <Brain size={80} />
               </div>
               <div className="flex justify-between items-end mb-3 relative z-10">
                  <div>
                    <h4 className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Target Fokus Harian</h4>
                    <p className="text-xl font-headline font-bold text-on-surface">
                       {useProductivityStore.getState().focusLogs.filter(f => f.date === new Date().toISOString().split('T')[0]).reduce((sum, f) => sum + f.minutes, 0)} <span className="text-xs opacity-50 font-normal">/ {settings.focusTarget || 120} min</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider opacity-75">Status</p>
                    <p className="text-xs font-semibold text-primary">Progress</p>
                  </div>
               </div>
               <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden relative z-10 border border-outline/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((useProductivityStore.getState().focusLogs.filter(f => f.date === new Date().toISOString().split('T')[0]).reduce((sum, f) => sum + f.minutes, 0) / (settings.focusTarget || 120)) * 100, 100)}%` }}
                    className="h-full bg-primary"
                  />
               </div>
            </div>
          </section>

         {/* Hero: Immersive Entry */}
         <motion.div
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            className="relative group cursor-pointer"
            onClick={() => setDeepFocusActive(true)}
         >
            <div className="relative bg-surface border border-outline/20 p-6 sm:p-8 rounded-2xl shadow-sm overflow-hidden min-h-[220px] sm:min-h-[260px] flex flex-col justify-between">
               {/* Visual Depth Elements */}
               <div className="absolute -right-10 -top-10 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl" />
               <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                  <Brain size={180} strokeWidth={1.5} className="text-primary" />
               </div>

               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                     <div className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20 shadow-none">
                        <div className="flex items-center gap-1.5">
                           <Zap size={12} className="text-primary fill-current" />
                           <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Mode Fokus</span>
                        </div>
                     </div>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-headline font-bold tracking-tight text-on-surface">
                     DEEP FOCUS
                  </h2>
                  <p className="text-on-surface-variant text-sm font-medium mt-2 max-w-[360px] opacity-75">Masuk ke ruang kerja digital bebas gangguan dengan pengingat & Audio Lo-fi.</p>
               </div>

               <div className="relative z-10 flex items-center gap-4 mt-6 pt-4 border-t border-outline/10">
                  <div className="flex-1">
                     <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface mb-0.5">Siklus Pomodoro</p>
                     <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">Sesi 25m • Istirahat 5m</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center transition-all shadow-sm group-hover:scale-105 active:scale-95">
                     <ChevronRight size={24} strokeWidth={3} />
                  </div>
               </div>
            </div>
         </motion.div>

         {/* Control Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1">
            {/* Config Card */}
            <div className="bg-surface border border-outline/20 p-6 rounded-2xl shadow-sm flex flex-col gap-6">
               <div className="flex items-center gap-3 border-b border-outline/10 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-surface border border-primary/20 flex items-center justify-center shadow-none text-primary">
                     <SettingsIcon size={20} />
                  </div>
                  <h3 className="font-headline font-bold text-lg text-on-surface tracking-tight">Set Durasi</h3>
               </div>

               <div className="space-y-6">
                  {/* Focus Slider */}
                  <div className="space-y-3">
                     <div className="flex justify-between items-end px-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant opacity-75">Focus Time</span>
                        <div className="flex items-baseline gap-1">
                           <span className="text-3xl font-headline font-bold text-rose-600 leading-none">{localSettings.focus}</span>
                           <span className="text-[10px] font-bold text-rose-600/70 uppercase">min</span>
                        </div>
                     </div>
                     <div className="relative flex items-center h-10 group/slider">
                        <div className="absolute left-0 right-0 h-2 bg-on-surface/10 rounded-full" />
                        <input
                           type="range" min="5" max="120" step="5"
                           value={localSettings.focus}
                           onChange={(e) => setLocalSettings(prev => ({ ...prev, focus: parseInt(e.target.value) }))}
                           className="relative w-full h-2 bg-transparent rounded-full appearance-none accent-primary cursor-pointer z-10"
                        />
                     </div>
                  </div>

                  {/* Break Slider */}
                  <div className="space-y-3">
                     <div className="flex justify-between items-end px-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant opacity-75">Rest Time</span>
                        <div className="flex items-baseline gap-1">
                           <span className="text-3xl font-headline font-bold text-emerald-600 leading-none">{localSettings.break}</span>
                           <span className="text-[10px] font-bold text-emerald-600/70 uppercase">min</span>
                        </div>
                     </div>
                     <div className="relative flex items-center h-10 group/slider">
                        <div className="absolute left-0 right-0 h-2 bg-on-surface/10 rounded-full" />
                        <input
                           type="range" min="1" max="30" step="1"
                           value={localSettings.break}
                           onChange={(e) => setLocalSettings(prev => ({ ...prev, break: parseInt(e.target.value) }))}
                           className="relative w-full h-2 bg-transparent rounded-full appearance-none accent-emerald-600 cursor-pointer z-10"
                        />
                     </div>
                  </div>

                  <button
                     onClick={handleSaveSettings}
                     className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-xs uppercase tracking-wider hover:bg-primary/90 transition-all active:scale-95 shadow-none border border-primary/20"
                  >
                     Terapkan Konfigurasi
                  </button>
               </div>
            </div>

            {/* Soundtrack Card */}
            <div className="bg-surface border border-outline/20 p-6 rounded-2xl shadow-sm flex flex-col gap-6">
               <div className="flex items-center gap-3 border-b border-outline/10 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center shadow-none">
                     <Music size={20} />
                  </div>
                  <h3 className="font-headline font-bold text-lg text-on-surface tracking-tight">Audio Protocol</h3>
               </div>

               <div className="flex-1 flex flex-col justify-center gap-6">
                  <div className="p-4 rounded-xl bg-surface-container-low text-on-surface flex items-center gap-4 relative overflow-hidden group border border-outline/10">
                     <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-none">
                        <Music size={18} />
                     </div>
                     <div className="relative z-10">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant opacity-75 mb-0.5">Ambience Active</p>
                        <p className="text-lg font-headline font-bold tracking-tight leading-none text-indigo-600 dark:text-indigo-400">Deep Flow #01</p>
                     </div>
                  </div>
                  <div className="px-1 space-y-2">
                     <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center">
                           <CheckCircle2 size={10} className="text-indigo-600" strokeWidth={3} />
                        </div>
                        <p className="text-[10px] font-bold text-on-surface uppercase tracking-wider">Intelligent Lo-fi Sync</p>
                     </div>
                     <p className="text-xs text-on-surface-variant/80 leading-relaxed border-l-2 border-indigo-500/20 pl-3">Musik otomatis menyesuaikan tempo untuk menjaga kondisi flow otak Anda tetap stabil.</p>
                  </div>
               </div>
            </div>
         </div>

      </div>
   );
}
