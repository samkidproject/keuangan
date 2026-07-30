import React from 'react';
import { UserRole, FilterState } from '../types';
import { 
  RefreshCw, 
  Table, 
  LogOut,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  userName?: string;
  onRoleChange: (role: UserRole) => void;
  onLogout: () => void;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onSyncSheet: () => void;
  isSyncing: boolean;
  lastSynced: string | null;
  onOpenAddModal?: () => void;
  onOpenSyncModal: () => void;
  totalItems: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  userName,
  onRoleChange,
  onLogout,
  filters,
  onFilterChange,
  onSyncSheet,
  isSyncing,
  lastSynced,
  onOpenAddModal,
  onOpenSyncModal,
  totalItems,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-amber-200/80 shadow-xs">
      {/* Top Banner & Bento Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Agency Identity Bento Card */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-white p-1 flex items-center justify-center border border-amber-300/80 shadow-xs">
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
                  {currentRole === 'auditor' ? 'Portal e-Auditor Kejaksaan RI' : 'Portal Subbagian Keuangan BA BUN'}
                </h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border shadow-2xs ${
                  currentRole === 'auditor'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-yellow-100 text-yellow-900 border-yellow-300'
                }`}>
                  {currentRole === 'auditor' ? 'Akses e-Auditor' : 'Akses Keuangan'}
                </span>
              </div>
              <p className="text-xs text-slate-600 flex items-center gap-2 mt-0.5 font-medium">
                <span>
                  {currentRole === 'auditor' 
                    ? 'Pemeriksaan Verifikasi & Rekomendasi Checklist Berkas' 
                    : 'Persetujuan Pengajuan & Penerbitan SP2D BA BUN'}
                </span>
                <span className="text-amber-300">•</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Firebase & Sheets Active
                </span>
              </p>
            </div>
          </div>

          {/* User Account Role Switcher & Logout Container */}
          <div className="flex items-center gap-2.5 bg-amber-50/60 p-1.5 rounded-2xl border border-amber-200/80 shadow-2xs">
            
            {/* Active User Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-amber-200 shadow-2xs">
              <UserCheck className={`h-4 w-4 ${currentRole === 'auditor' ? 'text-amber-600' : 'text-yellow-600'}`} />
              <div className="text-left">
                <span className="block text-[10px] text-slate-500 font-bold leading-tight">Pengguna Aktif:</span>
                <span className="block text-xs font-black text-slate-900 leading-tight">
                  {userName || (currentRole === 'auditor' ? 'Admin Auditor' : 'Admin Keuangan')}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 text-xs font-bold transition-all flex items-center gap-1"
              title="Keluar dari Portal"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">Keluar</span>
            </button>

          </div>

        </div>

        {/* Action Controls & Navigation Bento Bar */}
        <div className="mt-3 pt-2.5 border-t border-amber-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* View Toggles & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Single View Indicator - Tabel Data */}
            <div className="bg-amber-50/80 px-3.5 py-1.5 rounded-xl border border-amber-200 flex items-center gap-2 shadow-2xs">
              <Table className="h-4 w-4 text-amber-700" />
              <span className="text-xs font-black text-slate-900">Tampilan Tabel Data BA BUN ({totalItems})</span>
            </div>

            {/* Sync Spreadsheet Status & Trigger */}
            <button
              type="button"
              onClick={onSyncSheet}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-amber-50/80 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold border border-slate-200 hover:border-amber-300 transition-all shadow-2xs disabled:opacity-50"
              title="Sinkronkan data dari Google Spreadsheet"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sinkronisasi...' : 'Sync Spreadsheet'}</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};

