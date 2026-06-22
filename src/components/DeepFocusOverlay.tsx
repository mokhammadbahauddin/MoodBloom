import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Play, 
  Pause, 
  Square, 
  Music, 
  Volume2, 
  VolumeX, 
  Brain, 
  Coffee,
  ChevronUp,
} from "lucide-react";
import { useProductivityStore } from "../lib/productivityStore";
import { useSettingsStore } from '../lib/settingsStore';
import toast from "react-hot-toast";

const LOFI_TRACKS = {
  focus: "/music/zen.mp3",
  break: "/music/meditation.mp3",
  complete: "/sounds/success.mp3"
};

export default function DeepFocusOverlay() {
  const deepFocusActive = useProductivityStore(state => state.deepFocusActive);
  const setDeepFocusActive = useProductivityStore(state => state.setDeepFocusActive);
  const settings = useSettingsStore((state) => state.settings);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsNotMuted] = useState(true); // Default muted for safety
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const totalSeconds = mode === "focus" 
    ? settings.focusDuration * 60 
    : settings.shortBreakDuration * 60;

  useEffect(() => {
    if (!deepFocusActive) {
      setIsActive(false);
      return;
    }
    // Auto start timer when entering deep focus
    setIsActive(true);
  }, [deepFocusActive]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Audio handling
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true;
      if (isActive && !isMuted) {
         audioRef.current.play().catch(() => {});
      } else {
         audioRef.current.pause();
      }
    }
  }, [isActive, isMuted, mode]);

  const logFocusSession = useProductivityStore(state => state.logFocusSession);
  const activeFocusTaskId = useProductivityStore(state => state.activeFocusTaskId);

  const handleSessionComplete = () => {
    setIsActive(false);
    
    // Play success sound
    const sfx = new Audio(LOFI_TRACKS.complete);
    sfx.play().catch(() => {});

    if (mode === "focus") {
       logFocusSession(settings.focusDuration, activeFocusTaskId);
       toast.success("Sesi Fokus Selesai! Waktunya istirahat.");
       setMode("break");
       setTimeLeft(settings.shortBreakDuration * 60);
    } else {
       toast.success("Istirahat Selesai! Siap fokus lagi?");
       setMode("focus");
       setTimeLeft(settings.focusDuration * 60);
    }
    setIsActive(true);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m.toString().padStart(2, "0")}:${rs.toString().padStart(2, "0")}`;
  };

  if (!deepFocusActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6"
      >
        {/* Clean, simple background without blurs */}
        <div className="absolute inset-0 bg-background" />

        {/* Header: Track Status */}
        <div className="relative z-10 flex flex-col items-center gap-1.5 mb-10">
           <div 
             className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${mode === "focus" ? "bg-primary/5 border-primary/20 text-primary" : "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"}`}
           >
             {mode === "focus" ? "Fokus Utama" : "Istirahat"}
           </div>
        </div>

        {/* Exit Button */}
        <button 
          onClick={() => setDeepFocusActive(false)}
          className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-surface-container border border-outline/10 flex items-center justify-center text-on-surface-variant hover:bg-rose-500 hover:text-white hover:border-transparent transition-all z-50"
        >
           <X size={18} />
        </button>

        {/* Main Content Area */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm gap-8">
          
          {/* Creative Breathing Timer Ring */}
          <div className="relative w-64 h-64 flex items-center justify-center select-none">
            
            {/* Outer Slow Breathing Pulse Ring (only animates when timer is active) */}
            {isActive && (
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.08, 0.02, 0.08]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`absolute inset-0 rounded-full border border-dashed ${mode === "focus" ? "border-primary" : "border-emerald-500"}`}
              />
            )}

            {/* SVG Progress Circle */}
            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 200 200">
              {/* Background Track */}
              <circle
                cx="100"
                cy="100"
                r="86"
                className="stroke-surface-container-high fill-transparent"
                strokeWidth="4"
              />
              {/* Active Progress Circle */}
              <motion.circle
                cx="100"
                cy="100"
                r="86"
                className={`fill-transparent ${mode === "focus" ? "stroke-primary" : "stroke-emerald-500"}`}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="540.35"
                animate={{
                  strokeDashoffset: 540.35 * (timeLeft / totalSeconds)
                }}
                transition={{
                  duration: 1,
                  ease: "linear"
                }}
              />
            </svg>

            {/* Timer Core Text & Info */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-5xl font-headline font-black tracking-tighter text-on-surface tabular-nums">
                {formatTime(timeLeft)}
              </span>
              <div className="flex items-center gap-1.5 mt-2 text-on-surface-variant font-black uppercase tracking-widest text-[9px] opacity-75">
                 {mode === "focus" ? <Brain size={12} className="text-primary" /> : <Coffee size={12} className="text-emerald-500" />}
                 <span>{mode === "focus" ? "Fokus" : "Jeda"}</span>
              </div>
            </div>

          </div>

          {/* Simple basic buttons */}
          <div className="flex items-center gap-4 h-16 mt-4">
             <button 
               onClick={() => setTimeLeft(totalSeconds)}
               className="w-12 h-12 rounded-xl bg-surface-container border border-outline/10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-all"
               title="Reset"
             >
                <Square size={16} fill="currentColor" />
             </button>
             
             <button 
               onClick={() => setIsActive(!isActive)}
               className={`w-14 h-14 rounded-xl flex items-center justify-center text-white transition-all active:scale-95 ${mode === "focus" ? "bg-primary hover:bg-primary/95" : "bg-emerald-600 hover:bg-emerald-600/95"}`}
             >
                {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
             </button>

             <button 
               onClick={handleSessionComplete}
               className="w-12 h-12 rounded-xl bg-surface-container border border-outline/10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-all"
               title="Skip Sesi"
             >
                <ChevronUp className="rotate-90" size={16} fill="currentColor" />
             </button>
          </div>
        </div>

        {/* Audio Player & Config */}
        <div className="relative z-10 w-full max-w-xs mt-10">
           <div className="flex items-center gap-3 bg-surface-container border border-outline/15 p-3 rounded-xl w-full shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                 <Music size={14} />
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant/70 mb-0.5">Musik Latar</p>
                 <p className="text-xs font-semibold text-on-surface truncate">Lo-fi {mode === "focus" ? "Deep Work" : "Garden Chill"}</p>
              </div>
              <button 
                onClick={() => setIsNotMuted(!isMuted)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isMuted ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"}`}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
           </div>
        </div>

        <audio 
          ref={audioRef}
          src={mode === "focus" ? LOFI_TRACKS.focus : LOFI_TRACKS.break}
        />
      </motion.div>
    </AnimatePresence>
  );
}
