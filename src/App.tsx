import { useState, useEffect } from "react";
import {
  Home as HomeIcon,
  Droplet,
  Sparkles,
  Smile,
  LineChart,
  Settings,
  BookOpen,
  Plus,
  Moon,
  ArrowLeft,
  Brain,
  Compass,
  Activity,
  Wind,
  MessageCircle,
  Flower
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { hapticFeedback } from "./lib/haptics";
import Home from "./components/Home";
import Health from "./components/Health";
import Productivity from "./components/Productivity";
import Stats from "./components/Stats";
import SettingsPage from "./components/Settings";
import Prayer from "./components/Prayer";
import QuickActionSheet from "./components/QuickActionSheet";
import AIAssistantTab from "./components/AIAssistantTab";
import { Toaster, toast } from "react-hot-toast";
import { useNotifications } from "./lib/useNotifications";
import { useSensorSync } from "./lib/useSensorSync";
import { useUserStore, DEFAULT_ACHIEVEMENTS } from "./lib/userStore";
import { useProductivityStore } from "./lib/productivityStore";;
import { useHabitsStore } from "./lib/habitsStore";
import { useSettingsStore } from './lib/settingsStore';
import { auth } from "./lib/firebase";
import { getCurrentWeather } from "./services/weatherService";
import Onboarding from "./components/Onboarding";
import DeepFocusOverlay from "./components/DeepFocusOverlay";
import { SyncService } from "./services/syncService";
import { FirebaseStorageAdapter } from "./services/FirebaseStorageAdapter";
import { getSyncStores } from "./services/syncStores";

const syncService = new SyncService(new FirebaseStorageAdapter(), getSyncStores());
import { HomeSkeleton } from "./components/Skeleton";
import InstallPrompt from "./components/InstallPrompt";
import AIBrainObserver from "./components/AIBrainObserver";

// REUSABLE POPUP COMPONENTS
const HabitPopupMenu = ({ 
  isMobile, 
  activeSubTab, 
  onNavigate, 
  onClose 
}: { 
  isMobile: boolean, 
  activeSubTab: string, 
  onNavigate: (tab: string, subTab?: string) => void,
  onClose: () => void
}) => {
  const habits = [
    { id: "water", label: "Hidrasi", icon: Droplet, color: "text-blue-500", bg: "bg-blue-500/10", desc: "Log air minum" },
    { id: "mood", label: "Mood", icon: Smile, color: "text-amber-500", bg: "bg-amber-500/10", desc: "Cek emosi" },
    { id: "prayer", label: "Ibadah", icon: Moon, color: "text-indigo-500", bg: "bg-indigo-500/10", desc: "Waktu sholat" },
    { id: "steps", label: "Langkah", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "Aktivitas fisik" },
    { id: "meditation", label: "Meditasi", icon: Wind, color: "text-rose-500", bg: "bg-rose-500/10", desc: "Ketenangan" },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 pointer-events-auto"
      />
      <motion.div
        initial={isMobile ? { y: "100%" } : { opacity: 0, x: -20 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, x: 0 }}
        exit={isMobile ? { y: "100%" } : { opacity: 0, x: -20 }}
        transition={{ type: "spring", damping: 30, stiffness: 350, mass: 0.8 }}
        className={`${
          isMobile 
            ? "fixed bottom-0 left-0 right-0 rounded-t-2xl p-6 pt-2" 
            : "absolute left-[260px] top-0 w-[320px] rounded-2xl p-6"
        } bg-white/95 backdrop-blur-3xl shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.2)] border border-outline/10 pointer-events-auto z-50`}
      >
        {isMobile && <div className="w-12 h-1.5 bg-outline/20 rounded-full mx-auto my-4" />}

        <div className="flex flex-col">
          <div className="px-2 mb-6">
            <div className="flex items-center gap-2 mb-1">
               <Flower size={16} className="text-primary animate-pulse" />
               <h3 className="font-headline font-black text-xl tracking-tight text-on-surface">Pilih Fokus</h3>
            </div>
            <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold opacity-40">Personalisasi perjalanan kesehatanmu</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {habits.map((hab, idx) => {
              const isActive = activeSubTab === hab.id;
              return (
                <motion.button
                  key={hab.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    onNavigate("health", hab.id);
                    hapticFeedback("medium");
                  }}
                  className={`flex items-center gap-3 p-4 rounded-2xl transition-all border group relative overflow-hidden ${isActive ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-surface-container-low border-outline/5 hover:bg-surface-container-high"}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-active:scale-90 ${isActive ? "bg-white/20 text-white" : hab.bg + " " + hab.color}`}>
                    <hab.icon size={24} strokeWidth={isActive ? 3 : 2} />
                  </div>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className={`text-sm font-black tracking-tight leading-tight truncate w-full ${isActive ? "text-white" : "text-on-surface"}`}>{hab.label}</span>
                    <span className={`text-[10px] font-bold opacity-60 truncate w-full ${isActive ? "text-white/80" : "text-on-surface-variant"}`}>{hab.desc}</span>
                  </div>
                  {isActive && (
                    <motion.div layoutId="active-check-habit" className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
};

const ProductivityPopupMenu = ({ 
  isMobile, 
  activeSubTab, 
  onNavigate, 
  onClose 
}: { 
  isMobile: boolean, 
  activeSubTab: string, 
  onNavigate: (tab: string, subTab?: string) => void,
  onClose: () => void
}) => {
  const options = [
    { id: "schedule", label: "Jadwal", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10", desc: "Agenda harian" },
    { id: "focus", label: "Fokus", icon: Brain, color: "text-purple-500", bg: "bg-purple-500/10", desc: "Zonasi deep work" },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 pointer-events-auto"
      />
      <motion.div
        initial={isMobile ? { y: "100%" } : { opacity: 0, x: -20 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, x: 0 }}
        exit={isMobile ? { y: "100%" } : { opacity: 0, x: -20 }}
        transition={{ type: "spring", damping: 30, stiffness: 350, mass: 0.8 }}
        className={`${
          isMobile 
            ? "fixed bottom-0 left-0 right-0 rounded-t-2xl p-6 pt-2" 
            : "absolute left-[260px] top-0 w-[420px] rounded-2xl p-6"
        } bg-white/95 backdrop-blur-3xl shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.2)] border border-outline/10 pointer-events-auto z-50`}
      >
        {isMobile && <div className="w-12 h-1.5 bg-outline/20 rounded-full mx-auto my-4" />}

        <div className="flex flex-col">
          <div className="px-2 mb-6">
            <div className="flex items-center gap-2 mb-1">
               <Compass size={16} className="text-primary animate-pulse" />
               <h3 className="font-headline font-black text-xl tracking-tight text-on-surface">Produktivitas</h3>
            </div>
            <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold opacity-40">Meningkatkan fokus dan efisiensi</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {options.map((prod, idx) => {
              const isActive = activeSubTab === prod.id;
              return (
                <motion.button
                  key={prod.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    onNavigate("productivity", prod.id);
                    hapticFeedback("medium");
                  }}
                  className={`flex flex-col items-center gap-3 p-5 rounded-2xl transition-all border group relative overflow-hidden text-center h-full ${isActive ? "bg-primary text-white border-primary shadow-xl shadow-primary/20" : "bg-surface-container-low border-outline/5 hover:bg-surface-container-high"}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-active:scale-90 ${isActive ? "bg-white/20 text-white" : prod.bg + " " + prod.color}`}>
                    <prod.icon size={28} strokeWidth={isActive ? 3 : 2} />
                  </div>
                  <div className="flex flex-col items-center overflow-hidden">
                    <span className={`text-base font-black tracking-tight leading-tight mb-1 ${isActive ? "text-white" : "text-on-surface"}`}>{prod.label}</span>
                    <span className={`text-[10px] font-bold opacity-60 ${isActive ? "text-white/80" : "text-on-surface-variant"}`}>{prod.desc}</span>
                  </div>
                  {isActive && (
                    <motion.div layoutId="active-check-prod" className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default function App() {

  const [activeTab, setActiveTab] = useState("home");
  const [healthSubTab, setHealthSubTab] = useState<any>("water");
  const [productivitySubTab, setProductivitySubTab] = useState<any>("schedule");
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({ home: true });

  useEffect(() => {
    if (!visitedTabs[activeTab]) {
      setVisitedTabs((prev) => ({ ...prev, [activeTab]: true }));
    }
  }, [activeTab, visitedTabs]);

  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isHabitPopupOpen, setIsHabitPopupOpen] = useState(false);
  const [isProductivityPopupOpen, setIsProductivityPopupOpen] = useState(false);
  const [quickActionInitialTab, setQuickActionInitialTab] = useState<"water" | "mood" | "task" | "ai" | "focus">("water");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(auth.currentUser?.uid || null);
  
  const { sendNotification } = useNotifications();
  useSensorSync();

  const hasCompletedOnboarding = useUserStore(state => state.hasCompletedOnboarding);
  const habitsHydrated = useHabitsStore(state => state._hasHydrated);
  const userHydrated = useUserStore(state => state._hasHydrated);
  const productivityHydrated = useProductivityStore(state => state._hasHydrated);
  const settingsHydrated = useSettingsStore(state => state._hasHydrated);
  
  const allStoresHydrated = habitsHydrated && userHydrated && productivityHydrated && settingsHydrated;
  
  const settings = useSettingsStore((state) => state.settings);
  const prayerAlarms = useHabitsStore(state => state.prayerAlarms);
  const schedules = useProductivityStore(state => state.schedules);
  const tasks = useProductivityStore(state => state.tasks);
  const meditationActive = useProductivityStore((state) => state.meditationActive);

  const [prayerTimes, setPrayerTimes] = useState<{ name: string; time: string }[]>([]);

  // HYDRATION & AUTH LOADING STATE
  if (!allStoresHydrated) {
    return (
      <div className="min-h-screen bg-surface">
        <HomeSkeleton />
      </div>
    );
  }

  // Auth Lifecycle
  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        // Reset all stores to avoid data carryover / corruption between logged out sessions
        useUserStore.getState().setAll({
          userName: "",
          hasCompletedOnboarding: false,
          focusAreas: [],
          achievements: DEFAULT_ACHIEVEMENTS,
          xp: 0,
          level: 1,
          aiAnalysis: null,
          weeklyCoachingReport: null,
          currentWeather: null,
          activeChatContext: null,
          isFasting: false,
        });

        useHabitsStore.getState().setAll({
          waterLogs: {},
          detailedWaterLogs: {},
          baseWaterGoal: 3.0,
          moodLogs: {},
          streakCount: 0,
          lastStreakUpdate: null,
          meditationLogs: {},
          meditationGoal: 15,
          stepsLogs: {},
          detailedStepsLogs: {},
          stepGoal: 1000,
          prayerLogs: {},
          prayerAlarms: [],
        });

        useProductivityStore.getState().setAll({
          schedules: [],
          tasks: [],
          focusLogs: [],
          activeFocusTaskId: null,
          deepFocusActive: false,
          meditationActive: false,
        });

        useSettingsStore.getState().setAllSettings({
          focusDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          waterGoalML: 3000,
          theme: "system",
          accent: "blue",
          religion: "islam",
          focusTarget: 120,
          userAvatar: "👤",
          userBio: "Penjelajah Oasis",
          notificationPreferences: {
            focus: true,
            water: true,
            mood: true,
          },
          stravaConnected: false,
          appleHealthConnected: false,
        });

        setVisitedTabs({ home: true });
        setActiveTab("home");
        setProfileLoaded(true);
      }
    });
  }, []);

  // Synchronize stores when authenticated
  useEffect(() => {
    if (userId) {
      syncService.setUserId(userId);
      syncService.start().then(() => {
        setProfileLoaded(true);
      });
    } else {
      syncService.stop();
      setProfileLoaded(true);
    }
    return () => {
      syncService.stop();
    };
  }, [userId]);

  // THEME & ACCENT SYSTEM
  const moodLogs = useHabitsStore((state) => useHabitsStore.getState().moodLogs);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  // Derived Accent based on today's mood (Reactive & Instant)
  const derivedAccent = (() => {
    const today = new Date().toISOString().split('T')[0];
    const todayMood = moodLogs[today]?.moodValue;
    
    if (todayMood) {
      const mapping: Record<number, "blue" | "green" | "orange" | "purple"> = {
        4: "orange", 3: "green", 2: "blue", 1: "purple"
      };
      return mapping[todayMood] || settings.accent || "blue";
    }
    return settings.accent || "blue";
  })();

  // Synchronize store if derived accent differs (without causing render loops)
  useEffect(() => {
    if (derivedAccent && settings.accent !== derivedAccent) {
      updateSettings({ accent: derivedAccent });
    }
  }, [derivedAccent, settings.accent, updateSettings]);

  // WEATHER EFFECT
  const setWeather = useUserStore((state) => (state as any).setWeather);
  useEffect(() => {
    async function initWeather() {
      const weather = await getCurrentWeather();
      if (weather) setWeather(weather);
    }
    initWeather();
    // Refresh weather every 30 minutes
    const interval = setInterval(initWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [setWeather]);

  useEffect(() => {
    // Handle Strava OAuth callback...
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      fetch("/api/strava/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to exchange Strava token");
          return res.json();
        })
        .then((data) => {
          updateSettings({
            stravaConnected: true,
            stravaAccessToken: data.access_token,
            stravaRefreshToken: data.refresh_token,
            stravaExpiresAt: data.expires_at * 1000,
          });
          toast.success("Koneksi Strava berhasil!", { icon: "🚴" });
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((err) => {
          console.error("Strava OAuth Error:", err);
          toast.error("Gagal menghubungkan ke Strava.");
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }

    const root = document.documentElement;
    root.classList.remove("dark"); // Force light mode
    
    // Efficiently swap theme classes
    const currentThemeClass = `theme-${derivedAccent}`;
    if (!root.classList.contains(currentThemeClass)) {
      const classesToRemove = Array.from(root.classList).filter((c) => c.startsWith("theme-"));
      classesToRemove.forEach((c) => root.classList.remove(c));
      root.classList.add(currentThemeClass);
    }
  }, [derivedAccent, updateSettings]);

  // Global Alarms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getSeconds() === 0) {
        const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
        prayerTimes.forEach((pt) => {
          if (pt.time === timeStr && prayerAlarms.includes(pt.name)) {
            sendNotification(`Waktunya Sholat ${pt.name}`, { body: "Mari sejenak hentikan aktivitas dan tunaikan ibadah sholat." });
          }
        });
        schedules.forEach((sch) => {
          if (sch.day === now.getDay() && sch.startTime === timeStr) {
            sendNotification(`Kelas Dimulai: ${sch.className}`, { body: `Ruang: ${sch.room}` });
          }
        });
        tasks.forEach((task) => {
          if (!task.completed && task.time) {
            const taskDate = new Date(task.time);
            if (
              taskDate.getFullYear() === now.getFullYear() &&
              taskDate.getMonth() === now.getMonth() &&
              taskDate.getDate() === now.getDate() &&
              taskDate.getHours() === now.getHours() &&
              taskDate.getMinutes() === now.getMinutes()
            ) {
              sendNotification(`Tenggat Waktu: ${task.title}`, { body: "Waktunya untuk menyelesaikan tugas ini!" });
            }
          }
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [prayerTimes, prayerAlarms, schedules, tasks, sendNotification]);

  const openQuickAction = (tab: any = "water") => {
    setQuickActionInitialTab(tab);
    setIsQuickActionOpen(true);
  };

  const getHabitIcon = () => {
    switch(healthSubTab) {
      case "water": return Droplet;
      case "mood": return Smile;
      case "prayer": return Moon;
      case "steps": return Activity;
      case "meditation": return Wind;
      default: return Smile;
    }
  };

  const getProductivityIcon = () => {
    switch(productivitySubTab) {
      case "schedule": return BookOpen;
      case "focus": return Brain;
      default: return BookOpen;
    }
  };

  const navItems = [
    { id: "home", icon: HomeIcon, label: "Beranda" },
    { id: "health", icon: getHabitIcon(), label: "Habit" },
    { id: "productivity", icon: getProductivityIcon(), label: "Jadwal" },
    { id: "insight", icon: LineChart, label: "Insight" },
  ];


  const handleNavigate = (tab: string, subTab?: string) => {
    if (tab === "health") {
      if (activeTab === "health" && !subTab) {
        setIsHabitPopupOpen(!isHabitPopupOpen);
        setIsProductivityPopupOpen(false);
        hapticFeedback("medium");
      } else if (activeTab !== "health" && !subTab) {
        setActiveTab("health");
        setIsHabitPopupOpen(false);
        setIsProductivityPopupOpen(false);
        hapticFeedback("light");
      }
    } else if (tab === "productivity") {
      if (activeTab === "productivity" && !subTab) {
        setIsProductivityPopupOpen(!isProductivityPopupOpen);
        setIsHabitPopupOpen(false);
        hapticFeedback("medium");
      } else if (activeTab !== "productivity" && !subTab) {
        setActiveTab("productivity");
        setIsProductivityPopupOpen(false);
        setIsHabitPopupOpen(false);
        hapticFeedback("light");
      }
    } else {
      setIsHabitPopupOpen(false);
      setIsProductivityPopupOpen(false);
      setActiveTab(tab);
    }
    
    if (tab === "health" && subTab) {
      setHealthSubTab(subTab);
      setIsHabitPopupOpen(false);
      setActiveTab("health");
      hapticFeedback("light");
    } else if (tab === "productivity" && subTab) {
      setProductivitySubTab(subTab);
      setIsProductivityPopupOpen(false);
      setActiveTab("productivity");
      hapticFeedback("light");
    }
  };


  // Profile Image Fallback
  const profilePic = auth.currentUser?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop";

  // LOADING STATE: Prevents white screen & re-onboarding
  if (!profileLoaded && userId) {
    return (
      <div className="min-h-screen bg-surface">
         <HomeSkeleton />
         <div className="fixed bottom-10 left-0 right-0 flex flex-col items-center gap-2 z-50">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="font-headline font-black text-[10px] uppercase tracking-[0.4em] text-primary">Syncing Oasis...</p>
         </div>
      </div>
    );
  }

  // ONBOARDING GATE
  if (!hasCompletedOnboarding) {
    return (
      <Onboarding />
    );
  }

  return (
    <div id="root-app-container" className="flex justify-center min-h-screen overflow-hidden print:overflow-visible bg-transparent">
      <div className="mesh-bg"></div>
      <Toaster position="top-center" />

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-outline/20 p-4 shrink-0 shadow-lg z-20 h-screen sticky top-0 print:hidden">
        <div className="flex items-center gap-3 mb-10 px-2 py-4">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
             <Flower size={24} className="animate-spin-slow" />
          </div>
          <h1 className="font-headline font-black text-2xl tracking-tighter text-primary">MoodBloom</h1>
        </div>
        
        <nav className="flex flex-col gap-3 flex-1 relative">
          {navItems.map((item) => (
            <div key={item.id} className="relative">
              <button
                onClick={() => handleNavigate(item.id)}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all w-full ${
                  activeTab === item.id ? "bg-primary text-white font-black shadow-lg shadow-primary/25" : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <item.icon size={20} strokeWidth={activeTab === item.id ? 3 : 2} />
                <span className="text-sm">{item.label}</span>
                {/* Visual Indicator for Desktop if sub-tabs available */}
                {(item.id === "health" || item.id === "productivity") && activeTab === item.id && (
                  <div className="ml-auto opacity-40">
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  </div>
                )}
              </button>

              {/* DESKTOP POPUPS */}
              <AnimatePresence>
                {item.id === "health" && isHabitPopupOpen && activeTab === "health" && (
                  <HabitPopupMenu 
                    isMobile={false} 
                    activeSubTab={healthSubTab} 
                    onNavigate={handleNavigate} 
                    onClose={() => setIsHabitPopupOpen(false)} 
                  />
                )}
                {item.id === "productivity" && isProductivityPopupOpen && activeTab === "productivity" && (
                  <ProductivityPopupMenu 
                    isMobile={false} 
                    activeSubTab={productivitySubTab} 
                    onNavigate={handleNavigate} 
                    onClose={() => setIsProductivityPopupOpen(false)} 
                  />
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* SIDEBAR ACCOUNT SECTION */}
        <div className="mt-8 pt-6 border-t border-outline/10 flex flex-col gap-4 px-2">
          {/* AI Chat button ABOVE account section */}
          <button
            onClick={() => handleNavigate("ai")}
            className={`flex items-center justify-center gap-2.5 w-full font-black py-4 rounded-2xl transition-all mb-2 ${
              activeTab === "ai"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <MessageCircle size={20} strokeWidth={3} />
            <span className="text-xs uppercase tracking-widest">AI Chat</span>
          </button>

          
          <div className="flex items-center justify-between">
            <button onClick={() => auth.signOut()} className="text-[10px] font-black text-rose-500 hover:underline uppercase tracking-widest px-2">Logout</button>
            <button onClick={() => setActiveTab("settings")} className="p-2.5 bg-surface-container rounded-xl text-on-surface-variant hover:text-primary transition-all hover:scale-110 shadow-sm"><Settings size={18} /></button>
          </div>
        </div>
      </aside>

      {/* MOBILE CONTENT WRAPPER */}
      <div id="mobile-content-wrapper" className="flex-1 flex flex-col relative w-full overflow-hidden h-[100dvh] print:h-auto print:overflow-visible">
        {/* MOBILE HEADER - Refined */}
        <AnimatePresence>
          {!meditationActive && (
            <motion.header 
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              exit={{ y: -100 }}
              className="md:hidden w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline/5 shrink-0 px-6 py-4 sticky top-0 print:hidden"
            >
              <div className="flex justify-between items-center max-w-5xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <Flower size={20} className="animate-spin-slow" />
                  </div>
                  <h1 className="font-headline font-black text-xl tracking-tight text-on-surface">MoodBloom</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setActiveTab("settings")} 
                    className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-all active:scale-90"
                  >
                    <Settings size={20} />
                  </button>
                </div>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        <main id="main-content-scroll" className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-4 sm:py-8 overflow-y-auto no-scrollbar relative z-10 pb-[100px] md:pb-8 print:overflow-visible print:p-0 print:max-w-none">
          <div className="relative w-full h-full">
            {/* Beranda Tab */}
            <div className={activeTab === "home" ? "block" : "hidden"}>
              {visitedTabs.home && (
                <motion.div
                  animate={activeTab === "home" ? { opacity: 1 } : { opacity: 0 }}
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <Home isActive={activeTab === "home"} onNavigate={handleNavigate} onOpenChat={() => openQuickAction("ai")} />
                </motion.div>
              )}
            </div>

            {/* Health / Habit Tab */}
            <div className={activeTab === "health" ? "block" : "hidden"}>
              {visitedTabs.health && (
                <motion.div
                  animate={activeTab === "health" ? { opacity: 1 } : { opacity: 0 }}
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <Health 
                    isActive={activeTab === "health"}
                    activeTab={healthSubTab} 
                    onTabChange={setHealthSubTab}
                    onOpenChat={() => openQuickAction("ai")} 
                    onNavigate={handleNavigate}
                  />
                </motion.div>
              )}
            </div>

            {/* Productivity / Jadwal Tab */}
            <div className={activeTab === "productivity" ? "block" : "hidden"}>
              {visitedTabs.productivity && (
                <motion.div
                  animate={activeTab === "productivity" ? { opacity: 1 } : { opacity: 0 }}
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <Productivity 
                    isActive={activeTab === "productivity"}
                    activeTab={productivitySubTab} 
                    onTabChange={setProductivitySubTab} 
                  />
                </motion.div>
              )}
            </div>

            {/* Insight / Stats Tab */}
            <div className={activeTab === "insight" ? "block" : "hidden"}>
              {visitedTabs.insight && (
                <motion.div
                  animate={activeTab === "insight" ? { opacity: 1 } : { opacity: 0 }}
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <Stats isActive={activeTab === "insight"} onOpenChat={() => openQuickAction("ai")} onNavigate={handleNavigate} />
                </motion.div>
              )}
            </div>

            {/* Prayer Tab (Legacy/Direct navigation support) */}
            <div className={activeTab === "prayer" ? "block" : "hidden"}>
              {visitedTabs.prayer && (
                <motion.div
                  animate={activeTab === "prayer" ? { opacity: 1 } : { opacity: 0 }}
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <Prayer isActive={activeTab === "prayer"} />
                </motion.div>
              )}
            </div>

            {/* Settings Tab */}
            <div className={activeTab === "settings" ? "block" : "hidden"}>
              {visitedTabs.settings && (
                <motion.div
                  animate={activeTab === "settings" ? { opacity: 1 } : { opacity: 0 }}
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <SettingsPage isActive={activeTab === "settings"} />
                </motion.div>
              )}
            </div>

            {/* AI Assistant Full Tab */}
            <div className={activeTab === "ai" ? "block" : "hidden"}>
              {visitedTabs.ai && (
                <motion.div
                  animate={activeTab === "ai" ? { opacity: 1 } : { opacity: 0 }}
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <AIAssistantTab isActive={activeTab === "ai"} />
                </motion.div>
              )}
            </div>
          </div>
        </main>

        {/* MOBILE BOTTOM NAV - Docked Premium Bar */}
        <AnimatePresence>
          {!meditationActive && (
            <motion.div 
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-highest/95 backdrop-blur-2xl border-t border-outline/10 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] print:hidden"
            >
              <div className="relative w-full pb-[calc(env(safe-area-inset-bottom,16px)+8px)] pt-3 px-6">
                
                {/* POPUP MENUS (Absolutely positioned above the nav content) */}
                <div className="absolute left-0 right-0 bottom-full mb-1 flex justify-center px-4 pointer-events-none">
                  <div className="relative w-full max-w-md pointer-events-auto">
                    {/* HABIT POPUP MENU */}
                    <AnimatePresence>
                      {isHabitPopupOpen && activeTab === "health" && (
                        <HabitPopupMenu 
                          isMobile={true} 
                          activeSubTab={healthSubTab} 
                          onNavigate={handleNavigate} 
                          onClose={() => setIsHabitPopupOpen(false)} 
                        />
                      )}
                    </AnimatePresence>

                    {/* PRODUCTIVITY POPUP MENU */}
                    <AnimatePresence>
                      {isProductivityPopupOpen && activeTab === "productivity" && (
                        <ProductivityPopupMenu 
                          isMobile={true} 
                          activeSubTab={productivitySubTab} 
                          onNavigate={handleNavigate} 
                          onClose={() => setIsProductivityPopupOpen(false)} 
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <nav className="w-full max-w-md mx-auto flex items-center justify-between">
                  <div className="flex flex-1 justify-around items-center">
                    {navItems.slice(0, 2).map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => handleNavigate(item.id)} 
                        className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 group ${activeTab === item.id ? "text-primary" : "text-on-surface-variant opacity-70 hover:opacity-100"}`}
                      >
                        {activeTab === item.id && (
                          <motion.div layoutId="nav-pill" className="absolute inset-0 bg-primary/10 rounded-2xl" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                        )}
                        <item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} className="relative z-10" />
                        {item.id === "health" && activeTab === "health" && !isHabitPopupOpen && (
                           <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>

                  
                  {/* CENTRAL FAB - AI CHAT */}
                  <div className="px-2 relative -translate-y-5">
                    <button 
                      onClick={() => { openQuickAction("ai"); hapticFeedback("medium"); }} 
                      className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white shadow-2xl shadow-primary/50 active:scale-95 hover:scale-105 transition-all border-4 border-surface-container-highest"
                    >
                      <MessageCircle size={32} strokeWidth={2.5} />
                    </button>
                  </div>

                  <div className="flex flex-1 justify-around items-center">
                    {navItems.slice(2, 4).map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => handleNavigate(item.id)} 
                        className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 group ${activeTab === item.id ? "text-primary" : "text-on-surface-variant opacity-70 hover:opacity-100"}`}
                      >
                        {activeTab === item.id && (
                          <motion.div layoutId="nav-pill" className="absolute inset-0 bg-primary/10 rounded-2xl" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                        )}
                        <item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} className="relative z-10" />
                        {item.id === "productivity" && activeTab === "productivity" && !isProductivityPopupOpen && (
                           <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <QuickActionSheet isOpen={isQuickActionOpen} initialTab={quickActionInitialTab as any} onClose={() => setIsQuickActionOpen(false)} />
      <DeepFocusOverlay />
      <InstallPrompt />
    </div>
  );
}
