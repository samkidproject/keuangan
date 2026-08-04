import React, { useState, useEffect } from 'react';
import { SubmissionItem } from '../types';
import { X, Pencil, Save, Building2, FileText, Link as LinkIcon, DollarSign } from 'lucide-react';
import { AttachmentUploader } from './AttachmentUploader';

interface EditSubmissionModalProps {
  item: SubmissionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveEdit: (
    itemId: string,
    updatedData: {
      satker: string;
      bidang: string;
      jenisPengajuan: string;
      nominal: number;
      fileName: string;
      fileUrl: string;
      notesFromSatker: string;
    }
  ) => void;
}

export const EditSubmissionModal: React.FC<EditSubmissionModalProps> = ({
  item,
  isOpen,
  onClose,
  onSaveEdit,
}) => {
  const [satker, setSatker] = useState('');
  const [bidang, setBidang] = useState('Pembinaan');
  const [jenisPengajuan, setJenisPengajuan] = useState('');
  const [nominal, setNominal] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [notesFromSatker, setNotesFromSatker] = useState('');

  useEffect(() => {
    if (item) {
      setSatker(item.satker || '');
      setBidang(item.bidang || 'Pembinaan');
      setJenisPengajuan(item.jenisPengajuan || '');
      setNominal(item.nominal ? new Intl.NumberFormat('id-ID').format(item.nominal) : '');
      setFileName(item.fileName || '');
      setFileUrl(item.fileUrl || '');
      setNotesFromSatker(item.notesFromSatker || '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) {
      setNominal('');
    } else {
      const formatted = new Intl.NumberFormat('id-ID').format(parseInt(rawVal, 10));
      setNominal(formatted);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericNominal = parseFloat(nominal.replace(/\./g, '')) || 0;
    onSaveEdit(item.id || item.submissionId, {
      satker: satker.trim(),
      bidang,
      jenisPengajuan: jenisPengajuan.trim(),
      nominal: numericNominal,
      fileName: fileName.trim(),
      fileUrl: fileUrl.trim(),
      notesFromSatker: notesFromSatker.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-amber-300 rounded-2xl w-full max-w-xl shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-xs">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Edit Data Permohonan BA BUN</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                  {item.submissionId.slice(0, 16)}...
                </span>
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Perbarui rincian permohonan anggaran yang telah di-entry
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Satker & Bidang Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Satuan Kerja (Satker) Pemohon:
              </label>
              <div className="w-full bg-amber-50/80 border border-amber-300 rounded-xl px-3 py-2 text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="truncate">{satker || item.satker}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Bidang / Sub Bagian:
              </label>
              <select
                value={bidang}
                onChange={(e) => setBidang(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Pembinaan">Pembinaan</option>
                <option value="Intelijen">Intelijen</option>
                <option value="Tindak Pidana Umum">Tindak Pidana Umum (Pidum)</option>
                <option value="Tindak Pidana Khusus">Tindak Pidana Khusus (Pidsus)</option>
                <option value="Perdata dan TUN">Perdata dan TUN (Datun)</option>
                <option value="Pengawasan">Pengawasan</option>
                <option value="Pidum & Pidsus">Pidum & Pidsus</option>
              </select>
            </div>
          </div>

          {/* Uraian Pengajuan */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Uraian Pengajuan:
            </label>
            <input
              type="text"
              required
              value={jenisPengajuan}
              onChange={(e) => setJenisPengajuan(e.target.value)}
              placeholder="Contoh: Pengadaan Peralatan TI / Permohonan TUP BA BUN"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Nominal Permohonan Anggaran (Rp):
            </label>
            <input
              type="text"
              required
              value={nominal}
              onChange={handleNominalChange}
              placeholder="Contoh: 5.000.000"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-emerald-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {nominal && (
              <p className="mt-1 text-[11px] font-bold text-emerald-700">
                Terbaca: Rp {nominal}
              </p>
            )}
          </div>

          <AttachmentUploader
            fileUrl={fileUrl}
            fileName={fileName}
            onFileChange={(url, name) => {
              setFileUrl(url);
              if (name) setFileName(name);
            }}
            label="Berkas Dokumen Permohonan PDF / Lampiran"
            required={true}
            accentColor="amber"
          />

          {/* Catatan dari Satker */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Catatan Permohonan dari Satker (Opsional):
            </label>
            <textarea
              rows={3}
              value={notesFromSatker}
              onChange={(e) => setNotesFromSatker(e.target.value)}
              placeholder="Keterangan tambahan permohonan..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
