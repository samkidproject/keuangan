import React, { useState, useEffect } from 'react';
import { SubmissionItem } from '../types';
import { X, FileCheck, Building2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { AttachmentUploader } from './AttachmentUploader';

interface SatkerSppModalProps {
  item: SubmissionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSpp?: (
    itemId: string,
    sppNumber: string,
    sppFileUrl: string,
    sppFileName: string,
    sppNotes: string
  ) => Promise<void> | void;
  onSaveSppData?: (
    itemId: string,
    sppNumber: string,
    sppFileUrl: string,
    sppFileName: string,
    sppNotes: string
  ) => Promise<void> | void;
}

export const SatkerSppModal: React.FC<SatkerSppModalProps> = ({
  item,
  isOpen,
  onClose,
  onSaveSpp,
  onSaveSppData,
}) => {
  if (!isOpen || !item) return null;

  const [sppNumber, setSppNumber] = useState<string>(item.sppNumber || '');
  const [sppFileUrl, setSppFileUrl] = useState<string>(item.sppFileUrl || '');
  const [sppFileName, setSppFileName] = useState<string>(item.sppFileName || '');
  const [sppNotes, setSppNotes] = useState<string>(item.sppNotes || '');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (item) {
      setSppNumber(item.sppNumber || '');
      setSppFileUrl(item.sppFileUrl || '');
      setSppFileName(item.sppFileName || '');
      setSppNotes(item.sppNotes || '');
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedSppNumber = sppNumber.trim();
    const trimmedFileUrl = sppFileUrl.trim();

    if (!trimmedSppNumber) {
      setErrorMsg('Nomor SPP wajib diisi.');
      return;
    }
    if (!trimmedFileUrl) {
      setErrorMsg('Dokumen / Berkas SPP wajib diunggah atau diisikan tautan linknya.');
      return;
    }

    const finalFileName = sppFileName.trim() || `Berkas_SPP_${trimmedSppNumber.replace(/[^a-zA-Z0-9.-]/g, '_')}.pdf`;
    const saveFn = onSaveSpp || onSaveSppData;

    if (!saveFn) {
      setErrorMsg('Handler penyimpanan SPP belum tersedia.');
      return;
    }

    try {
      setIsSubmitting(true);
      const targetId = item.id || item.submissionId;
      await Promise.resolve(saveFn(targetId, trimmedSppNumber, trimmedFileUrl, finalFileName, sppNotes.trim()));
      onClose();
    } catch (err: any) {
      console.error("Error saving SPP data:", err);
      setErrorMsg(err?.message || 'Terjadi kesalahan saat menyimpan data SPP. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="bg-white border border-emerald-300 rounded-2xl w-full max-w-xl shadow-2xl my-8 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white font-bold">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                <span>Pengisian Nomor & Dokumen SPP</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Tahap Akhir Satker
                </span>
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Melengkapi Surat Perintah Pembayaran (SPP) setelah disetujui Pengelola Keuangan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-emerald-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 font-bold text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Item Context Summary */}
          <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black text-slate-900 text-xs">
                <Building2 className="h-4 w-4 text-amber-600 shrink-0" />
                <span>{item.satker}</span>
                <span className="text-slate-400 font-normal">• {item.bidang}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                Disetujui Keuangan
              </span>
            </div>
            <div className="text-slate-800 font-bold text-xs">
              Uraian: <span className="text-amber-950 font-extrabold">{item.jenisPengajuan || 'Permohonan Anggaran BA BUN'}</span>
            </div>
            <div className="text-slate-600 font-medium text-[11px] flex flex-wrap items-center justify-between gap-1">
              <span>Nominal Permohonan: <strong className="text-emerald-700 font-extrabold">{formatCurrency(item.nominal)}</strong></span>
              {item.auditorApprovedNominal !== undefined && item.auditorApprovedNominal !== null && (
                <span className="bg-purple-100 text-purple-950 border border-purple-300 px-2 py-0.5 rounded-md font-black">
                  Disetujui Auditor: {formatCurrency(item.auditorApprovedNominal)}
                </span>
              )}
              <span>Nota Dinas: <strong className="text-slate-800">{item.notaDinasNumber || 'Ada'}</strong></span>
            </div>
          </div>

          {/* Nomor SPP Input */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Nomor SPP (Surat Perintah Pembayaran) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={sppNumber}
              onChange={(e) => setSppNumber(e.target.value)}
              placeholder="Contoh: 00123/SPP/BA-BUN/2026"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <AttachmentUploader
            fileUrl={sppFileUrl}
            fileName={sppFileName}
            onFileChange={(url, name) => {
              setSppFileUrl(url);
              if (name) setSppFileName(name);
            }}
            label="Dokumen Berkas SPP Satker"
            required={true}
            accentColor="emerald"
          />

          {/* Catatan SPP Optional */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Keterangan SPP (Opsional):
            </label>
            <input
              type="text"
              value={sppNotes}
              onChange={(e) => setSppNotes(e.target.value)}
              placeholder="Contoh: Tanggal SPP 12 Agustus 2026, telah ditandatangani PPK"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Menyimpan Dokumen SPP...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Simpan Dokumen SPP</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
