import React from 'react';
import { SubmissionItem, UserRole, VerificationStatus } from '../types';
import { formatToWIB } from '../lib/dateUtils';
import { 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Wallet, 
  Building2,
  Eye,
  FileEdit,
  Pencil,
  Trash2,
  FileCheck,
  FileSpreadsheet
} from 'lucide-react';

interface ColumnBoardProps {
  items: SubmissionItem[];
  currentRole: UserRole;
  onOpenAuditorModal: (item: SubmissionItem) => void;
  onOpenFinanceModal: (item: SubmissionItem) => void;
  onOpenSppModal?: (item: SubmissionItem) => void;
  onOpenReviseModal?: (item: SubmissionItem) => void;
  onOpenEditModal?: (item: SubmissionItem) => void;
  onOpenDeleteModal?: (item: SubmissionItem) => void;
  onDeleteSubmission?: (id: string, submissionId?: string) => void;
  onClaimSubmission?: (itemId: string, auditorName: string, action: 'claim' | 'release') => void;
}

interface ColumnConfig {
  id: VerificationStatus;
  title: string;
  badgeColor: string;
  borderColor: string;
  headerBg: string;
  icon: React.ReactNode;
  description: string;
}

export const ColumnBoard: React.FC<ColumnBoardProps> = ({
  items,
  currentRole,
  onOpenAuditorModal,
  onOpenFinanceModal,
  onOpenSppModal,
  onOpenReviseModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onDeleteSubmission,
}) => {

  const columns: ColumnConfig[] = [
    {
      id: 'belum_diperiksa',
      title: '1. Verifikasi Keuangan Awal',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold',
      borderColor: 'border-amber-800/80',
      headerBg: 'bg-amber-950/40',
      icon: <Clock className="h-4 w-4 text-amber-400" />,
      description: 'Menunggu penerbitan Nota Dinas Verifikator Keuangan'
    },
    {
      id: 'sedang_diperiksa',
      title: '2. Verifikasi Auditor',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      borderColor: 'border-blue-900/50',
      headerBg: 'bg-blue-950/30',
      icon: <ShieldCheck className="h-4 w-4 text-blue-400" />,
      description: 'Pemeriksaan checklist & rekomendasi oleh Admin Auditor'
    },
    {
      id: 'direkomendasikan',
      title: '3. Direkomendasikan Auditor',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold',
      borderColor: 'border-emerald-600/60 shadow-emerald-950/50',
      headerBg: 'bg-emerald-950/40',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
      description: 'Disetujui Auditor • Menunggu Persetujuan Akhir Keuangan'
    },
    {
      id: 'selesai_keuangan',
      title: '4. Disetujui Keuangan',
      badgeColor: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 font-black',
      borderColor: 'border-emerald-700/80',
      headerBg: 'bg-emerald-950/50',
      icon: <Wallet className="h-4 w-4 text-emerald-400" />,
      description: 'Disetujui Keuangan • Pengisian Nomor & File SPP Satker'
    },
    {
      id: 'perlu_perbaikan',
      title: 'Perlu Perbaikan / Revisi',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      borderColor: 'border-rose-900/50',
      headerBg: 'bg-rose-950/30',
      icon: <AlertTriangle className="h-4 w-4 text-rose-400" />,
      description: 'Dikembalikan ke Satker untuk kelengkapan dokumen'
    },
  ];

  const formatCurrency = (amount: number) => {
    if (!amount) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Base items visible depending on user role (auditor & keuangan strictly only see items with Nota Dinas attached / entered auditor stage)
  const visibleItems = (currentRole === 'auditor' || currentRole === 'keuangan')
    ? items.filter(item => Boolean(item.notaDinasNumber && item.notaDinasNumber.trim()))
    : items;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
      {columns.map(col => {
        const colItems = visibleItems.filter(item => item.status === col.id);

        return (
          <div
            key={col.id}
            className={`bg-slate-900/40 rounded-2xl border ${col.borderColor} flex flex-col min-h-[540px] max-h-[85vh] overflow-hidden shadow-md backdrop-blur-md transition-all`}
          >
            {/* Bento Column Header */}
            <div className={`p-4 border-b border-slate-800/80 ${col.headerBg} sticky top-0 z-10 backdrop-blur-md`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    {col.icon}
                  </div>
                  <h3 className="font-bold text-xs text-slate-100 tracking-tight">
                    {col.title}
                  </h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${col.badgeColor}`}>
                  {colItems.length}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-1">
                {col.description}
              </p>
            </div>

            {/* Column Bento Cards Container */}
            <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
              {colItems.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-800/80 rounded-xl p-4 my-2 bg-slate-950/20">
                  <p className="text-xs text-slate-500 font-medium">Tidak ada pengajuan dalam status ini</p>
                </div>
              ) : (
                colItems.map(item => {
                  const checklistCount = Object.values(item.checklist).filter(Boolean).length;
                  const isApprovedByKeuangan = item.status === 'selesai_keuangan' || (item.financeStatus && item.financeStatus.toLowerCase().includes('disetujui'));

                  return (
                    <div
                      key={item.id}
                      className={`bg-slate-950/80 rounded-xl p-4 border transition-all duration-200 hover:border-slate-600 shadow-sm relative group hover:shadow-md ${
                        item.status === 'direkomendasikan'
                          ? 'border-emerald-500/50 ring-1 ring-emerald-500/30 bg-slate-950'
                          : item.status === 'selesai_keuangan'
                          ? 'border-emerald-600/70 bg-slate-950'
                          : 'border-slate-800/90'
                      }`}
                    >
                      {/* Highlight Ribbon for Verified Auditor / Final Approval */}
                      {item.status === 'direkomendasikan' && (
                        <div className="mb-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            Auditor Rekomendasi ACC
                          </span>
                          <span className="text-[10px] font-mono text-emerald-300">{checklistCount}/5 Berkas</span>
                        </div>
                      )}

                      {item.status === 'selesai_keuangan' && (
                        <div className="mb-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-extrabold px-2.5 py-1 rounded-lg flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                            Disetujui Keuangan
                          </span>
                          {item.sppNumber ? (
                            <span className="text-[10px] text-emerald-200 font-bold">SPP: {item.sppNumber}</span>
                          ) : (
                            <span className="text-[10px] text-amber-300 animate-pulse font-bold">Menunggu Input SPP</span>
                          )}
                        </div>
                      )}

                      {/* Header Badges: Satker & Bidang */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {item.satker}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/80">
                            {item.bidang}
                          </span>
                        </div>
                      </div>

                      {/* Title & Uraian Pengajuan */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug" title={item.jenisPengajuan || "Permohonan Pengajuan BA BUN"}>
                          {item.jenisPengajuan || "Permohonan Pengajuan BA BUN"}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">Nilai Anggaran:</span>
                          <span className="text-amber-400 font-extrabold">{formatCurrency(item.nominal)}</span>
                        </div>
                        {item.auditorApprovedNominal && (
                          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold pt-0.5 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
                            <span className="text-[10px] text-emerald-300 font-medium">Disetujui Auditor:</span>
                            <span className="text-emerald-300 font-black">{formatCurrency(item.auditorApprovedNominal)}</span>
                          </div>
                        )}
                        {item.assignedAuditor ? (
                          <div className="flex items-center gap-1 text-[10px] text-purple-200 font-extrabold bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-400/50 shadow-2xs">
                            <span>📌 Dikeep:</span>
                            <span className="truncate max-w-[150px]">{item.assignedAuditor}</span>
                          </div>
                        ) : item.auditorName ? (
                          <div className="flex items-center gap-1 text-[10px] text-purple-300 font-bold bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-500/30">
                            <span>🔍 Penelaah:</span>
                            <span className="truncate max-w-[150px]">{item.auditorName}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Document File Link */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 truncate text-slate-300 text-[11px]">
                          <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[130px]" title={item.fileName}>
                            {item.fileName}
                          </span>
                        </div>
                        {item.fileUrl && (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-slate-800 text-blue-400 hover:text-blue-300 rounded-md transition-colors shrink-0"
                            title="Buka PDF Lampiran Satker"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>

                      {/* Nota Dinas Badge */}
                      {item.notaDinasNumber && (
                        <div className="mt-2 bg-amber-950/60 rounded-lg p-2 border border-amber-800/80 flex items-center justify-between gap-1 text-[11px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <FileSpreadsheet className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            <span className="truncate text-amber-200 font-bold" title={item.notaDinasNumber}>
                              ND: {item.notaDinasNumber}
                            </span>
                          </div>
                          {item.notaDinasFileUrl && (
                            <a
                              href={item.notaDinasFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-400 hover:text-amber-300 p-0.5"
                              title="Buka PDF Nota Dinas"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* SPP Badge (if submitted) */}
                      {item.sppNumber && (
                        <div className="mt-2 bg-emerald-950/60 rounded-lg p-2 border border-emerald-800/80 flex items-center justify-between gap-1 text-[11px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <FileCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate text-emerald-200 font-bold" title={item.sppNumber}>
                              SPP: {item.sppNumber}
                            </span>
                          </div>
                          {item.sppFileUrl && (
                            <a
                              href={item.sppFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 p-0.5"
                              title="Buka PDF SPP"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Action Buttons based on Role */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5 flex-wrap">
                        
                        {/* Time Stamp */}
                        <div className="text-[10px] text-slate-500 font-mono">
                          {formatToWIB(item.submissionTime)}
                        </div>

                        {/* Action Buttons Group */}
                        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
                          {currentRole === 'satker' ? (
                            <>
                              {item.status === 'selesai_keuangan' && onOpenSppModal && (
                                <button
                                  type="button"
                                  onClick={() => onOpenSppModal(item)}
                                  className={`px-2.5 py-1.5 font-black rounded-lg text-xs shadow-xs transition-all flex items-center gap-1 ${
                                    item.sppNumber
                                      ? 'bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-600'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white animate-bounce'
                                  }`}
                                >
                                  <FileCheck className="h-3.5 w-3.5" />
                                  <span>{item.sppNumber ? 'Edit SPP' : 'Isi SPP'}</span>
                                </button>
                              )}

                              {item.status === 'perlu_perbaikan' && onOpenReviseModal ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenReviseModal(item)}
                                  className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-extrabold rounded-lg text-xs shadow-2xs transition-all flex items-center gap-1 animate-pulse"
                                >
                                  <FileEdit className="h-3.5 w-3.5" />
                                  <span>Perbaiki</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onOpenFinanceModal(item)}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Detail</span>
                                </button>
                              )}
                            </>
                          ) : currentRole === 'verifikator' ? (
                            <button
                              type="button"
                              onClick={() => onOpenFinanceModal(item)}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-xs shadow-xs transition-all flex items-center gap-1"
                            >
                              <Wallet className="h-3.5 w-3.5" />
                              <span>{item.notaDinasNumber ? 'Edit ND' : 'Verif & ND'}</span>
                            </button>
                          ) : currentRole === 'auditor' ? (
                            <button
                              type="button"
                              onClick={() => onOpenAuditorModal(item)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                item.status === 'direkomendasikan'
                                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                              }`}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>{item.status === 'direkomendasikan' ? 'Edit Verif' : 'Periksa'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenFinanceModal(item)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                item.status === 'direkomendasikan' || item.status === 'selesai_keuangan'
                                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-xs'
                                  : 'bg-emerald-700 hover:bg-emerald-600 text-white font-bold shadow-xs'
                              }`}
                            >
                              <Wallet className="h-3.5 w-3.5" />
                              <span>
                                {item.status === 'direkomendasikan'
                                  ? 'Setujui'
                                  : 'Detail'}
                              </span>
                            </button>
                          )}

                          {currentRole === 'satker' && !isApprovedByKeuangan && onOpenEditModal && (
                            <button
                              type="button"
                              onClick={() => onOpenEditModal(item)}
                              className="p-1.5 bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 rounded-lg transition-colors"
                              title="Edit Data Permohonan"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {currentRole === 'satker' && !isApprovedByKeuangan && (onOpenDeleteModal || onDeleteSubmission) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenDeleteModal) {
                                  onOpenDeleteModal(item);
                                } else if (onDeleteSubmission) {
                                  onDeleteSubmission(item.id, item.submissionId);
                                }
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Pengajuan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
