import { useState, useEffect } from 'react';
import { Calendar, Shield, Play, Users, Star, Image as ImageIcon, Phone } from 'lucide-react';
import Batches from './Batches';
import About from './About';
import KataShowcase from './KataShowcase';
import Coaches from './Coaches';
import Testimonials from './Testimonials';
import Gallery from './Gallery';
import Contact from './Contact';

interface DojoExplorerProps {
  onSelectBatch: (batchName: string) => void;
}

type ExplorerTab =
  | 'batches'
  | 'about'
  | 'kata'
  | 'coaches'
  | 'testimonials'
  | 'gallery'
  | 'contact';

export default function DojoExplorer({ onSelectBatch }: DojoExplorerProps) {
  const [activeTab, setActiveTab] = useState<ExplorerTab>('batches');

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash;
      const map: Record<string, ExplorerTab> = {
        '#batches': 'batches',
        '#about': 'about',
        '#kata': 'kata',
        '#coaches': 'coaches',
        '#testimonials': 'testimonials',
        '#gallery': 'gallery',
        '#contact': 'contact'
      };
      const matchedTab = map[hash];
      if (matchedTab) {
        setActiveTab(matchedTab);
        setTimeout(() => {
          document.getElementById('experience-center')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    };

    window.addEventListener('hashchange', syncFromHash);
    syncFromHash();
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const tabs: { id: ExplorerTab; label: string; icon: any }[] = [
    { id: 'batches', label: 'Batches & Timings', icon: Calendar },
    { id: 'about', label: 'About Dojo', icon: Shield },
    { id: 'kata', label: 'Kata Forms', icon: Play },
    { id: 'coaches', label: 'Senseis', icon: Users },
    { id: 'testimonials', label: 'Reviews', icon: Star },
    { id: 'gallery', label: 'Gallery & News', icon: ImageIcon },
    { id: 'contact', label: 'Contact & FAQ', icon: Phone }
  ];

  return (
    <section
      id="experience-center"
      className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0a0909] border-t border-zinc-900 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Compact Interactive Tab Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-950/90 border border-zinc-900 p-2 rounded-2xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-heading font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#9B1B20] text-white shadow-[0_0_20px_rgba(155,27,32,0.35)]'
                    : 'text-zinc-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tab Viewport */}
        <div className="bg-slate-950/60 border border-zinc-900 rounded-3xl p-5 sm:p-8 shadow-2xl">
          {activeTab === 'batches' && <Batches onSelectBatch={onSelectBatch} />}
          {activeTab === 'about' && <About />}
          {activeTab === 'kata' && <KataShowcase />}
          {activeTab === 'coaches' && <Coaches />}
          {activeTab === 'testimonials' && <Testimonials />}
          {activeTab === 'gallery' && <Gallery />}
          {activeTab === 'contact' && <Contact />}
        </div>
      </div>
    </section>
  );
}
