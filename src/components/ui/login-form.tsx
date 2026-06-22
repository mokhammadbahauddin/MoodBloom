"use client";
import React, { useState } from "react";
import { User, Lock, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

interface LoginFormProps {
  onGoogleSignIn: () => void;
  onEmailSignIn: (email: string, pass: string) => void;
  onEmailSignUp: (email: string, pass: string) => void;
  isLoading: boolean;
}

/**
 * A glassmorphism-style login form component with animated labels and Google login.
 */
/**
 * A decorative background component with animated blobs.
 */
export function SmokeyBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-surface">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-secondary/10 blur-[120px]"
      />
      <div className="absolute inset-0 bg-white/40" />
    </div>
  );
}

export function LoginForm({
  onGoogleSignIn,
  onEmailSignIn,
  onEmailSignUp,
  isLoading,
}: LoginFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      onEmailSignUp(email, password);
    } else {
      onEmailSignIn(email, password);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm p-8 space-y-6 bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/80 shadow-2xl relative z-10"
    >
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
          <Sparkles size={32} fill="currentColor" />
        </div>
        <div className="space-y-1">
          <h2 className="text-4xl font-headline font-black text-on-surface tracking-tighter">
            {isSignUp ? "Join Oasis" : "Welcome"}
          </h2>
          <p className="text-sm font-medium text-on-surface-variant opacity-60">
            {isSignUp ? "Start your wellness journey" : "Continue your growth"}
          </p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-on-surface-variant uppercase tracking-wider ml-1">Email</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                <User size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40"
                placeholder="you@university.edu"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-on-surface-variant uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {!isSignUp && (
          <div className="flex justify-end">
            <button type="button" className="text-xs font-bold text-primary hover:underline">
              Forgot?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className="group w-full flex items-center justify-center py-4 bg-primary hover:bg-primary-dim text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {isSignUp ? "CREATE ACCOUNT" : "SIGN IN"}
          <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-outline/5"></div>
          <span className="flex-shrink mx-4 text-on-surface-variant/40 text-[10px] font-black tracking-widest uppercase">
            Quick Connect
          </span>
          <div className="flex-grow border-t border-outline/5"></div>
        </div>

        <button
          type="button"
          onClick={onGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center py-4 bg-white border border-outline/10 hover:bg-surface-container rounded-2xl text-on-surface font-black text-xs uppercase tracking-widest shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <>
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-4 h-4 mr-3"
                alt="Google"
              />
              GOOGLE ACCESS
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs font-medium text-on-surface-variant pt-4">
        {isSignUp ? "Already a member?" : "New to MoodBloom?"}{" "}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="font-black text-primary hover:underline"
        >
          {isSignUp ? "SIGN IN" : "JOIN NOW"}
        </button>
      </p>
    </motion.div>
  );
}
