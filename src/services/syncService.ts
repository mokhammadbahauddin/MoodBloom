import { useSettingsStore } from '../lib/settingsStore';
import { useHabitsStore } from '../lib/habitsStore';
import { useUserStore } from '../lib/userStore';
import { useProductivityStore } from '../lib/productivityStore';
import { CloudStorageAdapter, SyncOperation } from './CloudStorageAdapter';
import { deepEqual, debounce } from '../lib/utils';

export class SyncService {
  private adapter: CloudStorageAdapter;
  private unsubscribeFromSettings?: () => void;
  private unsubscribeFromHabits?: () => void;
  private unsubscribeFromUser?: () => void;
  private unsubscribeFromProductivity?: () => void;
  private unsubscribeFromCloud?: () => void;
  private userId: string | null = null;
  private isPushingSettings = false;
  private isPushingHabits = false;
  private isPushingUser = false;
  private isPushingProductivity = false;
  
  // Local timestamps to prevent echo overwrites
  private lastHabitsLocalTimestamp = 0;
  private lastUserLocalTimestamp = 0;
  private lastProductivityLocalTimestamp = 0;

  private activePushes = new Set<string>();

  constructor(adapter: CloudStorageAdapter) {
    this.adapter = adapter;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  async start() {
    if (!this.userId || this.unsubscribeFromSettings) {
      return;
    }

    console.log('[SyncService] Starting initial pull for user: ' + this.userId);
    // Initial pull
    const ops = await this.adapter.pull('users', this.userId);
    const userDocOp = ops.find(op => op.docId === this.userId);
    
    if (userDocOp && userDocOp.data) {
       const { settings, habits, user: userData, productivity } = userDocOp.data;
       
       if (settings) {
          useSettingsStore.getState().updateSettings(settings);
       }
       if (habits) {
          this.mergeAndApplyHabits(habits, userDocOp.timestamp);
       }
       if (userData) {
          useUserStore.getState().setAll(userData);
       }
       if (productivity) {
          useProductivityStore.getState().setAll(productivity);
       }
    }
    
    // Subscribe to cloud changes
    this.unsubscribeFromCloud = this.adapter.subscribe('users', this.userId, (operations) => {
       const docOp = operations.find(o => o.docId === this.userId);
       if (!docOp || !docOp.data) return;

       const { settings, habits, user: userData, productivity } = docOp.data;
       const incomingTimestamp = docOp.timestamp;

       if (settings) {
          this.isPushingSettings = true;
          useSettingsStore.getState().updateSettings(settings);
          setTimeout(() => { this.isPushingSettings = false; }, 100);
       }
       
       if (habits) {
          this.mergeAndApplyHabits(habits, incomingTimestamp);
       }

       if (userData && incomingTimestamp > this.lastUserLocalTimestamp) {
          this.isPushingUser = true;
          useUserStore.getState().setAll(userData);
          this.lastUserLocalTimestamp = incomingTimestamp;
          setTimeout(() => { this.isPushingUser = false; }, 100);
       }

       if (productivity && incomingTimestamp > this.lastProductivityLocalTimestamp) {
          this.isPushingProductivity = true;
          useProductivityStore.getState().setAll(productivity);
          this.lastProductivityLocalTimestamp = incomingTimestamp;
          setTimeout(() => { this.isPushingProductivity = false; }, 100);
       }
    });

    // Subscribe to local changes
    this.unsubscribeFromSettings = useSettingsStore.subscribe((state, prevState) => {
      if (this.isPushingSettings) return;
      this.handleSettingsChange(state, prevState);
    });
    
    this.unsubscribeFromHabits = useHabitsStore.subscribe((state, prevState) => {
      if (this.isPushingHabits) return;
      this.handleHabitsChange(state, prevState);
    });

    this.unsubscribeFromUser = useUserStore.subscribe((state, prevState) => {
      if (this.isPushingUser) return;
      this.handleUserChange(state, prevState);
    });

    this.unsubscribeFromProductivity = useProductivityStore.subscribe((state, prevState) => {
      if (this.isPushingProductivity) return;
      this.handleProductivityChange(state, prevState);
    });

    console.log('[SyncService] Started syncing all stores');
  }

  stop() {
    this.unsubscribeFromSettings?.();
    this.unsubscribeFromHabits?.();
    this.unsubscribeFromUser?.();
    this.unsubscribeFromProductivity?.();
    this.unsubscribeFromCloud?.();
    this.unsubscribeFromSettings = undefined;
    this.unsubscribeFromHabits = undefined;
    this.unsubscribeFromUser = undefined;
    this.unsubscribeFromProductivity = undefined;
    this.unsubscribeFromCloud = undefined;
    console.log('[SyncService] Stopped syncing all stores');
  }

  private debouncedPushSettings = debounce((userId: string, settings: any) => {
    this.pushField(userId, 'settings', settings);
  }, 1500);

  private debouncedPushHabits = debounce((userId: string, habitsData: any, timestamp: number) => {
    this.pushField(userId, 'habits', habitsData, timestamp);
  }, 2000);

  private debouncedPushUser = debounce((userId: string, userData: any, timestamp: number) => {
    this.pushField(userId, 'user', userData, timestamp);
  }, 2000);

  private debouncedPushProductivity = debounce((userId: string, productivityData: any, timestamp: number) => {
    this.pushField(userId, 'productivity', productivityData, timestamp);
  }, 2000);

  private async pushField(userId: string, fieldName: string, fieldData: any, timestamp: number = Date.now()) {
    try {
      await this.adapter.push([{
        id: fieldName + '-' + timestamp,
        type: 'write',
        collection: 'users',
        docId: userId,
        data: { [fieldName]: fieldData },
        timestamp
      }]);
      this.activePushes.delete(fieldName);
      if (this.activePushes.size === 0) {
        useSettingsStore.setState({ syncStatus: 'saved' });
      }
    } catch (err) {
      console.error('[SyncService] Failed to push field ' + fieldName + ':', err);
      this.activePushes.delete(fieldName);
      useSettingsStore.setState({ syncStatus: 'error' });
    }
  }

  private handleSettingsChange(state: any, prevState: any) {
    if (!this.userId) return;
    if (!deepEqual(state.settings, prevState?.settings)) {
      this.activePushes.add('settings');
      useSettingsStore.setState({ syncStatus: 'saving' });
      this.debouncedPushSettings(this.userId, state.settings);
    }
  }
  
  private handleHabitsChange(state: any, prevState: any) {
    if (!this.userId) return;
    
    const getHabitsData = (s: any) => {
      if (!s) return null;
      const { 
        waterLogs, detailedWaterLogs, baseWaterGoal, 
        moodLogs, streakCount, lastStreakUpdate, 
        meditationLogs, meditationGoal,
        stepsLogs, detailedStepsLogs, stepGoal,
        prayerLogs, prayerAlarms
      } = s;
      return { 
        waterLogs, detailedWaterLogs, baseWaterGoal, 
        moodLogs, streakCount, lastStreakUpdate, 
        meditationLogs, meditationGoal,
        stepsLogs, detailedStepsLogs, stepGoal,
        prayerLogs, prayerAlarms
      };
    };
    
    const currentData = getHabitsData(state);
    const prevData = getHabitsData(prevState);
    
    if (!deepEqual(currentData, prevData)) {
      const timestamp = Date.now();
      this.lastHabitsLocalTimestamp = timestamp;
      this.activePushes.add('habits');
      useSettingsStore.setState({ syncStatus: 'saving' });
      this.debouncedPushHabits(this.userId, currentData, timestamp);
    }
  }

  private handleUserChange(state: any, prevState: any) {
    if (!this.userId) return;
    
    const getUserData = (s: any) => {
      if (!s) return null;
      const { 
        userName, hasCompletedOnboarding, focusAreas, 
        achievements, xp, level, aiAnalysis, 
        weeklyCoachingReport, currentWeather, activeChatContext, isFasting
      } = s;
      return { 
        userName, hasCompletedOnboarding, focusAreas, 
        achievements, xp, level, aiAnalysis, 
        weeklyCoachingReport, currentWeather, activeChatContext, isFasting
      };
    };

    const currentData = getUserData(state);
    const prevData = getUserData(prevState);

    if (!deepEqual(currentData, prevData)) {
      const timestamp = Date.now();
      this.lastUserLocalTimestamp = timestamp;
      this.activePushes.add('user');
      useSettingsStore.setState({ syncStatus: 'saving' });
      this.debouncedPushUser(this.userId, currentData, timestamp);
    }
  }

  private handleProductivityChange(state: any, prevState: any) {
    if (!this.userId) return;
    
    const getProdData = (s: any) => {
      if (!s) return null;
      const { schedules, tasks, focusLogs } = s;
      return { schedules, tasks, focusLogs };
    };

    const currentData = getProdData(state);
    const prevData = getProdData(prevState);

    if (!deepEqual(currentData, prevData)) {
      const timestamp = Date.now();
      this.lastProductivityLocalTimestamp = timestamp;
      this.activePushes.add('productivity');
      useSettingsStore.setState({ syncStatus: 'saving' });
      this.debouncedPushProductivity(this.userId, currentData, timestamp);
    }
  }

  private mergeAndApplyHabits(incomingHabits: any, incomingTimestamp: number) {
    if (!this.userId) return;

    const localState = useHabitsStore.getState();
    const isIncomingNewer = incomingTimestamp > this.lastHabitsLocalTimestamp;
    
    // Merge steps logs
    const { mergedDetailed, mergedStepsLogs } = this.mergeSteps(localState, incomingHabits);
    
    // Determine base state for other fields using LWW
    const baseState = isIncomingNewer ? incomingHabits : localState;
    
    const mergedHabits = {
      ...baseState,
      detailedStepsLogs: mergedDetailed,
      stepsLogs: mergedStepsLogs,
    };

    const getSyncedFields = (s: any) => {
      if (!s) return null;
      const { 
        waterLogs, detailedWaterLogs, baseWaterGoal, 
        moodLogs, streakCount, lastStreakUpdate, 
        meditationLogs, meditationGoal,
        stepsLogs, detailedStepsLogs, stepGoal,
        prayerLogs, prayerAlarms
      } = s;
      return { 
        waterLogs, detailedWaterLogs, baseWaterGoal, 
        moodLogs, streakCount, lastStreakUpdate, 
        meditationLogs, meditationGoal,
        stepsLogs, detailedStepsLogs, stepGoal,
        prayerLogs, prayerAlarms
      };
    };

    const currentLocalSynced = getSyncedFields(localState);
    const mergedSynced = getSyncedFields(mergedHabits);

    if (!deepEqual(currentLocalSynced, mergedSynced)) {
      this.isPushingHabits = true;
      useHabitsStore.getState().setAll(mergedHabits);
      
      if (isIncomingNewer) {
        this.lastHabitsLocalTimestamp = incomingTimestamp;
      }
      
      const incomingSynced = getSyncedFields(incomingHabits);
      if (!deepEqual(mergedSynced, incomingSynced)) {
        const pushTimestamp = Date.now();
        this.lastHabitsLocalTimestamp = pushTimestamp;
        this.debouncedPushHabits(this.userId, mergedSynced, pushTimestamp);
      }
      setTimeout(() => { this.isPushingHabits = false; }, 100);
    }
  }

  private mergeSteps(localState: any, incomingHabits: any) {
    const localDetailed = localState.detailedStepsLogs || {};
    const incomingDetailed = incomingHabits.detailedStepsLogs || {};
    
    const mergedDetailed: any = {};
    const mergedStepsLogs: any = {};

    const allDates = new Set([
      ...Object.keys(localDetailed),
      ...Object.keys(incomingDetailed)
    ]);

    for (const date of allDates) {
      const localList = localDetailed[date] || [];
      const incomingList = incomingDetailed[date] || [];

      // Merge arrays by matching item unique IDs
      const mergedList = [...localList];
      for (const item of incomingList) {
        if (!mergedList.some(x => x.id === item.id)) {
          mergedList.push(item);
        }
      }

      // Sort by timestamp
      mergedList.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      mergedDetailed[date] = mergedList;
      mergedStepsLogs[date] = mergedList.reduce((sum: number, entry: any) => sum + entry.amount, 0);
    }

    return { mergedDetailed, mergedStepsLogs };
  }
}
