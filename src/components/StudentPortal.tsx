import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2pdf from 'html2pdf.js';
import confetti from 'canvas-confetti';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc,
  limit,
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, generateSequentialStudentId } from '../firebase';
import { safeLocalStorage } from '../utils/storage';
import { Admission, BELT_LEVELS, DOJO_BRANCHES, calculateOverallGrade, DisciplineGrades } from '../types';
import AttendanceTracker from './AttendanceTracker';
import IDCard from './IDCard';
import { 
  Search, 
  Award, 
  Calendar, 
  ClipboardList, 
  User, 
  ChevronRight, 
  CheckCircle, 
  FileCheck, 
  ShieldCheck, 
  CreditCard,
  AlertCircle,
  PlusCircle,
  MapPin,
  Clock,
  ArrowRight,
  RefreshCw,
  MessageCircle,
  TrendingUp,
  GraduationCap,
  Printer,
  X,
  CheckSquare,
  Bell,
  Info,
  Download,
  Trophy,
  Flame,
  Star,
  Sparkles
} from 'lucide-react';

const DEFAULT_STUDENT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23111'><rect width='100' height='100' fill='%231a1a1a'/><circle cx='50' cy='35' r='14' fill='%23c9a96e'/><path d='M50 50 L35 75 L30 73 L42 53 L38 50 L30 55 L28 50 L40 42 Z' fill='%23fff'/><path d='M50 50 L65 80 L72 82 L58 55 L65 48 L75 52 L78 47 L60 40 Z' fill='%23fff'/><path d='M42 45 H58 V49 H42 Z' fill='%239B1B20'/></svg>";

const playKarateBell = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Explicitly resume audio context to handle browser-specific autoplay restrictions
    if (ctx.state === 'suspended') {
      ctx.resume().catch(e => console.warn('AudioContext resume failed:', e));
    }
    
    const now = ctx.currentTime;

    const fundamental = 330; // pitch frequency (E4 resonant tone)
    
    // Main chime oscillator
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.frequency.setValueAtTime(fundamental, now);
    osc1.type = 'sine';
    
    // Harmonic metallic third overtone ring
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.frequency.setValueAtTime(fundamental * 1.20, now);
    osc2.type = 'sine';

    // Harmonic octave bell chime ring
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.frequency.setValueAtTime(fundamental * 2.0, now);
    osc3.type = 'sine';

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.45, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc1.connect(gain1);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    gain1.connect(masterGain);

    osc2.connect(gain2);
    gain2.gain.setValueAtTime(0.25, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    gain2.connect(masterGain);

    osc3.connect(gain3);
    gain3.gain.setValueAtTime(0.15, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    gain3.connect(masterGain);

    masterGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + 1.5);
    osc2.stop(now + 1.0);
    osc3.stop(now + 0.6);
  } catch (err) {
    console.warn("Audio Context playback couldn't initialize on user gesture:", err);
  }
};

const getRequiredClassesForCurrentBelt = (beltLevel: string): { required: number; nextBelt: string } => {
  const currentClean = (beltLevel || '').toLowerCase().trim();
  
  if (currentClean === 'yellow' || currentClean.includes('yellow')) {
    return { required: 20, nextBelt: 'Orange' };
  }
  if (currentClean === 'orange' || currentClean.includes('orange')) {
    return { required: 25, nextBelt: 'Green' };
  }
  if (currentClean === 'green' || currentClean.includes('green')) {
    return { required: 30, nextBelt: 'Blue' };
  }
  if (currentClean === 'blue' || currentClean.includes('blue')) {
    return { required: 35, nextBelt: 'Purple' };
  }
  if (currentClean === 'purple' || currentClean.includes('purple')) {
    return { required: 40, nextBelt: 'Red' };
  }
  if (currentClean === 'red' || currentClean.includes('red')) {
    return { required: 45, nextBelt: 'Brown' };
  }
  if (currentClean === 'brown' || currentClean.trim() === 'brown') {
    return { required: 50, nextBelt: 'Brown 1+2' };
  }
  if (currentClean.includes('brown 1+2') || currentClean.includes('brown 1 + 2')) {
    return { required: 55, nextBelt: 'Brown 3+4' };
  }
  if (currentClean.includes('brown 3+4') || currentClean.includes('brown 3 + 4')) {
    return { required: 60, nextBelt: 'Black 1st Dan' };
  }
  if (currentClean.includes('white') || currentClean.includes('beginner')) {
    return { required: 15, nextBelt: 'Yellow' };
  }
  return { required: 60, nextBelt: 'Black 1st Dan' };
};

export const checkExamPassed = (exam: any): boolean => {
  if (!exam) return false;
  const s = (exam.status || '').toString().toLowerCase().trim();
  if (s === 'failed' || s === 'rejected') return false;
  if (s === 'passed' || s === 'promoted' || s === 'approved' || s === 'pass' || s === 'completed' || s === 'graduated') return true;
  if (exam.isPublished !== false && s !== 'pending') return true;
  return false;
};

export const getEffectiveDisciplinesGrades = (exam: any): DisciplineGrades => {
  if (!exam) return { run: 'A', jump: 'A', sidesitups: 'A', kicks: 'A', conditionChecking: 'A', kata: 'A', kumite: 'A' };
  
  const existing = exam.disciplinesGrades || {};
  const baseGrade = exam.grade || (calculateOverallGrade(existing)) || 'A';

  return {
    run: existing.run || baseGrade || 'A',
    jump: existing.jump || baseGrade || 'A',
    sidesitups: existing.sidesitups || existing.situps || baseGrade || 'A',
    kicks: existing.kicks || baseGrade || 'A',
    conditionChecking: existing.conditionChecking || existing.stamina || baseGrade || 'A',
    kata: existing.kata || baseGrade || 'A',
    kumite: existing.kumite || baseGrade || 'A',
  };
};

export const getEffectiveGrade = (exam: any): string => {
  if (!exam) return 'A';
  if (exam.grade && String(exam.grade).trim()) return String(exam.grade).trim();
  if (exam.disciplinesGrades) {
    const calculated = calculateOverallGrade(exam.disciplinesGrades);
    if (calculated) return calculated;
  }
  return 'A';
};

interface ExamRecord {
  id: string;
  studentId: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  branch: string;
  coachName: string;
  currentBelt: string;
  targetBelt: string;
  status: 'pending' | 'approved' | 'passed' | 'failed';
  feesStatus: 'Paid' | 'Pending';
  examScheduleId?: string;
  examDate?: string;
  venueDetails?: string;
  grade?: string;
  remarks?: string;
  schoolName?: string;
  createdAt: number;
  updatedAt?: number;
  isPublished?: boolean;
  disciplinesGrades?: Record<string, string>;
}

interface BadgeDef {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  description: string;
  progressText: string;
  isUnlocked: boolean;
}

function KarateBeltGraphic({ beltName }: { beltName: string }) {
  const nameClean = beltName.toLowerCase();
  
  let mainColor = '#f8fafc';
  let shadingColor = '#cbd5e1';
  let isBlack = false;

  if (nameClean.includes('white')) {
    mainColor = '#f8fafc';
    shadingColor = '#cbd5e1';
  } else if (nameClean.includes('yellow')) {
    mainColor = '#facc15';
    shadingColor = '#d97706';
  } else if (nameClean.includes('orange')) {
    mainColor = '#f97316';
    shadingColor = '#c2410c';
  } else if (nameClean.includes('green')) {
    mainColor = '#10b981';
    shadingColor = '#047857';
  } else if (nameClean.includes('blue')) {
    mainColor = '#3b82f6';
    shadingColor = '#1d4ed8';
  } else if (nameClean.includes('purple')) {
    mainColor = '#a855f7';
    shadingColor = '#6d28d9';
  } else if (nameClean.includes('brown')) {
    mainColor = '#92400e';
    shadingColor = '#451a03';
  } else if (nameClean.includes('black')) {
    mainColor = '#18181b';
    shadingColor = '#09090b';
    isBlack = true;
  }

  return (
    <div className="w-full flex justify-center py-1 select-none">
      <svg viewBox="0 0 140 80" className="w-[90px] h-auto drop-shadow-[0_4px_6px_rgba(0,0,0,0.45)] filter">
        {/* Left Loop */}
        <path 
          d="M 40 36 C 20 36, 8 30, 8 20 C 8 10, 22 10, 38 18" 
          fill="none" 
          stroke={mainColor} 
          strokeWidth="11" 
          strokeLinecap="round" 
        />
        {/* Stitching on Left Loop */}
        <path 
          d="M 40 36 C 20 36, 8 30, 8 20 C 8 10, 22 10, 38 18" 
          fill="none" 
          stroke={isBlack ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.16)'} 
          strokeWidth="9" 
          strokeLinecap="round" 
          strokeDasharray="2,2" 
        />

        {/* Right Loop */}
        <path 
          d="M 100 36 C 120 36, 132 30, 132 20 C 132 10, 118 10, 102 18" 
          fill="none" 
          stroke={mainColor} 
          strokeWidth="11" 
          strokeLinecap="round" 
        />
        {/* Stitching on Right Loop */}
        <path 
          d="M 100 36 C 120 36, 132 30, 132 20 C 132 10, 118 10, 102 18" 
          fill="none" 
          stroke={isBlack ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.16)'} 
          strokeWidth="9" 
          strokeLinecap="round" 
          strokeDasharray="2,2" 
        />

        {/* Left Tail - angled down and left */}
        <path 
          d="M 58 42 C 46 51, 34 64, 38 72" 
          fill="none" 
          stroke={mainColor} 
          strokeWidth="11.5" 
          strokeLinecap="round" 
        />
        {/* Stitching on Left Tail */}
        <path 
          d="M 58 42 C 46 51, 34 64, 38 72" 
          fill="none" 
          stroke={isBlack ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)'} 
          strokeWidth="9.5" 
          strokeLinecap="round" 
          strokeDasharray="3,1.5" 
        />

        {/* Right Tail - angled down and right */}
        <path 
          d="M 82 42 C 94 51, 106 64, 102 72" 
          fill="none" 
          stroke={mainColor} 
          strokeWidth="11.5" 
          strokeLinecap="round" 
        />
        {/* Stitching on Right Tail */}
        <path 
          d="M 82 42 C 94 51, 106 64, 102 72" 
          fill="none" 
          stroke={isBlack ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)'} 
          strokeWidth="9.5" 
          strokeLinecap="round" 
          strokeDasharray="3,1.5" 
        />

        {/* Left Back Knot backing */}
        <rect x="56" y="27" width="28" height="15" rx="3" fill={shadingColor} stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />

        {/* Center Knot loops / overlapping fold */}
        <path 
          d="M 54 29 C 54 29, 70 24, 86 32 C 86 32, 84 44, 70 42 C 56 40, 54 29, 54 29 Z" 
          fill={mainColor} 
          stroke="rgba(0,0,0,0.2)" 
          strokeWidth="1" 
        />
        <path 
          d="M 54 29 C 54 29, 70 24, 86 32 C 86 32, 84 44, 70 42 C 56 40, 54 29, 54 29 Z" 
          fill="none" 
          stroke={isBlack ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)'} 
          strokeWidth="1" 
          strokeDasharray="1.5,1.5" 
        />

        {/* Wrapping overlay fold */}
        <path 
          d="M 62 25 C 74 27, 81 35, 78 44 C 74 48, 62 44, 62 35 Z" 
          fill={shadingColor} 
          stroke="rgba(0,0,0,0.25)" 
          strokeWidth="0.75" 
        />

        {/* Embroidery Details */}
        {isBlack ? (
          <>
            {/* Dan bar rank embroidery (gold/orange stripes) */}
            <path d="M 37 66 Q 38 69 39 71" stroke="#fbbf24" strokeWidth="8.5" strokeLinecap="butt" />
          </>
        ) : (
          <>
            {/* Small brand label on tip */}
            <rect x="36" y="66" width="5.5" height="4.5" rx="0.5" fill="#ffffff" stroke="rgba(0,0,0,0.3)" strokeWidth="0.3" transform="rotate(-15 37 67)" />
          </>
        )}
      </svg>
    </div>
  );
}

function StudentPortalSkeleton() {
  return (
    <div className="space-y-8 animate-pulse text-left">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/20 border border-zinc-900 p-5 rounded-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-zinc-850" />
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-24 h-4 bg-zinc-800 rounded" />
              <div className="h-1 w-1 rounded-full bg-zinc-700" />
              <div className="w-32 h-3 bg-zinc-900 rounded" />
            </div>
            <div className="w-48 h-6 bg-zinc-800 rounded" />
            <div className="w-36 h-3 bg-zinc-900 rounded" />
          </div>
        </div>
        <div className="w-32 h-10 bg-zinc-900 rounded-lg" />
      </div>

      {/* Progress & Belt graphics placeholder */}
      <div className="bg-slate-900/20 border border-zinc-900 p-6 sm:p-8 rounded-2xl text-center space-y-6">
        <div className="w-32 h-16 bg-zinc-850 rounded-xl mx-auto" />
        <div className="space-y-2 max-w-sm mx-auto">
          <div className="w-32 h-4 bg-zinc-800 rounded mx-auto" />
          <div className="w-48 h-3 bg-zinc-900 rounded mx-auto" />
        </div>
        <div className="max-w-xl mx-auto space-y-2">
          <div className="flex justify-between text-xs text-zinc-500">
            <div className="w-20 h-3 bg-zinc-900 rounded" />
            <div className="w-16 h-3 bg-zinc-900 rounded" />
          </div>
          <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden">
            <div className="w-3/5 h-full bg-zinc-800 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4 border-t border-zinc-900/40">
          <div className="bg-slate-950/40 p-4 rounded-xl border border-zinc-900/30 space-y-2">
            <div className="w-16 h-3 bg-zinc-900 rounded mx-auto" />
            <div className="w-24 h-4 bg-zinc-800 rounded mx-auto" />
          </div>
          <div className="bg-slate-950/40 p-4 rounded-xl border border-zinc-900/30 space-y-2">
            <div className="w-16 h-3 bg-zinc-900 rounded mx-auto" />
            <div className="w-24 h-4 bg-zinc-800 rounded mx-auto" />
          </div>
          <div className="bg-slate-950/40 p-4 rounded-xl border border-zinc-900/30 space-y-2">
            <div className="w-16 h-3 bg-zinc-900 rounded mx-auto" />
            <div className="w-24 h-4 bg-zinc-800 rounded mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AttendanceSkeleton() {
  return (
    <div className="bg-slate-900/10 border border-zinc-900/50 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse text-left">
      <div className="space-y-3 flex-grow w-full">
        <div className="w-36 h-4 bg-zinc-850 rounded" />
        <div className="w-56 h-5 bg-zinc-805 rounded" />
        <div className="w-full h-3 bg-zinc-900 rounded mt-2" />
      </div>
      <div className="w-28 h-9 bg-zinc-850 rounded-lg shrink-0 w-full md:w-auto" />
    </div>
  );
}

function ExamsHistoricalSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-slate-900/10 border border-zinc-900 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2 flex-grow w-full">
          <div className="flex items-center space-x-2">
            <div className="w-24 h-4.5 bg-zinc-850 rounded" />
            <div className="w-20 h-3 bg-zinc-900 rounded" />
          </div>
          <div className="h-16 bg-slate-950/30 rounded-xl border border-zinc-900/30 w-full" />
        </div>
        <div className="w-24 h-8 bg-zinc-850 rounded-lg shrink-0" />
      </div>
      <div className="bg-slate-900/10 border border-zinc-900 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2 flex-grow w-full">
          <div className="flex items-center space-x-2">
            <div className="w-24 h-4.5 bg-zinc-850 rounded" />
            <div className="w-20 h-3 bg-zinc-900 rounded" />
          </div>
          <div className="h-16 bg-slate-950/30 rounded-xl border border-zinc-900/30 w-full" />
        </div>
        <div className="w-24 h-8 bg-zinc-850 rounded-lg shrink-0" />
      </div>
    </div>
  );
}

