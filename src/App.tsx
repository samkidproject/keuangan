import React, { useState, useEffect, useCallback } from 'react';
import { SubmissionItem, UserRole, FilterState, VerificationStatus, AuditChecklist } from './types';
import { 
  INITIAL_SUBMISSIONS, 
  SPREADSHEET_CSV_URL, 
  parseGoogleSheetsCSV 
} from './data/initialData';
import { 
  subscribeToSubmissions, 
  saveSubmissionToFirestore, 
  syncSpreadsheetItemsToFirestore 
} from './lib/firestoreService';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { ColumnBoard } from './components/ColumnBoard';
import { TableView } from './components/TableView';
import { AuditorVerifyModal } from './components/AuditorVerifyModal';
import { FinanceProcessModal } from './components/FinanceProcessModal';
import { AddSubmissionModal } from './components/AddSubmissionModal';
import { SyncSheetModal } from './components/SyncSheetModal';

const LOCAL_STORAGE_KEY = 'ba_bun_dashboard_submissions_v1';

export default function App() {
  // Authentication & Login State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');

  // Role State: Admin Auditor or Admin Keuangan
  const [currentRole, setCurrentRole] = useState<UserRole>('auditor');

  // Filter & View Mode
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    satker: '',
    bidang: '',
    status: '',
    viewMode: 'table',
  });

  // Handle Login
  const handleLogin = (role: UserRole, user: string) => {
    setCurrentRole(role);
    setUserName(user);
    setIsLoggedIn(true);
  };

  // Handle Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Submissions state
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load saved state:", e);
    }
    return INITIAL_SUBMISSIONS;
  });

  // Modals state
  const [auditorModalItem, setAuditorModalItem] = useState<SubmissionItem | null>(null);
  const [financeModalItem, setFinanceModalItem] = useState<SubmissionItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string | null>("2026-07-27 08:00");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save to LocalStorage whenever submissions change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(submissions));
    } catch (e) {
      console.error("Failed to save state to localStorage:", e);
    }
  }, [submissions]);

  // Real-time Firebase Firestore Listener
  useEffect(() => {
    const unsubscribe = subscribeToSubmissions(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length > 0) {
          setSubmissions(firestoreItems);
        }
      },
      (err) => {
        console.warn('Firestore subscription fallback:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Live Sync from Google Sheets CSV into Firebase Firestore
  const handleSyncGoogleSheets = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(SPREADSHEET_CSV_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const csvText = await res.text();
      const parsedItems = parseGoogleSheetsCSV(csvText);

      if (parsedItems.length > 0) {
        await syncSpreadsheetItemsToFirestore(parsedItems);
        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastSynced(`Hari ini ${timeStr}`);
        showToast(`Tersambung & disinkronkan dengan Google Sheets & Firebase!`);
      } else {
        showToast(`Data Google Sheets berhasil diperiksa.`);
      }
    } catch (err) {
      console.error("Sync error:", err);
      showToast(`Menggunakan data Firebase tersimpan. (${err instanceof Error ? err.message : 'Network error'})`);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Save Auditor Verification & Checklist to Firebase
  const handleSaveAuditorVerification = async (
    itemId: string,
    status: VerificationStatus,
    checklist: AuditChecklist,
    recommendation: string,
    notes: string,
    auditorName: string
  ) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
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
      showToast(`Rekomendasi Auditor tersimpan di Firebase! Terbaca otomatis di perangkat lain.`);
    } catch (e) {
      console.error("Firestore save error:", e);
      showToast(`Tersimpan secara lokal. Gagal menyimpan ke Firebase Firestore.`);
    }
  };

  // Save Finance Processing to Firebase
  const handleSaveFinanceProcess = async (
    itemId: string,
    status: VerificationStatus,
    financeStatus: string,
    financeNotes: string
  ) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const targetItem = submissions.find(item => item.id === itemId || item.submissionId === itemId);
    if (!targetItem) return;

    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      userRole: 'keuangan' as UserRole,
      userName: 'Admin Keuangan BA BUN',
      action: `Pembaruan Keuangan: "${financeStatus}"`,
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

    // Optimistic UI update
    setSubmissions(prev => prev.map(item => (item.id === itemId || item.submissionId === itemId) ? updatedItem : item));

    try {
      await saveSubmissionToFirestore(updatedItem);
      showToast(`Progress Keuangan tersimpan di Firebase! SP2D/Proses disetujui.`);
    } catch (e) {
      console.error("Firestore save error:", e);
      showToast(`Tersimpan secara lokal.`);
    }
  };

  // Add Manual Submission to Firebase
  const handleAddSubmission = async (newSub: Omit<SubmissionItem, 'id' | 'history'>) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const created: SubmissionItem = {
      ...newSub,
      id: `manual-${Date.now()}`,
      history: [
        {
          id: `log-create-${Date.now()}`,
          timestamp: now,
          userRole: currentRole,
          userName: currentRole === 'auditor' ? 'Admin Auditor' : 'Admin Keuangan',
          action: 'Pengajuan Baru Diinputkan',
          note: `Satker ${newSub.satker} - ${newSub.bidang}`
        }
      ]
    };

    setSubmissions(prev => [created, ...prev]);

    try {
      await saveSubmissionToFirestore(created);
      showToast(`Pengajuan baru untuk ${newSub.satker} tersimpan di Firebase!`);
    } catch (e) {
      console.error("Firestore save error:", e);
      showToast(`Ditambahkan secara lokal.`);
    }
  };

  // Quick move status
  const handleQuickMoveStatus = async (itemId: string, newStatus: VerificationStatus) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const targetItem = submissions.find(item => item.id === itemId || item.submissionId === itemId);
    if (!targetItem) return;

    const updatedItem: SubmissionItem = {
      ...targetItem,
      status: newStatus,
      history: [
        {
          id: `log-move-${Date.now()}`,
          timestamp: now,
          userRole: currentRole,
          userName: currentRole === 'auditor' ? 'Admin Auditor' : 'Admin Keuangan',
          action: `Perubahan Status Cepat ke "${newStatus}"`
        },
        ...(targetItem.history || [])
      ]
    };

    setSubmissions(prev => prev.map(item => (item.id === itemId || item.submissionId === itemId) ? updatedItem : item));

    try {
      await saveSubmissionToFirestore(updatedItem);
      showToast(`Status tersimpan di Firebase!`);
    } catch (e) {
      console.error("Firestore save error:", e);
    }
  };

  const handleFilterChange = (part: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...part }));
  };

  // Auto sync on initial load
  useEffect(() => {
    handleSyncGoogleSheets();
  }, [handleSyncGoogleSheets]);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
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
        onRoleChange={setCurrentRole}
        onLogout={handleLogout}
        filters={filters}
        onFilterChange={handleFilterChange}
        onSyncSheet={handleSyncGoogleSheets}
        isSyncing={isSyncing}
        lastSynced={lastSynced}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        totalItems={submissions.length}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        
        {/* Metric KPI Overview */}
        <StatsCards items={submissions} currentRole={currentRole} />

        {/* Single Table View Display */}
        <TableView
          items={submissions}
          currentRole={currentRole}
          filters={filters}
          onFilterChange={setFilters}
          onOpenAuditorModal={(item) => setAuditorModalItem(item)}
          onOpenFinanceModal={(item) => setFinanceModalItem(item)}
        />

      </main>

      {/* Footer */}
      <footer className="bg-white/90 border-t border-amber-200/80 backdrop-blur-md py-4.5 text-center text-xs text-slate-600 relative z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Sub Bagian Keuangan BA BUN</span>
            <span className="text-amber-300">•</span>
            <span>Bagian Anggaran Bendahara Umum Negara</span>
          </div>
          <div className="text-amber-800 font-semibold">
            Terintegrasi Google Spreadsheet Online Real-Time
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
        onClose={() => setFinanceModalItem(null)}
        onSaveFinanceProcess={handleSaveFinanceProcess}
      />

      {/* Add New Submission Modal */}
      <AddSubmissionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSubmission={handleAddSubmission}
      />

      {/* Sync Spreadsheet Details Modal */}
      <SyncSheetModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncNow={handleSyncGoogleSheets}
        isSyncing={isSyncing}
        lastSynced={lastSynced}
        itemsCount={submissions.length}
      />

    </div>
  );
}
