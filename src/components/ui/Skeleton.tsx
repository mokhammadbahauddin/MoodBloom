import React from "react";
import { cn } from "../../lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "circle" | "rect" | "text";
}

/**
 * Skeleton Loader - High-End UI Component
 * Features a hardware-accelerated shimmer effect for smooth data transitions.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = "", 
  variant = "rect" 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "circle": return "rounded-full";
      case "text": return "rounded-md h-4 w-full";
      case "rect": return "rounded-2xl";
      default: return "rounded-2xl";
    }
  };

  return (
    <div
      className={cn(
        "bg-surface-container-high relative overflow-hidden",
        getVariantStyles(),
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
};

/**
 * OasisLoader - Full page shimmer pattern
 */
export const OasisLoader = () => (
  <div className="space-y-12 pt-10 px-6 animate-pulse">
    <div className="flex justify-between items-start">
       <div className="space-y-4">
          <Skeleton className="w-32 h-4" variant="text" />
          <Skeleton className="w-48 h-10" />
       </div>
       <Skeleton className="w-14 h-14" variant="circle" />
    </div>
    <Skeleton className="w-full h-64" />
    <div className="grid grid-cols-2 gap-6">
       <Skeleton className="h-48" />
       <Skeleton className="h-48" />
    </div>
  </div>
);
