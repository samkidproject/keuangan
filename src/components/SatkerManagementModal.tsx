import React, { useState } from 'react';
import { SatkerAccount } from '../types';
import { formatWhatsAppLink, formatDisplayPhone } from '../lib/contactUtils';
import { 
  Users, 
  X, 
  UserPlus, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Search, 
  Key,
  User,
  Phone,
  MessageSquare
} from 'lucide-react';

interface SatkerManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: SatkerAccount[];
  onAddAccount: (acc: Omit<SatkerAccount, 'id' | 'createdAt'>) => void;
  onToggleAccountStatus: (id: string) => void;
  onDeleteAccount: (id: string) => void;
}

export const SatkerManagementModal: React.FC<SatkerManagementModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onAddAccount,
  onToggleAccountStatus,
  onDeleteAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // New account form state
  const [satkerName, setSatkerName] = useState('');
  const [username, setUsername] = useState('');
  const [namaPetugas, setNamaPetugas] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!satkerName.trim() || !username.trim()) return;

    const formattedUsername = username.trim().toLowerCase().replace(/\s+/g, '');

    onAddAccount({
      satkerName: satkerName.trim(),
      username: formattedUsername,
      namaPetugas: namaPetugas.trim() || undefined,
      whatsappNumber: whatsappNumber.trim() || undefined,
      status: 'aktif',
    });

    setSuccessMsg(`Akun Satker "${satkerName}" (${formattedUsername}) berhasil dibuat!`);
    setSatkerName('');
    setUsername('');
    setNamaPetugas('');
    setWhatsappNumber('');
    setTimeout(() => {
      setSuccessMsg('');
      setActiveTab('list');
    }, 1500);
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.satkerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (acc.namaPetugas && acc.namaPetugas.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (acc.whatsappNumber && acc.whatsappNumber.includes(searchTerm))
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-amber-300 rounded-2xl w-full max-w-2xl shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Kelola Akun Satker Kejaksaan Negeri</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                  Admin Keuangan Mode
                </span>
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Buat dan atur hak akses login akun user dari setiap Kejaksaan Negeri (Satker)
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

        {/* Modal Navigation Tabs */}
        <div className="px-5 pt-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'list'
                  ? 'border-amber-500 text-slate-900 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="h-4 w-4 text-amber-600" />
              <span>Daftar Akun Satker ({accounts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('add')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'add'
                  ? 'border-amber-500 text-slate-900 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="h-4 w-4 text-emerald-600" />
              <span>+ Buat Akun Satker Baru</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === 'list' ? (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama Satker / Username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Accounts List */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {filteredAccounts.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Tidak ada akun Satker yang sesuai dengan pencarian.
                  </div>
                ) : (
                  filteredAccounts.map((acc) => (
                    <div 
                      key={acc.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-amber-300 transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 font-black">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                            <span>{acc.satkerName}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              acc.status === 'aktif' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {acc.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1 font-semibold text-amber-800">
                              <Key className="h-3 w-3" />
                              Username: <strong>{acc.username}</strong>
                            </span>

                            {acc.namaPetugas && (
                              <span className="flex items-center gap-1 font-semibold text-slate-700">
                                <User className="h-3 w-3 text-slate-500" />
                                Petugas: <strong>{acc.namaPetugas}</strong>
                              </span>
                            )}

                            {acc.whatsappNumber && (
                              <a
                                href={formatWhatsAppLink(acc.whatsappNumber, `Halo Bpk/Ibu ${acc.namaPetugas || ''} dari ${acc.satkerName}, terkait koordinasi pengajuan BA BUN.`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition-colors"
                              >
                                <MessageSquare className="h-3 w-3 text-emerald-600" />
                                <span>WA: {formatDisplayPhone(acc.whatsappNumber)}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleAccountStatus(acc.id)}
                          title={acc.status === 'aktif' ? 'Non-aktifkan Akun' : 'Aktifkan Akun'}
                          className={`px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition-colors flex items-center gap-1 ${
                            acc.status === 'aktif' 
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300' 
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {acc.status === 'aktif' ? (
                            <>
                              <XCircle className="h-3 w-3 text-amber-700" />
                              <span>Non-Aktifkan</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                              <span>Aktifkan</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteAccount(acc.id)}
                          title="Hapus Akun Satker"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Add Account Form */
            <form onSubmit={handleCreate} className="space-y-4">
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nama Kejaksaan Negeri / Satker *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kejari Bandar Lampung"
                  value={satkerName}
                  onChange={(e) => {
                    setSatkerName(e.target.value);
                    if (!username) {
                      const autoUser = 'kejari.' + e.target.value.toLowerCase().replace(/kejari/g, '').replace(/kejaksaan/g, '').replace(/negeri/g, '').replace(/[^a-z0-9]/g, '');
                      setUsername(autoUser);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Nama Petugas / Operator Satker
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bpk. Ahmad Hidayat, S.H."
                    value={namaPetugas}
                    onChange={(e) => setNamaPetugas(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Nomor WhatsApp Contact</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Username Login Satker *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: kejari.bandarlampung"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-mono font-bold text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  *Gunakan huruf kecil tanpa spasi. User akan menggunakan username ini untuk masuk portal.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-2xs flex items-center gap-1.5"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Simpan & Buat Akun</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
          <span>Kejati Lampung • Subbagian Keuangan BA BUN</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
