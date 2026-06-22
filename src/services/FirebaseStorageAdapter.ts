import { CloudStorageAdapter, SyncOperation } from './CloudStorageAdapter';
import { db } from '../lib/firebase';
import { collection, writeBatch, doc, getDocs, getDoc, query, where, onSnapshot, serverTimestamp, limit } from "firebase/firestore";

export class FirebaseStorageAdapter implements CloudStorageAdapter {
  async push(operations: SyncOperation[]): Promise<void> {
    if (operations.length === 0) return;
    const batch = writeBatch(db);

    for (const op of operations) {
      const docRef = doc(db, op.collection, op.docId);
      if (op.type === 'write') {
        const docData = {
          ...op.data,
          updatedAt: serverTimestamp()
        };
        batch.set(docRef, docData, { merge: true });
      } else if (op.type === 'delete') {
        batch.delete(docRef);
      }
    }

    await batch.commit();
  }

  async pull(collectionName: string, docId?: string, lastSyncTimestamp?: number): Promise<SyncOperation[]> {
    const operations: SyncOperation[] = [];
    if (docId) {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const timestamp = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.timestamp || Date.now());
        operations.push({
          id: docSnap.id,
          type: 'write',
          collection: collectionName,
          docId: docSnap.id,
          data,
          timestamp,
        });
      }
    } else {
      const collRef = collection(db, collectionName);
      const q = lastSyncTimestamp 
        ? query(collRef, where('updatedAt', '>', lastSyncTimestamp), limit(500))
        : query(collRef, limit(500));
        
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const timestamp = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.timestamp || Date.now());
        operations.push({
          id: docSnap.id,
          type: 'write',
          collection: collectionName,
          docId: docSnap.id,
          data,
          timestamp,
        });
      });
    }
    return operations;
  }

  subscribe(collectionName: string, docId: string | undefined, callback: (operations: SyncOperation[]) => void): () => void {
    if (docId) {
      const docRef = doc(db, collectionName, docId);
      return onSnapshot(docRef, (docSnap) => {
        const operations: SyncOperation[] = [];
        if (docSnap.exists()) {
          const data = docSnap.data();
          const timestamp = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.timestamp || Date.now());
          operations.push({
            id: docSnap.id,
            type: 'write',
            collection: collectionName,
            docId: docSnap.id,
            data,
            timestamp,
          });
        } else {
          operations.push({
            id: docId,
            type: 'delete',
            collection: collectionName,
            docId: docId,
            timestamp: Date.now(),
          });
        }
        callback(operations);
      });
    } else {
      const collRef = collection(db, collectionName);
      const q = query(collRef, limit(500));
      return onSnapshot(q, (snapshot) => {
        const operations: SyncOperation[] = [];
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          const timestamp = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.timestamp || Date.now());
          if (change.type === 'added' || change.type === 'modified') {
            operations.push({
              id: change.doc.id,
              type: 'write',
              collection: collectionName,
              docId: change.doc.id,
              data,
              timestamp,
            });
          } else if (change.type === 'removed') {
            operations.push({
              id: change.doc.id,
              type: 'delete',
              collection: collectionName,
              docId: change.doc.id,
              timestamp,
            });
          }
        });
        if (operations.length > 0) {
          callback(operations);
        }
      });
    }
  }
}
