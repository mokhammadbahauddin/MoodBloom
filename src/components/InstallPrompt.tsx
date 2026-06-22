import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { hapticFeedback } from "../lib/haptics";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the custom prompt after a short delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For iOS, show the prompt if not already in standalone
    if (isIOSDevice && !window.matchMedia('(display-mode: standalone)').matches) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    hapticFeedback("medium");
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-50"
        >
          <div className="glass-panel p-5 bg-primary/10 border-primary/20 shadow-2xl flex flex-col gap-4 overflow-hidden relative">
            {/* Animated Glow Effect */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
            
            <div className="flex items-start justify-between relative z-10">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
                  <Download size={24} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <h4 className="font-headline font-black text-on-surface text-lg leading-tight">Instal MoodBloom</h4>
                  <p className="text-on-surface-variant text-xs font-medium">Dapatkan akses cepat & hemat kuota langsung dari layar utama Anda.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPrompt(false)}
                className="p-1 hover:bg-black/5 rounded-full text-on-surface-variant"
              >
                <X size={18} />
              </button>
            </div>

            {isIOS ? (
              <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 border border-black/5 flex items-start gap-3">
                 <Info size={16} className="text-primary shrink-0 mt-0.5" />
                 <p className="text-[10px] font-bold text-on-surface-variant leading-relaxed">
                   Klik ikon <span className="text-primary">Bagikan</span> lalu pilih <span className="text-primary">"Tambah ke Layar Utama"</span> untuk menginstal di iPhone Anda.
                 </p>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="w-full bg-primary text-white font-black py-3 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
              >
                PASANG SEKARANG
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
