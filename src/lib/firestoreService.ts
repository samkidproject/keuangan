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
import { SubmissionItem } from '../types';

const SUBMISSIONS_COLLECTION = 'submissions';

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

// Subscribe to real-time updates from Firestore
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
        if (data && data.submissionId) {
          items.push(data);
        }
      });
      // Sort items by submissionTime descending
      items.sort((a, b) => (b.submissionTime || '').localeCompare(a.submissionTime || ''));
      onData(items);
    },
    (err) => {
      console.error('Firestore subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// Save or merge a single submission in Firestore
export async function saveSubmissionToFirestore(item: SubmissionItem) {
  try {
    const docId = item.submissionId || item.id;
    const docRef = doc(db, SUBMISSIONS_COLLECTION, docId);
    const cleanedData = cleanForFirestore({
      ...item,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, cleanedData, { merge: true });
  } catch (err) {
    console.error('Failed to save submission to Firestore:', err);
    throw err;
  }
}

// Delete a single submission from Firestore
export async function deleteSubmissionFromFirestore(docId: string) {
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, docId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete submission from Firestore:', err);
    throw err;
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


