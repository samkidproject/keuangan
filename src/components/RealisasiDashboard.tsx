import React, { useState, useMemo } from 'react';
import { SubmissionItem, UserRole } from '../types';
import { DEFAULT_SATKER_ACCOUNTS } from '../data/defaultSatkers';
import { formatToWIB } from '../lib/dateUtils';
import { 
  Trophy, 
  TrendingUp, 
  Wallet, 
  Building2, 
  Search, 
  FileCheck2, 
  ExternalLink, 
  Sparkles, 
  ArrowUpDown, 
  Copy, 
  Check, 
  ShieldCheck,
  BarChart3,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  AlertCircle,
  Pencil
} from 'lucide-react';

interface RealisasiDashboardProps {
  submissions: SubmissionItem[];
  currentRole: UserRole;
  currentUserSatker?: string;
  onViewDetail?: (item: SubmissionItem) => void;
  onOpenSppModal?: (item: SubmissionItem) => void;
}

export type RealizationScopeMode = 'spp_all' | 'spp_number_only' | 'approved_auditor_keuangan' | 'all_submissions';

export interface SatkerRealizationData {
  satkerName: string;
  totalPermohonanNominal: number;
  totalPermohonanCount: number;
  totalApprovedNominal: number;
  totalSppNominal: number;
  totalSppCount: number;
  realizationPercentage: number;
  sppItems: SubmissionItem[];
  allSubmissions: SubmissionItem[];
}

// Safe parser for nominal values whether string, number, or formatted
export const parseSafeNumber = (val: unknown): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Normalize Satker name to match canonical Satker list properly
export const normalizeSatkerName = (rawName?: string): string => {
  if (!rawName) return 'Kejati Lampung';
  const trimmed = rawName.trim();
  
  // Direct match in default accounts
  const directMatch = DEFAULT_SATKER_ACCOUNTS.find(
    a => a.satkerName.toLowerCase() === trimmed.toLowerCase() ||
         a.username.toLowerCase() === trimmed.toLowerCase()
  );
  if (directMatch) return directMatch.satkerName;

  // Normalized prefix
  const simplified = trimmed
    .replace(/^kejaksaan\s+negeri\s+/i, 'Kejari ')
    .replace(/^cabang\s+kejaksaan\s+negeri\s+/i, 'Cabjari ')
    .replace(/^kejari\s+/i, 'Kejari ')
    .replace(/^cabjari\s+/i, 'Cabjari ')
    .trim();

  const directMatch2 = DEFAULT_SATKER_ACCOUNTS.find(
    a => a.satkerName.toLowerCase() === simplified.toLowerCase()
  );
  if (directMatch2) return directMatch2.satkerName;

  // Specific keyword variations
  const lower = trimmed.toLowerCase();
  if (lower.includes('panjang') || lower.includes('pelabuhan')) return 'Cabjari Bandar Lampung di Pelabuhan Panjang';
  if (lower.includes('talang padang')) return 'Cabjari Tanggamus di Talang Padang';
  if (lower.includes('krui')) return 'Cabjari Lampung Barat di Krui';
  if (lower.includes('bandar lampung')) return 'Kejari Bandar Lampung';
  if (lower.includes('metro')) return 'Kejari Metro';
  if (lower.includes('lampung selatan') || lower.includes('kalianda')) return 'Kejari Lampung Selatan';
  if (lower.includes('lampung tengah') || lower.includes('gunung sugih')) return 'Kejari Lampung Tengah';
  if (lower.includes('lampung timur') || lower.includes('sukadana')) return 'Kejari Lampung Timur';
  if (lower.includes('lampung utara') || lower.includes('kotabumi')) return 'Kejari Lampung Utara';
  if (lower.includes('way kanan') || lower.includes('blambangan umpu')) return 'Kejari Way Kanan';
  if (lower.includes('tulang bawang barat') || lower.includes('tubaba')) return 'Kejari Tulang Bawang Barat';
  if (lower.includes('tulang bawang') || lower.includes('menggala')) return 'Kejari Tulang Bawang';
  if (lower.includes('mesuji')) return 'Kejari Mesuji';
  if (lower.includes('tanggamus') || lower.includes('kota agung')) return 'Kejari Tanggamus';
  if (lower.includes('pringsewu')) return 'Kejari Pringsewu';
  if (lower.includes('pesawaran') || lower.includes('gedong tataan')) return 'Kejari Pesawaran';
  if (lower.includes('lampung barat') || lower.includes('liwa')) return 'Kejari Lampung Barat';
  if (lower.includes('kejati') || lower.includes('kejaksaan tinggi') || lower.includes('keuangan kejati')) return 'Kejati Lampung';

  return trimmed;
};

