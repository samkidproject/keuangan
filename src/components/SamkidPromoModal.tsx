import React from 'react';
import { 
  X, 
  Sparkles, 
  Code2, 
  CheckCircle2, 
  MessageCircle, 
  PhoneCall, 
  ExternalLink,
  Zap,
  ShieldCheck,
  Layout
} from 'lucide-react';

interface SamkidPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SamkidPromoModal: React.FC<SamkidPromoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const waNumber = '6282374125554';
  const defaultText = encodeURIComponent('Halo Samkid Project, saya tertarik untuk berkonsultasi & membuat aplikasi custom dengan harga terjangkau.');
  const waUrl = `https://wa.me/${waNumber}?text=${defaultText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white border border-amber-200/80 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative text-slate-800 transform transition-all">
        
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 p-6 pt-5 pb-8 text-slate-950">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black text-slate-900 shadow-xs">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>Samkid Project Digital Service</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-950/20 hover:bg-slate-950/40 text-white transition-all focus:outline-none cursor-pointer"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white p-2 shadow-md border-2 border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Code2 className="h-7 w-7" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-950/80">Jasa Pembuatan Aplikasi</span>
              <h3 className="text-lg font-black text-slate-950 tracking-tight leading-tight">
                Samkid Project Solution
              </h3>
            </div>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-5">
          
          {/* Main Question & Description */}
          <div className="space-y-2 bg-amber-50/60 p-4 rounded-2xl border border-amber-200/70">
            <h4 className="text-base font-black text-slate-900 tracking-tight leading-snug">
              Butuh Pembuatan Aplikasi Web & Sistem Informasi Custom?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Aplikasi ini dirancang & dikembangkan secara profesional oleh <strong className="text-amber-800 font-extrabold">Samkid Project</strong>. Kami siap membantu pembuatan sistem informasi, portal instansi, dashboard interaktif, maupun aplikasi custom lainnya sesuai kebutuhan Anda dengan <strong className="text-amber-800 font-black">harga terjangkau & pengerjaan cepat</strong>.
            </p>
          </div>

          {/* Key Advantages */}
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 space-y-2.5">
            <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-600" />
              <span>Mengapa Memilih Samkid Project?</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold text-slate-700">
              <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-amber-200/50">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Harga Bersahabat & Terjangkau</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-amber-200/50">
                <Layout className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Desain Modern & Responsif</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-amber-200/50">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                <span>Database Realtime & Aman</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-amber-200/50">
                <Sparkles className="h-4 w-4 text-purple-600 shrink-0" />
                <span>Fitur Custom Sesuai Request</span>
              </div>
            </div>
          </div>

          {/* Contact & Call To Action */}
          <div className="space-y-3 pt-1">
            <div className="text-center space-y-1">
              <p className="text-xs font-black text-slate-900">
                Konsultasikan Ide & Kebutuhan Aplikasi Anda Sekarang!
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Sistem Informasi • Portal Instansi • Dashboard Analitik • E-Office
              </p>
            </div>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 transform active:scale-95 group"
            >
              <MessageCircle className="h-5 w-5 fill-white text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>Hubungi via WhatsApp: 082374125554</span>
              <ExternalLink className="h-4 w-4 opacity-80" />
            </a>

            <div className="flex items-center justify-center gap-4 text-[11px] font-bold text-slate-500 pt-1">
              <a 
                href="tel:082374125554" 
                className="hover:text-slate-900 flex items-center gap-1 transition-colors"
              >
                <PhoneCall className="h-3.5 w-3.5 text-amber-600" />
                <span>0823-7412-5554</span>
              </a>
              <span>•</span>
              <span className="text-amber-800 font-extrabold">Samkid Project © 2026</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
