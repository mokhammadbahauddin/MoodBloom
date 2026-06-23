import { useState, useEffect } from "react";
import {
  MapPin,
  Bell,
  Clock,
  Compass,
  Settings2,
  RefreshCw,
  Search,
  X,
  Sparkles,
  BookOpen
} from "lucide-react";
import { useUserStore } from "../lib/userStore";
import { useHabitsStore } from "../lib/habitsStore";
import { useProductivityStore } from "../lib/productivityStore";;
import { useSettingsStore } from '../lib/settingsStore';
import { motion, AnimatePresence } from "motion/react";
import { hapticFeedback } from "../lib/haptics";

interface PrayerTime {
  name: string;
  time: string;
  ampm: string;
  isPast: boolean;
  isNext: boolean;
  isCurrent: boolean;
  rawTime: string;
}

const DAILY_AYAHS = [
  { arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ", text: "Maka ingatlah kepada-Ku, Aku pun akan ingat kepadamu.", ref: "Al-Baqarah 2:152" },
  { arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", text: "Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.", ref: "Al-Baqarah 2:286" },
  { arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", text: "Sesungguhnya beserta kesulitan itu ada kemudahan.", ref: "Al-Insyirah 94:6" },
  { arabic: "وَاصْبِرُوا إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", text: "Dan bersabarlah, sesungguhnya Allah beserta orang-orang yang sabar.", ref: "Al-Anfal 8:46" },
  { arabic: "ادْعُونِي أَسْتَجِبْ لَكُمْ", text: "Berdoalah kepada-Ku, niscaya akan Aku perkenankan bagimu.", ref: "Ghafir 40:60" },
];

export default function Prayer({ isActive = true }: { isActive?: boolean }) {
  const prayerAlarms = useHabitsStore(state => state.prayerAlarms);
  const togglePrayerAlarm = useHabitsStore(state => state.togglePrayerAlarm);
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const prayerLogs = useHabitsStore(state => state.prayerLogs);
  const logPrayer = useHabitsStore(state => state.logPrayer);
  const removePrayerLog = useHabitsStore(state => state.removePrayerLog);

  const [times, setTimes] = useState<PrayerTime[]>([]);
  const [locationName, setLocationName] = useState("Fetching location...");
  const [loading, setLoading] = useState(true);
  const [qibla, setQibla] = useState<number | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [hasCompassAccess, setHasCompassAccess] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [searchInput, setSearchInput] = useState(settings?.manualLocation || "");
  const [dailyAyah, setDailyAyah] = useState(DAILY_AYAHS[0]);

  useEffect(() => {
    if (!isActive) return;
    // Pick a pseudo-random Ayah based on the day of the year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setDailyAyah(DAILY_AYAHS[dayOfYear % DAILY_AYAHS.length]);
  }, [isActive]);

  const calculateQibla = (lat: number, lng: number) => {
    const lat1 = (lat * Math.PI) / 180;
    const lat2 = (21.422487 * Math.PI) / 180;
    const deltaLng = ((39.826206 - lng) * Math.PI) / 180;

    const y = Math.sin(deltaLng);
    const x =
      Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(deltaLng);

    let qiblaDir = (Math.atan2(y, x) * 180) / Math.PI;
    if (qiblaDir < 0) qiblaDir += 360;
    setQibla(Math.round(qiblaDir));
  };

  const fetchPrayerTimes = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const timestamp = Math.floor(Date.now() / 1000);
      // Method 2 = ISNA, Method 11 = Majlis Ugama Islam Singapura, Method 20 = Kemenag Indonesia
      const res = await fetch(
        `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lng}&method=20`,
      );
      const payload = await res.json();

      if (payload.data && payload.data.timings) {
        const timings = payload.data.timings;
        const keys = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeInMinutes = currentHours * 60 + currentMinutes;

        let nextFound = false;

        const newTimes = keys.map((key) => {
          const raw = timings[key];
          const [hStr, mStr] = raw.split(":");
          const h = parseInt(hStr, 10);
          const m = parseInt(mStr, 10);
          const timeInMinutes = h * 60 + m;

          let ampm = "AM";
          let displayH = h;
          if (h >= 12) {
            ampm = "PM";
            if (h > 12) displayH = h - 12;
          }
          if (displayH === 0) displayH = 12;

          let isPast = timeInMinutes < currentTimeInMinutes;
          let isNext = false;

          return {
            name: key === "Fajr" ? "Subuh" : key === "Dhuhr" ? "Dzuhur" : key === "Asr" ? "Ashar" : key === "Isha" ? "Isya" : key,
            time: `${displayH.toString().padStart(2, "0")}:${mStr}`,
            ampm,
            rawTime: raw,
            timeInMinutes,
            isPast,
            isNext: false,
            isCurrent: false,
          };
        });

        const upcomingIndex = newTimes.findIndex((t) => !t.isPast);
        if (upcomingIndex !== -1) {
          newTimes[upcomingIndex].isNext = true;
        } else {
          newTimes[0].isNext = true;
          newTimes.forEach((t) => (t.isPast = true));
        }

        setTimes(newTimes);
      }
    } catch (e) {
      console.error(e);
      setLocationName("Error fetching times");
    } finally {
      setLoading(false);
    }
  };

  const loadLocationData = () => {
    if (settings?.manualLat && settings?.manualLng && settings?.manualLocation) {
      setLocationName(settings.manualLocation);
      fetchPrayerTimes(settings.manualLat, settings.manualLng);
      calculateQibla(settings.manualLat, settings.manualLng);
    } else if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const geoRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`,
            );
            const geoData = await geoRes.json();
            setLocationName(
              `${geoData.city || geoData.locality || "Unknown"}, ${geoData.countryCode}`,
            );
          } catch (e) {
            setLocationName("Lokasi Ditemukan");
          }
          fetchPrayerTimes(latitude, longitude);
          calculateQibla(latitude, longitude);
        },
        (error) => {
          console.warn("Geolocation denied. Fallback to Jakarta.");
          setLocationName("Jakarta, Indonesia (Fallback GPS)");
          fetchPrayerTimes(-6.2088, 106.8456);
          calculateQibla(-6.2088, 106.8456);
        },
      );
    } else {
      setLocationName("Jakarta, Indonesia (Fallback GPS)");
      fetchPrayerTimes(-6.2088, 106.8456);
      calculateQibla(-6.2088, 106.8456);
    }
  };

  useEffect(() => {
    if (!isActive) return;
    loadLocationData();
  }, [isActive, settings?.manualLocation]);

  const handleManualSearch = async () => {
    if (!searchInput.trim()) {
      // Clear manual settings to fallback to GPS
      updateSettings({ manualLocation: undefined, manualLat: undefined, manualLng: undefined });
      setShowConfig(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const name = data[0].display_name.split(',').slice(0, 2).join(',');
        updateSettings({ manualLocation: name, manualLat: lat, manualLng: lng });
        setShowConfig(false);
      } else {
        alert("Lokasi tidak ditemukan. Coba kota yang lebih umum.");
      }
    } catch (e) {
      console.error(e);
      alert("Gagal mencari lokasi.");
    } finally {
      setLoading(false);
    }
  };

  const requestCompassPermission = async () => {
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const permissionState = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        if (permissionState === "granted") {
          setHasCompassAccess(true);
          window.addEventListener("deviceorientation", handleOrientation, true);
        } else {
          alert("Izin kompas ditolak oleh browser.");
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      // Non iOS 13+ devices
      setHasCompassAccess(true);
      window.addEventListener(
        "deviceorientationabsolute",
        handleOrientation as any,
        true,
      );
    }
  };

  const handleOrientation = (event: DeviceOrientationEvent) => {
    let alpha = event.alpha;

    if ((event as any).webkitCompassHeading) {
      // Apple
      alpha = (event as any).webkitCompassHeading;
    } else if (alpha !== null) {
      // Android
      alpha = 360 - alpha;
    }

    if (alpha !== null) {
      setHeading(Math.round(alpha));
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation as any,
        true,
      );
    };
  }, []);

  const isFacingQibla = qibla !== null && (Math.abs((heading - qibla + 360) % 360) < 5 || Math.abs((heading - qibla + 360) % 360) > 355);

  useEffect(() => {
    if (!isActive) return;
    if (isFacingQibla && "vibrate" in navigator) {
      navigator.vibrate(50);
    }
  }, [isActive, isFacingQibla]);

  const isNonisMode = settings.religion === "other";

  if (!isActive) {
    return <div className="min-h-[400px]" />;
  }

  const toggleNonisMode = () => {
    updateSettings({ religion: isNonisMode ? "islam" : "other" });
    hapticFeedback("medium");
  };

  if (isNonisMode) {
    return (
      <div className="space-y-12 pt-4 pb-12 relative flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 shadow-inner"
        >
          <Sparkles size={48} />
        </motion.div>
        <h2 className="font-headline text-4xl font-black text-on-surface tracking-tight mb-4">
          Zen Oasis Mode
        </h2>
        <p className="text-on-surface-variant font-medium max-w-md mb-10 leading-relaxed">
          Mode Nonis aktif. Fitur pengingat ibadah dinonaktifkan agar Anda bisa fokus sepenuhnya pada kesehatan mental dan produktivitas umum.
        </p>
        <button 
          onClick={toggleNonisMode}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          Nonaktifkan Mode Nonis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-12 pt-2 md:pt-4 pb-12 relative">
      <AnimatePresence>
        {showConfig && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-panel w-full max-w-md p-6 border-white/20 shadow-2xl relative"
            >
              <button onClick={() => setShowConfig(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface">
                <X size={20} />
              </button>
              <h3 className="font-headline font-bold text-xl mb-2 text-on-surface flex items-center gap-2">
                <MapPin className="text-primary" /> Atur Lokasi Manual
              </h3>
              <p className="text-xs text-on-surface-variant mb-6">
                Waktu sholat dan arah kiblat akan menyesuaikan dengan lokasi ini. Kosongkan lalu klik cari untuk kembali menggunakan GPS otomatis.
              </p>
              
              <div className="relative mb-4">
                <input 
                  type="text" 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                  placeholder="Masukkan nama kota (misal: Bandung)" 
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
                <Search size={16} className="absolute left-3.5 top-3.5 text-on-surface-variant" />
              </div>
              
              <button 
                onClick={handleManualSearch}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-md shadow-primary/30 hover:bg-primary/90 transition-colors"
              >
                Cari & Terapkan Lokasi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 border-b border-outline-variant/30 pb-4 md:pb-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="font-headline text-3xl md:text-5xl font-extrabold text-on-surface tracking-tight">
              Ibadah
            </h2>
            <button 
              onClick={toggleNonisMode}
              className="text-xs font-black uppercase tracking-widest bg-surface-container px-3 py-1.5 rounded-full text-on-surface-variant hover:text-primary transition-colors border border-outline/10"
            >
              Mode Nonis
            </button>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant font-medium bg-surface-container w-fit px-3 py-1.5 rounded-lg border border-outline-variant/20">
            <MapPin size={16} className="text-primary" />
            <span className="truncate max-w-[200px]">{locationName}</span>
          </div>
        </div>
        <button 
          onClick={() => setShowConfig(true)}
          className="flex items-center gap-2 text-primary font-bold bg-primary/10 px-4 py-2 rounded-full hover:bg-primary hover:text-white transition-colors shadow-sm border border-primary/20"
        >
          <Settings2 size={18} /> Ganti Lokasi
        </button>
      </section>

      <div className="flex flex-col gap-6">
        {/* Main Tracker */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-on-surface-variant bg-surface-container-low rounded-2xl">
              <RefreshCw className="animate-spin mb-3 text-primary" size={32} />
              <span className="font-bold tracking-widest uppercase text-xs">Menghitung Waktu Akurat...</span>
            </div>
          ) : (
            times.map((pt) => (
              <div
                key={pt.name}
                className={`glass-panel flex items-center p-4 !rounded-2xl transition-all duration-300 relative overflow-hidden ${
                  pt.isNext
                    ? "bg-white/80 !border-l-4 !border-l-primary scale-[1.02] shadow-xl shadow-primary/10"
                    : pt.isPast
                      ? "opacity-50 grayscale-[30%] bg-transparent !border-outline-variant/30"
                      : "bg-surface-container-low hover:bg-surface-container"
                }`}
              >
                <div className="flex-1 relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${pt.isNext ? 'border-primary/30 bg-primary/10' : 'border-outline-variant bg-surface-container'}`}>
                      <span className={`font-headline text-lg font-black tracking-tighter ${pt.isNext ? 'text-primary' : 'text-on-surface'}`}>
                        {pt.time}
                      </span>
                    </div>
                    <div>
                      <h3
                        className={`font-headline text-xl font-bold ${pt.isNext ? "text-primary" : "text-on-surface"}`}
                      >
                        {pt.name}
                      </h3>
                      {pt.isNext && (
                        <p className="font-body text-xs font-bold text-primary uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                          <Clock size={12} /> Waktu Sholat Berikutnya
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        const isDone = (prayerLogs[today] || []).includes(pt.name);
                        if (isDone) {
                          removePrayerLog(today, pt.name);
                        } else {
                          logPrayer(today, pt.name);
                          new Audio("/sounds/success.mp3").play().catch(() => {});
                        }
                        hapticFeedback("medium");
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        (prayerLogs[new Date().toISOString().split('T')[0]] || []).includes(pt.name)
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                          : "bg-surface-container-highest text-on-surface-variant hover:bg-primary/20 hover:text-primary"
                      }`}
                    >
                      {(prayerLogs[new Date().toISOString().split('T')[0]] || []).includes(pt.name) ? "Selesai" : "Check"}
                    </button>

                    <button
                      onClick={() => {
                        hapticFeedback("light");
                        !pt.isPast && togglePrayerAlarm(pt.name);
                      }}
                      className={`p-3.5 rounded-full transition-colors ${
                        prayerAlarms.includes(pt.name) 
                        ? "bg-primary text-white shadow-lg shadow-primary/30" 
                        : pt.isPast ? "cursor-not-allowed text-on-surface-variant/30" : "text-on-surface-variant hover:text-primary hover:bg-primary/10"
                      }`}
                    >
                      {prayerAlarms.includes(pt.name) ? (
                        <Bell
                          size={20}
                          className="fill-current"
                        />
                      ) : (
                        <Bell
                          size={20}
                          className={pt.isPast ? "opacity-30" : ""}
                        />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Qibla & Insights */}
        <div className="flex flex-col gap-4">
          <div className="glass-panel p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[340px] border border-outline/10">
            <h3 className="font-headline font-bold text-lg mb-2 text-on-surface flex items-center gap-2">
              <Compass size={20} className="text-primary" /> Arah Kiblat Real-Time
            </h3>
            <p className="text-xs text-on-surface-variant text-center max-w-sm mb-6">
              Akurasi kompas dipengaruhi oleh sensor HP. Jauhkan perangkat dari magnet atau logam besar untuk hasil terbaik.
            </p>

            <div
              className={`relative w-52 h-52 rounded-full border-4 flex flex-col items-center justify-center bg-surface-container-low shadow-inner transition-transform duration-300 ${isFacingQibla ? 'border-emerald-500 shadow-emerald-500/20' : 'border-outline/20'}`}
              style={{ transform: `rotate(${-heading}deg)` }}
            >
              {/* Main Compass Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-outline-variant/30 m-3"></div>

              {/* Compass markings */}
              <div className="absolute top-1 font-bold text-xs text-on-surface-variant">U</div>
              <div className="absolute bottom-1 font-bold text-xs text-on-surface-variant">S</div>
              <div className="absolute right-2 font-bold text-xs text-on-surface-variant">T</div>
              <div className="absolute left-2 font-bold text-xs text-on-surface-variant">B</div>

              {/* Qibla Indicator */}
              {qibla !== null && (
                <div
                  className="absolute w-full h-full flex flex-col items-center z-20 transition-all duration-300"
                  style={{ transform: `rotate(${qibla}deg)` }}
                >
                  <div className={`w-0 h-0 border-l-[16px] border-r-[16px] border-b-[70px] border-l-transparent border-r-transparent ${isFacingQibla ? 'border-b-emerald-500' : 'border-b-primary'} shadow-lg mt-0 transition-colors duration-300`}></div>
                  <div className={`w-4 h-4 ${isFacingQibla ? 'bg-emerald-500' : 'bg-primary'} rounded-full absolute top-[70px] shadow-sm -mt-2 transition-colors duration-300`}></div>
                  <div className={`absolute top-2 w-8 h-8 border-2 ${isFacingQibla ? 'border-emerald-500 bg-emerald-500/20' : 'border-primary bg-primary/20'} rounded-full flex items-center justify-center transition-colors duration-300`}>
                    <div className={`w-2.5 h-2.5 ${isFacingQibla ? 'bg-emerald-500' : 'bg-primary'} rounded-full animate-ping transition-colors duration-300`}></div>
                  </div>
                </div>
              )}

              {/* Dev Heading Indicator (Device top) */}
              <div
                className="absolute w-full h-full flex flex-col items-center z-10"
                style={{ transform: `rotate(${heading}deg)` }}
              >
                <div className="absolute top-0 w-1.5 h-4 bg-error rounded-full shadow-[0_0_10px_rgba(244,63,94,0.8)]"></div>
              </div>

              {/* Center Dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-surface-container rounded-full shadow-md z-30 border-4 border-on-surface"></div>
            </div>

            <div className="mt-8 flex flex-col items-center h-16">
              {qibla !== null ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <p className={`font-headline text-3xl font-black tracking-tight transition-colors duration-300 ${isFacingQibla ? 'text-emerald-500' : 'text-primary'}`}>
                      {heading}°
                    </p>
                    <span className="text-xs font-black text-on-surface-variant/40">/ {qibla}°</span>
                  </div>
                  <p className={`font-body text-xs font-bold mt-1 tracking-widest uppercase transition-colors duration-300 ${isFacingQibla ? 'text-emerald-500' : 'text-on-surface-variant'}`}>
                    {isFacingQibla ? 'Posisi Tepat Menghadap Kiblat' : 'Arah Kiblat dari Lokasimu'}
                  </p>
                </>
              ) : (
                <p className="font-body text-sm font-bold text-on-surface-variant animate-pulse mt-4">
                  Menghitung koordinat...
                </p>
              )}
            </div>

            {!hasCompassAccess && (
              <div className="mt-4 flex flex-col items-center">
                <button
                  onClick={requestCompassPermission}
                  className="font-bold text-xs bg-primary text-white px-6 py-3 rounded-full shadow-lg shadow-primary/30 hover:scale-105 transition-all animate-pulse"
                >
                  Aktifkan Sensor Kompas
                </button>
                <p className="text-xs text-on-surface-variant mt-2 max-w-[250px] text-center">
                  Browser mewajibkan izin manual untuk membaca sensor gerak agar kompas bisa berputar.
                </p>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 relative overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/5 border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-headline font-bold text-xs tracking-widest uppercase text-primary flex items-center gap-2">
                <Sparkles size={14} /> Insight Quran Harian
              </h3>
            </div>
            <div className="mb-4">
              <p className="text-2xl font-serif text-right text-primary leading-relaxed opacity-80" dir="rtl">
                {dailyAyah.arabic}
              </p>
            </div>
            <p className="font-body text-base font-medium leading-relaxed text-on-surface mb-4 relative z-10">
              "{dailyAyah.text}"
            </p>
            <div className="inline-block px-3 py-1 rounded-md bg-white/40 border border-primary/10 relative z-10">
              <p className="font-bold text-xs tracking-widest uppercase text-primary/80">
                {dailyAyah.ref}
              </p>
            </div>
            <div className="absolute -right-10 -bottom-10 p-4 opacity-5 blur-[2px]">
              <Compass size={200} className="text-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
