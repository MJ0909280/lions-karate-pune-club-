import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Admission } from './types';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import DojoExplorer from './components/DojoExplorer';
import DojoMapEmbed from './components/DojoMapEmbed';
import AdmissionForm from './components/AdmissionForm';
import IDCard from './components/IDCard';
import AdminPanel from './components/AdminPanel';
import StudentPortal from './components/StudentPortal';
import ExamCheckIn from './components/ExamCheckIn';
import CoachPortal from './components/CoachPortal';
import TrailerOverlay from './components/TrailerOverlay';
import SEOConfig from './components/SEOConfig';
import WhatsAppFAB from './components/WhatsAppFAB';

import { ShieldAlert, ArrowLeft, RefreshCw, Instagram, Youtube, MessageCircle } from 'lucide-react';

type ViewType =
  | 'home'
  | 'admission'
  | 'success'
  | 'admin'
  | 'student-portal'
  | 'checkin'
  | 'examiner-scoring'
  | 'coach';

export default function App() {
  const [view, setView] = useState<ViewType>('home');
  const [showTrailer, setShowTrailer] = useState<boolean>(true);
  const [selectedBatchText, setSelectedBatchText] = useState('');
  const [studentPortalTab, setStudentPortalTab] = useState<'progress' | 'exam' | 'attendance'>('progress');

  const [successDocId, setSuccessDocId] = useState('');
  const [successAdmission, setSuccessAdmission] = useState<Admission | null>(null);
  const [successLoading, setSuccessLoading] = useState(false);
  const [urlStudentId, setUrlStudentId] = useState<string | null>(null);

  useEffect(() => {
    const parseLocationAndHash = () => {
      const hash = window.location.hash;
      const urlParams = new URLSearchParams(window.location.search);

      let hashParams = new URLSearchParams();
      if (hash.includes('?')) {
        const queryString = hash.substring(hash.indexOf('?'));
        hashParams = new URLSearchParams(queryString);
      }

      const targetStudentId =
        hashParams.get('studentId') ||
        urlParams.get('studentId') ||
        hashParams.get('id') ||
        urlParams.get('id');
      if (targetStudentId) {
        setUrlStudentId(targetStudentId);
      }

      if (hash.startsWith('#coach')) {
        setShowTrailer(false);
        setView('coach');
      } else if (hash.startsWith('#admin')) {
        setShowTrailer(false);
        setView('admin');
      } else if (
        hash.startsWith('#student-portal') ||
        hash.startsWith('#check-results') ||
        hash.startsWith('#results')
      ) {
        setShowTrailer(false);
        setView('student-portal');
        setStudentPortalTab('progress');
      } else if (hash.startsWith('#belt-exam')) {
        setShowTrailer(false);
        setView('student-portal');
        setStudentPortalTab('exam');
      } else if (hash.startsWith('#attendance')) {
        setShowTrailer(false);
        setView('student-portal');
        setStudentPortalTab('attendance');
      } else if (hash.startsWith('#checkin')) {
        setShowTrailer(false);
        setView('checkin');
      } else if (hash.startsWith('#examiner-scoring') || hash.startsWith('#scoring')) {
        setShowTrailer(false);
        setView('examiner-scoring');
      } else if (hash.startsWith('#admission')) {
        setShowTrailer(false);
        setView('admission');
      } else if (hash.startsWith('#success')) {
        setShowTrailer(false);
        setView('success');
        const match = hash.match(/\?id=([a-zA-Z0-9_\-]+)/);
        if (match && match[1]) {
          setSuccessDocId(match[1]);
        }
      } else if (hash.startsWith('#practice')) {
        setShowTrailer(false);
        setView('home');
      } else {
        setView('home');
      }
    };

    window.addEventListener('hashchange', parseLocationAndHash);
    parseLocationAndHash();

    return () => window.removeEventListener('hashchange', parseLocationAndHash);
  }, []);

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
        }
      } catch (err) {
        console.error('Failed to load registration: ', err);
      } finally {
        setSuccessLoading(false);
      }
    };

    fetchSuccessRecord();
  }, [view, successDocId]);

  const navigateTo = (
    nextView: ViewType | 'belt-exam' | 'attendance',
    options?: { batchName?: string; docId?: string }
  ) => {
    setShowTrailer(false);
    if (options?.batchName) {
      setSelectedBatchText(options.batchName);
    }

    if (nextView === 'home') {
      const currentHash = window.location.hash;
      const sectionHashes = ['#about', '#kata', '#practice', '#batches', '#coaches', '#gallery', '#testimonials', '#contact'];
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
    <div className="min-h-screen bg-[#0a0909] flex flex-col justify-between selection:bg-[#9B1B20] selection:text-white text-zinc-100">
      {/* Dynamic SEO Headers */}
      {view === 'home' && (
        <SEOConfig
          title="Traditional Shotokan Karate & Self-Defense Academy"
          description="LIONS KARATE CLUB PUNE offers traditional Shotokan Karate, self-defense, and tournament training across Narhe, Manaji Nagar, Bhumkar Bridge & Jambulwadi, Pune."
          pagePath=""
        />
      )}
      {view === 'admission' && (
        <SEOConfig
          title="Online Student Admission"
          description="Register at Lions Karate Club Pune and receive your official Student Roll ID."
          pagePath="#admission"
        />
      )}
      {view === 'success' && (
        <SEOConfig
          title="Registration Confirmed | Student ID"
          description="Your admission with Lions Karate Club Pune is recorded. View your student ID pass."
          pagePath="#success"
        />
      )}
      {view === 'admin' && (
        <SEOConfig
          title="Admin Console"
          description="Lions Karate Club Pune administration directory and grading management."
          pagePath="#admin"
        />
      )}
      {view === 'student-portal' && (
        <SEOConfig
          title="Student Progress & Belt Exam Portal"
          description="Check belt progress, register for upcoming belt exams, and view official examination results."
          pagePath="#student-portal"
        />
      )}

      {/* Cinematic Intro Trailer Overlay on Home Entry */}
      {view === 'home' && showTrailer && (
        <TrailerOverlay onEnter={() => setShowTrailer(false)} />
      )}

      {/* Global Navigation Bar */}
      <Navbar
        currentView={view}
        studentPortalTab={studentPortalTab}
        onNavigate={(v) => navigateTo(v as any)}
      />

      {/* VIEW 1: LANDING PAGE */}
      {view === 'home' && (
        <main className="flex-grow">
          <Hero onNavigate={(v) => navigateTo(v as ViewType)} />
          <DojoExplorer onSelectBatch={(bName) => navigateTo('admission', { batchName: bName })} />
          <DojoMapEmbed />
          <WhatsAppFAB />
        </main>
      )}

      {/* VIEW 2: OFFICIAL ADMISSION FORM */}
      {view === 'admission' && (
        <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="inline-flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>

            <AdmissionForm
              preselectedBatch={selectedBatchText}
              onSuccess={(docId) => navigateTo('success', { docId })}
            />
          </div>
        </main>
      )}

      {/* VIEW 3: REGISTRATION SUCCESS & ID CARD */}
      {view === 'success' && (
        <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="inline-flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer no-print"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>

            {successLoading && (
              <div className="py-20 text-center text-zinc-400">
                <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-yellow-500" />
                <span className="text-xs font-mono uppercase tracking-widest">Loading ID Card...</span>
              </div>
            )}

            {!successLoading && successAdmission && (
              <IDCard
                admission={successAdmission}
                showSuccessBanner={true}
                hideDownloadActions={true}
              />
            )}

            {!successLoading && !successAdmission && (
              <div className="bg-slate-950 border border-zinc-800 p-10 text-center rounded-xl text-xs text-zinc-400">
                <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <span>Registration record not found. Please check your reference link.</span>
              </div>
            )}
          </div>
        </main>
      )}

      {/* VIEW 4: ADMIN CONSOLE */}
      {view === 'admin' && (
        <main className="flex-grow">
          <AdminPanel />
        </main>
      )}

      {/* VIEW 5: STUDENT PORTAL */}
      {view === 'student-portal' && (
        <main className="flex-grow pt-28 pb-20">
          <div className="max-w-4xl mx-auto px-4 space-y-6">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="inline-flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
            <StudentPortal
              initialTab={studentPortalTab}
              initialStudentId={urlStudentId || undefined}
              onNavigate={(v) => navigateTo(v)}
            />
          </div>
        </main>
      )}

      {/* VIEW 6: EXAM CHECK-IN */}
      {view === 'checkin' && (
        <main className="flex-grow pt-28 pb-20">
          <ExamCheckIn onBackToHome={() => navigateTo('home')} initialTab="checkin" />
        </main>
      )}

      {/* VIEW 7: EXAMINER SCORING */}
      {view === 'examiner-scoring' && (
        <main className="flex-grow pt-28 pb-20">
          <ExamCheckIn onBackToHome={() => navigateTo('home')} initialTab="grading" />
        </main>
      )}

      {/* VIEW 8: COACH MAT PORTAL */}
      {view === 'coach' && (
        <main className="flex-grow">
          <CoachPortal onBackToHome={() => navigateTo('home')} />
        </main>
      )}

      {/* FOOTER */}
      <footer className="bg-black border-t border-zinc-900 py-12 px-4 sm:px-6 lg:px-8 no-print">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/w_88,h_88,c_fill/v1781350907/logo_new_bgwsw9.jpg"
                alt="Lions Karate Club Pune Logo"
                className="w-10 h-10 object-cover rounded-full border border-amber-500/40"
                referrerPolicy="no-referrer"
              />
              <span className="font-heading text-base font-black uppercase tracking-widest text-white">
                LIONS KARATE CLUB PUNE
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-md">
              Traditional Shotokan Karate, Self-Defense, and Kickboxing Academy serving Narhe, Manaji Nagar, Bhumkar Bridge &amp; Jambulwadi, Pune.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://www.instagram.com/lions_karate_club_pune?igsh=MTdpeHVjeTFkeTd6aw=="
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-lg bg-slate-950 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.youtube.com/@LionsKarateClub"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-lg bg-slate-950 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/919049688172"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-lg bg-slate-950 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-heading font-black uppercase tracking-wider text-amber-500 block">
              Club Portals
            </span>
            <div className="flex flex-col space-y-2 text-xs text-zinc-400">
              <button type="button" onClick={() => navigateTo('home')} className="hover:text-white text-left cursor-pointer">
                Home
              </button>
              <button type="button" onClick={() => navigateTo('admission')} className="hover:text-white text-left cursor-pointer">
                Online Admission
              </button>
              <button type="button" onClick={() => navigateTo('student-portal')} className="hover:text-white text-left cursor-pointer">
                Student Portal &amp; Results
              </button>
              <button type="button" onClick={() => navigateTo('belt-exam')} className="hover:text-white text-left cursor-pointer">
                Belt Exam Registration
              </button>
              <button type="button" onClick={() => navigateTo('admin')} className="hover:text-white text-left cursor-pointer">
                Admin Console
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-heading font-black uppercase tracking-wider text-amber-500 block">
              Headquarters
            </span>
            <p className="text-xs text-zinc-400 leading-relaxed space-y-1">
              <span className="block">
                <a
                  href="https://maps.app.goo.gl/3XTDzC6wYw5RB6Uk8"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:underline"
                >
                  Manaji Nagar, Narhe, Pune 411041
                </a>
              </span>
              <span className="block font-mono">
                <a href="tel:+919049688172" className="hover:text-white">
                  +91 90496 88172
                </a>
              </span>
              <span className="block">
                <a href="mailto:LIONSKARATECLUBPUNE09@gmail.com" className="hover:text-white break-all">
                  LIONSKARATECLUBPUNE09@gmail.com
                </a>
              </span>
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-zinc-900 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] font-mono text-zinc-500">
          <span>&copy; {new Date().getFullYear()} LIONS KARATE CLUB PUNE. ALL RIGHTS RESERVED.</span>
          <span>精神一到 • COURAGE &amp; HONOR</span>
        </div>
      </footer>
    </div>
  );
}
