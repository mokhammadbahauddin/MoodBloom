import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Schedule from "./Schedule";
import FocusTimer from "./FocusTimer";

export default function Productivity({
  activeTab = "schedule",
  onTabChange,
}: {
  activeTab?: "schedule" | "focus";
  onTabChange?: (tab: "schedule" | "focus") => void;
}) {
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({
    [activeTab]: true
  });

  useEffect(() => {
    if (!visitedTabs[activeTab]) {
      setVisitedTabs((prev) => ({ ...prev, [activeTab]: true }));
    }
  }, [activeTab, visitedTabs]);

  return (
    <div className="flex flex-col gap-8 pb-32">
      <div className="relative w-full">
        {/* Schedule Tab */}
        <div className={activeTab === "schedule" ? "block" : "hidden"}>
          {visitedTabs.schedule && (
            <motion.div
              animate={activeTab === "schedule" ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              initial={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Schedule onStartFocus={() => onTabChange?.("focus")} />
            </motion.div>
          )}
        </div>

        {/* FocusTimer Tab */}
        <div className={activeTab === "focus" ? "block" : "hidden"}>
          {visitedTabs.focus && (
            <motion.div
              animate={activeTab === "focus" ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              initial={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <FocusTimer />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
