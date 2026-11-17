import { useState, useEffect } from 'react';
import { Menu, X, ShieldCheck, Lock, UserCheck, Award, GraduationCap, CalendarCheck } from 'lucide-react';
import { checkFirestoreConnection } from '../firebase';

interface NavbarProps {
  currentView: string;
  studentPortalTab?: 'progress' | 'exam' | 'attendance';
  onNavigate: (view: string) => void;
}

export default function Navbar({ currentView, studentPortalTab, onNavigate }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    const verify = async () => {
      const ok = await checkFirestoreConnection();
      if (mounted) setDbConnected(ok);
    };
    verify();
    const interval = setInterval(verify, 45000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const scrollToExplorerSection = (hash: string) => {
    setIsOpen(false);
    window.location.hash = hash;
    if (currentView !== 'home') {
      onNavigate('home');
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 no-print ${
        scrolled || currentView !== 'home'
          ? 'bg-slate-950/95 backdrop-blur-md border-b border-zinc-900 shadow-2xl'
          : 'bg-gradient-to-b from-black/90 via-black/50 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            onNavigate('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center space-x-3 text-left cursor-pointer group shrink-0"
        >
          <div className="relative">
            <img
              src="https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/w_88,h_88,c_fill/v1781350907/logo_new_bgwsw9.jpg"
              alt="Lions Karate Club Pune Logo"
              className="w-10 h-10 rounded-full object-cover border border-yellow-500/40 group-hover:border-yellow-500 transition-colors"
              referrerPolicy="no-referrer"
            />
            <span
              title={dbConnected ? 'Database Connected' : 'Database Offline / Local Mode'}
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                dbConnected === null ? 'bg-zinc-500' : dbConnected ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
          </div>
          <div>
            <span className="font-heading font-black text-sm sm:text-base tracking-widest uppercase text-white block leading-none">
              LIONS KARATE
            </span>
            <span className="font-mono text-[9px] text-amber-500 tracking-[0.2em] uppercase block mt-0.5">
              CLUB PUNE
            </span>
          </div>
        </button>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center space-x-5 text-[11px] font-heading font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => {
              onNavigate('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`cursor-pointer transition-colors ${
              currentView === 'home' ? 'text-yellow-500' : 'text-zinc-300 hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => scrollToExplorerSection('#batches')}
            className="text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            Batches
          </button>
          <button
            type="button"
            onClick={() => onNavigate('student-portal')}
            className={`flex items-center gap-1 cursor-pointer transition-colors ${
              currentView === 'student-portal' && studentPortalTab === 'progress'
                ? 'text-yellow-500'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student Portal</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('belt-exam')}
            className={`flex items-center gap-1 cursor-pointer transition-colors ${
              currentView === 'student-portal' && studentPortalTab === 'exam'
                ? 'text-yellow-500'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Belt Exam</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('checkin')}
            className={`flex items-center gap-1 cursor-pointer transition-colors ${
              currentView === 'checkin' ? 'text-yellow-500' : 'text-zinc-300 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Check-In</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('coach')}
            className={`flex items-center gap-1 cursor-pointer transition-colors ${
              currentView === 'coach' ? 'text-yellow-500' : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Coach Portal</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className={`flex items-center gap-1 cursor-pointer transition-colors ${
              currentView === 'admin' ? 'text-yellow-500' : 'text-zinc-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Desktop CTA & Mobile Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('admission')}
            className="hidden sm:inline-flex items-center justify-center bg-[#9B1B20] hover:bg-red-500 text-white font-heading font-black text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 border border-red-500/40 shadow-[0_0_20px_rgba(155,27,32,0.4)] transition-all cursor-pointer"
          >
            ONLINE ADMISSION
          </button>

          <button
            id="mobile-menu-toggle"
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden p-2.5 rounded-lg bg-slate-900 border border-zinc-800 text-zinc-200 hover:text-white cursor-pointer"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-zinc-900 px-4 py-5 space-y-3 shadow-2xl">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('home');
              }}
              className="p-3 rounded-lg bg-slate-900 border border-zinc-800 text-left text-xs font-heading font-bold uppercase text-zinc-200 cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => scrollToExplorerSection('#batches')}
              className="p-3 rounded-lg bg-slate-900 border border-zinc-800 text-left text-xs font-heading font-bold uppercase text-zinc-200 cursor-pointer"
            >
              Batches
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('student-portal');
              }}
              className="p-3 rounded-lg bg-slate-900 border border-zinc-800 text-left text-xs font-heading font-bold uppercase text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 text-yellow-500" />
              <span>Student Portal</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('belt-exam');
              }}
              className="p-3 rounded-lg bg-slate-900 border border-zinc-800 text-left text-xs font-heading font-bold uppercase text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Belt Exam</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('checkin');
              }}
              className="p-3 rounded-lg bg-slate-900 border border-zinc-800 text-left text-xs font-heading font-bold uppercase text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exam Check-In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('presence-checkin');
              }}
              className="p-3 rounded-lg bg-slate-900 border border-zinc-800 text-left text-xs font-heading font-bold uppercase text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Daily Presence</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('coach');
              }}
              className="p-3 rounded-lg bg-slate-900 border border-zinc-800 text-left text-xs font-heading font-bold uppercase text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Coach Portal</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('admin');
              }}
              className="p-3 rounded-lg bg-slate-900 border border-zinc-800 text-left text-xs font-heading font-bold uppercase text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-yellow-500" />
              <span>Admin Console</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onNavigate('admission');
            }}
            className="w-full py-3.5 bg-[#9B1B20] hover:bg-red-500 text-white font-heading font-black text-xs uppercase tracking-[0.2em] cursor-pointer"
          >
            ONLINE ADMISSION
          </button>
        </div>
      )}
    </nav>
  );
}
