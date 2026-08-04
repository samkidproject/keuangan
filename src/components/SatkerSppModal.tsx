import React, { useState, useEffect } from 'react';
import { SubmissionItem } from '../types';
import { X, FileCheck, Upload, Link, Building2, CheckCircle2, FileText, ExternalLink } from 'lucide-react';
import { getWIBTimestamp } from '../lib/dateUtils';
import { AttachmentUploader } from './AttachmentUploader';

interface SatkerSppModalProps {
  item: SubmissionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSppData: (
    itemId: string,
    sppNumber: string,
    sppFileUrl: string,
    sppFileName: string,
    sppNotes: string
  ) => void;
}

export const SatkerSppModal: React.FC<SatkerSppModalProps> = ({
  item,
  isOpen,
  onClose,
  onSaveSppData,
}) => {
  if (!isOpen || !item) return null;

  const [sppNumber, setSppNumber] = useState<string>(item.sppNumber || '');
  const [uploadType, setUploadType] = useState<'link' | 'file'>('link');
  const [sppFileUrl, setSppFileUrl] = useState<string>(item.sppFileUrl || '');
  const [sppFileName, setSppFileName] = useState<string>(item.sppFileName || '');
  const [sppNotes, setSppNotes] = useState<string>(item.sppNotes || '');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (item) {
      setSppNumber(item.sppNumber || '');
      setSppFileUrl(item.sppFileUrl || '');
      setSppFileName(item.sppFileName || '');
      setSppNotes(item.sppNotes || '');
      setErrorMsg('');
    }
  }, [item]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        setErrorMsg('Ukuran file maksimal 15MB');
        return;
      }
      setErrorMsg('');
      setSppFileName(file.name);
      const fakeUrl = URL.createObjectURL(file);
      setSppFileUrl(fakeUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sppNumber.trim()) {
      setErrorMsg('Nomor SPP wajib diisi.');
      return;
    }
    if (!sppFileUrl.trim()) {
      setErrorMsg('File atau Link Dokumen SPP wajib diisi/diunggah.');
      return;
    }

    const finalFileName = sppFileName.trim() || `Berkas_SPP_${sppNumber.replace(/[^a-zA-Z0-0]/g, '_')}.pdf`;
    onSaveSppData(item.id, sppNumber.trim(), sppFileUrl.trim(), finalFileName, sppNotes.trim());
    onClose();
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
            <div className="text-slate-600 font-medium text-[11px] flex items-center justify-between">
              <span>Nominal: <strong className="text-emerald-700 font-extrabold">{formatCurrency(item.nominal)}</strong></span>
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
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Simpan Dokumen SPP</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
