import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Search,
  UserCheck,
  Calendar,
  ShieldCheck,
  Trophy,
  Sparkles,
  Award,
  Lock,
  Check,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  X,
  RefreshCw
} from 'lucide-react';
import { DisciplineGrades, GradeValue, calculateOverallGrade } from '../types';

interface ExamCheckInProps {
  onBackToHome: () => void;
  initialTab?: 'checkin' | 'grading';
}

const DISCIPLINES: { key: keyof DisciplineGrades; label: string; icon: string; desc: string }[] = [
  { key: 'run', label: 'RUN', icon: '🏃', desc: 'Sprinting & Aerobic Endurance' },
  { key: 'jump', label: 'JUMP', icon: '🦘', desc: 'Agility & Explosiveness' },
  { key: 'sidesitups', label: 'SIDESITUPS', icon: '🧘', desc: 'Core Strength & Flexibility' },
  { key: 'kicks', label: 'KICKS', icon: '🥋', desc: 'Technique, Height & Power' },
  { key: 'conditionChecking', label: 'CONDITION CHECKING', icon: '💪', desc: 'Body Strength & Resilience' },
  { key: 'kata', label: 'KATA', icon: '⚔️', desc: 'Shotokan Forms & Rhythm' },
  { key: 'kumite', label: 'KUMITE', icon: '🔥', desc: 'Sparring & Fighting Spirit' },
];

const GRADE_OPTIONS: GradeValue[] = ['A+', 'A', 'B+', 'B', 'C', 'F'];

const QUICK_REMARKS = [
  'Excellent spirit, discipline, and sharp Kata execution.',
  'Good technique and focus; keep strengthening kicks and stamina.',
  'Satisfactory effort; continue practicing basics and stances.',
  'Requires additional practice on Kata & Kumite before promotion.'
];

