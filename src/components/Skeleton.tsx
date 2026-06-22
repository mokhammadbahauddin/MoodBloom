import { motion } from "motion/react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-surface-container-highest/30 rounded-2xl ${className}`}>
      <motion.div
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
      />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="space-y-8 pt-6 pb-20 max-w-2xl mx-auto px-4">
      {/* Header Skeleton */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-5">
          <Skeleton className="w-20 h-20 !rounded-full" />
          <div className="space-y-2">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-48 h-8" />
          </div>
        </div>
        <Skeleton className="w-12 h-12 !rounded-2xl" />
      </div>

      {/* Streak Skeleton */}
      <Skeleton className="w-full h-32" />

      {/* Hero Skeleton */}
      <Skeleton className="w-full h-40 !rounded-2xl" />

      {/* Insight Skeleton */}
      <Skeleton className="w-full h-24 !rounded-2xl" />

      {/* Bento Grid Skeleton */}
      <div className="grid grid-cols-12 gap-5">
        <Skeleton className="col-span-12 md:col-span-7 h-[240px] !rounded-2xl" />
        <div className="col-span-12 md:col-span-5 grid grid-rows-2 gap-5 h-[240px]">
          <Skeleton className="h-full !rounded-2xl" />
          <Skeleton className="h-full !rounded-2xl" />
        </div>
      </div>

      {/* Activity Details Skeleton */}
      <div className="space-y-5">
        <Skeleton className="w-full h-32 !rounded-2xl" />
        <Skeleton className="w-full h-32 !rounded-2xl" />
      </div>
    </div>
  );
}
