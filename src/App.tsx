import React, { useState, useEffect } from 'react';
import { SubmissionItem, UserRole, FilterState, VerificationStatus, AuditChecklist, SatkerAccount } from './types';
import { INITIAL_SUBMISSIONS } from './data/initialData';
import { 
  subscribeToSubmissions, 
  saveSubmissionToFirestore,
  deleteSubmissionFromFirestore,
  cleanLegacyDemoItems,
  subscribeToSatkerAccounts,
  saveSatkerAccountToFirestore,
  deleteSatkerAccountFromFirestore
} from './lib/firestoreService';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { TableView } from './components/TableView';
import { ColumnBoard } from './components/ColumnBoard';
import { AuditorVerifyModal } from './components/AuditorVerifyModal';
import { FinanceProcessModal } from './components/FinanceProcessModal';
import { AddSubmissionModal } from './components/AddSubmissionModal';
import { SatkerManagementModal } from './components/SatkerManagementModal';
import { ReviseSubmissionModal } from './components/ReviseSubmissionModal';
import { EditSubmissionModal } from './components/EditSubmissionModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { getWIBTimestamp } from './lib/dateUtils';

const LOCAL_STORAGE_KEY = 'ba_bun_firebase_submissions_v2';
const LOCAL_STORAGE_ACCOUNTS_KEY = 'ba_bun_satker_accounts_v1';

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
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to load saved accounts:", e);
    }
    return [];
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
  const [reviseModalItem, setReviseModalItem] = useState<SubmissionItem | null>(null);
  const [editModalItem, setEditModalItem] = useState<SubmissionItem | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<SubmissionItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSatkerModalOpen, setIsSatkerModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
        setSubmissions(firestoreItems || []);
      },
      (err) => {
        console.warn('Firestore subscription fallback:', err);
      }
    );

    const unsubscribeAccounts = subscribeToSatkerAccounts(
      (firestoreAccounts) => {
        setSatkerAccounts(firestoreAccounts || []);
      },
      (err) => {
        console.warn('Firestore accounts subscription fallback:', err);
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

  // Save Auditor Verification & Checklist (Finance Admin ONLY approves/processes, doesn't alter auditor recommendation)
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
      showToast(`Rekomendasi Auditor tersimpan! Terbaca otomatis di portal Satker.`);
    } catch (e) {
      console.error("Firestore save error:", e);
      showToast(`Tersimpan secara lokal.`);
    }
  };

  // Save Finance Processing (Finance Admin ONLY approves/processes, doesn't alter auditor recommendation)
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
      showToast(`Persetujuan Keuangan tersimpan! SP2D/Proses disetujui.`);
    } catch (e) {
      console.error("Firestore save error:", e);
      showToast(`Tersimpan secara lokal.`);
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
        totalItems={submissions.length}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        
        {/* Metric KPI Overview */}
        <StatsCards items={submissions} currentRole={currentRole} />

        {/* View Display (Column Board or Table View) */}
        {filters.viewMode === 'column' ? (
          <ColumnBoard
            items={submissions}
            currentRole={currentRole}
            onOpenAuditorModal={(item) => setAuditorModalItem(item)}
            onOpenFinanceModal={(item) => setFinanceModalItem(item)}
            onOpenReviseModal={(item) => setReviseModalItem(item)}
            onOpenEditModal={(item) => setEditModalItem(item)}
            onOpenDeleteModal={(item) => setDeleteModalItem(item)}
            onDeleteSubmission={handleDeleteSubmission}
          />
        ) : (
          <TableView
            items={submissions}
            currentRole={currentRole}
            filters={filters}
            onFilterChange={setFilters}
            onOpenAuditorModal={(item) => setAuditorModalItem(item)}
            onOpenFinanceModal={(item) => setFinanceModalItem(item)}
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
        onClose={() => setAuditorModalItem(null)}
        onSaveVerification={handleSaveAuditorVerification}
      />

      {/* Finance Process Modal */}
      <FinanceProcessModal
        item={financeModalItem}
        isOpen={!!financeModalItem}
        currentRole={currentRole}
        onClose={() => setFinanceModalItem(null)}
        onSaveFinanceProcess={handleSaveFinanceProcess}
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
      />

      {/* Admin Keuangan Satker Account Management Modal */}
      <SatkerManagementModal
        isOpen={isSatkerModalOpen}
        onClose={() => setIsSatkerModalOpen(false)}
        accounts={satkerAccounts}
        onAddAccount={handleAddSatkerAccount}
        onToggleAccountStatus={handleToggleSatkerAccountStatus}
        onDeleteAccount={handleDeleteSatkerAccount}
      />

    </div>
  );
}

