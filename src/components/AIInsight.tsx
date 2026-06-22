import { motion } from "motion/react";
import { renderFormattedText } from "../lib/utils";
import LazyLottie from "./LazyLottie";

export function AIAvatar({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      className={`shrink-0 drop-shadow-md relative overflow-hidden rounded-full ${className}`}
    >
      <video
        src="/Normal face bot.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}

export function AIInsight({
  message,
  actionText,
  onAction,
}: {
  message: string;
  actionText?: string;
  onAction?: () => void;
}) {
  return (
    <div
      onClick={onAction}
      className={`glass-panel p-6 rounded-2xl bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent border border-amber-500/20 shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden ${
        onAction ? "cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-300 active:scale-[0.98]" : ""
      }`}
    >
      <div className="absolute top-4 right-4 bg-amber-400 text-amber-950 text-[9px] font-black tracking-widest px-3 py-1 rounded-full uppercase shadow-sm">
        Oasis Insight
      </div>
      <AIAvatar className="w-28 h-28 md:w-20 md:h-20 shrink-0" />
      <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start pt-4 md:pt-0">
        <p className="text-on-surface text-sm sm:text-base font-medium leading-relaxed italic max-w-xl">
          "{renderFormattedText(message)}"
        </p>
        {actionText && (
          <div className="mt-3 text-xs font-black text-amber-600 uppercase tracking-widest hover:underline flex items-center gap-1.5">
            <span>{actionText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
