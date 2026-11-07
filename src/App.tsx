import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Admission } from './types';
import { motion } from 'motion/react';
import { safeSessionStorage } from './utils/storage';

// Core fold components (loaded synchronously for fast LCP)
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import DojoExplorer from './components/DojoExplorer';
import SEOConfig from './components/SEOConfig';
import WhatsAppFAB from './components/WhatsAppFAB';
import TrailerOverlay from './components/TrailerOverlay';

// Secondary views imported statically to ensure 100% reliable execution in iframe environment
import AdmissionForm from './components/AdmissionForm';
import IDCard from './components/IDCard';
import AdminPanel from './components/AdminPanel';
import StudentPortal from './components/StudentPortal';
import ExamCheckIn from './components/ExamCheckIn';
import PresenceCheckIn from './components/PresenceCheckIn';
import CoachPortal from './components/CoachPortal';
import DojoMapEmbed from './components/DojoMapEmbed';

import { Award, ShieldAlert, ShieldCheck, ArrowLeft, RefreshCw, Star, MapPin, Instagram, Youtube, MessageCircle } from 'lucide-react';

type ViewType = 'home' | 'admission' | 'success' | 'admin' | 'student-portal' | 'checkin' | 'examiner-scoring' | 'presence-checkin' | 'coach';

