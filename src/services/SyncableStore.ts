export interface SyncableStore {
  /**
   * The unique key representing this store in the cloud document (e.g., 'settings', 'habits').
   */
  key: string;

  /**
   * Retrieves the current serializable data slice from this store.
   */
  getSyncData(): any;

  /**
   * Merges incoming remote data with the local store state, resolving conflicts using specific rules.
   * @param incoming The incoming remote data.
   * @param timestamp The remote write timestamp.
   * @param lastLocalTimestamp The timestamp of the last local update.
   */
  mergeIncoming(incoming: any, timestamp: number, lastLocalTimestamp: number): void;

  /**
   * Subscribes to changes in this store.
   * @param listener Callback invoked when the store changes.
   * @returns Unsubscribe function.
   */
  subscribe(listener: (state: any, prevState: any) => void): () => void;
}
