import React, { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, FileText, Check, Trash2, FileCheck, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

interface AttachmentUploaderProps {
  fileUrl: string;
  fileName: string;
  onFileChange: (url: string, name: string) => void;
  label?: string;
  required?: boolean;
  accentColor?: 'amber' | 'emerald' | 'blue' | 'yellow';
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  fileUrl,
  fileName,
  onFileChange,
  label = 'Dokumen Lampiran Berkas Permohonan',
  required = true,
  accentColor = 'amber'
}) => {
  const isUploadedUrl = Boolean(
    fileUrl && (
      fileUrl.startsWith('data:') || 
      fileUrl.startsWith('blob:') || 
      fileUrl.includes('firebasestorage') || 
      fileUrl.includes('http://') || 
      fileUrl.includes('https://')
    )
  );

  const isDriveLink = Boolean(
    fileUrl && (
      fileUrl.includes('drive.google.com') || 
      fileUrl.includes('dropbox.com') || 
      fileUrl.includes('onedrive.live.com')
    )
  );

  const [mode, setMode] = useState<'upload' | 'link'>(isDriveLink ? 'link' : 'upload');
  const [linkInput, setLinkInput] = useState<string>(isDriveLink ? fileUrl : '');
  const [nameInput, setNameInput] = useState<string>(fileName || '');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');

  useEffect(() => {
    setNameInput(fileName || '');
    if (fileUrl) {
      if (fileUrl.includes('drive.google.com') || fileUrl.includes('dropbox.com')) {
        setMode('link');
        setLinkInput(fileUrl);
      } else {
        setLinkInput(fileUrl);
      }
    } else {
      setLinkInput('');
      setFileSizeStr('');
    }
  }, [fileUrl, fileName]);

  const colorClasses = {
    amber: {
      activeTab: 'bg-amber-500 text-slate-950 font-black shadow-xs',
      border: 'border-amber-300',
      bgLight: 'bg-amber-50/60',
      text: 'text-amber-900',
      ring: 'focus:ring-amber-500',
      button: 'bg-amber-500 text-slate-950 hover:bg-amber-400'
    },
    emerald: {
      activeTab: 'bg-emerald-600 text-white font-black shadow-xs',
      border: 'border-emerald-300',
      bgLight: 'bg-emerald-50/60',
      text: 'text-emerald-900',
      ring: 'focus:ring-emerald-500',
      button: 'bg-emerald-600 text-white hover:bg-emerald-500'
    },
    blue: {
      activeTab: 'bg-blue-600 text-white font-black shadow-xs',
      border: 'border-blue-300',
      bgLight: 'bg-blue-50/60',
      text: 'text-blue-900',
      ring: 'focus:ring-blue-500',
      button: 'bg-blue-600 text-white hover:bg-blue-500'
    },
    yellow: {
      activeTab: 'bg-yellow-500 text-slate-950 font-black shadow-xs',
      border: 'border-yellow-300',
      bgLight: 'bg-yellow-50/60',
      text: 'text-yellow-950',
      ring: 'focus:ring-yellow-500',
      button: 'bg-yellow-500 text-slate-950 hover:bg-yellow-400'
    }
  }[accentColor];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit check (30MB)
    if (file.size > 30 * 1024 * 1024) {
      setUploadError('Ukuran file melebihi batas 30 MB. Untuk berkas besar silakan gunakan tab "Tulis Link URL" Google Drive atau kompres menjadi .ZIP/.RAR.');
      return;
    }

    setUploadError('');
    setIsUploading(true);

    const sizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;
    setFileSizeStr(sizeFormatted);

    const uploadedName = file.name;
    setNameInput(uploadedName);

    // 1. Try Firebase Storage
    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `attachments/${Date.now()}_${cleanFileName}`;
      const fileRef = ref(storage, storagePath);
      
      const snapshot = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      onFileChange(downloadUrl, uploadedName);
      setIsUploading(false);
      return;
    } catch (storageErr: any) {
      console.warn("Firebase Storage upload fallback to local data/blob URL:", storageErr);

      // 2. Reliable Fallback via FileReader (DataURL / Base64) or Blob
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          onFileChange(dataUrl, uploadedName);
        } else {
          const blobUrl = URL.createObjectURL(file);
          onFileChange(blobUrl, uploadedName);
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        const blobUrl = URL.createObjectURL(file);
        onFileChange(blobUrl, uploadedName);
        setIsUploading(false);
      };
      
      try {
        reader.readAsDataURL(file);
      } catch (err) {
        const blobUrl = URL.createObjectURL(file);
        onFileChange(blobUrl, uploadedName);
        setIsUploading(false);
      }
    }
  };

  const handleLinkChange = (newLink: string) => {
    setLinkInput(newLink);
    onFileChange(newLink, nameInput || 'Dokumen_Lampiran.pdf');
  };

  const handleNameChange = (newName: string) => {
    setNameInput(newName);
    onFileChange(fileUrl, newName);
  };

  const handleClearFile = () => {
    setLinkInput('');
    setNameInput('');
    setFileSizeStr('');
    setUploadError('');
    onFileChange('', '');
  };

  const hasValidFile = Boolean(fileUrl && fileUrl.trim() !== '');

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="block text-xs font-bold text-slate-900">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setMode('upload');
              setUploadError('');
            }}
            className={`px-3 py-1 rounded-lg text-[11px] transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'upload' ? colorClasses.activeTab : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Unggah Langsung File</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('link');
              setUploadError('');
            }}
            className={`px-3 py-1 rounded-lg text-[11px] transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'link' ? colorClasses.activeTab : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Tulis Link URL</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {uploadError && (
        <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 font-bold text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Upload File Mode */}
      {mode === 'upload' ? (
        <div className="space-y-2">
          {hasValidFile ? (
            <div className={`p-3 rounded-xl border ${colorClasses.border} ${colorClasses.bgLight} flex items-center justify-between gap-3 shadow-2xs`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-2 rounded-lg ${colorClasses.button} shrink-0`}>
                  <FileCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs text-slate-900 truncate" title={nameInput || fileName || 'Dokumen_Terunggah.pdf'}>
                    {nameInput || fileName || 'Dokumen_Terunggah.pdf'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold flex items-center gap-2 mt-0.5">
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded font-black border border-emerald-300">
                      Dokumen Terlampir & Siap
                    </span>
                    {fileSizeStr && <span>{fileSizeStr}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={nameInput || fileName || 'Dokumen.pdf'}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Pratinjau</span>
                </a>
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Ganti / Hapus File"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className={`border-2 border-dashed ${colorClasses.border} ${colorClasses.bgLight} hover:bg-slate-100/80 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group relative`}>
                <div className={`p-2.5 rounded-full ${colorClasses.bgLight} border ${colorClasses.border} group-hover:scale-110 transition-transform mb-1.5`}>
                  {isUploading ? (
                    <Loader2 className={`h-6 w-6 animate-spin ${colorClasses.text}`} />
                  ) : (
                    <Upload className={`h-6 w-6 ${colorClasses.text}`} />
                  )}
                </div>
                <span className={`text-xs font-black ${colorClasses.text}`}>
                  {isUploading ? 'Membaca & Memproses File...' : 'Klik untuk Pilih File (PDF / Word / ZIP / RAR / Gambar)'}
                </span>
                <span className="text-[10px] text-slate-600 font-bold mt-0.5">
                  Maksimal Ukuran File: 30 MB (PDF, Word, Excel, Gambar, ZIP, RAR)
                </span>
                <input
                  type="file"
                  disabled={isUploading}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.jpg,.jpeg,.png,application/pdf,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/vnd.rar"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="p-2 bg-slate-100/80 rounded-xl border border-slate-200 text-[10px] text-slate-600 font-medium flex items-center gap-1.5">
                <span className="font-bold shrink-0 text-slate-800">💡 Info Lampiran:</span>
                <span>File SPP / bukti permohonan dapat langsung diunggah format PDF atau jika banyak berkas dikompres menjadi <strong className="text-slate-900 font-black">.ZIP</strong>.</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Link URL Mode */
        <div className="space-y-2">
          <div className="relative">
            <input
              type="url"
              required={required}
              value={linkInput}
              onChange={(e) => handleLinkChange(e.target.value)}
              placeholder="https://drive.google.com/file/d/... atau https://..."
              className={`w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 ${colorClasses.ring}`}
            />
            <LinkIcon className="h-4 w-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          <div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Nama Berkas Dokumen (Contoh: Dokumen_SPP_00123.pdf)"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <p className="text-[10px] text-slate-500 font-medium">
            💡 Salin & tempel URL akses publik dari Google Drive, Dropbox, atau penyimpan cloud lainnya.
          </p>
        </div>
      )}
    </div>
  );
};
