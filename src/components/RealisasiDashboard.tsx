import React, { useState, useMemo } from 'react';
import { SubmissionItem, UserRole } from '../types';
import { DEFAULT_SATKER_ACCOUNTS } from '../data/defaultSatkers';
import { getDefaultPaguMap } from '../data/defaultPagu';
import { formatToWIB } from '../lib/dateUtils';
import { openAttachmentFile } from '../lib/firestoreService';
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
  Coins,
  AlertCircle,
  Pencil,
  Flame,
  Award,
  Zap
} from 'lucide-react';

interface RealisasiDashboardProps {
  submissions: SubmissionItem[];
  currentRole: UserRole;
  currentUserSatker?: string;
  paguMap?: Record<string, number>;
  onOpenAdminPaguModal?: () => void;
  onOpenEditSatkerPagu?: (satkerName: string) => void;
  onViewDetail?: (item: SubmissionItem) => void;
  onOpenSppModal?: (item: SubmissionItem) => void;
}

export type RealizationScopeMode = 'spp_all' | 'spp_number_only' | 'approved_auditor_keuangan' | 'all_submissions';
export type RankingSortMode = 'spp_desc' | 'percent_desc' | 'count_desc' | 'sisa_asc' | 'nominal_desc' | 'name_asc';

export interface SatkerRealizationData {
  satkerName: string;
  paguAnggaran: number;
  totalPermohonanNominal: number;
  totalPermohonanCount: number;
  totalApprovedNominal: number;
  totalSppNominal: number;
  totalSppCount: number;
  sisaPagu: number;
  realizationPercentage: number; // based on Pagu DIPA
  sppItems: SubmissionItem[];
  allSubmissions: SubmissionItem[];
  rank?: number;
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
  paguMap = {},
  onOpenAdminPaguModal,
  onOpenEditSatkerPagu,
  onViewDetail,
  onOpenSppModal,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBidang, setSelectedBidang] = useState<string>('');
  const [scopeMode, setScopeMode] = useState<RealizationScopeMode>('spp_all');
  const [filterSppOnly, setFilterSppOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<RankingSortMode>('spp_desc');
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

    if (scopeMode === 'spp_number_only') {
      return hasSppNumber;
    }
    if (scopeMode === 'approved_auditor_keuangan') {
      return isSelesaiKeuangan || isDirekomendasikan || hasSppNumber;
    }
    if (scopeMode === 'all_submissions') {
      return true;
    }
    // Default 'spp_all': Selesai keuangan atau ada bukti SPP
    return isSelesaiKeuangan || hasSppNumber || hasSppFile || hasSppDate || hasFinanceTimestamp;
  };

  // Standard Satker List
  const standardSatkers = useMemo(() => {
    const list = DEFAULT_SATKER_ACCOUNTS.map(a => a.satkerName);
    const kejati = 'Kejati Lampung';
    if (!list.includes(kejati)) {
      list.unshift(kejati);
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

  // Aggregate realization data and merge with Pagu per Satuan Kerja
  const satkerStats = useMemo(() => {
    const defaultPagu = getDefaultPaguMap();
    const map = new Map<string, SatkerRealizationData>();

    // Initialize map for all standard satkers
    standardSatkers.forEach(satkerName => {
      const assignedPagu = paguMap[satkerName] !== undefined 
        ? paguMap[satkerName] 
        : (defaultPagu[satkerName] ?? 0);

      map.set(satkerName, {
        satkerName,
        paguAnggaran: assignedPagu,
        totalPermohonanNominal: 0,
        totalPermohonanCount: 0,
        totalApprovedNominal: 0,
        totalSppNominal: 0,
        totalSppCount: 0,
        sisaPagu: assignedPagu,
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
        const assignedPagu = paguMap[satkerKey] !== undefined 
          ? paguMap[satkerKey] 
          : (defaultPagu[satkerKey] ?? 0);

        entry = {
          satkerName: satkerKey,
          paguAnggaran: assignedPagu,
          totalPermohonanNominal: 0,
          totalPermohonanCount: 0,
          totalApprovedNominal: 0,
          totalSppNominal: 0,
          totalSppCount: 0,
          sisaPagu: assignedPagu,
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

    // Calculate percentage against Pagu
    const results: SatkerRealizationData[] = [];
    map.forEach(data => {
      data.sisaPagu = Math.max(0, data.paguAnggaran - data.totalSppNominal);
      if (data.paguAnggaran > 0) {
        data.realizationPercentage = Number(((data.totalSppNominal / data.paguAnggaran) * 100).toFixed(1));
      } else {
        data.realizationPercentage = 0;
      }
      results.push(data);
    });

    return results;
  }, [submissions, standardSatkers, selectedBidang, scopeMode, paguMap]);

  // Overall Totals
  const overallMetrics = useMemo(() => {
    const totalPaguNominal = satkerStats.reduce((acc, curr) => acc + curr.paguAnggaran, 0);
    const totalSppNominal = satkerStats.reduce((acc, curr) => acc + curr.totalSppNominal, 0);
    const totalPermohonanNominal = satkerStats.reduce((acc, curr) => acc + curr.totalPermohonanNominal, 0);
    const totalApprovedNominal = satkerStats.reduce((acc, curr) => acc + curr.totalApprovedNominal, 0);
    const totalSppCount = satkerStats.reduce((acc, curr) => acc + curr.totalSppCount, 0);
    const totalPermohonanCount = satkerStats.reduce((acc, curr) => acc + curr.totalPermohonanCount, 0);
    const totalSisaPagu = Math.max(0, totalPaguNominal - totalSppNominal);
    const overallPercentage = totalPaguNominal > 0 
      ? Number(((totalSppNominal / totalPaguNominal) * 100).toFixed(1))
      : 0;

    // Highest Satker by Nominal
    const sortedBySpp = [...satkerStats].sort((a, b) => b.totalSppNominal - a.totalSppNominal);
    const topSatkerNominal = sortedBySpp.length > 0 && sortedBySpp[0].totalSppNominal > 0 ? sortedBySpp[0] : null;

    // Highest Satker by % Serapan
    const sortedByPercent = [...satkerStats].sort((a, b) => b.realizationPercentage - a.realizationPercentage);
    const topSatkerPercent = sortedByPercent.length > 0 && sortedByPercent[0].realizationPercentage > 0 ? sortedByPercent[0] : null;

    return {
      totalPaguNominal,
      totalSppNominal,
      totalPermohonanNominal,
      totalApprovedNominal,
      totalSppCount,
      totalPermohonanCount,
      totalSisaPagu,
      overallPercentage,
      topSatkerNominal,
      topSatkerPercent
    };
  }, [satkerStats]);

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

  // Filter and sort the satker list for the Leaderboard
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
      if (sortBy === 'percent_desc') {
        return b.realizationPercentage - a.realizationPercentage;
      }
      if (sortBy === 'count_desc') {
        return b.totalSppCount - a.totalSppCount;
      }
      if (sortBy === 'sisa_asc') {
        return a.sisaPagu - b.sisaPagu;
      }
      if (sortBy === 'nominal_desc') {
        return b.totalPermohonanNominal - a.totalPermohonanNominal;
      }
      if (sortBy === 'name_asc') {
        return a.satkerName.localeCompare(b.satkerName);
      }
      return 0;
    });

    // Assign dynamic ranks based on current sort
    return result.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  }, [satkerStats, searchTerm, filterSppOnly, sortBy]);

  // Podium Top 3 Satkers (Default to highest realization nominal or percentage depending on active sort)
  const top3Satkers = useMemo(() => {
    // If user selected percent_desc, top 3 based on percentage; otherwise based on nominal
    const key = sortBy === 'percent_desc' ? 'realizationPercentage' : 'totalSppNominal';
    const sorted = [...satkerStats]
      .filter(s => s.totalSppNominal > 0 || s.realizationPercentage > 0)
      .sort((a, b) => b[key] - a[key]);

    // If fewer than 3 have realization, take highest pagu/submissions
    if (sorted.length < 3) {
      const remaining = satkerStats
        .filter(s => !sorted.some(x => x.satkerName === s.satkerName))
        .sort((a, b) => b.totalPermohonanNominal - a.totalPermohonanNominal);
      sorted.push(...remaining.slice(0, 3 - sorted.length));
    }

    return sorted.slice(0, 3);
  }, [satkerStats, sortBy]);

  // Realisasi mapping for AdminPaguModal
  const realisasiMap = useMemo(() => {
    const map: Record<string, number> = {};
    satkerStats.forEach(s => {
      map[s.satkerName] = s.totalSppNominal;
    });
    return map;
  }, [satkerStats]);

  // User's own satker ranking calculation
  const currentUserRanking = useMemo(() => {
    if (!currentUserSatker) return null;
    const normalizedUserSatker = normalizeSatkerName(currentUserSatker).toLowerCase();
    const foundIndex = filteredAndSortedSatkers.findIndex(
      s => normalizeSatkerName(s.satkerName).toLowerCase() === normalizedUserSatker
    );
    if (foundIndex === -1) return null;
    return {
      rank: foundIndex + 1,
      totalSatker: filteredAndSortedSatkers.length,
      data: filteredAndSortedSatkers[foundIndex]
    };
  }, [filteredAndSortedSatkers, currentUserSatker]);

  // Unique bidang options
  const uniqueBidangs = useMemo(() => {
    return Array.from(new Set(submissions.map(s => s.bidang).filter(Boolean))).sort();
  }, [submissions]);

  // Copy Summary to Clipboard (Formatted for WhatsApp Leadership Reports)
  const handleCopyReport = () => {
    const textLines = [
      `🏆 *KLASEMEN REALISASI ANGGARAN BA BUN SE-WILAYAH KEJATI LAMPUNG* 🏆`,
      `📅 Tanggal Pembaruan: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      `----------------------------------------------------`,
      `💰 *TOTAL PAGU DIPA WILAYAH:* ${formatCurrency(overallMetrics.totalPaguNominal)}`,
      `💵 *TOTAL REALISASI PENCAIRAN:* ${formatCurrency(overallMetrics.totalSppNominal)} (${overallMetrics.overallPercentage}%)`,
      `📉 *SISA PAGU ANGGARAN:* ${formatCurrency(overallMetrics.totalSisaPagu)}`,
      `📑 *TOTAL BERKAS PENCAIRAN:* ${overallMetrics.totalSppCount} Berkas Terbit`,
      `----------------------------------------------------`,
      `🥇 *PERINGKAT PENYERAPAN ANGGARAN SATKER:*`,
      ...filteredAndSortedSatkers.map((s, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
        return `${medal} *${s.satkerName}*\n   • Realisasi: ${formatCurrency(s.totalSppNominal)} / Pagu: ${formatCurrency(s.paguAnggaran)}\n   • Serapan: *${s.realizationPercentage}%* (${s.totalSppCount} berkas) | Sisa: ${formatCurrency(s.sisaPagu)}`;
      }),
      `----------------------------------------------------`,
      `🚀 *Ayo pacu penyerapan anggaran untuk akselerasi kinerja penegakan hukum dan pelayanan publik!*`,
      `_Dihasilkan otomatis oleh Portal Terpadu BA BUN Kejati Lampung_`
    ];

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 3000);
  };

  const getZoneBadge = (percentage: number) => {
    if (percentage >= 75) {
      return {
        label: 'Zona Hijau (Sangat Baik)',
        color: 'bg-emerald-100 text-emerald-950 border-emerald-300',
        barColor: 'from-emerald-500 to-teal-600',
        glow: 'text-emerald-600'
      };
    }
    if (percentage >= 50) {
      return {
        label: 'Zona Biru (Optimal)',
        color: 'bg-blue-100 text-blue-950 border-blue-300',
        barColor: 'from-blue-500 to-indigo-600',
        glow: 'text-blue-600'
      };
    }
    if (percentage >= 25) {
      return {
        label: 'Zona Kuning (Akselerasi)',
        color: 'bg-amber-100 text-amber-950 border-amber-300',
        barColor: 'from-amber-400 to-yellow-600',
        glow: 'text-amber-600'
      };
    }
    return {
      label: 'Zona Merah (Perlu Dorongan)',
      color: 'bg-rose-100 text-rose-950 border-rose-300',
      barColor: 'from-rose-500 to-red-600',
      glow: 'text-rose-600'
    };
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
                Klasemen & Realisasi Anggaran BA BUN
              </span>
              <span className="px-2.5 py-0.5 bg-amber-300/90 text-slate-950 text-[11px] font-black rounded-full border border-amber-400 flex items-center gap-1">
                <Flame className="h-3 w-3 text-red-600" />
                Pemacu Kinerja Satker Se-Lampung
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
              Perankingan Penyerapan Anggaran & Realisasi Pagu DIPA
            </h2>
            <p className="text-xs sm:text-sm text-slate-950 font-medium max-w-3xl leading-relaxed">
              Pantau serapan anggaran masing-masing Satuan Kerja terhadap Pagu DIPA, ranking satker dengan pencairan terbanyak, serta berpacu bersama untuk mencapai realisasi optimal se-Wilayah Kejaksaan Tinggi Lampung.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0">
            {/* Admin Pagu Button - Exclusively for Sub Bagian Keuangan */}
            {currentRole === 'keuangan' && onOpenAdminPaguModal && (
              <button
                type="button"
                onClick={onOpenAdminPaguModal}
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 active:scale-95 text-amber-300 font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer border border-amber-400"
                title="Kelola & Entry Pagu DIPA Satuan Kerja (Sub Bagian Keuangan)"
              >
                <Coins className="h-4 w-4 text-amber-400" />
                <span>Entry Pagu DIPA Satker</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyReport}
              className="px-3.5 py-2.5 bg-amber-200/90 hover:bg-amber-100 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 border border-amber-300"
              title="Salin Ringkasan Laporan Klasemen Realisasi ke WhatsApp"
            >
              {copiedReport ? (
                <>
                  <Check className="h-4 w-4 text-emerald-800" />
                  <span className="text-emerald-950">Disalin ke WA!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-950" />
                  <span>Salin Format Laporan WA</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Realization Scope Selector */}
        <div className="mt-5 pt-4 border-t border-amber-400/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-slate-950">Kriteria Hitung Realisasi:</span>
            <div className="flex items-center gap-1 bg-black/15 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setScopeMode('spp_all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  scopeMode === 'spp_all' ? 'bg-slate-950 text-amber-300 shadow-xs' : 'text-slate-900 hover:bg-white/20'
                }`}
              >
                Selesai Keuangan & SPP (Standar)
              </button>
              <button
                type="button"
                onClick={() => setScopeMode('spp_number_only')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  scopeMode === 'spp_number_only' ? 'bg-slate-950 text-amber-300 shadow-xs' : 'text-slate-900 hover:bg-white/20'
                }`}
              >
                Fisik SPP Terbit Saja
              </button>
              <button
                type="button"
                onClick={() => setScopeMode('approved_auditor_keuangan')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  scopeMode === 'approved_auditor_keuangan' ? 'bg-slate-950 text-amber-300 shadow-xs' : 'text-slate-900 hover:bg-white/20'
                }`}
              >
                Semua Disetujui
              </button>
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-900 bg-white/30 px-3 py-1 rounded-lg">
            Total {standardSatkers.length} Satker Se-Wilayah Hukum Lampung
          </div>
        </div>
      </div>

      {/* Motivational Satker Banner (If user is logged in as Satker) */}
      {currentUserRanking && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-2xl p-4.5 border-2 border-amber-400 shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shrink-0 shadow-md">
              {currentUserRanking.rank === 1 ? '🥇' : currentUserRanking.rank === 2 ? '🥈' : currentUserRanking.rank === 3 ? '🥉' : `#${currentUserRanking.rank}`}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-amber-300 text-xs font-black uppercase tracking-wider">
                  🏁 Kinerja Satuan Kerja Anda
                </span>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-400/30">
                  {currentUserRanking.data.satkerName}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black mt-0.5">
                Peringkat #{currentUserRanking.rank} dari {currentUserRanking.totalSatker} Satker se-Lampung
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Realisasi: <strong className="text-amber-300 font-black">{formatCurrency(currentUserRanking.data.totalSppNominal)}</strong> dari Pagu <strong className="text-slate-200">{formatCurrency(currentUserRanking.data.paguAnggaran)}</strong> ({currentUserRanking.data.realizationPercentage}% Penyerapan)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Status Serapan:</span>
              <span className="text-xs font-black text-emerald-400">
                {currentUserRanking.data.realizationPercentage >= 75 ? '🌟 Zona Hijau (Unggul)' :
                 currentUserRanking.data.realizationPercentage >= 50 ? '⚡ Zona Biru (Optimal)' :
                 currentUserRanking.data.realizationPercentage >= 25 ? '⏳ Zona Kuning (Akselerasi)' :
                 '🚀 Zona Merah (Perlu Pacu)'}
              </span>
            </div>
            <div className="p-2.5 bg-amber-400/20 rounded-xl border border-amber-400/40 text-amber-300">
              <Zap className="h-5 w-5 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Overview Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Pagu DIPA Se-Wilayah */}
        <div className="bg-white border-2 border-amber-300/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Total Pagu DIPA Wilayah
            </span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
              <Coins className="h-5 w-5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(overallMetrics.totalPaguNominal)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 font-medium">
              <span>Sisa Pagu: <strong className="text-amber-900 font-bold">{formatCurrency(overallMetrics.totalSisaPagu)}</strong></span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Cakupan:</span>
            <span className="font-bold text-slate-800">{standardSatkers.length} Satker (Kejati/Kejari/Cabjari)</span>
          </div>
        </div>

        {/* Card 2: Total Realisasi Pencairan */}
        <div className="bg-white border-2 border-emerald-300 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Total Realisasi Pencairan
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300">
              <Wallet className="h-5 w-5 text-emerald-700" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight">
              {formatCurrency(overallMetrics.totalSppNominal)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 font-medium">
              <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
              <span><strong>{overallMetrics.totalSppCount}</strong> Berkas Terbit Realisasi</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Tingkat Penyerapan:</span>
            <span className="font-black text-emerald-700">{overallMetrics.overallPercentage}% dari Total Pagu</span>
          </div>
        </div>

        {/* Card 3: Juara 1 Pencairan Nominal */}
        <div className="bg-white border-2 border-yellow-400/90 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-yellow-50/50 to-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-yellow-950">
              Juara Nominal Terbanyak 🏆
            </span>
            <div className="p-2 rounded-xl bg-yellow-400 text-slate-950 shadow-2xs">
              <Trophy className="h-5 w-5 text-slate-950" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm font-black text-slate-900 line-clamp-1" title={overallMetrics.topSatkerNominal?.satkerName || '-'}>
              {overallMetrics.topSatkerNominal ? overallMetrics.topSatkerNominal.satkerName : 'Belum Ada Realisasi'}
            </div>
            <div className="text-lg font-black text-amber-900 tracking-tight mt-1">
              {overallMetrics.topSatkerNominal ? formatCurrency(overallMetrics.topSatkerNominal.totalSppNominal) : 'Rp 0'}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-yellow-200 flex items-center justify-between text-[11px]">
            <span className="text-yellow-900 font-bold">Penyerapan:</span>
            <span className="font-black text-emerald-700">
              {overallMetrics.topSatkerNominal ? `${overallMetrics.topSatkerNominal.realizationPercentage}% (${overallMetrics.topSatkerNominal.totalSppCount} Berkas)` : '0%'}
            </span>
          </div>
        </div>

        {/* Card 4: Pemuncak Persentase Penyerapan */}
        <div className="bg-white border-2 border-purple-300 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-950">
              Serapan Tertinggi (%) ⚡
            </span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-900 border border-purple-300">
              <TrendingUp className="h-5 w-5 text-purple-700" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm font-black text-slate-900 line-clamp-1" title={overallMetrics.topSatkerPercent?.satkerName || '-'}>
              {overallMetrics.topSatkerPercent ? overallMetrics.topSatkerPercent.satkerName : 'Belum Ada Realisasi'}
            </div>
            <div className="text-lg font-black text-purple-900 tracking-tight mt-1">
              {overallMetrics.topSatkerPercent ? `${overallMetrics.topSatkerPercent.realizationPercentage}% Pagu Terpakai` : '0%'}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-purple-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Nominal:</span>
            <span className="font-bold text-purple-950">
              {overallMetrics.topSatkerPercent ? formatCurrency(overallMetrics.topSatkerPercent.totalSppNominal) : 'Rp 0'}
            </span>
          </div>
        </div>

      </div>

      {/* Top 3 Podium Cards (Visual Gamification & Motivation) */}
      {top3Satkers.length > 0 && (
        <div className="bg-gradient-to-b from-white via-amber-50/20 to-white border border-amber-300 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-400 text-slate-950 font-black">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Podium Top 3 Satker Pemimpin Realisasi
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {sortBy === 'percent_desc' ? 'Berdasarkan Persentase Serapan Pagu DIPA Tertinggi' : 'Berdasarkan Total Nominal Pencairan Terbanyak'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-950 bg-amber-200 px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-800" />
                <span>Leaderboard Utama 🏆</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3Satkers.map((satker, idx) => {
              const medals = [
                { 
                  title: 'Juara 1 - Emas', 
                  color: 'from-amber-400 to-yellow-500', 
                  badgeBg: 'bg-amber-400 text-slate-950', 
                  border: 'border-amber-400 ring-2 ring-amber-300', 
                  icon: '🥇',
                  roleBadge: '👑 Pemuncak Klasemen'
                },
                { 
                  title: 'Juara 2 - Perak', 
                  color: 'from-slate-200 to-slate-300', 
                  badgeBg: 'bg-slate-300 text-slate-950', 
                  border: 'border-slate-300', 
                  icon: '🥈',
                  roleBadge: '🥈 Runner Up'
                },
                { 
                  title: 'Juara 3 - Perunggu', 
                  color: 'from-amber-600/30 to-amber-700/40', 
                  badgeBg: 'bg-amber-200 text-amber-950', 
                  border: 'border-amber-300', 
                  icon: '🥉',
                  roleBadge: '🥉 Posisi 3'
                }
              ];
              const medal = medals[idx] || medals[2];
              const isCurrentUser = currentUserSatker && normalizeSatkerName(satker.satkerName).toLowerCase() === normalizeSatkerName(currentUserSatker).toLowerCase();
              const zone = getZoneBadge(satker.realizationPercentage);

              return (
                <div 
                  key={satker.satkerName}
                  className={`relative p-4 rounded-2xl border-2 ${medal.border} bg-white shadow-xs flex flex-col justify-between transition-all hover:scale-[1.01] ${
                    isCurrentUser ? 'ring-2 ring-amber-500 ring-offset-2' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl">{medal.icon}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${medal.badgeBg}`}>
                              Peringkat #{idx + 1}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              {medal.roleBadge}
                            </span>
                          </div>
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 mt-1 leading-snug">
                            {satker.satkerName}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block">Total Realisasi Pencairan:</span>
                        <span className="text-base sm:text-lg font-black text-amber-950 block">
                          {formatCurrency(satker.totalSppNominal)}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Pagu DIPA:</span>
                          <span className="font-extrabold text-slate-800">{formatCurrency(satker.paguAnggaran)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Sisa Pagu:</span>
                          <span className="font-bold text-slate-600">{formatCurrency(satker.sisaPagu)}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700">Persentase Serapan:</span>
                          <span className="font-black text-emerald-800 text-xs">
                            {satker.realizationPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full bg-gradient-to-r ${zone.barColor} rounded-full`}
                            style={{ width: `${Math.min(satker.realizationPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${zone.color}`}>
                      {zone.label}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {satker.totalSppCount} Berkas Terbit
                    </span>
                  </div>

                  {isCurrentUser && (
                    <div className="mt-2 text-center bg-amber-500 text-slate-950 font-black text-[10px] py-1 rounded-md">
                      Satuan Kerja Anda ⭐
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
        <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-amber-700" />
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
              Distribusi Realisasi per Bidang
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {bidangStats.length} Bidang Terdaftar (Klik bidang untuk filter)
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
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
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
                onChange={(e) => setSortBy(e.target.value as RankingSortMode)}
                className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer py-1"
              >
                <option value="spp_desc">Paling Banyak Pencairan (Nominal Rp)</option>
                <option value="percent_desc">Tertinggi % Penyerapan Pagu DIPA</option>
                <option value="count_desc">Terbanyak Berkas Selesai</option>
                <option value="sisa_asc">Sisa Pagu Terkecil</option>
                <option value="nominal_desc">Total Nilai Permohonan</option>
                <option value="name_asc">Nama Satker (A-Z)</option>
              </select>
            </div>

            {/* Admin Pagu Quick Action - Exclusively for Sub Bagian Keuangan */}
            {currentRole === 'keuangan' && onOpenAdminPaguModal && (
              <button
                type="button"
                onClick={onOpenAdminPaguModal}
                className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-xl text-xs border border-amber-300 flex items-center gap-1.5 cursor-pointer"
                title="Buka Pengaturan Pagu Satker"
              >
                <Coins className="h-3.5 w-3.5 text-amber-700" />
                <span>Atur Pagu</span>
              </button>
            )}

          </div>

        </div>

        {/* Klasemen Satker List / Table */}
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
              const zone = getZoneBadge(satker.realizationPercentage);

              return (
                <div 
                  key={satker.satkerName}
                  className={`rounded-2xl border transition-all ${
                    isCurrentUser 
                      ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/60 shadow-xs' 
                      : hasAnySpp
                      ? 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-xs'
                      : 'bg-slate-50/80 border-slate-200 opacity-90'
                  }`}
                >
                  {/* Satker Card Header */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Rank & Satker Identity */}
                    <div className="flex items-center gap-3.5 min-w-[280px]">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
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
                          <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${zone.color}`}>
                            {zone.label}
                          </span>
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

                    {/* Pagu, Realisasi & Sisa Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-[11px] bg-slate-50/90 p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <span>Pagu DIPA:</span>
                          {currentRole === 'keuangan' && onOpenAdminPaguModal && (
                            <button
                              type="button"
                              onClick={() => onOpenAdminPaguModal()}
                              className="text-amber-700 hover:text-amber-950 cursor-pointer"
                              title="Edit Pagu Satker"
                            >
                              <Pencil className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                        <span className="font-extrabold text-slate-900 block text-xs">
                          {formatCurrency(satker.paguAnggaran)}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block">Realisasi Pencairan:</span>
                        <span className="font-black text-amber-950 block text-xs">
                          {formatCurrency(satker.totalSppNominal)}
                        </span>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-slate-500 block">Sisa Anggaran:</span>
                        <span className="font-bold text-slate-700 block text-xs">
                          {formatCurrency(satker.sisaPagu)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Penyerapan % */}
                    <div className="w-full lg:w-48 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-600">Penyerapan:</span>
                        <span className="font-black text-slate-950 text-xs">
                          {satker.realizationPercentage}%
                        </span>
                      </div>
                      
                      {/* Visual Progress Bar against Pagu */}
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200 flex">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full bg-gradient-to-r ${zone.barColor}`}
                          style={{ width: `${Math.min(satker.realizationPercentage, 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>{satker.totalSppCount} berkas realisasi</span>
                        <span className="font-semibold text-slate-400">Target 100%</span>
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
                                    <button
                                      type="button"
                                      onClick={() => openAttachmentFile(item.sppFileUrl!, item.sppFileName || 'Berkas_SPP.pdf')}
                                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      <span>Buka PDF SPP</span>
                                    </button>
                                  ) : item.fileUrl ? (
                                    <button
                                      type="button"
                                      onClick={() => openAttachmentFile(item.fileUrl!, item.fileName || 'Berkas_Permohonan.pdf')}
                                      className="text-[11px] font-bold text-blue-800 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1 cursor-pointer"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      <span>Buka Berkas</span>
                                    </button>
                                  ) : null}

                                  {/* Quick input SPP if status is selesai_keuangan */}
                                  {(currentRole === 'satker' || currentRole === 'keuangan' || currentRole === 'verifikator' || currentRole === 'admin') && item.status === 'selesai_keuangan' && onOpenSppModal && (
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
