import React from 'react';
import { UserRole, FilterState } from '../types';
import { 
  LogOut,
  UserCheck,
  Users,
  FilePlus2
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
  totalItems: number;
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
  totalItems,
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
                    : currentRole === 'auditor'
                    ? 'Portal e-Auditor Kejati Lampung'
                    : 'Portal Subbagian Keuangan BA BUN'}
                </h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border shadow-2xs ${
                  currentRole === 'satker'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : currentRole === 'auditor'
                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}>
                  {currentRole === 'satker'
                    ? 'User Satker Kejaksaan Negeri'
                    : currentRole === 'auditor'
                    ? 'Akses Admin Auditor'
                    : 'Akses Admin Keuangan'}
                </span>
              </div>
              <p className="text-xs text-slate-600 flex items-center gap-2 mt-0.5 font-medium">
                <span>
                  {currentRole === 'satker'
                    ? 'Entry Form Permohonan BA BUN & Pantau Status Pengajuan'
                    : currentRole === 'auditor'
                    ? 'Pemeriksaan Verifikasi Checklist & Rekomendasi Auditor'
                    : 'Persetujuan Keuangan, SP2D & Kelola Akun Satker'}
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
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-2xs transition-all flex items-center gap-1.5 transform active:scale-95"
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
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                title="Kelola Akun Login Satker Kejaksaan Negeri"
              >
                <Users className="h-4 w-4 text-amber-700" />
                <span>Kelola Akun Satker</span>
              </button>
            )}

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
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 text-xs font-bold transition-all flex items-center gap-1"
              title="Keluar dari Portal"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">Keluar</span>
            </button>

          </div>

        </div>



      </div>
    </header>
  );
};


