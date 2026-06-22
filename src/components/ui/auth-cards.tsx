'use client'
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeClosed, ArrowRight, Loader2, User } from 'lucide-react';
import { cn } from "../../lib/utils";
import LazyLottie from '../LazyLottie';
import { hapticFeedback } from "../../lib/haptics";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "file:text-foreground placeholder:text-on-surface/30 selection:bg-primary selection:text-white border-outline flex h-14 w-full min-w-0 rounded-2xl border bg-surface-container/60 px-6 py-2 text-base shadow-inner transition-all outline-none disabled:pointer-events-none disabled:opacity-50",
        "focus:border-primary/50 focus:ring-4 focus:ring-primary/5",
        className
      )}
      {...props}
    />
  )
}

interface AuthCardProps {
  onToggle: () => void;
  onSubmit: (email: string, pass: string, name?: string) => Promise<void>;
  onGoogleSignIn: () => void;
  isLoading: boolean;
}

export function SignInCard({ onToggle, onSubmit, onGoogleSignIn, isLoading }: AuthCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isLoading) return;
    hapticFeedback("medium");
    await onSubmit(email, password);
  };

  return (
    <div className="oasis-card p-10 bg-surface/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden border border-outline/10">
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
      
      <div className="flex justify-center mb-8 relative">
        <div className="w-24 h-24 bg-primary/5 rounded-2xl border border-primary/10 p-2 overflow-hidden shadow-inner relative group">
           <LazyLottie src="https://lottie.host/99ycRpAESG/0f80da80-b106-4e70-9eac-9a0727c9f0b1.json" loop autoplay />
        </div>
      </div>

      <div className="text-center space-y-2 mb-10">
        <h1 className="text-4xl font-headline font-black tracking-tighter text-on-surface">
          Welcome <span className="text-primary">Back</span>.
        </h1>
        <p className="text-on-surface-variant font-medium uppercase tracking-widest text-[10px] opacity-60">Log in to your Digital Oasis</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="relative group">
            <Mail className={cn("absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors z-10 pointer-events-none", focusedInput === "email" ? "text-primary" : "text-on-surface-variant opacity-40")} />
            <Input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedInput("email")} onBlur={() => setFocusedInput(null)} className="pl-14" required />
          </div>

          <div className="relative group">
            <Lock className={cn("absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors z-10 pointer-events-none", focusedInput === "password" ? "text-primary" : "text-on-surface-variant opacity-40")} />
            <Input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocusedInput("password")} onBlur={() => setFocusedInput(null)} className="pl-14 pr-14" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40 hover:opacity-100 transition-opacity z-10">
              {showPassword ? <Eye size={20} /> : <EyeClosed size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest px-1">
          <label className="flex items-center gap-2 cursor-pointer text-on-surface-variant opacity-60 hover:opacity-100 transition-opacity">
            <input type="checkbox" className="w-4 h-4 rounded-md border-outline bg-surface-container text-primary focus:ring-primary/20" />
            <span>Remember</span>
          </label>
          <a href="#" className="text-primary hover:text-primary-dim transition-colors">Forgot Pass?</a>
        </div>

        <button type="submit" disabled={isLoading} className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 pointer-events-auto relative z-20">
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Sign In <ArrowRight size={20} /></>}
        </button>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-outline/5"></div>
          <span className="mx-4 text-[10px] font-black text-on-surface-variant opacity-30 uppercase tracking-[0.3em]">OR</span>
          <div className="flex-grow border-t border-outline/5"></div>
        </div>

        <button type="button" onClick={onGoogleSignIn} className="w-full h-14 bg-surface-container-high border border-outline/5 text-on-surface rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-surface-container transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm pointer-events-auto">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" /> 
          <span>Google Account</span>
        </button>

        <p className="text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 mt-10">
          New here? <button type="button" onClick={onToggle} className="text-primary font-bold hover:underline">Create an account</button>
        </p>
      </form>
    </div>
  );
}

export function SignUpCard({ onToggle, onSubmit, onGoogleSignIn, isLoading }: AuthCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || isLoading) return;
    hapticFeedback("medium");
    await onSubmit(email, password, name);
  };

  return (
    <div className="oasis-card p-10 bg-surface/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden border border-outline/10">
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
      
      <div className="flex justify-center mb-8 relative">
        <div className="w-24 h-24 bg-primary/5 rounded-2xl border border-primary/10 p-2 overflow-hidden shadow-inner relative group">
           <LazyLottie src="https://lottie.host/80e4c7a6-afff-4f30-8c79-70fbba2d9d5e/6V5xXIcVJS.json" loop autoplay />
        </div>
      </div>

      <div className="text-center space-y-2 mb-10">
        <h1 className="text-4xl font-headline font-black tracking-tighter text-on-surface">
          Start Your <span className="text-primary">Journey</span>.
        </h1>
        <p className="text-on-surface-variant font-medium uppercase tracking-widest text-[10px] opacity-60">Create your wellness account</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="relative group">
            <User className={cn("absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors z-10 pointer-events-none", focusedInput === "name" ? "text-primary" : "text-on-surface-variant opacity-40")} />
            <Input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setFocusedInput("name")} onBlur={() => setFocusedInput(null)} className="pl-14" required />
          </div>
          <div className="relative group">
            <Mail className={cn("absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors z-10 pointer-events-none", focusedInput === "email" ? "text-primary" : "text-on-surface-variant opacity-40")} />
            <Input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedInput("email")} onBlur={() => setFocusedInput(null)} className="pl-14" required />
          </div>
          <div className="relative group">
            <Lock className={cn("absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors z-10 pointer-events-none", focusedInput === "password" ? "text-primary" : "text-on-surface-variant opacity-40")} />
            <Input type="password" placeholder="Create Password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocusedInput("password")} onBlur={() => setFocusedInput(null)} className="pl-14" required />
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 mt-4 active:scale-95 transition-all disabled:opacity-50 pointer-events-auto relative z-20">
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Create Account <ArrowRight size={20} /></>}
        </button>

        <p className="text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 mt-10">
          Already have an account? <button type="button" onClick={onToggle} className="text-primary font-bold hover:underline">Sign In here</button>
        </p>
      </form>
    </div>
  );
}
