import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { SubmissionItem, SatkerAccount } from '../types';

const SUBMISSIONS_COLLECTION = 'submissions';
const ACCOUNTS_COLLECTION = 'satker_accounts';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return new Error(JSON.stringify(errInfo));
}

// Helper to remove undefined fields before saving to Firestore
function cleanForFirestore(obj: any): any {

  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = cleanForFirestore(val);
      }
    }
    return cleaned;
  }
  return obj;
}

// Subscribe to real-time updates from Firestore for Submissions
export function subscribeToSubmissions(
  onData: (submissions: SubmissionItem[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, SUBMISSIONS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: SubmissionItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SubmissionItem;
        if (data && (data.submissionId || data.id || docSnap.id)) {
          const mainId = data.id || data.submissionId || docSnap.id;
          const subId = data.submissionId || data.id || docSnap.id;
          items.push({
            ...data,
            id: mainId,
            submissionId: subId
          });
        }
      });
      // Sort items by submissionTime descending
      items.sort((a, b) => (b.submissionTime || '').localeCompare(a.submissionTime || ''));
      onData(items);
    },
    (err) => {
      console.error('Firestore submission subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// Subscribe to real-time updates from Firestore for Satker Accounts
export function subscribeToSatkerAccounts(
  onData: (accounts: SatkerAccount[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, ACCOUNTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: SatkerAccount[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SatkerAccount;
        if (data && data.username) {
          items.push(data);
        }
      });
      onData(items);
    },
    (err) => {
      console.error('Firestore accounts subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// Save or sync Satker Accounts to Firestore
export async function saveSatkerAccountToFirestore(account: SatkerAccount) {
  try {
    const docId = account.id || account.username;
    const docRef = doc(db, ACCOUNTS_COLLECTION, docId);
    await setDoc(docRef, cleanForFirestore(account), { merge: true });
  } catch (err) {
    console.error('Failed to save account to Firestore:', err);
  }
}

export async function saveAllSatkerAccountsToFirestore(accounts: SatkerAccount[]) {
  try {
    const batch = writeBatch(db);
    for (const acc of accounts) {
      const docId = acc.id || acc.username;
      const docRef = doc(db, ACCOUNTS_COLLECTION, docId);
      batch.set(docRef, cleanForFirestore(acc), { merge: true });
    }
    await batch.commit();
  } catch (err) {
    console.error('Failed to save all accounts to Firestore:', err);
  }
}

// Delete Satker Account from Firestore
export async function deleteSatkerAccountFromFirestore(accountId: string) {
  try {
    const docRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete account from Firestore:', err);
  }
}

// Save or merge a single submission in Firestore
export async function saveSubmissionToFirestore(item: SubmissionItem) {
  try {
    const rawId = item.submissionId || item.id || `sub-${Date.now()}`;
    const docId = rawId.replace(/\//g, '_');
    const docRef = doc(db, SUBMISSIONS_COLLECTION, docId);
    const cleanedData = cleanForFirestore({
      ...item,
      id: item.id || rawId,
      submissionId: item.submissionId || rawId,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, cleanedData, { merge: true });
    console.log(`Successfully saved submission ${docId} to Firebase Firestore.`);
  } catch (err) {
    console.error('Failed to save submission to Firestore:', err);
    throw err;
  }
}

// Delete a single submission from Firestore thoroughly
export async function deleteSubmissionFromFirestore(rawId: string, secondaryId?: string) {
  try {
    const candidateIds = new Set<string>();
    if (rawId) {
      candidateIds.add(rawId);
      candidateIds.add(rawId.replace(/\//g, '_'));
    }
    if (secondaryId) {
      candidateIds.add(secondaryId);
      candidateIds.add(secondaryId.replace(/\//g, '_'));
    }

    // Direct deletion attempt for all candidates
    for (const id of candidateIds) {
      try {
        const docRef = doc(db, SUBMISSIONS_COLLECTION, id);
        await deleteDoc(docRef);
      } catch (e) {
        // continue
      }
    }

    // Query collection to batch delete any document that matches candidate IDs
    const colRef = collection(db, SUBMISSIONS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const batch = writeBatch(db);
    let count = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as SubmissionItem;
      const snapId = docSnap.id;
      const itemId = data.id;
      const itemSubId = data.submissionId;

      if (
        candidateIds.has(snapId) ||
        (itemId && candidateIds.has(itemId)) ||
        (itemSubId && candidateIds.has(itemSubId)) ||
        (data.jenisPengajuan && data.jenisPengajuan.toLowerCase().includes('agus'))
      ) {
        batch.delete(docSnap.ref);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Deleted ${count} matching submission doc(s) from Firestore.`);
    }
  } catch (err) {
    console.error('Failed to delete submission from Firestore:', err);
    throw err;
  }
}

// Sync missing local items to Firestore
export async function syncLocalSubmissionsToFirestore(localItems: SubmissionItem[]) {
  if (!localItems || localItems.length === 0) return;
  try {
    const batch = writeBatch(db);
    let count = 0;
    for (const item of localItems) {
      if (!item) continue;
      const rawId = item.submissionId || item.id;
      if (!rawId) continue;
      const docId = rawId.replace(/\//g, '_');
      const docRef = doc(db, SUBMISSIONS_COLLECTION, docId);
      batch.set(docRef, cleanForFirestore({
        ...item,
        updatedAt: new Date().toISOString()
      }), { merge: true });
      count++;
    }
    if (count > 0) {
      await batch.commit();
      console.log(`Synced ${count} local submission(s) to Firebase Firestore.`);
    }
  } catch (err) {
    console.warn('Failed to sync local submissions to Firestore:', err);
  }
}


// Clean legacy sample items from Firestore if present
export async function cleanLegacyDemoItems() {
  try {
    const colRef = collection(db, SUBMISSIONS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const legacyIds = [
      '7298c5b3-21e7-4036-b83b-9bd0ee41b310',
      'sub-fb-1',
      'sub-sheet-1',
      'sub-sheet-1-7298c5b3-21e7-4036-b83b-9bd0ee41b310'
    ];

    const batch = writeBatch(db);
    let count = 0;

    snapshot.forEach((docSnap) => {
      const id = docSnap.id;
      const data = docSnap.data() as SubmissionItem;
      if (legacyIds.includes(id) || legacyIds.includes(data.submissionId) || (data as any).source === 'google_sheets') {
        batch.delete(docSnap.ref);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Cleaned ${count} legacy demo document(s) from Firestore.`);
    }
  } catch (err) {
    console.warn("Legacy cleanup error:", err);
  }
}


