import { useRef, useState, useEffect } from 'react';
import { Admission } from '../types';
import { Printer, Download, CheckCircle2, Trophy, Award, Landmark, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const DEFAULT_STUDENT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23111'><rect width='100' height='100' fill='%231a1a1a'/><circle cx='50' cy='35' r='14' fill='%23c9a96e'/><path d='M50 50 L35 75 L30 73 L42 53 L38 50 L30 55 L28 50 L40 42 Z' fill='%23fff'/><path d='M50 50 L65 80 L72 82 L58 55 L65 48 L75 52 L78 47 L60 40 Z' fill='%23fff'/><path d='M42 45 H58 V49 H42 Z' fill='%239B1B20'/></svg>";

interface IDCardProps {
  admission: Admission;
  showSuccessBanner?: boolean;
  hideDownloadActions?: boolean;
}

export default function IDCard({ admission, showSuccessBanner = false, hideDownloadActions = false }: IDCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [emojis, setEmojis] = useState<{ id: number; char: string; left: number; delay: number; duration: number; size: number }[]>([]);
  const [effectiveBelt, setEffectiveBelt] = useState<string>(admission.beltLevel || 'White Belt');

  // Sync and dynamically fetch latest belt from Firestore exams if available
  useEffect(() => {
    setEffectiveBelt(admission.beltLevel || 'White Belt');

    async function fetchLatestBelt() {
      try {
        if (!admission?.studentId) return;
        const examsQ = query(collection(db, 'exams'), where('studentId', '==', admission.studentId));
        const snap = await getDocs(examsQ);
        if (!snap.empty) {
          const passedExams = snap.docs
            .map(d => d.data())
            .filter(e => e.status === 'passed' && e.targetBelt);
          if (passedExams.length > 0) {
            passedExams.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
            if (passedExams[0].targetBelt) {
              setEffectiveBelt(passedExams[0].targetBelt);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch latest exam belt:", err);
      }
    }

    fetchLatestBelt();
  }, [admission]);

  const qrDataString = `LIONS KARATE CLUB PUNE\nStudent ID: ${admission.studentId}\nName: ${admission.fullName}\nBatch: ${admission.batch}\nBranch: ${admission.branch || 'Manaji Nagar Branch'}`;

  // Melodic synthesizer helper
  const triggerAudioChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Explicitly resume audio context to handle browser-specific autoplay restrictions
      if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.warn('AudioContext resume failed:', e));
      }
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      
      const now = ctx.currentTime;
      playTone(523.25, now, 0.8);        // C5
      playTone(659.25, now + 0.12, 1.0); // E5
      playTone(783.99, now + 0.24, 1.2); // G5
      playTone(1046.50, now + 0.36, 1.5); // C6
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  };

  useEffect(() => {
    if (showSuccessBanner) {
      // Trigger chime
      triggerAudioChime();
      const timer = setTimeout(triggerAudioChime, 300);

      // Create falling emojis confetti (belts, stars, trophies)
      const pool = ['🥋', '⭐', '🏆', '⭐', '🥋', '🏆', '✨', '🔴', '⚪', '🟡'];
      const generated = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        char: pool[Math.floor(Math.random() * pool.length)],
        left: Math.random() * 95, // % left
        delay: Math.random() * 4, // stagger startup
        duration: 3 + Math.random() * 3, // 3-6 seconds fall
        size: 18 + Math.floor(Math.random() * 16), // px sizes
      }));
      setEmojis(generated);

      return () => clearTimeout(timer);
    }
  }, [showSuccessBanner]);

  // Print function isolates card and triggers native browser prompt
  const handlePrint = () => {
    window.print();
  };

  // Pure-JS High Fidelity Canvas Drawer & PNG Generator (Vertical, Black & White with Red accents)
  const handleDownloadPNG = () => {
    setDownloading(true);
    const canvas = document.createElement('canvas');
    const scaleFactor = 4; // 4x high-resolution multiplier for ultra-sharp details
    canvas.width = 400 * scaleFactor;
    canvas.height = 580 * scaleFactor;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setDownloading(false);
      return;
    }

    // Apply high density drawing metrics
    ctx.scale(scaleFactor, scaleFactor);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Happy sky blue background for premium print representation
    ctx.fillStyle = '#BAE6FD';
    ctx.fillRect(0, 0, 400, 580);

    // Thick solid black border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 14;
    ctx.strokeRect(0, 0, 400, 580);

    // Load logo elements dynamically
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';

    const proceedWithDrawing = () => {
      // Draw header box or custom logo
      try {
        if (logoImg.complete && logoImg.naturalWidth > 0) {
          ctx.save();
          // Precise square frame matching the exact visual style
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(30, 30, 52, 52);
          ctx.drawImage(logoImg, 30, 30, 52, 52);
          ctx.restore();
        } else {
          // Fallback box logo
          ctx.fillStyle = '#000000';
          ctx.fillRect(30, 30, 52, 52);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 30px "Outfit", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('L', 56, 56);
        }
      } catch (err) {
        // Fallback box logo in case of CORS errors
        ctx.fillStyle = '#000000';
        ctx.fillRect(30, 30, 52, 52);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('L', 56, 56);
      }

      // Header descriptions
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#000000';
      ctx.font = '900 11px "Outfit", sans-serif';
      ctx.fillText('LIONS KARATE CLUB PUNE', 94, 52);

      ctx.fillStyle = '#71717a';
      ctx.font = '700 7px "Outfit", sans-serif';
      ctx.fillText('EST. 2023 • MAHARASHTRA', 94, 68);

      // Load student photo dynamically
      const studentImg = new Image();
      studentImg.crossOrigin = 'anonymous';
      studentImg.onload = () => {
        // Draw image border frame 
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(100, 110, 200, 220);

        // Render grayscale portrait with safe clipping
        ctx.save();
        ctx.rect(100, 110, 200, 220);
        ctx.clip();
        ctx.filter = 'grayscale(100%)';
        ctx.drawImage(studentImg, 100, 110, 200, 220);
        ctx.restore();

        // Draw Name tag
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000000';
        ctx.font = '900 18px "Space Grotesk", sans-serif';
        ctx.fillText(admission.fullName.toUpperCase(), 200, 365);

        // Draw Rank / Belt Level (Vivid Artistic Red)
        ctx.fillStyle = '#FF3B3F';
        ctx.font = 'bold 11px "Space Grotesk", sans-serif';
        ctx.fillText(effectiveBelt.toUpperCase(), 200, 385);

        // Draw divider line
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 410);
        ctx.lineTo(360, 410);
        ctx.stroke();

        // Metadata left side: Student ID
        ctx.textAlign = 'left';
        ctx.fillStyle = '#71717a';
        ctx.font = 'bold 6.5px "Outfit", sans-serif';
        ctx.fillText('STUDENT ID', 45, 420);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px "JetBrains Mono", sans-serif';
        ctx.fillText(admission.studentId, 45, 433);

        // Metadata right side: Active Batch timings
        ctx.textAlign = 'right';
        ctx.fillStyle = '#71717a';
        ctx.font = 'bold 6.5px "Outfit", sans-serif';
        ctx.fillText('PROGRAM BATCH', 355, 420);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 8.5px "Outfit", sans-serif';
        ctx.fillText(admission.batch, 355, 433);

        // Metadata Row 2: Dojo Branch & Dedicated Coach
        ctx.textAlign = 'left';
        ctx.fillStyle = '#71717a';
        ctx.font = 'bold 6.5px "Outfit", sans-serif';
        ctx.fillText('DOJO BRANCH', 45, 450);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 8px "Outfit", sans-serif';
        ctx.fillText((admission.branch || 'Manaji Nagar Branch').toUpperCase(), 45, 461);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#71717a';
        ctx.font = 'bold 6.5px "Outfit", sans-serif';
        ctx.fillText('ASSIGNED COACH', 355, 450);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 8px "Outfit", sans-serif';
        const cleanCoach = (admission.coachName || 'Maruti Sir').split(' Black')[0].split(' black')[0].split(' Sir')[0].split(' Mam')[0].trim();
        ctx.fillText(cleanCoach.toUpperCase(), 355, 461);

        // Metadata Row 3: DOB & Fees Status
        ctx.textAlign = 'left';
        ctx.fillStyle = '#71717a';
        ctx.font = 'bold 6.5px "Outfit", sans-serif';
        ctx.fillText('DATE OF BIRTH', 45, 478);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 8px "Outfit", sans-serif';
        const formattedDob = admission.dob ? new Date(admission.dob).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A';
        ctx.fillText(formattedDob, 45, 489);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#71717a';
        ctx.font = 'bold 6.5px "Outfit", sans-serif';
        ctx.fillText('FEES STATUS', 355, 478);

        ctx.fillStyle = admission.feesStatus === 'Paid' ? '#065f46' : '#991b1b'; // dark green or dark red
        ctx.font = 'bold 8px "Outfit", sans-serif';
        ctx.fillText((admission.feesStatus || 'Unpaid').toUpperCase(), 355, 489);

        // Metadata Row 4: Parent Declaration & School
        ctx.textAlign = 'left';
        ctx.fillStyle = '#71717a';
        ctx.font = 'bold 6.5px "Outfit", sans-serif';
        ctx.fillText('GUARDIAN DECLARATION', 45, 506);

        ctx.fillStyle = '#065f46'; // dark green
        ctx.font = 'bold 7px "Outfit", sans-serif';
        ctx.fillText('✅ SIGNED & POLICIES ACCEPTED', 45, 517);

        if (admission.schoolName) {
          ctx.textAlign = 'right';
          ctx.fillStyle = '#71717a';
          ctx.font = 'bold 6.5px "Outfit", sans-serif';
          ctx.fillText('SCHOOL / INSTITUTION', 355, 506);

          ctx.fillStyle = '#000000';
          ctx.font = 'bold 7.5px "Outfit", sans-serif';
          const cleanSchoolName = admission.schoolName.toUpperCase();
          ctx.fillText(cleanSchoolName.length > 25 ? cleanSchoolName.substring(0, 22) + '...' : cleanSchoolName, 355, 517);
        }

        // QR Code Render on bottom-left, signature on bottom-right
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        qrImg.onload = () => {
          // Draw white card background for scanner
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(40, 532, 38, 38);

          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 1;
          ctx.strokeRect(40, 532, 38, 38);

          ctx.drawImage(qrImg, 41, 533, 36, 36);

          // Instructors digital signature text
          ctx.textAlign = 'right';
          ctx.fillStyle = '#000000';
          ctx.font = 'italic italic bold 9px Georgia, serif';
          ctx.fillText('Chief Instructor Maruti Jadhav', 355, 548);

          ctx.fillStyle = '#71717a';
          ctx.font = '900 5.5px "JetBrains Mono", sans-serif';
          ctx.fillText('LIONS KARATE CLUB PUNE', 355, 560);

          // Download PNG file directly
          const dataUrl = canvas.toDataURL('image/png');
          const trigger = document.createElement('a');
          trigger.download = `ID-Pass-${admission.studentId}.png`;
          trigger.href = dataUrl;
          trigger.click();
          setDownloading(false);
        };
        
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrDataString)}`;
      };
      
      studentImg.onerror = () => {
        if (studentImg.src !== DEFAULT_STUDENT_AVATAR) {
          studentImg.src = DEFAULT_STUDENT_AVATAR;
        }
      };
      studentImg.src = admission.photoUrl || DEFAULT_STUDENT_AVATAR;
    };

    logoImg.onload = proceedWithDrawing;
    logoImg.onerror = proceedWithDrawing;
    logoImg.src = "https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781350907/logo_new_bgwsw9.jpg";
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in no-print relative">
      <style>{`
        @keyframes fallAnimation {
          0% {
            transform: translateY(-50px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }
        .falling-emoji-item {
          pointer-events: none;
          position: fixed;
          top: -10vh;
          z-index: 100;
          user-select: none;
          animation-name: fallAnimation;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
        }
      `}</style>

      {/* Render Falling Celebration EMOJIS */}
      {showSuccessBanner && emojis.map((item) => (
        <div
          key={item.id}
          className="falling-emoji-item"
          style={{
            left: `${item.left}%`,
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            fontSize: `${item.size}px`,
          }}
        >
          {item.char}
        </div>
      ))}

      {showSuccessBanner && (
        <div className="bg-[#141211] border-2 border-amber-500/30 rounded-2xl p-6 sm:p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative overflow-hidden">
          {/* Subtle watermarked Dojo Kanji background */}
          <div className="absolute right-4 top-4 font-kanji text-8xl text-yellow-500/[0.03] select-none pointer-events-none font-black">
            認可
          </div>
          
          <div className="bg-amber-500/10 text-amber-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-amber-500/30 shadow-lg shadow-amber-500/5 animate-[pulse_2s_infinite]">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="text-[10px] uppercase tracking-[0.3em] text-amber-500 font-extrabold font-mono block mb-2">
            🥋 Osu! Registration Confirmed
          </span>

          <h2 className="font-heading text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-4">
            A True Fighter Is Born
          </h2>

          <div className="space-y-4 mb-6">
            {/* Primary Touching Message in BIG */}
            <div className="bg-[#1e1a18]/90 border-2 border-amber-600/80 p-5 sm:p-6 rounded-2xl text-left relative shadow-lg">
              <div className="absolute -top-3.5 left-6 bg-amber-500 text-slate-950 font-sans font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-white">
                Our Solemn Promise
              </div>
              <p className="text-amber-100 text-sm sm:text-base md:text-lg italic font-sans leading-relaxed pt-2">
                "We hope that <strong className="text-amber-400 font-extrabold">{admission.fullName}</strong> becomes a true fighter — physically powerful, mentally unbreakable, deeply disciplined, and polite to everybody in daily life."
              </p>
            </div>

            {/* Grid of touching parent & student blessings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="bg-stone-900/80 border border-stone-800 p-4 rounded-xl">
                <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest block mb-1">🌱 Character & Focus</span>
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  "Beyond the punches and kicks lies a path of outstanding character and deep humility. We promise to guide <strong>{admission.fullName}</strong> with absolute care, helping them blossom into a highly self-disciplined, confident, and warm-hearted individual."
                </p>
              </div>

              <div className="bg-stone-900/80 border border-stone-800 p-4 rounded-xl">
                <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest block mb-1">🥋 Unshakable Strength</span>
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  "A black belt is a white belt who never gave up. We are incredibly honored to walk beside your child on this beautiful journey of respect, courage, and lifelong victory. Welcome to our Dojo family!"
                </p>
              </div>

              <div className="bg-stone-900/80 border border-stone-800 p-4 rounded-xl">
                <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest block mb-1">🤝 Parent-Dojo Trust</span>
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  "To watch your child stand tall, face life's obstacles with brave eyes, and treat others with polite respect is the greatest joy of martial arts. We bow in gratitude for your trust in our guides."
                </p>
              </div>

              <div className="bg-[#1a1c18] border border-emerald-950 p-4 rounded-xl">
                <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest block mb-1">✨ True Karate Path</span>
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  "Karate is not about defeating others; it is about mastering oneself. We hope <strong>{admission.fullName}</strong> discovers their infinite inner fire, stands firm for justice, and always acts with kindness."
                </p>
              </div>
            </div>

            <div className="bg-[#1c1917]/50 border border-stone-850 p-4 rounded-xl text-center text-xs text-stone-400 font-sans italic">
              "We thank you from the bottom of our hearts. We can't wait to see them on the tatami mat!" 
              <div className="mt-2 text-amber-500 font-bold not-italic font-mono text-[10px] uppercase">
                🥋 Sensei Maruti Jadhav & Sensei Shivraj Jadhav
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/40 border border-stone-900 p-3.5 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wider block">ID Active Pass ready:</span>
              <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{admission.studentId}</span>
            </div>
            
            <button
              onClick={triggerAudioChime}
              className="px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-heading font-black text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow cursor-pointer"
              title="Replay Dojo Chime Ring"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Replay Chime</span>
            </button>
          </div>
        </div>
      )}

      {/* Visual representation of Student ID Card - Stylized vertical card layout with happy sky blue background */}
      <div className="flex justify-center w-full overflow-hidden py-1">
        <motion.div 
          id="printable-id-card"
          ref={cardRef}
          initial={{ opacity: 0, y: 35, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="relative bg-[#BAE6FD] text-black p-8 w-[345px] h-[580px] flex flex-col justify-between border-[6px] border-black shadow-2xl z-20 select-none rounded-none scale-[0.85] xs:scale-[0.92] sm:scale-100 origin-center transition-transform"
        >
        {/* Upper Header Row */}
        <div className="w-full flex justify-between items-start">
          <div className="flex items-center gap-2">
            <img 
              src="https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781350907/logo_new_bgwsw9.jpg" 
              alt="Lions Karate Club Logo" 
              className="w-10 h-10 object-contain rounded border border-black/15 bg-white p-0.5 shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = document.getElementById('logo-fallback');
                if (fallback) fallback.classList.remove('hidden');
              }}
              referrerPolicy="no-referrer"
            />
            <div id="logo-fallback" className="hidden w-10 h-10 bg-black items-center justify-center text-white font-black text-lg">L</div>
            <div className="text-left">
              <p className="text-[10px] font-black leading-none uppercase tracking-tight">LIONS KARATE CLUB PUNE</p>
              <p className="text-[6px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">EST. 2023 • MAHARASHTRA</p>
            </div>
          </div>
          <div className="text-right uppercase">
            <p className="text-[8px] font-black leading-none text-[#FF3B3F]">STUDENT ID</p>
            <p className="text-[9px] font-mono font-bold text-black mt-1">{admission.studentId}</p>
          </div>
        </div>

        {/* Photo Frame containing Portrait Grayscale Image */}
        <div className="w-40 h-[190px] bg-zinc-100 border-2 border-black mx-auto mt-3 overflow-hidden relative flex items-center justify-center select-none shadow">
          <img 
            src={admission.photoUrl || DEFAULT_STUDENT_AVATAR} 
            alt="Student Portrait Pass"
            className="w-full h-full object-cover filter grayscale contrast-110"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Dynamic student title metadata */}
        <div className="text-center mt-2.5">
          <h2 className="text-lg font-black uppercase tracking-tight text-black leading-none mb-0.5">
            {admission.fullName}
          </h2>
          <p className="text-[10px] font-bold text-[#FF3B3F] tracking-widest uppercase mb-3">
            {effectiveBelt}
          </p>
          
          {/* Metadata Parameters Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-left border-t border-black/15 pt-2 text-xs">
            <div>
              <p className="text-[5.5px] uppercase font-bold text-zinc-500">STATUS BATCH</p>
              <p className="text-[8.5px] font-bold text-black truncate leading-tight">{admission.batch}</p>
            </div>
            <div>
              <p className="text-[5.5px] uppercase font-bold text-zinc-500">VERIFICATION</p>
              <p className="text-[8.5px] font-bold text-black uppercase leading-tight">{admission.status}</p>
            </div>
            <div>
              <p className="text-[5.5px] uppercase font-bold text-zinc-500">DOJO BRANCH</p>
              <p className="text-[8.5px] font-bold text-black truncate leading-tight">{admission.branch || 'Manaji Nagar Branch'}</p>
            </div>
            <div>
              <p className="text-[5.5px] uppercase font-bold text-zinc-500">COACH ASSIGNED</p>
              <p className="text-[8.5px] font-bold text-black truncate leading-tight" title={admission.coachName}>
                {admission.coachName ? admission.coachName.split(' black')[0].split(' Black')[0].replace(' Sir', '').replace(' Mam', '') : 'Maruti Jadhav'}
              </p>
            </div>
            <div>
              <p className="text-[5.5px] uppercase font-bold text-zinc-500">DATE OF BIRTH</p>
              <p className="text-[8.5px] font-bold text-black leading-tight">
                {admission.dob ? new Date(admission.dob).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[5.5px] uppercase font-bold text-zinc-500">FEES STATUS</p>
              <span className={`text-[7.5px] font-bold px-1.5 py-0.5 rounded leading-none inline-block ${admission.feesStatus === 'Paid' ? 'bg-emerald-500/20 text-emerald-800' : 'bg-rose-500/20 text-rose-800'}`}>
                {(admission.feesStatus || 'Unpaid').toUpperCase()}
              </span>
            </div>
            {admission.schoolName && (
              <div className="col-span-2 border-t border-black/5 pt-1 mt-0.5">
                <p className="text-[5.5px] uppercase font-bold text-zinc-500">SCHOOL / INSTITUTION</p>
                <p className="text-[8.5px] font-bold text-black uppercase truncate leading-tight" title={admission.schoolName}>
                  {admission.schoolName}
                </p>
              </div>
            )}
            <div className="col-span-2 border-t border-black/5 pt-1 mt-0.5">
              <p className="text-[5.5px] uppercase font-bold text-zinc-500">GUARDIAN DECLARATION STATUS</p>
              <p className="text-[7.5px] font-black text-emerald-800 flex items-center gap-1.5">
                <span>✅ SIGNED & POLICIES ACCEPTED</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Area with barcode scanner on Left and digital Sensei signature on Right */}
        <div className="mt-auto w-full flex justify-between items-end border-t border-black/5 pt-2">
          <div className="w-12 h-12 border border-black/10 flex items-center justify-center p-0.5 bg-white shadow-sm">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrDataString)}`}
              alt="Validation QR code"
              className="w-full h-full"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="italic text-[9px] font-bold font-serif leading-none block mb-0.5 text-black">Chief Instructor Maruti Jadhav</span>
            <span className="text-[5px] uppercase font-bold font-mono tracking-widest text-zinc-400">CHIEF TRAINER & ADMIN</span>
          </div>
        </div>
      </motion.div>
    </div>

      {/* Interactive print and download options */}
      {!hideDownloadActions && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-zinc-900">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 font-heading font-extrabold text-[10px] uppercase tracking-widest border border-zinc-700 hover:border-[#FF3B3F] text-zinc-300 hover:text-white hover:bg-zinc-900 px-6 py-3.5 rounded-lg transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#FF3B3F]" />
            <span>PRINT THE STUDENT PASS</span>
          </button>

          <button
            onClick={handleDownloadPNG}
            disabled={downloading}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 font-heading font-extrabold text-[10px] uppercase tracking-widest bg-[#FF3B3F] hover:bg-rose-500 text-white px-6 py-3.5 rounded-lg transition-all shadow-md hover:shadow-red-500/10 cursor-pointer"
          >
            {downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>DRAFTING PNG FILE...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>DOWNLOAD DESIGNER ID CARD</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