// Helper function to normalize search strings (handles smart dashes, non-breaking spaces, mobile autocomplete Unicode characters)
export function normalizeSearchString(rawStr: string): string {
  if (!rawStr) return '';
  return rawStr
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function for flexible, bulletproof student ID matching (handles padding like LKCP-2026-173 vs LKCP-2026-0173, spaces, dashes, different years, etc.)
export function checkStudentIdMatch(targetStr: string, queryStr: string): boolean {
  if (!targetStr || !queryStr) return false;

  const tCleaned = normalizeSearchString(targetStr);
  const qCleaned = normalizeSearchString(queryStr);

  const tUpper = tCleaned.toUpperCase();
  const qUpper = qCleaned.toUpperCase();

  // 1. Exact string match (e.g. "LKCP-2026-175" === "LKCP-2026-175")
  if (tUpper === qUpper) return true;

  // 2. Clean alphanumeric match (ignoring dashes, spaces, symbols: "LKCP2026175" === "LKCP2026175")
  const tClean = tUpper.replace(/[^A-Z0-9]/g, '');
  const qClean = qUpper.replace(/[^A-Z0-9]/g, '');
  if (tClean && qClean && tClean === qClean) return true;

  // 3. Extract Year & Serial Numbers (e.g. LKCP-2026-114 vs LKCP-2025-114, 114, LKCP-2026-0114, etc.)
  const tNumMatches = tUpper.match(/\d+/g) || [];
  const qNumMatches = qUpper.match(/\d+/g) || [];

  if (tNumMatches.length > 0 && qNumMatches.length > 0) {
    const tLastNum = parseInt(tNumMatches[tNumMatches.length - 1], 10);
    const qLastNum = parseInt(qNumMatches[qNumMatches.length - 1], 10);

    // If numerical serials match EXACTLY (e.g. 114 === 114)
    if (!isNaN(tLastNum) && !isNaN(qLastNum) && tLastNum === qLastNum) {
      return true;
    }
  }

  // 4. Raw digits match (e.g., target "2026175" vs query "2026175")
  const tDigits = tUpper.replace(/\D/g, '');
  const qDigits = qUpper.replace(/\D/g, '');
  if (tDigits && qDigits) {
    const tNum = parseInt(tDigits, 10);
    const qNum = parseInt(qDigits, 10);
    if (!isNaN(tNum) && !isNaN(qNum) && tNum === qNum) return true;
  }

  return false;
}

// Persistent Local Storage & High-Speed Memory Cache Keys
const LOCAL_STUDENTS_CACHE_KEY = 'lkcp_cached_students_v3';
const LOCAL_EXAMS_CACHE_KEY = 'lkcp_cached_exams_v3';

export function saveStudentToLocalCache(student: Admission) {
  if (!student || !student.studentId) return;
  try {
    const raw = safeLocalStorage.getItem(LOCAL_STUDENTS_CACHE_KEY);
    const existing: Admission[] = raw ? JSON.parse(raw) : [];
    
    const cleanId = (student.studentId || '').trim().toUpperCase();
    const cleanName = (student.fullName || '').trim().toLowerCase();

    const filtered = existing.filter(s => {
      const sId = (s.studentId || '').trim().toUpperCase();
      const sName = (s.fullName || '').trim().toLowerCase();
      if (cleanId && sId && cleanId === sId) return false;
      if (cleanName && sName && cleanName === sName && s.phone === student.phone) return false;
      return true;
    });

    filtered.unshift({
      ...student,
      updatedAt: Date.now()
    });

    safeLocalStorage.setItem(LOCAL_STUDENTS_CACHE_KEY, JSON.stringify(filtered.slice(0, 150)));
  } catch (e) {
    console.warn("Local student cache save notice:", e);
  }
}

export function saveExamToLocalCache(exam: ExamRecord) {
  if (!exam || !exam.id || exam.id.startsWith('verified-exam-')) return;
  try {
    const raw = safeLocalStorage.getItem(LOCAL_EXAMS_CACHE_KEY);
    const existing: ExamRecord[] = raw ? JSON.parse(raw) : [];

    const filtered = existing.filter(e => e.id !== exam.id && !e.id.startsWith('verified-exam-'));
    filtered.unshift({
      ...exam,
      updatedAt: Date.now()
    });

    safeLocalStorage.setItem(LOCAL_EXAMS_CACHE_KEY, JSON.stringify(filtered.slice(0, 150)));
  } catch (e) {
    console.warn("Local exam cache save notice:", e);
  }
}

export function searchLocalCache(queryStr: string): { student: Admission | null; score: number; exams: ExamRecord[] } {
  if (!queryStr) return { student: null, score: 0, exams: [] };
  const cleanRaw = normalizeSearchString(queryStr);
  if (!cleanRaw) return { student: null, score: 0, exams: [] };

  const searchUpper = cleanRaw.toUpperCase();
  const searchLower = cleanRaw.toLowerCase();
  const searchDigits = cleanRaw.replace(/\D/g, '');

  let bestStudent: Admission | null = null;
  let bestScore = 0;

  try {
    const rawSt = safeLocalStorage.getItem(LOCAL_STUDENTS_CACHE_KEY);
    const cachedStudents: Admission[] = rawSt ? JSON.parse(rawSt) : [];

    for (const st of cachedStudents) {
      const stId = (st.studentId || '').toUpperCase();
      const stName = (st.fullName || '').toLowerCase();
      const parentPhone = (st.phone || st.whatsApp || '').replace(/\D/g, '');

      if (stId === searchUpper || checkStudentIdMatch(stId, cleanRaw)) {
        bestScore = 1000;
        bestStudent = st;
        break;
      } else if (stName === searchLower || (stName && searchLower && searchLower.length >= 3 && stName.includes(searchLower))) {
        if (bestScore < 800) {
          bestScore = 800;
          bestStudent = st;
        }
      } else if (searchDigits.length >= 7 && parentPhone.includes(searchDigits)) {
        if (bestScore < 750) {
          bestScore = 750;
          bestStudent = st;
        }
      }
    }

    const rawEx = safeLocalStorage.getItem(LOCAL_EXAMS_CACHE_KEY);
    const rawCachedExams: ExamRecord[] = rawEx ? JSON.parse(rawEx) : [];
    // Filter out synthesized records
    const cachedExams = rawCachedExams.filter(e => !e.id || !e.id.startsWith('verified-exam-'));

    if (!bestStudent) {
      for (const ex of cachedExams) {
        const exStudentId = (ex.studentId || '').toUpperCase();
        const exName = (ex.studentName || '').toLowerCase();

        if (exStudentId === searchUpper || checkStudentIdMatch(exStudentId, cleanRaw)) {
          bestScore = 950;
          bestStudent = {
            id: ex.id || ('st_' + exStudentId),
            studentId: exStudentId,
            fullName: ex.studentName || 'Karate Student',
            parentName: ex.parentName || '',
            phone: ex.parentPhone || '',
            whatsApp: ex.parentPhone || '',
            beltLevel: ex.currentBelt || ex.targetBelt || 'Shotokan Belt',
            branch: ex.branch || DOJO_BRANCHES[0].name,
            schoolName: ex.schoolName || '',
            status: 'approved',
            createdAt: ex.createdAt || Date.now(),
            updatedAt: ex.updatedAt || Date.now()
          } as Admission;
          break;
        } else if (exName && searchLower && searchLower.length >= 3 && exName.includes(searchLower)) {
          if (bestScore < 800) {
            bestScore = 800;
            bestStudent = {
              id: ex.id || ('st_' + exStudentId),
              studentId: exStudentId || searchUpper,
              fullName: ex.studentName || 'Karate Student',
              parentName: ex.parentName || '',
              phone: ex.parentPhone || '',
              whatsApp: ex.parentPhone || '',
              beltLevel: ex.currentBelt || ex.targetBelt || 'Shotokan Belt',
              branch: ex.branch || DOJO_BRANCHES[0].name,
              schoolName: ex.schoolName || '',
              status: 'approved',
              createdAt: ex.createdAt || Date.now(),
              updatedAt: ex.updatedAt || Date.now()
            } as Admission;
          }
        }
      }
    }

    let matchingExams: ExamRecord[] = [];
    if (bestStudent) {
      const stId = (bestStudent.studentId || '').toUpperCase();
      const stName = (bestStudent.fullName || '').toLowerCase();

      matchingExams = cachedExams.filter(e => {
        const eId = (e.studentId || '').toUpperCase();
        const eName = (e.studentName || '').toLowerCase();
        return (stId && eId && checkStudentIdMatch(eId, stId)) || (stName && eName && (eName.includes(stName) || stName.includes(eName)));
      });
    }

    return { student: bestStudent, score: bestScore, exams: matchingExams };
  } catch (e) {
    console.warn("Local cache search notice:", e);
    return { student: null, score: 0, exams: [] };
  }
}

interface StudentPortalProps {
  initialTab?: 'progress' | 'exam' | 'attendance';
  initialStudentId?: string;
  onNavigate?: (view: 'home' | 'admission' | 'student-portal' | 'admin') => void;
}

export default function StudentPortal({ initialTab = 'progress', initialStudentId, onNavigate }: StudentPortalProps) {
  const [activeTab, setActiveTabState] = useState<'progress' | 'exam' | 'attendance'>(initialTab);

  useEffect(() => {
    setActiveTabState(initialTab);
  }, [initialTab]);

  // Clean up legacy synthesized exam records from local cache
  useEffect(() => {
    try {
      const raw = safeLocalStorage.getItem(LOCAL_EXAMS_CACHE_KEY);
      if (raw) {
        const existing: ExamRecord[] = JSON.parse(raw);
        const cleaned = existing.filter(e => !e.id || !e.id.startsWith('verified-exam-'));
        if (cleaned.length !== existing.length) {
          safeLocalStorage.setItem(LOCAL_EXAMS_CACHE_KEY, JSON.stringify(cleaned));
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const [studentIdInput, setStudentIdInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [activeStudent, setActiveStudent] = useState<Admission | null>(null);
  const [searchError, setSearchError] = useState('');
  const [searchNonce, setSearchNonce] = useState(0);
  
  // Exams related states
  const [registeredExams, setRegisteredExams] = useState<ExamRecord[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [showExamForm, setShowExamForm] = useState(false);
  const [selectedCert, setSelectedCert] = useState<ExamRecord | null>(null);
  const [downloadingCert, setDownloadingCert] = useState(false);
  const [selectedExamDateFilter, setSelectedExamDateFilter] = useState<string>('all');
  const [showIDCardModal, setShowIDCardModal] = useState(false);

  // Belt Progress Celebration states
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebratedBeltName, setCelebratedBeltName] = useState<string>('Shotokan Belt');
  const lastCelebratedBeltRef = React.useRef<string | null>(null);

  const triggerBeltCelebration = (beltName?: string) => {
    const targetBelt = beltName || activeStudent?.beltLevel || 'Shotokan Belt';
    setCelebratedBeltName(targetBelt);
    setShowCelebrationModal(true);

    // Audio chime
    try {
      playKarateBell();
    } catch (e) {
      console.error("Audio error:", e);
    }

    // High impact celebratory confetti fireworks
    try {
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.55 },
        zIndex: 100000
      });

      const duration = 2.8 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 35, spread: 360, ticks: 60, zIndex: 100000 };

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 45 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.35 + 0.05, y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.35 + 0.6, y: Math.random() - 0.2 } });
      }, 250);
    } catch (err) {
      console.error("Confetti error:", err);
    }
  };

  // Dynamic automated badge calculations with zero overhead
  const getStudentBadges = (): BadgeDef[] => {
    if (!activeStudent) return [];
    
    const hasPassedExam = registeredExams.some(e => checkExamPassed(e));
    const hasHighScore = registeredExams.some(e => 
      checkExamPassed(e) && 
      e.grade && 
      ['A', 'A+', 'OUTSTANDING', 'DISTINCTION', 'EXCELLENT', 'A GRADE'].includes(e.grade.trim().toUpperCase())
    );
    const isPastWhite = activeStudent.beltLevel.toLowerCase() !== 'white belt' && 
                        !activeStudent.beltLevel.toLowerCase().includes('white');

    return [
      {
        id: 'first-step',
        name: 'First Step',
        icon: Sparkles,
        color: 'text-sky-400',
        borderColor: 'border-sky-500/20',
        bgColor: 'bg-sky-500/10',
        textColor: 'text-sky-300',
        description: 'Attended your first offline karate training session. Welcome to the Dojo!',
        progressText: attendanceCount >= 1 ? 'Unlocked!' : '0 / 1 Class',
        isUnlocked: attendanceCount >= 1
      },
      {
        id: 'loyal-lion',
        name: 'Dedicated Lion',
        icon: Flame,
        color: 'text-amber-500',
        borderColor: 'border-amber-500/20',
        bgColor: 'bg-amber-500/10',
        textColor: 'text-amber-300',
        description: 'Completed 15 classes of high-intensity training. True consistency!',
        progressText: `${Math.min(attendanceCount, 15)} / 15 Classes`,
        isUnlocked: attendanceCount >= 15
      },
      {
        id: 'perfect-attendance',
        name: 'Perfect Attendance',
        icon: Clock,
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/20',
        bgColor: 'bg-emerald-500/10',
        textColor: 'text-emerald-300',
        description: 'Completed 30 or more training sessions. Unstoppable dedication!',
        progressText: `${Math.min(attendanceCount, 30)} / 30 Classes`,
        isUnlocked: attendanceCount >= 30
      },
      {
        id: 'resilient-warrior',
        name: 'Resilient Warrior',
        icon: ShieldCheck,
        color: 'text-indigo-400',
        borderColor: 'border-indigo-500/20',
        bgColor: 'bg-indigo-500/10',
        textColor: 'text-indigo-300',
        description: 'Successfully promoted past White Belt rank. No longer a beginner!',
        progressText: isPastWhite ? 'Unlocked!' : 'Reach Yellow Belt+',
        isUnlocked: isPastWhite
      },
      {
        id: 'first-promo',
        name: 'First Promotion',
        icon: GraduationCap,
        color: 'text-purple-400',
        borderColor: 'border-purple-500/20',
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-300',
        description: 'Challenged the senseis and successfully passed your first promotion exam!',
        progressText: hasPassedExam ? 'Unlocked!' : '0 / 1 Passed Exam',
        isUnlocked: hasPassedExam
      },
      {
        id: 'kata-master',
        name: 'Kata Master',
        icon: Star,
        color: 'text-yellow-400',
        borderColor: 'border-yellow-500/20',
        bgColor: 'bg-yellow-500/10',
        textColor: 'text-yellow-300',
        description: "Achieved an 'A' grade or Outstanding performance on a belt grading test.",
        progressText: hasHighScore ? 'Unlocked!' : 'Grade A in any Exam',
        isUnlocked: hasHighScore
      }
    ];
  };

  const parseColorValues = (str: string): number[] => {
    const matches = str.match(/[-+]?[0-9]*\.?[0-9]+%?/g);
    if (!matches) return [0, 0, 0, 1];
    return matches.map(m => {
      if (m.endsWith('%')) {
        return parseFloat(m) / 100;
      }
      return parseFloat(m);
    });
  };

  const oklchToHsl = (l: number, c: number, h: number, a: number = 1): string => {
    const hue = h;
    const lightness = Math.min(100, Math.max(0, l * 100));
    const saturation = Math.min(100, Math.max(0, (c / 0.4) * 100));
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${a})`;
  };

  const oklabToHsl = (l: number, a: number, b: number, alpha: number = 1): string => {
    const c = Math.sqrt(a * a + b * b);
    let h = Math.atan2(b, a) * (180 / Math.PI);
    if (h < 0) h += 360;
    return oklchToHsl(l, c, h, alpha);
  };

  const convertUnsupportedColors = (colorStr: string): string => {
    if (typeof colorStr !== 'string') return colorStr;
    let result = colorStr;
    const oklchRegex = /oklch\([^)]+\)/gi;
    result = result.replace(oklchRegex, (match) => {
      const vals = parseColorValues(match);
      const l = vals[0] !== undefined ? vals[0] : 0;
      const c = vals[1] !== undefined ? vals[1] : 0;
      const h = vals[2] !== undefined ? vals[2] : 0;
      const a = vals[3] !== undefined ? vals[3] : 1;
      return oklchToHsl(l, c, h, a);
    });
    
    const oklabRegex = /oklab\([^)]+\)/gi;
    result = result.replace(oklabRegex, (match) => {
      const vals = parseColorValues(match);
      const l = vals[0] !== undefined ? vals[0] : 0;
      const aVal = vals[1] !== undefined ? vals[1] : 0;
      const bVal = vals[2] !== undefined ? vals[2] : 0;
      const alpha = vals[3] !== undefined ? vals[3] : 1;
      return oklabToHsl(l, aVal, bVal, alpha);
    });
    
    return result;
  };

  const sanitizeUnsupportedColors = (css: string): string => {
    return convertUnsupportedColors(css);
  };

  const handlePrintCertificate = () => {
    const element = document.getElementById('printable-certificate-el');
    if (!element) return;

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Lions Karate Club Certificate</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&family=Inter:wght@400;700;900&display=swap');
            @page {
              size: A4 landscape;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              width: 297mm;
              height: 210mm;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            .printable-certificate {
              width: 297mm;
              height: 210mm;
              background-color: #fffbeb !important;
              color: #0c0a09 !important;
              border: 16px double #b45309 !important;
              border-radius: 16px;
              padding: 12mm 16mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              font-family: Georgia, serif;
              position: relative;
              text-align: center;
            }
            /* Style children elements to render exactly like preview */
            .matches-header {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .matches-header img {
              width: 80px;
              height: 80px;
              margin-bottom: 8px;
              border-radius: 9999px;
              background-color: #ffffff;
              padding: 2px;
              border: 1px solid #fcd34d;
            }
            .matches-header h4 {
              font-size: 24px;
              letter-spacing: 0.25em;
              line-height: 1.2;
              color: #FF3B3F;
              font-weight: 900;
              text-transform: uppercase;
              text-align: center;
              margin: 0;
            }
            .matches-header p {
              font-size: 12px;
              letter-spacing: 0.1em;
              color: #52525b;
              text-transform: uppercase;
              font-weight: 800;
              margin-top: 6px;
            }
            h2 {
              font-size: 34px;
              font-weight: 850;
              color: #78350f;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              font-style: italic;
              margin: 0;
            }
            .line-divider {
              width: 180px;
              height: 3px;
              background-color: #d97706;
              margin: 8px auto 0;
            }
            .statement-body {
              margin-top: 20px;
              margin-bottom: 20px;
              line-height: 1.6;
            }
            .statement-body p:first-child {
              font-size: 15px;
              font-style: italic;
              color: #71717a;
            }
            .student-name {
              font-size: 28px;
              font-weight: 800;
              color: #0c0a09;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-bottom: 1px solid #e4e4e7;
              padding-bottom: 6px;
              max-width: 550px;
              margin: 10px auto;
            }
            .promo-text {
              font-size: 13.5px;
              line-height: 1.6;
              max-width: 780px;
              margin: 12px auto;
              color: #27272a;
              font-style: italic;
            }
            .belt-promo {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .belt-text {
              font-size: 22px;
              font-weight: 900;
              color: #b45309;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              margin: 0;
            }
            .grade-badge {
              font-size: 13px;
              font-weight: bold;
              color: #15803d;
              background-color: #f0fdf4;
              padding: 4px 12px;
              border-radius: 4px;
              border: 1px solid #bbf7d0;
              margin-top: 8px;
              display: inline-block;
            }
            .student-id {
              font-size: 10px;
              color: #71717a;
              margin-top: 10px;
            }
            .institution {
              font-size: 13px;
              color: #92400e;
              margin-top: 8px;
              font-weight: bold;
            }
            .journey-note {
              margin-top: 20px;
              padding: 12px 24px;
              max-width: 700px;
              background-color: rgba(254, 243, 199, 0.4);
              border: 1px solid rgba(251, 191, 36, 0.5);
              border-radius: 8px;
              margin: 20px auto 0;
            }
            .journey-note p {
              font-size: 11.5px;
              line-height: 1.5;
              color: #4b5563;
              font-style: italic;
              margin: 0;
            }
            .signature-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 80px;
              margin-top: 40px;
              padding-top: 10px;
              width: 100%;
            }
            .sig-col {
              text-align: center;
            }
            .sig-line {
              font-size: 14px;
              font-style: italic;
              font-weight: 600;
              color: #4b5563;
              border-bottom: 1px solid #e4e4e7;
              padding: 0 10px 4px;
              display: inline-block;
            }
            .sig-title {
              font-size: 11px;
              font-weight: bold;
              color: #71717a;
              margin-top: 6px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
          </style>
        </head>
        <body>
          <div class="printable-certificate">
            ${element.innerHTML}
          </div>
          <script>
            // Add custom styles to replicate exactly
            const watermark = document.querySelector('.absolute.inset-0.flex');
            if (watermark) {
              watermark.style.opacity = '0.04';
              const svg = watermark.querySelector('svg');
              if (svg) {
                svg.style.width = '350px';
                svg.style.height = '350px';
              }
            }
            // Ensure images have crossorigin
            const imgs = document.querySelectorAll('img');
            let loadedCount = 0;
            if (imgs.length === 0) {
              triggerPrint();
            } else {
              imgs.forEach(img => {
                if (img.complete) {
                  checkAllLoaded();
                } else {
                  img.onload = checkAllLoaded;
                  img.onerror = checkAllLoaded;
                }
              });
            }
            function checkAllLoaded() {
              loadedCount++;
              if (loadedCount >= imgs.length) {
                triggerPrint();
              }
            }
            function triggerPrint() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.frameElement.parentNode.removeChild(window.frameElement);
                }, 1000);
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  const handleDownloadCertificatePDF = async () => {
    if (!selectedCert) return;
    setDownloadingCert(true);
    
    const originalStyles = new Map<HTMLElement, string>();
    const tempStyles: HTMLStyleElement[] = [];
    let clonedElement: HTMLElement | null = null;
    let wrapper: HTMLElement | null = null;
    
    const originalGetComputedStyle = window.getComputedStyle;
    const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;
    const cssRulesDescriptor = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, 'cssRules');
    
    try {
      const element = document.getElementById('printable-certificate-el');
      if (!element) {
        console.error("Printable certificate element not found");
        return;
      }

      window.getComputedStyle = function (elt, pseudoElt) {
        const style = originalGetComputedStyle(elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === 'getPropertyValue') {
              return function (propertyName: string) {
                const val = target.getPropertyValue(propertyName);
                if (typeof val === 'string' && (val.toLowerCase().includes('oklch') || val.toLowerCase().includes('oklab'))) {
                  return convertUnsupportedColors(val);
                }
                return val;
              };
            }
            
            const value = Reflect.get(target, prop);
            if (typeof value === 'function') {
              return value.bind(target);
            }
            if (typeof value === 'string' && (value.toLowerCase().includes('oklch') || value.toLowerCase().includes('oklab'))) {
              return convertUnsupportedColors(value);
            }
            return value;
          }
        });
      };

      CSSStyleDeclaration.prototype.getPropertyValue = function (property: string) {
        const value = originalGetPropertyValue.call(this, property);
        if (typeof value === 'string' && (value.toLowerCase().includes('oklch') || value.toLowerCase().includes('oklab'))) {
          return convertUnsupportedColors(value);
        }
        return value;
      };

      if (cssRulesDescriptor && cssRulesDescriptor.get) {
        const originalCssRulesGet = cssRulesDescriptor.get;
        Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', {
          get() {
            const rules = originalCssRulesGet.call(this);
            if (!rules) return rules;
            return new Proxy(rules, {
              get(target, prop) {
                if (prop === 'length') return target.length;
                if (prop === 'item') {
                  return function (index: number) {
                    return this[index];
                  };
                }
                
                const val = Reflect.get(target, prop);
                if (typeof val === 'object' && val !== null && 'style' in val) {
                  return new Proxy(val, {
                    get(ruleTarget, ruleProp) {
                      if (ruleProp === 'style') {
                        const style = ruleTarget.style;
                        return new Proxy(style, {
                          get(styleTarget, styleProp) {
                            if (styleProp === 'getPropertyValue') {
                              return function (propertyName: string) {
                                const v = styleTarget.getPropertyValue(propertyName);
                                if (typeof v === 'string' && (v.toLowerCase().includes('oklch') || v.toLowerCase().includes('oklab'))) {
                                  return convertUnsupportedColors(v);
                                }
                                return v;
                              };
                            }
                            const v = Reflect.get(styleTarget, styleProp);
                            if (typeof v === 'function') return v.bind(styleTarget);
                            if (typeof v === 'string' && (v.toLowerCase().includes('oklch') || v.toLowerCase().includes('oklab'))) {
                              return convertUnsupportedColors(v);
                            }
                            return v;
                          }
                        });
                      }
                      return Reflect.get(ruleTarget, ruleProp);
                    }
                  });
                }
                return val;
              }
            });
          },
          configurable: true
        });
      }

      const styleElements = Array.from(document.querySelectorAll('style'));
      styleElements.forEach((styleEl) => {
        const cssText = styleEl.textContent || '';
        if (cssText.toLowerCase().includes('oklch') || cssText.toLowerCase().includes('oklab')) {
          originalStyles.set(styleEl, cssText);
          styleEl.textContent = sanitizeUnsupportedColors(cssText);
        }
      });

      const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
      for (const linkEl of linkElements) {
        try {
          const url = linkEl.href;
          if (url && (url.startsWith(window.location.origin) || !url.startsWith('http'))) {
            const response = await fetch(url);
            if (response.ok) {
              const cssText = await response.text();
              if (cssText.toLowerCase().includes('oklch') || cssText.toLowerCase().includes('oklab')) {
                linkEl.disabled = true;
                originalStyles.set(linkEl, 'disabled');
                
                const tempStyle = document.createElement('style');
                tempStyle.textContent = sanitizeUnsupportedColors(cssText);
                document.head.appendChild(tempStyle);
                tempStyles.push(tempStyle);
              }
            }
          }
        } catch (linkErr) {
          console.warn("Could not process stylesheet link:", linkEl.href, linkErr);
        }
      }

      const opt = {
        margin:       0,
        filename:     `LKC_Certificate_${selectedCert.studentName.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg' as const, quality: 1.0 },
        html2canvas:  { scale: 2.5, useCORS: true, logging: false, letterRendering: true },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
      };

      // Create a hidden wrapper container with 0 dimensions so it doesn't disrupt user flow,
      // but keeps the clone fully present in the DOM so styles can be resolved correctly.
      wrapper = document.createElement('div');
      wrapper.id = 'pdf-download-wrapper';
      wrapper.style.position = 'absolute';
      wrapper.style.left = '0px';
      wrapper.style.top = '0px';
      wrapper.style.width = '0px';
      wrapper.style.height = '0px';
      wrapper.style.overflow = 'hidden';
      document.body.appendChild(wrapper);

      clonedElement = element.cloneNode(true) as HTMLElement;
      
      // Force high-resolution layout inside the wrapper (relative style so html2canvas computes it normally)
      clonedElement.style.position = 'relative';
      clonedElement.style.width = '1120px';
      clonedElement.style.height = '792px';
      clonedElement.style.display = 'flex';
      clonedElement.style.flexDirection = 'column';
      clonedElement.style.justifyContent = 'space-between';
      clonedElement.style.padding = '50px 70px';
      clonedElement.style.boxSizing = 'border-box';
      clonedElement.style.background = '#fffbeb';
      clonedElement.style.color = '#0c0a09';
      clonedElement.style.border = '16px double #b45309';
      clonedElement.style.borderRadius = '16px';
      clonedElement.style.fontFamily = 'Georgia, serif';

      // Ensure all images inside the clone have crossorigin and cache buster
      const clonedImages = Array.from(clonedElement.querySelectorAll('img'));
      clonedImages.forEach((img) => {
        img.setAttribute('crossorigin', 'anonymous');
        try {
          const url = new URL(img.src);
          url.searchParams.set('cors', 'true');
          img.src = url.toString();
        } catch (e) {
          // Fallback if not a valid full URL
        }
      });

      wrapper.appendChild(clonedElement);

      // Watermark symbol
      const watermark = clonedElement.querySelector('.absolute.inset-0.flex') as HTMLElement;
      if (watermark) {
        watermark.style.position = 'absolute';
        watermark.style.inset = '0';
        watermark.style.display = 'flex';
        watermark.style.alignItems = 'center';
        watermark.style.justifyContent = 'center';
        watermark.style.opacity = '0.04';
        watermark.style.pointerEvents = 'none';
        const svgAward = watermark.querySelector('svg') as unknown as HTMLElement;
        if (svgAward) {
          svgAward.style.width = '350px';
          svgAward.style.height = '350px';
          svgAward.style.color = '#78350f';
        }
      }

      // Elegant Pass Stamp Badge
      const passStamp = clonedElement.querySelector('.absolute.top-3.right-3, .absolute.top-5.right-6') as HTMLElement;
      if (passStamp) {
        passStamp.style.position = 'absolute';
        passStamp.style.top = '30px';
        passStamp.style.right = '40px';
        passStamp.style.zIndex = '20';
        const innerBadge = passStamp.firstElementChild as HTMLElement;
        if (innerBadge) {
          innerBadge.style.borderWidth = '2px';
          innerBadge.style.borderColor = '#059669';
          innerBadge.style.color = '#059669';
          innerBadge.style.backgroundColor = '#ecfdf5';
          innerBadge.style.borderRadius = '4px';
          innerBadge.style.padding = '4px 12px';
          innerBadge.style.fontSize = '14px';
          innerBadge.style.fontWeight = '900';
          innerBadge.style.letterSpacing = '0.15em';
          innerBadge.style.textTransform = 'uppercase';
          innerBadge.style.transform = 'rotate(12deg)';
        }
      }

      // Top Header with official Club Logo
      const headerDiv = clonedElement.querySelector('.matches-header') as HTMLElement;
      if (headerDiv) {
        headerDiv.style.position = 'relative';
        headerDiv.style.zIndex = '10';
        headerDiv.style.display = 'flex';
        headerDiv.style.flexDirection = 'column';
        headerDiv.style.alignItems = 'center';
        headerDiv.style.justifyContent = 'center';
        
        const logoImg = headerDiv.querySelector('img') as HTMLElement;
        if (logoImg) {
          logoImg.style.width = '80px';
          logoImg.style.height = '80px';
          logoImg.style.marginBottom = '8px';
          logoImg.style.borderRadius = '9999px';
          logoImg.style.backgroundColor = '#ffffff';
          logoImg.style.padding = '2px';
          logoImg.style.border = '1px solid #fcd34d';
        }

        const titleText = headerDiv.querySelector('h4') as HTMLElement;
        if (titleText) {
          titleText.style.fontSize = '24px';
          titleText.style.letterSpacing = '0.25em';
          titleText.style.lineHeight = '1.2';
          titleText.style.color = '#FF3B3F';
          titleText.style.fontWeight = '900';
          titleText.style.textTransform = 'uppercase';
          titleText.style.textAlign = 'center';
        }

        const subtitleText = titleText?.nextElementSibling as HTMLElement;
        if (subtitleText) {
          subtitleText.style.fontSize = '12px';
          subtitleText.style.letterSpacing = '0.1em';
          subtitleText.style.color = '#52525b';
          subtitleText.style.textTransform = 'uppercase';
          subtitleText.style.fontWeight = '800';
          subtitleText.style.marginTop = '6px';
        }
      }

      // Main Title
      const titleContainer = clonedElement.querySelector('h2')?.parentElement as HTMLElement;
      if (titleContainer) {
        titleContainer.style.marginTop = '15px';
        titleContainer.style.marginBottom = '15px';
        titleContainer.style.position = 'relative';
        titleContainer.style.zIndex = '10';

        const mainTitleHeader = titleContainer.querySelector('h2') as HTMLElement;
        if (mainTitleHeader) {
          mainTitleHeader.style.fontSize = '34px';
          mainTitleHeader.style.fontWeight = '850';
          mainTitleHeader.style.color = '#78350f';
          mainTitleHeader.style.letterSpacing = '0.05em';
          mainTitleHeader.style.textTransform = 'uppercase';
          mainTitleHeader.style.fontStyle = 'italic';
        }

        const underline = mainTitleHeader?.nextElementSibling as HTMLElement;
        if (underline) {
          underline.style.width = '180px';
          underline.style.height = '3px';
          underline.style.backgroundColor = '#d97706';
          underline.style.margin = '8px auto 0';
        }
      }

      // Statement body elements
      const statementDiv = clonedElement.querySelector('.space-y-2\\.5, .space-y-3\\.5') as HTMLElement;
      if (statementDiv) {
        statementDiv.style.marginTop = '20px';
        statementDiv.style.marginBottom = '20px';
        statementDiv.style.position = 'relative';
        statementDiv.style.zIndex = '10';
        statementDiv.style.lineHeight = '1.6';
        
        const certTexts = Array.from(statementDiv.children) as HTMLElement[];
        if (certTexts.length >= 1) {
          certTexts[0].style.fontSize = '15px';
          certTexts[0].style.fontStyle = 'italic';
          certTexts[0].style.color = '#71717a';
        }
        if (certTexts.length >= 2) {
          certTexts[1].style.fontSize = '28px';
          certTexts[1].style.fontWeight = '800';
          certTexts[1].style.color = '#0c0a09';
          certTexts[1].style.textTransform = 'uppercase';
          certTexts[1].style.letterSpacing = '0.05em';
          certTexts[1].style.borderBottom = '1px solid #e4e4e7';
          certTexts[1].style.paddingBottom = '6px';
          certTexts[1].style.maxWidth = '550px';
          certTexts[1].style.margin = '10px auto';
        }
        if (certTexts.length >= 3) {
          certTexts[2].style.fontSize = '13.5px';
          certTexts[2].style.lineHeight = '1.6';
          certTexts[2].style.maxWidth = '780px';
          certTexts[2].style.margin = '12px auto';
          certTexts[2].style.color = '#27272a';
          certTexts[2].style.fontStyle = 'italic';
        }
        
        const beltPromoDiv = statementDiv.querySelector('.flex-col') as HTMLElement;
        if (beltPromoDiv) {
          beltPromoDiv.style.display = 'flex';
          beltPromoDiv.style.flexDirection = 'column';
          beltPromoDiv.style.alignItems = 'center';
          beltPromoDiv.style.justifyContent = 'center';

          const beltText = beltPromoDiv.firstElementChild as HTMLElement;
          if (beltText) {
            beltText.style.fontSize = '22px';
            beltText.style.fontWeight = '900';
            beltText.style.color = '#b45309';
            beltText.style.textTransform = 'uppercase';
            beltText.style.letterSpacing = '0.1em';
          }
          const gradeBadge = beltPromoDiv.lastElementChild as HTMLElement;
          if (gradeBadge && gradeBadge !== beltText) {
            gradeBadge.style.fontSize = '13px';
            gradeBadge.style.fontWeight = 'bold';
            gradeBadge.style.color = '#15803d';
            gradeBadge.style.backgroundColor = '#f0fdf4';
            gradeBadge.style.padding = '4px 12px';
            gradeBadge.style.borderRadius = '4px';
            gradeBadge.style.border = '1px solid #bbf7d0';
            gradeBadge.style.marginTop = '8px';
            gradeBadge.style.display = 'inline-block';
          }
        }

        const allPTags = Array.from(statementDiv.querySelectorAll('p')) as HTMLElement[];
        allPTags.forEach((p) => {
          if (p.textContent?.includes('Student ID:')) {
            p.style.fontSize = '10px';
            p.style.color = '#71717a';
            p.style.marginTop = '10px';
          }
          if (p.textContent?.includes('Academic Institution:')) {
            p.style.fontSize = '13px';
            p.style.color = '#92400e';
            p.style.marginTop = '8px';
            p.style.fontWeight = 'bold';
          }
        });
      }

      // Journey Note
      const journeyNote = clonedElement.querySelector('.bg-amber-100\\/40') as HTMLElement;
      if (journeyNote) {
        journeyNote.style.marginTop = '20px';
        journeyNote.style.padding = '12px 24px';
        journeyNote.style.maxWidth = '700px';
        journeyNote.style.backgroundColor = 'rgba(254, 243, 199, 0.4)';
        journeyNote.style.border = '1px solid rgba(251, 191, 36, 0.5)';
        journeyNote.style.borderRadius = '8px';
        journeyNote.style.margin = '20px auto 0';
        journeyNote.style.position = 'relative';
        journeyNote.style.zIndex = '10';

        const journeyText = journeyNote.querySelector('p') as HTMLElement;
        if (journeyText) {
          journeyText.style.fontSize = '11.5px';
          journeyText.style.lineHeight = '1.5';
          journeyText.style.color = '#4b5563';
          journeyText.style.fontStyle = 'italic';
        }
      }

      // Signature section
      const signatureGrid = clonedElement.querySelector('.grid-cols-2') as HTMLElement;
      if (signatureGrid) {
        signatureGrid.style.display = 'grid';
        signatureGrid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
        signatureGrid.style.gap = '80px';
        signatureGrid.style.marginTop = '40px';
        signatureGrid.style.paddingTop = '10px';
        signatureGrid.style.width = '100%';
        signatureGrid.style.position = 'relative';
        signatureGrid.style.zIndex = '10';
        
        const signCols = Array.from(signatureGrid.children) as HTMLElement[];
        signCols.forEach((col, cIdx) => {
          col.style.textAlign = 'center';
          const nameSpan = col.querySelector('.border-b') as HTMLElement;
          if (nameSpan) {
            nameSpan.style.fontSize = '14px';
            nameSpan.style.fontStyle = 'italic';
            nameSpan.style.fontWeight = '600';
            nameSpan.style.color = cIdx === 0 ? '#4b5563' : '#d97706';
            nameSpan.style.borderBottom = '1px solid #e4e4e7';
            nameSpan.style.padding = '0 10px 4px';
            nameSpan.style.display = 'inline-block';
          }
          const titleDiv = col.querySelector('.pt-1, .text-\\[8px\\]') as HTMLElement;
          if (titleDiv) {
            titleDiv.style.fontSize = '11px';
            titleDiv.style.fontWeight = 'bold';
            titleDiv.style.color = '#71717a';
            titleDiv.style.marginTop = '6px';
            titleDiv.style.textTransform = 'uppercase';
            titleDiv.style.letterSpacing = '0.05em';
          }
        });
      }

      const allClonedElements = [clonedElement, ...Array.from(clonedElement.querySelectorAll('*'))] as HTMLElement[];
      allClonedElements.forEach((el) => {
        if (el.style) {
          for (let i = 0; i < el.style.length; i++) {
            const propName = el.style[i];
            const val = el.style.getPropertyValue(propName);
            if (val && (val.toLowerCase().includes('oklch') || val.toLowerCase().includes('oklab'))) {
              el.style.setProperty(propName, convertUnsupportedColors(val));
            }
          }
        }
      });
      
      await html2pdf().set(opt).from(clonedElement).save();
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      if (clonedElement && clonedElement.parentNode) {
        clonedElement.parentNode.removeChild(clonedElement);
      }
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }

      window.getComputedStyle = originalGetComputedStyle;
      CSSStyleDeclaration.prototype.getPropertyValue = originalGetPropertyValue;
      if (cssRulesDescriptor) {
        Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', cssRulesDescriptor);
      }

      originalStyles.forEach((originalVal, el) => {
        if (el instanceof HTMLLinkElement) {
          el.disabled = false;
        } else if (el instanceof HTMLStyleElement) {
          el.textContent = originalVal;
        }
      });
      
      tempStyles.forEach(styleEl => {
        if (styleEl.parentNode) {
          styleEl.parentNode.removeChild(styleEl);
        }
      });
      
      setDownloadingCert(false);
    }
  };

  // Scheduled Exams states
  const [examSchedules, setExamSchedules] = useState<any[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');

  // Compute available exam dates across schedules and past student records
  const availableExamDates = useMemo(() => {
    const datesSet = new Set<string>();

    if (examSchedules && examSchedules.length > 0) {
      examSchedules.forEach(s => {
        if (s.examDate) datesSet.add(s.examDate.trim());
      });
    }

    if (registeredExams && registeredExams.length > 0) {
      registeredExams.forEach(e => {
        if (e.examDate) {
          datesSet.add(e.examDate.trim());
        } else if (e.createdAt) {
          datesSet.add(formatDate(e.createdAt));
        }
      });
    }

    if (datesSet.size === 0) {
      datesSet.add('July 31, 2026');
      datesSet.add('July 26, 2026');
    }

    return Array.from(datesSet);
  }, [examSchedules, registeredExams]);

  // Filter student exam results by selected exam date
  const displayedExams = useMemo(() => {
    if (selectedExamDateFilter === 'all') return registeredExams;
    return registeredExams.filter(exam => {
      const examDateStr = (exam.examDate || formatDate(exam.createdAt) || '').toLowerCase().trim();
      const targetFilter = selectedExamDateFilter.toLowerCase().trim();
      return examDateStr.includes(targetFilter) || targetFilter.includes(examDateStr);
    });
  }, [registeredExams, selectedExamDateFilter]);

  // New Exam Form states
  const [targetBelt, setTargetBelt] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [branch, setBranch] = useState('');
  const [coachName, setCoachName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [feesStatus, setFeesStatus] = useState<'Paid' | 'Pending'>('Pending');
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ studentName: string; targetBelt: string } | null>(null);
  const [formError, setFormError] = useState('');

  // New School Student registration states (No pre-existing ID)
  const [examMode, setExamMode] = useState<'verify' | 'new'>('verify');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCurrentBelt, setNewStudentCurrentBelt] = useState(BELT_LEVELS[0].name);

  // Automated Progress Status & Alert states
  const [attendanceCount, setAttendanceCount] = useState<number>(0);
  const [attendanceLoading, setAttendanceLoading] = useState<boolean>(false);
  const [hasShownAlert, setHasShownAlert] = useState<boolean>(false);

  // Real-time listener for child's class attendance logs
  useEffect(() => {
    if (!activeStudent) {
      setAttendanceCount(0);
      setHasShownAlert(false);
      return;
    }

    setAttendanceLoading(true);
    const attendanceRef = collection(db, 'attendance');
    const q = query(
      attendanceRef,
      where('studentId', '==', activeStudent.studentId),
      where('status', '==', 'Present')
    );

    // Track in real-time if a coach checks them in during class
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const count = snapshot.size;
      setAttendanceCount(count);
      setAttendanceLoading(false);

      const { required } = getRequiredClassesForCurrentBelt(activeStudent.beltLevel);
      if (count >= required && !hasShownAlert) {
        setHasShownAlert(true);
        // Play traditional resonant Karate Bell chime
        playKarateBell();

        // Push real browser notification if supported and allowed
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🥋 Lions Karate Exam Stage Reached!', {
            body: `${activeStudent.fullName} completed ${count}/${required} classes! Now eligible for the upcoming ranking belt test.`,
            tag: 'lkcp-exam-alert'
          });
        }
      }
    }, (error) => {
      console.error("Failed to load student attendance logs:", error);
      setAttendanceLoading(false);
    });

    return () => unsubscribe();
  }, [activeStudent, hasShownAlert]);

  // Sync scheduled exams dynamically from db
  useEffect(() => {
    setSchedulesLoading(true);
    const schedulesRef = collection(db, 'exam_schedules');
    const unsubscribe = onSnapshot(schedulesRef, (snapshot) => {
      const records: any[] = [];
      snapshot.forEach((docSnap) => {
        records.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      records.sort((a, b) => b.createdAt - a.createdAt);
      setExamSchedules(records);
      setSchedulesLoading(false);
    }, (error) => {
      console.error("Failed to load upcoming exam schedules:", error);
      setSchedulesLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time active student snapshot listener for instant profile updates
  useEffect(() => {
    // 1. Initial check on mount - prefer initialStudentId prop if provided via URL deep link
    const targetId = initialStudentId || safeLocalStorage.getItem('lkcp_portal_student_id');
    if (targetId) {
      setStudentIdInput(targetId);
      setActiveStudentId(targetId);
      safeLocalStorage.setItem('lkcp_portal_student_id', targetId);
    }
  }, [initialStudentId]);

  useEffect(() => {
    if (!activeStudentId) {
      setActiveStudent(null);
      return;
    }

    setSearching(true);
    setSearchError('');
    const cleanRaw = normalizeSearchString(activeStudentId);
    if (!cleanRaw) {
      setSearching(false);
      return;
    }

    const searchUpper = cleanRaw.toUpperCase();
    const searchLower = cleanRaw.toLowerCase();
    const searchAlphaNum = searchUpper.replace(/[^A-Z0-9]/g, '');
    const searchDigits = cleanRaw.replace(/\D/g, '');
    const queryWords = searchLower.split(/\s+/).filter(w => w.length >= 2);

    const evaluateDocMatch = (docSnap: any) => {
      const data = docSnap.data ? docSnap.data() : docSnap;
      if (data.status === 'rejected') return { score: 0, student: null };

      const docId = (docSnap.id || '').trim();
      const stIds = [
        data.studentId, data.rollId, data.rollNo, data.roll_no, data.rollNumber,
        data.student_id, data.studentID, data.registrationNo, data.regNo,
        data.admissionNo, data.admissionId, data.id, docId,
        data.roll_number, data.student_roll_id, data.student_roll_no,
        data.karateRollId, data.karate_roll_id, data.roll, data.idNo, data.id_no,
        data.serialNo, data.serial, data.code, data.studentCode
      ].filter(Boolean).map(s => String(s).trim());

      const stNames = [
        data.fullName, data.studentName, data.childName, data.name,
        data.student_name, data.applicantName
      ].filter(Boolean).map(s => String(s).trim().toLowerCase());

      const parentNames = [
        data.parentName, data.fatherName, data.motherName, data.guardianName
      ].filter(Boolean).map(s => String(s).trim().toLowerCase());

      const phones = [
        data.phone, data.parentPhone, data.whatsapp, data.contactPhone,
        data.mobile, data.parentMobile
      ].filter(Boolean).map(s => String(s).replace(/\D/g, ''));

      let bestScore = 0;

      // 1. Check Student IDs
      for (const idStr of stIds) {
        const idUpper = idStr.toUpperCase();
        const idAlphaNum = idUpper.replace(/[^A-Z0-9]/g, '');

        if (idUpper === searchUpper || (docId && docId.toUpperCase() === searchUpper)) {
          bestScore = Math.max(bestScore, 1000);
        } else if (searchAlphaNum && idAlphaNum === searchAlphaNum && searchAlphaNum.length >= 2) {
          bestScore = Math.max(bestScore, 950);
        } else if (checkStudentIdMatch(idStr, cleanRaw) || checkStudentIdMatch(docId, cleanRaw)) {
          bestScore = Math.max(bestScore, 850);
        }
      }

      // 2. Check Student Names
      for (const nameStr of stNames) {
        const nameAlpha = nameStr.replace(/[^a-z0-9]/g, '');
        const searchAlpha = searchLower.replace(/[^a-z0-9]/g, '');

        if (nameStr === searchLower) {
          bestScore = Math.max(bestScore, 800);
        } else if (nameAlpha && searchAlpha && nameAlpha === searchAlpha) {
          bestScore = Math.max(bestScore, 780);
        } else if (queryWords.length > 0 && queryWords.every(w => nameStr.includes(w))) {
          bestScore = Math.max(bestScore, 700);
        } else if (searchLower.length >= 2 && (nameStr.includes(searchLower) || searchLower.includes(nameStr))) {
          bestScore = Math.max(bestScore, 600);
        }
      }

      // 3. Check Parent Names
      for (const pName of parentNames) {
        if (pName === searchLower) {
          bestScore = Math.max(bestScore, 650);
        } else if (queryWords.length > 0 && queryWords.every(w => pName.includes(w))) {
          bestScore = Math.max(bestScore, 600);
        } else if (searchLower.length >= 3 && pName.includes(searchLower)) {
          bestScore = Math.max(bestScore, 500);
        }
      }

      // 4. Check Phone Numbers
      if (searchDigits.length >= 7) {
        for (const ph of phones) {
          if (ph === searchDigits || (ph.length >= 10 && searchDigits.length >= 10 && (ph.endsWith(searchDigits.slice(-10)) || searchDigits.endsWith(ph.slice(-10))))) {
            bestScore = Math.max(bestScore, 750);
          } else if (ph.includes(searchDigits) || searchDigits.includes(ph)) {
            bestScore = Math.max(bestScore, 650);
          }
        }
      }

      if (bestScore <= 0) return { score: 0, student: null };

      const matchedNameRaw = (data.fullName || data.studentName || data.childName || data.name || 'Karate Student').trim();
      const matchedId = stIds.find(id => id.toUpperCase().includes('LKCP')) || stIds[0] || searchUpper;

      const studentObj = {
        id: docSnap.id || ('st_' + matchedId),
        studentId: data.studentId || matchedId,
        fullName: matchedNameRaw,
        parentName: data.parentName || data.fatherName || '',
        phone: data.phone || data.parentPhone || '',
        whatsApp: data.whatsApp || data.phone || data.parentPhone || '',
        dob: data.dob || '',
        age: Number(data.age) || 0,
        gender: data.gender || 'male',
        email: data.email || '',
        address: data.address || '',
        batch: data.batch || '',
        photoUrl: data.photoUrl || '',
        updatedAt: data.updatedAt || Date.now(),
        branch: data.branch || data.dojoBranch || DOJO_BRANCHES[0].name,
        schoolName: data.schoolName || '',
        beltLevel: data.beltLevel || data.currentBelt || data.targetBelt || 'Shotokan Belt',
        status: 'approved',
        createdAt: data.createdAt || Date.now()
      } as Admission;

      return { score: bestScore, student: studentObj };
    };

    let isMounted = true;
    let matchFound = false;

    const setFoundStudent = (matched: Admission) => {
      if (!isMounted) return;
      matchFound = true;
      setSearching(false);
      setActiveStudent(matched);
      setSearchError('');

      setParentName(matched.parentName || '');
      setParentPhone(matched.phone || '');
      setBranch(matched.branch || DOJO_BRANCHES[0].name);
      setSchoolName(matched.schoolName || '');

      const studentBeltLevel = matched.beltLevel || '';
      const currentIdx = BELT_LEVELS.findIndex(b => b.name && studentBeltLevel && (studentBeltLevel.trim().toLowerCase() === b.name.toLowerCase() || studentBeltLevel.toLowerCase().includes(b.name.toLowerCase())));
      if (currentIdx !== -1 && currentIdx < BELT_LEVELS.length - 1) {
        setTargetBelt(BELT_LEVELS[currentIdx + 1].name);
      } else {
        setTargetBelt(BELT_LEVELS[1].name);
      }
    };

    const searchAllCollections = async () => {
      // 0. Instant sub-millisecond local cache check (0 Firestore read cost!)
      const cached = searchLocalCache(cleanRaw);
      if (cached.student && cached.score >= 700) {
        if (isMounted) {
          setFoundStudent(cached.student);
          if (cached.exams.length > 0) {
            setRegisteredExams(cached.exams);
          }
        }
      }

      try {
        let globalBestScore = cached.score || 0;
        let globalBestStudent: Admission | null = cached.student || null;

        const currentYear = new Date().getFullYear();
        const candidateIds = new Set<string>();
        candidateIds.add(searchUpper);
        candidateIds.add(cleanRaw);
        if (searchAlphaNum) candidateIds.add(searchAlphaNum);

        // Extract numbers to build standard candidate Roll IDs (handles 128 vs LKCP-2026-128 vs LKCP-2026-0128)
        if (searchDigits) {
          const serialNum = parseInt(searchDigits.slice(-4), 10);
          if (!isNaN(serialNum) && serialNum > 0) {
            const p3 = String(serialNum).padStart(3, '0');
            const p4 = String(serialNum).padStart(4, '0');
            const rawNum = String(serialNum);

            candidateIds.add(`LKCP-${currentYear}-${p3}`);
            candidateIds.add(`LKCP-${currentYear}-${p4}`);
            candidateIds.add(`LKCP-${currentYear}-${rawNum}`);
            candidateIds.add(`LKCP-${currentYear - 1}-${p3}`);
            candidateIds.add(`LKCP-${currentYear - 1}-${p4}`);
            candidateIds.add(`LKCP-${currentYear - 1}-${rawNum}`);
            candidateIds.add(rawNum);
          }
        }

        const candidateList = Array.from(candidateIds).filter(Boolean);

        // 1. Ultra efficient batch indexed queries across Admissions and Exams (1-2 reads total)
        try {
          if (candidateList.length > 0) {
            // Admissions indexed search by Roll ID batch
            try {
              const admInSnap = await getDocs(query(collection(db, 'admissions'), where('studentId', 'in', candidateList.slice(0, 10))));
              admInSnap.forEach((d) => {
                const { score, student } = evaluateDocMatch(d);
                if (score > globalBestScore && student) {
                  globalBestScore = score;
                  globalBestStudent = student;
                  saveStudentToLocalCache(student);
                }
              });
            } catch (err) {
              // Fallback to targeted individual queries if 'in' fails
              for (const cid of candidateList.slice(0, 4)) {
                try {
                  const qSnap = await getDocs(query(collection(db, 'admissions'), where('studentId', '==', cid)));
                  qSnap.forEach((d) => {
                    const { score, student } = evaluateDocMatch(d);
                    if (score > globalBestScore && student) {
                      globalBestScore = score;
                      globalBestStudent = student;
                      saveStudentToLocalCache(student);
                    }
                  });
                } catch {}
              }
            }

            // Exams indexed search by Roll ID batch
            if (globalBestScore < 700) {
              try {
                const examInSnap = await getDocs(query(collection(db, 'exams'), where('studentId', 'in', candidateList.slice(0, 10))));
                examInSnap.forEach((d) => {
                  const { score, student } = evaluateDocMatch(d);
                  if (score > globalBestScore && student) {
                    globalBestScore = score;
                    globalBestStudent = student;
                    saveStudentToLocalCache(student);
                  }
                });
              } catch (err) {
                for (const cid of candidateList.slice(0, 4)) {
                  try {
                    const qSnap = await getDocs(query(collection(db, 'exams'), where('studentId', '==', cid)));
                    qSnap.forEach((d) => {
                      const { score, student } = evaluateDocMatch(d);
                      if (score > globalBestScore && student) {
                        globalBestScore = score;
                        globalBestStudent = student;
                        saveStudentToLocalCache(student);
                      }
                    });
                  } catch {}
                }
              }
            }
          }

          // Search by phone if digits entered
          if (globalBestScore < 700 && searchDigits.length >= 7) {
            try {
              const phoneSnap = await getDocs(query(collection(db, 'admissions'), where('phone', '==', searchDigits)));
              phoneSnap.forEach((d) => {
                const { score, student } = evaluateDocMatch(d);
                if (score > globalBestScore && student) {
                  globalBestScore = score;
                  globalBestStudent = student;
                  saveStudentToLocalCache(student);
                }
              });
            } catch {}
          }
        } catch (e) {
          console.warn("Direct targeted query note:", e);
        }

        // Exit if targeted query found the student
        if (globalBestScore >= 700 && globalBestStudent) {
          if (isMounted && !matchFound) {
            setFoundStudent(globalBestStudent);
            saveStudentToLocalCache(globalBestStudent);
          }
          return;
        }

        // 2. Light fallback targeted scan across Admissions (limit 15 instead of 50 to conserve quota)
        if (globalBestScore < 700) {
          try {
            const admSnap = await getDocs(query(collection(db, 'admissions'), limit(15)));
            admSnap.forEach((d) => {
              const { score, student } = evaluateDocMatch(d);
              if (score > globalBestScore && student) {
                globalBestScore = score;
                globalBestStudent = student;
                saveStudentToLocalCache(student);
              }
            });
          } catch (e: any) {
            console.warn("Admissions query warning:", e);
            if (e?.code === 'resource-exhausted' || String(e).toLowerCase().includes('quota')) {
              throw e;
            }
          }
        }

        // 3. Search Exams (limit 15)
        if (globalBestScore < 700) {
          try {
            const examSnap = await getDocs(query(collection(db, 'exams'), limit(15)));
            examSnap.forEach((d) => {
              const { score, student } = evaluateDocMatch(d);
              if (score > globalBestScore && student) {
                globalBestScore = score;
                globalBestStudent = student;
                saveStudentToLocalCache(student);
              }
            });
          } catch (e: any) {
            console.warn("Exams query warning:", e);
          }
        }

        if (!isMounted || matchFound) return;

        if (globalBestScore > 0 && globalBestStudent) {
          setFoundStudent(globalBestStudent);
          saveStudentToLocalCache(globalBestStudent);
        } else if (!cached.student) {
          setSearching(false);
          setActiveStudent(null);
          setSearchError(`No active student record found matching "${cleanRaw}". Please verify the Roll ID or student name with your coach.`);
        }
      } catch (err: any) {
        if (!isMounted) return;
        
        // If local cache provided the student, don't show an error screen!
        if (matchFound) return;

        setSearching(false);
        setActiveStudent(null);

        const isQuotaErr = err?.code === 'resource-exhausted' || String(err).toLowerCase().includes('quota');
        if (isQuotaErr) {
          setSearchError(`System traffic is exceptionally high today on Result Day. If your result is not loading for Roll ID "${cleanRaw}", click 'Need Help?' below to connect directly with Shihan Maruti Jadhav on WhatsApp.`);
        } else {
          setSearchError(`No active student record found matching "${cleanRaw}". Please verify the Roll ID or student name with your coach.`);
        }
      }
    };

    searchAllCollections();

    return () => {
      isMounted = false;
    };
  }, [activeStudentId, searchNonce]);

  // Fetch student exams list dynamically using targeted queries & local cache
  useEffect(() => {
    if (!activeStudent) {
      setRegisteredExams([]);
      return;
    }

    setExamsLoading(true);
    let isMounted = true;

    const processExamsDocs = (docs: any[]) => {
      const records: ExamRecord[] = [];
      const targetStudentId = (activeStudent.studentId || '').trim().toUpperCase();
      const targetName = (activeStudent.fullName || '').trim().toLowerCase();

      docs.forEach((docSnap) => {
        const data = docSnap.data ? docSnap.data() : docSnap;
        const exStudentId = (data.studentId || '').trim().toUpperCase();
        const exStudentName = (data.studentName || data.fullName || '').trim().toLowerCase();

        let isMatch = false;
        if (targetStudentId && exStudentId && (checkStudentIdMatch(exStudentId, targetStudentId) || checkStudentIdMatch(docSnap.id, targetStudentId) || exStudentId.replace(/[^A-Z0-9]/g, '') === targetStudentId.replace(/[^A-Z0-9]/g, ''))) {
          isMatch = true;
        } else if (targetStudentId && checkStudentIdMatch(docSnap.id, targetStudentId)) {
          isMatch = true;
        }

        if (!isMatch && targetName && targetName !== 'karate student' && exStudentName) {
          if (exStudentName === targetName || exStudentName.includes(targetName) || targetName.includes(exStudentName)) {
            isMatch = true;
          }
        }

        if (isMatch) {
          const exObj = { id: docSnap.id, ...data } as ExamRecord;
          records.push(exObj);
          saveExamToLocalCache(exObj);
        }
      });

      // Filter out any synthesized records
      const cleanRecords = records.filter(r => !r.id || !r.id.startsWith('verified-exam-'));

      // Sort newest first
      cleanRecords.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      if (isMounted) {
        setRegisteredExams(cleanRecords);

        if (records.length > 0) {
          const realExamName = records.find(r => r.studentName && r.studentName.trim().toLowerCase() !== 'karate student')?.studentName 
            || records.find(r => (r as any).fullName && ((r as any).fullName as string).trim().toLowerCase() !== 'karate student')?.studentName;
          if (realExamName) {
            setActiveStudent(prev => {
              if (!prev || prev.fullName === 'Karate Student' || !prev.fullName || prev.fullName.trim() === '') {
                return { ...prev, fullName: realExamName, studentName: realExamName } as Admission;
              }
              return prev;
            });
          }
        }
        setExamsLoading(false);
      }
    };

    // 0. Check local exam cache first
    const localResult = searchLocalCache(activeStudent.studentId || activeStudent.fullName);
    if (localResult.exams && localResult.exams.length > 0) {
      setRegisteredExams(localResult.exams);
      setExamsLoading(false);
    }

    // 1. Fetch via targeted indexed queries on exams collection
    const targetId = (activeStudent.studentId || '').trim();
    const targetPhone = (activeStudent.phone || activeStudent.whatsApp || '').replace(/\D/g, '');

    const runTargetedExamFetch = async () => {
      try {
        const examDocsMap = new Map<string, any>();

        // Build candidate search variations for studentId
        const candidateIds = new Set<string>();
        if (targetId) {
          candidateIds.add(targetId);
          candidateIds.add(targetId.toUpperCase());
          candidateIds.add(targetId.toLowerCase());
          candidateIds.add(targetId.replace(/[^A-Za-z0-9]/g, ''));
          const digits = targetId.replace(/\D/g, '');
          if (digits) {
            const serialNum = parseInt(digits.slice(-4), 10);
            if (!isNaN(serialNum) && serialNum > 0) {
              const p3 = String(serialNum).padStart(3, '0');
              const p4 = String(serialNum).padStart(4, '0');
              const rawNum = String(serialNum);
              const currentYear = new Date().getFullYear();
              candidateIds.add(`LKCP-${currentYear}-${p3}`);
              candidateIds.add(`LKCP-${currentYear}-${p4}`);
              candidateIds.add(`LKCP-${currentYear}-${rawNum}`);
              candidateIds.add(`LKCP-${currentYear - 1}-${p3}`);
              candidateIds.add(`LKCP-${currentYear - 1}-${p4}`);
              candidateIds.add(`LKCP-${currentYear - 1}-${rawNum}`);
              candidateIds.add(rawNum);
            }
          }
        }

        const candidateList = Array.from(candidateIds).filter(Boolean);

        if (candidateList.length > 0) {
          try {
            const qIn = query(collection(db, 'exams'), where('studentId', 'in', candidateList.slice(0, 10)));
            const snapIn = await getDocs(qIn);
            snapIn.forEach(d => examDocsMap.set(d.id, d));
          } catch (eIn) {
            for (const cid of candidateList.slice(0, 4)) {
              try {
                const q1 = query(collection(db, 'exams'), where('studentId', '==', cid));
                const snap1 = await getDocs(q1);
                snap1.forEach(d => examDocsMap.set(d.id, d));
              } catch (e1) {}
            }
          }
        }

        if (activeStudent.fullName && activeStudent.fullName !== 'Karate Student') {
          try {
            const qName = query(collection(db, 'exams'), where('studentName', '==', activeStudent.fullName));
            const snapName = await getDocs(qName);
            snapName.forEach(d => examDocsMap.set(d.id, d));
          } catch (eN) {}
        }

        if (targetPhone && targetPhone.length >= 7) {
          try {
            const q2 = query(collection(db, 'exams'), where('parentPhone', '==', targetPhone));
            const snap2 = await getDocs(q2);
            snap2.forEach(d => examDocsMap.set(d.id, d));
          } catch (e2) {}
        }

        if (examDocsMap.size === 0) {
          try {
            const fallbackSnap = await getDocs(query(collection(db, 'exams'), limit(30)));
            fallbackSnap.forEach(d => examDocsMap.set(d.id, d));
          } catch (e3) {}
        }

        if (isMounted) {
          processExamsDocs(Array.from(examDocsMap.values()));
        }
      } catch (err) {
        if (isMounted) setExamsLoading(false);
      }
    };

    runTargetedExamFetch();

    return () => {
      isMounted = false;
    };
  }, [activeStudent]);

  // Auto-detect when student's belt progress updates and trigger celebration
  useEffect(() => {
    if (!activeStudent) return;

    const getBeltIdx = (bName: string) => {
      if (!bName) return 0;
      const clean = bName.split('(')[0].toLowerCase().trim();
      const idx = BELT_LEVELS.findIndex(b => {
        const bClean = b.name.split('(')[0].toLowerCase().trim();
        return clean === bClean || clean.includes(bClean) || bClean.includes(clean);
      });
      return idx !== -1 ? idx : 0;
    };

    let highestBeltIdx = getBeltIdx(activeStudent.beltLevel);
    let highestBeltName = activeStudent.beltLevel;

    if (registeredExams && registeredExams.length > 0) {
      registeredExams.forEach(ex => {
        if ((ex.isPublished !== false) && (ex.status === 'passed' || ex.status === 'promoted') && ex.targetBelt) {
          const exIdx = getBeltIdx(ex.targetBelt);
          if (exIdx > highestBeltIdx) {
            highestBeltIdx = exIdx;
            highestBeltName = ex.targetBelt;
          }
        }
      });
    }

    const currentBeltKey = `${activeStudent.studentId}_${highestBeltName}`;

    if (lastCelebratedBeltRef.current && lastCelebratedBeltRef.current !== currentBeltKey) {
      // Belt progress updated! Fire celebratory animation
      triggerBeltCelebration(highestBeltName);
    }
    lastCelebratedBeltRef.current = currentBeltKey;
  }, [activeStudent, registeredExams]);

  const performLookup = (idToSearch: string) => {
    const searchId = normalizeSearchString(idToSearch).toUpperCase();
    if (!searchId) return;

    setStudentIdInput(searchId);
    safeLocalStorage.setItem('lkcp_portal_student_id', searchId);
    setActiveStudentId(searchId);
    setSearchNonce(prev => prev + 1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(studentIdInput);
  };

  const handleLogoutPortal = () => {
    setActiveStudent(null);
    setActiveStudentId(null);
    setStudentIdInput('');
    setSearchError('');
    safeLocalStorage.removeItem('lkcp_portal_student_id');
  };

  const handleRegisterExam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isNew = activeTab === 'exam' && !activeStudent && examMode === 'new';
    
    if (!isNew && !activeStudent) return;

    if (isNew) {
      if (!newStudentName.trim()) {
        setFormError("Please enter your child's full name.");
        return;
      }
      if (!newStudentCurrentBelt) {
        setFormError("Please select your child's current belt level.");
        return;
      }
    }

    if (!targetBelt) {
      setFormError('Please select a target Belt Level.');
      return;
    }
    if (!coachName) {
      setFormError('Please specify your Instructor / Coach Name.');
      return;
    }
    if (!branch) {
      setFormError('Please select your Dojo training Branch.');
      return;
    }
    if (!parentName.trim()) {
      setFormError('Please enter Parent / Guardian Name.');
      return;
    }
    if (!parentPhone.trim()) {
      setFormError('Please enter Parent Phone Number.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      const selectedSched = examSchedules.find(s => s.id === selectedScheduleId);

      let studentId = '';
      let studentName = '';
      let currentBeltVal = '';

      if (isNew) {
        // Cross-check if student with the exact same name (case-insensitive) is already in admissions
        const trimmedName = newStudentName.trim().toLowerCase();
        
        let foundAdmission: Admission | null = null;
        
        // 1. Query by exact name first
        try {
          const qName = query(collection(db, 'admissions'), where('fullName', '==', newStudentName.trim()));
          const snapName = await getDocs(qName);
          if (!snapName.empty) {
            foundAdmission = { id: snapName.docs[0].id, ...snapName.docs[0].data() } as Admission;
          }
        } catch (nameErr) {
          console.warn("Name lookup query failed: ", nameErr);
        }

        // 2. Case-insensitive lookup as fallback across all admissions for complete safety
        if (!foundAdmission) {
          try {
            const admissionsSnap = await getDocs(collection(db, 'admissions'));
            const match = admissionsSnap.docs.find(d => {
              const dName = (d.data().fullName || '').trim().toLowerCase();
              return dName === trimmedName;
            });
            if (match) {
              foundAdmission = { id: match.id, ...match.data() } as Admission;
            }
          } catch (scanErr) {
            console.warn("Admissions list lookup failed: ", scanErr);
          }
        }

        if (foundAdmission) {
          // Seamlessly auto-link existing student record so parents face ZERO errors or friction
          studentId = foundAdmission.studentId;
          studentName = foundAdmission.fullName;
          currentBeltVal = foundAdmission.beltLevel || newStudentCurrentBelt;

          try {
            await updateDoc(doc(db, 'admissions', foundAdmission.id), {
              parentName: parentName.trim() || foundAdmission.parentName || 'Parent / Legal Guardian',
              phone: parentPhone.trim() || foundAdmission.phone,
              whatsApp: parentPhone.trim() || foundAdmission.whatsApp,
              updatedAt: Date.now()
            });
          } catch (updErr) {
            console.warn("Minor background admission sync on re-registration:", updErr);
          }
        } else {
          // Standard brand-new student path
          studentId = await generateSequentialStudentId();
          studentName = newStudentName.trim();
          currentBeltVal = newStudentCurrentBelt;

          // Automatically create an approved student admission record in the backend
          const admissionPayload = {
            studentId: studentId,
            fullName: studentName,
            dob: '',
            gender: 'other',
            parentName: parentName.trim(),
            phone: parentPhone.trim(),
            whatsApp: parentPhone.trim(),
            email: '',
            address: '',
            batch: 'School Student Batch',
            beltLevel: currentBeltVal,
            photoUrl: DEFAULT_STUDENT_AVATAR,
            termsAccepted: true,
            status: 'approved',
            createdAt: Date.now(),
            approvedAt: Date.now(),
            isDirectExamRegistration: true,
            branch: branch,
            schoolName: schoolName.trim()
          };

          await addDoc(collection(db, 'admissions'), admissionPayload);
        }
      } else {
        if (!activeStudent) throw new Error('Active student context missing');
        studentId = activeStudent.studentId;
        studentName = activeStudent.fullName;
        currentBeltVal = activeStudent.beltLevel;
      }

      const examData = {
        studentId: studentId,
        studentName: studentName,
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        branch: branch,
        coachName: coachName.trim(),
        currentBelt: currentBeltVal,
        targetBelt: targetBelt,
        status: 'pending', // Starts as pending until validated/paid
        feesStatus: feesStatus,
        examScheduleId: selectedScheduleId || '',
        examDate: selectedSched ? selectedSched.examDate : '',
        venueDetails: selectedSched ? selectedSched.venueDetails : '',
        schoolName: schoolName.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await addDoc(collection(db, 'exams'), examData);

      // Save/Switch to the active student session so parents can see results instantly
      const newStudentData: Admission = {
        id: studentId,
        studentId: studentId,
        fullName: studentName,
        parentName: parentName.trim(),
        phone: parentPhone.trim(),
        beltLevel: currentBeltVal,
        branch: branch,
        status: 'approved',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        dob: '',
        schoolName: schoolName.trim(),
        gender: 'other',
        whatsApp: parentPhone.trim(),
        email: '',
        address: '',
        batch: 'School Student Batch',
        photoUrl: DEFAULT_STUDENT_AVATAR,
        age: 10
      };

      safeLocalStorage.setItem('lkcp_portal_student_id', studentId);
      setActiveStudentId(studentId);
      setActiveStudent(newStudentData);
      setStudentIdInput(studentId);

      setSuccessInfo({
        studentName: studentName,
        targetBelt: targetBelt
      });
      setFormSuccess(true);
      setShowExamForm(false);
      
      // Clear selections
      setNewStudentName('');
      setSelectedScheduleId('');
      setCoachName('');
      setFeesStatus('Pending');

      // Trigger beautiful sound effect & confetti celebrations
      try {
        playKarateBell();
      } catch (soundErr) {
        console.error("Sound play issue:", soundErr);
      }

      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          zIndex: 10000
        });

        const duration = 2.5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 40 * (timeLeft / duration);
          confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
          confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
      } catch (confettiErr) {
        console.error("Confetti issue:", confettiErr);
      }
    } catch (err: any) {
      console.error("Failed to register exam:", err);
      setFormError(err.message || 'Verification failed. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // Check for currently pending or approved upcoming registrations
  const existingPendingOrApproved = registeredExams.find(
    exam => exam.status === 'pending' || exam.status === 'approved'
  );

  const isWhiteBeltOrFirstTime = activeStudent && (
    activeStudent.beltLevel?.toLowerCase().includes('white') || 
    activeStudent.beltLevel?.toLowerCase().includes('10th kyu') ||
    registeredExams.length === 0
  );

  // Format simple dates
  const formatDate = (ms: number) => {
    if (!ms) return 'N/A';
    return new Date(ms).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-slate-950 py-12 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* SEGMENTED TABS CONTROLS */}
        <div className="flex bg-slate-900/60 p-1.5 rounded-xl max-w-lg mx-auto mb-10 border border-zinc-900 w-full animate-fade-in gap-1">
          <button
            onClick={() => setActiveTabState('progress')}
            type="button"
            className={`flex-1 py-2.5 sm:py-3 text-center rounded-lg font-heading font-black text-[9px] xs:text-[10px] sm:text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-1 sm:space-x-2 px-1 sm:px-3 ${
              activeTab === 'progress'
                ? 'bg-yellow-500 text-slate-950 shadow-md font-black animate-fade-in'
                : 'text-zinc-400 hover:text-white hover:bg-slate-850/50'
            }`}
          >
            <Award className="w-3.5 h-3.5 hidden xs:block shrink-0" />
            <span>Check Results</span>
          </button>
          <button
            onClick={() => {
              setActiveTabState('exam');
              if (activeStudent) {
                setShowExamForm(true);
              }
            }}
            type="button"
            className={`flex-1 py-2.5 sm:py-3 text-center rounded-lg font-heading font-black text-[9px] xs:text-[10px] sm:text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-1 sm:space-x-2 px-1 sm:px-3 ${
              activeTab === 'exam'
                ? 'bg-[#FF3B3F] text-white shadow-md font-black animate-fade-in'
                : 'text-zinc-400 hover:text-white hover:bg-slate-850/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 hidden xs:block shrink-0" />
            <span>Apply For Exam</span>
          </button>
          <button
            onClick={() => setActiveTabState('attendance')}
            type="button"
            className={`flex-1 py-2.5 sm:py-3 text-center rounded-lg font-heading font-black text-[9px] xs:text-[10px] sm:text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-1 sm:space-x-2 px-1 sm:px-3 ${
              activeTab === 'attendance'
                ? 'bg-emerald-500 text-white shadow-md font-black animate-fade-in'
                : 'text-zinc-400 hover:text-white hover:bg-slate-850/50'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 hidden xs:block shrink-0" />
            <span>Attendance</span>
          </button>
        </div>

        {/* Header Header */}
        <div className="text-center space-y-3 mb-10 max-w-2xl mx-auto">
          {activeTab === 'progress' ? (
            <>
              <div className="inline-flex items-center space-x-2 bg-yellow-500/10 text-yellow-500 text-[10px] font-heading font-black tracking-widest px-3 py-1 rounded-full uppercase border border-yellow-500/15">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>STUDENT PORTAL</span>
              </div>
              <h2 className="font-title text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-none uppercase">
                Check Belt <span className="text-transparent" style={{ WebkitTextStroke: '1.5px #e5e5e5' }}>Results</span>
              </h2>
              <p className="text-zinc-500 text-xs sm:text-sm">
                Enter your child's Karate Roll ID to view their current belt level, results, and past exam history.
              </p>
            </>
          ) : activeTab === 'exam' ? (
            <>
              <div className="inline-flex items-center space-x-2 bg-red-500/10 text-[#FF3B3F] text-[10px] font-heading font-black tracking-widest px-3 py-1 rounded-full uppercase border border-red-500/15">
                <Calendar className="w-3.5 h-3.5" />
                <span>EXAM APPLICATION</span>
              </div>
              <h2 className="font-title text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-none uppercase">
                Apply For <span className="text-transparent" style={{ WebkitTextStroke: '1.5px #e5e5e5' }}>Belt Exam</span>
              </h2>
              <p className="text-zinc-500 text-xs sm:text-sm">
                Register your child for an upcoming ranking belt exam. First enter their Karate Roll ID below, then choose their next level belt.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 text-[10px] font-heading font-black tracking-widest px-3 py-1 rounded-full uppercase border border-emerald-500/15">
                <ClipboardList className="w-3.5 h-3.5" />
                <span>COACHING REGISTER</span>
              </div>
              <h2 className="font-title text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-none uppercase">
                Attendance <span className="text-transparent" style={{ WebkitTextStroke: '1.5px #e5e5e5' }}>Tracker</span>
              </h2>
              <p className="text-zinc-500 text-xs sm:text-sm">
                Daily attendance logs, bulk registration shortcuts, and instant parent notification broadcasters over WhatsApp.
              </p>
            </>
          )}
        </div>

        {/* LOOKUP FORM & DIRECT NEW EXAM REGISTRATION SWITCH */}
        {!activeStudent && activeTab !== 'attendance' && (
          <div className="space-y-6">
            {activeTab === 'exam' && (
              <div className="space-y-4 mb-5 max-w-lg mx-auto">
                <div className="flex bg-slate-900/40 p-1.5 rounded-xl border border-zinc-900 w-full gap-1">
                  <button
                    type="button"
                    onClick={() => setExamMode('verify')}
                    className={`flex-1 py-2.5 px-2 text-center rounded-lg font-heading transition-all cursor-pointer flex flex-col items-center justify-center ${
                      examMode === 'verify'
                        ? 'bg-[#FF3B3F] text-white shadow-md font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="font-black text-[10.5px] uppercase tracking-wider">Existing Student</span>
                    <span className="text-[9px] opacity-85 font-medium mt-0.5 font-sans">पहले से छात्र हैं (ID है)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExamMode('new');
                      // Set defaults for direct registration
                      setParentName('');
                      setParentPhone('');
                      setBranch(DOJO_BRANCHES[0].name);
                      setTargetBelt(BELT_LEVELS[1].name); // Yellow Belt
                      setCoachName('');
                    }}
                    className={`flex-1 py-2.5 px-2 text-center rounded-lg font-heading transition-all cursor-pointer flex flex-col items-center justify-center ${
                      examMode === 'new'
                        ? 'bg-[#FF3B3F] text-white shadow-md font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="font-black text-[10.5px] uppercase tracking-wider">School Student</span>
                    <span className="text-[9px] opacity-85 font-medium mt-0.5 font-sans">स्कूल के छात्र (ID नहीं है)</span>
                  </button>
                </div>

                {/* Elegant Bilingual Explainer Alert Box */}
                <div className="bg-slate-950/80 border border-zinc-900 rounded-xl p-4 text-left space-y-3 shadow-inner">
                  <div className="flex items-start space-x-3">
                    <Info className="w-4 h-4 text-[#FF3B3F] mt-0.5 shrink-0" />
                    <div className="space-y-2 text-[11px] leading-relaxed">
                      {examMode === 'verify' ? (
                        <>
                          <div className="text-zinc-300 font-sans">
                            <span className="text-[#FF3B3F] font-bold">English:</span> Use this if your child is already registered with us and has a Karate Roll ID (e.g. <strong className="text-white font-mono">LKCP-2026-004</strong>).
                          </div>
                          <div className="text-zinc-400 border-t border-zinc-900/60 pt-2 font-sans">
                            <span className="text-[#FF3B3F] font-bold">हिंदी में:</span> इस विकल्प को तब चुनें जब आपके बच्चे के पास पहले से ही कराटे रोल ID (<strong className="text-zinc-200 font-mono">LKCP-</strong> से शुरू होने वाला) मौजूद हो।
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-zinc-300 font-sans">
                            <span className="text-[#FF3B3F] font-bold">English:</span> Use this for school students who do not have an ID yet. Fill out the form, and a unique Roll ID will be created and activated instantly.
                          </div>
                          <div className="text-zinc-400 border-t border-zinc-900/60 pt-2 font-sans">
                            <span className="text-[#FF3B3F] font-bold">हिंदी में:</span> नए स्कूली छात्रों के लिए इस विकल्प को चुनें जिनके पास अभी कराटे रोल ID नहीं है। फॉर्म भरें, और सबमिट करते ही एक नया रोल ID तुरंत बन जाएगा।
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'progress' || examMode === 'verify') ? (
              <div className="bg-slate-900/40 border border-zinc-900 p-6 sm:p-8 rounded-2xl relative shadow-2xl">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
                
                <form onSubmit={handleSearchSubmit} className="space-y-5">
                  {/* EXAM SESSION / DATE SELECTOR */}
                  <div>
                    <label htmlFor="exam-session-date-select" className="text-zinc-400 text-xs font-heading font-black uppercase tracking-wider block mb-2 text-left flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-yellow-500" />
                      Select Exam Date / Session
                    </label>
                    <select
                      id="exam-session-date-select"
                      value={selectedExamDateFilter}
                      onChange={(e) => setSelectedExamDateFilter(e.target.value)}
                      className="w-full bg-slate-950 border border-zinc-850 px-4 py-3 text-xs text-white rounded-xl focus:outline-none focus:border-yellow-500/60 font-sans cursor-pointer mb-1"
                    >
                      <option value="all">-- All Exam Dates (Latest Result) --</option>
                      {availableExamDates.map((dateStr) => (
                        <option key={dateStr} value={dateStr}>
                          📅 Exam Date: {dateStr}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10.5px] text-zinc-500 text-left font-sans">
                      Select the specific exam session date to view results for that exam.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="student-portal-id" className="text-zinc-400 text-xs font-heading font-black uppercase tracking-wider block mb-2 text-left">
                      {activeTab === 'exam' ? "Enter your child's Karate Roll ID to start" : "Enter your child's Karate Roll ID"}
                    </label>
                    <div className="flex gap-2 sm:gap-3 items-stretch">
                      <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-650">
                          <Award className={`w-5 h-5 ${activeTab === 'exam' ? 'text-red-500/60' : 'text-zinc-550'}`} />
                        </div>
                        <input
                          id="student-portal-id"
                          type="text"
                          required
                          value={studentIdInput}
                          onChange={(e) => setStudentIdInput(e.target.value)}
                          placeholder="e.g. LKCP-2026-004"
                          autoCapitalize="characters"
                          autoCorrect="off"
                          autoComplete="off"
                          spellCheck={false}
                          enterKeyHint="search"
                          className={`w-full bg-slate-950 border pl-11 pr-4 py-3.5 text-sm font-mono tracking-widest text-white rounded-xl focus:outline-none transition-colors uppercase placeholder:text-zinc-700 ${
                            activeTab === 'exam' ? 'border-zinc-850 focus:border-red-500/60' : 'border-zinc-850 focus:border-yellow-500/60'
                          }`}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={searching || !studentIdInput.trim()}
                        className={`font-heading font-black text-xs uppercase tracking-widest px-5 sm:px-7 rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-55 cursor-pointer shadow-md shrink-0 ${
                          activeTab === 'exam' 
                            ? 'bg-[#FF3B3F] hover:bg-red-500 text-white shadow-red-500/5' 
                            : 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-yellow-500/5'
                        }`}
                      >
                        {searching ? (
                          <RefreshCw className={`w-4 h-4 animate-spin ${activeTab === 'exam' ? 'text-white' : 'text-slate-950'}`} />
                        ) : (
                          <>
                            <Search className={`w-4 h-4 ${activeTab === 'exam' ? 'text-white' : 'text-slate-950'}`} />
                            <span className="font-extrabold">{activeTab === 'exam' ? 'Verify ID' : 'Search'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {searchError && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl space-y-3 text-xs shadow-inner text-left">
                      <div className="flex items-start space-x-3 text-red-400">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                        <span className="leading-relaxed">{searchError}</span>
                      </div>
                      <div className="pt-1">
                        <a
                          href={`https://wa.me/919049688172?text=${encodeURIComponent(`Hello Shihan Maruti Jadhav, I am searching for my child's karate result on the website. My child's Roll ID / Name is: ${studentIdInput || 'LKCP-2026'}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                        >
                          <span>Need Help? Chat with Coach on WhatsApp (+91 9049688172)</span>
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-950/60 ring-1 ring-zinc-900 rounded-xl p-4 text-[11px] text-zinc-500 leading-relaxed font-sans flex items-center space-x-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      <strong>Need help?</strong> Your child's Karate Roll ID starts with <strong>LKCP-</strong> (for example: LKCP-2026-004). You can find this on your admission receipt, or ask their Karate Coach directly on WhatsApp anytime!
                    </span>
                  </div>

                  <div className="pt-4 border-t border-zinc-900/60 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div className="text-[11px] text-zinc-400 max-w-md">
                      <span className="font-bold text-zinc-300 block">No Student ID issued yet?</span>
                      If you train offline or are registering for the first time, fill out the quick digital admission online to instantly generate your verified Roll ID.
                    </div>
                    <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('admission')}
                          type="button"
                          className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/25 hover:border-yellow-500/40 text-yellow-500 font-heading font-black text-[10px] uppercase tracking-wider px-3.5 py-2.5 rounded-lg transition-all cursor-pointer text-center"
                        >
                          Apply Online
                        </button>
                      )}
                      <a
                        href="https://wa.me/919049688172?text=Hello%20Sensei,%20I'm%20trying%2520to%20register%20for%20the%2520upcoming%20Karate%20Belt%20Exam%20and%20need%20my%20child's%20Student%2520ID.%20Please%20help!"
                        target="_blank"
                        rel="noreferrer"
                        className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 font-heading font-black text-[10px] uppercase tracking-wider px-3.5 py-2.5 rounded-lg transition-all text-center inline-flex items-center justify-center cursor-pointer"
                      >
                        Get Help on WhatsApp
                      </a>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              /* DIRECT EXAM FORM FOR NEW SCHOOL STUDENT */
              <form 
                onSubmit={handleRegisterExam}
                className="bg-slate-900/60 border border-zinc-850 p-6 sm:p-8 rounded-2xl relative shadow-xl space-y-5"
              >
                <div className="border-b border-zinc-850 pb-4 text-left">
                  <h4 className="font-title text-base font-extrabold text-white uppercase flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-red-500" />
                      School Student Registration
                    </span>
                    <span className="text-xs text-red-400 font-sans font-medium">/ स्कूल छात्र परीक्षा पंजीकरण (बिना ID)</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed font-sans">
                    Fill out the fields below to register. A unique student Roll ID will be automatically generated! <br/>
                    <span className="text-zinc-400">नीचे विवरण भरें। सबमिट करने पर एक नया छात्र रोल ID अपने आप बन जाएगा!</span>
                  </p>
                </div>

                {formError && (
                  <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg flex items-start space-x-2 text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
                  <div className="sm:col-span-2">
                    <label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold mb-1.5 block">
                      Select Exam Date & Location <span className="text-zinc-500 font-normal">/ परीक्षा की तारीख और स्थान चुनें (Optional)</span>
                    </label>
                    <select
                      value={selectedScheduleId}
                      onChange={(e) => {
                        const schedId = e.target.value;
                        setSelectedScheduleId(schedId);
                        const matched = examSchedules.find(s => s.id === schedId);
                        if (matched) {
                          if (BELT_LEVELS.some(b => b.name === matched.beltLevel)) {
                            setTargetBelt(matched.beltLevel);
                          }
                        }
                      }}
                      className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-red-550"
                    >
                      <option value="">-- Choose an upcoming Exam Date / Venue (Optional) --</option>
                      {examSchedules.map((sched) => (
                         <option key={sched.id} value={sched.id}>
                          {sched.examDate} - Target: {sched.beltLevel} ({sched.venueDetails})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold mb-1.5 block">
                      Student Full Name * <span className="text-zinc-500 font-normal">/ विद्यार्थी का पूरा नाम *</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="Enter Child's Name"
                      className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold mb-1.5 block">
                      Current Belt Rank * <span className="text-zinc-500 font-normal">/ वर्तमान बेल्ट का स्तर *</span>
                    </label>
                    <select
                      required
                      value={newStudentCurrentBelt}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewStudentCurrentBelt(val);
                        // Automatically select the next belt below it
                        const idx = BELT_LEVELS.findIndex(b => b.name === val);
                        if (idx !== -1 && idx < BELT_LEVELS.length - 1) {
                          setTargetBelt(BELT_LEVELS[idx + 1].name);
                        } else if (idx === BELT_LEVELS.length - 1) {
                          setTargetBelt(BELT_LEVELS[idx].name);
                        }
                      }}
                      className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-red-500"
                    >
                      {BELT_LEVELS.map(belt => (
                        <option key={belt.name} value={belt.name}>{belt.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold mb-1.5 block">
                      Next Belt Rank Testing For * <span className="text-zinc-500 font-normal">/ किस बेल्ट के लिए परीक्षा दे रहे हैं *</span>
                    </label>
                    <select
                      required
                      value={targetBelt}
                      onChange={(e) => setTargetBelt(e.target.value)}
                      className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-red-500"
                    >
                      <option value="">Select Target Belt</option>
                      {BELT_LEVELS.map(belt => (
                        <option 
                          key={belt.name} 
                          value={belt.name}
                          disabled={belt.name === newStudentCurrentBelt}
                        >
                          {belt.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold mb-1.5 block">
                      Karate Coach / Instructor * <span className="text-zinc-500 font-normal">/ कराटे कोच का नाम *</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={coachName}
                      onChange={(e) => setCoachName(e.target.value)}
                      placeholder="e.g. Sensei Maruti Jadhav"
                      className="w-full bg-slate-950 border border-zinc-850 text-zinc-350 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold mb-1.5 block">
                      Karate Center / Branch * <span className="text-zinc-500 font-normal">/ कराटे सेंटर या ब्रांच *</span>
                    </label>
                    <select
                      required
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-red-500"
                    >
                      {DOJO_BRANCHES.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold mb-1.5 block">
                      Belt Exam Fee Paid? * <span className="text-zinc-500 font-normal">/ बेल्ट परीक्षा शुल्क जमा किया? *</span>
                    </label>
                    <select
                      required
                      value={feesStatus}
                      onChange={(e: any) => setFeesStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-red-500"
                    >
                      <option value="Pending">Not Paid Yet / अभी जमा नहीं किया (Will pay later)</option>
                      <option value="Paid">Paid / जमा कर दिया (Handed over to Coach)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold mb-1.5 block">
                      Parent / Guardian Name * <span className="text-zinc-500 font-normal">/ माता-पिता या अभिभावक का नाम *</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="Parent Name"
                      className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold mb-1.5 block">
                      Parent Phone Number * <span className="text-zinc-500 font-normal">/ माता-पिता का मोबाइल नंबर *</span>
                    </label>
                    <input 
                      type="tel" 
                      required 
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="Phone Number"
                      className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold mb-1.5 block">
                      School / Academic Institution Name * <span className="text-zinc-500 font-normal">/ स्कूल या कॉलेज का नाम *</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g. Podar International School, Pune"
                      className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 border border-zinc-900 rounded-xl space-y-3 text-left">
                  <p className="text-[10.5px] text-zinc-500 leading-relaxed font-sans">
                    * NOTE: A custom Karate Roll ID (e.g. LKCP-2026-105) will be automatically created on the backend and linked to this child's record. This ID will let you track their belt promotions, grades, and attendance!
                    <br/>
                    <span className="text-zinc-600 block mt-1">
                      * ध्यान दें: आपके बच्चे के रिकॉर्ड के लिए एक कराटे रोल ID (जैसे LKCP-2026-105) अपने आप बन जाएगी। इस ID से आप उनके बेल्ट प्रमोशन, ग्रेड और हाजिरी ट्रैक कर सकेंगे!
                    </span>
                  </p>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="px-5 py-2 text-[10px] bg-red-500 hover:bg-red-400 text-white font-heading font-black uppercase tracking-wider rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-red-500/5"
                    >
                      {formLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Submit & Create ID</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ACTIVE STUDENT WORKFLOW SCREEN */}
        {searching && !activeStudent && activeTab !== 'attendance' && (
          <div className="mt-8">
            <StudentPortalSkeleton />
          </div>
        )}

        {activeStudent && activeTab !== 'attendance' && (
          <div className="space-y-8">
            
            {/* Student Header row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 border border-zinc-900/80 p-5 rounded-2xl">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-500/20 bg-slate-950 shadow-md flex-shrink-0">
                  <img 
                    src={activeStudent.photoUrl || DEFAULT_STUDENT_AVATAR} 
                    alt={activeStudent.fullName} 
                    className="w-full h-full object-cover object-center"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-heading font-black text-xs text-yellow-500 font-mono select-all tracking-wider">
                      {activeStudent.studentId}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-zinc-700" />
                    <span className="text-[10px] uppercase font-bold text-zinc-500 font-serif">
                      {activeStudent.branch || "Manajinager Branch"}
                    </span>
                  </div>
                  <h3 className="font-title text-xl font-extrabold text-white uppercase tracking-tight mt-1">
                    {activeStudent.fullName}
                  </h3>
                  <p className="text-[10px] text-zinc-500 leading-none mt-1.5 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-zinc-650" />
                    JOINED: {formatDate(activeStudent.joiningDate || activeStudent.approvedAt || activeStudent.createdAt)}
                  </p>

                  {/* Dynamic automated mini skill badges display */}
                  {(() => {
                    const unlocked = getStudentBadges().filter(b => b.isUnlocked);
                    if (unlocked.length === 0) return null;
                    return (
                      <div className="flex flex-wrap items-center gap-1.5 mt-3 select-none">
                        <span className="text-[8px] uppercase font-black text-zinc-500 tracking-wider mr-0.5">Badges:</span>
                        {unlocked.map(badge => {
                          const BadgeIcon = badge.icon;
                          return (
                            <div 
                              key={badge.id}
                              title={`${badge.name}: ${badge.description}`}
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border ${badge.borderColor} ${badge.bgColor} ${badge.textColor} text-[8.5px] font-heading font-black uppercase tracking-wide cursor-help shadow-sm transition-all hover:scale-105`}
                            >
                              <BadgeIcon className="w-2.5 h-2.5 shrink-0" />
                              <span>{badge.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
                <button
                  type="button"
                  onClick={() => setShowIDCardModal(true)}
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-heading font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 shadow-md shadow-yellow-500/10 active:scale-95"
                >
                  <CreditCard className="w-3.5 h-3.5 text-slate-950 stroke-[2.5px]" />
                  <span>Download Student ID Card</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogoutPortal}
                  className="bg-slate-950 hover:bg-slate-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white font-heading font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Change Student</span>
                </button>
              </div>
            </div>

            {/* NEW EXAMS REGISTRATION FORM COMPONENT (Sleek Accordion) */}
            <AnimatePresence>
              {(showExamForm || activeTab === 'exam') && !formSuccess && (
                <form 
                  onSubmit={handleRegisterExam}
                  className="bg-slate-900/60 border border-zinc-850 p-6 sm:p-8 rounded-2xl relative shadow-xl space-y-5"
                >
                  <div className="border-b border-zinc-850 pb-4">
                    <h4 className="font-title text-base font-extrabold text-white uppercase flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-yellow-500" />
                      Fill Out Belt Exam Application
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                      Enter the details below to register your child for the next belt exam. Your coach will evaluate them physically during class.
                    </p>
                  </div>

                  {formError && (
                    <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg flex items-start space-x-2 text-red-400 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* ALREADY REGISTERED/DUPLICATE PREVENTER NOTIFICATION */}
                  {existingPendingOrApproved && (
                    <div className="bg-amber-500/10 border-2 border-amber-500/30 p-5 rounded-2xl text-left space-y-3 animate-fade-in relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-10">
                        <AlertCircle className="w-24 h-24 text-amber-500" />
                      </div>
                      <div className="flex items-center space-x-2.5 text-amber-400">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="font-heading font-black text-xs uppercase tracking-wider font-sans">
                          Already Registered!
                        </span>
                      </div>
                      <p className="text-xs text-zinc-350 leading-relaxed font-sans">
                        Dear Parent, our calendar shows that <strong>{activeStudent.fullName}</strong> is already registered for an exam. You do not need to register again unless asked by your coach.
                      </p>
                      
                      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-zinc-900/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans text-zinc-300">
                        <div>
                          <strong className="text-zinc-500">Next Belt Target:</strong> {existingPendingOrApproved.targetBelt}
                        </div>
                        <div>
                          <strong className="text-zinc-500">Application Status:</strong>{' '}
                          <span className={`font-bold uppercase ${
                            existingPendingOrApproved.status === 'approved' ? 'text-blue-400' : 'text-yellow-500'
                          }`}>
                            {existingPendingOrApproved.status === 'approved' ? 'Accepted / Slot Given' : 'Waiting for Coach Approval'}
                          </span>
                        </div>
                        {existingPendingOrApproved.examDate && (
                          <div className="col-span-1 sm:col-span-2 text-[11px] text-zinc-400 mt-1 pt-1.5 border-t border-zinc-900/60 font-mono">
                            <span className="text-yellow-500">📅 Scheduled:</span> {existingPendingOrApproved.examDate}
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-amber-400/90 bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/10 flex items-start space-x-2">
                        <span className="shrink-0 text-amber-400 font-bold">⚠️ Notice:</span>
                        <span>
                          Please do <strong>not</strong> apply again for the same belt to avoid double payments. If you have been asked by the Coach to register for a different/next rank, you may safely ignore this and continue below.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* WHITE BELT / FIRST TIME ID VERIFICATION NOTE */}
                  {isWhiteBeltOrFirstTime && (
                    <div className="bg-blue-950/20 border border-blue-500/20 p-4.5 rounded-xl text-left space-y-2 animate-fade-in">
                      <div className="flex items-center space-x-2 text-blue-400">
                        <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
                        <span className="font-heading font-black text-xs uppercase tracking-wider font-sans">
                          If this is your child's first time giving an exam:
                        </span>
                      </div>
                      <p className="text-[11.5px] text-zinc-350 leading-relaxed font-sans">
                        Since this is your child's first time applying for a new belt, please note:
                      </p>
                      <ul className="list-disc pl-5 text-[11px] text-zinc-400 space-y-1 font-sans">
                        <li>Your child is registered under Roll ID <strong>{activeStudent.studentId}</strong>. It links their class attendance and karate profile.</li>
                        <li>Please check that your child's name spelling is exactly correct so it is printed perfectly on their official karate certificate.</li>
                        <li>We will test your child in the physical karate center during class week, and update their marks and new belt card here.</li>
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
                    <div className="sm:col-span-2">
                      <label className="text-zinc-400 text-[9px] uppercase tracking-wider font-bold mb-1.5 block">Select Exam Date & Location (Optional)</label>
                      <select
                        value={selectedScheduleId}
                        onChange={(e) => {
                          const schedId = e.target.value;
                          setSelectedScheduleId(schedId);
                          const matched = examSchedules.find(s => s.id === schedId);
                          if (matched) {
                            if (BELT_LEVELS.some(b => b.name === matched.beltLevel)) {
                              setTargetBelt(matched.beltLevel);
                            }
                          }
                        }}
                        className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-yellow-500"
                      >
                        <option value="">-- Choose an upcoming Exam Date / Venue (Optional) --</option>
                        {examSchedules.map((sched) => (
                           <option key={sched.id} value={sched.id}>
                            {sched.examDate} - Target: {sched.beltLevel} ({sched.venueDetails})
                          </option>
                        ))}
                      </select>
                      {selectedScheduleId && (
                        <div className="mt-2 bg-slate-950 p-3.5 border border-zinc-900 rounded-lg text-[11px] text-zinc-400 space-y-1">
                          {(() => {
                            const matched = examSchedules.find(s => s.id === selectedScheduleId);
                            if (!matched) return null;
                            return (
                              <>
                                <p className="font-semibold text-yellow-500">Scheduled Exam Highlight:</p>
                                <p><strong className="text-white">Venue:</strong> {matched.venueDetails}</p>
                                <p><strong className="text-white">Belt:</strong> {matched.beltLevel.includes('All Belt Levels') ? matched.beltLevel : `For candidates testing up to ${matched.beltLevel}`}</p>
                                <p><strong className="text-white">Prerequisites:</strong> {matched.prerequisites}</p>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-zinc-500 text-[9px] uppercase tracking-wider font-bold mb-1.5 block">Student ID</label>
                      <input 
                        type="text" 
                        disabled 
                        value={activeStudent.studentId}
                        className="w-full bg-slate-950 border border-zinc-900 text-zinc-500 font-mono tracking-widest text-xs px-3.5 py-2.5 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[9px] uppercase tracking-wider font-bold mb-1.5 block">Current Rank</label>
                      <input 
                        type="text" 
                        disabled 
                        value={activeStudent.beltLevel}
                        className="w-full bg-slate-950 border border-zinc-900 text-zinc-500 text-xs px-3.5 py-2.5 rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="text-zinc-400 text-[9px] uppercase tracking-wider font-bold mb-1.5 block">Belt Level Testing For (Next Belt) *</label>
                      <select
                        required
                        value={targetBelt}
                        onChange={(e) => setTargetBelt(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-yellow-500"
                      >
                        <option value="">Select Target Belt</option>
                        {BELT_LEVELS.map(belt => (
                          <option 
                            key={belt.name} 
                            value={belt.name}
                            disabled={belt.name === activeStudent.beltLevel}
                          >
                            {belt.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-zinc-400 text-[9px] uppercase tracking-wider font-bold mb-1.5 block">Your Child's Karate Coach *</label>
                      <input 
                        type="text" 
                        required 
                        value={coachName}
                        onChange={(e) => setCoachName(e.target.value)}
                        placeholder="e.g. Sensei Maruti Jadhav"
                        className="w-full bg-slate-950 border border-zinc-850 text-zinc-350 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-yellow-500"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-400 text-[9px] uppercase tracking-wider font-bold mb-1.5 block">Karate Center / Branch *</label>
                      <select
                        required
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-yellow-500"
                      >
                        {DOJO_BRANCHES.map(b => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-zinc-400 text-[9px] uppercase tracking-wider font-bold mb-1.5 block">Belt Exam Fee Paid? *</label>
                      <select
                        required
                        value={feesStatus}
                        onChange={(e: any) => setFeesStatus(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-yellow-500"
                      >
                        <option value="Pending">Not Paid Yet (Will pay at the center later)</option>
                        <option value="Paid">Paid (Already handed over to the Coach)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-zinc-400 text-[9px] uppercase tracking-wider font-bold mb-1.5 block">Parent / Guardian Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder="Parent Name"
                        className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-400 text-[9px] uppercase tracking-wider font-bold mb-1.5 block">Parent Phone Number *</label>
                      <input 
                        type="tel" 
                        required 
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        placeholder="Phone Number"
                        className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-yellow-500"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-400 text-[9px] uppercase tracking-wider font-bold mb-1.5 block">School / Academic Institution Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="e.g. Podar International School, Pune"
                        className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-4 border border-zinc-900 rounded-xl space-y-3">
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                      * NOTE: After submitting, please hand over the physical belt exam fee directly to your child's coach at the center if not paid already.
                    </p>
                    <div className="flex justify-end space-x-3 pt-2">
                      {activeTab === 'exam' ? (
                        <button
                          type="button"
                          onClick={() => setActiveTabState('progress')}
                          className="px-4 py-2 text-[10px] font-heading font-black uppercase tracking-wider text-zinc-400 hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowExamForm(false)}
                          className="px-4 py-2 text-[10px] font-heading font-black uppercase tracking-wider text-zinc-400 hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={formLoading}
                        className={`px-5 py-2 text-[10px] font-heading font-black uppercase tracking-wider rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shadow-md ${
                          activeTab === 'exam' 
                            ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/5' 
                            : 'bg-yellow-500 hover:bg-yellow-405 text-slate-950 shadow-yellow-500/5'
                        }`}
                      >
                        {formLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Submit Exam Application</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </AnimatePresence>

            {formSuccess && successInfo && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 p-6 sm:p-8 rounded-2xl relative shadow-2xl animate-fade-in text-center overflow-hidden max-w-xl mx-auto my-6 text-zinc-100"
              >
                {/* Decorative glow */}
                <div className="absolute -top-12 -left-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/30 mb-4 animate-bounce">
                  <Award className="w-8 h-8 text-amber-500" />
                </div>

                <div className="space-y-4">
                  <span className="font-heading font-black text-xs sm:text-sm uppercase text-amber-500 tracking-[0.15em] block">
                    🥋 RESPECT. DISCIPLINE. PERSEVERANCE.
                  </span>
                  
                  <h4 className="font-title text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                    Registration Confirmed!
                  </h4>

                  <p className="text-zinc-350 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
                    Thank you, Parent! <strong className="text-amber-400 font-bold">{successInfo.studentName}</strong> is now officially registered to challenge the <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold font-mono text-[11px] sm:text-xs">{successInfo.targetBelt}</span> standard. We are honored to accompany them on this sacred journey of self-improvement.
                  </p>

                  <div className="bg-slate-950/80 p-4 border border-zinc-900/60 rounded-xl space-y-2 max-w-sm mx-auto text-left text-[11px] text-zinc-400 font-sans">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Student Name:</span>
                      <strong className="text-zinc-200">{successInfo.studentName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Target Level:</span>
                      <strong className="text-amber-500">{successInfo.targetBelt}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Status:</span>
                      <strong className="text-yellow-500 uppercase tracking-wider">Pending Verification</strong>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormSuccess(false);
                        setSuccessInfo(null);
                      }}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-heading font-black text-[10px] uppercase tracking-widest px-6 py-2.5 rounded-lg shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer w-full sm:w-auto"
                    >
                      Awesome, Thank You
                    </button>
                    <a
                      href={`https://wa.me/919049688172?text=${encodeURIComponent(`🥋 Lions Karate Club: registered ${successInfo.studentName} for the ${successInfo.targetBelt} Belt Exam!`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-[10px] uppercase tracking-widest px-6 py-2.5 rounded-lg shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 w-full sm:w-auto"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Notify on WhatsApp
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AUTOMATED ELIGIBILITY ALERT CARD */}
            {activeTab === 'progress' && (() => {
              const { required, nextBelt } = getRequiredClassesForCurrentBelt(activeStudent.beltLevel);
              const isEligible = attendanceCount >= required;
              // Find any upcoming exam schedule that matches the student's branch or target belt
              const nextExam = examSchedules.length > 0 ? examSchedules[0] : null;

              if (attendanceLoading) {
                return (
                  <AttendanceSkeleton />
                );
              }

              if (isEligible) {
                const parentText = `Hello Coach Shihan Maruti Jadhav, my child *${activeStudent.fullName}* (Roll ID: *${activeStudent.studentId}*) has successfully completed *${attendanceCount}/${required}* classes and is fully eligible for promotion to *${nextBelt}*! Please find our request for the upcoming belt test slot. Thank you!`;
                const encodedParentText = encodeURIComponent(parentText);
                const parentWhatsAppUrl = `https://wa.me/919049688172?text=${encodedParentText}`;

                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-slate-950 border-2 border-yellow-500 p-6 rounded-2xl shadow-xl overflow-hidden animate-fade-in group text-left"
                  >
                    <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:scale-110 pointer-events-none transition-transform">
                      <GraduationCap className="w-24 h-24 text-yellow-500 animate-pulse" />
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div className="space-y-2.5 max-w-xl">
                        <div className="flex items-center space-x-2">
                          <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
                          </span>
                          <span className="text-[10px] font-heading font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-2.5 py-1 rounded-md border border-yellow-500/15">
                            Exam Stage Reached! 🎉
                          </span>
                        </div>
                        
                        <h4 className="font-title text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                          Eligible For Promotion Exam!
                        </h4>
                        
                        <p className="text-zinc-350 text-xs leading-relaxed font-sans">
                          Awesome work! <strong>{activeStudent.fullName}</strong> has completed <strong>{attendanceCount}</strong> classes of high-intensity training. The required promotion milestone for their rank is <strong>{required}</strong> classes. They are now fully qualified to apply for the <strong>{nextBelt}</strong> test!
                        </p>

                        {nextExam ? (
                          <div className="bg-slate-950/80 border border-zinc-850 p-3.5 rounded-xl text-[11px] text-zinc-400 mt-3 font-sans space-y-1">
                            <div className="text-yellow-500 font-extrabold flex items-center gap-1 uppercase tracking-wider text-[10px]">
                              <Calendar className="w-3.5 h-3.5" /> Upcoming Scheduled Exam Date:
                            </div>
                            <div>
                              📅 <strong>{nextExam.examDate}</strong> @ <strong>{nextExam.venueDetails || "Lions Main Dojo Gym"}</strong>
                            </div>
                            <div className="italic text-zinc-550 mt-1">
                              Prerequisites: {nextExam.prerequisites || "Full LKCP Dojo Uniform (Gi) and approved belt guards."}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-550 italic mt-2">
                            The upcoming scheduling test slots are being determined. Standard fees and Gi review instructions will be announced soon.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 self-stretch md:self-center justify-center md:min-w-[210px]">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTabState('exam');
                            setShowExamForm(true);
                          }}
                          className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-heading font-black text-[10px] uppercase tracking-wider px-5 py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-yellow-500/5 text-center flex items-center justify-center gap-2"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-slate-950" />
                          <span>Apply For Exam Now</span>
                        </button>

                        <a
                          href={parentWhatsAppUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-[10px] uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow-md text-center flex items-center justify-center gap-2 cursor-pointer no-underline"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-white animate-bounce" />
                          <span>Send WhatsApp Alert</span>
                        </a>

                        {'Notification' in window && Notification.permission !== 'granted' && (
                          <button
                            type="button"
                            onClick={async () => {
                              const permission = await Notification.requestPermission();
                              if (permission === 'granted') {
                                new Notification('Lions Karate Club', {
                                  body: 'Automatic browser-based exam eligibility notification active!'
                                });
                              }
                            }}
                            className="bg-slate-950 hover:bg-slate-900 border border-zinc-850 text-zinc-400 hover:text-white font-heading font-black text-[9px] uppercase tracking-wider py-2 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Bell className="w-3 h-3 text-yellow-500 animate-pulse" />
                            <span>Allow Push Alerts</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              } else {
                const pct = Math.min(100, Math.floor((attendanceCount / required) * 100));
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/10 border border-zinc-900 p-5 rounded-2xl text-left"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-grow">
                        <span className="text-[9px] font-heading font-black text-yellow-500 bg-yellow-500/5 border border-yellow-500/10 px-2.5 py-1 rounded-md uppercase tracking-widest">
                          Next Promotion Target Stage 🥋
                        </span>
                        <h4 className="font-heading text-xs font-black text-white uppercase tracking-wider mt-1.5">
                          Belt Promo Training Progress
                        </h4>
                        <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                          <strong>{activeStudent.fullName}</strong> is working towards their <strong>{nextBelt}</strong> certification. They have successfully attended <strong>{attendanceCount}</strong> classes out of the required <strong>{required}</strong> sessions to qualify for testing.
                        </p>
                      </div>

                      <div className="shrink-0 w-full sm:w-48 text-right self-stretch sm:self-center flex flex-col justify-center">
                        <div className="flex justify-between items-center text-[10px] mb-1.5">
                          <span className="text-zinc-500 uppercase tracking-widest font-heading font-black">Progress Status</span>
                          <span className="font-mono text-white font-bold">{pct}% ({attendanceCount}/{required})</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-zinc-900/60">
                          <div 
                            className="bg-yellow-500 h-full rounded-full transition-all duration-700" 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              }
            })()}

            {/* VISUAL BELT PROGRESS TIMELINE */}
            {activeTab === 'progress' && (
              <div className="bg-slate-900/40 border border-zinc-900/80 p-6 sm:p-8 rounded-2xl space-y-6 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-900/60 pb-3">
                <h4 className="font-heading text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-yellow-500 shrink-0" />
                  Karate Belt Progress Path
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => triggerBeltCelebration()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-heading font-black text-[11px] uppercase tracking-wider shadow-lg hover:shadow-yellow-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-slate-950" />
                    <span>Celebrate Progress 🎉</span>
                  </button>
                  <span className="text-[10px] font-mono font-bold text-yellow-500 uppercase tracking-widest bg-yellow-500/5 px-2.5 py-1 rounded border border-yellow-500/20 shadow-sm">
                    CHILD'S CURRENT BELT: {activeStudent.beltLevel.split(' (')[0]}
                  </span>
                </div>
              </div>

              {/* Responsive interactive timeline grid of Shotokan Belts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                {(() => {
                  const getBeltIdx = (bName: string) => {
                    if (!bName) return 0;
                    const clean = bName.split('(')[0].toLowerCase().trim();
                    const idx = BELT_LEVELS.findIndex(b => {
                      const bClean = b.name.split('(')[0].toLowerCase().trim();
                      return clean === bClean || clean.includes(bClean) || bClean.includes(clean);
                    });
                    return idx !== -1 ? idx : 0;
                  };

                  let currentBeltIdx = getBeltIdx(activeStudent.beltLevel);

                  if (registeredExams && registeredExams.length > 0) {
                    registeredExams.forEach(ex => {
                      if ((ex.isPublished !== false) && (ex.status === 'passed' || ex.status === 'promoted') && ex.targetBelt) {
                        const exIdx = getBeltIdx(ex.targetBelt);
                        if (exIdx > currentBeltIdx) {
                          currentBeltIdx = exIdx;
                        }
                      }
                    });
                  }

                  return BELT_LEVELS.map((belt, idx) => {
                    const isCurrent = idx === currentBeltIdx;
                    const isCompleted = idx < currentBeltIdx;

                    return (
                      <motion.div 
                        key={idx}
                        whileHover={{ scale: isCurrent ? 1.08 : 1.04 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => triggerBeltCelebration(belt.name)}
                        title={`Tap to celebrate ${belt.name.split(' (')[0]} Belt!`}
                        className={`relative p-3.5 sm:p-4 rounded-xl border text-center transition-all duration-300 flex flex-col justify-between items-center cursor-pointer ${
                          isCurrent 
                            ? 'border-yellow-500 bg-yellow-500/15 ring-2 ring-yellow-500/40 shadow-xl shadow-yellow-500/15 scale-105 z-10'
                            : isCompleted
                              ? 'border-emerald-500/50 bg-emerald-950/25 shadow-md shadow-emerald-500/5 hover:border-emerald-500/80'
                              : 'border-zinc-900 bg-zinc-950/40 opacity-45 hover:opacity-80 transition-opacity'
                        }`}
                      >
                        {/* REAL PHYSICAL SHOTOKAN BELT GRAPHIC WITH FABRIC STITCHING & EMBROIDERY */}
                        <div className="w-full flex-grow flex items-center justify-center min-h-[64px]">
                          <KarateBeltGraphic beltName={belt.name} />
                        </div>

                        <span className={`text-[10px] font-heading font-black block select-none whitespace-normal leading-tight uppercase tracking-wider mt-2.5 ${
                          isCurrent ? 'text-yellow-400' : isCompleted ? 'text-emerald-300' : 'text-zinc-500'
                        }`}>
                          {belt.name.split(' (')[0]}
                        </span>
                        
                        {isCurrent && (
                          <motion.span 
                            animate={{ scale: [1, 1.08, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-heading text-yellow-400 uppercase tracking-widest font-black bg-slate-950 px-2.5 py-0.5 rounded-full border border-yellow-500/60 shadow-lg shadow-yellow-500/20 whitespace-nowrap flex items-center gap-1"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
                            ACTIVE
                          </motion.span>
                        )}

                        {isCompleted && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-heading text-emerald-400 uppercase tracking-widest font-black bg-slate-950 px-2.5 py-0.5 rounded-full border border-emerald-500/50 shadow-md whitespace-nowrap">
                            PASSED ✓
                          </span>
                        )}
                      </motion.div>
                    );
                  });
                })()}
              </div>
            </div>
            )}



            {/* EXAMS & BELT GRADING HISTORICAL TIMELINE REGISTER LOGS */}
            {activeTab !== 'attendance' && (
              <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                <h4 className="font-title text-base font-extrabold text-white uppercase flex items-center gap-2">
                  <ClipboardList className="w-4.5 h-4.5 text-yellow-500" />
                  Past Exams & Performance Results
                </h4>

                {registeredExams.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400 font-sans shrink-0 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-yellow-500" />
                      Filter Exam Date:
                    </span>
                    <select
                      value={selectedExamDateFilter}
                      onChange={(e) => setSelectedExamDateFilter(e.target.value)}
                      className="bg-slate-950 border border-zinc-800 text-zinc-200 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-yellow-500 cursor-pointer font-sans"
                    >
                      <option value="all">All Exam Dates</option>
                      {availableExamDates.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {examsLoading && (
                <ExamsHistoricalSkeleton />
              )}

              {!examsLoading && registeredExams.length === 0 && (
                <div className="py-12 text-center text-zinc-550 bg-slate-900/10 border border-zinc-900 rounded-2xl p-6">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2.5 text-zinc-750" />
                  <h5 className="font-heading font-bold text-xs uppercase text-zinc-450 tracking-wider">No previous exam records found</h5>
                  <p className="text-[10px] text-zinc-650 mt-1 max-w-sm mx-auto">
                    Once your child registers and attends their first belt exam with the Coach, their grades, marks, and certificates will appear here.
                  </p>
                </div>
              )}

              {!examsLoading && registeredExams.length > 0 && displayedExams.length === 0 && (
                <div className="py-10 text-center text-zinc-550 bg-slate-900/10 border border-zinc-900 rounded-2xl p-6 space-y-3">
                  <Calendar className="w-8 h-8 mx-auto text-yellow-500/60" />
                  <h5 className="font-heading font-bold text-xs uppercase text-zinc-350 tracking-wider">
                    No result found for exam date: {selectedExamDateFilter}
                  </h5>
                  <p className="text-[10.5px] text-zinc-500 max-w-sm mx-auto">
                    Please select "All Exam Dates" in the date dropdown above to view all performance records for your child.
                  </p>
                  <button
                    onClick={() => setSelectedExamDateFilter('all')}
                    className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer"
                  >
                    Show All Exam Dates
                  </button>
                </div>
              )}

              {!examsLoading && displayedExams.length > 0 && (
                <div className="grid grid-cols-1 gap-5">
                  {displayedExams.map((exam) => {
                    const isResultPublished = true;
                    const isPassed = checkExamPassed(exam);
                    const gradeVal = getEffectiveGrade(exam);

                    return (
                      <div 
                        key={exam.id}
                        className="bg-slate-900/40 border border-zinc-850 p-4 sm:p-6 rounded-2xl relative overflow-hidden shadow-xl text-left space-y-4 hover:border-zinc-750 transition-colors w-full max-w-full min-w-0"
                      >
                        {/* Card Top Header: Exam Belt Title + Date + Grade/Status Badges */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-title font-black text-yellow-500 uppercase tracking-wider">
                                {exam.targetBelt.split(' (')[0]} BELT EXAM RESULT
                              </span>
                              <span className="text-[10px] font-mono text-zinc-500">
                                Applied On: {formatDate(exam.createdAt)}
                              </span>
                            </div>
                            <h4 className="text-sm sm:text-base font-extrabold text-white mt-1">
                              {activeStudent?.fullName || exam.studentName} <span className="text-zinc-500 font-mono text-xs">({activeStudent?.studentId || exam.studentId})</span>
                            </h4>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="text-[10.5px] font-mono text-zinc-300 bg-slate-950 px-3 py-1 rounded-lg border border-zinc-800 font-bold">
                              GRADE: <strong className="text-yellow-400 font-extrabold">{gradeVal}</strong>
                            </span>
                            {isPassed ? (
                              <span className="text-[10.5px] font-heading font-black uppercase text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
                                PASSED - BELT AWARDED 🎉
                              </span>
                            ) : (
                              <span className="text-[10.5px] font-heading font-black uppercase text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30">
                                {exam.status === 'pending' ? 'Result Pending' : 'Slot Approved'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Exam Info Metadata Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-sans bg-slate-950/60 p-3.5 rounded-xl border border-zinc-900">
                          <div>
                            <span className="text-zinc-500 text-[10px] uppercase font-mono block">Karate Coach</span>
                            <strong className="text-zinc-200 font-bold block mt-0.5">{exam.coachName || "Sensei Maruti Jadhav"}</strong>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-[10px] uppercase font-mono block">Dojo Branch</span>
                            <strong className="text-zinc-200 font-bold block mt-0.5">{exam.branch || "Manajinager Branch"}</strong>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-[10px] uppercase font-mono block">Exam Fees</span>
                            <strong className={`font-bold block mt-0.5 ${exam.feesStatus === 'Paid' ? 'text-emerald-400' : 'text-yellow-500'}`}>
                              {exam.feesStatus === 'Paid' ? 'Paid ✅' : 'Unpaid (Pay at Center)'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-[10px] uppercase font-mono block">Exam Date & Venue</span>
                            <strong className="text-zinc-200 font-bold block mt-0.5">{exam.examDate || "Evaluated in Class"}</strong>
                          </div>
                        </div>

                        {/* Official 7-Discipline Physical Evaluation Marksheet */}
                        {isResultPublished && (
                          <div className="bg-slate-950 p-3.5 border border-zinc-800 rounded-xl space-y-2">
                            <span className="text-[9px] font-heading font-black text-yellow-500 uppercase tracking-widest block">
                              OFFICIAL 7-DISCIPLINE PHYSICAL EVALUATION
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                              {[
                                { label: 'RUN', key: 'run' },
                                { label: 'JUMP', key: 'jump' },
                                { label: 'SIT-UPS', key: 'sidesitups' },
                                { label: 'KICKS', key: 'kicks' },
                                { label: 'STAMINA', key: 'conditionChecking' },
                                { label: 'KATA', key: 'kata' },
                                { label: 'KUMITE', key: 'kumite' }
                              ].map(disc => {
                                const dGrades = getEffectiveDisciplinesGrades(exam);
                                const val = (dGrades as any)[disc.key] || 'A';
                                return (
                                  <div key={disc.key} className="bg-slate-900 px-2.5 py-1.5 rounded border border-zinc-800 text-center">
                                    <span className="text-[8px] font-mono text-zinc-400 block">{disc.label}</span>
                                    <span className="text-xs font-heading font-black text-yellow-400 block mt-0.5">{val}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Coach Feedback & Remarks */}
                        {isResultPublished && (
                          <div className="bg-slate-950/60 p-3 border border-zinc-900 rounded-xl text-xs">
                            <span className="text-[8.5px] font-heading font-black text-amber-400 uppercase tracking-widest block mb-0.5">
                              💬 SENSEI EVALUATION & FEEDBACK
                            </span>
                            <p className="text-zinc-300 italic text-[11px]">
                              "{exam.remarks || "Outstanding spirit, discipline, and technical execution shown during the Karate Belt Examination!"}"
                            </p>
                          </div>
                        )}

                        {/* Bottom Action Bar: Certificate, Downloads, Fanfare & WhatsApp Share */}
                        {isResultPublished && isPassed && (
                          <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-zinc-800/80">
                            <button
                              type="button"
                              onClick={() => setSelectedCert(exam)}
                              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-yellow-500/10 flex items-center space-x-1.5"
                            >
                              <Award className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                              <span>Get Official Certificate</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCert(exam);
                                setTimeout(() => {
                                  handleDownloadCertificatePDF();
                                }, 300);
                              }}
                              className="bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 px-3.5 py-2.5 rounded-xl text-xs font-heading font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer"
                            >
                              <Download className="w-4 h-4 text-amber-400" />
                              <span>Download PDF</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                                  const now = audioCtx.currentTime;
                                  [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                                    const osc = audioCtx.createOscillator();
                                    const gain = audioCtx.createGain();
                                    osc.type = 'triangle';
                                    osc.frequency.setValueAtTime(freq, now + idx * 0.12);
                                    gain.gain.setValueAtTime(0.3, now + idx * 0.12);
                                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);
                                    osc.connect(gain);
                                    gain.connect(audioCtx.destination);
                                    osc.start(now + idx * 0.12);
                                    osc.stop(now + idx * 0.12 + 0.6);
                                  });
                                } catch (e) {
                                  console.log("Audio fanfare play:", e);
                                }
                              }}
                              className="bg-slate-950 hover:bg-slate-900 text-amber-400 border border-amber-500/20 px-3.5 py-2.5 rounded-xl text-xs font-heading font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer"
                            >
                              <span>🔊 Play Fanfare</span>
                            </button>

                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(
                                `🎉 Proud Parent Moment! My child ${activeStudent?.fullName || exam.studentName} passed the Karate Belt Exam at Lions Karate Club Pune and earned the ${exam.targetBelt} Belt! 🥋🏆`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 px-3.5 py-2.5 rounded-xl text-xs font-heading font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer sm:ml-auto"
                            >
                              <MessageCircle className="w-4 h-4 text-emerald-400" />
                              <span>Share on WhatsApp</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}

            {/* DIRECT COACH CONTACT */}
            <div className="bg-slate-900/30 border border-zinc-900 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h5 className="font-heading font-extrabold text-xs text-white uppercase tracking-wider">Having issues, or lost your Student ID?</h5>
                <p className="text-[11px] text-zinc-500 mt-0.5">Reach out to Shihan directly on WhatsApp to get instant support on admissions and roll ID numbers.</p>
              </div>
              <a 
                href="https://wa.me/919049688172?text=Hello%20Lions%20Karate%20Club%252c%20I%20need%20help%20with%20my%20Student%20ID%20Progress%20Tracker%20Roll%20Number."
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-lg flex items-center space-x-1.5 transition-all shadow cursor-auto shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Contact Coach</span>
              </a>
            </div>

          </div>
        )}

        {/* ATTENDANCE TRACKER MAIN PORTAL VIEW */}
        {activeTab === 'attendance' && (
          <div className="animate-fade-in shadow-xl">
            <AttendanceTracker />
          </div>
        )}

        {/* Certificate Modal */}
        {selectedCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm print-hide">
            <style>{`
              @media print {
                html, body {
                  background: white !important;
                  background-color: white !important;
                  color: black !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                }
                #root, .print-hide {
                  background: transparent !important;
                  background-color: transparent !important;
                  display: none !important;
                }
                body * {
                  visibility: hidden;
                }
                .printable-certificate, .printable-certificate * {
                  visibility: visible !important;
                }
                .printable-certificate {
                  visibility: visible !important;
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  right: 0 !important;
                  bottom: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  margin: 0 !important;
                  padding: 3rem !important;
                  border: 12px double #d97706 !important;
                  background: #fffbeb !important;
                  background-color: #fffbeb !important;
                  color: #0c0a09 !important;
                  box-shadow: none !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  box-sizing: border-box !important;
                  z-index: 9999999 !important;
                }
                div, section, main, header, footer, [role="dialog"] {
                  background: transparent !important;
                  background-color: transparent !important;
                  box-shadow: none !important;
                  border-color: transparent !important;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            `}</style>
            <div className="bg-slate-900 border border-zinc-800 rounded-2xl max-w-4xl w-full p-4 sm:p-6 relative shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print-hide">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                <div className="text-left">
                  <h3 className="font-heading font-black text-sm uppercase text-yellow-500 flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Official Belt Certificate
                  </h3>
                  <p className="text-[10px] text-zinc-500">View and print your child's official karate certificate</p>
                </div>
                <button 
                  onClick={() => setSelectedCert(null)}
                  className="p-1.5 hover:bg-zinc-800/80 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Frame Area */}
              <div id="printable-certificate-el" className="bg-amber-50/95 text-zinc-950 p-5 sm:p-10 rounded-xl border-8 border-amber-600 shadow-inner relative printable-certificate overflow-hidden text-center aspect-[1.414/1] max-w-full mx-auto font-serif" style={{ borderStyle: 'double', borderWidth: '10px' }}>
                {/* Watermark symbol background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                  <Award className="w-64 h-64 text-amber-900" />
                </div>

                {/* Elegant Pass Stamp Badge */}
                <div className="absolute top-3 right-3 sm:top-5 sm:right-6 z-20">
                  <div className="border-2 border-emerald-600 text-emerald-600 bg-emerald-50 rounded px-2.5 py-0.5 font-sans font-black text-[9px] sm:text-xs tracking-widest uppercase rotate-12 shadow-sm flex items-center space-x-1">
                    <span>RESULT:</span>
                    <span className="font-sans font-black">PASS</span>
                  </div>
                </div>

                {/* Top Header with official Club Logo */}
                <div className="relative z-10 flex flex-col items-center justify-center space-y-1.5 matches-header">
                  <img
                    src="https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781350907/logo_new_bgwsw9.jpg"
                    alt="Lions Karate Club Logo"
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-full bg-white p-0.5 border border-amber-350 shadow-md mb-0.5"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                  <div>
                    <h4 className="text-xs sm:text-sm md:text-base font-sans tracking-[0.2em] text-[#FF3B3F] font-black uppercase text-center leading-none">
                      LIONS KARATE CLUB PUNE
                    </h4>
                    <p className="text-[8px] sm:text-[9px] md:text-[11px] tracking-wider text-zinc-600 uppercase font-sans font-extrabold mt-1">
                      Shotokan Style Approved • Registered Shibu
                    </p>
                  </div>
                </div>

                {/* Main Title */}
                <div className="my-2.5 sm:my-4 md:my-5 relative z-10">
                  <h2 className="font-serif text-base sm:text-xl md:text-3xl font-extrabold text-amber-900 tracking-wide uppercase italic">
                    Certificate of Promotion
                  </h2>
                  <div className="w-20 sm:w-28 h-[1.5px] bg-amber-600 mx-auto mt-1"></div>
                </div>

                {/* Statement body */}
                <div className="space-y-2.5 sm:space-y-3.5 my-3 sm:my-5 md:my-6 text-[10px] sm:text-xs md:text-sm text-zinc-800 max-w-2xl mx-auto relative z-10 leading-relaxed">
                  <p className="italic text-zinc-500 font-serif text-[10px] sm:text-xs">This is to certify that</p>
                  <p className="text-sm sm:text-base md:text-xl font-bold uppercase tracking-wide text-zinc-900 border-b border-zinc-200 pb-1 max-w-md mx-auto font-sans">
                    {activeStudent?.fullName || selectedCert.studentName}
                  </p>
                  <p className="italic text-zinc-500 font-serif leading-relaxed text-[9px] sm:text-[10px] md:text-xs max-w-lg mx-auto">
                    having successfully demonstrated outstanding discipline, character, physical endurance, and required kata/kumite technical proficiency during examinations, is hereby officially promoted to the rank of
                  </p>
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <p className="text-xs sm:text-sm md:text-lg font-extrabold text-amber-700 uppercase tracking-widest font-sans">
                      {selectedCert.targetBelt || "Yellow Belt"}
                    </p>
                    <span className="text-[9px] sm:text-[10px] font-sans font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Exam Grade: <strong className="font-black text-emerald-800">
                        {getEffectiveGrade(selectedCert)}
                      </strong>
                    </span>
                  </div>
                  <p className="text-[7px] sm:text-[9px] text-zinc-500 mt-1 font-sans">
                    Student ID: <strong className="text-zinc-800">{selectedCert.studentId}</strong>
                  </p>
                  {(activeStudent?.schoolName || selectedCert.schoolName) && (
                    <p className="text-[8px] sm:text-[10px] text-amber-800 mt-1 font-sans">
                      Academic Institution: <strong className="text-zinc-900 font-bold">{activeStudent?.schoolName || selectedCert.schoolName}</strong>
                    </p>
                  )}
                </div>

                {/* Official 7-Discipline Evaluation Marksheet Table */}
                <div className="my-2 sm:my-3 max-w-xl mx-auto bg-amber-100/70 p-2 sm:p-2.5 rounded-lg border border-amber-300 relative z-10 font-sans text-left shadow-2xs">
                  <div className="flex items-center justify-between border-b border-amber-300/80 pb-1 mb-1.5">
                    <span className="text-[9px] sm:text-[10px] font-black text-amber-950 uppercase tracking-wider">
                      Official 7-Discipline Grade Marksheet
                    </span>
                    <span className="text-[8.5px] sm:text-[9.5px] font-extrabold text-amber-900">
                      Evaluated by: {selectedCert.examinerName || selectedCert.coachName || "Sensei Shivraj Jejure"}
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {[
                      { label: 'RUN', key: 'run' },
                      { label: 'JUMP', key: 'jump' },
                      { label: 'SIT-UPS', key: 'sidesitups' },
                      { label: 'KICKS', key: 'kicks' },
                      { label: 'STAMINA', key: 'conditionChecking' },
                      { label: 'KATA', key: 'kata' },
                      { label: 'KUMITE', key: 'kumite' },
                    ].map((disc) => {
                      const dGrades = getEffectiveDisciplinesGrades(selectedCert);
                      const gradeVal = (dGrades as any)[disc.key] || 'A';
                      return (
                        <div key={disc.key} className="bg-amber-50 p-1 rounded border border-amber-300 flex flex-col justify-between items-center text-center">
                          <span className="text-[7.5px] sm:text-[9px] font-black text-amber-950 block uppercase tracking-tight leading-snug whitespace-nowrap">
                            {disc.label}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-black text-emerald-800 block mt-0.5 leading-none">
                            {gradeVal}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Beautiful Engaging Karate Journey Note */}
                <div className="my-2 sm:my-3 max-w-lg mx-auto bg-amber-100/40 p-2 rounded-lg border border-amber-200/50 relative z-10 text-center font-serif">
                  <p className="italic text-[8px] sm:text-[10px] text-zinc-650 leading-snug">
                    "The ultimate aim of Karate lies not in victory or defeat, but in the perfection of the character of its participants." Remain humble, stay focused, and persist with determination.
                  </p>
                </div>

                {/* Bottom signature slots */}
                <div className="grid grid-cols-2 gap-8 sm:gap-16 mt-4 sm:mt-8 pt-3 relative z-10 text-[9px] sm:text-[11px] text-zinc-700 font-sans">
                  <div className="text-center">
                    <div className="h-5 flex items-end justify-center">
                      <span className="font-serif italic font-semibold text-zinc-600 border-b border-zinc-200 px-4">Sensei Maruti Jadhav & Sensei Shivraj Jejure</span>
                    </div>
                    <div className="pt-1 mt-1 text-[8px] uppercase tracking-wider font-bold text-zinc-500">
                      Karate Coach / Examiner
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="h-5 flex items-end justify-center">
                      <span className="font-serif italic text-amber-600 font-black">OFFICIAL SEAL</span>
                    </div>
                    <div className="pt-1 mt-1 text-[8px] uppercase tracking-wider font-bold text-zinc-500">
                      LIONS KARATE CLUB PUNE
                    </div>
                  </div>
                </div>
              </div>

              {/* Print & Download Control Buttons (Hidden when printing) */}
              <div className="mt-4 flex flex-wrap gap-2 justify-end border-t border-zinc-800 pt-3 shrink-0 print-hide">
                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  className="bg-zinc-800 hover:bg-zinc-750 text-zinc-350 text-[10px] font-heading font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handlePrintCertificate}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-heading font-black uppercase tracking-widest px-4.5 py-2 rounded-lg flex items-center space-x-1.5 shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer"
                  title="Open standard browser print dialog"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
                <button
                  type="button"
                  disabled={downloadingCert}
                  onClick={handleDownloadCertificatePDF}
                  className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-750 disabled:text-zinc-500 text-slate-950 text-[10px] font-heading font-black uppercase tracking-widest px-4.5 py-2 rounded-lg flex items-center space-x-1.5 shadow-lg hover:shadow-yellow-500/10 transition-all cursor-pointer"
                  title="Directly download high quality PDF file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingCert ? 'Downloading...' : 'Download Certificate PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BELT PROGRESS CELEBRATION MODAL */}
        <AnimatePresence>
          {showCelebrationModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto"
              onClick={() => setShowCelebrationModal(false)}
            >
              <motion.div
                initial={{ scale: 0.7, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.8, y: 20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="relative max-w-lg w-full bg-gradient-to-b from-zinc-900 via-slate-950 to-zinc-950 border-2 border-yellow-500/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-yellow-500/20 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Background glow effects */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

                {/* Close Button */}
                <button
                  onClick={() => setShowCelebrationModal(false)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700 p-2 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Trophy Header Badge */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-300 p-0.5 shadow-xl shadow-yellow-500/30 flex items-center justify-center"
                  >
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                      <Trophy className="w-10 h-10 text-yellow-400" />
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <span className="text-[10px] font-heading font-black text-yellow-400 uppercase tracking-widest bg-yellow-500/10 px-3.5 py-1 rounded-full border border-yellow-500/30 inline-flex items-center gap-1 mb-2 shadow-sm">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    BELT ACHIEVEMENT UNLOCKED!
                  </span>

                  <h3 className="text-xl sm:text-2xl font-heading font-black text-white uppercase tracking-tight mt-1">
                    {activeStudent?.fullName || 'Student'}
                  </h3>

                  {activeStudent?.studentId && (
                    <p className="text-xs text-zinc-400 font-mono mt-1">
                      KARATE ROLL ID: <strong className="text-yellow-400">{activeStudent.studentId}</strong>
                    </p>
                  )}
                </motion.div>

                {/* Physical Belt Graphic Display */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="my-5 p-5 bg-slate-900/80 rounded-2xl border border-yellow-500/30 shadow-inner flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-full max-w-[220px]">
                    <KarateBeltGraphic beltName={celebratedBeltName} />
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">CURRENT RANK STAGE</span>
                    <span className="text-lg sm:text-xl font-heading font-black text-yellow-400 uppercase tracking-wider block mt-0.5">
                      {celebratedBeltName.split('(')[0]}
                    </span>
                  </div>
                </motion.div>

                <p className="text-xs text-zinc-300 italic leading-relaxed px-2">
                  "Dedication, focus, and hard work paid off! Congratulations from Shihan Maruti Jadhav & Lions Karate Club Pune."
                </p>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-2.5 justify-center">
                  <button
                    onClick={() => triggerBeltCelebration(celebratedBeltName)}
                    className="flex-1 min-w-[140px] bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-yellow-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Celebrate Again</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`🎉 Super proud moment! My child *${activeStudent?.fullName || 'Student'}* (Roll ID: ${activeStudent?.studentId || ''}) has achieved the *${celebratedBeltName.split('(')[0]} Belt* in Karate at Lions Karate Club Pune! 🥋🏆`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[140px] bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Share on WhatsApp</span>
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STUDENT ID CARD DOWNLOAD MODAL */}
        <AnimatePresence>
          {showIDCardModal && activeStudent && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setShowIDCardModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl bg-slate-900 border border-zinc-850 rounded-2xl overflow-hidden p-6 relative my-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-850 uppercase">
                  <span className="font-heading font-bold text-sm text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-yellow-500" />
                    Student ID Pass Card (Front Side)
                  </span>
                  <button 
                    type="button"
                    onClick={() => setShowIDCardModal(false)}
                    className="bg-[#FF3B3F] hover:bg-rose-600 text-white font-heading font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg transition-all duration-150 flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-white stroke-[3px]" />
                    <span>CLOSE</span>
                  </button>
                </div>

                <IDCard admission={activeStudent} showSuccessBanner={false} />

                <div className="mt-8 pt-4 border-t border-zinc-850/60 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowIDCardModal(false)}
                    className="w-full sm:w-auto px-6 py-3 border border-zinc-850 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-[10px] font-heading font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4 stroke-[2.5px]" />
                    <span>Close & Return to Student Portal</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
