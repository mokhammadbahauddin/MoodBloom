import { useEffect } from "react";
import { useHabitsStore } from "./habitsStore";
import { useSettingsStore } from "../lib/settingsStore";
import { getTodayDateString } from "./dateUtils";
import toast from "react-hot-toast";

export function useSensorSync() {
  const settings = useSettingsStore((state) => state.settings);
  const logSteps = useHabitsStore((state) => state.logSteps);

  useEffect(() => {
    // Background Sync for Strava API
    let apiInterval: any;
    const syncFromApis = async () => {
      try {
        const today = getTodayDateString();
        const state = useHabitsStore.getState();

        // Strava Sync
        if (settings?.stravaConnected && settings?.stravaAccessToken) {
          const isExpired = settings.stravaExpiresAt ? Date.now() > settings.stravaExpiresAt : true;
          let currentToken = settings.stravaAccessToken;

          if (isExpired && settings.stravaRefreshToken) {
            try {
              const refreshRes = await fetch("/api/strava/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: settings.stravaRefreshToken }),
              });
              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                currentToken = refreshData.access_token;
                useSettingsStore.getState().updateSettings({
                  stravaAccessToken: refreshData.access_token,
                  stravaRefreshToken: refreshData.refresh_token,
                  stravaExpiresAt: refreshData.expires_at * 1000,
                });
              } else {
                // Refresh failed - disconnect
                useSettingsStore.getState().updateSettings({
                  stravaConnected: false,
                  stravaAccessToken: undefined,
                  stravaRefreshToken: undefined,
                  stravaExpiresAt: undefined,
                });
                toast.error("Sesi Strava telah kedaluwarsa. Silakan hubungkan kembali.", { id: "strava-expired" });
                return;
              }
            } catch (refreshErr) {
              console.error("Failed to auto-refresh Strava token:", refreshErr);
              return;
            }
          }

          const { fetchStravaSteps } = await import("../services/strava");
          const { steps: totalSteps } = await fetchStravaSteps(currentToken);

          const currentDetailed = state.detailedStepsLogs[today] || [];
          const sourceTotalSoFar = currentDetailed
            .filter((l: any) => l.source === "strava")
            .reduce((sum: number, l: any) => sum + l.amount, 0);

          const delta = Math.max(0, totalSteps - sourceTotalSoFar);

          if (delta > 0) {
            toast.success(`+${delta.toLocaleString()} langkah dari Strava`, { icon: "🚴" });
            logSteps(today, totalSteps, "set", "strava");
          }
        }
      } catch (e) {
        console.error("Health API Sync failed", e);
      }
    };

    if (settings?.stravaConnected) {
      syncFromApis();
      apiInterval = setInterval(syncFromApis, 30000); // Sync every 30 seconds
    }

    return () => {
      if (apiInterval) clearInterval(apiInterval);
    };
  }, [
    settings?.stravaConnected,
    settings?.stravaAccessToken,
    settings?.stravaRefreshToken,
    settings?.stravaExpiresAt,
    logSteps,
  ]);
}
