/**
 * Haptic Engine Utility
 * Provides tactile feedback for a more premium, physical app experience.
 * Optimized for mobile devices using the Web Vibration API.
 */

type HapticStyle = "light" | "medium" | "heavy" | "success" | "error" | "warning";

/**
 * Trigger a haptic feedback pulse based on the provided style.
 * Fallback to console log in non-supported environments.
 */
export const hapticFeedback = (style: HapticStyle = "light"): void => {
  if (typeof window === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  switch (style) {
    case "light":
      navigator.vibrate(10);
      break;
    case "medium":
      navigator.vibrate(25);
      break;
    case "heavy":
      navigator.vibrate(50);
      break;
    case "success":
      navigator.vibrate([10, 30, 10]);
      break;
    case "warning":
      navigator.vibrate([30, 50, 30]);
      break;
    case "error":
      navigator.vibrate([50, 100, 50, 100]);
      break;
    default:
      navigator.vibrate(10);
  }
};

/**
 * Professional Haptic Patterns for specific app events.
 */
export const HAPTIC_PATTERNS = {
  TAB_SWITCH: "light",
  HABIT_LOGGED: "success",
  TASK_COMPLETED: "heavy",
  AI_NUDGE: "medium",
  ERROR: "error",
} as const;
