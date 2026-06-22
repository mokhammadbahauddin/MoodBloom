import React, { useState } from "react";
import { useUserStore } from "../lib/userStore";
import { useProductivityStore, Task, ClassSchedule } from "../lib/productivityStore";;
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Plus,
  Calendar,
  X,
  BookOpen,
  PartyPopper,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Flag,
  Settings,
  Target
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function ScheduleTasks({
  onStartFocus,
}: {
  onStartFocus?: () => void;
}) {
  const tasks = useProductivityStore(state => state.tasks);
  const setTasks = useProductivityStore(state => state.setTasks);
  const schedules = useProductivityStore(state => state.schedules);
  const setActiveFocusTask = useProductivityStore(state => state.setActiveFocusTask);
  
  // States
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [showAdvancedAdd, setShowAdvancedAdd] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);
  
  const [newTask, setNewTask] = useState<Partial<Task>>({
    type: "Tugas",
    priority: false,
    priorityLevel: "Medium",
    subTasks: [],
  });
  const [subTaskInput, setSubTaskInput] = useState("");

  const handleQuickAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && quickAddTitle.trim()) {
      e.preventDefault();
      const task: Task = {
        id: crypto.randomUUID(),
        title: quickAddTitle.trim(),
        time: "",
        type: "Tugas",
        completed: false,
        priority: false,
        priorityLevel: "Medium",
      };
      setTasks([...tasks, task]);
      setQuickAddTitle("");
      toast.success("Tugas ditambahkan!");
    }
  };

  const handleAdvancedAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;

    if (editingTaskId) {
      setTasks(tasks.map(t => t.id === editingTaskId ? { ...t, ...newTask } as Task : t));
      toast.success("Tugas berhasil diubah!");
    } else {
      const task: Task = {
        id: crypto.randomUUID(),
        title: newTask.title,
        time: newTask.time || "",
        type: newTask.type || "Tugas",
        completed: false,
        priority: newTask.priority || false,
        priorityLevel: newTask.priorityLevel || "Medium",
        scheduleId: newTask.scheduleId,
        subTasks: newTask.subTasks,
      };
      setTasks([...tasks, task]);
      toast.success("Tugas berhasil ditambahkan!");
    }

    setShowAdvancedAdd(false);
    setEditingTaskId(null);
    setNewTask({ type: "Tugas", priority: false, priorityLevel: "Medium", subTasks: [] });
    setSubTaskInput("");
  };

  const openEditTask = (task: Task) => {
    setNewTask(task);
    setEditingTaskId(task.id);
    setShowAdvancedAdd(true);
  };

  const handleAddSubTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && subTaskInput.trim()) {
      e.preventDefault();
      setNewTask({
        ...newTask,
        subTasks: [
          ...(newTask.subTasks || []),
          {
            id: crypto.randomUUID(),
            title: subTaskInput.trim(),
            completed: false,
          },
        ],
      });
      setSubTaskInput("");
    }
  };

  const removeNewSubtask = (id: string) => {
    setNewTask({
      ...newTask,
      subTasks: (newTask.subTasks || []).filter((st) => st.id !== id),
    });
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === id) {
          const completed = !t.completed;
          const completedAt = completed ? new Date().toISOString() : undefined;
          if (completed) {
            // Play success sound
            new Audio("/sounds/success.mp3").play().catch(() => {});
            
            confetti({
              particleCount: 100,
              spread: 60,
              origin: { y: 0.8 },
              colors: ["#10b981", "#3b82f6"],
            });
          }
          return { ...t, completed, completedAt };
        }
        return t;
      }),
    );
  };

  const toggleSubTask = (taskId: string, subTaskId: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id !== taskId) return t;
        const updatedSubTasks = (t.subTasks || []).map((st) => {
          if (st.id === subTaskId) {
             return { ...st, completed: !st.completed };
          }
          return st;
        });
        return { ...t, subTasks: updatedSubTasks };
      }),
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
    toast("Tugas dihapus", { icon: "🗑️" });
  };

  const toggleExpand = (id: string) => {
    setExpandedTaskIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const getPriorityWeight = (t: Task) => {
    if (t.priorityLevel === "High" || t.priority === true) return 3;
    if (t.priorityLevel === "Medium") return 2;
    if (t.priorityLevel === "Low") return 1;
    return 0;
  };

  const pendingTasks = tasks.filter((t) => !t.completed).sort((a, b) => getPriorityWeight(b) - getPriorityWeight(a));
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="mt-12 pb-32 max-w-4xl mx-auto">
      <div className="flex flex-col mb-4">
        <h2 className="font-headline text-xl font-bold text-on-surface tracking-tight mb-2">
          Daftar Tugas
        </h2>
        
        {/* Seamless Quick Add Input */}
        <div className="relative mt-2">
          <input
            type="text"
            placeholder="Ketik tugas baru lalu tekan Enter..."
            value={quickAddTitle}
            onChange={(e) => setQuickAddTitle(e.target.value)}
            onKeyDown={handleQuickAdd}
            className="w-full bg-surface-container border border-outline/20 rounded-xl pl-12 pr-14 py-3 text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/50 transition-all hover:border-primary/30"
          />
          <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={20} />
          <button 
            onClick={() => {
              setEditingTaskId(null);
              setNewTask({ type: "Tugas", priority: false, priorityLevel: "Medium", subTasks: [] });
              setShowAdvancedAdd(!showAdvancedAdd);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
            title="Opsi Lanjutan"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Advanced Add Modal / Dropdown */}
      <AnimatePresence>
        {showAdvancedAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            onSubmit={handleAdvancedAdd}
            className="bg-surface border border-outline/20 p-6 mb-8 rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="flex items-center justify-between mb-4 border-b border-outline/10 pb-4">
              <h3 className="font-bold text-lg text-on-surface">{editingTaskId ? "Edit Tugas" : "Detail Tugas Tambahan"}</h3>
              <button type="button" onClick={() => setShowAdvancedAdd(false)} className="text-on-surface-variant hover:text-error"><X size={20}/></button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Nama Tugas</label>
                <input
                  type="text"
                  required
                  placeholder="Mis: Kerjakan Makalah Bab 1"
                  value={newTask.title || ""}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-surface-container border border-outline/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Terkait Mata Kuliah</label>
                  <select
                    value={newTask.scheduleId || ""}
                    onChange={(e) => setNewTask({ ...newTask, scheduleId: e.target.value })}
                    className="w-full bg-surface-container border border-outline/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface"
                  >
                    <option value="">Umum</option>
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>{s.className}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Tenggat Waktu / Pengingat</label>
                  <input
                    type="datetime-local"
                    value={newTask.time || ""}
                    onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                    className="w-full bg-surface-container border border-outline/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface"
                  />
                </div>
              </div>

              <div>
                 <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Sub-Tugas (Tekan Enter)</label>
                 </div>
                <input
                  type="text"
                  placeholder="Ketik sub-tugas..."
                  value={subTaskInput}
                  onChange={(e) => setSubTaskInput(e.target.value)}
                  onKeyDown={handleAddSubTask}
                  className="w-full bg-surface-container border border-outline/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary mb-2 text-on-surface"
                />
                {newTask.subTasks && newTask.subTasks.length > 0 && (
                  <div className="space-y-1">
                    {newTask.subTasks.map((st) => (
                      <div key={st.id} className="flex justify-between items-center text-sm bg-surface-container px-3 py-2 rounded-lg border border-outline/10">
                        <span className="text-on-surface truncate">{st.title}</span>
                        <button type="button" onClick={() => removeNewSubtask(st.id)} className="text-on-surface-variant/50 hover:text-error"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Prioritas</label>
                <div className="flex gap-2">
                  {(["Low", "Medium", "High"] as const).map((level) => {
                    const isSelected = newTask.priorityLevel === level;
                    let colorClass = "bg-surface border-outline/20 text-on-surface-variant hover:bg-surface-container";
                    if (isSelected) {
                      if (level === "High") colorClass = "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400";
                      else if (level === "Medium") colorClass = "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400";
                      else colorClass = "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400";
                    }
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setNewTask({ ...newTask, priorityLevel: level })}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${colorClass}`}
                      >
                        {level}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button type="submit" className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm hover:bg-primary-dim transition-all shadow-md hover:shadow-primary/25 mt-4">
                {editingTaskId ? "Simpan Perubahan" : "Simpan Detail Tugas"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="text-center py-16 opacity-60 flex flex-col items-center">
          <PartyPopper size={64} className="text-on-surface-variant mb-4 opacity-50" />
          <p className="font-bold text-on-surface-variant">Tidak ada tugas. Selamat bersantai!</p>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
          {pendingTasks.map((task) => {
            const relClass = schedules.find((s) => s.id === task.scheduleId);
            const isHigh = task.priorityLevel === "High" || task.priority === true;
            const isMed = task.priorityLevel === "Medium";
            const hasSubtasks = task.subTasks && task.subTasks.length > 0;
            const isExpanded = expandedTaskIds.includes(task.id);
            const completedSubs = task.subTasks?.filter(st => st.completed).length || 0;

            let flagColor = "text-emerald-500";
            if (isHigh) flagColor = "text-error";
            else if (isMed) flagColor = "text-amber-500";

            return (
              <motion.div
                variants={itemVariants}
                key={task.id}
                className="group relative bg-surface-container/30 hover:bg-surface-container-high border border-outline/20 rounded-xl p-3.5 transition-all hover:shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="mt-0.5 shrink-0 text-outline-variant hover:text-emerald-500 transition-colors"
                  >
                    <Circle size={22} />
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-on-surface text-sm leading-tight cursor-pointer" onClick={() => openEditTask(task)}>
                          {task.title}
                        </h4>
                        
                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                           <div className={`flex items-center gap-1.5 text-xs font-semibold ${flagColor}`}>
                             <Flag size={12} fill="currentColor" /> {task.priorityLevel || "Low"}
                           </div>
                           
                           {relClass && (
                             <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
                               <BookOpen size={12} /> <span className="truncate max-w-[120px]">{relClass.className}</span>
                             </div>
                           )}
                           
                           {task.time && (
                             <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
                               <Clock size={12} /> {new Date(task.time).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                             </div>
                           )}

                           {hasSubtasks && (
                              <button 
                                onClick={() => toggleExpand(task.id)}
                                className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full hover:bg-primary/20 transition-colors ml-auto md:ml-0"
                              >
                                {completedSubs}/{task.subTasks!.length} Sub-tugas
                                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                              </button>
                           )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end md:self-start">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-500/20"
                          title="Selesaikan Tugas"
                        >
                          <CheckCircle2 size={14} /> <span className="hidden sm:inline">Selesai</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveFocusTask(task.id);
                            if (onStartFocus) onStartFocus();
                          }}
                          className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-primary hover:text-white transition-colors border border-primary/20"
                          title="Mulai Sesi Fokus"
                        >
                          <Target size={14} /> <span className="hidden sm:inline">Fokus</span>
                        </button>
                        <button
                          onClick={() => openEditTask(task)}
                          className="p-1.5 text-on-surface-variant opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                        >
                          <Settings size={16} />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1.5 text-on-surface-variant opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Sub-tasks Accordion */}
                    <AnimatePresence>
                      {hasSubtasks && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-4 pt-4 border-t border-outline/10 space-y-2"
                        >
                          {task.subTasks!.map((st) => (
                            <button
                              key={st.id}
                              onClick={() => toggleSubTask(task.id, st.id)}
                              className="w-full flex items-start gap-3 p-2 rounded-xl hover:bg-surface-container-highest transition-colors text-left"
                            >
                              <div className={`mt-0.5 shrink-0 ${st.completed ? 'text-primary' : 'text-outline-variant hover:text-primary'}`}>
                                {st.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                              </div>
                              <span className={`text-sm flex-1 ${st.completed ? 'line-through text-on-surface-variant opacity-70' : 'text-on-surface font-medium'}`}>
                                {st.title}
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Completed Tasks (Collapsible or just separated) */}
      {completedTasks.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-3 pl-2">Selesai ({completedTasks.length})</h3>
          <div className="space-y-2 opacity-60">
            {completedTasks.map((task) => (
               <div key={task.id} className="flex items-center gap-3 bg-surface-container-low/50 border border-outline/10 rounded-xl p-2.5 px-3">
                 <button onClick={() => toggleTask(task.id)} className="text-primary"><CheckCircle2 size={18} /></button>
                 <span className="text-on-surface-variant line-through text-sm font-medium flex-1 truncate">{task.title}</span>
                 <button onClick={() => deleteTask(task.id)} className="text-on-surface-variant hover:text-error"><Trash2 size={14}/></button>
               </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
