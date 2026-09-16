import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc,
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { SubmissionItem, SatkerAccount, SatkerPagu } from '../types';
import { DEFAULT_SATKER_PAGU } from '../data/defaultPagu';

const SUBMISSIONS_COLLECTION = 'submissions';
const ACCOUNTS_COLLECTION = 'satker_accounts';
const PAGU_COLLECTION = 'satker_pagu';
const PAGU_LOCAL_STORAGE_KEY = 'ba_bun_satker_pagu_v2_cache';

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
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
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
      const customErr = handleFirestoreError(err, OperationType.LIST, SUBMISSIONS_COLLECTION);
      if (onError) onError(customErr);
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
      const customErr = handleFirestoreError(err, OperationType.LIST, ACCOUNTS_COLLECTION);
      if (onError) onError(customErr);
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
    handleFirestoreError(err, OperationType.WRITE, ACCOUNTS_COLLECTION);
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
    handleFirestoreError(err, OperationType.WRITE, ACCOUNTS_COLLECTION);
  }
}

// Delete Satker Account from Firestore
export async function deleteSatkerAccountFromFirestore(accountId: string) {
  try {
    const docRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete account from Firestore:', err);
    handleFirestoreError(err, OperationType.DELETE, ACCOUNTS_COLLECTION);
  }
}

// -------------------------------------------------------------
// Satker Pagu (DIPA Budget) Firestore Integration
// -------------------------------------------------------------

