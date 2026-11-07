import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  Calendar, 
  Users, 
  Camera, 
  Star, 
  MapPin, 
  Sparkles, 
  HelpCircle, 
  ChevronRight,
  BookOpen
} from 'lucide-react';

// Import the existing home page sections
import About from './About';
import KataShowcase from './KataShowcase';
import Batches from './Batches';
import Coaches from './Coaches';
import Gallery from './Gallery';
import Testimonials from './Testimonials';
import Contact from './Contact';

interface DojoExplorerProps {
  onSelectBatch: (batchName: string) => void;
}

type TabType = 'about' | 'kata' | 'batches' | 'coaches' | 'gallery' | 'testimonials' | 'contact';

export default function DojoExplorer({ onSelectBatch }: DojoExplorerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('about');
  const explorerRef = useRef<HTMLDivElement>(null);

  // Synchronize URL Hash with our Interactive Tabs
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const targetTabMap: Record<string, TabType> = {
        '#about': 'about',
        '#kata': 'kata',
        '#batches': 'batches',
        '#coaches': 'coaches',
        '#gallery': 'gallery',
        '#testimonials': 'testimonials',
        '#contact': 'contact'
      };

      if (hash in targetTabMap) {
        setActiveTab(targetTabMap[hash]);
        // Scroll the explorer container into view smoothly
        setTimeout(() => {
          explorerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Run once on mount to handle direct links
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update active tab inside the component
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `#${tab}`);
  };

  const tabs = [
    { id: 'about' as TabType, label: 'Dojo Heritage', icon: Award, color: 'text-red-500', kanji: '空手' },
    { id: 'kata' as TabType, label: 'Students Kata', icon: BookOpen, color: 'text-yellow-500', kanji: '型' },
    { id: 'batches' as TabType, label: 'Classes & Batches', icon: Calendar, color: 'text-orange-500', kanji: '時間' },
    { id: 'coaches' as TabType, label: 'Our Senseis', icon: Users, color: 'text-orange-400', kanji: '先生' },
    { id: 'gallery' as TabType, label: 'Dojo Gallery', icon: Camera, color: 'text-pink-500', kanji: '写真' },
    { id: 'testimonials' as TabType, label: 'Parent Reviews', icon: Star, color: 'text-emerald-500', kanji: '評価' },
    { id: 'contact' as TabType, label: 'Contact & Map', icon: MapPin, color: 'text-blue-500', kanji: '地図' },
  ];

  // Parents' Quick Assistant Questions
  const quickQuestions = [
    {
      q: "How do I enroll my child?",
      a: "Go to Classes & Batches, choose the age‑appropriate batch (Little Tigers / Young Warriors) and click Enroll Now.",
      tab: 'batches' as TabType
    },
    {
      q: "What age groups are accepted?",
      a: "We train students starting from age 4 (Little Tigers) up to teenagers and adult black belts.",
      tab: 'batches' as TabType
    },
    {
      q: "Who conducts the classes?",
      a: "Classes are led directly by our world-recognized Shotokan masters, Sensei Maruti Jadhav & Sensei Shivraj Jejure.",
      tab: 'coaches' as TabType
    },
    {
      q: "Where is the physical dojo located?",
      a: "We operate in prime centers across Pune (Katraj, Narhe, etc.) and run flexible live interactive online sessions.",
      tab: 'contact' as TabType
    }
  ];

  return (
    <div id="experience-center" ref={explorerRef} className="scroll-mt-24 py-10">
      
      {/* 1. Header & Title Block */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center relative">
        <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-[0.03] select-none pointer-events-none">
          <span className="font-kanji text-[12rem] lg:text-[18rem] text-white">道場</span>
        </div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/60 border border-zinc-800 rounded-full mb-3 shadow-inner">
          <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
          <span className="text-yellow-500 font-heading font-black text-[10px] uppercase tracking-[0.25em]">Dojo Interactive Experience Center</span>
        </div>
        
        <h2 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-tight">
          EXPLORE <span className="text-[#FF2A35]">LIONS DOJO</span>
        </h2>
        <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto mt-2 leading-relaxed font-body">
          Interactive console crafted for busy parents. Instantly navigate our training methods, timetables, lineage masters, and parent success records.
        </p>
      </div>

      {/* 2. Parent Interactive Quick Assistant Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-[#0A0A0C] border border-zinc-900/80 rounded-2xl p-6 shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-zinc-900">
            <HelpCircle className="w-5 h-5 text-yellow-500" />
            <div>
              <h4 className="font-heading text-white text-xs sm:text-sm font-extrabold uppercase tracking-wider">Parents' Quick Information Assistant</h4>
              <p className="text-[10px] text-zinc-500 font-body">Instant answers to the most common questions. Click any question to hop directly to that Dojo section.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickQuestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleTabChange(item.tab)}
                className="group flex items-start gap-3 bg-[#111113]/50 hover:bg-[#151518]/90 border border-zinc-900/60 hover:border-yellow-500/30 p-3.5 rounded-xl transition-all duration-300 text-left cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="mt-0.5 w-5 h-5 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0 font-bold text-[10px]">
                  Q{idx + 1}
                </div>
                <div className="flex-grow space-y-1">
                  <p className="text-zinc-200 text-xs font-bold font-heading group-hover:text-yellow-400 transition-colors flex items-center justify-between">
                    <span>{item.q}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-yellow-500" />
                  </p>
                  <p className="text-zinc-450 text-[11px] leading-relaxed font-body">{item.a}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Highly Interactive Tab Selection Menu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 sticky top-20 z-40 bg-slate-950/90 backdrop-blur-md py-4 border-b border-zinc-900/80">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-row lg:flex-wrap lg:justify-center gap-2 sm:gap-3 justify-items-stretch">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center justify-start sm:justify-center space-x-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border transition-all duration-300 cursor-pointer w-full lg:w-auto lg:shrink-0 group relative overflow-hidden ${
                  isActive
                    ? 'bg-[#121215] border-yellow-500 text-yellow-500 shadow-[0_4px_20px_rgba(234,179,8,0.15)] font-black'
                    : 'bg-[#09090A] border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
                }`}
              >
                {/* Micro-Kanji character accent in background */}
                <span className={`absolute -right-2 -bottom-2 font-kanji text-xl opacity-[0.03] select-none pointer-events-none group-hover:opacity-[0.06] transition-all ${isActive ? 'opacity-[0.1]' : ''}`}>
                  {tab.kanji}
                </span>

                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 ${isActive ? 'scale-110 ' + tab.color : 'text-zinc-500 group-hover:scale-110'}`} />
                <span className="font-heading text-[10px] sm:text-xs uppercase tracking-wider font-semibold truncate">
                  {tab.label}
                </span>
                
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Active Tab Content Window (With elegant fade-slide animations) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#050506]/30 rounded-3xl border border-zinc-900/40 p-4 sm:p-6 shadow-2xl relative overflow-hidden min-h-[400px]">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {activeTab === 'about' && (
                <div id="about" className="relative animate-fadeIn scroll-mt-28">
                  <About />
                </div>
              )}
              
              {activeTab === 'kata' && (
                <div id="kata" className="relative animate-fadeIn scroll-mt-28">
                  <KataShowcase />
                </div>
              )}
              
              {activeTab === 'batches' && (
                <div id="batches" className="relative animate-fadeIn scroll-mt-28">
                  <Batches onSelectBatch={onSelectBatch} />
                </div>
              )}
              
              {activeTab === 'coaches' && (
                <div id="coaches" className="relative animate-fadeIn scroll-mt-28">
                  <Coaches />
                </div>
              )}
              
              {activeTab === 'gallery' && (
                <div id="gallery" className="relative animate-fadeIn scroll-mt-28">
                  <Gallery />
                </div>
              )}
              
              {activeTab === 'testimonials' && (
                <div id="testimonials" className="relative animate-fadeIn scroll-mt-28">
                  <Testimonials />
                </div>
              )}
              
              {activeTab === 'contact' && (
                <div id="contact" className="relative animate-fadeIn scroll-mt-28">
                  <Contact />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

        </div>
      </div>

      {/* 5. Helpful visual status footer inside the Explorer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 text-center">
        <div className="inline-flex items-center gap-4 bg-zinc-900/30 border border-zinc-900/60 rounded-full px-5 py-2">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
            <span>SHIHAN APPROVED LINEAGE</span>
          </div>
          <div className="h-3 w-[1px] bg-zinc-800"></div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
            <BookOpen className="w-3.5 h-3.5 text-red-500" />
            <span>SHOTOKAN SYLLABUS</span>
          </div>
        </div>
      </div>

    </div>
  );
}
