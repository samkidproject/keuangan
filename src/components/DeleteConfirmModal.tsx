import React from 'react';
import { SubmissionItem } from '../types';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  item: SubmissionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (id: string, submissionId?: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !item) return null;

  const handleDelete = () => {
    onConfirmDelete(item.id, item.submissionId);
    onClose();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-rose-300 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-600 text-white font-bold shadow-xs">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Konfirmasi Hapus Data
              </h3>
              <p className="text-xs text-rose-800 font-medium">
                Tindakan ini tidak dapat dibatalkan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-rose-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 text-xs">
          <p className="text-slate-700 font-medium">
            Apakah Anda yakin ingin menghapus data permohonan anggaran berikut dari sistem?
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
            <div className="flex justify-between items-center text-slate-500 font-semibold text-[11px]">
              <span>ID: {item.submissionId || item.id}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                {item.satker}
              </span>
            </div>
            <div className="font-bold text-slate-900 text-sm">
              {item.jenisPengajuan}
            </div>
            <div className="text-emerald-800 font-black text-xs">
              {formatCurrency(item.nominal)}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            <span>Ya, Hapus Permanent</span>
          </button>
        </div>

      </div>
    </div>
  );
};
