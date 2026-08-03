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
  ChevronRight,
  Sparkles,
  FileSearch,
  CheckCheck,
  Building2,
  Tag,
  MessageSquare,
  Eye,
  FileEdit,
  Pencil,
  Trash2
} from 'lucide-react';

interface ColumnBoardProps {
  items: SubmissionItem[];
  currentRole: UserRole;
  onOpenAuditorModal: (item: SubmissionItem) => void;
  onOpenFinanceModal: (item: SubmissionItem) => void;
  onOpenReviseModal?: (item: SubmissionItem) => void;
  onOpenEditModal?: (item: SubmissionItem) => void;
  onOpenDeleteModal?: (item: SubmissionItem) => void;
  onDeleteSubmission?: (id: string, submissionId?: string) => void;
  onQuickMoveStatus?: (itemId: string, newStatus: VerificationStatus) => void;
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
  onOpenReviseModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onDeleteSubmission,
}) => {

  const columns: ColumnConfig[] = [
    {
      id: 'belum_diperiksa',
      title: 'Belum Diperiksa',
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
      borderColor: 'border-slate-800',
      headerBg: 'bg-slate-900/80',
      icon: <Clock className="h-4 w-4 text-slate-400" />,
      description: 'Berkas pengajuan baru dari Google Sheet / Input'
    },
    {
      id: 'sedang_diperiksa',
      title: 'Sedang Diperiksa',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      borderColor: 'border-blue-900/50',
      headerBg: 'bg-blue-950/30',
      icon: <FileSearch className="h-4 w-4 text-blue-400" />,
      description: 'Auditor sedang meneliti fisik/softcopy dokumen'
    },
    {
      id: 'direkomendasikan',
      title: 'Diverifikasi & Direkomendasikan',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold',
      borderColor: 'border-emerald-600/60 shadow-emerald-950/50',
      headerBg: 'bg-emerald-950/40',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
      description: 'Disetujui Auditor • Siap diproses Admin Keuangan'
    },
    {
      id: 'perlu_perbaikan',
      title: 'Perlu Perbaikan / Revisi',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      borderColor: 'border-amber-900/50',
      headerBg: 'bg-amber-950/30',
      icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
      description: 'Dikembalikan ke Satker untuk kelengkapan'
    },
    {
      id: 'selesai_keuangan',
      title: 'Selesai Process Keuangan',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      borderColor: 'border-cyan-900/50',
      headerBg: 'bg-cyan-950/30',
      icon: <Wallet className="h-4 w-4 text-cyan-400" />,
      description: 'SP2D terbit / Dana BA BUN telah diproses'
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
      {columns.map(col => {
        const colItems = items.filter(item => item.status === col.id);

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

                  return (
                    <div
                      key={item.id}
                      className={`bg-slate-950/80 rounded-xl p-4 border transition-all duration-200 hover:border-slate-600 shadow-sm relative group hover:shadow-md ${
                        item.status === 'direkomendasikan'
                          ? 'border-emerald-500/50 ring-1 ring-emerald-500/30 bg-slate-950'
                          : 'border-slate-800/90'
                      }`}
                    >
                      {/* Highlight Ribbon for Verified Auditor Items */}
                      {item.status === 'direkomendasikan' && (
                        <div className="mb-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            Auditor Rekomendasi ACC
                          </span>
                          <span className="text-[10px] font-mono text-emerald-300">{checklistCount}/5 Berkas</span>
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
                        {item.source === 'google_sheets' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20" title="Data Otomatis dari Spreadsheet">
                            Sheets
                          </span>
                        )}
                      </div>

                      {/* Title & Jenis Pengajuan */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                          {item.jenisPengajuan || "Permohonan Pengajuan BA BUN"}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                          <span className="font-mono text-[10px] text-slate-500">ID: {item.submissionId.slice(0, 13)}...</span>
                          <span className="text-amber-400 font-extrabold">{formatCurrency(item.nominal)}</span>
                        </div>
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
                            title="Buka PDF Lampiran"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>

                      {/* Checklist Progress Bar */}
                      <div className="mt-2.5 bg-slate-900/90 rounded-lg p-2 border border-slate-800/80">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-semibold text-slate-300">Checklist Berkas BA BUN:</span>
                          <span className={`font-bold ${checklistCount === 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {checklistCount}/5 Lengkap
                          </span>
                        </div>
                        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              checklistCount === 5 ? 'bg-emerald-400' : checklistCount >= 3 ? 'bg-amber-400' : 'bg-rose-400'
                            }`}
                            style={{ width: `${(checklistCount / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Auditor Recommendation Notes if present */}
                      {item.auditorRecommendation && (
                        <div className="mt-2.5 text-[11px] bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-slate-300 space-y-1">
                          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                            <MessageSquare className="h-3 w-3" />
                            <span>Rekomendasi Auditor:</span>
                          </div>
                          <p className="text-[11px] text-slate-200 line-clamp-2 italic">
                            "{item.auditorRecommendation}"
                          </p>
                          {item.auditorName && (
                            <span className="text-[9px] text-slate-400 block text-right pt-0.5 font-mono">
                              — {item.auditorName} ({item.verifiedAt?.slice(0, 10)})
                            </span>
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
                        <div className="flex items-center gap-1.5 ml-auto">
                          {currentRole === 'satker' ? (
                            item.status === 'perlu_perbaikan' && onOpenReviseModal ? (
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
                            )
                          ) : currentRole === 'auditor' ? (
                            <button
                              type="button"
                              onClick={() => onOpenAuditorModal(item)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                item.status === 'direkomendasikan'
                                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
                              }`}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>{item.status === 'direkomendasikan' ? 'Edit Verifikasi' : 'Periksa'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenFinanceModal(item)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                item.status === 'direkomendasikan' || item.status === 'selesai_keuangan'
                                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-xs'
                                  : 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold shadow-xs'
                              }`}
                            >
                              <Wallet className="h-3.5 w-3.5" />
                              <span>{item.status === 'selesai_keuangan' ? 'Disetujui' : 'Menyetujui'}</span>
                            </button>
                          )}

                          {currentRole === 'satker' && onOpenEditModal && (
                            <button
                              type="button"
                              onClick={() => onOpenEditModal(item)}
                              className="p-1.5 bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 rounded-lg transition-colors"
                              title="Edit Data Permohonan"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {(onOpenDeleteModal || onDeleteSubmission) && (
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
