import { 
  collection, 
  doc, 
  setDoc, 
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

// Batch save or merge multiple submissions in Firestore
export async function syncSpreadsheetItemsToFirestore(parsedItems: Partial<SubmissionItem>[]) {
  try {
    const colRef = collection(db, SUBMISSIONS_COLLECTION);
    const existingSnapshot = await getDocs(colRef);
    const existingMap = new Map<string, SubmissionItem>();
    
    existingSnapshot.forEach((docSnap) => {
      const data = docSnap.data() as SubmissionItem;
      if (data && data.submissionId) {
        existingMap.set(data.submissionId, data);
      }
    });

    const batch = writeBatch(db);
    let count = 0;

    for (let idx = 0; idx < parsedItems.length; idx++) {
      const newItem = parsedItems[idx];
      const subId = newItem.submissionId || `sheet-row-${idx}`;
      const existing = existingMap.get(subId);

      const docRef = doc(db, SUBMISSIONS_COLLECTION, subId);

      if (existing) {
        // Merge Google Sheets metadata without overwriting existing auditor status & verifications
        const updatedDoc = cleanForFirestore({
          ...existing,
          submissionTime: newItem.submissionTime || existing.submissionTime,
          satker: newItem.satker || existing.satker,
          bidang: newItem.bidang || existing.bidang,
          fileUrl: newItem.fileUrl || existing.fileUrl,
          fileName: newItem.fileName || existing.fileName,
          updatedAt: new Date().toISOString()
        });
        batch.set(docRef, updatedDoc, { merge: true });
      } else {
        // Insert new submission document
        const newDoc: SubmissionItem = {
          id: `sheet-${Date.now()}-${idx}`,
          submissionId: subId,
          submissionTime: newItem.submissionTime || new Date().toISOString().slice(0, 19).replace('T', ' '),
          satker: newItem.satker || '-',
          bidang: newItem.bidang || '-',
          fileUrl: newItem.fileUrl || '',
          fileName: newItem.fileName || 'Dokumen.pdf',
          status: 'belum_diperiksa',
          checklist: {
            suratPermohonan: false,
            rincianUP: false,
            sptjm: false,
            matriksAkun: false,
            softcopyPdf: true,
          },
          history: [
            {
              id: `log-sync-${Date.now()}-${idx}`,
              timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
              userRole: 'keuangan',
              userName: 'Google Sheets & Firebase Sync',
              action: 'Disinkronkan dari Google Spreadsheet & Tersimpan di Firebase'
            }
          ],
          source: 'google_sheets'
        };
        batch.set(docRef, cleanForFirestore({ ...newDoc, updatedAt: new Date().toISOString() }));
      }
      count++;
    }

    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    console.error('Failed to sync spreadsheet items to Firestore:', err);
    throw err;
  }
}
