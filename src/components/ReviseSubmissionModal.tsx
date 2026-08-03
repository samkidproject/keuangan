import React, { useState, useEffect } from 'react';
import { SubmissionItem } from '../types';
import { 
  X, 
  FileCheck, 
  AlertTriangle, 
  Send, 
  ExternalLink, 
  Building2, 
  FileText,
  DollarSign
} from 'lucide-react';

interface ReviseSubmissionModalProps {
  item: SubmissionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveRevision: (
    itemId: string,
    fileUrl: string,
    fileName: string,
    nominal: number,
    notesFromSatker: string
  ) => void;
}

export const ReviseSubmissionModal: React.FC<ReviseSubmissionModalProps> = ({
  item,
  isOpen,
  onClose,
  onSaveRevision,
}) => {
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [nominal, setNominal] = useState<number>(0);
  const [notesFromSatker, setNotesFromSatker] = useState('');

  useEffect(() => {
    if (item) {
      setFileUrl(item.fileUrl || '');
      setFileName(item.fileName || '');
      setNominal(item.nominal || 0);
      setNotesFromSatker('');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    onSaveRevision(
      item.id,
      fileUrl,
      fileName || 'Dokumen_Revisi.pdf',
      nominal,
      notesFromSatker
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-amber-300 rounded-2xl w-full max-w-xl shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-xs">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Perbaiki & Resubmit Dokumen Permohonan</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                  Mode Satker
                </span>
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Kirim ulang berkas yang telah diperbaiki untuk diperiksa kembali oleh Auditor
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
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Auditor Feedback Warning Box */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Catatan / Alasan Perbaikan dari Admin Auditor:</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-amber-200 text-slate-800 font-medium italic text-xs">
              "{item.auditorRecommendation || item.auditorNotes || 'Silakan perbaiki kelengkapan berkas dokumen permohonan sesuai instruksi.'}"
            </div>
            {item.auditorName && (
              <div className="text-[10px] text-slate-500 text-right font-semibold">
                Pemeriksa: {item.auditorName} • {item.verifiedAt || 'Terbaru'}
              </div>
            )}
          </div>

          {/* Satker Submission Summary */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span className="flex items-center gap-1.5 text-amber-900">
                <Building2 className="h-4 w-4 text-amber-600" />
                {item.satker}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">{item.submissionId}</span>
            </div>
            <div className="text-slate-600 font-medium">
              Bidang: <strong>{item.bidang}</strong> | Jenis: <strong>{item.jenisPengajuan || 'UP / GUP'}</strong>
            </div>
          </div>

          {/* Form Fields for Revision */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Link Dokumen Permohonan Baru / Hasil Perbaikan (PDF / Google Drive) *
              </label>
              <input
                type="url"
                required
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/... atau URL PDF baru"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nama Berkas Dokumen Permohonan
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Contoh: B-5200-Permohonan-Revisi-BA-BUN.pdf"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nominal Anggaran (Rp)
                </label>
                <input
                  type="number"
                  value={nominal || ''}
                  onChange={(e) => setNominal(Number(e.target.value))}
                  placeholder="Contoh: 150000000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Catatan Perbaikan dari Satker Kejaksaan Negeri:
              </label>
              <textarea
                rows={3}
                value={notesFromSatker}
                onChange={(e) => setNotesFromSatker(e.target.value)}
                placeholder="Jelaskan bagian dokumen yang telah diperbaiki / ditambahkan..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Modal Actions */}
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
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-2xs transition-all flex items-center gap-1.5"
            >
              <Send className="h-4 w-4" />
              <span>Kirim Hasil Perbaikan</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
