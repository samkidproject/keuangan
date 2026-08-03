import React, { useState, useEffect } from 'react';
import { SubmissionItem, VerificationStatus, AuditChecklist, SatkerAccount } from '../types';
import { formatWhatsAppLink, formatDisplayPhone } from '../lib/contactUtils';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  ExternalLink, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Building2, 
  UserCheck,
  Send,
  Sparkles,
  MessageSquare,
  Phone,
  User
} from 'lucide-react';

interface AuditorVerifyModalProps {
  item: SubmissionItem | null;
  isOpen: boolean;
  onClose: () => void;
  satkerAccounts?: SatkerAccount[];
  onSaveVerification: (
    itemId: string,
    status: VerificationStatus,
    checklist: AuditChecklist,
    recommendation: string,
    notes: string,
    auditorName: string
  ) => void;
}

export const AuditorVerifyModal: React.FC<AuditorVerifyModalProps> = ({
  item,
  isOpen,
  onClose,
  satkerAccounts = [],
  onSaveVerification,
}) => {
  if (!isOpen || !item) return null;

  const matchedAcc = satkerAccounts.find(
    a => a.satkerName.toLowerCase() === item.satker.toLowerCase() ||
         a.username.toLowerCase() === item.createdBySatkerUser?.toLowerCase()
  );

  const contactName = item.namaPetugas || matchedAcc?.namaPetugas;
  const contactWA = item.whatsappNumber || matchedAcc?.whatsappNumber;

  const [status, setStatus] = useState<VerificationStatus>(item.status || 'direkomendasikan');
  const [checklist, setChecklist] = useState<AuditChecklist>(item.checklist || {
    suratPermohonan: true,
    rincianUP: true,
    sptjm: true,
    matriksAkun: true,
    softcopyPdf: true,
  });
  const [recommendation, setRecommendation] = useState<string>(item.auditorRecommendation || '');
  const [notes, setNotes] = useState<string>(item.auditorNotes || '');
  const [auditorName, setAuditorName] = useState<string>(item.auditorName || 'Bpk. Hendra S., S.E. (Auditor Utama)');

  useEffect(() => {
    if (item) {
      setStatus(item.status === 'belum_diperiksa' ? 'direkomendasikan' : item.status);
      setChecklist(item.checklist || {
        suratPermohonan: true,
        rincianUP: true,
        sptjm: true,
        matriksAkun: true,
        softcopyPdf: true,
      });
      setRecommendation(item.auditorRecommendation || '');
      setNotes(item.auditorNotes || '');
      setAuditorName(item.auditorName || 'Bpk. Hendra S., S.E. (Auditor Utama)');
    }
  }, [item]);

  const toggleChecklist = (key: keyof AuditChecklist) => {
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectAllChecklist = (value: boolean) => {
    setChecklist({
      suratPermohonan: value,
      rincianUP: value,
      sptjm: value,
      matriksAkun: value,
      softcopyPdf: value,
    });
  };

  const checklistCount = Object.values(checklist).filter(Boolean).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveVerification(item.id, status, checklist, recommendation, notes, auditorName);
    onClose();
  };

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
      <div className="bg-white border border-amber-200 rounded-2xl w-full max-w-2xl shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Pemeriksaan & Rekomendasi Auditor</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                  Admin Auditor Mode
                </span>
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Verifikasi kelengkapan dokumen pengajuan BA BUN untuk dilaporkan ke Admin Keuangan
              </p>
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-xs">
          
          {/* Item Meta Details Box */}
          <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Satuan Kerja (Satker):</span>
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-amber-600" />
                  {item.satker}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Bidang Pemohon:</span>
                <span className="font-bold text-slate-800">{item.bidang}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200/80">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">ID Pengajuan & Waktu:</span>
                <span className="font-mono font-bold text-amber-900 text-[11px]">{item.submissionId}</span>
                <span className="block text-[10px] text-slate-500 font-medium">{item.submissionTime}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Nominal Permohonan:</span>
                <span className="font-black text-emerald-700 text-sm">{formatCurrency(item.nominal)}</span>
              </div>
            </div>

            {/* Document Link */}
            <div className="pt-2 border-t border-amber-200 flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 truncate text-slate-800">
                <FileText className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="truncate font-semibold">{item.fileName}</span>
              </div>
              {item.fileUrl && (
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs flex items-center gap-1 shadow-2xs transition-colors shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Buka PDF Dokumen</span>
                </a>
              )}
            </div>

            {/* WhatsApp Contact Officer Info */}
            <div className="pt-2 border-t border-amber-200 flex flex-wrap items-center justify-between gap-2 bg-emerald-50/90 p-2.5 rounded-lg border border-emerald-300 text-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500 text-white font-bold">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider block">Contact Petugas / Operator Satker:</span>
                  <span className="text-xs font-black text-slate-900">
                    {contactName || 'Petugas Operator Satker'} {contactWA ? `• ${formatDisplayPhone(contactWA)}` : ''}
                  </span>
                </div>
              </div>

              {contactWA ? (
                <a
                  href={formatWhatsAppLink(contactWA, `Halo Bpk/Ibu ${contactName || ''} (${item.satker}), terkait verifikasi pengajuan BA BUN ${item.submissionId}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Hubungi via WhatsApp</span>
                </a>
              ) : (
                <span className="text-[10px] text-amber-800 font-bold bg-amber-100 border border-amber-200 px-2 py-0.5 rounded">
                  Nomor WhatsApp belum diset di Akun Satker
                </span>
              )}
            </div>
          </div>

          {/* Recommendation Selection Radio */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              Keputusan / Rekomendasi Hasil Pemeriksaan Auditor:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              
              {/* Direkomendasikan ACC */}
              <label className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between gap-2 transition-all ${
                status === 'direkomendasikan'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-400/40 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-700">DIREKOMENDASIKAN ACC</span>
                  <input
                    type="radio"
                    name="status"
                    value="direkomendasikan"
                    checked={status === 'direkomendasikan'}
                    onChange={() => setStatus('direkomendasikan')}
                    className="accent-emerald-600"
                  />
                </div>
                <p className="text-[10px] text-slate-600 font-medium">
                  Dokumen lengkap & memenuhi syarat. Rekomendasikan ke Admin Keuangan untuk diterbitkan SP2D.
                </p>
              </label>

              {/* Perlu Perbaikan */}
              <label className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between gap-2 transition-all ${
                status === 'perlu_perbaikan'
                  ? 'bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-400/40 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-800">PERLU PERBAIKAN</span>
                  <input
                    type="radio"
                    name="status"
                    value="perlu_perbaikan"
                    checked={status === 'perlu_perbaikan'}
                    onChange={() => setStatus('perlu_perbaikan')}
                    className="accent-amber-600"
                  />
                </div>
                <p className="text-[10px] text-slate-600 font-medium">
                  Berkas kurang lengkap / ada catatan. Minta Satker melakukan revisi perbaikan.
                </p>
              </label>

              {/* Sedang Diperiksa */}
              <label className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between gap-2 transition-all ${
                status === 'sedang_diperiksa'
                  ? 'bg-blue-50 border-blue-400 text-blue-950 ring-2 ring-blue-400/40 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-700">SEDANG DIPERIKSA</span>
                  <input
                    type="radio"
                    name="status"
                    value="sedang_diperiksa"
                    checked={status === 'sedang_diperiksa'}
                    onChange={() => setStatus('sedang_diperiksa')}
                    className="accent-blue-600"
                  />
                </div>
                <p className="text-[10px] text-slate-600 font-medium">
                  Pemeriksaan lanjutan atau konfirmasi silang ke instansi terkait.
                </p>
              </label>

            </div>
          </div>

          {/* Text Area for Auditor Recommendation & Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Catatan Rekomendasi Auditor (Terlihat oleh Admin Keuangan):
              </label>
              <textarea
                rows={2}
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                placeholder="Contoh: Berkas permohonan UP melampaui besaran telah diperiksa dan disetujui penuh untuk diproses ke pencairan KPPN..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Internal Auditor (Opsional):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan internal pemeriksa fisik dokumen..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Tim Auditor / Pemeriksa:
              </label>
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-amber-600" />
                <input
                  type="text"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-extrabold focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Simpan & Laporkan Rekomendasi</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
