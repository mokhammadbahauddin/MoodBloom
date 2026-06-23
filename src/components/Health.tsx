import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Droplet, Smile, Moon, Activity, Wind } from "lucide-react";
import Water from "./Water";
import Mood from "./Mood";
import Prayer from "./Prayer";
import Steps from "./Steps";
import Meditation from "./Meditation";

export default function Health({
  onOpenChat,
  activeTab = "water",
  onTabChange,
  onNavigate,
  isActive = true,
}: {
  onOpenChat?: () => void;
  activeTab?: "water" | "mood" | "prayer" | "steps" | "meditation";
  onTabChange?: (tab: "water" | "mood" | "prayer" | "steps" | "meditation") => void;
  onNavigate?: (tab: string, subTab?: string) => void;
  isActive?: boolean;
}) {
  const tabs = [
    { id: "water", label: "Air", icon: Droplet, color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "mood", label: "Mood", icon: Smile, color: "text-amber-500", bg: "bg-amber-500/10" },
    { id: "prayer", label: "Ibadah", icon: Moon, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { id: "steps", label: "Jalan", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "meditation", label: "Meditasi", icon: Wind, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({
    [activeTab]: true
  });

  useEffect(() => {
    if (!visitedTabs[activeTab]) {
      setVisitedTabs((prev) => ({ ...prev, [activeTab]: true }));
    }
  }, [activeTab, visitedTabs]);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative w-full min-h-[500px]">
        {/* Water Tab */}
        <div className={activeTab === "water" ? "block" : "hidden"}>
          {visitedTabs.water && (
            <motion.div
              animate={activeTab === "water" ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              initial={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Water isActive={isActive && activeTab === "water"} onOpenChat={onOpenChat} />
            </motion.div>
          )}
        </div>

        {/* Mood Tab */}
        <div className={activeTab === "mood" ? "block" : "hidden"}>
          {visitedTabs.mood && (
            <motion.div
              animate={activeTab === "mood" ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              initial={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Mood isActive={isActive && activeTab === "mood"} onOpenChat={onOpenChat} onNavigate={onNavigate} />
            </motion.div>
          )}
        </div>

        {/* Prayer Tab */}
        <div className={activeTab === "prayer" ? "block" : "hidden"}>
          {visitedTabs.prayer && (
            <motion.div
              animate={activeTab === "prayer" ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              initial={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Prayer isActive={isActive && activeTab === "prayer"} />
            </motion.div>
          )}
        </div>

        {/* Steps Tab */}
        <div className={activeTab === "steps" ? "block" : "hidden"}>
          {visitedTabs.steps && (
            <motion.div
              animate={activeTab === "steps" ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              initial={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Steps isActive={isActive && activeTab === "steps"} />
            </motion.div>
          )}
        </div>

        {/* Meditation Tab */}
        <div className={activeTab === "meditation" ? "block" : "hidden"}>
          {visitedTabs.meditation && (
            <motion.div
              animate={activeTab === "meditation" ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              initial={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Meditation isActive={isActive && activeTab === "meditation"} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
