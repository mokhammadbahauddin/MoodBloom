import React from "react";
import { motion } from "motion/react";
import { Star, Award, Zap, Heart, ShieldCheck } from "lucide-react";
import { cn } from "../../lib/utils";

interface Milestone {
  id: string;
  label: string;
  isUnlocked: boolean;
  pos: { x: number; y: number };
  icon: typeof Star;
}

/**
 * AchievementConstellation - Visual Storytelling Component
 * Maps user progress to a spatial field of stars.
 */
export const AchievementConstellation: React.FC<{ achievements: string[] }> = ({ achievements }) => {
  const milestones: Milestone[] = [
    { id: "hydrate_7", label: "Master Hidrasi", icon: Star, isUnlocked: achievements.includes("hydrate_7"), pos: { x: 20, y: 30 } },
    { id: "meditate_100", label: "Ketenangan Murni", icon: Award, isUnlocked: achievements.includes("meditate_100"), pos: { x: 70, y: 20 } },
    { id: "task_20", label: "Pejuang Tugas", icon: Zap, isUnlocked: achievements.includes("task_20"), pos: { x: 50, y: 50 } },
    { id: "steps_50k", label: "Langkah Pasti", icon: Heart, isUnlocked: achievements.includes("steps_50k"), pos: { x: 30, y: 80 } },
    { id: "streak_10", label: "Disiplin Oasis", icon: ShieldCheck, isUnlocked: achievements.includes("streak_10"), pos: { x: 80, y: 70 } },
  ];

  return (
    <div className="oasis-card p-10 bg-[#020617] h-[500px] relative overflow-hidden border border-white/5 shadow-2xl">
      {/* Background Star Field */}
      <div className="absolute inset-0 opacity-40">
         {Array.from({length: 50}).map((_, i) => (
           <div 
            key={`star-${i}`} 
            className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse"
            style={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`
            }}
           />
         ))}
      </div>

      {/* SVG Connecting Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
         {milestones.map((m, i) => {
           if (i === milestones.length - 1) return null;
           const next = milestones[i + 1];
           return (
             <line 
               key={m.id}
               x1={`${m.pos.x}%`} y1={`${m.pos.y}%`}
               x2={`${next.pos.x}%`} y2={`${next.pos.y}%`}
               stroke="white" strokeWidth="1" strokeDasharray="5,5"
             />
           );
         })}
      </svg>

      {/* Constellation Nodes */}
      {milestones.map((m) => (
        <motion.div
          key={m.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.2 }}
          className={cn(
            "absolute flex flex-col items-center gap-2 transition-all",
            m.isUnlocked ? "opacity-100 z-10" : "opacity-20 saturate-0"
          )}
          style={{ top: `${m.pos.y}%`, left: `${m.pos.x}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative",
            m.isUnlocked ? "bg-primary text-white shadow-primary/40" : "bg-white/10 text-white/40"
          )}>
            {m.isUnlocked && <div className="absolute inset-0 bg-primary blur-xl opacity-60 animate-pulse rounded-full" />}
            <m.icon size={20} className="relative z-10" />
          </div>
          <p className="text-[8px] font-black uppercase tracking-widest text-white text-center whitespace-nowrap bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
            {m.label}
          </p>
        </motion.div>
      ))}

      <div className="absolute bottom-8 left-8">
         <h3 className="text-xl font-headline font-black text-white tracking-tighter">Accomplishment <span className="text-primary">Constellation</span></h3>
         <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Mapping your growth in the Oasis</p>
      </div>
    </div>
  );
};
