import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, Shield, Award } from 'lucide-react';

interface TrailerOverlayProps {
  onEnter: () => void;
}

export default function TrailerOverlay({ onEnter }: TrailerOverlayProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particles animation inside the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      wobble: number;
      life: number;
      age: number;
    }> = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial fill
    for (let i = 0; i < 65; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 1,
        speed: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.7 + 0.2,
        wobble: Math.random() * 1.5 - 0.75,
        life: Math.random() * 300 + 200,
        age: Math.random() * 200,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, idx) => {
        p.y -= p.speed;
        p.x += Math.sin(p.age * 0.03) * p.wobble;
        p.age += 1;

        if (p.age > p.life || p.y < -30) {
          particles[idx] = {
            x: Math.random() * canvas.width,
            y: canvas.height + 20,
            size: Math.random() * 2.5 + 1,
            speed: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.7 + 0.2,
            wobble: Math.random() * 1.5 - 0.75,
            life: Math.random() * 300 + 200,
            age: 0,
          };
        }

        // Draw embers
        const alpha = p.opacity * (1 - p.age / p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210, 120, 50, ${alpha})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(155, 27, 32, ${alpha * 0.35})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setTimeout(() => {
      onEnter();
    }, 1000);
  };

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-[10000] bg-black select-none overflow-hidden flex flex-col items-center justify-center cursor-pointer"
          onClick={handleDismiss}
        >
          {/* Cinematic Background Autoplayer Video */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <video
              src="https://res.cloudinary.com/dlzdagymx/video/upload/q_auto/f_auto/v1781891366/WhatsApp_Video_2026-06-19_at_9.51.10_PM_pog0dc.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-80"
            />
            {/* Cinematic Vignettes for high contrast and extreme legibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/90 mix-blend-multiply" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,#000000_80%)]" />
          </div>

          {/* Golden ember particles drifting over the background video */}
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full z-10 opacity-75" />

          {/* Core Branding Elements */}
          <div className="relative z-20 text-center flex flex-col items-center gap-6 max-w-xl px-6 pointer-events-auto">
            {/* Massive Kanji characters in background style */}
            <motion.div 
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              className="font-kanji font-bold text-7xl sm:text-9xl tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-b from-[#e0c78a] via-[#9B1B20] to-[#6a0000] select-none leading-none filter drop-shadow-[0_0_40px_rgba(155,27,32,0.4)]"
            >
              武道
            </motion.div>

            {/* Subtitle */}
            <motion.h1 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 1.2 }}
              className="font-heading text-xl sm:text-3xl text-[#F0E6D3] uppercase tracking-[0.25em] leading-tight"
            >
              Lions Karate Club Pune
            </motion.h1>

            {/* Expandable Golden Lines */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: 240 }}
              transition={{ delay: 1, duration: 1.5 }}
              className="h-[1px] bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent"
            />

            {/* Traditional slogan */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.4, duration: 1 }}
              className="font-body text-sm sm:text-base italic text-[#8a7040] tracking-widest uppercase font-medium leading-normal"
            >
              — 精神一到 • COURAGE & HONOR —
            </motion.div>

            {/* Main Interactive Action CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4">
              {/* Watch Practice Video Button */}
              <motion.button 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.6, duration: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVideo(true);
                }}
                className="w-full sm:w-auto font-heading font-medium text-xs sm:text-xs tracking-[0.25em] uppercase bg-[#9B1B20]/15 hover:bg-[#9B1B20]/30 border border-[#9B1B20] hover:border-red-500 hover:shadow-[0_0_25px_rgba(155,27,32,0.5)] text-red-250 hover:text-white py-4 px-8 rounded-none transition-all cursor-pointer flex items-center justify-center gap-2 group"
              >
                <div className="relative flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 fill-current animate-pulse text-red-400 group-hover:text-white" />
                </div>
                <span>WATCH PRACTICE TRAILER</span>
              </motion.button>

              {/* Enter Dojo Button */}
              <motion.button 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.8, duration: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="w-full sm:w-auto font-heading font-normal text-xs sm:text-xs tracking-[0.25em] uppercase bg-transparent hover:bg-[#C9A96E]/10 border border-[#C9A96E] hover:border-[#e0c78a] hover:shadow-[0_0_35px_rgba(201,169,110,0.4)] text-[#C9A96E] hover:text-[#e0c78a] py-4 px-10 rounded-none transition-all cursor-pointer relative overflow-hidden group"
              >
                <span className="relative z-10 font-bold">ENTER THE DOJO</span>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#C9A96E] transition-all group-hover:w-[80%]" />
              </motion.button>
            </div>
          </div>

          {/* Interactive Cinematic Video Player Modal Backdrop */}
          <AnimatePresence>
            {showVideo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[20000] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVideo(false);
                }}
              >
                <div 
                  className="relative w-full max-w-4xl aspect-video bg-[#141211]/90 rounded-none border border-stone-850 shadow-[0_0_60px_rgba(155,27,32,0.3)] flex flex-col overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Top Bar controls */}
                  <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 z-20 pointer-events-auto">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#9B1B20]" />
                      <span className="font-heading text-[10px] sm:text-xs font-black tracking-[0.2em] text-[#F0E6D3] uppercase">
                        DOJO COMPILATION • PRACTICE SESSION
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => setShowVideo(false)}
                      className="p-1 px-3 text-stone-400 hover:text-white bg-stone-900/60 border border-stone-800 hover:border-stone-700 transition-all font-mono text-[10px] tracking-widest uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>CLOSE</span>
                    </button>
                  </div>

                  {/* HD Practice Video Player Frame using Cloudinary Direct URL */}
                  <div className="w-full h-full pt-14 flex items-center justify-center relative bg-black">
                    <video 
                      className="w-full h-full object-contain"
                      src="https://res.cloudinary.com/dlzdagymx/video/upload/q_auto/f_auto/v1781891366/WhatsApp_Video_2026-06-19_at_9.51.10_PM_pog0dc.mp4"
                      controls
                      autoPlay
                      preload="auto"
                      playsInline
                    />
                  </div>
                </div>

                {/* Info Text */}
                <motion.p 
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 0.7 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-[#C9A96E]"
                >
                  🥋 Lions Karate Club Pune — Real Practice Reels
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hints indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 2.2, duration: 1 }}
            className="absolute bottom-10 z-10 font-mono text-[9px] uppercase tracking-[0.3em] text-[#8a7040]"
          >
            Click "Enter the Dojo" to explore training schedules
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
