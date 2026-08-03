import React, { useState } from 'react';
import { UserRole, SatkerAccount } from '../types';
import { 
  Building2, 
  User, 
  ArrowRight, 
  Sparkles,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (role: UserRole, username: string, satkerName?: string) => void;
  satkerAccounts?: SatkerAccount[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLogin,
  satkerAccounts = []
}) => {
  const [username, setUsername] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const processLogin = (rawUsername: string) => {
    const trimmed = rawUsername.trim().toLowerCase();
    if (!trimmed) return;

    if (trimmed === 'auditor.kejati' || trimmed === 'auditor') {
      setErrorMsg('');
      onLogin('auditor', 'auditor.kejati');
    } else if (trimmed === 'keuangan.babun' || trimmed === 'keuangan' || trimmed === 'admin') {
      setErrorMsg('');
      onLogin('keuangan', 'keuangan.babun');
    } else {
      // Check if username matches an existing registered Satker account
      const matchedAccount = satkerAccounts.find(acc => acc.username.toLowerCase() === trimmed);
      
      if (matchedAccount) {
        if (matchedAccount.status === 'nonaktif') {
          setErrorMsg(`Akun "${matchedAccount.satkerName}" saat ini non-aktif. Hubungi Admin Keuangan.`);
          return;
        }
        setErrorMsg('');
        onLogin('satker', matchedAccount.username, matchedAccount.satkerName);
      } else if (trimmed.startsWith('kejari.') || trimmed.includes('kejari')) {
        // Fallback for Satker login
        const autoSatkerName = trimmed.replace('kejari.', 'Kejari ').replace(/\b\w/g, c => c.toUpperCase());
        setErrorMsg('');
        onLogin('satker', trimmed, autoSatkerName);
      } else {
        setErrorMsg('Username / NIP tidak terdaftar. Gunakan akun Satker (contoh: kejari.bandarlampung), auditor.kejati, atau keuangan.babun');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processLogin(username);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Soft Yellow Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-amber-200/40 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-yellow-200/40 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Top Identity Header */}
      <header className="p-6 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-white p-1 border border-amber-300 shadow-md flex items-center justify-center">
              <img 
                src="https://lh3.googleusercontent.com/d/1Nn53DjvWyFisFEjeWWblr3YAkRCbYYls" 
                alt="Logo Kejaksaan RI" 
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight">
                SIP-BUN Kejati Lampung
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Sistem Informasi Entry & Verifikasi Permohonan BA BUN
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-amber-50/80 px-3.5 py-1.5 rounded-full border border-amber-200 text-xs text-amber-900 font-bold shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Database Firebase Firestore & Berkas URL</span>
          </div>
        </div>
      </header>

      {/* Main Login Form Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 relative z-10">
        <div className="w-full max-w-lg bg-white border border-amber-200/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
          
          {/* Logo & Title Header */}
          <div className="text-center space-y-2.5">
            <div className="h-20 w-20 mx-auto rounded-3xl bg-amber-50/80 p-2 border border-amber-300/80 shadow-md flex items-center justify-center">
              <img 
                src="https://lh3.googleusercontent.com/d/1Nn53DjvWyFisFEjeWWblr3YAkRCbYYls" 
                alt="Logo Kejaksaan RI" 
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain drop-shadow-sm"
              />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100/80 text-amber-900 border border-amber-300/80">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Portal Akses terbatas</span>
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Login Portal BA BUN
            </h2>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed font-medium">
              silahkan akses dengan user anda masing-masing.
            </p>
          </div>

          {/* Form Credentials */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Username / NIP Akun
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Masukkan Username / NIP Akun"
                  className="w-full bg-slate-50/80 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-xs"
                />
              </div>
              {errorMsg ? (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold mt-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 font-medium">
                  *User Kejaksaan Negeri menggunakan akun yang dibuat oleh Admin Keuangan.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl font-extrabold text-xs shadow-md transition-all duration-200 flex items-center justify-center gap-2 transform active:scale-95 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20"
            >
              <span>Masuk Portal</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Account Footer Note */}
          <div className="pt-3 text-center text-[11px] text-slate-500 font-medium border-t border-slate-200/80">
            Kejaksaan Tinggi Lampung
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 relative z-10 font-medium">
        © 2026 Sub Bagian Keuangan Kejati Lampung.
      </footer>

    </div>
  );
};


