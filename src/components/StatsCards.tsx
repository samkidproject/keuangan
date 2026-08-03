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
  const total = items.length;
  const belumDiperiksa = items.filter(i => i.status === 'belum_diperiksa').length;
  const sedangDiperiksa = items.filter(i => i.status === 'sedang_diperiksa').length;
  const direkomendasikan = items.filter(i => i.status === 'direkomendasikan').length;
  const perluPerbaikan = items.filter(i => i.status === 'perlu_perbaikan' || i.status === 'ditolak').length;
  const selesaiKeuangan = items.filter(i => i.status === 'selesai_keuangan').length;

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
        currentRole === 'auditor'
          ? 'bg-amber-100/80 border-amber-300 text-amber-950'
          : 'bg-yellow-100/80 border-yellow-300 text-yellow-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${
            currentRole === 'auditor' ? 'bg-amber-500 text-slate-950 border border-amber-400' : 'bg-yellow-500 text-slate-950 border border-yellow-400'
          }`}>
            {currentRole === 'auditor' ? <ShieldCheck className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
          </div>
          <div>
            <span className="font-extrabold uppercase tracking-wider text-[11px] block text-slate-900">
              {currentRole === 'auditor' ? 'Mode Admin Auditor (Tim Pemeriksa)' : 'Mode Admin Keuangan (Pengelola BA BUN)'}
            </span>
            <p className="text-slate-700 mt-0.5 font-medium">
              {currentRole === 'auditor'
                ? 'Lakukan pemeriksaan kelengkapan berkas, lalu centang checklist rekomendasi untuk memperbarui progress di Admin Keuangan.'
                : 'Melihat progress verifikasi dari Admin Auditor secara real-time. Data yang sudah direkomendasikan siap diproses ke SP2D.'
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
