import { useState, useEffect } from 'react';
import { MessageCircle, Phone, X } from 'lucide-react';
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
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 no-print">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="bg-slate-900 border border-amber-500/30 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 max-w-[260px]"
          >
            <div className="text-[11px] leading-snug">
              <span className="font-bold text-amber-400 block uppercase tracking-wider text-[10px]">
                Direct Dojo Desk
              </span>
              Free Trial or Batch info? Call or WhatsApp Sensei!
            </div>
            <button
              type="button"
              onClick={() => setShowTooltip(false)}
              aria-label="Dismiss contact prompt"
              className="text-zinc-400 hover:text-white p-1 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1-Tap Floating Call Button above WhatsApp */}
      <a
        href="tel:+919049688172"
        aria-label="Call Sensei at +91 90496 88172"
        title="Call Sensei (+91 90496 88172)"
        className="group flex items-center justify-center w-13 h-13 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_24px_rgba(245,158,11,0.4)] transition-transform duration-150 hover:scale-105"
      >
        <Phone className="w-5 h-5" />
      </a>

      {/* Floating WhatsApp Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
        className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-transform duration-150 hover:scale-105"
      >
        <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-25 pointer-events-none" />
        <MessageCircle className="w-6 h-6 relative z-10" />
      </a>
    </div>
  );
}
