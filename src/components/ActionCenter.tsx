import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Smile, ChevronRight, Droplet, Activity, Wind, Moon } from "lucide-react";
import Schedule from "./Schedule";
import Water from "./Water";
import Mood from "./Mood";
import Steps from "./Steps";
import Meditation from "./Meditation";
import Prayer from "./Prayer";
import { hapticFeedback } from "../lib/haptics";

/**
 * ActionCenter - Native Mobile Habit Hub
 * Professional Grade: Minimalist gallery, Fluid module switching, and Organic transitions.
 */
export default function ActionCenter({ 
  onNavigate, 
  initialSegment = "habits" 
}: { 
  onNavigate?: (tab: string) => void;
  initialSegment?: "tasks" | "habits";
}) {
  const [activeSegment, setSegment] = useState<"tasks" | "habits">(initialSegment);
  const [activeHabit, setActiveHabit] = useState<string | null>(null);

  const habits = [
    { id: "water", label: "Hydration", icon: <Droplet size={22} />, color: "bg-blue-500", desc: "Track water intake" },
    { id: "mood", label: "Journal", icon: <Smile size={22} />, color: "bg-amber-500", desc: "Emotional reflection" },
    { id: "steps", label: "Movement", icon: <Activity size={22} />, color: "bg-emerald-500", desc: "Daily step pulse" },
    { id: "meditation", label: "Zen Mode", icon: <Wind size={22} />, color: "bg-purple-500", desc: "Breathing & focus" },
    { id: "prayer", label: "Spiritual", icon: <Moon size={22} />, color: "bg-indigo-500", desc: "Prayer consistency" },
  ];

  const handleHabitSelect = (id: string) => {
    hapticFeedback("light");
    setActiveHabit(id);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)] bg-transparent animate-in fade-in duration-500">
      <AnimatePresence mode="wait">
        {!activeHabit ? (
          <motion.div
            key="hub"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 space-y-10 pt-4 pb-24"
          >
             {/* Segment Control (Native Style) */}
             <div className="px-6">
                <div className="p-1.5 bg-surface-container/60 backdrop-blur-md rounded-2xl border border-outline/5 flex items-center gap-1 shadow-inner">
                   <button 
                     onClick={() => { hapticFeedback("light"); setSegment("tasks"); }}
                     className={`flex-1 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${activeSegment === "tasks" ? "bg-white text-black shadow-xl" : "text-on-surface-variant opacity-40 hover:opacity-100"}`}
                   >
                      Core Focus
                   </button>
                   <button 
                     onClick={() => { hapticFeedback("light"); setSegment("habits"); }}
                     className={`flex-1 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${activeSegment === "habits" ? "bg-white text-black shadow-xl" : "text-on-surface-variant opacity-40 hover:opacity-100"}`}
                   >
                      Daily Streams
                   </button>
                </div>
             </div>

             <div className="px-6 space-y-12">
                <AnimatePresence mode="wait">
                  {activeSegment === "tasks" ? (
                    <motion.div 
                      key="tasks" 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                       <Schedule />
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="habits"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-1 gap-4"
                    >
                       <div className="space-y-2 mb-4 px-1">
                          <h2 className="text-3xl font-headline font-black text-on-surface tracking-tighter leading-none">Oasis <span className="text-primary">Streams</span>.</h2>
                          <p className="text-xs font-bold text-on-surface-variant opacity-40 uppercase tracking-widest italic">Maintain your life rhythm.</p>
                       </div>

                       {habits.map((habit, idx) => (
                         <motion.button
                           key={habit.id}
                           whileTap={{ scale: 0.98 }}
                           onClick={() => handleHabitSelect(habit.id)}
                           initial={{ opacity: 0, x: -10 }}
                           animate={{ opacity: 1, x: 0, transition: { delay: idx * 0.05 } }}
                           className="glass-panel p-6 flex items-center gap-5 bg-surface-container/40 border border-outline/5 group rounded-2xl"
                         >
                            <div className={`w-14 h-14 rounded-2xl ${habit.color} bg-opacity-10 flex items-center justify-center ${habit.color.replace('bg-', 'text-')} shadow-inner`}>
                               {habit.icon}
                            </div>
                            <div className="flex-1 text-left">
                               <h3 className="font-headline font-black text-on-surface text-lg leading-none mb-1 group-hover:text-primary transition-colors">{habit.label}</h3>
                               <p className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">{habit.desc}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-outline/10 text-on-surface-variant opacity-20 group-hover:opacity-100 transition-opacity">
                               <ChevronRight size={18} />
                            </div>
                         </motion.button>
                       ))}
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </motion.div>
        ) : (
          <motion.div
            key="module"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 px-4 pt-4 pb-24 relative"
          >
             <button 
                onClick={() => { hapticFeedback("light"); setActiveHabit(null); }}
                className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 hover:opacity-100 transition-opacity px-2"
             >
                <ChevronRight size={14} className="rotate-180" /> Back to Oasis
             </button>

             <div className="px-2">
                {activeHabit === "water" && <Water onOpenChat={() => onNavigate && onNavigate("ai")} />}
                {activeHabit === "mood" && <Mood />}
                {activeHabit === "steps" && <Steps />}
                {activeHabit === "meditation" && <Meditation />}
                {activeHabit === "prayer" && <Prayer />}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
