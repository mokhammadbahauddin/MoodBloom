/**
 * Standalone Helper Functions for the Home tab component.
 * Extracted to ensure clean component architecture, unit-testability, and separation of concerns.
 */

export interface ScheduleItem {
  id: string;
  day: number;
  className: string;
  startTime: string;
  room: string;
}

export interface MoodDetails {
  label: string;
  iconName: "Sparkles" | "Smile";
  colorClass: string;
  bgClass: string;
}

/**
 * Determines status for a given day index (0 for Monday, 6 for Sunday) in the weekly streak tracker.
 */
export const getStreakDayStatus = (
  index: number,
  moodLogs: Record<string, any>,
  today: Date = new Date()
): "completed" | "today" | "pending" => {
  const currentDay = today.getDay(); // 0 is Sunday
  const mondayIndex = currentDay === 0 ? 6 : currentDay - 1;
  const diff = index - mondayIndex;
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);
  const dateStr = targetDate.toISOString().split("T")[0];
  
  if (moodLogs[dateStr]) return "completed";
  if (index === mondayIndex) return "today";
  return "pending";
};

/**
 * Returns greeting message based on the hour of the day.
 */
export const getGreetingMessage = (hour: number): string => {
  if (hour < 12) return "Selamat Pagi";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
};

/**
 * Returns layout labels, colors, and icon names based on mood rating values (1-4).
 */
export const getMoodDetails = (moodValue?: number): MoodDetails => {
  if (moodValue === undefined) {
    return {
      label: "Check-in",
      iconName: "Smile",
      colorClass: "text-primary",
      bgClass: "bg-primary/10",
    };
  }

  switch (moodValue) {
    case 4:
      return {
        label: "Sangat Baik",
        iconName: "Sparkles",
        colorClass: "text-orange-500",
        bgClass: "bg-orange-500/10",
      };
    case 3:
      return {
        label: "Baik",
        iconName: "Smile",
        colorClass: "text-emerald-500",
        bgClass: "bg-emerald-500/10",
      };
    case 2:
      return {
        label: "Biasa",
        iconName: "Smile",
        colorClass: "text-indigo-500",
        bgClass: "bg-indigo-500/10",
      };
    case 1:
    default:
      return {
        label: "Buruk",
        iconName: "Smile",
        colorClass: "text-purple-500",
        bgClass: "bg-purple-500/10",
      };
  }
};

/**
 * Filters schedules to retrieve today's academic classes, sorted chronologically.
 */
export const getTodaysClasses = (schedules: ScheduleItem[], currentDay: number): ScheduleItem[] => {
  return schedules
    .filter((s) => s.day === currentDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
};
