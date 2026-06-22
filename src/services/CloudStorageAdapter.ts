export type SyncOperationType = 'write' | 'delete';

export interface SyncOperation<T = any> {
  id: string; // Unique identifier for the operation
  type: SyncOperationType;
  collection: string;
  docId: string;
  data?: T;
  timestamp: number;
}

export interface CloudStorageAdapter {
  /**
   * Pushes a batch of operations to the cloud storage.
   */
  push(operations: SyncOperation[]): Promise<void>;

  /**
   * Pulls operations from the cloud storage for a specific collection or document.
   * @param collection The collection name.
   * @param docId Optional document ID to pull a single document.
   * @param lastSyncTimestamp Optionally filter operations that occurred after this timestamp.
   */
  pull(collection: string, docId?: string, lastSyncTimestamp?: number): Promise<SyncOperation[]>;

  /**
   * Subscribes to changes in a specific collection or document.
   * @param collection The collection name.
   * @param docId Optional document ID to subscribe to a single document.
   * @param callback Function to be called when new operations arrive.
   * @returns An unsubscribe function.
   */
  subscribe(collection: string, docId: string | undefined, callback: (operations: SyncOperation[]) => void): () => void;
}
