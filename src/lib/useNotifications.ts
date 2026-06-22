import { useEffect } from "react";
import { useUserStore } from ".//userStore";
import { useProductivityStore } from ".//productivityStore";;

export function useNotifications() {
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        icon: "/vite.svg",
        ...options,
      });

      // Try to play a local notification sound
      try {
        const audio = new Audio("/sounds/notification.mp3");
        audio
          .play()
          .catch((e) => console.log("Audio play blocked by browser", e));
      } catch (e) {}
    }
  };

  return { sendNotification };
}
