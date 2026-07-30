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

      {/* Bento Grid KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Total Pengajuan Bento Card */}
        <div className="bg-white border border-amber-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Total Berkas</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{total}</div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Subbagian Keuangan BA BUN</p>
          </div>
        </div>

        {/* Belum & Sedang Diperiksa Bento Card */}
        <div className="bg-white border border-amber-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Perlu Diperiksa</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-300">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 tracking-tight">
              {belumDiperiksa + sedangDiperiksa}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              {belumDiperiksa} Belum • {sedangDiperiksa} Proses
            </p>
          </div>
        </div>

        {/* Direkomendasikan Auditor Bento Card */}
        <div className="bg-white border border-emerald-300/80 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-emerald-400 transition-all relative overflow-hidden">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-emerald-100/50 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Rekomendasi Auditor
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 tracking-tight flex items-baseline gap-2">
              <span>{direkomendasikan}</span>
              <span className="text-xs font-semibold text-slate-500">
                ({total > 0 ? Math.round((direkomendasikan / total) * 100) : 0}%)
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 mt-0.5 font-bold">
              Siap Diproses Admin Keuangan
            </p>
          </div>
        </div>

        {/* Perlu Perbaikan Bento Card */}
        <div className="bg-white border border-amber-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Perlu Perbaikan</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 tracking-tight">{perluPerbaikan}</div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Revisi/Dikembalikan ke Satker</p>
          </div>
        </div>

        {/* Selesai Process Keuangan Bento Card */}
        <div className="bg-white border border-amber-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-amber-300 transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-800">SP2D Terbit</span>
            <div className="p-2 rounded-xl bg-yellow-100 text-yellow-800 border border-yellow-300">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-yellow-600 tracking-tight">{selesaiKeuangan}</div>
            <p className="text-[11px] text-slate-600 mt-0.5 font-bold truncate" title={formatCurrency(nominalAudited)}>
              Nilai: {formatCurrency(nominalAudited)}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
