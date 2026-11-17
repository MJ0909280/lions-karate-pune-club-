import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function WhatsAppFAB() {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const whatsappNumber = '919049688172';
  const whatsappMessage =
    'Namaste Sensei! I visited the LIONS KARATE CLUB PUNE website and want to enquire about Admissions, Class Batches, or Free Trial Classes.';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5 no-print">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="bg-slate-900 border border-emerald-500/30 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 max-w-[260px]"
          >
            <div className="text-[11px] leading-snug">
              <span className="font-bold text-emerald-400 block uppercase tracking-wider text-[9px]">
                Direct Dojo Desk
              </span>
              Questions on batches, fees or trial? Chat on WhatsApp!
            </div>
            <button
              type="button"
              onClick={() => setShowTooltip(false)}
              aria-label="Dismiss chat prompt"
              className="text-zinc-500 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all hover:scale-105"
      >
        <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-25 pointer-events-none" />
        <MessageCircle className="w-6 h-6 relative z-10" />
      </a>
    </div>
  );
}