export function getLocalCachedPagu(): Record<string, number> {
  try {
    // Purge legacy v1 cache that might contain non-zero mock defaults
    if (typeof window !== 'undefined' && window.localStorage) {
      if (localStorage.getItem('ba_bun_satker_pagu_cache')) {
        localStorage.removeItem('ba_bun_satker_pagu_cache');
      }
    }
    const raw = localStorage.getItem(PAGU_LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to read pagu cache from localStorage:', e);
  }
  return {};
}

export function saveLocalCachedPagu(map: Record<string, number>) {
  try {
    localStorage.setItem(PAGU_LOCAL_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Failed to write pagu cache to localStorage:', e);
  }
}

// Subscribe to real-time Satker Pagu from Firestore
export function subscribeToSatkerPagu(
  onData: (paguMap: Record<string, number>, paguList: SatkerPagu[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, PAGU_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const paguMap: Record<string, number> = {};
      const paguList: SatkerPagu[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SatkerPagu;
        if (data && data.satkerName && typeof data.paguAnggaran === 'number') {
          paguMap[data.satkerName] = data.paguAnggaran;
          paguList.push({
            ...data,
            id: docSnap.id
          });
        }
      });

      if (snapshot.empty) {
        // Automatically seed default DIPA pagu for all Satkers into Firestore
        const items = DEFAULT_SATKER_PAGU.map(p => ({
          satkerName: p.satkerName,
          paguAnggaran: p.paguAnggaran,
          keterangan: p.keterangan
        }));
        saveBatchSatkerPaguToFirestore(items, 'Sistem Auto-Seed').catch(err => {
          console.warn('Auto-seed pagu in Firestore notice:', err);
        });
      }

      // Update local storage cache
      if (Object.keys(paguMap).length > 0) {
        saveLocalCachedPagu(paguMap);
      }
      onData(paguMap, paguList);
    },
    (err) => {
      console.warn('Firestore pagu subscription error, using local fallback:', err);
      const customErr = handleFirestoreError(err, OperationType.LIST, PAGU_COLLECTION);
      if (onError) onError(customErr);
    }
  );
}

// Master sync function to ensure all app state is persisted in Firestore
export async function syncEntireAppStateToFirestore(
  submissions: SubmissionItem[],
  accounts: SatkerAccount[],
  paguMap: Record<string, number>
): Promise<{ submissionsSynced: number; accountsSynced: number; paguSynced: number }> {
  let subCount = 0;
  let accCount = 0;
  let paguCount = 0;

  // 1. Sync submissions
  if (submissions && submissions.length > 0) {
    await syncLocalSubmissionsToFirestore(submissions);
    subCount = submissions.length;
  }

  // 2. Sync accounts
  if (accounts && accounts.length > 0) {
    await saveAllSatkerAccountsToFirestore(accounts);
    accCount = accounts.length;
  }

  // 3. Sync pagu
  if (paguMap && Object.keys(paguMap).length > 0) {
    const paguItems = Object.entries(paguMap).map(([satkerName, paguAnggaran]) => ({
      satkerName,
      paguAnggaran
    }));
    await saveBatchSatkerPaguToFirestore(paguItems, 'Sinkronisasi Menyeluruh');
    paguCount = paguItems.length;
  }

  console.log(`[Firebase Sync] Selesai menyinkronkan: ${subCount} pengajuan, ${accCount} akun, ${paguCount} pagu.`);
  return { submissionsSynced: subCount, accountsSynced: accCount, paguSynced: paguCount };
}

// Save single Satker Pagu to Firestore
export async function saveSatkerPaguToFirestore(
  satkerName: string,
  paguAnggaran: number,
  keterangan?: string,
  updatedBy?: string
): Promise<void> {
  try {
    const docId = satkerName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const docRef = doc(db, PAGU_COLLECTION, docId);
    const payload: SatkerPagu = {
      satkerName,
      paguAnggaran,
      tahunAnggaran: 2026,
      keterangan: keterangan || `Pagu DIPA ${satkerName} TA 2026`,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'Admin Keuangan'
    };
    await setDoc(docRef, cleanForFirestore(payload), { merge: true });

    // Update local cache
    const currentCache = getLocalCachedPagu();
    currentCache[satkerName] = paguAnggaran;
    saveLocalCachedPagu(currentCache);
  } catch (err) {
    console.error('Failed to save Satker Pagu to Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, PAGU_COLLECTION);
    throw err;
  }
}

// Batch save multiple Satker Pagu to Firestore
export async function saveBatchSatkerPaguToFirestore(
  paguItems: Array<{ satkerName: string; paguAnggaran: number; keterangan?: string }>,
  updatedBy?: string
): Promise<void> {
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    const updatedCache = getLocalCachedPagu();

    for (const item of paguItems) {
      if (!item.satkerName) continue;
      const docId = item.satkerName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const docRef = doc(db, PAGU_COLLECTION, docId);
      const payload: SatkerPagu = {
        satkerName: item.satkerName,
        paguAnggaran: item.paguAnggaran,
        tahunAnggaran: 2026,
        keterangan: item.keterangan || `Pagu DIPA ${item.satkerName} TA 2026`,
        updatedAt: now,
        updatedBy: updatedBy || 'Admin Keuangan'
      };
      batch.set(docRef, cleanForFirestore(payload), { merge: true });
      updatedCache[item.satkerName] = item.paguAnggaran;
    }

    await batch.commit();
    saveLocalCachedPagu(updatedCache);
    console.log(`Successfully batch saved ${paguItems.length} Satker Pagu to Firestore.`);
  } catch (err) {
    console.error('Failed to batch save Satker Pagu to Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, PAGU_COLLECTION);
    throw err;
  }
}

// In-memory cache for resolved chunked attachments
const attachmentCache = new Map<string, string>();

/**
 * Saves large Base64 / data URL attachments to Firestore subcollection in 300KB chunks.
 * This completely avoids Firestore's 1MB document limit for submissions.
 */
export async function saveLargeAttachmentToFirestore(
  docId: string,
  fieldName: string,
  dataUrl: string
): Promise<string> {
  const CHUNK_SIZE = 300 * 1024; // 300 KB per chunk (safe within 1MB limit)
  const totalChunks = Math.ceil(dataUrl.length / CHUNK_SIZE);
  const chunksColRef = collection(db, SUBMISSIONS_COLLECTION, docId, `${fieldName}_chunks`);

  for (let i = 0; i < totalChunks; i++) {
    const chunkData = dataUrl.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const chunkDocRef = doc(chunksColRef, `chunk_${i}`);
    await setDoc(chunkDocRef, {
      index: i,
      total: totalChunks,
      data: chunkData,
      updatedAt: new Date().toISOString()
    });
  }

  const chunkRef = `firestore-chunked:${docId}:${fieldName}:${totalChunks}`;
  attachmentCache.set(chunkRef, dataUrl);
  return chunkRef;
}

/**
 * Resolves a chunked attachment reference back to its full Base64 / data URL string.
 */
export async function resolveChunkedAttachment(chunkRef: string): Promise<string> {
  if (!chunkRef || !chunkRef.startsWith('firestore-chunked:')) return chunkRef;
  if (attachmentCache.has(chunkRef)) {
    return attachmentCache.get(chunkRef)!;
  }

  try {
    const parts = chunkRef.split(':');
    if (parts.length < 4) return chunkRef;
    const docId = parts[1];
    const fieldName = parts[2];
    const totalChunks = parseInt(parts[3], 10);

    const chunksColRef = collection(db, SUBMISSIONS_COLLECTION, docId, `${fieldName}_chunks`);
    const chunks: string[] = new Array(totalChunks).fill('');

    for (let i = 0; i < totalChunks; i++) {
      const chunkDocRef = doc(chunksColRef, `chunk_${i}`);
      const snap = await getDoc(chunkDocRef);
      if (snap.exists()) {
        const d = snap.data();
        chunks[i] = d.data || '';
      }
    }

    const fullData = chunks.join('');
    if (fullData) {
      attachmentCache.set(chunkRef, fullData);
    }
    return fullData || chunkRef;
  } catch (err) {
    console.warn('Error resolving chunked attachment from Firestore:', err);
    return chunkRef;
  }
}

/**
 * Helper to safely open or download any attachment file (Google Drive, Cloud Storage, or Base64/Blob).
 */
export async function openAttachmentFile(url: string, fileName?: string) {
  if (!url) return;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  let actualUrl = url;
  if (url.startsWith('firestore-chunked:')) {
    actualUrl = await resolveChunkedAttachment(url);
  }

  if (actualUrl.startsWith('data:')) {
    try {
      const arr = actualUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName || 'Dokumen.pdf';
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (e) {
      console.error('Error opening data URL:', e);
      window.open(actualUrl, '_blank');
    }
  } else {
    window.open(actualUrl, '_blank', 'noopener,noreferrer');
  }
}

// Save or merge a single submission in Firestore
export async function saveSubmissionToFirestore(item: SubmissionItem) {
  try {
    const rawId = item.submissionId || item.id || `sub-${Date.now()}`;
    const docId = rawId.replace(/\//g, '_');
    const docRef = doc(db, SUBMISSIONS_COLLECTION, docId);

    // Safeguard: Check if file attachments contain large Base64 strings (> 350KB)
    // and split them into Firestore chunk subcollections to prevent "Document exceeds 1MB"
    const processedItem = { ...item };
    const attachmentKeys: Array<'fileUrl' | 'sppFileUrl' | 'notaDinasFileUrl' | 'auditorNotaDinasFileUrl'> = [
      'fileUrl', 'sppFileUrl', 'notaDinasFileUrl', 'auditorNotaDinasFileUrl'
    ];

    for (const key of attachmentKeys) {
      const val = processedItem[key];
      if (typeof val === 'string' && val.startsWith('data:') && val.length > 350000) {
        try {
          const chunkRef = await saveLargeAttachmentToFirestore(docId, key, val);
          processedItem[key] = chunkRef;
        } catch (chunkErr) {
          console.warn(`Could not chunk ${key}, will attempt direct save:`, chunkErr);
        }
      }
    }

    const cleanedData = cleanForFirestore({
      ...processedItem,
      id: item.id || rawId,
      submissionId: item.submissionId || rawId,
      updatedAt: new Date().toISOString()
    });

    await setDoc(docRef, cleanedData, { merge: true });
    console.log(`Successfully saved submission ${docId} to Firebase Firestore.`);
  } catch (err) {
    console.error('Failed to save submission to Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, SUBMISSIONS_COLLECTION);
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
    handleFirestoreError(err, OperationType.DELETE, SUBMISSIONS_COLLECTION);
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
    handleFirestoreError(err, OperationType.WRITE, SUBMISSIONS_COLLECTION);
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


