import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { SubmissionItem, UserRole, FilterState, VerificationStatus, AuditChecklist, SatkerAccount } from './types';
import { INITIAL_SUBMISSIONS } from './data/initialData';
import { 
  subscribeToSubmissions, 
  saveSubmissionToFirestore,
  deleteSubmissionFromFirestore,
  cleanLegacyDemoItems,
  subscribeToSatkerAccounts,
  saveSatkerAccountToFirestore,
  saveAllSatkerAccountsToFirestore,
  deleteSatkerAccountFromFirestore,
  syncLocalSubmissionsToFirestore
} from './lib/firestoreService';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { TableView } from './components/TableView';
import { ColumnBoard } from './components/ColumnBoard';
import { AuditorVerifyModal } from './components/AuditorVerifyModal';
import { FinanceProcessModal } from './components/FinanceProcessModal';
import { SatkerSppModal } from './components/SatkerSppModal';
import { AddSubmissionModal } from './components/AddSubmissionModal';
import { SatkerManagementModal } from './components/SatkerManagementModal';
import { ReviseSubmissionModal } from './components/ReviseSubmissionModal';
import { EditSubmissionModal } from './components/EditSubmissionModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { getWIBTimestamp } from './lib/dateUtils';

import { DEFAULT_SATKER_ACCOUNTS } from './data/defaultSatkers';

const LOCAL_STORAGE_KEY = 'ba_bun_firebase_submissions_v2';
const LOCAL_STORAGE_ACCOUNTS_KEY = 'ba_bun_satker_accounts_v1';

function mergeWithDefaultSatkers(incoming: SatkerAccount[]): SatkerAccount[] {
  const map = new Map<string, SatkerAccount>();
  
  // First load all default 17 satkers
  DEFAULT_SATKER_ACCOUNTS.forEach(acc => {
    map.set(acc.username.toLowerCase(), acc);
  });

  // Merge incoming accounts (overriding defaults if custom attributes like namaPetugas/password/whatsapp exist)
  if (Array.isArray(incoming)) {
    incoming.forEach(acc => {
      if (acc && acc.username) {
        const key = acc.username.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          map.set(key, { ...existing, ...acc });
        } else {
          map.set(key, acc);
        }
      }
    });
  }

  return Array.from(map.values());
}

