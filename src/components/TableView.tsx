import React from 'react';
import { SubmissionItem, UserRole, FilterState, VerificationStatus } from '../types';
import { formatToWIB } from '../lib/dateUtils';
import { 
  Search, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Wallet, 
  ShieldCheck,
  Building2,
  FileEdit,
  Eye,
  Trash2,
  Pencil
} from 'lucide-react';

interface TableViewProps {
  items: SubmissionItem[];
  currentRole: UserRole;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onOpenAuditorModal: (item: SubmissionItem) => void;
  onOpenFinanceModal: (item: SubmissionItem) => void;
  onOpenReviseModal?: (item: SubmissionItem) => void;
  onOpenEditModal?: (item: SubmissionItem) => void;
  onOpenDeleteModal?: (item: SubmissionItem) => void;
  onDeleteSubmission?: (id: string, submissionId?: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  items,
  currentRole,
  filters,
  onFilterChange,
  onOpenAuditorModal,
  onOpenFinanceModal,
  onOpenReviseModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onDeleteSubmission,
}) => {

  // Get unique Satkers & Bidangs for filters
  const satkerOptions = Array.from(new Set(items.map(i => i.satker))).sort();
  const bidangOptions = Array.from(new Set(items.map(i => i.bidang))).sort();

  // Filter items based on filter state
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      !filters.search ||
      item.submissionId.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.satker.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.bidang.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.fileName.toLowerCase().includes(filters.search.toLowerCase()) ||
      (item.jenisPengajuan && item.jenisPengajuan.toLowerCase().includes(filters.search.toLowerCase()));

    const matchesSatker = !filters.satker || item.satker === filters.satker;
    const matchesBidang = !filters.bidang || item.bidang === filters.bidang;
    const matchesStatus = !filters.status || item.status === filters.status;

    return matchesSearch && matchesSatker && matchesBidang && matchesStatus;
  });

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'belum_diperiksa':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-600" />
            1. Menunggu Auditor
          </span>
        );
      case 'sedang_diperiksa':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-300 inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-blue-600 animate-spin" />
            2. Sedang Diperiksa
          </span>
        );
      case 'direkomendasikan':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            3. Direkomendasikan Auditor
          </span>
        );
      case 'perlu_perbaikan':
      case 'ditolak':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            Perlu Perbaikan / Revisi
          </span>
        );
      case 'selesai_keuangan':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-400 text-slate-950 border border-amber-500 inline-flex items-center gap-1 shadow-2xs">
            <Wallet className="h-3.5 w-3.5 text-slate-950" />
            4. SP2D Terbit / Disetujui
          </span>
        );
    }
  };

  const renderStatusProgress = (status: VerificationStatus) => {
    let step = 1;
    if (status === 'sedang_diperiksa') step = 2;
    if (status === 'direkomendasikan') step = 3;
    if (status === 'selesai_keuangan') step = 4;
    if (status === 'perlu_perbaikan') step = 1.5;

    return (
      <div className="w-full space-y-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
          <span className={step >= 1 ? 'text-amber-800 font-extrabold' : ''}>Entry</span>
          <span className={step >= 2 ? 'text-blue-800 font-extrabold' : ''}>Auditor</span>
          <span className={step >= 4 ? 'text-emerald-800 font-black' : ''}>SP2D</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 flex">
          <div className={`h-full transition-all duration-500 ${
            status === 'perlu_perbaikan' 
              ? 'w-1/2 bg-rose-500' 
              : step === 4 
              ? 'w-full bg-emerald-500' 
              : step === 3 
              ? 'w-3/4 bg-emerald-400' 
              : step === 2 
              ? 'w-1/2 bg-blue-500' 
              : 'w-1/4 bg-amber-500'
          }`} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Bento Grid Filters Toolbar */}
      <div className="bg-white border border-amber-200/80 rounded-2xl p-4.5 backdrop-blur-md shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Satker, Bidang, ID Pengajuan, Nama File PDF..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
            />
          </div>

        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-amber-100">
          
          {/* Filter Satker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Filter Satuan Kerja (Satker):
            </label>
            <select
              value={filters.satker}
              onChange={(e) => onFilterChange({ satker: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Semua Satker ({satkerOptions.length})</option>
              {satkerOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Filter Bidang */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Filter Bidang:
            </label>
            <select
              value={filters.bidang}
              onChange={(e) => onFilterChange({ bidang: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Semua Bidang ({bidangOptions.length})</option>
              {bidangOptions.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Filter Status Verifikasi:
            </label>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Semua Status Verifikasi</option>
              <option value="belum_diperiksa">Belum Diperiksa Auditor</option>
              <option value="sedang_diperiksa">Sedang Diperiksa Auditor</option>
              <option value="direkomendasikan">Diverifikasi & Direkomendasikan Auditor</option>
              <option value="perlu_perbaikan">Perlu Perbaikan / Revisi</option>
              <option value="selesai_keuangan">SP2D Terbit / Disetujui Keuangan</option>
            </select>
          </div>

        </div>
      </div>

      {/* Table List Card */}
      <div className="bg-white border border-amber-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-amber-50/90 text-amber-950 uppercase tracking-wider font-black border-b border-amber-200 text-[11px]">
              <tr>
                <th className="py-4 px-3.5">Submission ID</th>
                <th className="py-4 px-3.5">Waktu Entry</th>
                <th className="py-4 px-3.5">Satuan Kerja</th>
                <th className="py-4 px-3.5">Bidang</th>
                <th className="py-4 px-3.5">Dokumen Permohonan (PDF)</th>
                <th className="py-4 px-3.5 min-w-[200px]">Status & Progres Pemeriksaan</th>
                <th className="py-4 px-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 font-medium">
                    Tidak ada data pengajuan permohonan yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-amber-50/50 transition-colors ${
                        item.status === 'direkomendasikan' 
                          ? 'bg-emerald-50/40' 
                          : item.status === 'perlu_perbaikan' 
                          ? 'bg-rose-50/30' 
                          : ''
                      }`}
                    >
                      {/* Submission ID */}
                      <td className="py-3.5 px-3.5 font-mono">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="text-slate-400 font-normal">{idx + 1}.</span>
                          <span className="text-amber-800 font-bold" title={item.submissionId}>{item.submissionId.slice(0, 14)}...</span>
                        </div>
                      </td>

                      {/* Submission Time */}
                      <td className="py-3.5 px-3.5 font-mono text-[11px] text-slate-600">
                        {formatToWIB(item.submissionTime)}
                      </td>

                      {/* Satuan Kerja */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>{item.satker}</span>
                        </div>
                      </td>

                      {/* Bidang */}
                      <td className="py-3.5 px-3.5 font-semibold text-slate-800">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                          {item.bidang}
                        </span>
                      </td>

                      {/* Upload a File */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-1.5 max-w-[180px]">
                          <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                          <span className="truncate text-slate-800 text-[11px] font-semibold" title={item.fileName}>
                            {item.fileName}
                          </span>
                          {item.fileUrl && (
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors shrink-0"
                              title="Buka Dokumen PDF"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Status & Progress Stepper */}
                      <td className="py-3.5 px-3.5 space-y-1.5">
                        <div>{getStatusBadge(item.status)}</div>
                        {renderStatusProgress(item.status)}
                        {item.auditorRecommendation && (
                          <div className="text-[11px] text-slate-600 italic line-clamp-1 max-w-[220px]" title={item.auditorRecommendation}>
                            "{item.auditorRecommendation}"
                          </div>
                        )}
                      </td>

                      {/* Actions Column based on Role */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {currentRole === 'satker' ? (
                            item.status === 'perlu_perbaikan' && onOpenReviseModal ? (
                              <button
                                type="button"
                                onClick={() => onOpenReviseModal(item)}
                                className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-extrabold rounded-xl text-xs shadow-2xs transition-all inline-flex items-center gap-1.5 transform active:scale-95 animate-pulse"
                              >
                                <FileEdit className="h-3.5 w-3.5" />
                                <span>Perbaiki Dokumen</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenFinanceModal(item)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Detail</span>
                              </button>
                            )
                          ) : currentRole === 'auditor' ? (
                            <button
                              type="button"
                              onClick={() => onOpenAuditorModal(item)}
                              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-2xs transition-all inline-flex items-center gap-1.5 transform active:scale-95"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>{item.status === 'direkomendasikan' ? 'Edit Verifikasi' : 'Verifikasi'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenFinanceModal(item)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all inline-flex items-center gap-1.5 transform active:scale-95 ${
                                item.status === 'direkomendasikan' || item.status === 'selesai_keuangan'
                                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xs'
                                  : 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-xs'
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
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-1 shadow-2xs"
                              title="Edit Data Permohonan"
                            >
                              <Pencil className="h-3.5 w-3.5 text-amber-700" />
                              <span>Edit</span>
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
                              className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                              title="Hapus Pengajuan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

