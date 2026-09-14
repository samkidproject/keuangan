import React, { useState, useEffect } from 'react';
import { SatkerPagu } from '../types';
import { DEFAULT_SATKER_PAGU, getDefaultPaguMap } from '../data/defaultPagu';
import { 
  X, 
  Coins, 
  Save, 
  RotateCcw, 
  Search, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  TrendingUp,
  Sparkles,
  Info
} from 'lucide-react';

interface AdminPaguModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPaguMap: Record<string, number>;
  onSaveBatchPagu: (paguItems: Array<{ satkerName: string; paguAnggaran: number; keterangan?: string }>) => Promise<void>;
  onSaveSinglePagu: (satkerName: string, paguAnggaran: number) => Promise<void>;
  satkerList: string[];
  realisasiMap?: Record<string, number>;
}

export const AdminPaguModal: React.FC<AdminPaguModalProps> = ({
  isOpen,
  onClose,
  currentPaguMap,
  onSaveBatchPagu,
  onSaveSinglePagu,
  satkerList,
  realisasiMap = {}
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [localPagu, setLocalPagu] = useState<Record<string, number>>({});
  const [savingSatker, setSavingSatker] = useState<string | null>(null);
  const [isSavingAll, setIsSavingAll] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Synchronize local edit state whenever modal opens or currentPaguMap updates
  useEffect(() => {
    if (isOpen) {
      const initialMap: Record<string, number> = { ...getDefaultPaguMap(), ...currentPaguMap };
      // Ensure all standard satkers have an entry
      satkerList.forEach(name => {
        if (initialMap[name] === undefined) {
          initialMap[name] = 0; // Default Rp 0
        }
      });
      setLocalPagu(initialMap);
      setStatusMessage(null);
    }
  }, [isOpen, currentPaguMap, satkerList]);

  if (!isOpen) return null;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handlePaguChange = (satkerName: string, rawVal: string) => {
    // Strip non-numeric
    const numericStr = rawVal.replace(/[^0-9]/g, '');
    const num = numericStr ? parseInt(numericStr, 10) : 0;
    setLocalPagu(prev => ({
      ...prev,
      [satkerName]: num
    }));
  };

  const handleAddNominal = (satkerName: string, delta: number) => {
    setLocalPagu(prev => ({
      ...prev,
      [satkerName]: Math.max(0, (prev[satkerName] || 0) + delta)
    }));
  };

  const handleSaveSingle = async (satkerName: string) => {
    try {
      setSavingSatker(satkerName);
      setStatusMessage(null);
      const amount = localPagu[satkerName] || 0;
      await onSaveSinglePagu(satkerName, amount);
      setStatusMessage({
        type: 'success',
        text: `Pagu untuk "${satkerName}" berhasil disimpan ke Firebase!`
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Gagal menyimpan: ${err?.message || 'Koneksi bermasalah'}`
      });
    } finally {
      setSavingSatker(null);
    }
  };

  const handleSaveAll = async () => {
    try {
      setIsSavingAll(true);
      setStatusMessage(null);
      const itemsToSave = Object.entries(localPagu).map(([satkerName, paguAnggaran]) => ({
        satkerName,
        paguAnggaran
      }));

      await onSaveBatchPagu(itemsToSave);
      setStatusMessage({
        type: 'success',
        text: `Sukses! Seluruh data pagu ${itemsToSave.length} Satker berhasil disimpan ke Firebase Firestore.`
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Gagal menyimpan seluruh pagu: ${err?.message || 'Periksa koneksi internet'}`
      });
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleResetToZero = () => {
    if (window.confirm('Reset seluruh nilai pagu DIPA satker menjadi Rp 0?')) {
      const zeroMap: Record<string, number> = {};
      satkerList.forEach(name => {
        zeroMap[name] = 0;
      });
      setLocalPagu(zeroMap);
      setStatusMessage({
        type: 'success',
        text: 'Pagu seluruh satker di-reset ke Rp 0. Klik "Simpan Semua ke Firebase" untuk memperbarui cloud.'
      });
    }
  };

  // Filtered Satker list
  const filteredSatkers = satkerList.filter(name => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Total Pagu across all satkers
  const totalPaguWilayah: number = (Object.values(localPagu) as number[]).reduce((acc: number, curr: number) => acc + (Number(curr) || 0), 0);
  const totalRealisasiWilayah: number = (Object.values(realisasiMap) as number[]).reduce((acc: number, curr: number) => acc + (Number(curr) || 0), 0);
  const persentaseTotal = totalPaguWilayah > 0 
    ? ((totalRealisasiWilayah / totalPaguWilayah) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 text-slate-950 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-950/10 rounded-xl border border-slate-950/20">
              <Coins className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-slate-950">
                  Entry & Pengaturan Pagu DIPA Satker
                </h2>
                <span className="px-2 py-0.5 bg-slate-950 text-amber-300 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                  Admin Keuangan
                </span>
              </div>
              <p className="text-xs text-amber-950 font-medium">
                Atur pagu anggaran masing-masing Satker untuk klasemen perankingan penyerapan dana BA BUN
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 transition-colors cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Total Summary Strip */}
        <div className="px-6 py-3.5 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <div>
              <span className="text-[11px] text-amber-900 font-semibold block">Total Pagu Se-Wilayah:</span>
              <span className="text-sm font-black text-slate-900">{formatRupiah(totalPaguWilayah)}</span>
            </div>
            <div className="h-7 w-px bg-amber-200 hidden sm:block" />
            <div>
              <span className="text-[11px] text-emerald-900 font-semibold block">Total Realisasi Pencairan:</span>
              <span className="text-sm font-black text-emerald-800">{formatRupiah(totalRealisasiWilayah)}</span>
            </div>
            <div className="h-7 w-px bg-amber-200 hidden sm:block" />
            <div>
              <span className="text-[11px] text-amber-950 font-semibold block">Rata-rata Penyerapan:</span>
              <span className="text-sm font-black text-amber-900">{persentaseTotal}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToZero}
              className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Reset seluruh pagu satker ke Rp 0"
            >
              <RotateCcw className="h-3.5 w-3.5 text-rose-500" />
              <span>Reset Semua Rp 0</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSavingAll}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSavingAll ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan Semua...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Simpan Semua ke Firebase</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className={`mx-6 mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-bold ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : 'bg-rose-50 text-rose-900 border border-rose-300'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Search & Info */}
        <div className="p-6 pb-2 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama Kejari atau Cabjari..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Info className="h-3.5 w-3.5 text-amber-600" />
              <span>Menampilkan {filteredSatkers.length} dari {satkerList.length} Satker</span>
            </div>
          </div>
        </div>

        {/* Satker Pagu Table List */}
        <div className="px-6 py-2 max-h-[55vh] overflow-y-auto">
          <div className="space-y-2.5">
            {filteredSatkers.map((satkerName, index) => {
              const currentVal = localPagu[satkerName] || 0;
              const realisasiVal = realisasiMap[satkerName] || 0;
              const percent = currentVal > 0 
                ? Math.min(100, (realisasiVal / currentVal) * 100).toFixed(1)
                : '0.0';
              const isSavingThis = savingSatker === satkerName;

              return (
                <div 
                  key={satkerName}
                  className="p-3.5 bg-slate-50 hover:bg-amber-50/40 border border-slate-200 hover:border-amber-300 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  {/* Satker Identity */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center text-xs font-black text-slate-400">
                        {index + 1}.
                      </span>
                      <div className="p-1.5 bg-amber-100 rounded-lg text-amber-900 shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 leading-snug">
                          {satkerName}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>Realisasi: <strong className="text-emerald-700 font-bold">{formatRupiah(realisasiVal)}</strong></span>
                          <span>•</span>
                          <span>Penyerapan: <strong className="text-amber-800 font-bold">{percent}%</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pagu Input & Presets */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <div className="w-full sm:w-52">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                          Rp
                        </span>
                        <input
                          type="text"
                          value={currentVal ? currentVal.toLocaleString('id-ID') : '0'}
                          onChange={(e) => handlePaguChange(satkerName, e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                          placeholder="0"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block text-right mt-0.5 font-medium truncate">
                        {formatRupiah(currentVal)}
                      </span>
                    </div>

                    {/* Quick Add Presets */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handlePaguChange(satkerName, '0')}
                        title="Setel Pagu menjadi Rp 0"
                        className="px-1.5 py-1 bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-800 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Rp 0
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddNominal(satkerName, 1000000000)}
                        title="Tambah 1 Miliar"
                        className="px-1.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        +1M
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddNominal(satkerName, 500000000)}
                        title="Tambah 500 Juta"
                        className="px-1.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        +500Jt
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveSingle(satkerName)}
                        disabled={isSavingThis}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all cursor-pointer disabled:opacity-50"
                        title="Simpan Pagu Satker ini"
                      >
                        {isSavingThis ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <p className="text-[11px] text-slate-500">
            💡 <em>Pagu yang disimpan otomatis memperbarui klasemen peringkat realisasi di seluruh tampilan dashboard.</em>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSavingAll}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSavingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan Seluruh Pagu...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Simpan Semua Pagu</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