export const RealisasiDashboard: React.FC<RealisasiDashboardProps> = ({
  submissions,
  currentRole,
  currentUserSatker,
  onViewDetail,
  onOpenSppModal,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBidang, setSelectedBidang] = useState<string>('');
  const [scopeMode, setScopeMode] = useState<RealizationScopeMode>('spp_all');
  const [filterSppOnly, setFilterSppOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'spp_desc' | 'spp_asc' | 'nominal_desc' | 'percent_desc' | 'name_asc'>('spp_desc');
  const [expandedSatker, setExpandedSatker] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Helper to extract nominal realized from a submission
  const getRealizedNominal = (item: SubmissionItem): number => {
    const approved = parseSafeNumber(item.auditorApprovedNominal);
    if (approved > 0) {
      return approved;
    }
    return parseSafeNumber(item.nominal);
  };

  // Check if an item counts as Realisasi SPP based on active scopeMode
  const isItemInScope = (item: SubmissionItem): boolean => {
    const hasSppNumber = Boolean(item.sppNumber && item.sppNumber.trim() !== '');
    const hasSppFile = Boolean(item.sppFileUrl && item.sppFileUrl.trim() !== '');
    const hasSppDate = Boolean(item.sppSubmittedAt && item.sppSubmittedAt.trim() !== '');
    const isSelesaiKeuangan = item.status === 'selesai_keuangan';
    const isDirekomendasikan = item.status === 'direkomendasikan';
    const hasFinanceTimestamp = Boolean(item.financeProcessedAt && item.financeProcessedAt.trim() !== '');

    switch (scopeMode) {
      case 'spp_number_only':
        // Only items that explicitly have an SPP number entered
        return hasSppNumber || hasSppFile;

      case 'approved_auditor_keuangan':
        // Items approved by Auditor or Keuangan or with SPP
        return isDirekomendasikan || isSelesaiKeuangan || hasSppNumber || hasFinanceTimestamp || (parseSafeNumber(item.auditorApprovedNominal) > 0);

      case 'all_submissions':
        // All submissions
        return true;

      case 'spp_all':
      default:
        // Comprehensive SPP stage: Status selesai keuangan, ada nomor SPP, ada file SPP, ada timestamp keuangan, dsb.
        return isSelesaiKeuangan || hasSppNumber || hasSppFile || hasSppDate || hasFinanceTimestamp;
    }
  };

  // Build the list of all standard Satker names in Kejati Lampung
  const standardSatkers = useMemo(() => {
    const list = DEFAULT_SATKER_ACCOUNTS
      .filter(acc => acc.role === 'satker' || !acc.role || acc.role === undefined)
      .map(acc => acc.satkerName);
    
    // Also include Kejati Lampung & any other satker present in submissions
    if (!list.includes('Kejati Lampung')) {
      list.push('Kejati Lampung');
    }

    submissions.forEach(s => {
      if (s.satker) {
        const norm = normalizeSatkerName(s.satker);
        if (!list.includes(norm)) {
          list.push(norm);
        }
      }
    });

    return Array.from(new Set(list));
  }, [submissions]);

  // Aggregate realization data per Satuan Kerja
  const satkerStats = useMemo(() => {
    const map = new Map<string, SatkerRealizationData>();

    // Initialize map for all standard satkers
    standardSatkers.forEach(satkerName => {
      map.set(satkerName, {
        satkerName,
        totalPermohonanNominal: 0,
        totalPermohonanCount: 0,
        totalApprovedNominal: 0,
        totalSppNominal: 0,
        totalSppCount: 0,
        realizationPercentage: 0,
        sppItems: [],
        allSubmissions: []
      });
    });

    // Populate data from submissions
    submissions.forEach(item => {
      const satkerKey = normalizeSatkerName(item.satker);
      
      let entry = map.get(satkerKey);
      if (!entry) {
        entry = {
          satkerName: satkerKey,
          totalPermohonanNominal: 0,
          totalPermohonanCount: 0,
          totalApprovedNominal: 0,
          totalSppNominal: 0,
          totalSppCount: 0,
          realizationPercentage: 0,
          sppItems: [],
          allSubmissions: []
        };
        map.set(satkerKey, entry);
      }

      // Filter by Bidang if active
      if (selectedBidang && item.bidang !== selectedBidang) {
        return;
      }

      const itemNominal = parseSafeNumber(item.nominal);
      const approvedNominal = parseSafeNumber(item.auditorApprovedNominal);

      entry.allSubmissions.push(item);
      entry.totalPermohonanCount += 1;
      entry.totalPermohonanNominal += itemNominal;

      // Disetujui Auditor / Keuangan
      if (approvedNominal > 0) {
        entry.totalApprovedNominal += approvedNominal;
      } else if (item.status === 'direkomendasikan' || item.status === 'selesai_keuangan') {
        entry.totalApprovedNominal += itemNominal;
      }

      // SPP Realization
      if (isItemInScope(item)) {
        const sppNom = getRealizedNominal(item);
        entry.totalSppNominal += sppNom;
        entry.totalSppCount += 1;
        entry.sppItems.push(item);
      }
    });

    // Calculate percentage
    const results: SatkerRealizationData[] = [];
    map.forEach(data => {
      if (data.totalPermohonanNominal > 0) {
        data.realizationPercentage = Math.round((data.totalSppNominal / data.totalPermohonanNominal) * 100);
      } else {
        data.realizationPercentage = data.totalSppNominal > 0 ? 100 : 0;
      }
      results.push(data);
    });

    return results;
  }, [submissions, standardSatkers, selectedBidang, scopeMode]);

  // Overall Totals
  const overallMetrics = useMemo(() => {
    const totalSppNominal = satkerStats.reduce((acc, curr) => acc + curr.totalSppNominal, 0);
    const totalPermohonanNominal = satkerStats.reduce((acc, curr) => acc + curr.totalPermohonanNominal, 0);
    const totalApprovedNominal = satkerStats.reduce((acc, curr) => acc + curr.totalApprovedNominal, 0);
    const totalSppCount = satkerStats.reduce((acc, curr) => acc + curr.totalSppCount, 0);
    const totalPermohonanCount = satkerStats.reduce((acc, curr) => acc + curr.totalPermohonanCount, 0);
    const overallPercentage = totalPermohonanNominal > 0 
      ? Math.round((totalSppNominal / totalPermohonanNominal) * 100) 
      : 0;

    // Count how many submissions have physical SPP number
    const totalWithPhysicalSppNumber = submissions.filter(s => Boolean(s.sppNumber && s.sppNumber.trim() !== '')).length;
    const totalSelesaiKeuangan = submissions.filter(s => s.status === 'selesai_keuangan').length;
    const totalDirekomendasikan = submissions.filter(s => s.status === 'direkomendasikan').length;

    // Highest Satker
    const sortedBySpp = [...satkerStats].sort((a, b) => b.totalSppNominal - a.totalSppNominal);
    const topSatker = sortedBySpp.length > 0 && sortedBySpp[0].totalSppNominal > 0 ? sortedBySpp[0] : null;

    return {
      totalSppNominal,
      totalPermohonanNominal,
      totalApprovedNominal,
      totalSppCount,
      totalPermohonanCount,
      totalWithPhysicalSppNumber,
      totalSelesaiKeuangan,
      totalDirekomendasikan,
      overallPercentage,
      topSatker
    };
  }, [satkerStats, submissions]);

  // Realisasi per Bidang
  const bidangStats = useMemo(() => {
    const map = new Map<string, { bidang: string; sppNominal: number; sppCount: number; permohonanNominal: number }>();

    submissions.forEach(item => {
      const b = item.bidang || 'Lainnya';
      let entry = map.get(b);
      if (!entry) {
        entry = { bidang: b, sppNominal: 0, sppCount: 0, permohonanNominal: 0 };
        map.set(b, entry);
      }
      entry.permohonanNominal += parseSafeNumber(item.nominal);
      if (isItemInScope(item)) {
        entry.sppNominal += getRealizedNominal(item);
        entry.sppCount += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.sppNominal - a.sppNominal);
  }, [submissions, scopeMode]);

  // Filter and sort the satker list
  const filteredAndSortedSatkers = useMemo(() => {
    const result = satkerStats.filter(s => {
      const matchesSearch = !searchTerm || s.satkerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSppFilter = !filterSppOnly || s.totalSppNominal > 0;
      return matchesSearch && matchesSppFilter;
    });

    result.sort((a, b) => {
      if (sortBy === 'spp_desc') {
        return b.totalSppNominal - a.totalSppNominal;
      }
      if (sortBy === 'spp_asc') {
        return a.totalSppNominal - b.totalSppNominal;
      }
      if (sortBy === 'nominal_desc') {
        return b.totalPermohonanNominal - a.totalPermohonanNominal;
      }
      if (sortBy === 'percent_desc') {
        return b.realizationPercentage - a.realizationPercentage;
      }
      if (sortBy === 'name_asc') {
        return a.satkerName.localeCompare(b.satkerName);
      }
      return 0;
    });

    return result;
  }, [satkerStats, searchTerm, filterSppOnly, sortBy]);

  // Ranked Top 3 for Podium
  const top3Satkers = useMemo(() => {
    const sorted = [...satkerStats]
      .filter(s => s.totalSppNominal > 0)
      .sort((a, b) => b.totalSppNominal - a.totalSppNominal);
    return sorted.slice(0, 3);
  }, [satkerStats]);

  // Unique bidang options
  const uniqueBidangs = useMemo(() => {
    return Array.from(new Set(submissions.map(s => s.bidang).filter(Boolean))).sort();
  }, [submissions]);

  // Copy Summary to Clipboard
  const handleCopyReport = () => {
    const scopeLabel = 
      scopeMode === 'spp_number_only' ? 'Hanya Dokumen SPP Terbit' :
      scopeMode === 'approved_auditor_keuangan' ? 'Semua Persetujuan Auditor & Keuangan' :
      scopeMode === 'all_submissions' ? 'Seluruh Pengajuan Masuk' :
      'Tahap Selesai Keuangan & Terbit SPP';

    const textLines = [
      `🏆 LAPORAN REALISASI ANGGARAN BA BUN (${scopeLabel.toUpperCase()}) KEJATI LAMPUNG`,
      `Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      `--------------------------------------------------`,
      `TOTAL REALISASI: ${formatCurrency(overallMetrics.totalSppNominal)}`,
      `TOTAL PERMOHONAN: ${formatCurrency(overallMetrics.totalPermohonanNominal)} (${overallMetrics.overallPercentage}%)`,
      `TOTAL BERKAS REALISASI: ${overallMetrics.totalSppCount} Dokumen`,
      `--------------------------------------------------`,
      `PERINGKAT REALISASI SATUAN KERJA:`,
      ...filteredAndSortedSatkers.map((s, idx) => {
        return `${idx + 1}. ${s.satkerName}: ${formatCurrency(s.totalSppNominal)} (${s.totalSppCount} Berkas | ${s.realizationPercentage}%)`;
      }),
      `--------------------------------------------------`,
      `Dihasilkan secara otomatis oleh Portal BA BUN Kejati Lampung`
    ];

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 3000);
  };

  const maxRealizationNominal = useMemo(() => {
    const max = Math.max(...satkerStats.map(s => s.totalSppNominal), 1);
    return max;
  }, [satkerStats]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 rounded-3xl p-6 text-slate-950 shadow-md border border-amber-400/60 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/3 -bottom-16 w-64 h-64 bg-amber-300/30 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 bg-slate-950 text-amber-300 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                Dashboard Realisasi Anggaran BA BUN
              </span>
              <span className="px-2.5 py-0.5 bg-amber-300/90 text-slate-950 text-[11px] font-black rounded-full border border-amber-400">
                Tahap Disetujui Keuangan & SPP Satker
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
              Pemantauan & Pemeringkatan Realisasi Anggaran Seluruh Satker
            </h2>
            <p className="text-xs sm:text-sm text-slate-950 font-medium max-w-3xl leading-relaxed">
              Memvisualisasikan total serapan anggaran yang telah disetujui Pengelola Keuangan dan diterbitkan dokumen SPP per Satuan Kerja se-Wilayah Hukum Kejaksaan Tinggi Lampung secara transparan dan akurat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={handleCopyReport}
              className="px-3.5 py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-300 font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              title="Salin Ringkasan Laporan Realisasi"
            >
              {copiedReport ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-white">Laporan Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-amber-400" />
                  <span>Salin Ringkasan Laporan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scope Selector Tabs (Selesai Keuangan & SPP, Hanya Nomor SPP, Disetujui Auditor, Semua) */}
      <div className="bg-white border-2 border-amber-200/90 rounded-2xl p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Kategori Hitungan Realisasi:</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            
            {/* Tab 1: Selesai Keuangan & SPP (Default) */}
            <button
              type="button"
              onClick={() => setScopeMode('spp_all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                scopeMode === 'spp_all'
                  ? 'bg-amber-500 text-slate-950 shadow-xs border border-amber-400'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
              title="Menghitung semua berkas yang telah disetujui Pengelola Keuangan (Tahap SPP) dan/atau terbit SPP"
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Selesai Keuangan & SPP</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200/80 text-slate-950 font-black">
                {submissions.filter(s => s.status === 'selesai_keuangan' || (s.sppNumber && s.sppNumber.trim() !== '')).length}
              </span>
            </button>

            {/* Tab 2: Hanya Nomor SPP Terbit */}
            <button
              type="button"
              onClick={() => setScopeMode('spp_number_only')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                scopeMode === 'spp_number_only'
                  ? 'bg-emerald-600 text-white shadow-xs border border-emerald-500'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
              title="Hanya menghitung berkas yang nomor SPP fisiknya telah diisikan oleh Satker"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Sudah Ada No. SPP</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-950 font-black">
                {overallMetrics.totalWithPhysicalSppNumber}
              </span>
            </button>

            {/* Tab 3: Termasuk Rekomendasi Auditor */}
            <button
              type="button"
              onClick={() => setScopeMode('approved_auditor_keuangan')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                scopeMode === 'approved_auditor_keuangan'
                  ? 'bg-purple-600 text-white shadow-xs border border-purple-500'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
              title="Menghitung seluruh berkas yang disetujui (Rekomendasi Auditor + Persetujuan Keuangan + SPP)"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Disetujui Auditor & Keuangan</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-950 font-black">
                {submissions.filter(s => s.status === 'direkomendasikan' || s.status === 'selesai_keuangan' || (s.sppNumber && s.sppNumber.trim() !== '')).length}
              </span>
            </button>

            {/* Tab 4: Semua Pengajuan */}
            <button
              type="button"
              onClick={() => setScopeMode('all_submissions')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                scopeMode === 'all_submissions'
                  ? 'bg-slate-900 text-white shadow-xs border border-slate-800'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
              title="Menghitung seluruh permohonan yang diajukan Satker"
            >
              <span>Semua Permohonan</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-900 font-black">
                {submissions.length}
              </span>
            </button>

          </div>
        </div>
      </div>

      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Realisasi SPP */}
        <div className="bg-white border-2 border-amber-300/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Total Realisasi SPP / Disetujui
            </span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
              <Wallet className="h-5 w-5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-amber-950 tracking-tight">
              {formatCurrency(overallMetrics.totalSppNominal)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 font-medium">
              <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
              <span><strong>{overallMetrics.totalSppCount}</strong> Berkas Realisasi Disetujui</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Total Permohonan:</span>
            <span className="font-bold text-slate-800">{formatCurrency(overallMetrics.totalPermohonanNominal)}</span>
          </div>
        </div>

        {/* Card 2: Satker Juara 1 Realisasi */}
        <div className="bg-white border-2 border-yellow-400/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-yellow-50/50 to-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-yellow-950">
              Realisasi Tertinggi #1 🏆
            </span>
            <div className="p-2 rounded-xl bg-yellow-400 text-slate-950 shadow-2xs">
              <Trophy className="h-5 w-5 text-slate-950" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm font-black text-slate-900 line-clamp-1" title={overallMetrics.topSatker?.satkerName || '-'}>
              {overallMetrics.topSatker ? overallMetrics.topSatker.satkerName : 'Belum Ada Realisasi'}
            </div>
            <div className="text-lg font-black text-amber-900 tracking-tight mt-1">
              {overallMetrics.topSatker ? formatCurrency(overallMetrics.topSatker.totalSppNominal) : 'Rp 0'}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-yellow-200 flex items-center justify-between text-[11px]">
            <span className="text-yellow-900 font-bold">Serapan:</span>
            <span className="font-black text-emerald-700">
              {overallMetrics.topSatker ? `${overallMetrics.topSatker.realizationPercentage}% (${overallMetrics.topSatker.totalSppCount} Berkas)` : '0%'}
            </span>
          </div>
        </div>

        {/* Card 3: Tingkat Serapan Persentase */}
        <div className="bg-white border-2 border-emerald-300 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              % Serapan Realisasi
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300">
              <TrendingUp className="h-5 w-5 text-emerald-700" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700 tracking-tight">
              {overallMetrics.overallPercentage}%
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2 border border-slate-200">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(overallMetrics.overallPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Efektivitas:</span>
            <span className="font-bold text-emerald-800">
              {overallMetrics.totalSppCount} dari {overallMetrics.totalPermohonanCount} Pengajuan Realisasi
            </span>
          </div>
        </div>

        {/* Card 4: Total Satker & Wilayah */}
        <div className="bg-white border-2 border-blue-300 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Cakupan Satker Wilayah
            </span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-900 border border-blue-300">
              <Building2 className="h-5 w-5 text-blue-700" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {standardSatkers.length} Satuan Kerja
            </div>
            <div className="text-xs text-slate-600 mt-1 font-medium">
              Kejati, Kejari & Cabjari se-Lampung
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Satker Ada Realisasi:</span>
            <span className="font-black text-blue-950">
              {satkerStats.filter(s => s.totalSppNominal > 0).length} Satker
            </span>
          </div>
        </div>

      </div>

      {/* Top 3 Podium Cards */}
      {top3Satkers.length > 0 && (
        <div className="bg-white border border-amber-200/90 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-amber-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-400 text-slate-950 font-black">
                <Trophy className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Top 3 Satuan Kerja Realisasi Anggaran Tertinggi
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              🏆 Leaderboard Realisasi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3Satkers.map((satker, idx) => {
              const medals = [
                { title: 'Juara 1', color: 'from-amber-400 to-yellow-500', text: 'text-amber-950', badgeBg: 'bg-amber-400 text-slate-950', border: 'border-amber-400', icon: '🥇' },
                { title: 'Juara 2', color: 'from-slate-200 to-slate-300', text: 'text-slate-900', badgeBg: 'bg-slate-300 text-slate-950', border: 'border-slate-300', icon: '🥈' },
                { title: 'Juara 3', color: 'from-amber-600/30 to-amber-700/40', text: 'text-amber-900', badgeBg: 'bg-amber-200 text-amber-950', border: 'border-amber-300', icon: '🥉' }
              ];
              const medal = medals[idx] || medals[2];
              const isCurrentUser = currentUserSatker && normalizeSatkerName(satker.satkerName).toLowerCase() === normalizeSatkerName(currentUserSatker).toLowerCase();

              return (
                <div 
                  key={satker.satkerName}
                  className={`relative p-4 rounded-2xl border-2 ${medal.border} bg-gradient-to-b from-white to-amber-50/40 shadow-xs flex flex-col justify-between ${
                    isCurrentUser ? 'ring-2 ring-amber-500 ring-offset-2' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{medal.icon}</span>
                      <div>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${medal.badgeBg} inline-block`}>
                          Peringkat #{idx + 1}
                        </span>
                        <h4 className="font-black text-xs sm:text-sm text-slate-900 mt-1 leading-snug">
                          {satker.satkerName}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-100">
                    <span className="text-[10px] font-bold text-slate-500 block">Total Nominal Realisasi:</span>
                    <span className="text-base sm:text-lg font-black text-amber-950 block">
                      {formatCurrency(satker.totalSppNominal)}
                    </span>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1.5">
                      <span>Jumlah: <strong>{satker.totalSppCount} berkas</strong></span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {satker.realizationPercentage}% Serapan
                      </span>
                    </div>
                  </div>

                  {isCurrentUser && (
                    <div className="mt-2 text-center bg-amber-500 text-slate-950 font-black text-[10px] py-0.5 rounded-md">
                      Satker Anda ⭐
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Realisasi Breakdown per Bidang */}
      <div className="bg-white border border-amber-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-amber-700" />
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
              Distribusi Realisasi per Bidang
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {bidangStats.length} Bidang Terdaftar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {bidangStats.map((b) => (
            <div 
              key={b.bidang}
              onClick={() => setSelectedBidang(selectedBidang === b.bidang ? '' : b.bidang)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                selectedBidang === b.bidang
                  ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400 shadow-xs'
                  : 'bg-slate-50 hover:bg-amber-50/60 border-slate-200'
              }`}
            >
              <span className="text-[11px] font-extrabold text-slate-700 block truncate" title={b.bidang}>
                {b.bidang}
              </span>
              <span className="text-xs font-black text-amber-950 block mt-1">
                {formatCurrency(b.sppNominal)}
              </span>
              <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
                {b.sppCount} berkas realisasi
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Leaderboard & Satker Table List */}
      <div className="bg-white border border-amber-200/80 rounded-3xl p-5 shadow-xs space-y-4">
        
        {/* Toolbar & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-amber-100">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Satuan Kerja (contoh: Kejari Bandar Lampung, Metro, Pringsewu, Kejati)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
            />
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Filter Bidang */}
            <select
              value={selectedBidang}
              onChange={(e) => setSelectedBidang(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Semua Bidang</option>
              {uniqueBidangs.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Filter Ada Realisasi Saja */}
            <button
              type="button"
              onClick={() => setFilterSppOnly(!filterSppOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                filterSppOnly 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-2xs' 
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Hanya yang Ada Realisasi</span>
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl px-2 py-1 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer py-1"
              >
                <option value="spp_desc">Realisasi Nominal Tertinggi (Default)</option>
                <option value="spp_asc">Realisasi Nominal Terendah</option>
                <option value="nominal_desc">Total Permohonan Tertinggi</option>
                <option value="percent_desc">% Serapan Tertinggi</option>
                <option value="name_asc">Nama Satker (A-Z)</option>
              </select>
            </div>

          </div>

        </div>

        {/* Satker List / Table */}
        <div className="space-y-3">
          {filteredAndSortedSatkers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <Building2 className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <p className="font-bold text-xs">Tidak ada Satuan Kerja yang sesuai dengan pencarian atau filter.</p>
            </div>
          ) : (
            filteredAndSortedSatkers.map((satker, index) => {
              const isCurrentUser = currentUserSatker && normalizeSatkerName(satker.satkerName).toLowerCase() === normalizeSatkerName(currentUserSatker).toLowerCase();
              const isExpanded = expandedSatker === satker.satkerName;
              const hasAnySpp = satker.totalSppNominal > 0;
              const barWidth = maxRealizationNominal > 0 ? (satker.totalSppNominal / maxRealizationNominal) * 100 : 0;

              return (
                <div 
                  key={satker.satkerName}
                  className={`rounded-2xl border transition-all ${
                    isCurrentUser 
                      ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/60 shadow-xs' 
                      : hasAnySpp
                      ? 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-xs'
                      : 'bg-slate-50/80 border-slate-200 opacity-80'
                  }`}
                >
                  {/* Satker Card Header */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Rank & Satker Identity */}
                    <div className="flex items-center gap-3.5 min-w-[280px]">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                        index === 0 && hasAnySpp
                          ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                          : index === 1 && hasAnySpp
                          ? 'bg-slate-300 text-slate-950'
                          : index === 2 && hasAnySpp
                          ? 'bg-amber-200 text-amber-950'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {index === 0 && hasAnySpp ? '🥇' : index === 1 && hasAnySpp ? '🥈' : index === 2 && hasAnySpp ? '🥉' : `#${index + 1}`}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900">
                            {satker.satkerName}
                          </h4>
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full shadow-2xs">
                              Satker Anda ⭐
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5 flex-wrap">
                          <span>Permohonan: <strong>{formatCurrency(satker.totalPermohonanNominal)}</strong> ({satker.totalPermohonanCount} berkas)</span>
                          {satker.totalApprovedNominal > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-purple-900 font-bold">Disetujui: {formatCurrency(satker.totalApprovedNominal)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Realization Stats */}
                    <div className="flex-1 max-w-md space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-600">Realisasi Nominal:</span>
                        <span className="font-black text-amber-950 text-xs">
                          {formatCurrency(satker.totalSppNominal)}
                        </span>
                      </div>
                      
                      {/* Visual Progress Bar against highest satker */}
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200 flex">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            hasAnySpp ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-slate-200'
                          }`}
                          style={{ width: `${Math.max(barWidth, hasAnySpp ? 4 : 0)}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>Serapan: <strong className={hasAnySpp ? 'text-emerald-700 font-extrabold' : 'text-slate-400'}>{satker.realizationPercentage}%</strong></span>
                        <span>{satker.totalSppCount} berkas realisasi</span>
                      </div>
                    </div>

                    {/* Expand Detail Button */}
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
                      {satker.sppItems.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setExpandedSatker(isExpanded ? null : satker.satkerName)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isExpanded
                              ? 'bg-amber-200 text-amber-950 border border-amber-300'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          <span>{satker.sppItems.length} Berkas Rincian</span>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-xl">
                          Belum Ada Realisasi
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Expanded List of Realization Items for this Satker */}
                  {isExpanded && satker.sppItems.length > 0 && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2 border-t border-amber-200/80 bg-amber-50/40 rounded-b-2xl space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-950">
                        <span>Rincian Pengajuan Realisasi Anggaran {satker.satkerName}:</span>
                        <span className="text-slate-500 font-normal">Klik tombol pada berkas untuk melihat detail alur</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {satker.sppItems.map((item) => {
                          const itemRealizedNom = getRealizedNominal(item);
                          const hasSppNum = Boolean(item.sppNumber && item.sppNumber.trim() !== '');

                          return (
                            <div 
                              key={item.id}
                              className="bg-white border border-amber-200 rounded-xl p-3 shadow-2xs flex flex-col justify-between gap-2"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                  {hasSppNum ? (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded text-[10px] font-black flex items-center gap-1">
                                      <FileCheck2 className="h-3 w-3 text-emerald-700 shrink-0" />
                                      <span>SPP: {item.sppNumber}</span>
                                    </span>
                                  ) : item.status === 'selesai_keuangan' ? (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-950 border border-amber-300 rounded text-[10px] font-black flex items-center gap-1">
                                      <Wallet className="h-3 w-3 text-amber-700 shrink-0" />
                                      <span>Disetujui Keuangan (Tahap SPP)</span>
                                    </span>
                                  ) : item.status === 'direkomendasikan' ? (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-950 border border-purple-300 rounded text-[10px] font-black flex items-center gap-1">
                                      <ShieldCheck className="h-3 w-3 text-purple-700 shrink-0" />
                                      <span>Disetujui Auditor</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 rounded text-[10px] font-bold">
                                      {item.status}
                                    </span>
                                  )}

                                  <span className="text-[10px] font-bold text-slate-500 font-mono">
                                    {item.sppSubmittedAt ? formatToWIB(item.sppSubmittedAt) : formatToWIB(item.submissionTime)}
                                  </span>
                                </div>

                                <h5 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-2">
                                  {item.jenisPengajuan || item.fileName || 'Permohonan Anggaran BA BUN'}
                                </h5>

                                <div className="flex items-center justify-between text-[11px] mt-2 pt-1.5 border-t border-slate-100">
                                  <span className="text-slate-500">Bidang: <strong>{item.bidang}</strong></span>
                                  <span className="font-black text-amber-950">
                                    {formatCurrency(itemRealizedNom)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {item.sppFileUrl ? (
                                    <a
                                      href={item.sppFileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      <span>Buka PDF SPP</span>
                                    </a>
                                  ) : item.fileUrl ? (
                                    <a
                                      href={item.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] font-bold text-blue-800 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      <span>Buka Berkas</span>
                                    </a>
                                  ) : null}

                                  {/* Quick input SPP for Satker if status is selesai_keuangan and sppNumber is not yet filled */}
                                  {currentRole === 'satker' && item.status === 'selesai_keuangan' && onOpenSppModal && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenSppModal(item)}
                                      className="text-[11px] font-black bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer"
                                    >
                                      <Pencil className="h-3 w-3" />
                                      <span>{hasSppNum ? 'Edit SPP' : 'Input No. SPP'}</span>
                                    </button>
                                  )}
                                </div>

                                {onViewDetail && (
                                  <button
                                    type="button"
                                    onClick={() => onViewDetail(item)}
                                    className="text-[11px] font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer shrink-0"
                                  >
                                    Lihat Detail Alur →
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
