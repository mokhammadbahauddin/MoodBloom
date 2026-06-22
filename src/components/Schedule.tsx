import React, { useState, useMemo, useEffect } from "react";
import {
  BookOpen,
  MapPin,
  Clock,
  Plus,
  X,
  Trash2,
  CalendarDays,
  Target,
  CheckSquare,
  Flag,
  Zap,
  Activity,
  Sparkles,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { useUserStore } from "../lib/userStore";
import { useProductivityStore, ClassSchedule, Task } from "../lib/productivityStore";
import ScheduleTasks from "./ScheduleTasks";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

// Hash function to assign consistent soft outline colors to classes
const getColorClass = (str: string) => {
  const colors = [
    "bg-indigo-50/50 border border-indigo-200 text-indigo-700",
    "bg-emerald-50/50 border border-emerald-200 text-emerald-700",
    "bg-amber-50/50 border border-amber-200 text-amber-700",
    "bg-rose-50/50 border border-rose-200 text-rose-700",
    "bg-sky-50/50 border border-sky-200 text-sky-700",
    "bg-fuchsia-50/50 border border-fuchsia-200 text-fuchsia-700",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function Schedule({
  onStartFocus,
}: {
  onStartFocus?: () => void;
}) {
  const schedules = useProductivityStore(state => state.schedules);
  const setSchedules = useProductivityStore(state => state.setSchedules);
  const setActiveFocusTask = useProductivityStore(state => state.setActiveFocusTask);
  const tasks = useProductivityStore(state => state.tasks);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [newClass, setNewClass] = useState<Partial<ClassSchedule>>({
    day: 1,
  });
  const [currentTimePos, setCurrentTimePos] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // On mount, choose list for mobile, grid for desktop
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setViewMode("grid");
    }
  }, []);

  // Time Axis Calculation
  const { min: minHour, max: maxHour, hours } = useMemo(() => {
    let min = 24;
    let max = 0;
    let hasData = false;

    schedules.forEach((s) => {
      hasData = true;
      const start = parseInt(s.startTime.split(":")[0]);
      const end = parseInt(s.endTime.split(":")[0]) + (parseInt(s.endTime.split(":")[1]) > 0 ? 1 : 0);
      if (start < min) min = start;
      if (end > max) max = end;
    });

    tasks.forEach((t) => {
      if (t.time && !t.completed) {
        const d = new Date(t.time);
        if (!isNaN(d.getTime())) {
          hasData = true;
          const h = d.getHours();
          if (h < min) min = h;
          if (h + 1 > max) max = h + 1;
        }
      }
    });

    if (!hasData) return { min: 8, max: 16, hours: Array.from({ length: 9 }, (_, i) => i + 8) };
    
    min = Math.max(0, min - 1);
    max = Math.min(24, max + 1);
    if (max - min < 8) max = min + 8;

    return {
      min,
      max,
      hours: Array.from({ length: max - min + 1 }, (_, i) => i + min),
    };
  }, [schedules, tasks]);

  // Current Time Position
  useEffect(() => {
    const updatePos = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const pos = (h - minHour) * 100 + (m / 60) * 100;
      setCurrentTimePos(pos);
    };
    updatePos();
    const interval = setInterval(updatePos, 60000);
    return () => clearInterval(interval);
  }, [minHour]);

  // Handlers
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.className || !newClass.startTime || !newClass.endTime) return;

    if (editingClassId) {
      setSchedules(schedules.map(s => s.id === editingClassId ? { ...s, ...newClass } as ClassSchedule : s));
    } else {
      const added: ClassSchedule = {
        id: crypto.randomUUID(),
        className: newClass.className,
        room: newClass.room || "TBD",
        day: newClass.day || 1,
        startTime: newClass.startTime,
        endTime: newClass.endTime,
      };
      setSchedules([...schedules, added].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    }
    setShowAddModal(false);
    setEditingClassId(null);
    setNewClass({ day: 1 });
  };

  const openEditClass = (sch: ClassSchedule) => {
    setNewClass(sch);
    setEditingClassId(sch.id);
    setShowAddModal(true);
  };

  const deleteClass = (id: string) => {
    setSchedules(schedules.filter((s) => s.id !== id));
  };

  // Constants
  const daysFiltered = [1, 2, 3, 4, 5, 6, 0];
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const dayNamesShort = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  
  const completedToday = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const taskProgress = totalTasks > 0 ? (completedToday / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6 pt-4 pb-32 md:pb-12">
      {/* Header Section */}
      <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-6 px-2">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-outline/10">
                <CalendarDays size={20} />
             </div>
             <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">
               Jadwal
             </h2>
          </div>
          <p className="font-body text-sm text-on-surface-variant max-w-lg opacity-70">
            Optimalisasi rutinitas akademik dengan sinkronisasi AI antara kelas dan beban tugas.
          </p>
        </div>

        <div className="flex items-center justify-between lg:justify-start gap-4 w-full lg:w-auto">
          {/* Daily Progress Ring */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-surface-container-low border border-outline/10">
             <div className="relative w-10 h-10">
                <svg className="w-full h-full -rotate-90">
                   <circle cx="20" cy="20" r="16" className="stroke-outline/10 fill-none" strokeWidth="4" />
                   <motion.circle 
                      cx="20" cy="20" r="16" className="stroke-primary fill-none" 
                      strokeWidth="4" strokeDasharray="100" 
                      initial={{ strokeDashoffset: 100 }}
                      animate={{ strokeDashoffset: 100 - taskProgress }}
                   />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black">{Math.round(taskProgress)}%</div>
             </div>
             <div className="flex flex-col leading-none">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Jadwal</span>
                <span className="text-xs font-bold">{completedToday}/{totalTasks} Selesai</span>
             </div>
          </div>

          {/* View Toggles */}
          <div className="bg-surface-container-low p-1 rounded-2xl border border-outline/10 flex gap-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="text-[10px] font-black tracking-widest uppercase py-1 px-3"
            >
              Daftar
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="text-[10px] font-black tracking-widest uppercase py-1 px-3"
            >
              Kalender
            </Button>
          </div>

          <button
            onClick={() => {
              setEditingClassId(null);
              setNewClass({ day: 1 });
              setShowAddModal(true);
            }}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-primary text-white font-semibold text-xs px-5 py-3 rounded-2xl hover:bg-primary-dim transition-all active:scale-95 border border-primary/20 cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} /> Tambah Kelas
          </button>
        </div>
      </section>

      {/* Add Class Modal overlay */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-surface-dim/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-surface border border-outline/20 rounded-2xl p-6 md:p-8 shadow-xl overflow-y-auto max-h-[80vh] md:max-h-[90vh] no-scrollbar mt-16 md:mt-0"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface bg-surface-container p-2 rounded-2xl transition-colors border border-outline/10 cursor-pointer"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-outline/10">
                    <BookOpen size={24} />
                 </div>
                 <div>
                    <h3 className="font-headline text-xl font-bold text-on-surface">{editingClassId ? "Edit Kelas" : "Mata Kuliah Baru"}</h3>
                    <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Formulir Jadwal</p>
                 </div>
              </div>

              <form onSubmit={handleAddClass} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Nama Mata Kuliah</label>
                  <input
                    type="text"
                    required
                    value={newClass.className || ""}
                    onChange={(e) => setNewClass({ ...newClass, className: e.target.value })}
                    className="w-full bg-surface-container border border-outline/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface"
                    placeholder="Mis: Algoritma & Struktur Data"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Ruangan / Link Meet</label>
                  <input
                    type="text"
                    value={newClass.room || ""}
                    onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                    className="w-full bg-surface-container border border-outline/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface"
                    placeholder="Mis: Lab Komputer A"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Hari</label>
                    <select
                      value={newClass.day}
                      onChange={(e) => setNewClass({ ...newClass, day: parseInt(e.target.value) })}
                      className="w-full bg-surface-container border border-outline/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface appearance-none"
                    >
                      {dayNames.map((day, idx) => (
                        <option key={idx} value={idx}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Jam Mulai</label>
                    <input
                      type="time"
                      required
                      value={newClass.startTime || ""}
                      onChange={(e) => setNewClass({ ...newClass, startTime: e.target.value })}
                      className="w-full bg-surface-container border border-outline/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Jam Selesai</label>
                    <input
                      type="time"
                      required
                      value={newClass.endTime || ""}
                      onChange={(e) => setNewClass({ ...newClass, endTime: e.target.value })}
                      className="w-full bg-surface-container border border-outline/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface"
                    />
                  </div>
                </div>

                <div className="pt-4 pb-8 border-t border-outline/10">
                  <button
                    type="submit"
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-sm hover:bg-primary-dim transition-colors shadow-lg shadow-primary/20 cursor-pointer"
                  >
                    {editingClassId ? "Simpan Perubahan" : "Simpan ke Kalender"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Calendar View Section */}
      <div className="bg-surface border border-outline/10 rounded-2xl shadow-sm overflow-hidden flex flex-col relative min-h-[500px]">
        {schedules.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-surface-container-lowest">
            <CalendarDays size={80} strokeWidth={1} className="text-outline-variant mb-6" />
            <h3 className="font-headline font-extrabold text-2xl text-on-surface mb-3">
              Jadwal Kosong
            </h3>
            <p className="font-body text-base text-on-surface-variant text-center max-w-md">
              Mulai susun rutinitas akademikmu dengan menambahkan mata kuliah pertama ke dalam kalender ini.
            </p>
            <button
               onClick={() => setShowAddModal(true)}
               className="mt-8 bg-primary/10 text-primary px-6 py-3 rounded-full font-bold text-sm hover:bg-primary/20 transition-colors cursor-pointer"
            >
              Tambah Kelas Sekarang
            </button>
          </div>
        ) : viewMode === "list" ? (
          /* Responsive List View */
          <div className="p-6 space-y-6">
            {dayNames.map((dayName, dayIndex) => {
              const daySchedules = schedules.filter(s => s.day === dayIndex);
              if (daySchedules.length === 0) return null;

              return (
                <div key={dayName} className="space-y-3">
                  <h4 className="font-headline font-black text-xs uppercase tracking-widest text-primary">
                    {dayName}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {daySchedules.map((sch) => {
                      const themeClass = getColorClass(sch.className);
                      const connectedTasks = tasks.filter(t => t.scheduleId === sch.id && !t.completed);
                      return (
                        <div
                          key={sch.id}
                          onClick={() => openEditClass(sch)}
                          className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] hover:border-primary/40 cursor-pointer flex justify-between items-center bg-surface-container-lowest border-outline/10 shadow-sm group`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${themeClass.split(" ")[0]} border border-outline/10`}>
                              <BookOpen size={18} />
                            </div>
                            <div>
                              <h5 className="font-headline font-bold text-sm text-on-surface">
                                {sch.className}
                              </h5>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-on-surface-variant font-medium opacity-85">
                                <span className="flex items-center gap-1"><Clock size={11} /> {sch.startTime} - {sch.endTime}</span>
                                <span className="flex items-center gap-1"><MapPin size={11} /> {sch.room}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {connectedTasks.length > 0 && (
                              <Badge className="bg-rose-500/10 text-rose-600 border-transparent rounded-full px-2 py-0.5 text-[9px] font-bold">
                                {connectedTasks.length} Tugas
                              </Badge>
                            )}
                            <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteClass(sch.id); }}
                                className="p-1.5 text-on-surface-variant hover:text-rose-500 rounded-xl transition-colors cursor-pointer"
                                title="Hapus Kelas"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid/Calendar View */
          <div className="overflow-x-auto no-scrollbar w-full relative flex-1">
            <div className="min-w-[2100px] w-full px-4 pt-6 pb-8">
              {/* Header (Days) */}
              <div className="flex ml-16 mb-6">
                {daysFiltered.map((dayNum) => {
                   const isToday = new Date().getDay() === dayNum;
                   return (
                     <div key={dayNum} className="flex-1 text-center">
                       <span className={`inline-block font-headline font-black text-xs uppercase tracking-widest px-4 py-1.5 rounded-full transition-colors ${
                         isToday ? "bg-primary text-white shadow-md" : "bg-surface-container text-on-surface-variant"
                       }`}>
                         {dayNamesShort[dayNum]}
                       </span>
                     </div>
                   );
                 })}
              </div>

              {/* Time Grid Wrapper */}
              <div
                className="relative flex rounded-2xl bg-surface-container-lowest overflow-hidden border border-outline/5"
                style={{ height: `${(maxHour - minHour + 1) * 100}px` }}
              >
                {/* Time axis (Y) */}
                <div className="w-16 shrink-0 relative bg-surface z-10 border-r border-outline/5">
                  {hours.map((h, i) => (
                    <div
                      key={h}
                      className="absolute w-full pr-3 text-right"
                      style={{ top: `${i * 100}px` }}
                    >
                      <span className="text-[11px] font-bold text-on-surface-variant/60 tracking-wider -translate-y-3 block">
                        {h.toString().padStart(2, "0")}:00
                      </span>
                    </div>
                  ))}
                </div>

                {/* Grid Lines & Classes */}
                <div className="flex-1 relative">
                  {/* Horizontal grid lines */}
                  {hours.map((h, i) => (
                    <div
                      key={h}
                      className="absolute w-full border-b border-outline/5"
                      style={{ top: `${i * 100}px`, height: "100px" }}
                    ></div>
                  ))}

                  {/* Vertical grid lines (Days) */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {daysFiltered.map((d, i) => (
                      <div
                        key={d}
                        className={`flex-1 ${i !== 0 ? 'border-l border-outline/5' : ''}`}
                      ></div>
                    ))}
                  </div>

                  {/* Current Time Indicator Line */}
                  <AnimatePresence>
                     {currentTimePos > 0 && currentTimePos < (maxHour - minHour + 1) * 100 && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="absolute w-full flex items-center z-30 pointer-events-none"
                          style={{ top: `${currentTimePos}px` }}
                        >
                           <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
                           <div className="h-px w-full bg-rose-500/50 shadow-[0_0_5px_#f43f5e]" />
                           <div className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md ml-auto mr-2">SEKARANG</div>
                        </motion.div>
                     )}
                  </AnimatePresence>

                  {/* Render Class Blocks with Overlap Logic */}
                  {schedules.map((sch, i) => {
                    if (!daysFiltered.includes(sch.day)) return null;

                    const colIndex = daysFiltered.indexOf(sch.day);
                    const [startH, startM] = sch.startTime.split(":").map(Number);
                    const [endH, endM] = sch.endTime.split(":").map(Number);

                    const top = (startH - minHour) * 100 + (startM / 60) * 100;
                    const height = ((endH - startH) * 100) + ((endM - startM) / 60) * 100;

                    // Overlap Collision Detection (classes only)
                    const daySch = schedules.filter(s => s.day === sch.day).sort((a, b) => a.startTime.localeCompare(b.startTime));
                    const overlaps = daySch.filter(s => s.startTime < sch.endTime && sch.startTime < s.endTime);
                    const overlapIndex = overlaps.findIndex(s => s.id === sch.id);
                    
                    const colWidth = 100 / daysFiltered.length;
                    const subWidth = colWidth / overlaps.length;
                    const left = (colIndex * colWidth) + (overlapIndex * subWidth);

                    const themeClass = getColorClass(sch.className);
                    const connectedTasks = tasks.filter(t => t.scheduleId === sch.id && !t.completed);
                    const isCompact = height < 60;

                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 30 }}
                        key={sch.id}
                        onClick={() => openEditClass(sch)}
                        className={`absolute rounded-2xl p-3 md:p-4 border shadow-sm flex group cursor-pointer transition-all hover:scale-[1.02] hover:z-20 overflow-hidden backdrop-blur-md ${themeClass} ${isCompact ? 'flex-row items-center gap-2' : 'flex-col'}`}
                        style={{
                          top: `${top}px`,
                          height: `${Math.max(height, 32)}px`, 
                          left: `${left}%`,
                          width: `calc(${subWidth}% - 16px)`,
                          margin: '0 8px'
                        }}
                      >
                        <h4 className={`font-headline font-bold text-xs md:text-sm leading-tight ${isCompact ? 'truncate' : 'line-clamp-2 mb-1.5'}`}>
                          {sch.className}
                        </h4>
                        
                        {!isCompact && (
                          <div className="flex flex-col gap-1.5 mt-auto overflow-hidden">
                            <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-medium opacity-75">
                              <Clock size={12} className="shrink-0" />
                              <span>{sch.startTime} – {sch.endTime}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-medium opacity-75">
                              <MapPin size={12} className="shrink-0" />
                              <span className="truncate">{sch.room}</span>
                            </div>
                            {connectedTasks.length > 0 && (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 bg-rose-500/10 w-fit px-2 py-0.5 rounded-full mt-1">
                                <Zap size={10} className="shrink-0" fill="currentColor" />
                                <span>{connectedTasks.length} URGEN</span>
                              </div>
                            )}
                          </div>
                        )}
                        {isCompact && (
                          <span className="text-[10px] font-bold opacity-75 truncate">{sch.startTime}</span>
                        )}

                        {/* Hover Actions */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 z-20">
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveFocusTask(sch.id); if (onStartFocus) onStartFocus(); }}
                            className="p-1.5 bg-surface-container/60 backdrop-blur-md rounded-2xl hover:bg-primary hover:text-white active:scale-95 shadow-sm border border-outline/10 transition-all text-on-surface cursor-pointer" title="Fokus"
                          ><Target size={12} /></button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteClass(sch.id); }}
                            className="p-1.5 bg-surface-container/60 backdrop-blur-md rounded-2xl hover:bg-rose-500 hover:text-white active:scale-95 shadow-sm border border-outline/10 transition-all text-on-surface cursor-pointer" title="Hapus"
                          ><Trash2 size={12} /></button>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Render Task Chips on Calendar */}
                  {tasks.filter(t => !t.completed && t.time).map((task, i) => {
                    const taskDate = new Date(task.time);
                    if (isNaN(taskDate.getTime())) return null;
                    const taskDay = taskDate.getDay();
                    if (!daysFiltered.includes(taskDay)) return null;

                    const colIndex = daysFiltered.indexOf(taskDay);
                    const taskH = taskDate.getHours();
                    const taskM = taskDate.getMinutes();
                    const top = (taskH - minHour) * 100 + (taskM / 60) * 100;
                    const colWidth = 100 / daysFiltered.length;

                    const isHigh = task.priorityLevel === "High" || task.priority;
                    const isMed = task.priorityLevel === "Medium";
                    let flagColor = "text-emerald-500";
                    if (isHigh) flagColor = "text-rose-500";
                    else if (isMed) flagColor = "text-amber-500";

                    return (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        key={`task-${task.id}`}
                        className="absolute rounded-xl px-2.5 py-1.5 flex items-center gap-2 cursor-pointer transition-all hover:shadow-md hover:z-30 bg-surface border border-dashed border-primary/45 hover:border-primary"
                        style={{
                          top: `${top}px`,
                          height: '32px',
                          left: `${colIndex * colWidth}%`,
                          width: `calc(${colWidth}% - 4px)`,
                        }}
                        title={`Tugas: ${task.title} — ${taskDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
                      >
                        <CheckSquare size={13} className="text-primary shrink-0" />
                        <span className="text-[11px] font-bold text-on-surface truncate flex-1">{task.title}</span>
                        <Flag size={11} className={`${flagColor} shrink-0`} fill="currentColor" />
                        <span className="text-[10px] font-medium text-on-surface-variant shrink-0">
                          {taskDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-8 border-t border-outline/10">
         <ScheduleTasks onStartFocus={onStartFocus} />
      </div>
    </div>
  );
}
