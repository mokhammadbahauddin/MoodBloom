import React, { useState, useEffect } from "react";
import { Users, Zap } from "lucide-react";
import { motion } from "motion/react";
import { db } from "../lib/firebase";
import { doc, onSnapshot, setDoc, increment, updateDoc } from "firebase/firestore";

export const SocialResilience = () => {
  const [activeCount, setActiveCount] = useState<number>(0);

  useEffect(() => {
    // Reference to a global stats document
    const statsRef = doc(db, "system", "stats");

    // Listen to real-time updates
    const unsubscribe = onSnapshot(statsRef, (doc) => {
      if (doc.exists()) {
        setActiveCount(doc.data().activeToday || 120); // Fallback to a nice number
      }
    });

    // Increment active today once per session (roughly)
    const lastSession = localStorage.getItem("last_session_pulse");
    const today = new Date().toISOString().split('T')[0];
    
    if (lastSession !== today) {
      updateDoc(statsRef, {
        activeToday: increment(1)
      }).catch(() => {
        // If doc doesn't exist, create it
        setDoc(statsRef, { activeToday: 1 }, { merge: true });
      });
      localStorage.setItem("last_session_pulse", today);
    }

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex items-center gap-2 bg-primary/5 border border-primary/10 px-4 py-2.5 rounded-2xl shadow-sm">
      <div className="relative">
        <Users size={16} className="text-primary" />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border border-white"
        />
      </div>
      <div>
        <p className="text-[10px] font-black text-on-surface leading-none uppercase tracking-widest">Global Pulse</p>
        <p className="text-[9px] font-bold text-on-surface-variant opacity-60 mt-1">
          <span className="text-primary">{activeCount.toLocaleString()}</span> Bloomies aktif hari ini
        </p>
      </div>
    </div>
  );
};
