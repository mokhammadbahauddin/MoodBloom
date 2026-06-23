import React, { useState, useRef, useEffect } from "react";
import { useUserStore } from "../lib/userStore";
import { useProductivityStore } from "../lib/productivityStore";
import { useHabitsStore } from "../lib/habitsStore";
import { useSettingsStore } from "../lib/settingsStore";
import {
  Send,
  Sparkles,
  Bot,
  User,
  MoreHorizontal,
  ChevronLeft,
  MessageSquare,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AIAvatar } from "./AIInsight";
import { hapticFeedback } from "../lib/haptics";
import { calculateDailyWellnessScore } from "../lib/wellnessUtils";
import { renderFormattedText } from "../lib/utils";
import { getTodayDateString } from "../lib/dateUtils";

/**
 * AIAssistantTab - Phase 3 Professional Overhaul
 * Immersive, full-screen conversation space with reactive depth and high-end visual feedback.
 */
export default function AIAssistantTab({ isActive = true }: { isActive?: boolean }) {
  const aiAnalysis = useUserStore(state => (state as any).aiAnalysis);
  const userName = useUserStore(state => state.userName);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([
    {
      id: "init",
      role: "assistant",
      content: `Selamat datang di Pusat Kesadaran Oasis, ${userName || "Sobat"}. Saya adalah Companion pribadimu. Apa yang ingin kita selaraskan hari ini?`,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const wellnessScore = calculateDailyWellnessScore({ ...useUserStore.getState(), ...useHabitsStore.getState(), ...useProductivityStore.getState() } as any, getTodayDateString());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isActive) return;
    scrollToBottom();
  }, [isActive, messages, isTyping]);

  const activeChatContext = useUserStore(state => state.activeChatContext);
  const setActiveChatContext = useUserStore(state => state.setActiveChatContext);

  useEffect(() => {
    if (!isActive) return;
    if (activeChatContext) {
      const insightMsg = `Saya ingin membahas insight ini: "${activeChatContext}"`;
      
      const userMsg = { id: Date.now().toString(), role: "user", content: insightMsg };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);
      
      const sendContextToAI = async () => {
        try {
          const { aiService } = await import("../services/aiService");
          const nextHistory = [...messages, userMsg];
          const reply = await aiService.chatWithAI(insightMsg, nextHistory);
          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString() + "-ai", role: "assistant", content: reply },
          ]);
        } catch (error) {
          console.error("AI Chat Error:", error);
        } finally {
          setIsTyping(false);
        }
      };
      
      sendContextToAI();
      setActiveChatContext(null); // Clear context after triggering
    }
  }, [isActive, activeChatContext, aiAnalysis, setActiveChatContext]);

  const handleSendMessage = async (textToSend?: string) => {
    const targetText = textToSend || input;
    if (!targetText.trim()) return;
    hapticFeedback("light");
    
    const userMsg = { id: Date.now().toString(), role: "user", content: targetText };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    try {
      const { aiService } = await import("../services/aiService");
      const nextHistory = [...messages, userMsg];
      const reply = await aiService.chatWithAI(targetText, nextHistory);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "-ai", role: "assistant", content: reply },
      ]);
      new Audio("/sounds/notification.mp3").play().catch(() => {});
    } catch (error) {
      console.error("AI Chat Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const getDynamicQuickReplies = () => {
    const today = getTodayDateString();
    
    const waterLogs = useHabitsStore.getState().waterLogs || {};
    const stepsLogs = useHabitsStore.getState().stepsLogs || {};
    const moodLogs = useHabitsStore.getState().moodLogs || {};
    const meditationLogs = useHabitsStore.getState().meditationLogs || {};
    const baseWaterGoal = useHabitsStore.getState().baseWaterGoal || 2;
    const stepGoal = useHabitsStore.getState().stepGoal || 1000;
    const tasks = useProductivityStore.getState().tasks || [];

    const waterToday = waterLogs[today] || 0;
    const stepsToday = stepsLogs[today] || 0;
    const meditationToday = meditationLogs[today] || 0;
    const moodToday = moodLogs[today];
    const pendingTasksCount = tasks.filter((t: any) => !t.completed).length;

    const replies = [];

    if (waterToday < baseWaterGoal * 0.5) {
      replies.push({ text: "Air minum saya kurang hari ini 💧", action: "Saya ingin tanya tips tentang asupan air minum saya yang kurang hari ini." });
    }
    if (moodToday && moodToday.sleepValue <= 2) {
      replies.push({ text: "Tidur saya buruk semalam 😴", action: "Tidur saya buruk dan kurang nyenyak semalam, bagaimana mengatasinya?" });
    }
    if (moodToday && moodToday.moodValue <= 2) {
      replies.push({ text: "Saya merasa stres / cemas 🌸", action: "Saya merasa stres dan cemas hari ini dengan kuliah." });
    }
    if (pendingTasksCount >= 3) {
      replies.push({ text: "Tugas saya menumpuk 🚀", action: "Tugas saya menumpuk hari ini, bantu saya membaginya." });
    }
    if (stepsToday < stepGoal * 0.4) {
      replies.push({ text: "Saya kurang bergerak hari ini 🚶‍♂️", action: "Saya kurang bergerak dan berjalan kaki hari ini." });
    }
    if (meditationToday === 0) {
      replies.push({ text: "Butuh saran relaksasi 🧘", action: "Bantu saya rileks sejenak." });
    }

    if (replies.length < 3) {
      replies.push({ text: "Bagaimana tidur sehat? 😴", action: "Apa saja tips untuk mendapatkan kualitas tidur malam yang sehat?" });
      replies.push({ text: "Tips fokus belajar ⏱️", action: "Bagaimana cara menjaga fokus belajar di sela-sela rasa bosan?" });
    }
    
    return replies.slice(0, 3);
  };

  if (!isActive) {
    return <div className="min-h-[400px]" />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-transparent animate-in fade-in duration-500 overflow-hidden">
      {/* Immersive AI Header */}
      <header className="px-6 py-6 flex flex-col items-center text-center space-y-4 bg-surface/40 backdrop-blur-xl border-b border-outline/5 relative z-20">
         <AIAvatar className="w-24 h-24" />
         <div>
            <h2 className="text-xl font-headline font-black text-on-surface tracking-tighter">Oasis Guardian</h2>
            <div className="flex items-center gap-1.5 justify-center mt-1">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-widest text-primary opacity-60 italic">Online Consciousness</span>
            </div>
         </div>
         
         <div className="absolute top-6 right-6">
            <button className="w-10 h-10 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant active:scale-90 transition-all">
               <MoreHorizontal size={20} />
            </button>
         </div>
      </header>

      {/* Chat Space */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar relative">
        {/* Spatial Depth Elements */}
        <div className="absolute inset-0 bg-primary/[0.02] -z-10 pointer-events-none" />
        
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.05 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] p-5 rounded-2xl shadow-sm ${msg.role === "user" ? "bg-primary text-white rounded-tr-none" : "bg-surface-container/80 backdrop-blur-md text-on-surface border border-outline/5 rounded-tl-none"}`}>
               <p className={`text-sm leading-relaxed ${msg.role === "user" ? "font-bold" : "font-medium"}`}>
                 {renderFormattedText(msg.content)}
               </p>
            </div>
          </motion.div>
        ))}
        
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
             <div className="bg-surface-container-high/40 p-4 rounded-2xl rounded-tl-none flex gap-1">
                {[1, 2, 3].map(dot => (
                  <motion.div 
                    key={`typing-dot-${dot}`}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: dot * 0.1 }}
                    className="w-1.5 h-1.5 rounded-full bg-primary" 
                  />
                ))}
             </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Oasis */}
      <div className="p-6 bg-surface/60 backdrop-blur-xl border-t border-outline/5">
         {/* Dynamic Quick Reply Suggestions */}
         <div className="flex flex-wrap gap-2 justify-center mb-4">
           {getDynamicQuickReplies().map((reply, idx) => (
             <button
               key={`quick-reply-${idx}`}
               onClick={() => handleSendMessage(reply.action)}
               className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/25 hover:bg-primary hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
             >
               {reply.text}
             </button>
           ))}
         </div>
         <div className="max-w-2xl mx-auto relative group">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendMessage()}
              placeholder="Beritahu Guardian..."
              className="w-full bg-surface-container-high/80 border border-outline/10 p-5 pr-16 rounded-2xl font-bold text-sm text-on-surface outline-none focus:ring-4 ring-primary/5 transition-all shadow-inner"
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={!input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-30 disabled:scale-100"
            >
               <Send size={18} fill="currentColor" className="ml-0.5" />
            </button>
         </div>
         <p className="text-center text-[8px] font-black uppercase tracking-[0.4em] text-on-surface-variant opacity-20 mt-4">AI Guidance may vary. Harmony is key.</p>
      </div>
    </div>
  );
}
