import { useState, useEffect, useRef } from 'react';
import { Award, Zap, Users, ArrowRight, Play, X, Sparkles, Flame, Check } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import MartialButton from './MartialButton';
import { safeSessionStorage } from '../utils/storage';

interface HeroProps {
  onNavigate: (view: string) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
  const PRIMARY_HERO_VIDEO = "https://res.cloudinary.com/dlzdagymx/video/upload/v1786454954/0810_sfhphm.mp4";
  const [videoMounted, setVideoMounted] = useState(true);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string>(PRIMARY_HERO_VIDEO);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedVideoIdx, setSelectedVideoIdx] = useState(0);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  // Multi-type Video Drills and reviews recorded for parents
  const DRILL_VIDEOS = [
    {
      id: 'parent-reviews',
      title: 'What Real Parents Say',
      desc: 'Hear directly from Pune parents about how our Karate program builds real focus, robust health, and active confidence at Lions Karate Club Pune.',
      url: 'https://res.cloudinary.com/dlzdagymx/video/upload/v1781347453/Check_out_the_full_video_to_see_what_parents_think_of_our_program_At_LIONS_KARATE_CLUB_PUNE_l5vhas.mp4',
      watermark: 'PARENT FEEDBACK',
      benefits: [
        { label: "👨‍👩‍👦 Better Focus at Home", desc: "Parents notice kids start listening without needing to repeat tasks." },
        { label: "🎒 Academic Discipline", desc: "Improved seating tolerance and focus carry-over to school homework." },
        { label: "🥋 Overwhelming Love", desc: "Children love the trainers, making them excited to attend class six days a week." }
      ]
    },
    {
      id: 'combat-reflexes',
      title: 'Combat Agile Reaction Drill',
      desc: 'High energy active preparation drills. Children build sharp agility, timing, and brave confidence to defend their boundaries.',
      url: 'https://res.cloudinary.com/dlzdagymx/video/upload/v1781346883/Untitled_-_June_11_2026_at_22.20.41_qrs7vz.mp4',
      watermark: 'LIONS DOJO AGILITY',
      benefits: [
        { label: "⚡ Fast Alertness", desc: "Sharpen child reaction times to instantly dodge or block surprises." },
        { label: "🔥 Active Energy", desc: "Power cardio workout that channels hyper-active energy safely." },
        { label: "💪 Self-Esteem Booster", desc: "Builds supreme courage to stand tall and look people in the eyes." }
      ]
    }
  ];

  const currentDrill = DRILL_VIDEOS[selectedVideoIdx] || DRILL_VIDEOS[0];

  // Adjust video speed dynamically & restart play on video index switch
  useEffect(() => {
    if (modalVideoRef.current) {
      modalVideoRef.current.playbackRate = playbackSpeed;
      modalVideoRef.current.load();
      modalVideoRef.current.play().catch(err => console.log("Auto-play trigger:", err));
    }
  }, [playbackSpeed, isModalOpen, selectedVideoIdx]);

  useEffect(() => {
    // Listen to real-time hero video custom URL updates
    const unsub = onSnapshot(doc(db, 'settings', 'video'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.heroVideoUrl) {
          setHeroVideoUrl(data.heroVideoUrl);
        }
      }
    }, (err) => {
      console.error("Firestore loading error on background setting: ", err);
    });

    // Lazy load the video for optimal fast initial page compilation and layout paint
    const timer = setTimeout(() => {
      setVideoMounted(true);
    }, 100);

    // Show floating card for parents after a tiny delay
    const toastTimer = setTimeout(() => {
      const alreadySeen = safeSessionStorage.getItem('seenTodayKataVideo');
      if (!alreadySeen) {
        setShowToast(true);
      }
    }, 1800);

    return () => {
      unsub();
      clearTimeout(timer);
      clearTimeout(toastTimer);
    };
  }, []);

  const openVideoModal = () => {
    setIsModalOpen(true);
    setShowToast(false);
    safeSessionStorage.setItem('seenTodayKataVideo', 'true');
  };

  const closeVideoModal = () => {
    setIsModalOpen(false);
  };

  return (
    <section id="hero" className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-slate-950 pt-20">
      {/* Background Video with modern aspect ratio scaling and cropping prevention */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        {/* Layered dark gradients to maximize typography contrast and readability on all screen sizes */}
        <div className="absolute inset-0 bg-slate-950/45 sm:bg-slate-950/35 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 via-transparent to-slate-950/20 z-10" />
        
        {videoMounted && (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            webkit-playsinline="true"
            key={PRIMARY_HERO_VIDEO}
            className="w-full h-full object-cover object-center absolute inset-0 transition-opacity duration-700 opacity-85"
          >
            {/* Primary Cloudinary Video requested by user */}
            <source src={PRIMARY_HERO_VIDEO} type="video/mp4" />
            {heroVideoUrl && heroVideoUrl !== PRIMARY_HERO_VIDEO && (
              <source src={heroVideoUrl} type="video/mp4" />
            )}
            <source src="/hero.mp4" type="video/mp4" />
          </video>
        )}
      </div>

      {/* Decorative Traditional Calligraphy Pattern Overlay */}
      <div className="absolute top-1/4 right-10 z-10 opacity-10 hidden lg:block select-none pointer-events-none text-right">
        <div className="font-kanji text-[15rem] leading-none text-yellow-500/20 font-black tracking-widest writing-vertical">
          空手
        </div>
        <div className="text-zinc-500 text-sm tracking-[0.2em] font-sans uppercase font-semibold mt-2 mr-6">
          "Empty Hand" Shotokan Way
        </div>
      </div>

      {/* Content Container */}
      {/* Content Container - Beautiful Dual Column Layout representing a high-conversion masterpiece */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT COLUMN: Hero copy, badges, high conversion CTA (7 Columns) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Top Traditional Accent Badge */}
            <div className="inline-flex items-center space-x-3 bg-red-950/45 border border-red-500/20 px-4 py-1.5 rounded-full">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-red-400 uppercase tracking-[0.2em] text-[10px] font-black font-heading">
                Lions Karate Club Pune · Nobu Tradition
              </span>
            </div>

            {/* Immersive display headers */}
            <div className="space-y-4">
              <h1 className="font-heading text-4xl sm:text-6xl xl:text-[72px] font-black uppercase text-white tracking-tighter leading-[0.95] select-none">
                BECOME STRONG. <br className="hidden sm:block" />
                <span className="text-red-500 font-kanji text-transparent pr-1" style={{ WebkitTextStroke: '1.5px #FF2A35', color: 'transparent' }}>STAY DISCIPLINED.</span> <br />
                TRAIN LIKE A CHAMPION.
              </h1>
              
              <div className="flex items-center space-x-2 text-red-500">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-sm">⭐</span>
                  ))}
                </div>
                <span className="text-xs sm:text-sm font-heading font-extrabold tracking-wider text-red-500">
                  5.0 Rated by 250+ Parents in Pune
                </span>
              </div>
            </div>

            {/* Structured Subtitle with parent benefit drivers */}
            <p className="text-zinc-200 text-sm sm:text-base md:text-lg font-body font-medium tracking-wide leading-relaxed max-w-2xl">
              Professional Karate, Kick-Boxing &amp; Self-Defense training for Kids, Teens &amp; Adults in Pune.
              <span className="text-red-500 font-bold block sm:inline sm:ml-1"> Help your child build steel-clad resilience, focus &amp; real self-protection.</span>
            </p>

            {/* Trust Badges Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="flex items-center space-x-2 bg-slate-900/80 border border-zinc-800 px-3 py-2 rounded-xl text-xs text-zinc-200 font-bold">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Parent Trusted</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-900/80 border border-zinc-800 px-3 py-2 rounded-xl text-xs text-zinc-200 font-bold">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Certified Coaches</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-900/80 border border-zinc-800 px-3 py-2 rounded-xl text-xs text-zinc-200 font-bold">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Belt Examination</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-900/80 border border-zinc-800 px-3 py-2 rounded-xl text-xs text-zinc-200 font-bold">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Student ID Card</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-900/80 border border-zinc-800 px-3 py-2 rounded-xl text-xs text-zinc-200 font-bold">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>National Players</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-900/80 border border-zinc-800 px-3 py-2 rounded-xl text-xs text-zinc-200 font-bold">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Est. 2023 Pune</span>
              </div>
            </div>

            {/* Association & Affiliation Mini-Row */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center space-x-2 bg-slate-900/60 border border-zinc-850 px-3 py-1.5 rounded-xl">
                <img 
                  src="https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781585561/aa604cmh1_tfa8an.webp" 
                  alt="Traditional Shotokan" 
                  className="w-6 h-6 object-contain rounded bg-white p-0.5"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-zinc-350">Shotokan Style</span>
              </div>

              <div className="flex items-center space-x-2 bg-slate-900/60 border border-zinc-850 px-3 py-1.5 rounded-xl">
                <img 
                  src="https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781585561/maxresdefault_mrjbrt.jpg" 
                  alt="WKF" 
                  className="w-6 h-6 object-cover rounded bg-slate-950"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-zinc-350">WKF</span>
              </div>

              <div className="flex items-center space-x-2 bg-slate-900/60 border border-zinc-850 px-3 py-1.5 rounded-xl">
                <img 
                  src="https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1783013655/images_hs6ysx.jpg" 
                  alt="KAI National" 
                  className="w-6 h-6 object-contain rounded bg-white p-0.5"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-zinc-350">KAI National</span>
              </div>

              <div className="flex items-center space-x-2 bg-slate-900/60 border border-zinc-850 px-3 py-1.5 rounded-xl">
                <img 
                  src="https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781585562/logo_new_t7ctxo.jpg" 
                  alt="Lions Karate Registered" 
                  className="w-6 h-6 object-contain rounded bg-white p-0.5"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-zinc-350">National Shibu</span>
              </div>
            </div>

            {/* CTA action cluster designed for direct rapid conversion */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <MartialButton
                id="btn-claim-trials"
                onClick={() => onNavigate('admission')}
                type="primary"
                className="group shadow-lg shadow-red-600/20"
              >
                <span>ENROLL NOW / अभी जुड़ें</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </MartialButton>
              
              <MartialButton
                id="btn-student-drills"
                onClick={openVideoModal}
                type="secondary"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>STUDENT DRILLS</span>
                <span className="text-[8px] bg-red-600 text-white font-mono px-1.5 py-0.5 rounded font-black tracking-normal">LIVE</span>
              </MartialButton>

              <MartialButton
                id="btn-explore-batches"
                onClick={() => {
                  const element = document.getElementById('batches');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.location.hash = 'batches';
                  }
                }}
                type="accent"
              >
                <span>EXPLORE BATCHES</span>
              </MartialButton>
            </div>

            {/* Instant Trust Guarantee notice list */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-sans text-zinc-400 pt-2">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                No membership fee required to try first
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Safe, protective, age-specific gear
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Flexible days reschedule option
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive parent interactive drill selector + live video spotlight card (5 Columns) */}
          <div className="lg:col-span-5 bg-[#111010]/95 border border-zinc-800/80 p-6 rounded-2xl shadow-2xl relative overflow-hidden group">
            {/* Spinning decorative orbit water rings embedded under video box */}
            <div className="absolute -right-16 -bottom-16 w-48 h-48 border border-white/5 rounded-full pointer-events-none" />
            
            {/* Tab selector above direct interactive video drill highlights */}
            <div className="mb-4">
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono block mb-2.5">
                SELECT A MODULE TO PREVIEW TRAINING INSTANTLY:
              </span>
              <div className="grid grid-cols-3 gap-1 bg-[#0a0808]/75 p-1 rounded-xl border border-zinc-850">
                {DRILL_VIDEOS.map((vid, idx) => (
                  <button
                    key={vid.id}
                    onClick={() => setSelectedVideoIdx(idx)}
                    className={`py-2 px-1 text-[10px] rounded-lg font-heading tracking-wider font-bold uppercase transition-all whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
                      selectedVideoIdx === idx
                        ? 'bg-yellow-500 text-slate-950 font-black shadow-lg'
                        : 'text-zinc-450 hover:text-zinc-200'
                    }`}
                  >
                    {idx === 0 ? '🎥 Parent Speak' : idx === 1 ? '🥋 Kata Drill' : '⚡ Agility'}
                  </button>
                ))}
              </div>
            </div>

            {/* Spotlight Video viewport */}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-black shadow-inner">
              {/* Corner tech target lines and status label */}
              <div className="absolute top-2 left-2 z-10 w-2.5 h-2.5 border-t border-l border-yellow-500/50 pointer-events-none" />
              <div className="absolute top-2 right-2 z-10 w-2.5 h-2.5 border-t border-r border-yellow-500/50 pointer-events-none" />
              <div className="absolute bottom-2 left-2 z-10 w-2.5 h-2.5 border-b border-l border-yellow-500/50 pointer-events-none" />
              <div className="absolute bottom-2 right-2 z-10 w-2.5 h-2.5 border-b border-r border-yellow-500/50 pointer-events-none" />
              
              <div className="absolute top-3 left-3 z-10 bg-slate-950/80 backdrop-blur border border-zinc-800 rounded px-2 py-0.5 text-[9px] font-mono tracking-wider text-yellow-500 uppercase flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                {currentDrill.watermark}
              </div>

              {/* Autoplaying muted contextual video loop according to user parameters */}
              <video
                key={currentDrill.id}
                src={currentDrill.url}
                autoPlay
                muted
                loop
                playsInline
                webkit-playsinline="true"
                className="w-full h-full object-cover object-center filter contrast-105"
              />

              {/* Theater View Trigger Center Button */}
              <div className="absolute inset-0 bg-black/15 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <button
                  onClick={openVideoModal}
                  className="bg-[#9B1B20] hover:bg-red-500 hover:scale-110 active:scale-95 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg shadow-black/60 cursor-pointer"
                  title="Expand to Theater Mode"
                >
                  <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                </button>
              </div>
            </div>

            {/* Selected segment explanations and interactive bullet benefit factors */}
            <div className="mt-4 space-y-3.5">
              <div>
                <h4 className="font-heading text-sm text-[#F0E6D3] font-extrabold uppercase leading-tight tracking-wider">
                  {currentDrill.title}
                </h4>
                <p className="text-zinc-400 text-xs mt-1 leading-relaxed font-body">
                  {currentDrill.desc}
                </p>
              </div>

              {/* Staggered lists of exact benefits to prompt enrollment */}
              <div className="bg-[#0a0808]/45 border border-zinc-900/80 p-3 rounded-xl space-y-2">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#8a7040] block font-bold leading-none mb-1">
                  How this translates into child discipline:
                </span>
                {currentDrill.benefits.map((ben, bIdx) => (
                  <div key={bIdx} className="text-[11px] leading-relaxed flex items-start space-x-2.5">
                    <span className="text-xs flex-shrink-0 mt-0.5">🎯</span>
                    <div>
                      <strong className="text-zinc-200">{ben.label}:</strong>{' '}
                      <span className="text-zinc-450">{ben.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick interactive enroll trigger */}
              <button
                onClick={openVideoModal}
                className="text-xs text-yellow-500 hover:text-yellow-400 font-bold tracking-wider uppercase inline-flex items-center gap-1.5 cursor-pointer mt-1 font-heading"
              >
                <span>OPEN CINEMATIC REVIEWS THEATER</span>
                <span>→</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Trust booster badge count banner underneath */}
      <div className="relative w-full bg-slate-950/95 border-t border-zinc-900/80 z-25 py-8 sm:py-10 mt-auto">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            <div>
              <div className="font-heading text-lg sm:text-2xl font-black text-red-500">5 YEARS</div>
              <div className="text-[10px] font-sans text-zinc-500 uppercase tracking-widest leading-none mt-1">DOJO FLAGSHIP LINEAGE</div>
            </div>
            <div>
              <div className="font-heading text-lg sm:text-2xl font-black text-red-500">100% SAFE</div>
              <div className="text-[10px] font-sans text-zinc-500 uppercase tracking-widest leading-none mt-1">CERTIFIED KIDS TRAINING</div>
            </div>
            <div>
              <div className="font-heading text-lg sm:text-2xl font-black text-red-500">1000+ KIDS</div>
              <div className="text-[10px] font-sans text-zinc-500 uppercase tracking-widest leading-none mt-1">TRAINED IN PUNE AREA</div>
            </div>
            <div>
              <div className="font-heading text-lg sm:text-2xl font-black text-white">6 DAYS / WK</div>
              <div className="text-[10px] font-sans text-zinc-500 uppercase tracking-widest leading-none mt-1">FLEXIBLE RESCHEDULINGS</div>
            </div>
          </div>
        </div>
      </div>


      {/* Parent's Welcome Toast - Floating mini player invite card */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border border-red-500/30 p-4 rounded-xl shadow-2xl backdrop-blur-md"
            id="parent-welcome-video-toast"
          >
            <button
              onClick={() => setShowToast(false)}
              className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-200 cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex gap-3">
              {/* Spinning or pulsing video camera circle */}
              <div 
                onClick={openVideoModal}
                className="w-16 h-16 rounded-xl bg-zinc-950 border border-zinc-800 flex-shrink-0 flex items-center justify-center relative cursor-pointer group overflow-hidden"
              >
                <div className="absolute inset-0 bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors" />
                <Play className="w-5 h-5 text-yellow-500 fill-yellow-500/20 group-hover:scale-110 transition-transform" />
                <span className="absolute bottom-1 right-1 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                </span>
              </div>
              <div>
                <span className="text-[9px] font-mono uppercase bg-red-600 text-white font-bold px-2 py-0.5 rounded tracking-wide inline-block mb-1">
                  🔴 LIVE TODAY
                </span>
                <h4 className="text-xs font-bold text-white leading-tight uppercase font-heading">
                  Recorded Today: Real Kata Drill!
                </h4>
                <p className="text-zinc-400 text-[11px] mt-1 leading-normal font-sans">
                  See how we train simple discipline and active protection. Perfect for parents to watch!
                </p>
                <button
                  onClick={openVideoModal}
                  className="text-xs text-yellow-500 hover:text-yellow-400 font-bold mt-2 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Quick Play Video</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic High-Fidelity Video Trailer Theater Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/98 z-50 flex items-center justify-center p-4 backdrop-blur-xl"
            id="today-kata-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-zinc-950 border border-yellow-500/40 rounded-3xl overflow-hidden w-full max-w-5xl shadow-[0_0_60px_rgba(234,179,8,0.25)] relative flex flex-col md:flex-row max-h-[95vh] md:max-h-[85vh]"
            >
              {/* Absolute Close Pin */}
              <button
                onClick={closeVideoModal}
                className="absolute top-4 right-4 z-30 text-white bg-red-600 hover:bg-red-500 border border-red-500 p-2 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg"
                title="Close Theater"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Video Showcase Frame - Stylized Cinematic Viewport */}
              <div className="w-full md:w-[62%] bg-black relative flex flex-col justify-center min-h-[260px] md:min-h-0 overflow-hidden group">
                {/* Cinema Light Beam Effect (Atmospheric Background Glow behind video) */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.1)_0%,transparent_70%)] pointer-events-none" />
                
                {/* Cinematic Corner Target Brackets (Makes it look like a high-tech/premium recording viewport) */}
                <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-yellow-500/65 pointer-events-none z-10" />
                <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-yellow-500/65 pointer-events-none z-10" />
                <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-yellow-500/65 pointer-events-none z-10" />
                <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-yellow-500/65 pointer-events-none z-10" />

                {/* Top Overlay Bar: Film Specs */}
                <div className="absolute top-4 left-10 right-10 flex justify-between items-center z-10 pointer-events-none">
                  {/* Watermark / Source */}
                  <div className="bg-slate-950/85 backdrop-blur-md border border-zinc-800/80 px-2.5 py-1 rounded-md text-[9px] text-yellow-400 font-mono tracking-widest uppercase flex items-center gap-1.5 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span>TRAILER: {currentDrill.watermark}</span>
                  </div>
                  {/* Resolution Spec */}
                  <div className="hidden sm:block bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] text-zinc-500 font-mono tracking-wider border border-zinc-900">
                    4K HDR - 60 FPS
                  </div>
                </div>

                {/* Main Video Component with enhanced sizing */}
                <div className="w-full h-full flex items-center justify-center p-2">
                  <video
                    ref={modalVideoRef}
                    src={currentDrill.url}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain max-h-[40vh] md:max-h-[75vh]"
                  />
                </div>

                {/* Bottom Cinematic Gradient & Control Guide Hint */}
                <div className="absolute bottom-4 left-10 right-10 flex justify-between items-center z-10 pointer-events-none">
                  <div className="bg-zinc-950/90 backdrop-blur-sm border border-zinc-800/60 px-2.5 py-1 rounded text-[9px] text-zinc-400 font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-500 animate-spin" />
                    <span>LIONS PREMIUM SELECTION</span>
                  </div>
                  <div className="bg-zinc-950/90 backdrop-blur-sm px-2.5 py-1 rounded text-[9px] text-zinc-400 font-mono">
                    VOL: AUTO
                  </div>
                </div>
              </div>

              {/* Parents' Easy Info Sidebar - Redesigned like an Executive Premier Ticket info pane */}
              <div className="w-full md:w-[38%] p-6 flex flex-col bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-800 overflow-y-auto">
                
                {/* Teaser Selection Box */}
                <div className="mb-5 bg-black border border-zinc-800/80 p-4 rounded-2xl shadow-inner shadow-black">
                  <span className="text-[10px] uppercase font-black text-yellow-500 tracking-widest font-mono block mb-3 text-center">
                    🎬 CHOOSE YOUR TRAILER / EXPERIENCE:
                  </span>
                  <div className="flex flex-col gap-2.5">
                    {DRILL_VIDEOS.map((drill, idx) => {
                      const isActive = selectedVideoIdx === idx;
                      let badge = "PREVIEW";
                      let styleColor = "text-yellow-500";
                      let icon = "🥋";
                      
                      if (drill.id === 'parent-reviews') {
                        badge = "HIGHLY RECOMMENDED FOR PARENTS";
                        styleColor = "text-[#FF3B3F]";
                        icon = "🗣️";
                      } else if (drill.id === 'kata-perfection') {
                        badge = "TEASER #1 — discipline";
                        styleColor = "text-yellow-500";
                        icon = "🥋";
                      } else if (drill.id === 'combat-reflexes') {
                        badge = "TEASER #2 — reaction";
                        styleColor = "text-emerald-500";
                        icon = "⚡";
                      }
                      
                      return (
                        <button
                          key={drill.id}
                          type="button"
                          onClick={() => {
                            setSelectedVideoIdx(idx);
                            setPlaybackSpeed(1); // Reset rate on change
                          }}
                          className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                            isActive
                              ? `bg-zinc-900 border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.15)] scale-[1.01]`
                              : 'bg-zinc-950/60 border-zinc-900 text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'
                          }`}
                        >
                          {/* Left high-energy active colored strip indicator */}
                          {isActive && (
                            <div className="absolute top-0 bottom-0 left-0 w-1 bg-yellow-500" />
                          )}

                          <div className="flex items-start gap-2.5 pl-1.5">
                            <span className="text-lg shrink-0 mt-0.5">{icon}</span>
                            <div className="flex-1">
                              <span className={`text-[8px] font-mono uppercase font-black tracking-widest ${styleColor} block mb-0.5`}>
                                {badge}
                              </span>
                              <h4 className={`text-xs uppercase font-heading tracking-wide ${isActive ? 'text-white font-black' : 'text-zinc-400 font-medium'}`}>
                                {drill.title}
                              </h4>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Middle trailer overview badge */}
                <div className="mb-4">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-[9px] font-mono text-yellow-500 uppercase tracking-widest mb-1.5">
                    <Flame className="w-3 h-3 text-[#FF3B3F] animate-pulse" />
                    <span>LIONS CLUB CORE DRILLS</span>
                  </div>
                  <h3 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-white uppercase leading-snug">
                    {currentDrill.title}
                  </h3>
                  <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-sans">
                    {currentDrill.desc}
                  </p>
                </div>

                {/* Parent's Interactive Pitch: Video Speed Controller */}
                <div className="bg-black/40 border border-zinc-800/80 p-3.5 rounded-xl mb-5">
                  <span className="text-[10px] uppercase text-zinc-400 font-bold block mb-2 font-mono flex items-center justify-between">
                    <span>🥋 SLOW MOTION ANALYSIS:</span>
                    <span className="text-yellow-500 font-mono font-black">{playbackSpeed}x SPEED</span>
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { rate: 0.5, label: "0.5x (Slow-Mo)" },
                      { rate: 1.0, label: "1.0x (Normal Video)" },
                      { rate: 1.5, label: "1.5x (Fast action)" }
                    ].map((opt) => (
                      <button
                        key={opt.rate}
                        type="button"
                        onClick={() => setPlaybackSpeed(opt.rate)}
                        className={`py-2 px-1 rounded-lg text-[9px] font-bold text-center block transition-all duration-150 cursor-pointer ${
                          playbackSpeed === opt.rate
                            ? 'bg-yellow-500 text-slate-950 shadow font-black scale-[1.02]'
                            : 'bg-zinc-950 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900 border border-zinc-900/60'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Everyday Life Benefits checklist */}
                <div className="space-y-3.5 mb-5 flex-grow">
                  <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 tracking-wider block">
                    TRAINER NOTE &amp; REAL IMPACT ON KIDS:
                  </span>
                  <ul className="space-y-3">
                    {currentDrill.benefits.map((b, idx) => (
                      <li key={idx} className="flex gap-2.5 text-xs bg-zinc-950/20 p-2 rounded-lg border border-zinc-900/40">
                        <span className="text-yellow-500/80 text-xs mt-0.5 shrink-0">✔</span>
                        <div>
                          <strong className="text-yellow-400 block font-heading text-xs uppercase tracking-wide">{b.label}</strong>
                          <span className="text-zinc-400 text-[11px] leading-tight block">{b.desc}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Close & Action Call to register */}
                <div className="pt-4 border-t border-zinc-800 space-y-2 mt-auto">
                  <button
                    onClick={() => {
                      closeVideoModal();
                      onNavigate('admission');
                    }}
                    className="w-full text-center font-heading font-extrabold text-slate-950 bg-yellow-500 hover:bg-yellow-400 py-3.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-yellow-500/10 cursor-pointer block animate-pulse hover:animate-none"
                  >
                    Register and Claim Free 6-Day Trial
                  </button>
                  <p className="text-[9px] text-zinc-500 text-center font-sans tracking-tight">
                     *Registration closes soon for the upcoming batch in Pune.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
