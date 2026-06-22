import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUserStore } from "../lib/userStore";
import { useProductivityStore } from "../lib/productivityStore";
import { ArrowRight, CheckCircle2, Flower } from "lucide-react";
import { SmokeyBackground } from "./ui/login-form";

const GOALS = [
  { id: "productivity", label: "Saya ingin lebih produktif", icon: "🚀" },
  {
    id: "health",
    label: "Saya ingin pantau kesehatan mental & fisik",
    icon: "🌱",
  },
  { id: "prayer", label: "Saya ingin rutinitas ibadah terjaga", icon: "🤲" },
];

export default function Onboarding() {
  const completeOnboarding = useUserStore(state => state.completeOnboarding);
  const [step, setStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [name, setName] = useState("");

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const handleNext = () => {
    if (step === 1 && name.trim()) setStep(2);
    else if (step === 2 && selectedGoals.length > 0) {
      completeOnboarding(name, selectedGoals);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col items-center justify-center font-body px-6">
      <SmokeyBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/80 shadow-2xl p-8 md:p-10 relative z-10 flex flex-col min-h-[520px] justify-between"
      >
        <div className="flex-1 flex flex-col justify-center pb-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center text-center gap-6"
              >
                <div className="w-40 h-40 mb-2 flex items-center justify-center bg-primary/10 rounded-2xl">
                  <Flower className="text-primary w-24 h-24 animate-spin-slow" />
                </div>
                <div>
                  <h1 className="text-3xl font-headline font-black text-on-surface tracking-tight mb-2">
                    Selamat Datang!
                  </h1>
                  <p className="text-on-surface-variant font-medium text-sm">
                    Boleh kenalan? Siapa namamu?
                  </p>
                </div>
                <div className="w-full space-y-2">
                  <label className="block text-left text-xs font-black text-on-surface-variant uppercase tracking-wider ml-1">
                    Nama Anda
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Namamu..."
                    className="w-full px-6 py-4 rounded-2xl bg-surface-container-low border border-outline/20 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-headline text-lg text-center font-bold text-on-surface placeholder:text-on-surface-variant/40"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div className="text-center mb-2">
                  <h1 className="text-2xl font-headline font-black text-on-surface tracking-tight mb-1">
                    Halo {name}!
                  </h1>
                  <p className="text-on-surface-variant font-medium text-sm">
                    Apa tujuan utamamu menggunakan aplikasi ini?
                  </p>
                  <p className="text-[11px] text-on-surface-variant/60 font-bold uppercase tracking-wider mt-1">
                    (Pilih yang relevan)
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {GOALS.map((goal) => {
                    const isSelected = selectedGoals.includes(goal.id);
                    return (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        key={goal.id}
                        onClick={() => toggleGoal(goal.id)}
                        className={`p-4.5 rounded-2xl border flex items-center gap-4 transition-all text-left ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                            : "border-outline/10 bg-surface-container-low hover:bg-surface-container"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-outline/5 flex items-center justify-center shrink-0 text-xl">
                          {goal.icon}
                        </div>
                        <span className="font-headline font-bold text-on-surface text-sm flex-1">
                          {goal.label}
                        </span>
                        <div
                          className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-outline/25 bg-white"
                          }`}
                        >
                          {isSelected && <CheckCircle2 size={13} strokeWidth={3} />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-4 mt-auto pt-4 border-t border-outline/5">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-wider bg-surface-container-high text-on-surface-variant border border-outline/10 active:scale-95 transition-all hover:bg-surface-variant/80 cursor-pointer"
            >
              Kembali
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={step === 1 ? !name.trim() : selectedGoals.length === 0}
            className="flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 hover:bg-primary-dim cursor-pointer"
          >
            {step === 1 ? "Lanjut" : "Mulai Sekarang"}
            {step === 1 && <ArrowRight size={16} />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

