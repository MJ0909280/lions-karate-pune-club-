import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Sparkles } from 'lucide-react';

export default function WhatsAppFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Auto-show tooltip after 3 seconds on load to gently alert the user
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 3000);

    // Auto-hide tooltip after 10 seconds if not engaged
    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 13000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  const whatsappNumber = "919049688172";
  const whatsappMessage = "Hello Lions Karate Club Pune, I am interested in joining the academy. Could you please share details regarding batch schedules, age groups, and admission fees for new students?";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div id="whatsapp-fab-container" className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none no-print">
      
      {/* Tooltip speech bubble */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="mb-3 bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-4 shadow-xl max-w-xs pointer-events-auto relative text-left"
          >
            {/* Close tooltip button */}
            <button 
              onClick={() => setShowTooltip(false)}
              className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              title="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] uppercase font-black tracking-wider text-yellow-500 font-heading">Direct Inquiry</span>
            </div>
            
            <p className="text-xs text-zinc-300 leading-relaxed pr-4 font-sans font-medium">
              Want to join? Chat with our administrators directly on WhatsApp for instant batch registrations!
            </p>
            
            <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex justify-between items-center">
              <span className="text-[9px] font-mono text-zinc-500">Avg. response status: Instant</span>
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowTooltip(false)}
                className="text-xs text-yellow-500 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Chat Now &rarr;
              </a>
            </div>
            
            {/* Arrow helper decoration */}
            <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-zinc-905 border-r border-b border-zinc-805 rotate-45" style={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1 }}
        className="pointer-events-auto"
      >
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          title="Inquire on WhatsApp"
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-emerald-500/20 shadow-black/50 transition-all hover:scale-110 active:scale-95 group cursor-pointer border border-emerald-500/40"
          onMouseEnter={() => setShowTooltip(false)}
        >
          {/* Subtle green pulse effect around the button */}
          <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping opacity-60 group-hover:hidden transition-all duration-1000" />
          
          <MessageSquare className="w-6 h-6 shrink-0 transition-transform group-hover:rotate-6" />
          
          {/* Subtle badge on top */}
          <span className="absolute -top-1 -right-1 bg-yellow-500 text-[10px] text-slate-950 font-black rounded-full w-5 h-5 flex items-center justify-center border border-zinc-950 shadow">
            <Sparkles className="w-3 h-3" />
          </span>
        </a>
      </motion.div>

    </div>
  );
}
