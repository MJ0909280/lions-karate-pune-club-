import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import MartialButton from './MartialButton';
import { Award, MapPin, Shield, ArrowRight, GraduationCap, Phone } from 'lucide-react';

interface HeroProps {
  onNavigate: (view: string) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
  const [heroVideoUrl, setHeroVideoUrl] = useState<string>(
    'https://res.cloudinary.com/dlzdagymx/video/upload/v1786454954/0810_sfhphm.mp4'
  );

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'video'),
      (snap) => {
        if (snap.exists() && snap.data().heroVideoUrl) {
          setHeroVideoUrl(snap.data().heroVideoUrl);
        }
      },
      () => {}
    );
    return () => unsub();
  }, []);

  const scrollToExplorer = () => {
    const el = document.getElementById('experience-center');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-black pt-24 pb-16 px-4 sm:px-6 lg:px-8 border-b border-zinc-900"
    >
      {/* Full-Bleed Dojo Background Video */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <video
          src={heroVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-[#0a0909]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(155,27,32,0.12)_0%,#0a0909_85%)]" />
      </div>

      {/* Live Dojo Training Notice */}
      <div className="relative z-20 mb-6">
        <div className="inline-flex items-center gap-2.5 bg-slate-950/85 border border-red-500/30 px-4 py-1.5 rounded-full backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-200 font-bold">
            LIVE TODAY • NARHE, BHUMKAR BRIDGE &amp; JAMBULWADI DOJOS
          </span>
        </div>
      </div>

      {/* Hero Centerpiece */}
      <div className="relative z-20 max-w-5xl mx-auto text-center space-y-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="font-kanji font-black text-5xl sm:text-7xl tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-[#e0c78a] via-[#9B1B20] to-[#6a0000] select-none leading-none filter drop-shadow-[0_0_30px_rgba(155,27,32,0.45)]"
        >
          武道
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-heading text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-[0.12em] text-white leading-tight"
        >
          LIONS KARATE CLUB{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-[#C9A96E] to-red-500">
            PUNE
          </span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed font-sans"
        >
          Traditional Shotokan Karate, Martial Arts, Self-Defense &amp; Kickboxing Academy serving Narhe, Manaji Nagar, Dhayari, Ambegaon Pathar, Katraj Bypass, Bhumkar Bridge &amp; Jambulwadi, Pune.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-3"
        >
          <MartialButton
            id="hero-btn-admission"
            type="primary"
            onClick={() => onNavigate('admission')}
          >
            <span>ONLINE ADMISSION</span>
            <ArrowRight className="w-4 h-4" />
          </MartialButton>

          <a
            id="hero-btn-call"
            href="tel:+919049688172"
            aria-label="Call Sensei at +91 90496 88172"
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-heading font-black text-xs uppercase tracking-[0.18em] border border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-colors whitespace-nowrap shrink-0"
          >
            <Phone className="w-4 h-4" />
            <span>CALL SENSEI</span>
          </a>

          <MartialButton
            id="hero-btn-portal"
            type="secondary"
            onClick={() => onNavigate('student-portal')}
          >
            <GraduationCap className="w-4 h-4" />
            <span>STUDENT PORTAL</span>
          </MartialButton>

          <MartialButton
            id="hero-btn-explore"
            type="accent"
            onClick={scrollToExplorer}
          >
            <span>EXPLORE DOJO</span>
          </MartialButton>
        </motion.div>

        {/* Metrics Strip */}
        <div className="pt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-slate-950/80 border border-zinc-800/80 p-4 rounded-xl backdrop-blur-sm">
            <Award className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
            <p className="font-heading font-black text-lg text-white">KAI &amp; WKF</p>
            <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">Certified Syllabus</p>
          </div>
          <div className="bg-slate-950/80 border border-zinc-800/80 p-4 rounded-xl backdrop-blur-sm">
            <MapPin className="w-5 h-5 text-red-500 mx-auto mb-1.5" />
            <p className="font-heading font-black text-lg text-white">3 PUNE DOJOS</p>
            <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">Narhe · Bhumkar · Jambulwadi</p>
          </div>
          <div className="bg-slate-950/80 border border-zinc-800/80 p-4 rounded-xl backdrop-blur-sm">
            <Shield className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
            <p className="font-heading font-black text-lg text-white">AGES 4 TO ADULT</p>
            <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">Kids &amp; Self-Defense</p>
          </div>
          <div className="bg-slate-950/80 border border-zinc-800/80 p-4 rounded-xl backdrop-blur-sm">
            <GraduationCap className="w-5 h-5 text-red-500 mx-auto mb-1.5" />
            <p className="font-heading font-black text-lg text-white">DIGITAL ID PASS</p>
            <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">Instant Roll ID &amp; Exams</p>
          </div>
        </div>
      </div>
    </section>
  );
}
