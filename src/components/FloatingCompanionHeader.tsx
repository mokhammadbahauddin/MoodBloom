import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, ChevronRight, MessageCircle } from "lucide-react";
import { AIAvatar } from "./AIInsight";

/**
 * FloatingCompanionHeader - Phase 3 Reactive Update
 * Smaller entry point that reflects the user's wellness state via aura.
 */
export function FloatingCompanionHeader({ message, score = 100 }: { message: string, score?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* The Persistent Bubble */}
      <motion.button
        layoutId="companion-bubble"
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 bg-surface/40 backdrop-blur-xl border border-outline/10 p-1 rounded-full shadow-lg active:scale-95 transition-all group"
      >
        <AIAvatar className="w-9 h-9" />
        <div className="flex flex-col items-start overflow-hidden pr-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-primary leading-none mb-0.5">Oasis AI</span>
          <span className="text-[10px] font-bold text-on-surface-variant truncate max-w-[100px] opacity-70">
            {message}
          </span>
        </div>
      </motion.button>

      {/* The Full-Screen Assistance Oasis */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-surface/95 backdrop-blur-3xl p-8 flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Background Atmosphere Sync */}
            <div className={`absolute inset-0 bg-primary/5 opacity-40 blur-3xl rounded-full scale-150 -z-10`} />

            <button 
              onClick={() => setIsExpanded(false)}
              className="absolute top-8 right-8 w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center border border-outline/10 text-on-surface-variant active:scale-90 transition-all shadow-xl"
            >
              <X size={28} />
            </button>

            <AIAvatar className="w-56 h-56" />
            
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-center mt-10 max-w-sm"
            >
              <div className="inline-block bg-primary/10 text-primary text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full uppercase mb-4 border border-primary/5">
                Oasis Guardian
              </div>
              
              <h2 className="text-4xl font-headline font-black text-on-surface mb-5 leading-tight tracking-tighter">
                {score > 80 ? "Energi Oasis Sempurna" : score > 50 ? "Semangat Terjaga" : "Butuh Recharge?"}
              </h2>
              
              <p className="text-on-surface-variant font-medium text-lg leading-relaxed italic mb-12 opacity-80">
                "{message}"
              </p>

              <div className="flex flex-col gap-4 w-full">
                <button className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-primary-dim">
                  <MessageCircle size={22} />
                  Buka Konsultasi AI
                </button>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="w-full bg-surface-container text-on-surface-variant py-5 rounded-2xl font-black uppercase tracking-widest border border-outline/5 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  Terima Kasih
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
