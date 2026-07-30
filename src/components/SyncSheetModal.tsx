import React from 'react';
import { X, FileSpreadsheet, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';
import { SPREADSHEET_URL, SPREADSHEET_CSV_URL } from '../data/initialData';

interface SyncSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncNow: () => void;
  isSyncing: boolean;
  lastSynced: string | null;
  itemsCount: number;
}

export const SyncSheetModal: React.FC<SyncSheetModalProps> = ({
  isOpen,
  onClose,
  onSyncNow,
  isSyncing,
  lastSynced,
  itemsCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-amber-200 rounded-2xl w-full max-w-lg shadow-2xl my-8 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Integrasi Google Spreadsheet</h3>
              <p className="text-xs text-slate-600 font-medium">Sub Bagian Keuangan BA BUN Online Sync</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-amber-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          
          <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-xl text-emerald-950 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-black text-emerald-900">Google Sheet Terhubung Active Live</div>
              <p className="text-xs text-emerald-800 mt-1 font-medium">
                Data permohonan ditarik langsung secara otomatis dari spreadsheet online Sub Bagian Keuangan BA BUN.
              </p>
            </div>
          </div>

          <div className="bg-amber-50/40 p-3.5 rounded-xl border border-amber-200 space-y-2 font-mono">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">URL Spreadsheet Asli:</span>
              <a
                href={SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs font-bold flex items-center gap-1.5 break-all mt-0.5"
              >
                <span>{SPREADSHEET_URL}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>

            <div className="pt-2 border-t border-amber-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Live CSV Endpoint Sync:</span>
              <p className="text-slate-600 text-[11px] truncate mt-0.5 font-semibold">{SPREADSHEET_CSV_URL}</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px] font-bold">Terakhir Disinkronkan:</span>
              <span className="font-extrabold">{lastSynced || 'Baru Saja'}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] font-bold">Total Berkas Ditarik:</span>
              <span className="font-black text-amber-800">{itemsCount} Submissions</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                onSyncNow();
              }}
              disabled={isSyncing}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Proses Sync...' : 'Sinkronkan Sekarang'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
