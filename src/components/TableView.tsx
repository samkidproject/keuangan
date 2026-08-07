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
  Pencil,
  FileCheck,
  FileSpreadsheet
} from 'lucide-react';

interface TableViewProps {
  items: SubmissionItem[];
  currentRole: UserRole;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onOpenAuditorModal: (item: SubmissionItem) => void;
  onOpenFinanceModal: (item: SubmissionItem) => void;
  onOpenSppModal?: (item: SubmissionItem) => void;
  onOpenReviseModal?: (item: SubmissionItem) => void;
  onOpenEditModal?: (item: SubmissionItem) => void;
  onOpenDeleteModal?: (item: SubmissionItem) => void;
  onDeleteSubmission?: (id: string, submissionId?: string) => void;
  onClaimSubmission?: (itemId: string, auditorName: string, action: 'claim' | 'release') => void;
}

export const TableView: React.FC<TableViewProps> = ({
  items,
  currentRole,
  filters,
  onFilterChange,
  onOpenAuditorModal,
  onOpenFinanceModal,
  onOpenSppModal,
  onOpenReviseModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onDeleteSubmission,
  onClaimSubmission,
}) => {

  // Filter base items for auditor and keuangan roles (strictly only see items with Nota Dinas attached / entered auditor stage)
  const roleBaseItems = items.filter(item => {
    if (currentRole === 'auditor' || currentRole === 'keuangan') {
      return Boolean(item.notaDinasNumber && item.notaDinasNumber.trim());
    }
    return true;
  });

  // Get unique Satkers & Bidangs for filters
  const satkerOptions = Array.from(new Set(roleBaseItems.map(i => i.satker))).sort();
  const bidangOptions = Array.from(new Set(roleBaseItems.map(i => i.bidang))).sort();

  const formatCurrency = (val?: number) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Filter items based on filter state
  const filteredItems = roleBaseItems.filter(item => {
    const matchesSearch = 
      !filters.search ||
      item.submissionId.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.satker.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.bidang.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.fileName.toLowerCase().includes(filters.search.toLowerCase()) ||
      (item.notaDinasNumber && item.notaDinasNumber.toLowerCase().includes(filters.search.toLowerCase())) ||
      (item.sppNumber && item.sppNumber.toLowerCase().includes(filters.search.toLowerCase())) ||
      (item.jenisPengajuan && item.jenisPengajuan.toLowerCase().includes(filters.search.toLowerCase()));

    const matchesSatker = !filters.satker || item.satker === filters.satker;
    const matchesBidang = !filters.bidang || item.bidang === filters.bidang;
    const matchesStatus = !filters.status || item.status === filters.status;

    return matchesSearch && matchesSatker && matchesBidang && matchesStatus;
  });

  const getStatusBadge = (status: VerificationStatus, item: SubmissionItem) => {
    switch (status) {
      case 'belum_diperiksa':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-300 inline-flex items-center gap-1 shadow-2xs">
            <Clock className="h-3 w-3 text-amber-600" />
            1. Verifikasi Keuangan Awal (Nota Dinas)
          </span>
        );
      case 'sedang_diperiksa':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-300 inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-blue-600 animate-spin" />
            2. Verifikasi Auditor
          </span>
        );
      case 'direkomendasikan':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
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
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-600 text-white border border-emerald-700 inline-flex items-center gap-1 shadow-xs">
            <Wallet className="h-3.5 w-3.5" />
            4. Disetujui Keuangan
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
        <div className="flex items-center justify-between text-[9px] font-extrabold text-slate-500">
          <span className={step >= 1 ? 'text-amber-800' : ''}>Verif Keu</span>
          <span className={step >= 2 ? 'text-blue-800' : ''}>Auditor</span>
          <span className={step >= 3 ? 'text-emerald-700' : ''}>Setuju Keu</span>
          <span className={step >= 4 ? 'text-emerald-900 font-black' : ''}>SPP</span>
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
              placeholder="Cari Satker, Bidang, Uraian Pengajuan, Nomor Nota Dinas, Nomor SPP..."
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
              Filter Status Alur Kerja:
            </label>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Semua Status Alur Kerja</option>
              <option value="belum_diperiksa">1. Verifikasi Keuangan Awal (Menunggu Nota Dinas)</option>
              <option value="sedang_diperiksa">2. Verifikasi Audit Auditor</option>
              <option value="direkomendasikan">3. Direkomendasikan Auditor &rarr; Persetujuan Keuangan</option>
              <option value="selesai_keuangan">4. Disetujui Keuangan &rarr; Input SPP Satker</option>
              <option value="perlu_perbaikan">Perlu Perbaikan / Revisi Satker</option>
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
                <th className="py-4 px-3.5">Uraian Pengajuan</th>
                <th className="py-4 px-3.5">Waktu Entry</th>
                <th className="py-4 px-3.5">Satuan Kerja & Bidang</th>
                <th className="py-4 px-3.5">Berkas Permohonan & Nota Dinas</th>
                <th className="py-4 px-3.5 min-w-[210px]">Status & Progres Workflow</th>
                <th className="py-4 px-3.5 text-right">Aksi Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-medium">
                    Tidak ada data pengajuan permohonan yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isApprovedByKeuangan = item.status === 'selesai_keuangan' || (item.financeStatus && item.financeStatus.toLowerCase().includes('disetujui'));

                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-amber-50/50 transition-colors ${
                        item.status === 'direkomendasikan' 
                          ? 'bg-emerald-50/40' 
                          : item.status === 'selesai_keuangan'
                          ? 'bg-emerald-50/20'
                          : item.status === 'perlu_perbaikan' 
                          ? 'bg-rose-50/30' 
                          : ''
                      }`}
                    >
                      {/* Uraian Pengajuan */}
                      <td className="py-3.5 px-3.5 font-sans">
                        <div className="font-extrabold text-slate-900 flex items-start gap-1.5 max-w-[220px]">
                          <span className="text-slate-400 font-mono font-normal shrink-0">{idx + 1}.</span>
                          <div>
                            <span className="text-amber-950 font-extrabold text-xs leading-snug line-clamp-2" title={item.jenisPengajuan || 'Permohonan Anggaran BA BUN'}>
                              {item.jenisPengajuan || 'Permohonan Anggaran BA BUN'}
                            </span>

                            <div className="text-emerald-800 font-extrabold text-xs mt-1">
                              Nominal: {formatCurrency(item.nominal)}
                            </div>

                            {item.auditorApprovedNominal && (
                              <div className="text-[10px] text-emerald-950 font-black bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded w-fit mt-0.5" title="Nominal Direkomendasikan Auditor">
                                Disetujui Auditor: {formatCurrency(item.auditorApprovedNominal)}
                              </div>
                            )}

                            {item.sppNumber && (
                              <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-950 border border-emerald-300 text-[10px] font-black">
                                <FileCheck className="h-3 w-3 text-emerald-700" />
                                <span>SPP: {item.sppNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Submission Time */}
                      <td className="py-3.5 px-3.5 font-mono text-[11px] text-slate-600">
                        {formatToWIB(item.submissionTime)}
                      </td>

                      {/* Satuan Kerja & Bidang */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>{item.satker}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          Bidang: {item.bidang}
                        </div>
                      </td>

                      {/* Documents & Nota Dinas */}
                      <td className="py-3.5 px-3.5 space-y-1">
                        {/* Satker File */}
                        <div className="flex items-center gap-1.5 max-w-[200px]">
                          <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span className="truncate text-slate-800 text-[11px] font-semibold" title={item.fileName}>
                            {item.fileName}
                          </span>
                          {item.fileUrl && (
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 p-0.5 bg-blue-50 rounded-md shrink-0"
                              title="Pratinjau PDF Satker"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>

                        {/* Nota Dinas Badge */}
                        {item.notaDinasNumber ? (
                          <div className="flex items-center gap-1 text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 w-fit">
                            <FileSpreadsheet className="h-3 w-3 text-amber-700" />
                            <span className="truncate max-w-[140px]" title={item.notaDinasNumber}>ND: {item.notaDinasNumber}</span>
                            {item.notaDinasFileUrl && (
                              <a href={item.notaDinasFileUrl} target="_blank" rel="noopener noreferrer" className="text-amber-800 hover:underline">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic block">Nota Dinas belum diterbitkan</span>
                        )}
                      </td>

                      {/* Status & Progress Stepper */}
                      <td className="py-3.5 px-3.5 space-y-1.5">
                        <div>{getStatusBadge(item.status, item)}</div>
                        {renderStatusProgress(item.status)}
                        
                        {item.assignedAuditor ? (
                          <div className="text-[10px] text-purple-950 font-black bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-md w-fit flex items-center gap-1 shadow-2xs" title="Berkas sedang dikeep/ditelaah oleh Auditor ini">
                            <span className="shrink-0">📌</span>
                            <span className="truncate max-w-[180px]">Dikeep: {item.assignedAuditor}</span>
                          </div>
                        ) : item.auditorName ? (
                          <div className="text-[10px] text-purple-900 font-bold bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded w-fit flex items-center gap-1" title="Auditor Penanggung Jawab Review">
                            <span className="shrink-0">🔍</span>
                            <span className="truncate max-w-[180px]">{item.auditorName}</span>
                          </div>
                        ) : (
                          <div className="text-[9px] text-slate-400 font-medium italic">
                            🔓 Belum Dikeep
                          </div>
                        )}

                        {item.auditorRecommendation && (
                          <div className="text-[10px] text-slate-600 italic line-clamp-1 max-w-[220px]" title={item.auditorRecommendation}>
                            "{item.auditorRecommendation}"
                          </div>
                        )}
                      </td>

                      {/* Actions Column based on Role */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          
                          {/* Satker Actions */}
                          {currentRole === 'satker' && (
                            <>
                              {item.status === 'selesai_keuangan' && onOpenSppModal && (
                                <button
                                  type="button"
                                  onClick={() => onOpenSppModal(item)}
                                  className={`px-3 py-1.5 font-black rounded-xl text-xs shadow-xs transition-all inline-flex items-center gap-1 transform active:scale-95 ${
                                    item.sppNumber
                                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white animate-bounce'
                                  }`}
                                >
                                  <FileCheck className="h-3.5 w-3.5" />
                                  <span>{item.sppNumber ? 'Edit SPP' : 'Isi Data SPP'}</span>
                                </button>
                              )}

                              {item.status === 'perlu_perbaikan' && onOpenReviseModal && (
                                <button
                                  type="button"
                                  onClick={() => onOpenReviseModal(item)}
                                  className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-extrabold rounded-xl text-xs shadow-2xs transition-all inline-flex items-center gap-1.5 transform active:scale-95 animate-pulse"
                                >
                                  <FileEdit className="h-3.5 w-3.5" />
                                  <span>Perbaiki Dokumen</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => onOpenFinanceModal(item)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Detail</span>
                              </button>
                            </>
                          )}

                          {/* Verifikator Keuangan Actions */}
                          {currentRole === 'verifikator' && (
                            <button
                              type="button"
                              onClick={() => onOpenFinanceModal(item)}
                              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-2xs transition-all inline-flex items-center gap-1.5 transform active:scale-95"
                            >
                              <Wallet className="h-3.5 w-3.5" />
                              <span>{item.notaDinasNumber ? 'Edit Nota Dinas' : 'Verif & Terbitkan Nota Dinas'}</span>
                            </button>
                          )}

                          {/* Auditor Actions */}
                          {currentRole === 'auditor' && (
                            <button
                              type="button"
                              onClick={() => onOpenAuditorModal(item)}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs shadow-2xs transition-all inline-flex items-center gap-1.5 transform active:scale-95"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>{item.status === 'direkomendasikan' ? 'Edit Verifikasi' : 'Verifikasi Auditor'}</span>
                            </button>
                          )}

                          {/* Admin Keuangan Actions */}
                          {currentRole === 'keuangan' && (
                            <button
                              type="button"
                              onClick={() => onOpenFinanceModal(item)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all inline-flex items-center gap-1.5 transform active:scale-95 ${
                                item.status === 'direkomendasikan'
                                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xs animate-pulse'
                                  : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs'
                              }`}
                            >
                              <Wallet className="h-3.5 w-3.5" />
                              <span>
                                {item.status === 'direkomendasikan'
                                  ? 'Setujui Keuangan'
                                  : 'Detail Keuangan'}
                              </span>
                            </button>
                          )}

                          {/* Edit Entry Submission (Satker) - Disabled if already approved by Keuangan */}
                          {currentRole === 'satker' && !isApprovedByKeuangan && onOpenEditModal && (
                            <button
                              type="button"
                              onClick={() => onOpenEditModal(item)}
                              className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-1 shadow-2xs"
                              title="Edit Data Permohonan"
                            >
                              <Pencil className="h-3.5 w-3.5 text-amber-700" />
                              <span>Edit</span>
                            </button>
                          )}

                          {/* Delete Action - Only for Satker user if not approved by Keuangan */}
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
