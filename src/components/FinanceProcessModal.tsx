import React, { useState, useEffect } from 'react';
import { SubmissionItem, UserRole, VerificationStatus, SatkerAccount } from '../types';
import { formatWhatsAppLink, formatDisplayPhone } from '../lib/contactUtils';
import { AttachmentUploader } from './AttachmentUploader';
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
  Eye,
  MessageSquare,
  User,
  FileSpreadsheet,
  Link,
  Upload,
  ArrowRight
} from 'lucide-react';

interface FinanceProcessModalProps {
  item: SubmissionItem | null;
  isOpen: boolean;
  currentRole?: UserRole;
  satkerAccounts?: SatkerAccount[];
  onClose: () => void;
  onSaveNotaDinas: (
    itemId: string,
    notaDinasNumber: string,
    notaDinasFileUrl: string,
    notaDinasFileName: string,
    notaDinasNotes: string
  ) => void;
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
  satkerAccounts = [],
  onClose,
  onSaveNotaDinas,
  onSaveFinanceProcess,
}) => {
  if (!isOpen || !item) return null;

  const isSatker = currentRole === 'satker';
  const isAuditorRole = currentRole === 'auditor';

  // State for Nota Dinas (Tahap 1)
  const [notaDinasNumber, setNotaDinasNumber] = useState<string>(item.notaDinasNumber || '');
  const [ndUploadType, setNdUploadType] = useState<'link' | 'file'>('link');
  const [notaDinasFileUrl, setNotaDinasFileUrl] = useState<string>(item.notaDinasFileUrl || '');
  const [notaDinasFileName, setNotaDinasFileName] = useState<string>(item.notaDinasFileName || '');
  const [notaDinasNotes, setNotaDinasNotes] = useState<string>(item.notaDinasNotes || '');

  // State for Final Approval (Tahap 3)
  const [financeStatus, setFinanceStatus] = useState<string>(
    item.financeStatus || 'Persetujuan Keuangan BA BUN Disetujui'
  );
  const [financeNotes, setFinanceNotes] = useState<string>(
    item.financeNotes || ''
  );

  const [activeTab, setActiveTab] = useState<'nota_dinas' | 'persetujuan'>(
    currentRole === 'verifikator'
      ? 'nota_dinas'
      : item.status === 'direkomendasikan' || item.status === 'selesai_keuangan' || currentRole === 'keuangan'
      ? 'persetujuan'
      : 'nota_dinas'
  );

  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (item) {
      setNotaDinasNumber(item.notaDinasNumber || '');
      setNotaDinasFileUrl(item.notaDinasFileUrl || '');
      setNotaDinasFileName(item.notaDinasFileName || '');
      setNotaDinasNotes(item.notaDinasNotes || '');
      setFinanceStatus(item.financeStatus || 'Persetujuan Keuangan BA BUN Disetujui');
      setFinanceNotes(item.financeNotes || '');
      setActiveTab(
        currentRole === 'verifikator'
          ? 'nota_dinas'
          : item.status === 'direkomendasikan' || item.status === 'selesai_keuangan' || currentRole === 'keuangan'
          ? 'persetujuan'
          : 'nota_dinas'
      );
      setErrorMsg('');
    }
  }, [item, currentRole]);

  const matchedAcc = satkerAccounts.find(
    a => a.satkerName.toLowerCase() === item.satker.toLowerCase() ||
         a.username.toLowerCase() === item.createdBySatkerUser?.toLowerCase()
  );

  const contactName = item.namaPetugas || matchedAcc?.namaPetugas;
  const contactWA = item.whatsappNumber || matchedAcc?.whatsappNumber;

  const handleNdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        setErrorMsg('Ukuran file maksimal 15MB');
        return;
      }
      setErrorMsg('');
      setNotaDinasFileName(file.name);
      const fakeUrl = URL.createObjectURL(file);
      setNotaDinasFileUrl(fakeUrl);
    }
  };

  const handleSaveND = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notaDinasNumber.trim()) {
      setErrorMsg('Nomor Nota Dinas wajib diisi.');
      return;
    }
    if (!notaDinasFileUrl.trim()) {
      setErrorMsg('File atau Link Dokumen Nota Dinas wajib diisi.');
      return;
    }

    const finalFileName = notaDinasFileName.trim() || `Nota_Dinas_${notaDinasNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    onSaveNotaDinas(
      item.id,
      notaDinasNumber.trim(),
      notaDinasFileUrl.trim(),
      finalFileName,
      notaDinasNotes.trim()
    );
    onClose();
  };

  const handleFinalApproval = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveFinanceProcess(item.id, 'selesai_keuangan', financeStatus, financeNotes);
    onClose();
  };

  const checklistCount = Object.values(item.checklist).filter(Boolean).length;

  const formatCurrency = (val?: number) => {
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
                <span>{isSatker ? 'Detail Status & Pemantauan Permohonan' : 'Verifikasi Keuangan & Nota Dinas BA BUN'}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-yellow-100 text-yellow-900 border border-yellow-300">
                  {isSatker ? 'Satker Pemohon' : 'Admin Keuangan'}
                </span>
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {isSatker 
                  ? 'Status Nota Dinas, verifikasi auditor, dan persetujuan pengelola keuangan'
                  : 'Melampirkan Nota Dinas verifikator keuangan sebelum diverifikasi Auditor'}
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

        {/* Action Stage Tabs (for Admin Keuangan) */}
        {!isSatker && !isAuditorRole && (
          <div className="flex border-b border-yellow-200 bg-amber-50/50 p-1.5 gap-2 px-4">
            <button
              type="button"
              onClick={() => setActiveTab('nota_dinas')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'nota_dinas'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-amber-100'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>1. Lampirkan Nota Dinas Verifikator</span>
              {item.notaDinasNumber && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-800" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('persetujuan')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'persetujuan'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-amber-100'
              }`}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>2. Persetujuan Akhir Keuangan</span>
              {item.status === 'selesai_keuangan' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-xs">

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 font-bold text-xs">
              ⚠️ {errorMsg}
            </div>
          )}
          
          {/* Submission Info Card */}
          <div className="bg-amber-50/40 rounded-xl p-4 border border-amber-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Satker Pemohon:</span>
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
                <span className="text-[11px] font-bold text-slate-500 block">Uraian Pengajuan:</span>
                <span className="font-semibold text-slate-800">{item.jenisPengajuan || 'Permohonan Anggaran BA BUN'}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Total Nilai Anggaran:</span>
                <span className="font-black text-emerald-700 text-sm">{formatCurrency(item.nominal)}</span>
              </div>
            </div>

            {/* Document link from Satker */}
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
                  <span>Pratinjau Berkas PDF Satker</span>
                </a>
              </div>
            )}

            {/* Existing Nota Dinas Card */}
            {item.notaDinasNumber && (
              <div className="pt-2 border-t border-amber-200 bg-amber-100/80 p-2.5 rounded-lg border border-amber-300">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">Nota Dinas Verifikator Keuangan:</span>
                    <span className="text-xs font-black text-slate-900">{item.notaDinasNumber}</span>
                  </div>
                  {item.notaDinasFileUrl && (
                    <a
                      href={item.notaDinasFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Lihat PDF Nota Dinas</span>
                    </a>
                  )}
                </div>
                {item.notaDinasNotes && (
                  <p className="text-[11px] text-slate-700 italic mt-1 font-medium">"{item.notaDinasNotes}"</p>
                )}
              </div>
            )}

            {/* Existing SPP Info Card (if submitted) */}
            {item.sppNumber && (
              <div className="pt-2 border-t border-amber-200 bg-emerald-50 p-2.5 rounded-lg border border-emerald-300">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-emerald-900 uppercase tracking-wider block">Nomor SPP (Satker):</span>
                    <span className="text-xs font-black text-emerald-950">{item.sppNumber}</span>
                  </div>
                  {item.sppFileUrl && (
                    <a
                      href={item.sppFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Lihat Dokumen SPP</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="pt-2 border-t border-amber-200 flex flex-wrap items-center justify-between gap-2 bg-emerald-50/90 p-2.5 rounded-lg border border-emerald-300 text-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500 text-white font-bold">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider block">Petugas Operator Satker:</span>
                  <span className="text-xs font-black text-slate-900">
                    {contactName || 'Petugas Operator Satker'} {contactWA ? `• ${formatDisplayPhone(contactWA)}` : ''}
                  </span>
                </div>
              </div>

              {contactWA && (
                <a
                  href={formatWhatsAppLink(contactWA, `Halo Bpk/Ibu ${contactName || ''} (${item.satker}), terkait verifikasi pengajuan BA BUN ${item.submissionId}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* TAB 1: FORM NOTA DINAS VERIFIKATOR KEUANGAN */}
          {(activeTab === 'nota_dinas' && !isSatker && !isAuditorRole) && (
            <form onSubmit={handleSaveND} className="space-y-4 pt-2">
              <div className="bg-amber-100/70 border border-amber-300 rounded-xl p-3">
                <span className="font-extrabold text-amber-950 block text-xs">
                  Tahap 1: Entry / Lampirkan Nota Dinas Verifikator Keuangan
                </span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Lampirkan Nota Dinas dari bagian Keuangan sebelum permohonan diteruskan ke Admin Auditor untuk dilakukan pemeriksaan audit.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Nomor Nota Dinas Verifikator Keuangan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={notaDinasNumber}
                  onChange={(e) => setNotaDinasNumber(e.target.value)}
                  placeholder="Contoh: ND-019/H.III/08/2026"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-extrabold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <AttachmentUploader
                fileUrl={notaDinasFileUrl}
                fileName={notaDinasFileName}
                onFileChange={(url, name) => {
                  setNotaDinasFileUrl(url);
                  if (name) setNotaDinasFileName(name);
                }}
                label="Dokumen Berkas Nota Dinas Verifikator Keuangan"
                required={true}
                accentColor="amber"
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Verifikator Keuangan (Opsional):
                </label>
                <input
                  type="text"
                  value={notaDinasNotes}
                  onChange={(e) => setNotaDinasNotes(e.target.value)}
                  placeholder="Catatan pendukung untuk Auditor..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Terbitkan Nota Dinas & Kirim ke Auditor</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PERSETUJUAN AKHIR KEUANGAN */}
          {(activeTab === 'persetujuan' || isSatker) && (
            <div className="space-y-4">
              {/* Auditor Verification Result Box */}
              <div className={`p-4 rounded-xl border space-y-2.5 ${
                item.status === 'direkomendasikan' || item.status === 'selesai_keuangan'
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-amber-50 border-amber-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
                    <ShieldCheck className="h-4 w-4 text-emerald-700" />
                    Hasil Pemeriksaan Audit Admin Auditor
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    checklistCount === 5 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    Checklist: {checklistCount}/5 Lengkap
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-800 space-y-2">
                  <div className="flex items-center justify-between bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-600 block">Nominal Permohonan Satker:</span>
                      <span className="text-xs font-bold text-slate-800">{formatCurrency(item.nominal)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-emerald-950 block">Rekomendasi Nominal Disetujui Auditor:</span>
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 inline-block mt-0.5">
                        {formatCurrency(item.auditorApprovedNominal ?? item.nominal)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-amber-800 mb-0.5">
                      Catatan Rekomendasi Auditor:
                    </div>
                    <p className="text-xs font-semibold italic text-slate-900">
                      "{item.auditorRecommendation || 'Belum ada catatan dari Admin Auditor'}"
                    </p>
                  </div>
                  {item.auditorName && (
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between border-t border-slate-100 pt-1 font-medium">
                      <span>Auditor: <strong className="text-slate-800">{item.auditorName}</strong></span>
                      <span>Verified: {item.verifiedAt || 'Terbaru'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Finance Approval Form for Admin Keuangan */}
              {!isSatker ? (
                <form onSubmit={handleFinalApproval} className="space-y-3 pt-2">
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                        Tahap Persetujuan Akhir
                      </span>
                      <span className="font-black text-xs text-emerald-900 flex items-center gap-1.5 mt-0.5">
                        <CheckCheck className="h-4 w-4 text-emerald-600" />
                        Persetujuan Keuangan Permohonan BA BUN
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-black text-[11px] border border-emerald-300">
                      Persetujuan Keuangan (ACC)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">
                      Keterangan Persetujuan Keuangan:
                    </label>
                    <input
                      type="text"
                      value={financeStatus}
                      onChange={(e) => setFinanceStatus(e.target.value)}
                      placeholder="Contoh: Persetujuan Usulan Anggaran BA BUN Disetujui"
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
                      placeholder="Catatan persetujuan untuk Satker agar segera menginputkan nomor SPP..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
                    >
                      <CheckCheck className="h-4 w-4" />
                      <span>Setujui Permohonan Keuangan</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <span className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                    Status Persetujuan Pengelola Keuangan:
                  </span>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-emerald-600" />
                    <span>{item.financeStatus || (item.status === 'selesai_keuangan' ? 'Disetujui Keuangan' : 'Dalam Proses Pemantauan')}</span>
                  </div>
                  {item.financeNotes && (
                    <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                      Catatan Keuangan: "{item.financeNotes}"
                    </div>
                  )}
                </div>
              )}
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

        </div>

      </div>
    </div>
  );
};
