import React, { useState, useEffect } from 'react';
import { SubmissionItem, UserRole, VerificationStatus } from '../types';
import { 
  X, 
  Wallet, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  ExternalLink, 
  Clock, 
  Building2,
  Send,
  History,
  CheckCheck,
  AlertCircle,
  Eye
} from 'lucide-react';

interface FinanceProcessModalProps {
  item: SubmissionItem | null;
  isOpen: boolean;
  currentRole?: UserRole;
  onClose: () => void;
  onSaveFinanceProcess: (
    itemId: string,
    status: VerificationStatus,
    financeStatus: string,
    financeNotes: string
  ) => void;
}

export const FinanceProcessModal: React.FC<FinanceProcessModalProps> = ({
  item,
  isOpen,
  currentRole = 'keuangan',
  onClose,
  onSaveFinanceProcess,
}) => {
  if (!isOpen || !item) return null;

  const [financeStatus, setFinanceStatus] = useState<string>(
    item.financeStatus || 'SP2D Terbit / Ready'
  );
  const [financeNotes, setFinanceNotes] = useState<string>(
    item.financeNotes || ''
  );

  useEffect(() => {
    if (item) {
      setFinanceStatus(item.financeStatus || 'SP2D Terbit / Ready');
      setFinanceNotes(item.financeNotes || '');
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole === 'satker') return; // Satker cannot approve
    // Always set status to 'selesai_keuangan' (approved by finance)
    onSaveFinanceProcess(item.id, 'selesai_keuangan', financeStatus, financeNotes);
    onClose();
  };

  const isSatker = currentRole === 'satker';
  const checklistCount = Object.values(item.checklist).filter(Boolean).length;

  const formatCurrency = (val: number) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-yellow-300 rounded-2xl w-full max-w-2xl shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-yellow-50 border-b border-yellow-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-yellow-500 text-slate-950 font-bold">
              {isSatker ? <Eye className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>{isSatker ? 'Detail Status & Pemantauan Permohonan' : 'Proses Keuangan & SP2D BA BUN'}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-yellow-100 text-yellow-900 border border-yellow-300">
                  {isSatker ? 'Satker Pemohon Mode' : 'Admin Keuangan Mode'}
                </span>
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {isSatker 
                  ? 'Status rekomendasi verifikasi auditor dan persetujuan pengelola keuangan'
                  : 'Menindaklanjuti data rekomendasi verifikasi dari Admin Auditor'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-yellow-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-xs">
          
          {/* Auditor Verification Result Box */}
          <div className={`p-4 rounded-xl border space-y-2.5 ${
            item.status === 'direkomendasikan' || item.status === 'selesai_keuangan'
              ? 'bg-emerald-50 border-emerald-300'
              : 'bg-amber-50 border-amber-300'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                Laporan Hasil Verifikasi Admin Auditor
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                checklistCount === 5 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                Checklist: {checklistCount}/5 Lengkap
              </span>
            </div>

            {/* Auditor Recommendation Notes */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-800">
              <div className="text-[11px] font-bold text-amber-800 mb-1">
                Rekomendasi Auditor:
              </div>
              <p className="text-xs font-semibold italic text-slate-900">
                "{item.auditorRecommendation || 'Belum ada catatan khusus dari Admin Auditor'}"
              </p>
              {item.auditorName && (
                <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between border-t border-slate-100 pt-1 font-medium">
                  <span>Pemeriksa: <strong className="text-slate-800">{item.auditorName}</strong></span>
                  <span>Verified: {item.verifiedAt || 'Terbaru'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Submission Info */}
          <div className="bg-amber-50/40 rounded-xl p-4 border border-amber-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Satker:</span>
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-amber-600" />
                  {item.satker}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Bidang / Sub:</span>
                <span className="font-bold text-slate-800">{item.bidang}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200/80">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Jenis Pengajuan:</span>
                <span className="font-semibold text-slate-800">{item.jenisPengajuan}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Total Nilai Anggaran:</span>
                <span className="font-black text-emerald-700 text-sm">{formatCurrency(item.nominal)}</span>
              </div>
            </div>

            {item.fileUrl && (
              <div className="pt-2 border-t border-amber-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-600 font-medium truncate max-w-[250px]">{item.fileName}</span>
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 font-bold text-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Pratinjau PDF</span>
                </a>
              </div>
            )}
          </div>

          {/* Finance Status Info (Read-only for Satker OR Form for Finance Admin) */}
          {isSatker ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <span className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                Status Persetujuan Pengelola Keuangan:
              </span>
              <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-600" />
                <span>{item.financeStatus || (item.status === 'selesai_keuangan' ? 'SP2D Terbit / Disetujui' : 'Dalam Proses Pemantauan')}</span>
              </div>
              {item.financeNotes && (
                <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                  Catatan Keuangan: "{item.financeNotes}"
                </div>
              )}
            </div>
          ) : (
            /* Finance Actions Form for Admin Keuangan */
            <div className="space-y-3 pt-2">
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                    Tindakan Persetujuan Keuangan
                  </span>
                  <span className="font-black text-xs text-emerald-900 flex items-center gap-1.5 mt-0.5">
                    <CheckCheck className="h-4 w-4 text-emerald-600" />
                    Persetujuan & Penerbitan SP2D BA BUN
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-black text-[11px] border border-emerald-300">
                  Disetujui (ACC)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Status Keterangan SP2D / KPPN:
                </label>
                <input
                  type="text"
                  value={financeStatus}
                  onChange={(e) => setFinanceStatus(e.target.value)}
                  placeholder="Contoh: SP2D No. 00982/SP2D/BA-BUN/2026 Terbit"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Catatan Pengelola Keuangan BA BUN:
                </label>
                <textarea
                  rows={2}
                  value={financeNotes}
                  onChange={(e) => setFinanceNotes(e.target.value)}
                  placeholder="Catatan transfer pencairan atau nomor referensi SP2D..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Audit Trail History */}
          {item.history && item.history.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <History className="h-4 w-4 text-amber-600" />
                <span>Riwayat Aktivitas & Verifikasi Audit:</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pt-1">
                {item.history.map((log) => (
                  <div key={log.id} className="text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span className="font-bold text-amber-900">{log.userName}</span>
                      <span className="font-mono text-[10px]">{log.timestamp}</span>
                    </div>
                    <div className="text-slate-900 font-semibold mt-0.5">{log.action}</div>
                    {log.note && <div className="text-slate-600 text-[10px] italic mt-0.5">"{log.note}"</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              {isSatker ? 'Tutup' : 'Batal'}
            </button>
            {!isSatker && (
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-2xs transition-all flex items-center gap-1.5"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Proses Setuju / ACC</span>
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};

