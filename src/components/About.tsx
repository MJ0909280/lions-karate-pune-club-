import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ShieldAlert, Volume2, VolumeX, RefreshCw, MapPin, Globe, Sparkles } from 'lucide-react';

export default function About() {
  const [aboutVideoUrl, setAboutVideoUrl] = useState<string>('');
  const [kataVideoUrl, setKataVideoUrl] = useState<string>('');
  const [kataVideoUrl2, setKataVideoUrl2] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Synchronize video configuration in real-time from Firestore setting doc
    const unsub = onSnapshot(doc(db, 'settings', 'video'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.aboutVideoUrl) {
          setAboutVideoUrl(data.aboutVideoUrl);
        }
        if (data.kataVideoUrl) {
          setKataVideoUrl(data.kataVideoUrl);
        }
        if (data.kataVideoUrl2) {
          setKataVideoUrl2(data.kataVideoUrl2);
        }
      }
    }, (err) => {
      console.error("Firestore loading error on site settings: ", err);
    });
    return () => unsub();
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const virtues = [
    { title: "🥋 Respect", desc: "Build mutual respect, honor, and deep integrity inside and outside the dojo." },
    { title: "💪 Strength", desc: "Develop physical power, muscle conditioning, stamina, and mental willpower." },
    { title: "🛡️ Self-Defense", desc: "Master elite defensive tactics, fast reflex triggers, and real-world safety protection." },
    { title: "🏆 Excellence", desc: "Strive for perfection of character, competitive podium achievements, and personal growth." },
  ];

  return (
    <div className="relative overflow-hidden py-4">
      {/* Decorative vertical background kanji with heritage red watermark */}
      <div className="absolute top-10 left-10 opacity-[0.08] hidden xl:block select-none pointer-events-none text-left">
        <div className="font-kanji text-[10rem] leading-none text-[#FF2A35] font-black tracking-widest writing-vertical">
          禅心
        </div>
      </div>

      <div className="w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* LEFT: Video & Rotating Orbits Column - 6 Columns wrapped in a premium charcoal black compartment */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[500px] p-6 sm:p-10 rounded-2xl bg-[#0E0E10] border border-zinc-900 select-none overflow-hidden shadow-2xl">
            {/* Spotlight background inside charcoal backplate */}
            <div className="absolute inset-0 bg-radial-gradient from-zinc-900/30 via-transparent to-transparent pointer-events-none" />
            
            {/* Spinning Golden Orbits Background inside dark charcoal backplate */}
            <div className="absolute w-[440px] h-[440px] border border-dashed border-[#FF2A35]/12 rounded-full animate-[spin_60s_linear_infinite] pointer-events-none" />
            <div className="absolute w-[360px] h-[360px] border border-dashed border-[#FF2A35]/12 rounded-full animate-[spin_40s_linear_infinite_reverse] pointer-events-none" />
            
            <div className="absolute w-[280px] h-[280px] border border-[#FF2A35]/20 rounded-full flex items-center justify-center animate-[spin_25s_linear_infinite] pointer-events-none">
              <div className="absolute -top-1.5 left-1/2 w-3 h-3 rounded-full bg-[#FF2A35]/30" />
              <div className="absolute -bottom-1.5 left-1/2 w-3 h-3 rounded-full bg-[#FF2A35]/35" />
            </div>

            {/* Core Video Player Container */}
            <div className="relative overflow-hidden rounded-xl border-4 border-zinc-900 bg-black h-[440px] w-full max-w-sm shadow-[0_12px_40px_rgba(0,0,0,0.65)] z-10 group">
              <video
                ref={videoRef}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                key={aboutVideoUrl} // Re-bind node on link adjustments
                className="w-full h-full object-cover object-center filter contrast-[1.05] transition-scale duration-1000 group-hover:scale-103"
              >
                {aboutVideoUrl && <source src={aboutVideoUrl} type="video/mp4" />}
                {/* Primary cloud hosted direct video source supplied by user */}
                <source src="https://res.cloudinary.com/dlzdagymx/video/upload/q_auto/f_auto/v1781891366/WhatsApp_Video_2026-06-19_at_9.51.10_PM_pog0dc.mp4" type="video/mp4" />
                {/* Fallback to standard local pathways if uploaded to the public directory */}
                <source src="/about_video.mp4" type="video/mp4" />
                <source src="/about-video.mp4" type="video/mp4" />
                <source src="/uploaded_video.mp4" type="video/mp4" />
                <source src="/hero.mp4" type="video/mp4" />
                <source src="/video.mp4" type="video/mp4" />
                
                {/* Premium high-quality physical practice training loop fallback */}
                <source src="https://assets.mixkit.co/videos/preview/mixkit-karate-fighter-in-slow-motion-40342-large.mp4" type="video/mp4" />
                <source src="https://assets.mixkit.co/videos/preview/mixkit-woman-practicing-martial-arts-moves-in-the-sunset-40341-large.mp4" type="video/mp4" />
              </video>

              {/* Mute and audio controls overlay */}
              <div className="absolute top-4 right-4 z-20 flex space-x-2">
                <button
                  onClick={toggleMute}
                  className="bg-stone-950/90 hover:bg-stone-900 border border-stone-800 text-stone-300 hover:text-white px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase flex items-center space-x-2 transition shadow-lg backdrop-blur-sm cursor-pointer"
                  title={isMuted ? "Unmute sound" : "Mute sound"}
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-[10px] tracking-wider font-heading">Sound Off</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span className="text-[10px] tracking-wider font-heading text-emerald-400">Sound On</span>
                    </>
                  )}
                </button>
              </div>

              {/* Informative Label Overlay with Dojo Kun - High contrast floating dark paper card */}
              <div className="absolute bottom-5 left-5 right-5 bg-slate-950/95 backdrop-blur-md p-5 rounded-xl border border-zinc-900 z-20 shadow-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-kanji text-red-500 text-sm font-black">道場訓</span>
                  <span className="font-heading text-red-400 text-[10px] uppercase font-bold tracking-wider">— Dojo Kun (Oath)</span>
                </div>
                <p className="text-zinc-300 text-[11px] italic font-body leading-relaxed">
                  "Perfect your character. Train with absolute focus, sincere effort, and respect for all."
                </p>
              </div>
            </div>

            {/* Centered Kanji water banner behind the card - Adjusted positioning to ensure complete visibility */}
            <div className="absolute bottom-4 right-6 z-0 font-kanji text-7xl font-bold text-[#FF2A35]/12 select-none pointer-events-none">
              道場精神
            </div>
          </div>

          {/* RIGHT: Texts & Virtues Column - 6 Columns */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2">
              <div className="h-[1.5px] w-8 bg-[#FF2A35]"></div>
              <span className="text-[#FF2A35] font-heading font-extrabold text-xs uppercase tracking-[0.3em]">Our Heritage</span>
              <div className="h-[1.5px] w-8 bg-[#FF2A35]"></div>
            </div>

            <h2 className="font-heading text-4xl sm:text-6xl font-black text-white uppercase tracking-tighter leading-none">
              THE WAY OF A <br />
              <span className="text-[#FF2A35] font-kanji font-black">CHAMPION</span>
            </h2>

            <p className="text-[#FF2A35]/90 font-extrabold text-xs sm:text-sm tracking-wider uppercase font-heading">
              Every belt earned. Every challenge conquered. Every lesson learned.
            </p>

            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-body font-light">
              At LIONS KARATE CLUB PUNE, we blend the rigorous alignment of lineage Shotokan karate with modern fitness science. Students develop the robust posture, physical protection triggers, and mind discipline needed to conquer every obstacle, on and off the mat.
            </p>

            {/* Virtues List Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {virtues.map((v, i) => (
                <div key={i} className="flex flex-col bg-[#0E0E10] border border-zinc-900 p-5 rounded-xl shadow-2xl hover:border-[#FF2A35]/40 hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-center space-x-2 text-[#FF2A35] mb-2">
                    <span className="text-sm select-none">{v.title.split(' ')[0]}</span>
                    <h4 className="font-heading font-black text-white text-xs uppercase tracking-widest">{v.title.split(' ').slice(1).join(' ')}</h4>
                  </div>
                  <p className="text-zinc-400 text-[11.5px] font-normal leading-relaxed font-body">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* --- STUDENT KATA SHOWCASE --- */}
        <div id="kata-showcase" className="mt-20 pt-16 border-t border-zinc-900">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Description */}
            <div className="lg:col-span-5 space-y-5">
              <div className="inline-flex items-center gap-2">
                <div className="h-[1.5px] w-8 bg-yellow-500"></div>
                <span className="text-yellow-500 font-heading font-extrabold text-xs uppercase tracking-[0.2em]">Practice Excellence</span>
              </div>
              <h3 className="font-heading text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                STUDENT KATA <br />
                <span className="text-yellow-500 font-kanji font-black">SHOWCASE</span>
              </h3>
              <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-body font-light">
                Watch our dedicated young karatekas perfect their stances, speed, and precision through continuous, repetitive Kata drills. This dual showcase displays both individual technique mastery and synchronized class-wide group coordination in real time.
              </p>
            </div>

            {/* Right Column: Video Container */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="grid grid-cols-2 gap-4 w-full max-w-[480px]">
                
                {/* Video 1: Individual */}
                <div className="relative w-full aspect-[9/16] rounded-xl border-4 border-zinc-900 bg-black overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.65)] group">
                  <video
                    key={kataVideoUrl || "v1"}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover object-center filter brightness-105 contrast-[1.03] transition-all duration-1000 group-hover:scale-102"
                    src={kataVideoUrl || "https://res.cloudinary.com/dlzdagymx/video/upload/v1784001539/WhatsApp_Video_2026-07-14_at_9.23.13_AM_sve0ia.mp4"}
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded border border-yellow-500/30 text-yellow-500 font-heading text-[8px] uppercase tracking-widest font-bold">
                    • INDIVIDUAL DRILL
                  </div>
                </div>

                {/* Video 2: Group */}
                <div className="relative w-full aspect-[9/16] rounded-xl border-4 border-zinc-900 bg-black overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.65)] group">
                  <video
                    key={kataVideoUrl2 || "v2"}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover object-center filter brightness-105 contrast-[1.03] transition-all duration-1000 group-hover:scale-102"
                    src={kataVideoUrl2 || "https://res.cloudinary.com/dlzdagymx/video/upload/v1783699434/Kata_hcvwxf.mp4"}
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded border border-yellow-500/30 text-yellow-500 font-heading text-[8px] uppercase tracking-widest font-bold">
                    • GROUP SHOWCASE
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* --- PUNE REGIONAL COVERAGE & FLEXIBLE ONLINE CLASSES --- */}
        <div className="mt-20 pt-16 border-t border-zinc-900">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[#FF2A35] font-heading text-xs font-bold uppercase tracking-[0.2em] block mb-2">PUNE SOUTH-EAST-WEST COVERAGE</span>
            <h3 className="font-heading text-2xl sm:text-4xl font-extrabold text-white uppercase tracking-tight">
              PUNE'S CHOSEN ACADEMY FOR MARTIAL ARTS, KICKBOXING & KARATE
            </h3>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl mx-auto mt-3 leading-relaxed font-body">
              Whether you are looking for physical strength conditioning, traditional belt progression, or robust self-defense safeguards, LIONS KARATE CLUB PUNE covers all fields both offline at our physical hubs and on our live digital training network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Box 1: Multi-Discipline Sports */}
            <div className="bg-[#0B0B0C] border border-zinc-950 p-6 rounded-2xl hover:border-[#FF2A35]/20 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF2A35]/5 rounded-full blur-xl group-hover:bg-[#FF2A35]/10 transition-all pointer-events-none" />
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-[#FF2A35]" />
                <h4 className="font-heading text-white text-base font-black uppercase tracking-tight">
                  VERSATILE combat sports
                </h4>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed font-body mb-4">
                We are much more than a standard Karate dojo. Our comprehensive curriculum combines competitive <strong>Shotokan Karate (Kata & Kumite)</strong>, action‑packed <strong>Kickboxing speed drills</strong>, and practical <strong>Self-Defense tactics</strong> tailored for women, children, and adults.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-900/40">
                <span className="text-[10px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded font-mono">Karate</span>
                <span className="text-[10px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded font-mono">Kickboxing</span>
                <span className="text-[10px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded font-mono">Self Defence</span>
              </div>
            </div>

            {/* Box 2: Pune Regions Serviced */}
            <div className="bg-[#0B0B0C] border border-zinc-950 p-6 rounded-2xl hover:border-[#FF2A35]/20 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-xl group-hover:bg-yellow-500/10 transition-all pointer-events-none" />
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-yellow-500" />
                <h4 className="font-heading text-white text-base font-black uppercase tracking-tight">
                  Active across pune
                </h4>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed font-body mb-4">
                Our active cluster networks ensure quality training is reachable for students near <strong>Katraj, Narhe, Duttanagar, Jambhulwadi, Hadapsar, Kothrud, Baner, Hinjewadi, Wakad, Kharadi, Viman Nagar, and Camp</strong>. We have parents and working professionals travelling from all of these local borders.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-900/40">
                <span className="text-[10px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded font-mono">Katraj</span>
                <span className="text-[10px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded font-mono">Narhe</span>
                <span className="text-[10px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded font-mono">Hadapsar</span>
                <span className="text-[10px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded font-mono">Kothrud</span>
              </div>
            </div>

            {/* Box 3: Live Flexible Online Classes */}
            <div className="bg-[#0B0B0C] border border-zinc-950 p-6 rounded-2xl hover:border-[#FF2A35]/20 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-5 h-5 text-emerald-400" />
                <h4 className="font-heading text-white text-base font-black uppercase tracking-tight">
                  FLEXIBLE ONLINE CLASSES
                </h4>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed font-body mb-4">
                Can't reach our offline centers? We prove elite, highly interactive <strong>Online Classes with Flexible Timings</strong>. Perfect for school‑goers or working corporate pros in Pune South/West seeking customizable virtual timings directly overseen of Shihan instructors.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-900/40">
                <span className="text-[10px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded font-mono">Live Sessions</span>
                <span className="text-[10px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded font-mono">Flexible Hours</span>
                <span className="text-[10px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded font-mono">Virtual Dojo</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
