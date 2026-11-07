import { useState, useRef, MouseEvent, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface MartialButtonProps {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  id: string;
  type?: 'primary' | 'secondary' | 'accent' | 'outline' | 'custom';
}

export default function MartialButton({
  children,
  onClick,
  className = "",
  id,
  type = "primary"
}: MartialButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdCounter = useRef(0);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newRipple: Ripple = {
        id: rippleIdCounter.current++,
        x,
        y
      };

      setRipples((prev) => [...prev, newRipple]);

      // Cleanup ripple after animation completes
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);
    }

    if (onClick) {
      onClick(e);
    }
  };

  // Pre-configured stylistic base presets reflecting the Tokyo Ink Black & Tokyo Crimson themes
  const baseStyles = "relative overflow-hidden cursor-pointer select-none outline-none focus:outline-none transition-all";
  
  const presets = {
    primary: "bg-[#9B1B20] hover:bg-red-500 text-white font-heading font-black text-xs sm:text-sm tracking-[0.25em] uppercase py-4 px-8 rounded-none border border-red-600/40 shadow-[0_4px_0_#6b1216] active:translate-y-[4px] active:shadow-none",
    secondary: "bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-heading font-black text-xs uppercase tracking-widest py-4 px-8 rounded-none border border-yellow-600 shadow-[0_4px_0_#b28000] active:translate-y-[4px] active:shadow-none",
    accent: "bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-red-500/50 text-zinc-300 font-heading font-bold text-xs uppercase tracking-widest py-4 px-8 rounded-none shadow-[0_4px_0_#1a1a1a] active:translate-y-[4px] active:shadow-none",
    outline: "bg-transparent hover:bg-zinc-900/60 border border-zinc-700 hover:border-red-500 text-zinc-300 font-heading font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-none",
    custom: ""
  };

  const chosenPreset = presets[type];

  // Shotokan snap kinetic easing curve (sharp sudden stop mimicking Sun-dome strike focus)
  const snapTransition = {
    type: "spring",
    stiffness: 550,
    damping: 14,
    mass: 0.8
  };

  return (
    <motion.button
      ref={buttonRef}
      id={id}
      onClick={handleClick}
      whileHover={{ 
        scale: 1.025,
        transition: { duration: 0.15, ease: "easeOut" }
      }}
      whileTap={{ 
        scale: 0.94,
        y: type !== 'outline' ? 4 : 2, // Physical compression matching 3D click height
        transition: snapTransition
      }}
      className={`${baseStyles} ${chosenPreset} ${className}`}
    >
      {/* Background kinetic grid glints on hover */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />

      {/* Kinetic Strike Ripples */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.85 }}
            animate={{ scale: 8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.1, 0.8, 0.15, 1] }} // Fast acceleration, sudden damping
            className="absolute rounded-full pointer-events-none"
            style={{
              top: ripple.y,
              left: ripple.x,
              width: "24px",
              height: "24px",
              marginLeft: "-12px",
              marginTop: "-12px",
              border: type === "secondary" ? "2px solid #9B1B20" : "2px solid #FFD700",
              background: type === "secondary" ? "radial-gradient(circle, rgba(155,27,32,0.4) 0%, transparent 70%)" : "radial-gradient(circle, rgba(255,42,53,0.35) 0%, transparent 70%)",
              boxShadow: type === "secondary" ? "0 0 10px rgba(155,27,32,0.5)" : "0 0 15px rgba(255,42,53,0.6)",
              zIndex: 1
            }}
          />
        ))}
      </AnimatePresence>

      {/* Real-time child components context wrapper */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
