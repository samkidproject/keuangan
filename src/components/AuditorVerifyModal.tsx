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
  User,
  Users,
  Lock,
  UserPlus
} from 'lucide-react';

export const AUDITOR_TEAM_MEMBERS = [
  'Bpk. Hendra S., S.E. (Auditor Utama)',
  'Bpk. Budi Raharjo, S.H. (Auditor II)',
  'Ibu Siti Aminah, S.E., M.Si. (Auditor III)',
  'Bpk. Ahmad Fauzi, S.H., M.H. (Auditor IV)',
  'Ibu Rina Wati, S.E. (Auditor V)',
  'Bpk. Doni Prasetyo, S.H. (Auditor VI)',
];

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
    auditorName: string,
    approvedNominal?: number
  ) => void;
  onClaimSubmission?: (
    itemId: string,
    auditorName: string,
    action: 'claim' | 'release'
  ) => void;
}

export const AuditorVerifyModal: React.FC<AuditorVerifyModalProps> = ({
  item,
  isOpen,
  onClose,
  satkerAccounts = [],
  onSaveVerification,
  onClaimSubmission,
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
  const [auditorName, setAuditorName] = useState<string>(item.auditorName || item.assignedAuditor || 'Auditor Kejati');
  const [approvedNominalStr, setApprovedNominalStr] = useState<string>('');

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
      setAuditorName(item.auditorName || item.assignedAuditor || 'Auditor Kejati');
      const initVal = item.auditorApprovedNominal ?? item.nominal;
      setApprovedNominalStr(initVal ? new Intl.NumberFormat('id-ID').format(initVal) : '');
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
    const parsedNominal = parseFloat(approvedNominalStr.replace(/\./g, '')) || item.nominal || 0;
    onSaveVerification(item.id, status, checklist, recommendation, notes, auditorName, parsedNominal);
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
          
          {/* Keep / Claim System Banner (Anti-Collision for Auditor Team) */}
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 space-y-3 text-purple-950">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-black text-xs">
                <Lock className="h-4 w-4 text-purple-700 shrink-0" />
                <span>Proteksi Bentrok Auditor (Sistem Keep / Klaim Berkas)</span>
              </div>
              {item.assignedAuditor ? (
                <span className="px-2.5 py-1 rounded-full bg-purple-200 text-purple-950 font-black text-[10px] border border-purple-300 flex items-center gap-1 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-700 animate-pulse"></span>
                  📌 Dikeep oleh: {item.assignedAuditor}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  🔓 Belum Dikeep (Bisa Diklaim)
                </span>
              )}
            </div>

            <p className="text-[11px] text-purple-900 leading-relaxed font-medium">
              Ketikkan nama Anda di bawah lalu klik tombol <strong className="font-extrabold text-purple-950">"Keep Berkas Ini"</strong> untuk mengklaim pengajuan ini sebelum melakukan pemeriksaan fisik/berkas, agar tim auditor lain tahu berkas sedang Anda tangani.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <div className="flex-1 relative">
                <UserCheck className="h-4 w-4 text-purple-600 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  placeholder="Ketikkan nama Anda (contoh: Auditor Budi / Bpk. Hendra S.)..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-purple-300 rounded-xl text-xs font-black text-purple-950 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onClaimSubmission) {
                      onClaimSubmission(item.id, auditorName || 'Auditor Kejati', 'claim');
                    }
                  }}
                  className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl text-xs shadow-xs transition-all flex items-center gap-1 shrink-0"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>📌 Keep Berkas Ini</span>
                </button>

                {item.assignedAuditor && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onClaimSubmission) {
                        onClaimSubmission(item.id, auditorName, 'release');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-all flex items-center gap-1 shrink-0"
                    title="Buka kembali kunci keep agar auditor lain dapat mengambil berkas"
                  >
                    <span>🔓 Lepas Keep</span>
                  </button>
                )}
              </div>
            </div>
          </div>

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

            <div className="pt-2 border-t border-amber-200/80">
              <span className="text-[11px] font-bold text-slate-500 block">Uraian Pengajuan:</span>
              <span className="font-extrabold text-slate-900 text-xs">{item.jenisPengajuan || 'Permohonan Anggaran BA BUN'}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200/80">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Waktu Entry:</span>
                <span className="block text-[11px] text-slate-700 font-semibold">{item.submissionTime}</span>
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
                  <span>Buka PDF Dokumen Satker</span>
                </a>
              )}
            </div>

            {/* Nota Dinas Verifikator Keuangan Box */}
            {item.notaDinasNumber ? (
              <div className="pt-2 border-t border-amber-200 bg-amber-100/90 p-2.5 rounded-lg border border-amber-300">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider block">Nota Dinas Verifikator Keuangan:</span>
                    <span className="text-xs font-black text-slate-900">{item.notaDinasNumber}</span>
                  </div>
                  {item.notaDinasFileUrl && (
                    <a
                      href={item.notaDinasFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-lg text-xs flex items-center gap-1 shrink-0 shadow-2xs"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Buka PDF Nota Dinas</span>
                    </a>
                  )}
                </div>
                {item.notaDinasNotes && (
                  <p className="text-[11px] text-slate-700 italic mt-1 font-medium">"{item.notaDinasNotes}"</p>
                )}
              </div>
            ) : (
              <div className="pt-2 border-t border-amber-200 bg-amber-50 p-2 rounded-lg border border-amber-200 text-amber-900 font-medium text-[11px]">
                ℹ️ Belum ada Nota Dinas khusus yang dilampirkan verifikator keuangan.
              </div>
            )}

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

          {/* Recommended Nominal Input */}
          <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-300 space-y-1.5">
            <label className="block text-xs font-black text-emerald-950 flex items-center justify-between">
              <span>Rekomendasi Nominal Anggaran Disetujui Auditor (Rp):</span>
              <span className="text-[10px] text-slate-500 font-normal">Permohonan Satker: Rp {(item.nominal || 0).toLocaleString('id-ID')}</span>
            </label>
            <input
              type="text"
              value={approvedNominalStr}
              onChange={(e) => {
                const rawVal = e.target.value.replace(/\D/g, '');
                if (!rawVal) {
                  setApprovedNominalStr('');
                } else {
                  setApprovedNominalStr(new Intl.NumberFormat('id-ID').format(parseInt(rawVal, 10)));
                }
              }}
              placeholder="Contoh: 5.000.000"
              className="w-full bg-white border border-emerald-400 rounded-xl px-3 py-2 text-xs font-black text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-600 font-medium italic">
              Auditor dapat menyetujui nominal penuh atau merekomendasikan penyesuaian jumlah nominal anggaran yang disetujui.
            </p>
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
              <label className="block text-xs font-black text-slate-800 mb-1 flex items-center justify-between">
                <span>Nama Auditor / Penelaah (Penanggung Jawab Review):</span>
                <span className="text-[10px] text-purple-700 font-bold">Ketikkan Nama Sendiri</span>
              </label>
              
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-purple-700 shrink-0" />
                <input
                  type="text"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  placeholder="Ketikkan nama auditor / tim pemeriksa (contoh: Auditor Budi, Bpk. Hendra S.)..."
                  className="flex-1 bg-white border border-purple-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-extrabold focus:outline-none focus:ring-2 focus:ring-purple-500"
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
