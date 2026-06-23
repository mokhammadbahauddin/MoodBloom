import React, { useState } from 'react';
import { useUserStore } from "../lib/userStore";
import { useProductivityStore } from "../lib/productivityStore";;
import { useHabitsStore } from "../lib/habitsStore";
import { getTodayDateString } from '../lib/dateUtils';
import { Play, Settings as SettingsIcon, CloudRain, TreePine, Waves, Music, Wind, Sparkles, Brain, Zap, Moon, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import ZenMeditationOverlay from './ZenMeditationOverlay';
import { hapticFeedback } from '../lib/haptics';

type SoundType = "rain" | "forest" | "zen" | "meditation" | "none";

export default function Meditation({ isActive = true }: { isActive?: boolean }) {
  const meditationLogs = useHabitsStore((state) => state.meditationLogs);
  const removeMeditationLog = useHabitsStore((state) => state.removeMeditationLog);
  const today = getTodayDateString();
  const todayMeditation = meditationLogs[today] || 0;

  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [sessionLength, setSessionLength] = useState(5); // Minutes
  const [soundType, setSoundType] = useState<SoundType>("rain");

  const sounds = [
    { id: 'rain', label: 'Rain Kyoto', icon: <CloudRain size={22} />, color: "from-blue-500/20 to-indigo-500/10" },
    { id: 'forest', label: 'Deep Forest', icon: <TreePine size={22} />, color: "from-emerald-500/20 to-teal-500/10" },
    { id: 'zen', label: 'Zen Meditation', icon: <Sparkles size={22} />, color: "from-purple-500/20 to-blue-500/10" },
    { id: 'meditation', label: 'Deep Harmony', icon: <Moon size={22} />, color: "from-indigo-500/20 to-rose-500/10" },
    { id: 'none', label: 'Silent', icon: <Music size={22} />, color: "from-slate-500/20 to-slate-500/10" },
  ];

  if (!isActive) {
    return <div className="min-h-[400px]" />;
  }

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-2 md:pt-4">
      <div className="flex flex-col xl:flex-row gap-10 items-stretch">
        
        {/* Main Configuration Card */}
        <div className="glass-panel p-6 md:p-12 bg-white/30 border border-outline/20 shadow-xl flex-[1.5] flex flex-col items-center justify-center relative overflow-hidden group rounded-2xl">
           
           <div className="relative z-10 w-full max-w-lg space-y-12">
              <div className="text-center space-y-4">
                 <motion.div 
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-2 border border-primary/20"
                 >
                    <Wind size={40} strokeWidth={1.5} />
                 </motion.div>
                 <h2 className="font-headline font-bold text-2xl md:text-3xl text-on-surface tracking-tight">Ruang Hening</h2>
                 <p className="text-sm text-on-surface-variant font-medium max-w-xs mx-auto leading-relaxed">
                   Temukan ketenangan di tengah hiruk-pikuk hari Anda. Pilih suasana yang sesuai dengan energi Anda saat ini.
                 </p>
              </div>

              {/* Sound Selection Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                 {sounds.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        hapticFeedback("light");
                        setSoundType(s.id as SoundType);
                      }}
                      className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 ${
                        soundType === s.id 
                        ? `bg-primary border-primary shadow-lg shadow-primary/10 scale-[1.01]` 
                        : 'bg-white/5 border-transparent hover:border-outline/10 text-on-surface-variant'
                      }`}
                    >
                      <div className={`transition-all duration-300 ${soundType === s.id ? 'text-white scale-105' : 'text-primary/40 opacity-40 group-hover:opacity-100'}`}>
                        {s.icon}
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider text-center leading-tight ${soundType === s.id ? 'text-white' : 'text-on-surface-variant opacity-40'}`}>
                        {s.label}
                      </span>
                      {soundType === s.id && (
                        <motion.div layoutId="activeSound" className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]" />
                      )}
                    </button>
                 ))}
              </div>

              {/* Duration Presets & Custom Input */}
              <div className="space-y-6 bg-black/5 p-6 rounded-2xl border border-outline/5 shadow-inner">
                 <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant opacity-55">Pilih Durasi</span>
                      <p className="text-xs font-bold text-primary italic">10-20m direkomendasikan</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                       <span className="text-3xl font-headline font-bold text-on-surface tracking-tight">{sessionLength}</span>
                       <span className="text-xs font-bold uppercase tracking-widest text-on-surface opacity-45">Min</span>
                    </div>
                 </div>

                 {/* Preset Buttons */}
                 <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 15, 20, 30, 60].map((mins) => (
                       <button
                         key={mins}
                         type="button"
                         onClick={() => {
                            hapticFeedback("light");
                            setSessionLength(mins);
                         }}
                         className={`py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 ${
                            sessionLength === mins
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-surface-container/50 text-on-surface-variant hover:bg-primary/20 hover:text-primary hover:border-primary border border-outline-variant/30"
                         } active:scale-95 cursor-pointer`}
                       >
                          {mins} Min
                       </button>
                    ))}
                 </div>

                 {/* Custom Numeric Input */}
                 <div className="relative mt-4">
                    <input
                      type="number"
                      value={sessionLength || ""}
                      onChange={(e) => {
                         const val = parseInt(e.target.value);
                         if (!isNaN(val) && val > 0) {
                            setSessionLength(val);
                         } else {
                            setSessionLength(0);
                         }
                      }}
                      placeholder="Custom duration..."
                      className="w-full bg-surface-variant/30 border border-outline-variant/30 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 font-bold text-on-surface"
                      min="1"
                      max="180"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant opacity-60">minutes</span>
                 </div>
              </div>

              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    hapticFeedback("medium");
                    setIsOverlayOpen(true);
                  }}
                  className="group relative w-full bg-primary text-white font-bold text-xs uppercase tracking-[0.25em] py-5 px-4 rounded-xl shadow-md shadow-primary/10 overflow-hidden transition-all flex items-center justify-center gap-4"
                >
                  <Play size={14} fill="currentColor" className="opacity-60 group-hover:opacity-100 transition-opacity" />
                  Mulai Sesi
                </motion.button>
              </div>
           </div>
        </div>

        {/* Intelligence Column */}
        <div className="xl:w-96 flex flex-col gap-8">
           {/* Progress Card */}
           <motion.div 
             whileHover={{ y: -2 }}
             className="glass-panel p-10 bg-gradient-to-br from-primary/5 to-secondary/5 border border-outline/20 shadow-sm rounded-2xl relative overflow-hidden"
           >
              <div className="absolute right-[-20px] top-[-20px] opacity-10">
                 <Moon size={120} strokeWidth={1} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant opacity-50 mb-6">Ketenangan Hari Ini</p>
              <div className="flex items-baseline gap-3">
                <span className="text-7xl font-headline font-bold text-on-surface tracking-tight">{todayMeditation}</span>
                <span className="text-sm font-bold text-primary uppercase tracking-[0.15em]">Menit</span>
              </div>
              <div className="mt-8 h-2 w-full bg-surface-container rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min(100, (todayMeditation / 20) * 100)}%` }}
                   className="h-full bg-primary"
                 />
              </div>
              <p className="text-xs font-bold text-on-surface-variant mt-3 italic opacity-60">
                 {todayMeditation >= 20 ? "Target harian tercapai! ✨" : `${20 - todayMeditation} menit lagi menuju harmoni.`}
              </p>
           </motion.div>
           
           {/* Benefits Card */}
           <div className="glass-panel p-10 bg-surface-container-low border border-outline/20 shadow-sm rounded-2xl flex-1">
              <h4 className="font-headline font-bold text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-3 text-primary">
                 <Brain size={18} /> Zen Benefits
              </h4>
              <ul className="space-y-6">
                {[
                  { text: "Menurunkan kadar kortisol & stres harian.", icon: <Zap size={14} className="text-amber-500" /> },
                  { text: "Meningkatkan neuroplastisitas otak.", icon: <Brain size={14} className="text-purple-500" /> },
                  { text: "Memperdalam kualitas tidur fase REM.", icon: <Moon size={14} className="text-blue-500" /> },
                  { text: "Membangun ketahanan emosional jangka panjang.", icon: <Sparkles size={14} className="text-emerald-500" /> }
                ].map((item, i) => (
                  <motion.li 
                    key={`benefit-${i}`} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex gap-5 text-xs font-bold leading-relaxed text-on-surface-variant group"
                  >
                     <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center shrink-0 group-hover:bg-white transition-colors shadow-sm">
                        {item.icon}
                     </div>
                     <span className="opacity-80 pt-1.5">{item.text}</span>
                  </motion.li>
                ))}
              </ul>
           </div>
        </div>
      </div>

      {/* Historical List */}
      <div className="space-y-6 pt-6">
         <div className="flex items-center justify-between px-2">
            <h3 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
               <Clock size={20} className="text-primary" /> Riwayat Meditasi
            </h3>
            <span className="text-xs font-bold uppercase tracking-wider opacity-40">7 Hari Terakhir</span>
         </div>

         <div className="space-y-3">
            <AnimatePresence mode="popLayout">
               {Object.keys(meditationLogs).filter(date => meditationLogs[date] > 0).length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-10 text-center border-dashed border-outline/20 rounded-2xl">
                     <Wind size={40} className="mx-auto text-on-surface-variant/20 mb-4 animate-pulse" />
                     <p className="text-sm font-medium text-on-surface-variant opacity-60">Belum ada sesi meditasi yang tercatat.</p>
                  </motion.div>
               ) : (
                  Object.keys(meditationLogs)
                     .filter(date => meditationLogs[date] > 0)
                     .sort((a, b) => b.localeCompare(a))
                     .slice(0, 7)
                     .map((date) => (
                        <motion.div
                           key={date}
                           layout
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, scale: 0.95 }}
                           className="glass-panel p-4 flex items-center justify-between group hover:border-primary/30 transition-all rounded-2xl bg-white/30 dark:bg-white/5 border-outline-variant/30 border"
                        >
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner bg-primary/10 text-primary">
                                 <Wind size={20} />
                              </div>
                              <div>
                                 <div className="flex items-center gap-2">
                                    <span className="text-xl font-headline font-bold text-on-surface">{meditationLogs[date]}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-40">menit</span>
                                 </div>
                                 <div className="text-xs font-bold text-on-surface-variant opacity-60 uppercase tracking-wider">
                                    <span>{date === today ? "Hari Ini" : date}</span>
                                 </div>
                              </div>
                           </div>
                           <button 
                              onClick={() => { 
                                 hapticFeedback("medium"); 
                                 removeMeditationLog(date); 
                                 toast.error(`Sesi meditasi ${date} dihapus`); 
                              }}
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

      {/* Fullscreen Overlay Component */}
      <ZenMeditationOverlay 
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        duration={sessionLength}
        soundType={soundType}
      />
    
    </div>
  );
}
