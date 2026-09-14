import React from 'react';
import { UserRole, FilterState } from '../types';
import { 
  LogOut,
  UserCheck,
  Users,
  FilePlus2,
  Table,
  Columns3,
  Trophy,
  Sparkles,
  Coins,
  Cloud,
  RefreshCw
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  userName?: string;
  satkerName?: string;
  onLogout: () => void;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onOpenAddModal?: () => void;
  onOpenSatkerModal?: () => void;
  onOpenPaguModal?: () => void;
  totalItems: number;
  isCloudSynced?: boolean;
  onSyncNow?: () => void;
  isSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  userName,
  satkerName,
  onLogout,
  filters,
  onFilterChange,
  onOpenAddModal,
  onOpenSatkerModal,
  onOpenPaguModal,
  totalItems,
  isCloudSynced = true,
  onSyncNow,
  isSyncing = false,
}) => {

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-amber-200/80 shadow-xs">
      {/* Top Banner & Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Agency Identity */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-white p-1 flex items-center justify-center border border-amber-300/80 shadow-xs shrink-0">
              <img 
                src="https://lh3.googleusercontent.com/d/1Nn53DjvWyFisFEjeWWblr3YAkRCbYYls" 
                alt="Kejaksaan RI" 
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-black tracking-tight text-slate-900 font-sans">
                  {currentRole === 'satker'
                    ? `Portal Satker ${satkerName || 'Kejaksaan Negeri'}`
                    : currentRole === 'verifikator'
                    ? 'Portal Verifikator Keuangan'
                    : currentRole === 'auditor'
                    ? 'Portal Auditor Kejati Lampung'
                    : 'Portal Admin Keuangan BA BUN'}
                </h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border shadow-2xs ${
                  currentRole === 'satker'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : currentRole === 'verifikator'
                    ? 'bg-yellow-100 text-yellow-950 border-yellow-400'
                    : currentRole === 'auditor'
                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}>
                  {currentRole === 'satker'
                    ? 'User Satker Kejaksaan Negeri'
                    : currentRole === 'verifikator'
                    ? 'Verifikator Keuangan'
                    : currentRole === 'auditor'
                    ? 'Akses Admin Auditor'
                    : 'Akses Admin Keuangan'}
                </span>
              </div>
              <p className="text-xs text-slate-600 flex items-center gap-2 mt-0.5 font-medium">
                <span>
                  {currentRole === 'satker'
                    ? 'Entry Form Permohonan BA BUN & Pantau Status Pengajuan'
                    : currentRole === 'verifikator'
                    ? 'Verifikasi Berkas Awal & Penerbitan Nota Dinas Verifikator Keuangan'
                    : currentRole === 'auditor'
                    ? 'Pemeriksaan Verifikasi Checklist & Rekomendasi Auditor'
                    : 'Persetujuan Akhir BA BUN & Pengelolaan Akun Satker'}
                </span>
                <span className="text-amber-300">•</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Sistem Real-Time Live
                </span>
              </p>
            </div>
          </div>

          {/* User Account Controls & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Entry Form Button ONLY for Satker */}
            {currentRole === 'satker' && onOpenAddModal && (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-2xs transition-all flex items-center gap-1.5 transform active:scale-95 cursor-pointer"
              >
                <FilePlus2 className="h-4 w-4" />
                <span>+ Entry Permohonan Baru</span>
              </button>
            )}

            {/* Manage Satker Accounts Button for Admin Keuangan */}
            {currentRole === 'keuangan' && onOpenSatkerModal && (
              <button
                type="button"
                onClick={onOpenSatkerModal}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Kelola Akun Login Satker Kejaksaan Negeri"
              >
                <Users className="h-4 w-4 text-amber-700" />
                <span>Kelola Akun Satker</span>
              </button>
            )}

            {/* Manage Pagu DIPA Satker - Exclusively for Admin Keuangan */}
            {currentRole === 'keuangan' && onOpenPaguModal && (
              <button
                type="button"
                onClick={onOpenPaguModal}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Entry & Atur Pagu DIPA Anggaran Masing-Masing Satker"
              >
                <Coins className="h-4 w-4 text-slate-950" />
                <span>Entry Pagu Satker</span>
              </button>
            )}

            {/* Live Cloud Firestore Sync Indicator */}
            <div 
              onClick={onSyncNow}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all shadow-2xs ${
                isCloudSynced 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100' 
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
              title="Cloud Firestore Aktif: Seluruh data (permohonan, verifikasi, SPP, pagu DIPA, akun satker) tersimpan otomatis ke Firebase. Klik untuk sinkronkan ulang."
            >
              {isSyncing ? (
                <RefreshCw className="h-3.5 w-3.5 text-emerald-700 animate-spin" />
              ) : (
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isCloudSynced ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    isCloudSynced ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}></span>
                </span>
              )}
              <Cloud className={`h-3.5 w-3.5 ${isCloudSynced ? 'text-emerald-700' : 'text-amber-700'}`} />
              <span className="text-[11px] font-black hidden sm:inline">
                {isSyncing ? 'Menyinkronkan...' : isCloudSynced ? 'Firebase Cloud' : 'Sinkronisasi'}
              </span>
            </div>

            {/* Active User Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
              <UserCheck className={`h-4 w-4 ${
                currentRole === 'satker' ? 'text-amber-600' : currentRole === 'auditor' ? 'text-blue-600' : 'text-emerald-600'
              }`} />
              <div className="text-left">
                <span className="block text-[10px] text-slate-500 font-bold leading-tight">Pengguna:</span>
                <span className="block text-xs font-black text-slate-900 leading-tight">
                  {satkerName || userName || 'Pengguna'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Keluar dari Portal"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">Keluar</span>
            </button>

          </div>

        </div>

        {/* View Navigation Menu Tabs (Tabel, Kanban, Realisasi SPP) */}
        <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-amber-100 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90">
            {/* Tab 1: Tabel */}
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: 'table' })}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                filters.viewMode === 'table'
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Table className="h-3.5 w-3.5 text-amber-600" />
              <span>Daftar Pengajuan</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-extrabold border border-slate-200">
                {totalItems}
              </span>
            </button>

            {/* Tab 2: Kanban Board */}
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: 'column' })}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                filters.viewMode === 'column'
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Columns3 className="h-3.5 w-3.5 text-blue-600" />
              <span>Papan Alur (Board)</span>
            </button>

            {/* Tab 3: Realisasi SPP Dashboard */}
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: 'realisasi' })}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                filters.viewMode === 'realisasi'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-xs font-black border border-amber-400'
                  : 'text-slate-700 hover:text-amber-950 hover:bg-amber-100/60'
              }`}
            >
              <Trophy className="h-3.5 w-3.5 text-amber-700" />
              <span>Dashboard Realisasi SPP</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-200 text-amber-950 font-black uppercase tracking-wider border border-amber-300">
                Semua Satker 🏆
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Mode Tampilan:</span>
            <span className="font-extrabold text-amber-950">
              {filters.viewMode === 'realisasi'
                ? '🏆 Realisasi SPP Semua Satker'
                : filters.viewMode === 'column'
                ? '📊 Board Alur Kerja'
                : '📋 Tabel Pengajuan'}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};



