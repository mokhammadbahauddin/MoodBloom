import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn, renderFormattedText } from "../lib/utils";
import { Sparkles, Send, X } from "lucide-react";
import { AIAvatar } from "./AIInsight";

export default function QuickActionSheet({
  isOpen,
  onClose,
  initialTab = "ai",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "water" | "mood" | "task" | "ai" | "focus";
}) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const [messages, setMessages] = useState<
    { id: string; sender: "user" | "ai"; text: string }[]
  >([
    {
      id: "initial-ai-msg",
      sender: "ai",
      text: "Hai! Ada yang bisa aku bantu untuk keseharianmu hari ini?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isAiTyping]);

  const handleChat = async () => {
    if (!chatInput.trim() || isAiTyping) return;
    const msg = chatInput.trim();
    setChatInput("");
    
    const userMsg = { id: crypto.randomUUID(), sender: "user" as const, text: msg };
    setMessages((prev) => [...prev, userMsg]);
    setIsAiTyping(true);

    try {
      const { aiService } = await import("../services/aiService");
      const nextHistory = [...messages, userMsg];
      const reply = await aiService.chatWithAI(msg, nextHistory);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), sender: "ai", text: reply }]);
    } catch (err) {
      console.error("AI Quick Action Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: "ai",
          text: "Ah, maaf. Sepertinya koneksiku sedang terganggu.",
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 pointer-events-auto"
      />
      <motion.div
        initial={isDesktop ? { x: "100%", y: 0, opacity: 1 } : { y: "100%", x: 0, opacity: 1 }}
        animate={isDesktop ? { x: 0, y: 0, opacity: 1 } : { y: 0, x: 0, opacity: 1 }}
        exit={isDesktop ? { x: "100%", y: 0, opacity: 1 } : { y: "100%", x: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={cn(
          "fixed z-50 bg-surface-container-highest shadow-2xl p-4 md:p-6 pointer-events-auto flex flex-col transition-all duration-300",
          isDesktop
            ? "top-0 bottom-0 right-0 w-96 h-screen rounded-l-2xl border-l border-outline/10"
            : "bottom-0 left-0 right-0 h-[85vh] rounded-t-2xl"
        )}
      >
        {/* Header containing only Close button and drag handle */}
        <div className="flex justify-end items-center mb-4 shrink-0 relative">
           {!isDesktop && <div className="w-12 h-1.5 bg-outline-variant rounded-full absolute left-1/2 -translate-x-1/2 -top-2" />}
           <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-on-surface-variant">
              <X size={20} />
           </button>
        </div>

        {/* AI Chat Area */}
        <div className="flex-1 pb-8 flex flex-col min-h-0 overflow-hidden">
          <div className="flex flex-col flex-1 min-h-0">
             <div className="flex justify-between items-center mb-4 px-2 shrink-0">
                <div className="flex items-center gap-3">
                   <AIAvatar className="w-10 h-10 border-2 border-primary/20" />
                   <div>
                      <h3 className="font-headline font-black text-sm text-on-surface leading-none">Oasis Wellness</h3>
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Analysis</span>
                   </div>
                </div>
             </div>

             {/* Message List */}
             <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 pb-4 px-2">
               {messages.map((m) => (
                 <div
                   key={m.id}
                   className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} gap-3`}
                 >
                   <div
                     className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm font-medium leading-relaxed ${
                       m.sender === "user" 
                         ? "bg-primary text-white rounded-br-none shadow-lg shadow-primary/20" 
                         : "bg-surface-container border border-outline/5 text-on-surface rounded-bl-none shadow-sm"
                     }`}
                   >
                     {renderFormattedText(m.text)}
                   </div>
                 </div>
               ))}
               {isAiTyping && (
                 <div className="flex justify-start">
                   <div className="bg-surface-container border border-outline/5 p-4 rounded-2xl rounded-bl-none flex gap-1.5 items-center">
                     <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                     <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                     <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                   </div>
                 </div>
               )}
               <div ref={chatBottomRef} />
             </div>

             {/* Input Bar */}
             <div className="flex gap-2 items-center bg-surface-container-highest p-3 rounded-2xl border border-outline/10 mt-4 shadow-2xl mb-2 shrink-0">
               <input
                 type="text"
                 placeholder="Curhat atau tanya saran..."
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === "Enter") handleChat();
                 }}
                 className="flex-1 bg-transparent border-none focus:outline-none px-4 text-sm font-bold text-on-surface placeholder:text-on-surface-variant/30"
               />
               <button
                 disabled={!chatInput.trim() || isAiTyping}
                 onClick={handleChat}
                 className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 disabled:opacity-50 transition-all active:scale-90 shadow-lg shadow-primary/20"
               >
                 <Send size={18} />
               </button>
             </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
