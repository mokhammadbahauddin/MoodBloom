import { Achievement } from "../userStore";;

export function calculateNewXPAndLevel(currentXP: number, currentLevel: number, amountToAdd: number) {
  if (!amountToAdd || isNaN(amountToAdd)) return { xp: currentXP, level: currentLevel };
  const newXP = currentXP + amountToAdd;
  const nextLevelXP = currentLevel * 1000;
  if (newXP >= nextLevelXP) {
    return { xp: newXP - nextLevelXP, level: currentLevel + 1 };
  }
  return { xp: newXP, level: currentLevel };
}

export function unlockAchievements(
  currentAchievements: Achievement[],
  idsToUnlock: string[]
): Achievement[] {
  const newAchievements = [...currentAchievements];
  let changed = false;
  
  for (const id of idsToUnlock) {
    const index = newAchievements.findIndex(a => a.id === id);
    if (index !== -1 && !newAchievements[index].unlockedAt) {
      newAchievements[index] = { ...newAchievements[index], unlockedAt: new Date().toISOString() };
      changed = true;
    }
  }
  
  return changed ? newAchievements : currentAchievements;
}

export function checkMoodStreakAchievements(streakCount: number): string[] {
  const toUnlock: string[] = ["mood_explorer"];
  if (streakCount >= 7) toUnlock.push("streak_7");
  if (streakCount >= 30) toUnlock.push("streak_30");
  if (streakCount >= 100) toUnlock.push("streak_100");
  return toUnlock;
}
