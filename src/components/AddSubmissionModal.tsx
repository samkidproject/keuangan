import React, { useState } from 'react';
import { SubmissionItem } from '../types';
import { X, Plus, Building2, FileText, DollarSign, Send } from 'lucide-react';

interface AddSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSubmission: (newSub: Omit<SubmissionItem, 'id' | 'history'>) => void;
}

export const AddSubmissionModal: React.FC<AddSubmissionModalProps> = ({
  isOpen,
  onClose,
  onAddSubmission,
}) => {
  if (!isOpen) return null;

  const [satker, setSatker] = useState('KN Bandar Lampung');
  const [bidang, setBidang] = useState('Intelijen');
  const [jenisPengajuan, setJenisPengajuan] = useState('Permohonan UP / TUP Melampaui Besaran');
  const [nominal, setNominal] = useState('500000000');
  const [fileName, setFileName] = useState('Surat-Permohonan-Persetujuan-UP-BUN.pdf');
  const [fileUrl, setFileUrl] = useState('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subId = `sub-${Date.now()}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    onAddSubmission({
      submissionId: subId,
      submissionTime: now,
      satker,
      bidang,
      fileName,
      fileUrl,
      jenisPengajuan,
      nominal: parseFloat(nominal) || 0,
      status: 'belum_diperiksa',
      checklist: {
        suratPermohonan: false,
        rincianUP: false,
        sptjm: false,
        matriksAkun: false,
        softcopyPdf: true,
      },
      source: 'manual'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl my-8 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Input Pengajuan BA BUN Baru</h3>
              <p className="text-xs text-slate-400">Tambahkan berkas permohonan anggaran baru</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Satuan Kerja (Satker):
              </label>
              <select
                value={satker}
                onChange={(e) => setSatker(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="KN Bandar Lampung">KN Bandar Lampung</option>
                <option value="Kejati Lampung">Kejati Lampung</option>
                <option value="KN Lampung Selatan">KN Lampung Selatan</option>
                <option value="KN Metro">KN Metro</option>
                <option value="KN Tanggamus">KN Tanggamus</option>
                <option value="KN Way Kanan">KN Way Kanan</option>
                <option value="KN Lampung Tengah">KN Lampung Tengah</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bidang Pemohon:
              </label>
              <select
                value={bidang}
                onChange={(e) => setBidang(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Intelijen">Intelijen</option>
                <option value="Pidum">Pidum</option>
                <option value="Pidsus">Pidsus</option>
                <option value="Pembinaan">Pembinaan</option>
                <option value="Datun">Datun</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Jenis Pengajuan Anggaran BA BUN:
            </label>
            <input
              type="text"
              required
              value={jenisPengajuan}
              onChange={(e) => setJenisPengajuan(e.target.value)}
              placeholder="Contoh: Permohonan UP/TUP Melampaui Besaran"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nominal Permohonan (Rp):
            </label>
            <input
              type="number"
              required
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
              placeholder="500000000"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nama Berkas PDF:
            </label>
            <input
              type="text"
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="B-1234-Permohonan-Persetujuan-UP.pdf"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              URL Link Dokumen PDF / AWS S3:
            </label>
            <input
              type="url"
              required
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://prod-fillout-oregon-s3.s3.us-west-2.amazonaws.com/..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Simpan Pengajuan</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