export default function App() {
  const [view, setView] = useState<ViewType>('home');
  const [selectedBatchText, setSelectedBatchText] = useState('');
  const [studentPortalTab, setStudentPortalTab] = useState<'progress' | 'exam' | 'attendance'>('progress');
  
  // Trailer state persistent per session
  const [trailerCompleted, setTrailerCompleted] = useState(() => !!safeSessionStorage.getItem('dojo_trailer_entered'));

  // Success states
  const [successDocId, setSuccessDocId] = useState('');
  const [successAdmission, setSuccessAdmission] = useState<Admission | null>(null);
  const [successLoading, setSuccessLoading] = useState(false);

  const [urlStudentId, setUrlStudentId] = useState<string | null>(null);

  // 1. Sync React View state with window hash location
  useEffect(() => {
    const parseLocationAndHash = () => {
      const hash = window.location.hash;
      const urlParams = new URLSearchParams(window.location.search);
      
      // Parse query params from hash if hash contains '?'
      let hashParams = new URLSearchParams();
      if (hash.includes('?')) {
        const queryString = hash.substring(hash.indexOf('?'));
        hashParams = new URLSearchParams(queryString);
      }
      
      const targetStudentId = hashParams.get('studentId') || urlParams.get('studentId') || hashParams.get('id') || urlParams.get('id');
      if (targetStudentId) {
        setUrlStudentId(targetStudentId);
      }

      if (hash.startsWith('#coach')) {
        setView('coach');
      } else if (hash.startsWith('#admin')) {
        setView('admin');
      } else if (hash.startsWith('#student-portal') || hash.startsWith('#check-results') || hash.startsWith('#results')) {
        setView('student-portal');
        setStudentPortalTab('progress');
      } else if (hash.startsWith('#belt-exam')) {
        setView('student-portal');
        setStudentPortalTab('exam');
      } else if (hash.startsWith('#attendance')) {
        setView('student-portal');
        setStudentPortalTab('attendance');
      } else if (hash.startsWith('#presence') || hash.startsWith('#qr-checkin')) {
        setView('presence-checkin');
      } else if (hash.startsWith('#checkin')) {
        setView('checkin');
      } else if (hash.startsWith('#examiner-scoring') || hash.startsWith('#scoring')) {
        setView('examiner-scoring');
      } else if (hash.startsWith('#admission')) {
        setView('admission');
      } else if (hash.startsWith('#success')) {
        setView('success');
        // Retrieve optional student application ID
        const match = hash.match(/\?id=([a-zA-Z0-9_\-]+)/);
        if (match && match[1]) {
          setSuccessDocId(match[1]);
        }
      } else {
        setView('home');
      }
    };

    window.addEventListener('hashchange', parseLocationAndHash);
    parseLocationAndHash(); // Run once representing initial mount

    return () => window.removeEventListener('hashchange', parseLocationAndHash);
  }, []);

  // 2. Load newly generated student details on success routing
  useEffect(() => {
    if (view !== 'success' || !successDocId) {
      setSuccessAdmission(null);
      return;
    }

    const fetchSuccessRecord = async () => {
      setSuccessLoading(true);
      try {
        const docRef = doc(db, 'admissions', successDocId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSuccessAdmission({
            id: docSnap.id,
            ...docSnap.data()
          } as Admission);
        } else {
          console.error("No student registration found for id:", successDocId);
        }
      } catch (err) {
        console.error("Failed to load registration: ", err);
      } finally {
        setSuccessLoading(false);
      }
    };

    fetchSuccessRecord();
  }, [view, successDocId]);

  // Safe wrapper representing router navigator logic
  const navigateTo = (nextView: ViewType | 'belt-exam' | 'attendance', options?: { batchName?: string; docId?: string }) => {
    if (options?.batchName) {
      setSelectedBatchText(options.batchName);
    }

    if (nextView === 'home') {
      const currentHash = window.location.hash;
      const sectionHashes = ['#about', '#kata', '#batches', '#coaches', '#gallery', '#testimonials', '#contact'];
      if (!sectionHashes.includes(currentHash)) {
        window.location.hash = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setView('home');
    } else if (nextView === 'admission') {
      window.location.hash = 'admission';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (nextView === 'admin') {
      window.location.hash = 'admin';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (nextView === 'student-portal') {
      setStudentPortalTab('progress');
      window.location.hash = 'student-portal';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (nextView === 'belt-exam') {
      setStudentPortalTab('exam');
      window.location.hash = 'belt-exam';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (nextView === 'coach') {
      window.location.hash = 'coach';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setView('coach');
    } else if (nextView === 'presence-checkin') {
      window.location.hash = 'presence-checkin';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setView('presence-checkin');
    } else if (nextView === 'checkin') {
      window.location.hash = 'checkin';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (nextView === 'examiner-scoring') {
      window.location.hash = 'examiner-scoring';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (nextView === 'attendance') {
      setStudentPortalTab('attendance');
      window.location.hash = 'attendance';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (nextView === 'success' && options?.docId) {
      setSuccessDocId(options.docId);
      window.location.hash = `success?id=${options.docId}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-yellow-500 selection:text-slate-950 text-[#F0E6D3]">
      
      {/* Immersive Trailer Overlay */}
      {!trailerCompleted && (
        <TrailerOverlay onEnter={() => {
          setTrailerCompleted(true);
          safeSessionStorage.setItem('dojo_trailer_entered', 'true');
        }} />
      )}

      {/* Interactive mouse follow cursor glow */}
      <CustomCursor />

      {/* Dynamic SEO headers mounting */}
      {view === 'home' && (
        <SEOConfig 
          title="Best Karate, Martial Arts & Kickboxing Classes in Pune | Self Defence" 
          description="LIONS KARATE CLUB PUNE is Pune's leading academy for Shotokan Karate, Kickboxing, Martial Arts & Self Defence. Serving families in Katraj, Narhe, Hadapsar, Kothrud, Baner, Hinjewadi, and Camp. Flexible online live training is also available."
          pagePath=""
        />
      )}
      {view === 'admission' && (
        <SEOConfig 
          title="Online Admission Enrollment Portal" 
          description="Enroll in LIONS KARATE CLUB PUNE. Sign up for Kids Karate Classes, select program batches, and secure registrations."
          pagePath="#admission"
        />
      )}
      {view === 'success' && (
        <SEOConfig 
          title="Registration Success | Student ID Issued" 
          description="Your admission in LIONS KARATE CLUB PUNE has been successful. Download or print your verified student ID card pass."
          pagePath="#success"
        />
      )}
      {view === 'admin' && (
        <SEOConfig 
          title="Secure Administration Directory Portal" 
          description="Dojo administration dashboard. Search registers, review health details, approve statuses, and print official student passes."
          pagePath="#admin"
        />
      )}
      {view === 'student-portal' && (
        <SEOConfig 
          title="Student Registry & Progress Portal" 
          description="Locate student Kyu achievements, exam remarks progress, and register for upcoming belt exams."
          pagePath="#student-portal"
        />
      )}

      {/* Global Navigation Bar */}
      <Navbar currentView={view} studentPortalTab={studentPortalTab} onNavigate={(v) => navigateTo(v as any)} />

      {/* RENDER VIEW 1: PREMIER LANDING PAGE */}
      {view === 'home' && (
        <main className="flex-grow">
          {/* Hero header Banner with call triggers */}
          <Hero onNavigate={(v) => navigateTo(v as ViewType)} />
          
          {/* Interactive Dojo Explorer Hub */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.75, ease: [0.19, 1, 0.22, 1] }}
          >
            <DojoExplorer onSelectBatch={(bName) => navigateTo('admission', { batchName: bName })} />
          </motion.div>

          {/* Floating Action Button for direct WhatsApp inquiries */}
          <WhatsAppFAB />
        </main>
      )}

      {/* RENDER VIEW 2: COMPREHENSIVE ADMISSION COMPONENT */}
      {view === 'admission' && (
          <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <button
                onClick={() => navigateTo('home')}
                className="inline-flex items-center space-x-2 text-xs font-heading font-black text-zinc-500 hover:text-yellow-500 transition-colors uppercase tracking-widest cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dojo Landing</span>
              </button>

              <AdmissionForm 
                preselectedBatch={selectedBatchText} 
                onSuccess={(docId) => navigateTo('success', { docId })}
              />
            </div>
          </main>
        )}

        {/* RENDER VIEW 3: REGISTRATION SUCCESS PAGE & ISSUED ID CARD VIEW */}
        {view === 'success' && (
          <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-6">
              <button
                onClick={() => navigateTo('home')}
                className="inline-flex items-center space-x-2 text-xs font-heading font-black text-zinc-500 hover:text-yellow-500 transition-colors uppercase tracking-widest cursor-pointer no-print"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>GO BACK TO MAIN HOME</span>
              </button>

              {successLoading && (
                <div className="py-24 text-center text-zinc-500">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
                  <span className="font-heading font-bold text-xs uppercase tracking-wider">Compiling Issued Pass Data...</span>
                </div>
              )}

              {!successLoading && successAdmission && (
                <IDCard admission={successAdmission} showSuccessBanner={true} hideDownloadActions={true} />
              )}

              {!successLoading && !successAdmission && (
                <div className="bg-slate-900 border border-zinc-900 p-12 text-center rounded-xl font-heading text-xs text-zinc-500">
                  <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <span>Admission files not resolved. Please verify your reference address link.</span>
                </div>
              )}
            </div>
          </main>
        )}

        {/* RENDER VIEW 4: ADMIN REGISTER DIRECTORY CONSOLE */}
        {view === 'admin' && (
          <main className="flex-grow">
            <AdminPanel />
          </main>
        )}

        {/* RENDER VIEW 5: STUDENT REGISTRY & PROGRESS PORTAL */}
        {view === 'student-portal' && (
          <main className="flex-grow pt-32 pb-20">
            <div className="max-w-4xl mx-auto px-4 space-y-6">
              <button
                onClick={() => navigateTo('home')}
                className="inline-flex items-center space-x-2 text-xs font-heading font-black text-zinc-500 hover:text-yellow-500 transition-colors uppercase tracking-widest cursor-pointer pl-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dojo Landing</span>
              </button>
              <StudentPortal initialTab={studentPortalTab} initialStudentId={urlStudentId || undefined} onNavigate={(v) => navigateTo(v)} />
            </div>
          </main>
        )}

        {/* RENDER VIEW 6: BELT EXAM DAY PORTABLE SMARTPHONE CHECK-IN */}
        {view === 'checkin' && (
          <main className="flex-grow pt-32 pb-20">
            <ExamCheckIn onBackToHome={() => navigateTo('home')} initialTab="checkin" />
          </main>
        )}

        {/* RENDER VIEW 7: EXAMINER SCORING & DISCIPLINE GRADING PORTAL */}
        {view === 'examiner-scoring' && (
          <main className="flex-grow pt-32 pb-20">
            <ExamCheckIn onBackToHome={() => navigateTo('home')} initialTab="grading" />
          </main>
        )}

        {/* RENDER VIEW 8: DAILY PRESENCE CHECK-IN DASHBOARD WITH DYNAMIC QR */}
        {view === 'presence-checkin' && (
          <main className="flex-grow pt-24 pb-20">
            <PresenceCheckIn onBackToHome={() => navigateTo('home')} />
          </main>
        )}

        {/* RENDER VIEW 9: COACH MAT PORTAL (PASSCODE PROTECTED LKCP09) */}
        {view === 'coach' && (
          <main className="flex-grow">
            <CoachPortal onBackToHome={() => navigateTo('home')} />
          </main>
        )}

        {/* Google Maps Container Section for local business discovery */}
        <DojoMapEmbed />

      {/* FOOTER SECTION: Standard across lander and portals */}
      <footer className="bg-slate-950 border-t border-zinc-900/60 py-12 px-4 sm:px-6 lg:px-8 no-print">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo element */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3 text-yellow-500">
              <img 
                src="https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781350907/logo_new_bgwsw9.jpg"
                alt="Lions Karate Club Pune Logo" 
                className="w-10 h-10 object-contain rounded-full border border-yellow-500/40 bg-slate-900"
                referrerPolicy="no-referrer"
              />
              <span className="font-title text-base font-extrabold uppercase tracking-widest leading-none">LIONS KARATE CLUB PUNE</span>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-sm">
              Providing traditional Shotokan Karate discipline, self defence training, and competitive physical developmental skills for all age brackets. Built on honor and courage.
            </p>
            <div className="pt-2 flex items-center space-x-3.5">
              <a 
                href="https://www.instagram.com/lions_karate_club_pune?igsh=MTdpeHVjeTFkeTd6aw==" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-full bg-slate-900 border border-zinc-850 flex items-center justify-center text-zinc-400 hover:text-pink-500 hover:border-pink-500/30 hover:bg-pink-500/10 transition-all shadow-md group"
                title="Follow Lions Karate Club Pune on Instagram"
              >
                <Instagram className="w-4 h-4 transition-transform group-hover:scale-110" />
              </a>
              <a 
                href="https://www.youtube.com/@LionsKarateClub" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-full bg-slate-900 border border-zinc-850 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10 transition-all shadow-md group"
                title="Subscribe to Lions Karate Club Pune on YouTube"
              >
                <Youtube className="w-4 h-4 transition-transform group-hover:scale-110" />
              </a>
              <a 
                href="https://wa.me/919049688172" 
                target="_blank" 
                rel="noreferrer" 
                className="w-8 h-8 rounded-full bg-slate-900 border border-zinc-850 flex items-center justify-center text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all shadow-md group"
                title="Chat with Lions Karate Club Pune on WhatsApp"
              >
                <MessageCircle className="w-4 h-4 transition-transform group-hover:scale-110" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <span className="font-heading font-black text-[10px] text-zinc-300 uppercase tracking-widest block">Portal Directories</span>
            <div className="flex flex-col space-y-2 text-xs text-zinc-500">
              <button onClick={() => navigateTo('home')} className="hover:text-yellow-500 hover:pl-0.5 transition-all text-left bg-transparent border-0 cursor-pointer p-0">Main Landing</button>
              <button onClick={() => navigateTo('admission')} className="hover:text-yellow-500 hover:pl-0.5 transition-all text-left bg-transparent border-0 cursor-pointer p-0">Admission Form</button>
              <button onClick={() => navigateTo('student-portal')} className="hover:text-yellow-500 hover:pl-0.5 transition-all text-left bg-transparent border-0 cursor-pointer p-0">Student Progress Portal</button>
              <button onClick={() => navigateTo('admin')} className="hover:text-yellow-500 hover:pl-0.5 transition-all text-left bg-transparent border-0 cursor-pointer p-0">Admin Console</button>
            </div>
          </div>

          {/* Location contact parameter */}
          <div className="space-y-3">
            <span className="font-heading font-black text-[10px] text-zinc-300 uppercase tracking-widest block">Dojo Location</span>
            <p className="text-xs text-zinc-500 leading-relaxed">
              <strong className="text-zinc-300">LIONS KARATE CLUB PUNE</strong><br />
              📍 <a href="https://maps.app.goo.gl/3XTDzC6wYw5RB6Uk8" target="_blank" rel="noreferrer" className="text-yellow-500 hover:underline">Manaji Nagar, Narhe, Pune</a><br />
              Tel: <a href="tel:9049688172" className="text-zinc-300 hover:text-yellow-500 font-mono">9049688172</a><br />
              Email: <a href="mailto:LIONSKARATECLUBPUNE09@gmail.com" className="text-zinc-300 hover:text-yellow-500 break-all">LIONSKARATECLUBPUNE09@gmail.com</a>
            </p>
          </div>
        </div>

        {/* Bottom copyright bars */}
        <div className="max-w-7xl mx-auto border-t border-zinc-900/40 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-zinc-600 font-mono">
          <span>&copy; {new Date().getFullYear()} LIONS KARATE CLUB PUNE. ALL RIGHTS RESERVED.</span>
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-yellow-500" />
            <span>SHOTOKAN STYLE APPROVED</span>
          </span>
        </div>
      </footer>

    </div>
  );
}

function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseActive, setIsMouseActive] = useState(false);

  useEffect(() => {
    let frameId: number;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      currentX = e.clientX;
      currentY = e.clientY;
      if (!isMouseActive) setIsMouseActive(true);

      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setMousePosition({ x: currentX, y: currentY });
      });
    };
    
    const handleMouseLeave = () => setIsMouseActive(false);
    const handleMouseEnter = () => setIsMouseActive(true);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isMouseActive]);

  if (!isMouseActive) return null;

  return (
    <div
      className="cursor-glow active pointer-events-none fixed z-[9999] hidden lg:block"
      style={{
        left: `${mousePosition.x}px`,
        top: `${mousePosition.y}px`,
      }}
    />
  );
}