function normalizeIdToken(val: string = ''): string {
  return val.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function extractNumericSerial(val: string = ''): number | null {
  const nums = val.match(/\d+/g);
  if (!nums || nums.length === 0) return null;
  const parsed = parseInt(nums[nums.length - 1], 10);
  return isNaN(parsed) ? null : parsed;
}

function matchesStudentQuery(candidate: any, rawQuery: string): boolean {
  const q = rawQuery.trim();
  if (!q) return false;
  const qLower = q.toLowerCase();
  const qAlphaNum = normalizeIdToken(q);
  const qSerial = extractNumericSerial(q);

  const idStr = String(candidate.studentId || '');
  const idAlphaNum = normalizeIdToken(idStr);
  const idSerial = extractNumericSerial(idStr);

  if (idStr.toLowerCase().includes(qLower)) return true;
  if (qAlphaNum && idAlphaNum && idAlphaNum.includes(qAlphaNum)) return true;
  // Exact serial number match (e.g. "134" matches "LKCP-2026-134" or "LKCP-2026-0134")
  if (qSerial !== null && idSerial !== null && qSerial === idSerial && /^\d+$/.test(q.replace(/lkcp|[-\s]/gi, ''))) {
    return true;
  }

  return (
    String(candidate.studentName || '').toLowerCase().includes(qLower) ||
    String(candidate.parentName || '').toLowerCase().includes(qLower) ||
    String(candidate.parentPhone || '').replace(/\D/g, '').includes(q.replace(/\D/g, '') || '___NO_DIGITS___')
  );
}

export default function ExamCheckIn({ onBackToHome, initialTab = 'checkin' }: ExamCheckInProps) {
  const [activeTab, setActiveTab] = useState<'checkin' | 'grading'>(initialTab);

  // Roster & check-in state
  const [searchQuery, setSearchQuery] = useState('');
  const [examsList, setExamsList] = useState<any[]>([]);
  const [admissionsList, setAdmissionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(6);

  // Exam Day Mode Status & Passcode Modal Gate (verified via /api/auth/verify-coach)
  const [isExamActive, setIsExamActive] = useState<boolean>(() => localStorage.getItem('is_exam_day_active') === 'true');
  const [examAuthPromptAction, setExamAuthPromptAction] = useState<'open' | 'close' | null>(null);
  const [examPasscodeInput, setExamPasscodeInput] = useState('');
  const [showExamPasscode, setShowExamPasscode] = useState(false);
  const [examPasscodeLoading, setExamPasscodeLoading] = useState(false);
  const [examPasscodeError, setExamPasscodeError] = useState('');

  // Track deep-link studentId from QR if present
  const [deepLinkStudentId, setDeepLinkStudentId] = useState<string>('');
  const [deepLinkApplied, setDeepLinkApplied] = useState(false);

  useEffect(() => {
    const hash = window.location.hash || '';
    const urlParams = new URLSearchParams(window.location.search);
    let hashParams = new URLSearchParams();
    if (hash.includes('?')) {
      hashParams = new URLSearchParams(hash.substring(hash.indexOf('?')));
    }
    const targetId = hashParams.get('studentId') || urlParams.get('studentId') || hashParams.get('id') || urlParams.get('id') || '';
    if (targetId.trim()) {
      setDeepLinkStudentId(targetId.trim());
      setSearchQuery(targetId.trim());
    }
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'exam_settings'), (snap) => {
      if (snap.exists()) {
        const active = snap.data().isExamActive ?? false;
        setIsExamActive(active);
        localStorage.setItem('is_exam_day_active', String(active));
      }
    }, (err) => {
      console.warn('Could not read exam settings:', err);
    });
    return () => unsub();
  }, []);

  const persistExamModeToggle = async (newStatus: boolean) => {
    await setDoc(doc(db, 'settings', 'exam_settings'), {
      isExamActive: newStatus,
      updatedAt: Date.now()
    }, { merge: true });
    setIsExamActive(newStatus);
    localStorage.setItem('is_exam_day_active', String(newStatus));
  };

  const handleRequestToggleExamMode = async (newStatus: boolean) => {
    // Always require password when Sensei taps "Activate Exam Day",
    // and require password/valid session when closing Exam Day Mode so visitors cannot close it.
    if (!newStatus) {
      const token = sessionStorage.getItem('lkcp_coach_token');
      if (token) {
        try {
          const res = await fetch('/api/auth/session', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.authenticated && data.role === 'coach') {
              await persistExamModeToggle(false);
              return;
            }
          }
        } catch {
          // fall through to modal
        }
      }
    }

    setExamPasscodeInput('');
    setExamPasscodeError('');
    setShowExamPasscode(false);
    setExamAuthPromptAction(newStatus ? 'open' : 'close');
  };

  const handleVerifyExamPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examAuthPromptAction) return;

    const code = examPasscodeInput.trim();
    if (!code) {
      setExamPasscodeError('Please enter the authorized Sensei passcode.');
      return;
    }

    setExamPasscodeLoading(true);
    setExamPasscodeError('');

    try {
      const res = await fetch('/api/auth/verify-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: code })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.authenticated && data.token) {
        sessionStorage.setItem('lkcp_coach_token', data.token);
        await persistExamModeToggle(examAuthPromptAction === 'open');
        setExamAuthPromptAction(null);
        setExamPasscodeInput('');
        setShowExamPasscode(false);
      } else {
        setExamPasscodeError(data.error || 'Incorrect Sensei passcode. Access denied.');
      }
    } catch {
      setExamPasscodeError('Authentication server unreachable. Please try again.');
    } finally {
      setExamPasscodeLoading(false);
    }
  };

  // Examiner Login State (verified via backend /api/auth/session)
  const [examinerName, setExaminerName] = useState(() => localStorage.getItem('examiner_name') || '');
  const [examinerPin, setExaminerPin] = useState('');
  const [showExaminerPin, setShowExaminerPin] = useState(false);
  const [isExaminerUnlocked, setIsExaminerUnlocked] = useState(false);
  const [examinerAuthLoading, setExaminerAuthLoading] = useState(false);
  const [examinerAuthError, setExaminerAuthError] = useState('');

  useEffect(() => {
    let active = true;
    const validateExaminerSession = async () => {
      try {
        const token = sessionStorage.getItem('lkcp_examiner_token');
        if (!token) return;
        const res = await fetch('/api/auth/session', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.role === 'examiner') {
            setIsExaminerUnlocked(true);
            if (data.name) setExaminerName(data.name);
            return;
          }
        }
        sessionStorage.removeItem('lkcp_examiner_token');
      } catch {
        // Ignore network errors
      }
    };
    validateExaminerSession();
    return () => { active = false; };
  }, []);

  // Examiner Single & Bulk Grading State
  const [gradingSearch, setGradingSearch] = useState('');
  const [examinerMode, setExaminerMode] = useState<'single' | 'bulk'>('single');
  const [selectedGradingStudent, setSelectedGradingStudent] = useState<any | null>(null);
  const [gradesInput, setGradesInput] = useState<DisciplineGrades>({});
  const [gradingStatusOverride, setGradingStatusOverride] = useState<'auto' | 'passed' | 'failed'>('auto');
  const [gradingRemarks, setGradingRemarks] = useState('');
  const [publishOnSave, setPublishOnSave] = useState(true);
  const [gradeSaveSuccess, setGradeSaveSuccess] = useState(false);
  const [gradeSaveError, setGradeSaveError] = useState('');

  // Examiner Bulk Grading State
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [bulkOutcome, setBulkOutcome] = useState<'passed' | 'failed'>('passed');
  const [bulkGradeValue, setBulkGradeValue] = useState<GradeValue>('A');
  const [bulkRemarksText, setBulkRemarksText] = useState('Excellent effort, discipline, and technique during belt examination.');
  const [bulkPublishFlag, setBulkPublishFlag] = useState(true);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkSuccessCount, setBulkSuccessCount] = useState<number | null>(null);

  const getBeltColorClasses = (beltName: string = '') => {
    const name = beltName.toLowerCase();
    if (name.includes('yellow')) return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-500', dot: 'bg-yellow-500' };
    if (name.includes('orange')) return { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-500', dot: 'bg-orange-500' };
    if (name.includes('green')) return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' };
    if (name.includes('blue')) return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-500' };
    if (name.includes('purple')) return { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-500' };
    if (name.includes('red')) return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500' };
    if (name.includes('brown')) return { bg: 'bg-amber-900/20', border: 'border-amber-800/30', text: 'text-amber-600', dot: 'bg-amber-800' };
    if (name.includes('black')) return { bg: 'bg-zinc-800/20', border: 'border-zinc-700/50', text: 'text-zinc-200', dot: 'bg-zinc-300' };
    return { bg: 'bg-slate-900/60', border: 'border-zinc-800', text: 'text-white', dot: 'bg-white' };
  };

  const getGradeBadgeColor = (grade?: GradeValue) => {
    switch (grade) {
      case 'A+': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'A': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'B+': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'B': return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'C': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
      case 'F': return 'bg-red-500/15 text-red-400 border-red-500/30';
      default: return 'bg-zinc-800 text-zinc-500 border-zinc-700';
    }
  };

  // Subscribe ONLY to registered `exams` (and read-only approved `admissions` for profile name/phone enrichment — NEVER inject un-registered students!)
  useEffect(() => {
    setLoading(true);
    const unsubExams = onSnapshot(collection(db, 'exams'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setExamsList(list);
      setLoading(false);
    }, (error) => {
      console.error('Failed to load exams:', error);
      setLoading(false);
    });

    const unsubAdmissions = onSnapshot(
      query(collection(db, 'admissions'), where('status', '==', 'approved')),
      (snapshot) => {
        setAdmissionsList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (error) => {
        console.warn('Notice loading admissions for enrichment:', error);
      }
    );

    return () => {
      unsubExams();
      unsubAdmissions();
    };
  }, []);

  // Build strict registered-only exam candidates enriched with admission contact info if any field was blank
  const allExamCandidates = useMemo(() => {
    const admById = new Map<string, any>();
    const admByName = new Map<string, any>();
    admissionsList.forEach(adm => {
      const normId = normalizeIdToken(adm.studentId || '');
      if (normId) admById.set(normId, adm);
      const normName = String(adm.fullName || '').trim().toLowerCase();
      if (normName) admByName.set(normName, adm);
    });

    // Deduplicate same studentId + targetBelt exam submissions (preferring checkedIn or newest)
    const dedupMap = new Map<string, any>();
    examsList.forEach(ex => {
      const normId = normalizeIdToken(ex.studentId || '');
      const adm = (normId && admById.get(normId)) || admByName.get(String(ex.studentName || '').trim().toLowerCase());

      const enriched = {
        ...ex,
        studentName: ex.studentName || adm?.fullName || 'Registered Student',
        parentName: ex.parentName || adm?.parentName || '',
        parentPhone: ex.parentPhone || adm?.phone || adm?.whatsApp || '',
        branch: ex.branch || adm?.branch || 'Manaji Nagar Branch',
      };

      const key = `${normId || String(enriched.studentName).toLowerCase()}__${String(enriched.targetBelt || '').toLowerCase().trim()}`;
      const prev = dedupMap.get(key);
      if (!prev) {
        dedupMap.set(key, enriched);
      } else {
        // Prefer active / checkedIn / newer record
        const prevScore = (prev.checkedIn ? 10 : 0) + ((prev.createdAt || 0) / 1e15);
        const currScore = (enriched.checkedIn ? 10 : 0) + ((enriched.createdAt || 0) / 1e15);
        if (currScore >= prevScore) {
          dedupMap.set(key, { ...prev, ...enriched, checkedIn: prev.checkedIn || enriched.checkedIn, checkInTime: enriched.checkInTime || prev.checkInTime });
        }
      }
    });

    return Array.from(dedupMap.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [examsList, admissionsList]);

  // Exam Day Check-In strictly shows ACTIVE / UPCOMING exam registrations (not old already-completed exams unless checked in today)
  const checkInEligibleCandidates = useMemo(() => {
    const twelveHoursAgo = Date.now() - 12 * 3600 * 1000;
    return allExamCandidates.filter(ex => {
      const st = String(ex.status || '').toLowerCase();
      if (st === 'pending' || st === 'approved' || st === 'registered') return true;
      if (ex.checkedIn && (ex.checkInTimestamp || 0) >= twelveHoursAgo) return true;
      return false;
    });
  }, [allExamCandidates]);

  // Auto-select candidate if QR deep-link studentId matches uniquely
  useEffect(() => {
    if (!isExamActive || !deepLinkStudentId || deepLinkApplied || loading) return;
    const matches = checkInEligibleCandidates.filter(c => matchesStudentQuery(c, deepLinkStudentId));
    if (matches.length === 1) {
      setSelectedStudent(matches[0]);
      setDeepLinkApplied(true);
    }
  }, [isExamActive, deepLinkStudentId, deepLinkApplied, loading, checkInEligibleCandidates]);

  // Countdown timer for automatic redirect back to roster search after check-in
  useEffect(() => {
    let timer: any;
    if (checkInSuccess) {
      setCountdown(6);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setSelectedStudent(null);
            setSearchQuery('');
            setCheckInSuccess(false);
            return 6;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [checkInSuccess]);

  const handleResetSearch = () => {
    setSelectedStudent(null);
    setSearchQuery('');
    setCheckInSuccess(false);
  };

  // Strict privacy filter: only show matches after parent/student types their Roll ID or Name
  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return checkInEligibleCandidates.filter(c => matchesStudentQuery(c, searchQuery));
  }, [checkInEligibleCandidates, searchQuery]);

  // Examiner Grading Filter (when Examiner IS logged in, show active/checked-in candidates or search results)
  const filteredGradingCandidates = useMemo(() => {
    const q = gradingSearch.trim();
    const list = q
      ? allExamCandidates.filter(c => matchesStudentQuery(c, q))
      : allExamCandidates;

    return [...list].sort((a, b) => {
      // Checked-in & not yet graded first
      const aScore = (a.checkedIn ? 4 : 0) + (a.status === 'approved' || a.status === 'pending' ? 2 : 0);
      const bScore = (b.checkedIn ? 4 : 0) + (b.status === 'approved' || b.status === 'pending' ? 2 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return (a.studentName || '').localeCompare(b.studentName || '');
    });
  }, [allExamCandidates, gradingSearch]);

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setCheckInSuccess(false);
    setErrorMsg('');
  };

  const handleConfirmAttendance = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const timestamp = Date.now();
      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const examRef = doc(db, 'exams', selectedStudent.id);

      await updateDoc(examRef, {
        checkedIn: true,
        checkInTime: timeString,
        checkInTimestamp: timestamp,
        updatedAt: timestamp
      });

      // Best-effort backup in daily attendance collection
      try {
        const todayDateStr = new Date().toISOString().split('T')[0];
        const attRecordId = `${selectedStudent.studentId}_${todayDateStr}`;
        await setDoc(doc(db, 'attendance', attRecordId), {
          id: attRecordId,
          studentId: selectedStudent.studentId,
          studentName: selectedStudent.studentName,
          date: todayDateStr,
          status: 'Present',
          checkInTime: timeString,
          checkInTimestamp: timestamp,
          batchName: 'Belt Exam Day',
          updatedAt: timestamp,
          createdAt: timestamp
        }, { merge: true });
      } catch (attErr) {
        console.warn('Attendance log backup notice:', attErr);
      }

      setSelectedStudent(prev => prev ? { ...prev, checkedIn: true, checkInTime: timeString } : null);
      setCheckInSuccess(true);
    } catch (err: any) {
      console.error('Check-in error:', err);
      setErrorMsg('Failed to complete check-in: ' + (err.message || 'Please try again or contact Sensei.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Examiner Login Handle (Server-Side Verified)
  const handleExaminerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setExaminerAuthError('');
    const trimmedName = examinerName.trim();
    const rawPin = examinerPin.trim();

    if (!trimmedName) {
      setExaminerAuthError('Please enter the Examiner / Sensei Name.');
      return;
    }
    if (!rawPin) {
      setExaminerAuthError('Please enter the Examiner Access Password.');
      return;
    }

    setExaminerAuthLoading(true);
    try {
      const res = await fetch('/api/auth/verify-examiner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, passcode: rawPin })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.authenticated && data.token) {
        localStorage.setItem('examiner_name', trimmedName);
        sessionStorage.setItem('lkcp_examiner_token', data.token);
        setIsExaminerUnlocked(true);
        setExaminerPin('');
        setShowExaminerPin(false);
      } else {
        setExaminerAuthError(data.error || 'Incorrect Examiner Access Password. Access denied.');
      }
    } catch {
      setExaminerAuthError('Unable to reach authentication server. Please try again.');
    } finally {
      setExaminerAuthLoading(false);
    }
  };

  const handleExaminerLogout = () => {
    sessionStorage.removeItem('lkcp_examiner_token');
    localStorage.removeItem('examiner_unlocked');
    setIsExaminerUnlocked(false);
    setSelectedGradingStudent(null);
    setShowExaminerPin(false);
  };

  // Select student for grading
  const handleSelectGradingStudent = (student: any) => {
    setSelectedGradingStudent(student);
    setGradesInput(student.disciplinesGrades || {});
    setGradingRemarks(student.remarks || '');
    if (student.status === 'passed' || student.status === 'failed') {
      setGradingStatusOverride(student.status);
    } else {
      setGradingStatusOverride('auto');
    }
    setPublishOnSave(student.isPublished ?? true);
    setGradeSaveSuccess(false);
    setGradeSaveError('');
  };

  const handleSetGrade = (key: keyof DisciplineGrades, value: GradeValue) => {
    setGradesInput(prev => ({ ...prev, [key]: value }));
  };

  const calculatedOverall = calculateOverallGrade(gradesInput);
  const resolvedSaveStatus: 'passed' | 'failed' =
    gradingStatusOverride !== 'auto'
      ? gradingStatusOverride
      : calculatedOverall === 'F'
        ? 'failed'
        : 'passed';

  // Save official examiner grades
  const handleSaveExaminerGrades = async () => {
    if (!selectedGradingStudent) return;
    setIsSubmitting(true);
    setGradeSaveError('');
    setGradeSaveSuccess(false);

    try {
      const overallGrade = calculatedOverall || (resolvedSaveStatus === 'failed' ? 'F' : 'A');
      const examRef = doc(db, 'exams', selectedGradingStudent.id);
      const timestamp = Date.now();

      const updatePayload = {
        disciplinesGrades: gradesInput,
        grade: overallGrade,
        status: resolvedSaveStatus,
        remarks: gradingRemarks.trim(),
        isPublished: publishOnSave,
        examinerName: examinerName.trim() || 'Sensei Examiner',
        gradedAt: timestamp,
        updatedAt: timestamp
      };

      await updateDoc(examRef, updatePayload);

      setSelectedGradingStudent(prev => prev ? { ...prev, ...updatePayload } : null);
      setGradeSaveSuccess(true);
      setTimeout(() => setGradeSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to save examiner grades:', err);
      setGradeSaveError('Failed to save grades to cloud server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Examiner Bulk Grading Submit
  const handleBulkExaminerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkSelectedIds.length === 0) return;

    setBulkSaving(true);
    setBulkSuccessCount(null);
    const timestamp = Date.now();
    const bulkDisciplinesPayload: DisciplineGrades = {
      run: bulkGradeValue,
      jump: bulkGradeValue,
      sidesitups: bulkGradeValue,
      kicks: bulkGradeValue,
      conditionChecking: bulkGradeValue,
      kata: bulkGradeValue,
      kumite: bulkGradeValue
    };

    try {
      let count = 0;
      for (const examId of bulkSelectedIds) {
        await updateDoc(doc(db, 'exams', examId), {
          disciplinesGrades: bulkDisciplinesPayload,
          grade: bulkGradeValue,
          status: bulkOutcome,
          remarks: bulkRemarksText.trim(),
          isPublished: bulkPublishFlag,
          examinerName: examinerName.trim() || 'Sensei Examiner',
          gradedAt: timestamp,
          updatedAt: timestamp
        });
        count++;
      }
      setBulkSuccessCount(count);
      setBulkSelectedIds([]);
      setTimeout(() => setBulkSuccessCount(null), 5000);
    } catch (err) {
      console.error('Bulk examiner grading error:', err);
      setGradeSaveError('Some records failed during bulk grading. Please retry.');
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-center">

      {/* COACH PASSCODE MODAL FOR EXAM DAY ACTIVATION / CLOSURE */}
      <AnimatePresence>
        {examAuthPromptAction && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="bg-slate-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 text-left shadow-2xl space-y-5 relative"
            >
              <button
                type="button"
                onClick={() => setExamAuthPromptAction(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#FF2A35]/15 border border-[#FF2A35]/30 text-[#FF2A35] flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-black text-base uppercase text-white tracking-wider">
                  {examAuthPromptAction === 'open' ? 'Sensei Exam Day Lock' : 'Close Exam Day Mode'}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Enter the authorized Coach Passcode to {examAuthPromptAction === 'open' ? 'activate parent QR check-in' : 'lock and close check-in'}.
                </p>
              </div>

              <form onSubmit={handleVerifyExamPasscode} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-heading font-black uppercase tracking-wider text-zinc-400 block">
                    Coach Passcode
                  </label>
                  <div className="relative">
                    <input
                      type={showExamPasscode ? 'text' : 'password'}
                      autoFocus
                      autoComplete="new-password"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                      value={examPasscodeInput}
                      onChange={(e) => setExamPasscodeInput(e.target.value.toUpperCase())}
                      placeholder="Enter authorized passcode"
                      className="w-full bg-slate-950 border border-zinc-800 text-sm font-mono text-white pl-3 pr-10 py-3 rounded-xl focus:outline-none focus:border-[#FF2A35] tracking-widest text-center placeholder:text-zinc-600 placeholder:normal-case placeholder:tracking-normal"
                    />
                    <button
                      type="button"
                      onClick={() => setShowExamPasscode(prev => !prev)}
                      aria-label={showExamPasscode ? 'Hide passcode' : 'Show passcode'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showExamPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {examPasscodeError && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-center">
                    {examPasscodeError}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setExamAuthPromptAction(null)}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-heading font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={examPasscodeLoading}
                    className="flex-1 py-3 bg-[#FF2A35] hover:bg-red-600 disabled:opacity-50 text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {examPasscodeLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                    <span>{examPasscodeLoading ? 'Verifying...' : 'Unlock'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Header & Tab Toggle Navigation */}
      <div className="inline-flex items-center space-x-2 bg-[#FF3B3F]/10 border border-[#FF3B3F]/20 px-3 py-1.5 rounded-full mb-3">
        <Sparkles className="w-3.5 h-3.5 text-[#FF3B3F]" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF3B3F]">Belt Examination Hub</span>
      </div>

      <h1 className="font-title text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mb-2 leading-tight">
        Lions Karate Examination
      </h1>
      <p className="text-zinc-500 text-xs max-w-sm mx-auto mb-6">
        Exam-day attendance check-in for registered exam students and 7-Discipline scoring portal.
      </p>

      {/* Main Mode Toggle Buttons */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-900 border border-zinc-800 p-1.5 rounded-2xl flex items-center space-x-2 shadow-xl">
          <button
            onClick={() => setActiveTab('checkin')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-heading text-xs uppercase font-black tracking-wider transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'checkin'
                ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg shadow-rose-600/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Attendance Check-In</span>
          </button>
          <button
            onClick={() => setActiveTab('grading')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-heading text-xs uppercase font-black tracking-wider transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'grading'
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 shadow-lg shadow-yellow-500/20 font-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Examiner Scoring</span>
          </button>
        </div>
      </div>

      {activeTab === 'checkin' ? (
        /* TAB 1: EXAM DAY ATTENDANCE CHECK-IN */
        <AnimatePresence mode="wait">
          {!isExamActive ? (
            /* EXAM DAY INACTIVE CARD */
            <motion.div
              key="inactive-step"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-900 border border-zinc-800 p-8 rounded-2xl text-center space-y-5 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-[#FF2A35] rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Calendar className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-heading text-xl font-black uppercase text-white tracking-wider">
                  Belt Examination Check-In Inactive
                </h3>
                <p className="text-zinc-400 text-xs max-w-md mx-auto leading-relaxed">
                  Official Belt Examination check-in is currently closed. On exam day, Sensei unlocks this gate with the Coach Passcode so parents of registered exam candidates can mark Present using Roll ID.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={onBackToHome}
                  className="w-full sm:w-auto px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Return to Homepage
                </button>
                <button
                  onClick={() => handleRequestToggleExamMode(true)}
                  className="w-full sm:w-auto px-6 py-3 bg-[#FF2A35] hover:bg-red-600 text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Sensei: Activate Exam Day</span>
                </button>
              </div>
            </motion.div>
          ) : !selectedStudent ? (
            <motion.div
              key="search-step"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-5 text-left"
            >
              <div className="bg-slate-900 border border-zinc-900 p-5 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-heading font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Exam Day Student Check-In</span>
                  </label>
                  <button
                    onClick={() => handleRequestToggleExamMode(false)}
                    className="text-[10px] font-mono font-bold text-zinc-400 hover:text-red-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
                  >
                    🔒 Close Exam Day Mode
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Enter Roll ID (e.g. LKCP-2026-134 or 134) or Student Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-zinc-800 text-sm font-medium text-white py-3.5 pl-11 pr-4 rounded-xl focus:outline-none focus:border-red-500 placeholder:text-zinc-600 transition-colors"
                  />
                </div>

                {loading ? (
                  <div className="text-center py-6 text-zinc-500 text-xs">
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Syncing registered exam candidates...</span>
                  </div>
                ) : searchQuery.trim().length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {filteredCandidates.length > 0 ? (
                      filteredCandidates.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectStudent(c)}
                          className="w-full text-left bg-slate-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 p-3.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <span className="font-heading font-black text-xs text-white group-hover:text-red-400 transition-colors uppercase block truncate">
                              {c.studentName}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-400 block truncate">
                              ID: <strong className="text-yellow-400">{c.studentId}</strong> • {c.currentBelt?.split(' (')[0]} → <strong className="text-emerald-400">{c.targetBelt?.split(' (')[0]}</strong>
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            {c.checkedIn ? (
                              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md block">
                                ✓ Present ({c.checkInTime || 'Gate'})
                              </span>
                            ) : (
                              <span className="text-[10px] font-heading font-black bg-red-500/15 text-red-400 border border-red-500/25 px-2.5 py-1 rounded-md uppercase block">
                                Mark Present
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-6 px-4 border border-dashed border-zinc-850 rounded-xl text-xs text-zinc-400 space-y-1.5">
                        <p className="font-bold text-zinc-300">No upcoming exam registration found for "{searchQuery}".</p>
                        <p className="text-[11px] text-zinc-500">
                          Only students registered for the current Belt Exam can check in here. Check Roll ID spelling or register on the Belt Exam Portal.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-zinc-850 rounded-xl text-zinc-500 text-xs space-y-2">
                    <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto" />
                    <p className="font-bold text-zinc-300">Enter Student Roll ID or Name above</p>
                    <p className="text-[11px] text-zinc-500">
                      Only registered belt exam candidates appear when searched. Student lists remain private.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={onBackToHome}
                className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-750 text-xs font-heading font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
              >
                Back to Dojo Homepage
              </button>
            </motion.div>
          ) : checkInSuccess ? (
            <motion.div
              key="success-step"
              initial={{ opacity: 0, scale: 0.93, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: -10 }}
              className="space-y-6 text-center"
            >
              <div className="space-y-3 py-4">
                <div className="relative inline-block">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.4, 1] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"
                  />
                  <div className="w-20 h-20 bg-emerald-950/80 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl relative z-10">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="font-heading font-black text-2xl uppercase tracking-wider text-emerald-400">
                    Marked Present ✓
                  </h2>
                  <p className="text-zinc-500 text-xs">
                    Exam attendance confirmed for {selectedStudent.studentName}!
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 border border-emerald-950/40 p-6 rounded-2xl text-left relative overflow-hidden shadow-2xl space-y-4">
                <div>
                  <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest font-black block">Registered Exam Candidate</span>
                  <h3 className="font-heading font-black text-xl text-white uppercase mt-0.5 leading-tight">
                    {selectedStudent.studentName}
                  </h3>
                  <span className="font-mono text-xs text-zinc-400 font-extrabold tracking-wider block mt-0.5">
                    ID: {selectedStudent.studentId}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <div className="bg-slate-950 p-3 rounded-xl border border-zinc-850">
                    <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-wider block">Branch</span>
                    <span className="font-heading font-black text-xs text-white block mt-1 truncate">
                      {selectedStudent.branch}
                    </span>
                  </div>
                  {(() => {
                    const beltColors = getBeltColorClasses(selectedStudent.targetBelt);
                    return (
                      <div className={`p-3 rounded-xl border ${beltColors.bg} ${beltColors.border}`}>
                        <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block">Testing Target</span>
                        <span className={`font-heading font-black text-xs ${beltColors.text} flex items-center space-x-1.5 mt-1 truncate`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${beltColors.dot}`} />
                          <span>{selectedStudent.targetBelt?.split(' (')[0]}</span>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-[#161619] border border-[#1E1E22] p-5 rounded-xl space-y-2 text-center mt-2">
                  <div className="text-xl sm:text-2xl font-black text-[#FF2A35] tracking-widest font-serif">
                    人格完成に努むること
                  </div>
                  <div className="text-xs font-mono text-amber-400/90 font-semibold italic">
                    Jinkaku kansei ni tsutomuru koto
                  </div>
                  <div className="font-heading text-sm font-black uppercase text-white tracking-wider flex items-center justify-center gap-1.5">
                    <span>Seek Perfection of Character. 🥋</span>
                  </div>
                  <div className="pt-1.5 border-t border-[#1E1E22] text-[10px] font-mono text-zinc-400">
                    — Gichin Funakoshi (Founder of Shotokan Karate)
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="bg-slate-950/80 border border-zinc-900 rounded-xl p-3.5 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Auto-returning...</span>
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    Next check-in in <strong className="text-sm font-black">{countdown}s</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleResetSearch}
                    className="py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-heading font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-98 cursor-pointer text-center"
                  >
                    Next Student Check-In
                  </button>
                  <button
                    onClick={onBackToHome}
                    className="py-3.5 bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-heading font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                  >
                    Homepage
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="details-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-5 text-left"
            >
              <div className="bg-slate-900 border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-slate-950 p-4.5 border-b border-zinc-900 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">Verified Exam Candidate</span>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-zinc-550 hover:text-white text-[10px] font-heading font-black uppercase tracking-widest bg-zinc-900 px-2.5 py-1 rounded transition-colors cursor-pointer"
                  >
                    Change Student
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <h2 className="font-heading font-black text-xl text-white uppercase leading-tight">
                      {selectedStudent.studentName}
                    </h2>
                    <span className="font-mono text-xs text-yellow-500 font-extrabold tracking-widest block mt-1">
                      ROLL ID: {selectedStudent.studentId}
                    </span>
                    <span className="text-xs text-zinc-400 block mt-1">
                      Branch: {selectedStudent.branch}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-zinc-850">
                      <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Previous Belt</span>
                      <span className="text-xs text-white font-heading font-black uppercase tracking-wider block mt-1 truncate">
                        {selectedStudent.currentBelt?.split(' (')[0]}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-zinc-850 border-emerald-950/45">
                      <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-widest block">Exam Target Belt</span>
                      <span className="text-xs text-emerald-400 font-heading font-black uppercase tracking-wider block mt-1 truncate">
                        {selectedStudent.targetBelt?.split(' (')[0]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl text-center">
                    {errorMsg}
                  </div>
                )}

                {selectedStudent.checkedIn && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl text-center flex items-center justify-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Marked Present at {selectedStudent.checkInTime || 'Exam Gate'}. Tap below to re-confirm.</span>
                  </div>
                )}

                <button
                  onClick={handleConfirmAttendance}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-500 hover:from-rose-600 hover:to-red-600 text-white font-heading font-black uppercase tracking-widest rounded-xl transition-all shadow-lg cursor-pointer text-center text-xs flex items-center justify-center space-x-2 active:scale-98"
                >
                  {isSubmitting ? (
                    <span>Recording Attendance...</span>
                  ) : (
                    <>
                      <UserCheck className="w-4.5 h-4.5 text-white" />
                      <span>{selectedStudent.checkedIn ? 'Re-confirm Present & Check-In' : 'Confirm Present & Check-In'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setSelectedStudent(null)}
                  className="w-full py-3 bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 text-[11px] font-heading font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                >
                  Go Back to Search
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        /* TAB 2: EXAMINER SCORING & BULK EVALUATION PORTAL */
        <div className="space-y-6 text-left">
          {!isExaminerUnlocked ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 mx-auto">
                <Lock className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-heading font-black text-lg uppercase text-white tracking-wide">
                  Examiner Login Access
                </h3>
                <p className="text-zinc-500 text-xs max-w-sm mx-auto">
                  Enter your Examiner / Coach Name and Access Password to grade students, add remarks, and set Pass/Fail outcomes.
                </p>
              </div>

              <form onSubmit={handleExaminerLogin} className="space-y-4 max-w-md mx-auto">
                <div className="space-y-1">
                  <label className="text-[10px] font-heading font-black uppercase tracking-wider text-zinc-400">
                    Examiner / Sensei Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sensei Shivraj / Sensei Maruti"
                    value={examinerName}
                    onChange={(e) => setExaminerName(e.target.value)}
                    className="w-full bg-slate-950 border border-zinc-800 text-sm font-medium text-white p-3 rounded-xl focus:outline-none focus:border-yellow-500 placeholder:text-zinc-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-heading font-black uppercase tracking-wider text-zinc-400">
                    Examiner Access Password
                  </label>
                  <div className="relative">
                    <input
                      type={showExaminerPin ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Enter examiner access password"
                      value={examinerPin}
                      onChange={(e) => setExaminerPin(e.target.value)}
                      className="w-full bg-slate-950 border border-zinc-800 text-sm font-mono text-white pl-3 pr-10 py-3 rounded-xl focus:outline-none focus:border-yellow-500 tracking-widest text-center placeholder:text-zinc-600 placeholder:normal-case placeholder:tracking-normal"
                    />
                    <button
                      type="button"
                      onClick={() => setShowExaminerPin(prev => !prev)}
                      aria-label={showExaminerPin ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showExaminerPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {examinerAuthError && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-center">
                    {examinerAuthError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={examinerAuthLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-amber-500 disabled:opacity-50 text-slate-950 font-heading font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-yellow-500/20 active:scale-98 cursor-pointer"
                >
                  {examinerAuthLoading ? 'Verifying...' : 'Unlock Examiner Portal'}
                </button>
              </form>
            </motion.div>
          ) : (
            /* Examiner Unlocked Workspace */
            <div className="space-y-6">
              {/* Active Examiner Banner */}
              <div className="bg-slate-900 border border-zinc-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-500 font-black text-sm">
                    🥋
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Active Examiner</span>
                    <span className="font-heading font-black text-sm text-white uppercase block">
                      {examinerName || 'Sensei Examiner'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExaminerMode('single');
                      setSelectedGradingStudent(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-heading font-black uppercase tracking-wider border cursor-pointer ${
                      examinerMode === 'single'
                        ? 'bg-yellow-500 text-slate-950 border-yellow-400'
                        : 'bg-slate-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    Single Score
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExaminerMode('bulk');
                      setSelectedGradingStudent(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-heading font-black uppercase tracking-wider border cursor-pointer ${
                      examinerMode === 'bulk'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    ⚡ Bulk Pass/Fail
                  </button>
                  <button
                    onClick={handleExaminerLogout}
                    className="text-zinc-500 hover:text-red-400 text-[10px] font-heading font-black uppercase tracking-wider bg-slate-950 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-red-950 transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {examinerMode === 'bulk' ? (
                /* EXAMINER BULK PASS / FAIL & REMARKS PANEL */
                <form onSubmit={handleBulkExaminerSubmit} className="bg-slate-900 border border-amber-500/30 p-5 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <h3 className="font-heading font-black text-sm uppercase text-amber-400 tracking-wider">
                        Bulk Pass / Fail & Remarks Grading
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Select checked-in or registered candidates to award Pass/Fail + Remarks in bulk.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setBulkSelectedIds(allExamCandidates.filter(c => c.checkedIn).map(c => c.id))}
                        className="text-[10px] font-heading font-black uppercase px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 cursor-pointer"
                      >
                        Select Present ({allExamCandidates.filter(c => c.checkedIn).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkSelectedIds([])}
                        className="text-[10px] font-heading font-black uppercase px-2.5 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-heading font-black uppercase text-zinc-400 block mb-1">Outcome Status</label>
                      <select
                        value={bulkOutcome}
                        onChange={(e) => setBulkOutcome(e.target.value as 'passed' | 'failed')}
                        className="w-full bg-slate-950 border border-zinc-800 text-xs font-bold text-white p-2.5 rounded-xl"
                      >
                        <option value="passed">✅ PASS (Promote)</option>
                        <option value="failed">❌ FAIL (Needs Retry)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-heading font-black uppercase text-zinc-400 block mb-1">Overall Grade</label>
                      <select
                        value={bulkGradeValue}
                        onChange={(e) => setBulkGradeValue(e.target.value as GradeValue)}
                        className="w-full bg-slate-950 border border-zinc-800 text-xs font-bold text-yellow-400 p-2.5 rounded-xl"
                      >
                        {GRADE_OPTIONS.map(g => (
                          <option key={g} value={g}>Grade {g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-heading font-black uppercase text-zinc-400 block mb-1">Remarks</label>
                    <input
                      type="text"
                      value={bulkRemarksText}
                      onChange={(e) => setBulkRemarksText(e.target.value)}
                      placeholder="Enter Sensei remarks..."
                      className="w-full bg-slate-950 border border-zinc-800 text-xs text-white p-2.5 rounded-xl"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {filteredGradingCandidates.map(c => {
                      const isChecked = bulkSelectedIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            setBulkSelectedIds(prev =>
                              prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id]
                            )
                          }
                          className={`w-full text-left p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-amber-500/10 border-amber-500/40'
                              : 'bg-slate-950 border-zinc-850 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isChecked ? <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" /> : <Square className="w-4 h-4 text-zinc-600 shrink-0" />}
                            <div className="min-w-0">
                              <span className="font-heading font-black text-xs text-white uppercase block truncate">{c.studentName}</span>
                              <span className="font-mono text-[10px] text-zinc-400 block truncate">
                                {c.studentId} • {c.targetBelt?.split(' (')[0]}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {c.checkedIn && (
                              <span className="text-[9px] font-mono bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                                Present
                              </span>
                            )}
                            {(c.status === 'passed' || c.status === 'failed') && (
                              <span className={`text-[9px] font-heading font-black uppercase px-2 py-0.5 rounded border ${
                                c.status === 'passed' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-red-500/15 text-red-300 border-red-500/30'
                              }`}>
                                {c.status}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-zinc-850 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-zinc-300 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bulkPublishFlag}
                        onChange={(e) => setBulkPublishFlag(e.target.checked)}
                        className="w-4 h-4 accent-amber-500"
                      />
                      <span>Publish results immediately</span>
                    </label>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">{bulkSelectedIds.length} selected</span>
                  </div>

                  {bulkSuccessCount !== null && (
                    <div className="bg-emerald-500/15 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-400 font-bold text-center">
                      ✓ Updated Pass/Fail & Remarks for {bulkSuccessCount} student(s)!
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={bulkSaving || bulkSelectedIds.length === 0}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-heading font-black text-xs uppercase tracking-widest rounded-xl disabled:opacity-50 cursor-pointer"
                  >
                    {bulkSaving ? 'Saving Bulk Results...' : `Apply ${bulkOutcome.toUpperCase()} to ${bulkSelectedIds.length} Selected`}
                  </button>
                </form>
              ) : !selectedGradingStudent ? (
                /* Select Candidate for Single 7-Discipline & Manual Pass/Fail Scoring */
                <div className="bg-slate-900 border border-zinc-900 p-5 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-heading font-black uppercase tracking-wider text-yellow-500 flex items-center gap-2">
                      <Search className="w-4 h-4 text-yellow-500" />
                      Select Exam Candidate To Grade
                    </label>
                    <span className="text-[10px] font-mono text-zinc-500">{allExamCandidates.length} Registered</span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Filter by Student Name or LKCP Roll ID..."
                      value={gradingSearch}
                      onChange={(e) => setGradingSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-zinc-800 text-sm font-medium text-white py-3.5 pl-11 pr-4 rounded-xl focus:outline-none focus:border-yellow-500 placeholder:text-zinc-600 transition-colors"
                    />
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {filteredGradingCandidates.length > 0 ? (
                      filteredGradingCandidates.map((c) => {
                        const overall = c.grade || calculateOverallGrade(c.disciplinesGrades);
                        return (
                          <button
                            key={c.id}
                            onClick={() => handleSelectGradingStudent(c)}
                            className="w-full text-left bg-slate-950 hover:bg-zinc-900 border border-zinc-850 hover:border-yellow-500/50 p-3.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer gap-3"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-heading font-black text-xs text-white group-hover:text-yellow-400 transition-colors uppercase truncate">
                                  {c.studentName}
                                </span>
                                {c.checkedIn && (
                                  <span className="text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                    Present
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[10px] text-zinc-500 block truncate">
                                ID: {c.studentId} • {c.branch || 'N/A'}
                              </span>
                            </div>
                            <div className="text-right shrink-0 space-y-1">
                              <span className="text-[10px] font-heading font-black bg-zinc-900 text-zinc-300 px-2.5 py-1 rounded border border-zinc-800 uppercase block">
                                {c.targetBelt?.split(' (')[0]}
                              </span>
                              {overall ? (
                                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border inline-block ${getGradeBadgeColor(overall)}`}>
                                  {c.status === 'failed' ? 'FAIL' : c.status === 'passed' ? 'PASS' : ''} ({overall})
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono text-zinc-600 block">Not Graded</span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 border border-dashed border-zinc-850 rounded-xl text-xs text-zinc-500">
                        No registered exam candidate matching query found.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* 7-Discipline Scoring + Manual Pass/Fail & Remarks Board */
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-900 border border-zinc-800 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-mono font-bold bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20 uppercase">
                          Candidate Evaluation
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          ID: {selectedGradingStudent.studentId}
                        </span>
                      </div>
                      <h3 className="font-heading font-black text-xl text-white uppercase mt-1">
                        {selectedGradingStudent.studentName}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Previous: <strong>{selectedGradingStudent.currentBelt?.split(' (')[0]}</strong> → Target: <strong className="text-yellow-400">{selectedGradingStudent.targetBelt?.split(' (')[0]}</strong>
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="bg-slate-950 p-3 rounded-xl border border-zinc-800 text-center min-w-28">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Outcome / Grade</span>
                        <span className={`text-sm font-heading font-black uppercase block mt-0.5 ${
                          resolvedSaveStatus === 'passed' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {resolvedSaveStatus.toUpperCase()} ({calculatedOverall || 'A'})
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedGradingStudent(null)}
                        className="p-2.5 bg-slate-950 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-colors cursor-pointer text-xs font-bold"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* 7 Discipline Scoring Cards Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-heading font-black uppercase tracking-wider text-zinc-400">
                        7 Karate Disciplines Scorecard
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">A+, A, B+, B, C, F</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {DISCIPLINES.map((discipline, idx) => {
                        const currentGrade = gradesInput[discipline.key];
                        return (
                          <div
                            key={discipline.key}
                            className={`p-4 rounded-xl border transition-all ${
                              currentGrade
                                ? 'bg-slate-900/90 border-yellow-500/30'
                                : 'bg-slate-900 border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{discipline.icon}</span>
                                <div>
                                  <span className="font-heading font-black text-xs text-white uppercase tracking-wider block">
                                    {idx + 1}. {discipline.label}
                                  </span>
                                  <span className="text-[9px] text-zinc-500 font-mono block">
                                    {discipline.desc}
                                  </span>
                                </div>
                              </div>
                              {currentGrade && (
                                <span className={`text-xs font-heading font-black px-2 py-0.5 rounded border uppercase ${getGradeBadgeColor(currentGrade)}`}>
                                  {currentGrade}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-6 gap-1.5 pt-2">
                              {GRADE_OPTIONS.map((gOption) => {
                                const isSelected = currentGrade === gOption;
                                return (
                                  <button
                                    key={gOption}
                                    type="button"
                                    onClick={() => handleSetGrade(discipline.key, gOption)}
                                    className={`py-2 text-xs font-heading font-black rounded-lg border transition-all cursor-pointer text-center ${
                                      isSelected
                                        ? 'bg-yellow-500 text-slate-950 border-yellow-400 font-extrabold shadow-md scale-105'
                                        : 'bg-slate-950 text-zinc-400 border-zinc-850 hover:border-zinc-700 hover:text-white'
                                    }`}
                                  >
                                    {gOption}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Manual Pass / Fail Override + Remarks + Save Action */}
                  <div className="bg-slate-900 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xl">
                    {/* Manual Pass / Fail Selector */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-heading font-black uppercase tracking-wider text-zinc-400 block">
                        Manual Pass / Fail Decision
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setGradingStatusOverride('auto')}
                          className={`py-2.5 px-2 rounded-xl border text-[10px] font-heading font-black uppercase cursor-pointer transition-all ${
                            gradingStatusOverride === 'auto'
                              ? 'bg-yellow-500 text-slate-950 border-yellow-400'
                              : 'bg-slate-950 text-zinc-400 border-zinc-800'
                          }`}
                        >
                          Auto ({calculatedOverall === 'F' ? 'Fail' : 'Pass'})
                        </button>
                        <button
                          type="button"
                          onClick={() => setGradingStatusOverride('passed')}
                          className={`py-2.5 px-2 rounded-xl border text-[10px] font-heading font-black uppercase cursor-pointer transition-all ${
                            gradingStatusOverride === 'passed'
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'bg-slate-950 text-emerald-400 border-zinc-800'
                          }`}
                        >
                          ✅ Manual Pass
                        </button>
                        <button
                          type="button"
                          onClick={() => setGradingStatusOverride('failed')}
                          className={`py-2.5 px-2 rounded-xl border text-[10px] font-heading font-black uppercase cursor-pointer transition-all ${
                            gradingStatusOverride === 'failed'
                              ? 'bg-red-500 text-white border-red-400'
                              : 'bg-slate-950 text-red-400 border-zinc-800'
                          }`}
                        >
                          ❌ Manual Fail
                        </button>
                      </div>
                    </div>

                    {/* Remarks Field + Quick Chips */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-heading font-black uppercase tracking-wider text-zinc-400 block">
                        Examiner Remarks & Feedback
                      </label>
                      <textarea
                        rows={2}
                        value={gradingRemarks}
                        onChange={(e) => setGradingRemarks(e.target.value)}
                        placeholder="Add remarks for student performance (optional)..."
                        className="w-full bg-slate-950 border border-zinc-800 text-xs text-white p-3 rounded-xl focus:outline-none focus:border-yellow-500 placeholder:text-zinc-600"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_REMARKS.map((r, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setGradingRemarks(r)}
                            className="text-[9px] bg-slate-950 hover:bg-zinc-800 text-zinc-400 hover:text-yellow-400 border border-zinc-800 px-2 py-1 rounded-lg cursor-pointer transition-colors"
                          >
                            + {r.slice(0, 38)}...
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                      <span>Assigned Examiner:</span>
                      <span className="font-heading font-black text-white uppercase bg-slate-950 px-2.5 py-1 rounded border border-zinc-800">
                        {examinerName}
                      </span>
                    </div>

                    {gradeSaveSuccess && (
                      <div className="bg-emerald-500/15 border border-emerald-500/30 p-3.5 rounded-xl text-center text-xs text-emerald-400 font-heading font-black uppercase tracking-wider flex items-center justify-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Grades, Remarks & Status Saved Successfully!</span>
                      </div>
                    )}

                    {gradeSaveError && (
                      <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl text-center text-xs text-red-400">
                        {gradeSaveError}
                      </div>
                    )}

                    <div className="bg-slate-950 p-3 rounded-xl border border-zinc-850 flex items-center justify-between">
                      <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-heading font-black uppercase text-zinc-300">
                        <input
                          type="checkbox"
                          checked={publishOnSave}
                          onChange={(e) => setPublishOnSave(e.target.checked)}
                          className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                        />
                        <span>Publish result to Student/Parent Portal</span>
                      </label>
                      <span className={`text-[9px] font-heading font-black uppercase px-2 py-0.5 rounded border ${
                        publishOnSave ? 'bg-purple-600/20 text-purple-300 border-purple-500/30' : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                      }`}>
                        {publishOnSave ? '📢 Published' : '🔒 Draft'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleSaveExaminerGrades}
                        disabled={isSubmitting || (!calculatedOverall && gradingStatusOverride === 'auto')}
                        className="flex-1 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-heading font-black uppercase tracking-widest text-xs rounded-xl shadow-lg hover:shadow-yellow-500/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <span>Saving Scores...</span>
                        ) : (
                          <>
                            <Trophy className="w-4 h-4 text-slate-950" />
                            <span>Save Grades, Remarks & Outcome</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedGradingStudent(null)}
                        className="py-4 px-6 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-800 rounded-xl font-heading font-black uppercase tracking-wider text-xs transition-colors cursor-pointer"
                      >
                        Back to List
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
