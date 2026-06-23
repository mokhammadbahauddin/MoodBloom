import { CloudStorageAdapter } from "./CloudStorageAdapter";
import { SyncableStore } from "./SyncableStore";
import { deepEqual, debounce } from "../lib/utils";
import { useSettingsStore } from "../lib/settingsStore"; // for UI syncStatus state

export class SyncService {
  private adapter: CloudStorageAdapter;
  private stores: SyncableStore[];
  private userId: string | null = null;
  
  private unsubscribes: (() => void)[] = [];
  private unsubscribeFromCloud?: () => void;

  private isPushing: Record<string, boolean> = {};
  private lastLocalTimestamps: Record<string, number> = {};
  private lastSyncedDataCache: Record<string, any> = {};
  private debouncedPushes: Record<string, (userId: string, data: any, timestamp: number) => void> = {};
  private activePushes = new Set<string>();

  constructor(adapter: CloudStorageAdapter, stores: SyncableStore[]) {
    this.adapter = adapter;
    this.stores = stores;

    // Initialize tracking variables dynamically for each store
    for (const store of this.stores) {
      this.isPushing[store.key] = false;
      this.lastLocalTimestamps[store.key] = 0;
      this.debouncedPushes[store.key] = debounce((userId: string, data: any, timestamp: number) => {
        this.pushField(userId, store.key, data, timestamp);
      }, 2000);
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  async start() {
    if (!this.userId || this.unsubscribes.length > 0) {
      return;
    }

    console.log("[SyncService] Starting initial pull for user: " + this.userId);
    
    // 1. Initial pull from cloud
    const ops = await this.adapter.pull("users", this.userId);
    const userDocOp = ops.find(op => op.docId === this.userId);
    
    if (userDocOp && userDocOp.data) {
       const incomingTimestamp = userDocOp.timestamp;
       for (const store of this.stores) {
         const incomingData = userDocOp.data[store.key];
         if (incomingData) {
            store.mergeIncoming(incomingData, incomingTimestamp, 0);
            this.lastLocalTimestamps[store.key] = incomingTimestamp;
         }
         this.lastSyncedDataCache[store.key] = store.getSyncData();
       }
    } else {
       // Document doesn't exist yet, initialize cache with current local states
       for (const store of this.stores) {
         this.lastSyncedDataCache[store.key] = store.getSyncData();
       }
    }

    // 2. Subscribe to cloud updates
    this.unsubscribeFromCloud = this.adapter.subscribe("users", this.userId, (operations) => {
       const docOp = operations.find(o => o.docId === this.userId!);
       if (!docOp || !docOp.data) return;

       const incomingTimestamp = docOp.timestamp;

       for (const store of this.stores) {
         const incomingData = docOp.data[store.key];
         if (incomingData) {
            const lastLocalTimestamp = this.lastLocalTimestamps[store.key] || 0;
            
            if (incomingTimestamp > lastLocalTimestamp) {
               this.isPushing[store.key] = true;
               
               store.mergeIncoming(incomingData, incomingTimestamp, lastLocalTimestamp);
               
               const mergedData = store.getSyncData();
               this.lastLocalTimestamps[store.key] = incomingTimestamp;
               this.lastSyncedDataCache[store.key] = mergedData;

               // If the merged state has local changes (e.g. array-merging combined offline inputs),
               // push it back up to the cloud to keep it in sync.
               if (!deepEqual(incomingData, mergedData)) {
                  const pushTimestamp = Date.now();
                  this.lastLocalTimestamps[store.key] = pushTimestamp;
                  this.debouncedPushes[store.key](this.userId!, mergedData, pushTimestamp);
               }
               
               setTimeout(() => { this.isPushing[store.key] = false; }, 100);
            }
         }
       }
    });

    // 3. Subscribe to local changes for each store
    for (const store of this.stores) {
      const unsub = store.subscribe(() => {
        if (this.isPushing[store.key]) return;
        
        const currentData = store.getSyncData();
        const lastSynced = this.lastSyncedDataCache[store.key];
        
        if (!deepEqual(currentData, lastSynced)) {
          const timestamp = Date.now();
          this.lastLocalTimestamps[store.key] = timestamp;
          this.lastSyncedDataCache[store.key] = currentData;
          this.activePushes.add(store.key);
          useSettingsStore.setState({ syncStatus: "saving" });
          this.debouncedPushes[store.key](this.userId!, currentData, timestamp);
        }
      });
      this.unsubscribes.push(unsub);
    }

    console.log("[SyncService] Started syncing all stores");
  }

  stop() {
    this.unsubscribes.forEach(unsub => unsub());
    this.unsubscribes = [];
    this.unsubscribeFromCloud?.();
    this.unsubscribeFromCloud = undefined;
    console.log("[SyncService] Stopped syncing all stores");
  }

  private async pushField(userId: string, fieldName: string, fieldData: any, timestamp: number = Date.now()) {
    try {
      await this.adapter.push([{
        id: fieldName + "-" + timestamp,
        type: "write",
        collection: "users",
        docId: userId,
        data: { [fieldName]: fieldData },
        timestamp
      }]);
      this.activePushes.delete(fieldName);
      if (this.activePushes.size === 0) {
        useSettingsStore.setState({ syncStatus: "saved" });
      }
    } catch (err) {
      console.error(`[SyncService] Failed to push field ${fieldName}:`, err);
      this.activePushes.delete(fieldName);
      useSettingsStore.setState({ syncStatus: "error" });
    }
  }
}