export default function App() {
  // Authentication & Login State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [satkerName, setSatkerName] = useState<string>('');

  // Role State: Satker, Admin Auditor, or Admin Keuangan
  const [currentRole, setCurrentRole] = useState<UserRole>('satker');

  // Satker Accounts State (Managed by Admin Keuangan)
  const [satkerAccounts, setSatkerAccounts] = useState<SatkerAccount[]>(() => {
    try {
      const savedAccs = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
      if (savedAccs) {
        const parsed = JSON.parse(savedAccs);
        if (Array.isArray(parsed)) return mergeWithDefaultSatkers(parsed);
      }
    } catch (e) {
      console.error("Failed to load saved accounts:", e);
    }
    return DEFAULT_SATKER_ACCOUNTS;
  });

  // Save Accounts to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(satkerAccounts));
    } catch (e) {
      console.error("Failed to save accounts to localStorage:", e);
    }
  }, [satkerAccounts]);

  // Filter & View Mode
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    satker: '',
    bidang: '',
    status: '',
    viewMode: 'table',
  });

  // Handle Login
  const handleLogin = (role: UserRole, user: string, satkerDisplay?: string) => {
    setCurrentRole(role);
    setUserName(user);
    if (role === 'satker') {
      setSatkerName(satkerDisplay || 'Kejari Bandar Lampung');
    } else {
      setSatkerName('');
    }
    setIsLoggedIn(true);
  };

  // Handle Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Submissions state
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(() => {
    try {
      localStorage.removeItem('ba_bun_dashboard_submissions_v1');
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load saved state:", e);
    }
    return [];
  });

  // Modals state
  const [auditorModalItem, setAuditorModalItem] = useState<SubmissionItem | null>(null);
  const [financeModalItem, setFinanceModalItem] = useState<SubmissionItem | null>(null);
  const [sppModalItem, setSppModalItem] = useState<SubmissionItem | null>(null);
  const [reviseModalItem, setReviseModalItem] = useState<SubmissionItem | null>(null);
  const [editModalItem, setEditModalItem] = useState<SubmissionItem | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<SubmissionItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSatkerModalOpen, setIsSatkerModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Firestore Error Banner State
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Save to LocalStorage whenever submissions change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(submissions));
    } catch (e) {
      console.error("Failed to save state to localStorage:", e);
    }
  }, [submissions]);

  // Real-time Firebase Firestore Listener & Legacy Clean
  useEffect(() => {
    // Purge legacy demo data if present in Firebase
    cleanLegacyDemoItems();

    const unsubscribeSubmissions = subscribeToSubmissions(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length > 0) {
          setSubmissions(firestoreItems);
          setFirestoreError(null);
        } else {
          // If Firestore is empty, sync existing local submissions to Firestore
          try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSubmissions(parsed);
                syncLocalSubmissionsToFirestore(parsed);
              }
            }
          } catch (e) {
            console.error("Local submissions sync error:", e);
          }
        }
      },
      (err) => {
        console.warn('Firestore submission subscription error:', err);
        setFirestoreError(err?.message || String(err));
        try {
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSubmissions(parsed);
            }
          }
        } catch (e) {
          console.error("Local fallback error:", e);
        }
      }
    );

    const unsubscribeAccounts = subscribeToSatkerAccounts(
      (firestoreAccounts) => {
        if (firestoreAccounts && firestoreAccounts.length > 0) {
          setSatkerAccounts(mergeWithDefaultSatkers(firestoreAccounts));
          setFirestoreError(null);
        } else {
          // If Firestore is empty, sync default & local accounts to Firestore
          try {
            const savedAccs = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
            let merged = DEFAULT_SATKER_ACCOUNTS;
            if (savedAccs) {
              const parsed = JSON.parse(savedAccs);
              if (Array.isArray(parsed)) {
                merged = mergeWithDefaultSatkers(parsed);
              }
            }
            setSatkerAccounts(merged);
            saveAllSatkerAccountsToFirestore(merged);
          } catch (e) {
            console.error("Local accounts sync error:", e);
          }
        }
      },
      (err) => {
        console.warn('Firestore accounts subscription error:', err);
        setFirestoreError(err?.message || String(err));
        try {
          const savedAccs = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
          if (savedAccs) {
            const parsed = JSON.parse(savedAccs);
            if (Array.isArray(parsed)) {
              setSatkerAccounts(mergeWithDefaultSatkers(parsed));
            }
          }
        } catch (e) {
          console.error("Local accounts fallback error:", e);
        }
      }
    );

    return () => {
      unsubscribeSubmissions();
      unsubscribeAccounts();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleDeleteSubmission = async (docId: string, submissionId?: string) => {
    try {
      if (docId) await deleteSubmissionFromFirestore(docId);
      if (submissionId && submissionId !== docId) {
        await deleteSubmissionFromFirestore(submissionId);
      }
      setSubmissions(prev => prev.filter(s => s.submissionId !== docId && s.id !== docId && s.submissionId !== submissionId && s.id !== submissionId));
      showToast(`Pengajuan berhasil dihapus dari database.`);
    } catch (e) {
      console.error("Delete error:", e);
      setSubmissions(prev => prev.filter(s => s.submissionId !== docId && s.id !== docId && s.submissionId !== submissionId && s.id !== submissionId));
      showToast(`Pengajuan telah dihapus.`);
    }
  };

  // Save Auditor Verification & Checklist
  const handleSaveAuditorVerification = async (
    itemId: string,
    status: VerificationStatus,
    checklist: AuditChecklist,
    recommendation: string,
    notes: string,
    auditorName: string
  ) => {
    const now = getWIBTimestamp();
    const targetItem = submissions.find(item => item.id === itemId || item.submissionId === itemId);
    if (!targetItem) return;

    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      userRole: 'auditor' as UserRole,
      userName: auditorName || 'Admin Auditor',
      action: `Pemeriksaan Auditor: Status diubah ke "${status.toUpperCase()}"`,
      note: recommendation ? `Rekomendasi: ${recommendation}` : notes
    };

    const updatedItem: SubmissionItem = {
      ...targetItem,
      status,
      checklist,
      auditorRecommendation: recommendation,
      auditorNotes: notes,
      auditorName,
      verifiedAt: now,
      history: [newLog, ...(targetItem.history || [])]
    };

    // Optimistic UI update
    setSubmissions(prev => prev.map(item => (item.id === itemId || item.submissionId === itemId) ? updatedItem : item));

    try {
      await saveSubmissionToFirestore(updatedItem);
      showToast(`Rekomendasi Auditor tersimpan! Terbaca otomatis di portal Admin Keuangan.`);
    } catch (e) {
      console.error("Firestore save error:", e);
      showToast(`Tersimpan secara lokal.`);
    }
  };

  // Save Nota Dinas Verifikator Keuangan
  const handleSaveNotaDinas = async (
    itemId: string,
    notaDinasNumber: string,
    notaDinasFileUrl: string,
    notaDinasFileName: string,
    notaDinasNotes: string
  ) => {
    const now = getWIBTimestamp();
    const targetItem = submissions.find(item => item.id === itemId || item.submissionId === itemId);
    if (!targetItem) return;

    const newLog = {
      id: `log-nd-${Date.now()}`,
      timestamp: now,
      userRole: 'verifikator' as UserRole,
      userName: 'Verifikator Keuangan',
      action: `Nota Dinas Keuangan Diterbitkan: ${notaDinasNumber}`,
      note: notaDinasNotes || 'Nota Dinas dilampirkan & diteruskan ke Auditor.'
    };

    const updatedItem: SubmissionItem = {
      ...targetItem,
      notaDinasNumber,
      notaDinasFileUrl,
      notaDinasFileName,
      notaDinasNotes,
      notaDinasCreatedAt: now,
      status: 'sedang_diperiksa', // Forward to Auditor review stage
      history: [newLog, ...(targetItem.history || [])]
    };

    setSubmissions(prev => prev.map(item => (item.id === itemId || item.submissionId === itemId) ? updatedItem : item));

    try {
      await saveSubmissionToFirestore(updatedItem);
      showToast(`Nota Dinas (${notaDinasNumber}) berhasil diterbitkan & diteruskan ke Auditor!`);
    } catch (e) {
      console.error("Firestore save error:", e);
      showToast(`Nota Dinas tersimpan secara lokal.`);
    }
  };

  // Save Final Finance Approval (Admin Keuangan)
  const handleSaveFinanceProcess = async (
    itemId: string,
    status: VerificationStatus,
    financeStatus: string,
    financeNotes: string
  ) => {
    const now = getWIBTimestamp();
    const targetItem = submissions.find(item => item.id === itemId || item.submissionId === itemId);
    if (!targetItem) return;

    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      userRole: 'keuangan' as UserRole,
      userName: 'Admin Keuangan BA BUN',
      action: `Persetujuan Keuangan: "${financeStatus}"`,
      note: financeNotes
    };

    const updatedItem: SubmissionItem = {
      ...targetItem,
      status,
      financeStatus,
      financeNotes,
      financeProcessedAt: now,
      history: [newLog, ...(targetItem.history || [])]
    };

    setSubmissions(prev => prev.map(item => (item.id === itemId || item.submissionId === itemId) ? updatedItem : item));

    try {
      await saveSubmissionToFirestore(updatedItem);
      showToast(`Persetujuan Keuangan tersimpan! Satker kini dapat mengisikan nomor SPP.`);
    } catch (e) {
      console.error("Firestore save error:", e);
      showToast(`Tersimpan secara lokal.`);
    }
  };

  // Handle Satker SPP Input
  const handleSaveSppData = async (
    itemId: string,
    sppNumber: string,
    sppFileUrl: string,
    sppFileName: string,
    sppNotes: string
  ) => {
    const now = getWIBTimestamp();
    const targetItem = submissions.find(item => item.id === itemId || item.submissionId === itemId);
    if (!targetItem) return;

    const newLog = {
      id: `log-spp-${Date.now()}`,
      timestamp: now,
      userRole: 'satker' as UserRole,
      userName: satkerName || userName || 'User Satker',
      action: `Input Data SPP Satker: ${sppNumber}`,
      note: sppNotes || 'Dokumen & Nomor SPP telah dilampirkan oleh Satker.'
    };

    const updatedItem: SubmissionItem = {
      ...targetItem,
      sppNumber,
      sppFileUrl,
      sppFileName,
      sppNotes,
      sppSubmittedAt: now,
      history: [newLog, ...(targetItem.history || [])]
    };

    setSubmissions(prev => prev.map(item => (item.id === itemId || item.submissionId === itemId) ? updatedItem : item));

    try {
      await saveSubmissionToFirestore(updatedItem);
      showToast(`Data SPP (${sppNumber}) berhasil disimpan & terkirim!`);
    } catch (e) {
      console.error("Firestore save error:", e);
      showToast(`Data SPP tersimpan secara lokal.`);
    }
  };

  // Handle Satker Resubmit Revision
  const handleSaveRevision = async (
    itemId: string,
    fileUrl: string,
    fileName: string,
    nominal: number,
    notesFromSatker: string
  ) => {
    const now = getWIBTimestamp();
    const targetItem = submissions.find(item => item.id === itemId || item.submissionId === itemId);
    if (!targetItem) return;

    const newLog = {
      id: `log-revise-${Date.now()}`,
      timestamp: now,
      userRole: 'satker' as UserRole,
      userName: satkerName || userName || 'User Satker',
      action: 'Hasil Perbaikan Dokumen Dikirim Ulang Ke Auditor',
      note: notesFromSatker || 'Satker telah memperbaiki berkas permohonan.'
    };

    const updatedItem: SubmissionItem = {
      ...targetItem,
      fileUrl,
      fileName,
      nominal: nominal || targetItem.nominal,
      notesFromSatker,
      status: 'sedang_diperiksa', // Reset to under review for Auditor
      history: [newLog, ...(targetItem.history || [])]
    };

    setSubmissions(prev => prev.map(item => (item.id === itemId || item.submissionId === itemId) ? updatedItem : item));

    try {
      await saveSubmissionToFirestore(updatedItem);
      showToast(`Dokumen perbaikan berhasil dikirim ke Admin Auditor!`);
    } catch (e) {
      console.error("Firestore save error:", e);
      showToast(`Dokumen tersimpan secara lokal.`);
    }
  };

  // Handle Editing Submission Details
  const handleSaveEditSubmission = async (
    itemId: string,
    updatedData: {
      satker: string;
      bidang: string;
      jenisPengajuan: string;
      nominal: number;
      fileName: string;
      fileUrl: string;
      notesFromSatker: string;
    }
  ) => {
    const now = getWIBTimestamp();
    const targetItem = submissions.find(item => item.id === itemId || item.submissionId === itemId);
    if (!targetItem) return;

    const newLog = {
      id: `log-edit-${Date.now()}`,
      timestamp: now,
      userRole: currentRole,
      userName: satkerName || userName || 'User',
      action: `Data Permohonan Diperbarui/Edit`,
      note: `Jenis: ${updatedData.jenisPengajuan} | Nominal: Rp ${(updatedData.nominal || 0).toLocaleString('id-ID')}`
    };

    const updatedItem: SubmissionItem = {
      ...targetItem,
      satker: updatedData.satker,
      bidang: updatedData.bidang,
      jenisPengajuan: updatedData.jenisPengajuan,
      nominal: updatedData.nominal,
      fileName: updatedData.fileName,
      fileUrl: updatedData.fileUrl,
      notesFromSatker: updatedData.notesFromSatker,
      history: [newLog, ...(targetItem.history || [])]
    };

    setSubmissions(prev => prev.map(item => (item.id === itemId || item.submissionId === itemId) ? updatedItem : item));

    try {
      await saveSubmissionToFirestore(updatedItem);
      showToast(`Data permohonan ${updatedData.satker} berhasil diperbarui!`);
    } catch (e) {
      console.error("Firestore save error:", e);
      showToast(`Perubahan tersimpan secara lokal.`);
    }
  };

  // Add Satker Entry Submission to Firebase
  const handleAddSubmission = async (newSub: Omit<SubmissionItem, 'id' | 'history'>) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const created: SubmissionItem = {
      ...newSub,
      id: `satker-sub-${Date.now()}`,
      history: [
        {
          id: `log-create-${Date.now()}`,
          timestamp: now,
          userRole: currentRole,
          userName: satkerName || userName || (currentRole === 'satker' ? 'User Satker' : 'Admin Entry'),
          action: `Permohonan BA BUN Di-entry oleh ${satkerName || newSub.satker}`,
          note: `Nominal: Rp ${(newSub.nominal || 0).toLocaleString('id-ID')} | Berkas: ${newSub.fileName}`
        }
      ]
    };

    setSubmissions(prev => [created, ...prev]);

    try {
      await saveSubmissionToFirestore(created);
      showToast(`Pengajuan ${newSub.satker} berhasil di-entry & tersimpan!`);
    } catch (e) {
      console.error("Firestore save error:", e);
      showToast(`Pengajuan ditambahkan secara lokal.`);
    }
  };

  // Satker Account Management Handlers (Admin Keuangan)
  const handleAddSatkerAccount = async (acc: Omit<SatkerAccount, 'id' | 'createdAt'>) => {
    const newAcc: SatkerAccount = {
      ...acc,
      id: `acc-${Date.now()}`,
      createdAt: getWIBTimestamp()
    };
    setSatkerAccounts(prev => [newAcc, ...prev]);
    await saveSatkerAccountToFirestore(newAcc);
    showToast(`Akun ${newAcc.satkerName} (${newAcc.username}) berhasil ditambahkan!`);
  };

  const handleUpdateSatkerAccount = async (updatedAcc: SatkerAccount) => {
    setSatkerAccounts(prev => prev.map(acc => acc.id === updatedAcc.id ? updatedAcc : acc));
    await saveSatkerAccountToFirestore(updatedAcc);
    showToast(`Data akun ${updatedAcc.satkerName} (${updatedAcc.username}) berhasil diperbarui!`);
  };

  const handleToggleSatkerAccountStatus = async (id: string) => {
    const target = satkerAccounts.find(acc => acc.id === id);
    if (!target) return;
    const updated: SatkerAccount = {
      ...target,
      status: target.status === 'aktif' ? 'nonaktif' : 'aktif'
    };
    setSatkerAccounts(prev => prev.map(acc => (acc.id === id ? updated : acc)));
    await saveSatkerAccountToFirestore(updated);
    showToast(`Status akun ${target.satkerName} diubah ke ${updated.status}.`);
  };

  const handleDeleteSatkerAccount = async (id: string) => {
    const target = satkerAccounts.find(acc => acc.id === id);
    setSatkerAccounts(prev => prev.filter(acc => acc.id !== id));
    await deleteSatkerAccountFromFirestore(id);
    if (target) {
      showToast(`Akun ${target.satkerName} berhasil dihapus.`);
    }
  };

  // Submissions Data Isolation:
  // User Satker logged in ONLY sees their own Satker's submissions.
  // Internal Kejati roles (verifikator, keuangan, auditor) see all submissions.
  const visibleSubmissions = React.useMemo(() => {
    if (currentRole === 'satker' && satkerName) {
      const sNameLower = satkerName.trim().toLowerCase();
      const uNameLower = userName.trim().toLowerCase();
      return submissions.filter(item => {
        const itemSatkerLower = item.satker?.trim().toLowerCase() || '';
        const itemUserLower = item.createdBySatkerUser?.trim().toLowerCase() || '';
        return itemSatkerLower === sNameLower || itemUserLower === uNameLower;
      });
    }
    return submissions;
  }, [submissions, currentRole, satkerName, userName]);

  const handleFilterChange = (part: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...part }));
  };

  if (!isLoggedIn) {
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        satkerAccounts={satkerAccounts}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-amber-400 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Background Soft Yellow Radial Glow Highlights */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-amber-200/30 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-yellow-200/30 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs px-4.5 py-3.5 rounded-2xl shadow-xl border border-amber-300 flex items-center gap-2.5 animate-bounce">
          <span className="h-2 w-2 rounded-full bg-slate-950"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentRole={currentRole}
        userName={userName}
        satkerName={satkerName}
        onLogout={handleLogout}
        filters={filters}
        onFilterChange={handleFilterChange}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSatkerModal={() => setIsSatkerModalOpen(true)}
        totalItems={visibleSubmissions.length}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        
        {/* Firestore Rules Instructions Banner if permission issue occurs */}
        {firestoreError && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4.5 shadow-sm text-xs text-slate-800 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-amber-950 text-sm">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <span>Petunjuk Sinkronisasi Firebase Firestore (Project 'ba-bun')</span>
              </div>
              <button 
                onClick={() => setFirestoreError(null)}
                className="text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-amber-200/50 font-bold text-xs"
              >
                Tutup ✕
              </button>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium">
              Database Firebase di Google Cloud saat ini membatasi hak akses (Rules default masih mengunci data). Agar data dapat tersimpan & tersinkronisasi antar device melalui project <strong className="font-extrabold text-amber-950">ba-bun</strong>, ikuti 3 langkah berikut di Firebase Console:
            </p>
            <div className="bg-slate-900 text-amber-300 font-mono text-[11px] p-3.5 rounded-xl border border-slate-800 space-y-1.5 shadow-inner">
              <p className="text-slate-400 font-sans font-extrabold text-[10px] uppercase tracking-wider">Langkah Konfigurasi di Firebase Console:</p>
              <p>1. Buka <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline text-amber-400 font-bold">console.firebase.google.com</a> → Pilih Project <strong>ba-bun</strong> → <strong>Firestore Database</strong> → Tab <strong>Rules</strong></p>
              <p>2. Salin dan ganti aturan keamanan menjadi:</p>
              <pre className="text-emerald-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800 my-1 overflow-x-auto text-[11px] leading-snug">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
              </pre>
              <p>3. Klik tombol <strong className="text-white bg-amber-600 px-1.5 py-0.5 rounded text-[10px]">Publish</strong>. Data dari semua device akan langsung tersambung otomatis!</p>
            </div>
          </div>
        )}

        {/* Metric KPI Overview */}

        <StatsCards items={visibleSubmissions} currentRole={currentRole} />

        {/* View Display (Column Board or Table View) */}
        {filters.viewMode === 'column' ? (
          <ColumnBoard
            items={visibleSubmissions}
            currentRole={currentRole}
            onOpenAuditorModal={(item) => setAuditorModalItem(item)}
            onOpenFinanceModal={(item) => setFinanceModalItem(item)}
            onOpenSppModal={(item) => setSppModalItem(item)}
            onOpenReviseModal={(item) => setReviseModalItem(item)}
            onOpenEditModal={(item) => setEditModalItem(item)}
            onOpenDeleteModal={(item) => setDeleteModalItem(item)}
            onDeleteSubmission={handleDeleteSubmission}
          />
        ) : (
          <TableView
            items={visibleSubmissions}
            currentRole={currentRole}
            filters={filters}
            onFilterChange={setFilters}
            onOpenAuditorModal={(item) => setAuditorModalItem(item)}
            onOpenFinanceModal={(item) => setFinanceModalItem(item)}
            onOpenSppModal={(item) => setSppModalItem(item)}
            onOpenReviseModal={(item) => setReviseModalItem(item)}
            onOpenEditModal={(item) => setEditModalItem(item)}
            onOpenDeleteModal={(item) => setDeleteModalItem(item)}
            onDeleteSubmission={handleDeleteSubmission}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white/90 border-t border-amber-200/80 backdrop-blur-md py-4.5 text-center text-xs text-slate-600 relative z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>Bagian Anggaran Bendahara Umum Negara • Kejati Lampung</span>
          </div>
          <div className="text-emerald-800 font-bold flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Sistem Database Real-Time & Akses Berkas Link URL</span>
          </div>
        </div>
      </footer>

      {/* Auditor Verification Modal */}
      <AuditorVerifyModal
        item={auditorModalItem}
        isOpen={!!auditorModalItem}
        satkerAccounts={satkerAccounts}
        onClose={() => setAuditorModalItem(null)}
        onSaveVerification={handleSaveAuditorVerification}
      />

      {/* Finance Process Modal */}
      <FinanceProcessModal
        item={financeModalItem}
        isOpen={!!financeModalItem}
        currentRole={currentRole}
        satkerAccounts={satkerAccounts}
        onClose={() => setFinanceModalItem(null)}
        onSaveNotaDinas={handleSaveNotaDinas}
        onSaveFinanceProcess={handleSaveFinanceProcess}
      />

      {/* Satker SPP Input Form Modal */}
      <SatkerSppModal
        item={sppModalItem}
        isOpen={!!sppModalItem}
        onClose={() => setSppModalItem(null)}
        onSaveSpp={handleSaveSppData}
      />

      {/* Satker Resubmit Revision Modal */}
      <ReviseSubmissionModal
        item={reviseModalItem}
        isOpen={!!reviseModalItem}
        onClose={() => setReviseModalItem(null)}
        onSaveRevision={handleSaveRevision}
      />

      {/* Edit Entry Submission Modal */}
      <EditSubmissionModal
        item={editModalItem}
        isOpen={!!editModalItem}
        onClose={() => setEditModalItem(null)}
        onSaveEdit={handleSaveEditSubmission}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        item={deleteModalItem}
        isOpen={!!deleteModalItem}
        onClose={() => setDeleteModalItem(null)}
        onConfirmDelete={handleDeleteSubmission}
      />

      {/* Add New Entry Form Modal */}
      <AddSubmissionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSubmission={handleAddSubmission}
        defaultSatkerName={satkerName}
        currentRole={currentRole}
        satkerAccounts={satkerAccounts}
      />

      {/* Admin Keuangan Satker Account Management Modal */}
      <SatkerManagementModal
        isOpen={isSatkerModalOpen}
        onClose={() => setIsSatkerModalOpen(false)}
        accounts={satkerAccounts}
        onAddAccount={handleAddSatkerAccount}
        onUpdateAccount={handleUpdateSatkerAccount}
        onToggleAccountStatus={handleToggleSatkerAccountStatus}
        onDeleteAccount={handleDeleteSatkerAccount}
      />

    </div>
  );
}
