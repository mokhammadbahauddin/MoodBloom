import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { RefreshCw, ShieldAlert, Home } from "lucide-react";

/**
 * Oasis Recovery UI
 * Professional Grade recovery screen.
 */
export const ErrorOasisUI = ({ error }: { error?: Error }) => (
  <div className="fixed inset-0 z-[1000] bg-surface flex flex-col items-center justify-center p-8 text-center overflow-hidden">
    <div className="absolute inset-0 bg-error/[0.03] animate-pulse" />
    
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative z-10 space-y-8 max-w-md"
    >
      <div className="w-24 h-24 rounded-2xl bg-error/10 flex items-center justify-center text-error mx-auto shadow-2xl shadow-error/20">
         <ShieldAlert size={48} />
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl font-headline font-black text-on-surface tracking-tighter leading-none">
          Gangguan di <span className="text-error">Oasis</span>.
        </h1>
        <p className="text-on-surface-variant font-medium text-lg leading-relaxed">
          Sepertinya ada ombak yang terlalu besar. Mari kita tenang sebentar dan mulai ulang perjalanannya.
        </p>
      </div>

      <div className="p-4 bg-surface-container-high rounded-2xl border border-outline/10 text-left">
         <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 mb-2">Technical Insight</p>
         <p className="font-mono text-xs text-error opacity-70 break-all">
            {error?.message || "Unknown State Mutation Error"}
         </p>
      </div>

      <div className="flex flex-col gap-4">
         <button
          onClick={() => window.location.reload()}
          className="w-full py-5 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <RefreshCw size={20} /> Mulai Ulang Oasis
        </button>
        
        <button
          onClick={() => {
             localStorage.clear();
             window.location.reload();
          }}
          className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-40 hover:opacity-100 transition-opacity"
        >
          Reset Menyeluruh (Hapus Data Lokal)
        </button>
      </div>
    </motion.div>

    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-20">
       <Home size={14} />
       <span className="text-[10px] font-black uppercase tracking-[0.3em]">MoodBloom Protection</span>
    </div>
  </div>
);

/**
 * Functional Error Boundary Wrapper
 * Note: Real Error Boundaries must be class components. 
 * This is a simulated fallback for this environment's TS constraints.
 */
export default class ErrorOasis extends React.Component<any, any> {
  state = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorOasisUI error={this.state.error} />;
    }
    return (this as any).props.children;
  }
}
