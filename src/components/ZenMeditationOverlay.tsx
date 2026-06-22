import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Wind, Volume2, VolumeX, Sparkles, Droplets, Leaf, Waves as WavesIcon } from "lucide-react";
import { useUserStore } from "../lib/userStore";
import { useProductivityStore } from "../lib/productivityStore";;
import { useHabitsStore } from "../lib/habitsStore";
import { getTodayDateString } from "../lib/dateUtils";
import { hapticFeedback } from "../lib/haptics";
import { audioManager } from "../lib/audioManager";

interface ZenMeditationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  duration: number; // minutes
  soundType: "rain" | "forest" | "zen" | "meditation" | "none";
}

type Phase = "inhale" | "hold" | "exhale" | "rest";

export default function ZenMeditationOverlay({
  isOpen,
  onClose,
  duration,
  soundType,
}: ZenMeditationOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const logMeditation = useHabitsStore((state) => state.logMeditation);
  const setMeditationActive = useProductivityStore(state => state.setMeditationActive);

  // Meditation Active State for Global UI
  useEffect(() => {
    if (isOpen) {
      setMeditationActive(true);
      return () => setMeditationActive(false);
    }
  }, [isOpen, setMeditationActive]);

  // Timer & Logging
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(duration * 60);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, duration]);

  // Breathing Cycle (4-7-8 Technique)
  useEffect(() => {
    if (!isOpen) return;

    let timeout: NodeJS.Timeout;

    const runCycle = () => {
      setPhase("inhale");
      hapticFeedback("light");
      timeout = setTimeout(() => {
        setPhase("hold");
        timeout = setTimeout(() => {
          setPhase("exhale");
          hapticFeedback("medium");
          timeout = setTimeout(() => {
            setPhase("rest");
            timeout = setTimeout(runCycle, 1000);
          }, 8000);
        }, 7000);
      }, 4000);
    };

    runCycle();
    return () => clearTimeout(timeout);
  }, [isOpen]);

  // Audio Logic
  useEffect(() => {
    if (isOpen && soundType !== "none" && !isMuted) {
      audioManager.playAmbient(soundType);
      audioManager.setVolume(volume);
    }

    return () => {
      audioManager.stopAmbient();
    };
  }, [isOpen, soundType, isMuted]);

  useEffect(() => {
    audioManager.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  const handleComplete = () => {
    logMeditation(getTodayDateString(), duration);
    new Audio("/sounds/success.mp3").play().catch(() => {});
    onClose();
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getPhaseText = () => {
    switch (phase) {
      case "inhale": return "Tarik Napas";
      case "hold": return "Tahan";
      case "exhale": return "Hembuskan";
      case "rest": return "Rileks";
    }
  };

  const progress = 1 - (timeLeft / (duration * 60));

  // Particles for background immersion
  const particles = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 20 + 20,
    delay: Math.random() * 10
  })), []);

  if (!isOpen) return null;

  // Content Container
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        onClick={() => {
          // Interaction to ensure audio starts if blocked
          if (isOpen && soundType !== "none" && !isMuted) {
             audioManager.playAmbient(soundType);
          }
        }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-[#020617] flex flex-col items-center justify-center overflow-hidden font-sans"
      >
        {/* Cinematic Background Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0a1128] to-[#020617]" />
          
          {/* Animated Particles / Stars */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 0.4, 0],
                y: [0, -100],
              }}
              transition={{ 
                duration: p.duration, 
                repeat: Infinity, 
                delay: p.delay,
                ease: "linear"
              }}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: 'white',
                borderRadius: '50%',
                filter: 'blur(1px)'
              }}
            />
          ))}

        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full h-full flex flex-col items-center pt-8 pb-6 md:pt-20 px-6 max-w-lg mx-auto overflow-hidden">
          
          {/* Header Area */}
          <div className="w-full flex justify-between items-center mb-6">
             <div className="flex flex-col">
                <h3 className="text-white/20 text-xs font-black uppercase tracking-[0.4em]">Deep Immersive</h3>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                   <span className="text-white/70 text-xs font-black tracking-[0.2em] uppercase">
                     {soundType === 'none' ? 'Silence' : soundType === 'rain' ? 'Kyoto Rain' : soundType === 'forest' ? 'Deep Forest' : soundType === 'zen' ? 'Zen Meditation' : 'Deep Harmony'}
                   </span>
                </div>
             </div>
             <button 
               onClick={onClose}
               className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all active:scale-90"
             >
               <X size={20} />
             </button>
          </div>

          {/* Main Visualization Area */}
          <div className="flex-1 w-full flex flex-col items-center justify-center gap-6 md:gap-12">
            {/* Breathing Guide */}
            <div className="relative flex items-center justify-center w-full max-w-[220px] md:max-w-[280px] aspect-square">
              {/* Progress Track */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 opacity-10">
                 <circle 
                   cx="50%" cy="50%" r="48%" 
                   fill="none" stroke="white" strokeWidth="0.5" 
                 />
                 <motion.circle 
                   cx="50%" cy="50%" r="48%" 
                   fill="none" stroke="white" strokeWidth="2" 
                   strokeDasharray="100 100"
                   strokeDashoffset={100 - (progress * 100)}
                   strokeLinecap="round"
                   animate={{ strokeDashoffset: 100 - (progress * 100) }}
                   transition={{ duration: 1, ease: "linear" }}
                 />
              </svg>

              {/* Simplified Pulsing Visualizer */}
              <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
                 {/* Background Glow */}
                 <motion.div 
                   className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-2xl rounded-full"
                   animate={{ 
                     scale: phase === "inhale" ? 1.3 : phase === "hold" ? 1.3 : phase === "exhale" ? 0.95 : 0.95,
                   }}
                   transition={{ 
                     duration: phase === "inhale" ? 4 : phase === "hold" ? 7 : phase === "exhale" ? 8 : 1,
                     ease: "easeInOut"
                   }}
                 />

                 {/* Outer Pulsing Circle */}
                 <motion.div 
                   className="absolute inset-0 border border-blue-500/30 rounded-full"
                   animate={{ 
                     scale: phase === "inhale" ? 1.4 : phase === "hold" ? 1.4 : phase === "exhale" ? 0.95 : 0.95,
                     opacity: phase === "inhale" ? [0.2, 0.6] : phase === "hold" ? 0.6 : phase === "exhale" ? [0.6, 0.2] : 0.2
                   }}
                   transition={{ 
                     duration: phase === "inhale" ? 4 : phase === "hold" ? 7 : phase === "exhale" ? 8 : 1,
                     ease: "easeInOut"
                   }}
                 />

                 {/* Inner Core Circle */}
                 <motion.div 
                   className="absolute w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center"
                   animate={{ 
                     scale: phase === "inhale" ? 1.3 : phase === "hold" ? 1.3 : phase === "exhale" ? 0.95 : 0.95,
                   }}
                   transition={{ 
                     duration: phase === "inhale" ? 4 : phase === "hold" ? 7 : phase === "exhale" ? 8 : 1,
                     ease: "easeInOut"
                   }}
                 >
                    <AnimatePresence mode="wait">
                       <motion.div
                         key={phase}
                         initial={{ opacity: 0, scale: 0.8 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 1.2 }}
                         className="text-white drop-shadow-md"
                       >
                          <Wind size={28} strokeWidth={2} />
                       </motion.div>
                    </AnimatePresence>
                 </motion.div>
              </div>
            </div>

            {/* Dynamic Phase Text */}
            <div className="flex flex-col items-center gap-4">
               <AnimatePresence mode="wait">
                 <motion.h2
                   key={phase}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="text-2xl md:text-4xl font-headline font-black text-white uppercase text-center tracking-[0.3em] md:tracking-[0.4em]"
                 >
                   {getPhaseText()}
                 </motion.h2>
               </AnimatePresence>
               
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="flex items-baseline gap-2 bg-white/5 border border-white/5 px-6 py-2 rounded-2xl backdrop-blur-3xl"
               >
                  <span className="text-white/20 text-xs font-black uppercase tracking-[0.3em]">Sisa Waktu</span>
                  <span className="text-white/90 text-lg md:text-xl font-headline font-black tabular-nums tracking-tighter leading-none">{formatTime(timeLeft)}</span>
                </motion.div>
            </div>
          </div>

          {/* Controls Area */}
          <div className="w-full max-w-sm flex flex-col gap-6 mt-6 mb-8">
             {/* Atmosphere Density (Volume) */}
             <div className="flex flex-col items-center gap-2 w-full">
                <div className="flex items-center justify-between w-full gap-4">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/20 hover:text-white transition-all active:scale-90"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <div className="flex-1 relative flex items-center h-8">
                      <div className="absolute inset-x-0 h-0.5 bg-white/10 rounded-full my-auto">
                        <motion.div className="h-full bg-white/30" animate={{ width: `${volume * 100}%` }} />
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.01" 
                        value={volume} 
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                  </div>
                </div>
                <p className="text-white/10 text-xs font-black uppercase tracking-[0.5em] text-center">Atmosphere Density</p>
             </div>

             {/* Session Progress Bar */}
             <div className="px-12">
                <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-emerald-400/20"
                    initial={{ width: 0 }}
                    animate={{ width: `${(1 - timeLeft / (duration * 60)) * 100}%` }}
                  />
                </div>
             </div>
          </div>

          {/* Footer Navigation Area - SIMPLIFIED & MOVED UP */}
          <div className="w-full flex flex-col items-center gap-6 mt-2 pb-24 sm:pb-32">
             <motion.button 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={handleComplete}
               className="group relative px-14 py-4 md:py-5 rounded-full border border-primary/30 bg-primary/10 text-white font-black text-xs uppercase tracking-[0.4em] transition-all hover:bg-primary hover:text-white hover:shadow-[0_0_50px_rgba(16,185,129,0.3)] shadow-lg shadow-primary/10"
             >
                Selesai Sesi
             </motion.button>
             
             <p className="text-white/10 text-xs font-black uppercase tracking-[0.4em]">Fokus pada napas Anda</p>
          </div>
        </div>

      </motion.div>
    </AnimatePresence>
  );
}
