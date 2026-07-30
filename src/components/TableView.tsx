import React from 'react';
import { SubmissionItem, UserRole, FilterState, VerificationStatus } from '../types';
import { 
  Search, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Wallet, 
  ShieldCheck,
  Building2
} from 'lucide-react';

interface TableViewProps {
  items: SubmissionItem[];
  currentRole: UserRole;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onOpenAuditorModal: (item: SubmissionItem) => void;
  onOpenFinanceModal: (item: SubmissionItem) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  items,
  currentRole,
  filters,
  onFilterChange,
  onOpenAuditorModal,
  onOpenFinanceModal,
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
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-500" />
            Belum Diperiksa
          </span>
        );
      case 'sedang_diperiksa':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-blue-600 animate-spin" />
            Sedang Diperiksa
          </span>
        );
      case 'direkomendasikan':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Diverifikasi & Direkomendasikan
          </span>
        );
      case 'perlu_perbaikan':
      case 'ditolak':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-700" />
            Perlu Perbaikan
          </span>
        );
      case 'selesai_keuangan':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-yellow-100 text-yellow-900 border border-yellow-300 inline-flex items-center gap-1">
            <Wallet className="h-3 w-3 text-yellow-700" />
            SP2D Terbit / Selesai
          </span>
        );
    }
  };

  const formatCurrency = (val: number) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Export CSV functionality
  const handleExportCSV = () => {
    const headers = ["Submission ID", "Waktu Pengajuan", "Satuan Kerja", "Bidang", "Jenis Pengajuan", "Nominal", "Status Verifikasi", "Rekomendasi Auditor", "Auditor", "Link Dokumen"];
    const rows = filteredItems.map(item => [
      `"${item.submissionId}"`,
      `"${item.submissionTime}"`,
      `"${item.satker}"`,
      `"${item.bidang}"`,
      `"${item.jenisPengajuan || ''}"`,
      item.nominal || 0,
      `"${item.status}"`,
      `"${(item.auditorRecommendation || '').replace(/"/g, '""')}"`,
      `"${item.auditorName || ''}"`,
      `"${item.fileUrl}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Verifikasi_BA_BUN_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <option value="belum_diperiksa">Belum Diperiksa</option>
              <option value="sedang_diperiksa">Sedang Diperiksa Auditor</option>
              <option value="direkomendasikan">Diverifikasi & Direkomendasikan Auditor</option>
              <option value="perlu_perbaikan">Perlu Perbaikan / Revisi</option>
              <option value="selesai_keuangan">SP2D Terbit / Selesai Keuangan</option>
            </select>
          </div>

        </div>
      </div>

      {/* Bento Table List Card */}
      <div className="bg-white border border-amber-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-amber-50/90 text-amber-950 uppercase tracking-wider font-black border-b border-amber-200 text-[11px]">
              <tr>
                <th className="py-4 px-3.5">Submission ID</th>
                <th className="py-4 px-3.5">Submission Time</th>
                <th className="py-4 px-3.5">Satuan Kerja</th>
                <th className="py-4 px-3.5">Bidang</th>
                <th className="py-4 px-3.5">Upload a File (PDF)</th>
                <th className="py-4 px-3.5">Status & Rekomendasi Auditor</th>
                <th className="py-4 px-3.5 text-right">Aksi {currentRole === 'auditor' ? 'Auditor' : 'Keuangan'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 font-medium">
                    Tidak ada data pengajuan yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-amber-50/50 transition-colors ${
                        item.status === 'direkomendasikan' ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      {/* Submission ID */}
                      <td className="py-3.5 px-3.5 font-mono">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="text-slate-400 font-normal">{idx + 1}.</span>
                          <span className="text-amber-800 font-bold" title={item.submissionId}>{item.submissionId.slice(0, 13)}...</span>
                        </div>
                      </td>

                      {/* Submission Time */}
                      <td className="py-3.5 px-3.5 font-mono text-[11px] text-slate-600">
                        {item.submissionTime}
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

                      {/* Status & Auditor Recommendation */}
                      <td className="py-3.5 px-3.5 space-y-1">
                        <div>{getStatusBadge(item.status)}</div>
                        {item.auditorRecommendation && (
                          <div className="text-[11px] text-slate-600 line-clamp-1 italic max-w-[200px]" title={item.auditorRecommendation}>
                            "{item.auditorRecommendation}"
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-right">
                        {currentRole === 'auditor' ? (
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
