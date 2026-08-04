import React from 'react';
import { SubmissionItem, UserRole } from '../types';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Wallet, 
  TrendingUp, 
  Sparkles,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';

interface StatsCardsProps {
  items: SubmissionItem[];
  currentRole: UserRole;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ items, currentRole }) => {
  const roleItems = (currentRole === 'auditor' || currentRole === 'keuangan')
    ? items.filter(i => Boolean(i.notaDinasNumber && i.notaDinasNumber.trim()))
    : items;

  const total = roleItems.length;
  const belumDiperiksa = roleItems.filter(i => i.status === 'belum_diperiksa').length;
  const sedangDiperiksa = roleItems.filter(i => i.status === 'sedang_diperiksa').length;
  const direkomendasikan = roleItems.filter(i => i.status === 'direkomendasikan').length;
  const perluPerbaikan = roleItems.filter(i => i.status === 'perlu_perbaikan' || i.status === 'ditolak').length;
  const selesaiKeuangan = roleItems.filter(i => i.status === 'selesai_keuangan').length;

  // Percentage verified by Auditor
  const totalAudited = direkomendasikan + selesaiKeuangan;
  const auditPercentage = total > 0 ? Math.round((totalAudited / total) * 100) : 0;

  // Total amount
  const totalNominal = items.reduce((acc, curr) => acc + (curr.nominal || 0), 0);
  const nominalAudited = items
    .filter(i => i.status === 'direkomendasikan' || i.status === 'selesai_keuangan')
    .reduce((acc, curr) => acc + (curr.nominal || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-4">
      {/* Bento Grid Role Notice Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs backdrop-blur-md shadow-xs transition-all ${
        currentRole === 'verifikator'
          ? 'bg-amber-100/90 border-amber-300 text-amber-950'
          : currentRole === 'auditor'
          ? 'bg-blue-100/80 border-blue-300 text-blue-950'
          : currentRole === 'keuangan'
          ? 'bg-emerald-100/80 border-emerald-300 text-emerald-950'
          : 'bg-slate-100 border-slate-300 text-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${
            currentRole === 'verifikator'
              ? 'bg-amber-500 text-slate-950 border border-amber-400'
              : currentRole === 'auditor'
              ? 'bg-blue-500 text-white border border-blue-400'
              : 'bg-emerald-600 text-white border border-emerald-500'
          }`}>
            {currentRole === 'auditor' ? <ShieldCheck className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
          </div>
          <div>
            <span className="font-extrabold uppercase tracking-wider text-[11px] block text-slate-900">
              {currentRole === 'verifikator'
                ? 'Mode Verifikator Keuangan (Penerbitan Nota Dinas Tahap 1)'
                : currentRole === 'auditor'
                ? 'Mode Admin Auditor (Pemeriksaan Checklist Tahap 2)'
                : currentRole === 'keuangan'
                ? 'Mode Admin Keuangan (Persetujuan Akhir BA BUN & Akun Satker)'
                : 'Portal Satker Kejaksaan Negeri'}
            </span>
            <p className="text-slate-700 mt-0.5 font-medium">
              {currentRole === 'verifikator'
                ? 'Periksa permohonan masuk, terbitkan dan lampirkan Nota Dinas Keuangan agar berkas diteruskan ke Admin Auditor.'
                : currentRole === 'auditor'
                ? 'Lakukan verifikasi kelengkapan berkas, centang checklist & berikan rekomendasi agar berkas diteruskan ke Admin Keuangan.'
                : currentRole === 'keuangan'
                ? 'Menerima rekomendasi dari Auditor, berikan persetujuan akhir keuangan, dan kelola akun Satker Kejaksaan Negeri.'
                : 'Pantau status permohonan BA BUN, lengkapi berkas revisi jika ada, dan input nomor SPP setelah disetujui Keuangan.'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto bg-white px-3.5 py-2 rounded-xl border border-amber-300 font-medium shadow-2xs shrink-0">
          <CheckCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-slate-800">Progress Verifikasi: <strong className="text-emerald-700 font-bold">{auditPercentage}%</strong> ({totalAudited}/{total} Dokumen)</span>
        </div>
      </div>
    </div>
  );
};
