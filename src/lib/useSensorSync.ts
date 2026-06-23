import { useEffect } from "react";
import { useHabitsStore } from "./habitsStore";
import { useSettingsStore } from '../lib/settingsStore';
import { getTodayDateString } from "./dateUtils";
import toast from "react-hot-toast";

export function useSensorSync() {
  const settings = useSettingsStore((state) => state.settings);
  const stepsLogs = useHabitsStore(state => state.stepsLogs);
  const logSteps = useHabitsStore(state => state.logSteps);

  useEffect(() => {
    // Background Sync for Google Fit & Strava API
    let apiInterval: any;
    const syncFromApis = async () => {
      try {
        const today = getTodayDateString();
        const state = useHabitsStore.getState();

        // Google Fit Sync
        if (settings?.googleFitConnected && settings?.googleFitAccessToken) {
          const isExpired = settings.googleFitExpiresAt ? Date.now() > settings.googleFitExpiresAt : false;
          if (isExpired) {
            useSettingsStore.getState().updateSettings({
              googleFitConnected: false,
              googleFitAccessToken: undefined,
              googleFitExpiresAt: undefined,
            });
            toast.error("Sesi sinkronisasi Google Fit telah berakhir. Silakan hubungkan kembali.", { id: "google-fit-expired" });
            return;
          }

          const { fetchGoogleFitSteps } = await import("../services/googleFit");
          const totalSteps = await fetchGoogleFitSteps(settings.googleFitAccessToken!);
          
          const currentDetailed = state.detailedStepsLogs[today] || [];
          const sourceTotalSoFar = currentDetailed
            .filter((l: any) => l.source === "google_fit")
            .reduce((sum: number, l: any) => sum + l.amount, 0);
            
          const delta = Math.max(0, totalSteps - sourceTotalSoFar);
          
          if (delta > 0) {
            toast.success(`+${delta.toLocaleString()} langkah dari Google Fit`, { icon: '👟' });
            logSteps(today, totalSteps, "set", "google_fit");
          }
        }
      } catch (e) {
        console.error("Health API Sync failed", e);
      }
    };

    if (settings?.googleFitConnected) {
      syncFromApis(); 
      apiInterval = setInterval(syncFromApis, 20000); // Sync every 20 seconds
    }

    return () => {
      if (apiInterval) clearInterval(apiInterval);
    };
  }, [
    settings?.googleFitConnected,
    settings?.googleFitAccessToken,
    logSteps,
  ]);
}
