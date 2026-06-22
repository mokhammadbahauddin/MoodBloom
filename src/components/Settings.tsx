import React, { useState, useEffect } from "react";
import { useUserStore } from "../lib/userStore";
import { useProductivityStore } from "../lib/productivityStore";
import { useHabitsStore } from "../lib/habitsStore";
import { useSettingsStore } from '../lib/settingsStore';
import {
  Coffee,
  Droplet,
  Clock,
  Moon,
  Palette,
  User,
  ShieldAlert,
  Download,
  Trash2,
  Bell,
  Activity,
  Zap
} from "lucide-react";
import { auth } from "../lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import { hapticFeedback } from "../lib/haptics";

type Tab = "profile" | "productivity" | "health" | "appearance" | "data";

const Switch = ({ checked, onChange }: { checked: boolean, onChange: (c: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => { hapticFeedback("light"); onChange(!checked); }}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${checked ? "bg-primary" : "bg-slate-200"}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
  </button>
);

const Slider = ({ value, min, max, step, onChange, label, suffix }: any) => (
  <div className="space-y-3">
    <div className="flex justify-between items-end">
      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
      <span className="text-sm font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">{value} {suffix}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-primary h-2 bg-on-surface/10 rounded-lg appearance-none cursor-pointer"
    />
  </div>
);

export default function Settings() {
  const { settings, updateSettings } = useSettingsStore();
  const setWaterGoal = useHabitsStore(state => state.setWaterGoal);
  const userName = useUserStore(state => state.userName);
  const { resetStore } = useProductivityStore();
  const stepGoal = useHabitsStore(state => state.stepGoal);
  const setStepGoal = useHabitsStore(state => state.setStepGoal);

  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Local state for text fields to enable smooth typing experience
  const [localName, setLocalName] = useState(userName || "");
  const [localBio, setLocalBio] = useState(settings?.userBio || "");

  // Update local inputs when store is updated from cloud/background
  useEffect(() => {
    setLocalName(userName || "");
  }, [userName]);

  useEffect(() => {
    setLocalBio(settings?.userBio || "");
  }, [settings?.userBio]);

  const handleExportData = () => {
    const data = localStorage.getItem("moodbloom-storage");
    if (data) {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `moodbloom-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    }
  };

  const handleEraseData = () => {
    if (window.confirm("PERINGATAN: Ini akan menghapus seluruh data wellness Anda secara permanen. Anda yakin?")) {
      if (window.confirm("Apakah Anda benar-benar yakin? Tindakan ini tidak dapat dibatalkan.")) {
        resetStore();
        useUserStore.getState().setAll({ achievements: [], xp: 0, level: 1 });
        useHabitsStore.getState().setAll({ waterLogs: {}, detailedWaterLogs: {}, moodLogs: {}, meditationLogs: {}, prayerLogs: {} });
        window.location.reload();
      }
    }
  };

  const tabs = [
    { id: "profile", label: "Profil", icon: User },
    { id: "productivity", label: "Fokus", icon: Clock },
    { id: "health", label: "Kesehatan", icon: Activity },
    { id: "appearance", label: "Tampilan", icon: Palette },
    { id: "data", label: "Data", icon: ShieldAlert },
  ];

  const notificationPreferences = settings?.notificationPreferences || { focus: true, water: true, mood: true };

  return (
    <div className="pt-4 pb-24 animate-in fade-in duration-300 max-w-lg mx-auto relative h-full flex flex-col">
      <section className="space-y-2 mb-8 px-4">
        <h1 className="font-headline text-4xl font-black text-on-surface tracking-tight">
          Pengaturan
        </h1>
        <p className="text-on-surface-variant font-medium text-sm">
          Personalisasi pengalaman Oasis Anda.
        </p>
      </section>

      {/* Navigation Pills */}
      <div className="flex overflow-x-auto hide-scrollbar px-4 pb-4 gap-2 mb-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { hapticFeedback("light"); setActiveTab(tab.id as Tab); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${isActive ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant"}`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            
            {activeTab === "profile" && (
              <div className="glass-panel p-6 border border-outline/20 space-y-6">
                <div className="flex items-center gap-6 pb-2 border-b border-outline/5">
                  <div className="relative">
                    <div className="w-20 h-20 bg-surface-variant rounded-full flex items-center justify-center text-4xl shadow-inner border border-outline/10 overflow-hidden">
                      {(settings?.userAvatar === "👤" || !settings?.userAvatar) && auth.currentUser?.photoURL ? (
                        <img src={auth.currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        settings?.userAvatar || "👤"
                      )}
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-surface cursor-pointer hover:scale-110 transition-transform">
                      <span className="text-sm">✎</span>
                      <select 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        value={settings?.userAvatar || "👤"}
                        onChange={(e) => {
                          hapticFeedback("light");
                          updateSettings({ userAvatar: e.target.value });
                        }}
                      >
                        <option value="👤">👤</option>
                        <option value="🎓">🎓</option>
                        <option value="🧘">🧘</option>
                        <option value="🚀">🚀</option>
                        <option value="💻">💻</option>
                      </select>
                    </button>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Nama Panggilan</label>
                    <input
                      type="text"
                      value={localName}
                      onChange={(e) => {
                        setLocalName(e.target.value);
                        useUserStore.getState().setUserName(e.target.value);
                      }}
                      className="w-full bg-surface-container-low border border-outline/20 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Bio / Deskripsi</label>
                    <textarea
                      value={localBio}
                      onChange={(e) => {
                        setLocalBio(e.target.value);
                        updateSettings({ userBio: e.target.value });
                      }}
                      rows={2}
                      className="w-full bg-surface-container-low border border-outline/20 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface font-semibold resize-none"
                      placeholder="Tulis bio singkat Anda..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Alamat Email</label>
                    <input
                      type="text"
                      disabled
                      value={auth.currentUser?.email || ""}
                      className="w-full bg-surface-variant/50 border border-outline/20 rounded-2xl px-5 py-3.5 text-sm text-on-surface-variant cursor-not-allowed"
                    />
                  </div>
                  <button 
                    onClick={async () => {
                      if (auth.currentUser?.email) {
                        try {
                          await sendPasswordResetEmail(auth, auth.currentUser.email);
                          toast.success("Email reset password telah dikirim ke " + auth.currentUser.email);
                        } catch (error: any) {
                          toast.error("Gagal mengirim email reset: " + error.message);
                        }
                      }
                    }}
                    className="w-full bg-surface-container-high border border-outline/10 hover:bg-surface-variant text-on-surface font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl transition-colors active:scale-95 text-center cursor-pointer"
                  >
                    Atur / Ubah Password
                  </button>
                </div>

                <div className="pt-4 border-t border-outline/10">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-on-surface flex items-center gap-2"><Bell size={16} className="text-primary"/> Preferensi Notifikasi</label>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-surface-container-low border border-outline/10 p-4 rounded-2xl">
                      <span className="text-sm font-medium text-on-surface-variant">Pengingat Fokus Harian</span>
                      <Switch checked={notificationPreferences.focus} onChange={(c) => updateSettings({ notificationPreferences: { ...notificationPreferences, focus: c } })} />
                    </div>
                    <div className="flex justify-between items-center bg-surface-container-low border border-outline/10 p-4 rounded-2xl">
                      <span className="text-sm font-medium text-on-surface-variant">Pengingat Minum (Hydration)</span>
                      <Switch checked={notificationPreferences.water} onChange={(c) => updateSettings({ notificationPreferences: { ...notificationPreferences, water: c } })} />
                    </div>
                    <div className="flex justify-between items-center bg-surface-container-low border border-outline/10 p-4 rounded-2xl">
                      <span className="text-sm font-medium text-on-surface-variant">Pengingat Jurnal Mood</span>
                      <Switch checked={notificationPreferences.mood} onChange={(c) => updateSettings({ notificationPreferences: { ...notificationPreferences, mood: c } })} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "productivity" && (
              <div className="space-y-4">
                <div className="glass-panel p-6 border border-outline/20 space-y-6">
                  <h2 className="font-headline font-bold text-lg flex items-center gap-2 text-on-surface">
                    <Clock size={20} className="text-primary" /> Target & Sesi
                  </h2>
                  <Slider 
                    label="Target Fokus Harian" 
                    value={settings?.focusTarget ?? 120} 
                    min={30} max={600} step={30} suffix="menit"
                    onChange={(val: number) => updateSettings({ focusTarget: val })}
                  />
                  <Slider 
                    label="Durasi Sesi Pomodoro" 
                    value={settings?.focusDuration ?? 25} 
                    min={15} max={120} step={5} suffix="menit"
                    onChange={(val: number) => updateSettings({ focusDuration: val })}
                  />
                </div>
                
                <div className="glass-panel p-6 border border-outline/20 space-y-6">
                  <h2 className="font-headline font-bold text-lg flex items-center gap-2 text-on-surface">
                    <Coffee size={20} className="text-orange-500" /> Waktu Istirahat
                  </h2>
                  <Slider 
                    label="Istirahat Pendek" 
                    value={settings?.shortBreakDuration ?? 5} 
                    min={1} max={30} step={1} suffix="menit"
                    onChange={(val: number) => updateSettings({ shortBreakDuration: val })}
                  />
                  <Slider 
                    label="Istirahat Panjang" 
                    value={settings?.longBreakDuration ?? 15} 
                    min={5} max={60} step={5} suffix="menit"
                    onChange={(val: number) => updateSettings({ longBreakDuration: val })}
                  />
                </div>
              </div>
            )}

            {activeTab === "health" && (
              <div className="space-y-4">
                <div className="glass-panel p-6 border border-outline/20 space-y-6">
                  <h2 className="font-headline font-bold text-lg flex items-center gap-2 text-on-surface">
                    <Droplet size={20} className="text-blue-500" /> Hidrasi & Aktivitas
                  </h2>
                  <Slider 
                    label="Target Air Harian" 
                    value={settings?.waterGoalML ?? 3000} 
                    min={500} max={5000} step={100} suffix="ml"
                    onChange={(val: number) => {
                      updateSettings({ waterGoalML: val });
                      setWaterGoal(val / 1000);
                    }}
                  />
                  <Slider 
                    label="Target Langkah Harian" 
                    value={stepGoal ?? 1000} 
                    min={1000} max={30000} step={500} suffix="langkah"
                    onChange={(val: number) => setStepGoal(val)}
                  />
                </div>
              </div>
            )}

             {activeTab === "appearance" && (
              <div className="glass-panel p-8 border border-outline/20 space-y-10">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-primary/20">
                    <Palette size={40} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="font-headline font-black text-2xl text-on-surface tracking-tight">Adaptive Aura</h2>
                    <p className="text-sm text-on-surface-variant font-medium mt-2 leading-relaxed">
                      Warna aksen aplikasi Anda kini hidup. Oasis menyesuaikan energinya secara otomatis berdasarkan jurnal mood terakhir Anda.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider opacity-60 mb-2">Panduan Aura Mood</label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { mood: "Sangat Baik", color: "bg-orange-500", accent: "Orange", desc: "Energi, Semangat & Vitalitas", icon: "✨" },
                      { mood: "Baik", color: "bg-emerald-500", accent: "Green", desc: "Ketenangan, Pertumbuhan & Harmoni", icon: "🌱" },
                      { mood: "Biasa", color: "bg-indigo-500", accent: "Blue", desc: "Kestabilan, Fokus & Keseimbangan", icon: "⚓" },
                      { mood: "Buruk", color: "bg-purple-500", accent: "Purple", desc: "Refleksi, Kedalaman & Pemulihan", icon: "🕯️" },
                    ].map((item) => (
                      <div key={item.accent} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-highest/50 border border-outline/5 hover:bg-surface-container transition-colors group">
                        <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-white text-xl shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline">
                            <h4 className="font-headline font-black text-sm text-on-surface">{item.mood}</h4>
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{item.accent}</span>
                          </div>
                          <p className="text-[11px] font-bold text-on-surface-variant opacity-70">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Zap size={16} fill="currentColor" />
                  </div>
                  <p className="text-xs font-bold text-on-surface-variant leading-relaxed">
                    Warna akan berubah seketika setelah Anda menyimpan jurnal mood baru di tab Wellness.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "data" && (
              <div className="space-y-4">
                <div className="glass-panel p-6 border border-outline/20 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                    <Download size={32} />
                  </div>
                  <div>
                    <h2 className="font-headline font-bold text-lg text-on-surface">Ekspor Data Wellness</h2>
                    <p className="text-xs text-on-surface-variant mt-1">Unduh seluruh riwayat mood, fokus, air, dan tugas Anda dalam format JSON untuk keperluan backup.</p>
                  </div>
                  <button onClick={handleExportData} className="w-full py-3 bg-surface-container-highest border border-outline/20 rounded-xl font-bold text-sm text-on-surface hover:bg-surface-variant transition-colors flex justify-center items-center gap-2">
                    <Download size={16}/> Unduh Backup
                  </button>
                </div>

                <div className="glass-panel p-6 border border-error/20 bg-error/5 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center">
                    <Trash2 size={32} />
                  </div>
                  <div>
                    <h2 className="font-headline font-bold text-lg text-error">Hapus Semua Data</h2>
                    <p className="text-xs text-error/80 mt-1">Tindakan ini akan mengembalikan aplikasi ke kondisi awal (Factory Reset). Data tidak dapat dikembalikan.</p>
                  </div>
                  <button onClick={handleEraseData} className="w-full py-3 bg-error text-white rounded-xl font-bold text-sm shadow-lg shadow-error/20 hover:bg-error/90 transition-colors flex justify-center items-center gap-2">
                    <Trash2 size={16}/> Hapus Permanen
                  </button>
                </div>

                <div className="mt-8 text-center pt-8 border-t border-outline/10">
                  <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-4">
                    Akun Tertaut: <br/><span className="text-on-surface normal-case tracking-normal">{auth.currentUser?.email || "Guest User"}</span>
                  </p>
                  <button
                    onClick={() => {
                      if (window.confirm("Yakin ingin keluar dari akun?")) auth.signOut();
                    }}
                    className="text-error font-bold hover:bg-error/10 px-6 py-2 rounded-xl transition-colors active:scale-95 text-xs uppercase tracking-widest"
                  >
                    Logout dari Aplikasi
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
