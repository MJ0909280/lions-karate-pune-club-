import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, Unlock, ShieldCheck, Users, CheckCircle2, XCircle, 
  Calendar, MapPin, Search, MessageCircle, CheckCheck, 
  AlertCircle, LogOut, RefreshCw, ArrowLeft, Phone,
  Eye, EyeOff, LayoutGrid, Target, ChevronLeft, ChevronRight,
  SkipForward, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, doc, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Admission, DOJO_BRANCHES, isExcludedSchool, 
  getCurrentMonthKey, formatMonthKey, getShortMonthKey, 
  getUnpaidMonths, generateMonthlyFeeWhatsAppMessage 
} from '../types';

interface CoachPortalProps {
  onBackToHome: () => void;
}

const TOKEN_STORAGE_KEY = 'lkcp_coach_token';

export default function CoachPortal({ onBackToHome }: CoachPortalProps) {
  // Authentication state (verified against backend /api/auth/session)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcodeError, setPasscodeError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  // Data states
  const [students, setStudents] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Branch & Filter states - Strictly the 3 Official Major Dojo Branches
  const [selectedBranch, setSelectedBranch] = useState<string>('Manaji Nagar Branch');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Monthly Fee Cycle State
  const currentMonthKey = getCurrentMonthKey();
  const [feeSavingId, setFeeSavingId] = useState<string | null>(null);

  // Attendance state: studentId -> 'present' | 'absent'
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent'>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [batchSaving, setBatchSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mindful UI Mode & Client-side Filters (0 extra Firebase reads)
  const [viewMode, setViewMode] = useState<'focus' | 'cards'>('cards');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unmarked' | 'present' | 'absent' | 'fees-due'>('all');
  const [focusIndex, setFocusIndex] = useState<number>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Verify existing HMAC token on mount
  useEffect(() => {
    let active = true;
    const validateExistingSession = async () => {
      try {
        const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
        if (!token) return;
        const res = await fetch('/api/auth/session', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.role === 'coach') {
            setIsAuthenticated(true);
            return;
          }
        }
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch {
        // Ignore network errors on mount
      }
    };
    validateExistingSession();
    return () => { active = false; };
  }, []);

  // Handle Passcode Submission via Backend Server
  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput.trim()) return;

    setAuthenticating(true);
    setPasscodeError('');

    try {
      const res = await fetch('/api/auth/verify-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcodeInput.trim() })
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }

      if (res.ok && data.authenticated && data.token) {
        try {
          sessionStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        } catch (err) {
          console.warn('Session storage warning:', err);
        }
        setIsAuthenticated(true);
        setPasscodeInput('');
        setShowPasscode(false);
      } else if (data && typeof data.error === 'string' && data.error) {
        setPasscodeError(data.error);
      } else if (res.status === 401) {
        setPasscodeError('Invalid passcode. Access denied.');
      } else {
        setPasscodeError(`Authentication service unavailable (HTTP ${res.status}).`);
      }
    } catch {
      setPasscodeError('Unable to reach authentication server. Please try again.');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (err) {
      console.warn('Session storage warning:', err);
    }
    setIsAuthenticated(false);
    setPasscodeInput('');
    setShowPasscode(false);
  };

  // Fetch Students (once on auth/refresh) and date-filtered Attendance records
  const fetchAttendanceForDate = async (targetDate: string) => {
    try {
      const attendanceQ = query(
        collection(db, 'attendance_logs'),
        where('date', '==', targetDate)
      );
      const attendanceSnap = await getDocs(attendanceQ);
      const dailyMap: Record<string, 'present' | 'absent'> = {};
      attendanceSnap.forEach((d) => {
        const record = d.data();
        if (record.studentId) {
          dailyMap[record.studentId] = record.status === 'absent' ? 'absent' : 'present';
        }
      });
      setAttendanceMap(dailyMap);
    } catch (err) {
      console.error('Failed to load attendance logs:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch admissions roster
      const admissionsSnap = await getDocs(collection(db, 'admissions'));
      const studentList: Admission[] = [];
      admissionsSnap.forEach((d) => {
        const data = d.data();
        if (data.status !== 'rejected') {
          studentList.push({ id: d.id, ...data } as Admission);
        }
      });

      // Sort alphabetically by fullName
      studentList.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
      setStudents(studentList);

      // 2. Fetch only selected date's attendance logs
      await fetchAttendanceForDate(selectedDate);
    } catch (err) {
      console.error('Failed to load coach portal data:', err);
      setError('Failed to load student roster. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && students.length > 0) {
      fetchAttendanceForDate(selectedDate);
    }
  }, [selectedDate]);

  // 3 Official Major Branches matching the website
  const majorBranches = DOJO_BRANCHES;

  // Helper to accurately match a student to the selected major branch
  const matchBranch = (student: Admission, targetBranch: string): boolean => {
    const rawBranch = (student.branch || '').toLowerCase().trim();
    
    if (targetBranch === 'Bhumkar Bridge Branch') {
      return rawBranch.includes('bhumkar');
    }
    
    if (targetBranch === 'Jambulwadi Lake View Branch') {
      return rawBranch.includes('jambulwadi') || rawBranch.includes('lake view') || rawBranch.includes('lakeview');
    }
    
    if (targetBranch === 'Manaji Nagar Branch') {
      // Must not belong to Bhumkar or Jambulwadi
      if (rawBranch.includes('bhumkar') || rawBranch.includes('jambulwadi') || rawBranch.includes('lake view') || rawBranch.includes('lakeview')) {
        return false;
      }
      // Matches if explicitly Manaji Nagar OR if branch is not explicitly set (defaults to HQ Dojo Manaji Nagar)
      return rawBranch.includes('manaji') || !student.branch || student.branch.trim() === '';
    }
    
    return false;
  };

  // Filter students by selected branch and search query
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // 1. Must match the selected branch
      if (!matchBranch(student, selectedBranch)) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (student.fullName || '').toLowerCase().includes(q);
        const idMatch = (student.studentId || '').toLowerCase().includes(q);
        const parentMatch = (student.parentName || '').toLowerCase().includes(q);
        const phoneMatch = (student.phone || '').includes(q) || (student.whatsApp || '').includes(q);
        if (!nameMatch && !idMatch && !parentMatch && !phoneMatch) return false;
      }

      return true;
    });
  }, [students, selectedBranch, searchQuery]);

  // Branch student counts for the 3 branches
  const branchCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Manaji Nagar Branch': 0,
      'Bhumkar Bridge Branch': 0,
      'Jambulwadi Lake View Branch': 0
    };
    students.forEach(s => {
      if (matchBranch(s, 'Bhumkar Bridge Branch')) counts['Bhumkar Bridge Branch']++;
      else if (matchBranch(s, 'Jambulwadi Lake View Branch')) counts['Jambulwadi Lake View Branch']++;
      else if (matchBranch(s, 'Manaji Nagar Branch')) counts['Manaji Nagar Branch']++;
    });
    return counts;
  }, [students]);

  // Active branch coach
  const currentBranchCoach = useMemo(() => {
    const found = majorBranches.find(b => b.name === selectedBranch);
    return found ? found.coach : 'Chief Instructor Maruti Jadhav';
  }, [selectedBranch, majorBranches]);

  // Attendance & Fee metrics (computed locally in memory)
  const metrics = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    let feesDueCount = 0;
    filteredStudents.forEach(s => {
      const status = attendanceMap[s.studentId];
      if (status === 'present') presentCount++;
      else if (status === 'absent') absentCount++;
      if (getUnpaidMonths(s, currentMonthKey).length > 0) {
        feesDueCount++;
      }
    });
    const marked = presentCount + absentCount;
    const total = filteredStudents.length;
    const progressPct = total > 0 ? Math.round((marked / total) * 100) : 0;
    return {
      total,
      present: presentCount,
      absent: absentCount,
      pending: total - marked,
      marked,
      progressPct,
      feesDue: feesDueCount
    };
  }, [filteredStudents, attendanceMap, currentMonthKey]);

  // Client-side filtered list by status chip (0 extra Firebase reads)
  const displayStudents = useMemo(() => {
    const list = filteredStudents.filter(s => {
      const status = attendanceMap[s.studentId];
      if (statusFilter === 'unmarked') return !status;
      if (statusFilter === 'present') return status === 'present';
      if (statusFilter === 'absent') return status === 'absent';
      if (statusFilter === 'fees-due') return getUnpaidMonths(s, currentMonthKey).length > 0;
      return true;
    });
    return list;
  }, [filteredStudents, attendanceMap, statusFilter, currentMonthKey]);

  // Keep focusIndex safely inside bounds
  useEffect(() => {
    if (displayStudents.length === 0) {
      setFocusIndex(0);
    } else if (focusIndex >= displayStudents.length) {
      setFocusIndex(displayStudents.length - 1);
    }
  }, [displayStudents.length, focusIndex]);

  // Unmarked queue for calm Focus Mode progression
  const unmarkedCount = metrics.pending;

  // Mark Individual Student Attendance
  const handleMarkAttendance = async (student: Admission, status: 'present' | 'absent') => {
    if (!student.studentId) return;
    const currentStatus = attendanceMap[student.studentId];
    
    // Toggle off if clicking the already marked status
    const newStatus = currentStatus === status ? undefined : status;

    // Optimistically update UI
    setAttendanceMap(prev => {
      const next = { ...prev };
      if (newStatus) {
        next[student.studentId] = newStatus;
      } else {
        delete next[student.studentId];
      }
      return next;
    });

    setSavingId(student.studentId);
    try {
      const docKey = `${student.studentId}_${selectedDate}`;
      const docRef = doc(db, 'attendance_logs', docKey);
      
      if (newStatus) {
        await setDoc(docRef, {
          studentId: student.studentId,
          studentName: student.fullName,
          date: selectedDate,
          branch: student.branch || selectedBranch,
          batch: student.batch || '',
          beltLevel: student.beltLevel || '',
          status: newStatus,
          markedBy: 'coach',
          updatedAt: Date.now()
        }, { merge: true });
        showToast(`${student.fullName} marked ${newStatus.toUpperCase()}`);
      } else {
        // Unmarking
        await setDoc(docRef, {
          studentId: student.studentId,
          studentName: student.fullName,
          date: selectedDate,
          status: 'unmarked',
          markedBy: 'coach',
          updatedAt: Date.now()
        }, { merge: true });
        showToast(`Attendance removed for ${student.fullName}`);
      }
    } catch (err) {
      console.error('Failed to save attendance:', err);
      showToast('Error saving attendance. Please retry.');
      // Rollback
      setAttendanceMap(prev => {
        const next = { ...prev };
        if (currentStatus) next[student.studentId] = currentStatus;
        else delete next[student.studentId];
        return next;
      });
    } finally {
      setSavingId(null);
    }
  };

  // Mark All Remaining Present (skips students already marked Present to save Firebase writes!)
  const handleMarkAllPresent = async () => {
    const studentsToUpdate = filteredStudents.filter(
      s => Boolean(s.studentId) && attendanceMap[s.studentId] !== 'present'
    );
    if (studentsToUpdate.length === 0) {
      showToast('All students in this branch are already marked PRESENT!');
      return;
    }
    setBatchSaving(true);

    const updatedMap = { ...attendanceMap };
    const promises: Promise<void>[] = [];

    for (const student of studentsToUpdate) {
      updatedMap[student.studentId] = 'present';
      const docKey = `${student.studentId}_${selectedDate}`;
      const docRef = doc(db, 'attendance_logs', docKey);
      promises.push(
        setDoc(docRef, {
          studentId: student.studentId,
          studentName: student.fullName,
          date: selectedDate,
          branch: student.branch || selectedBranch,
          batch: student.batch || '',
          beltLevel: student.beltLevel || '',
          status: 'present',
          markedBy: 'coach',
          updatedAt: Date.now()
        }, { merge: true })
      );
    }

    setAttendanceMap(updatedMap);

    try {
      await Promise.all(promises);
      showToast(`Marked ${studentsToUpdate.length} student${studentsToUpdate.length === 1 ? '' : 's'} PRESENT!`);
    } catch (err) {
      console.error('Batch attendance save error:', err);
      showToast('Error saving batch attendance.');
    } finally {
      setBatchSaving(false);
    }
  };

  // 1-Tap Toggle for student monthly fee payment in Firestore
  const toggleStudentMonthPaid = async (student: Admission, monthKey: string = currentMonthKey) => {
    try {
      setFeeSavingId(student.id);
      const currentPaid = new Set(student.paidMonths || []);
      const isCurrentlyPaid = currentPaid.has(monthKey);
      
      let updatedPaidMonths: string[];
      if (isCurrentlyPaid) {
        currentPaid.delete(monthKey);
        updatedPaidMonths = Array.from(currentPaid);
      } else {
        currentPaid.add(monthKey);
        updatedPaidMonths = Array.from(currentPaid);
      }

      // Update in Firestore admissions
      const docRef = doc(db, 'admissions', student.id);
      await updateDoc(docRef, {
        paidMonths: updatedPaidMonths,
        feesStatus: updatedPaidMonths.includes(currentMonthKey) ? 'Paid' : 'Unpaid',
        lastPaymentDate: !isCurrentlyPaid ? Date.now() : (student.lastPaymentDate || Date.now()),
        updatedAt: Date.now()
      });

      // Update local state
      setStudents(prev => prev.map(s => {
        if (s.id === student.id) {
          return {
            ...s,
            paidMonths: updatedPaidMonths,
            feesStatus: updatedPaidMonths.includes(currentMonthKey) ? 'Paid' : 'Unpaid',
            lastPaymentDate: !isCurrentlyPaid ? Date.now() : s.lastPaymentDate
          };
        }
        return s;
      }));

      showToast(
        !isCurrentlyPaid 
          ? `✓ ${student.fullName} marked PAID for ${formatMonthKey(monthKey)}`
          : `Marked UNPAID for ${formatMonthKey(monthKey)}`
      );
    } catch (err) {
      console.error('Failed to update student monthly fee status:', err);
      showToast('Error updating fee status. Please try again.');
    } finally {
      setFeeSavingId(null);
    }
  };

  // 1-Click WhatsApp Monthly Fee Reminder with Dynamic Multi-Month Support (All Students)
  const handleSendFeeReminder = (student: Admission) => {
    const rawPhone = (student.whatsApp || student.phone || '').replace(/[^0-9]/g, '');
    if (!rawPhone || rawPhone.length < 10) {
      alert(`No valid phone number found for ${student.fullName}.`);
      return;
    }

    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const unpaidMonths = getUnpaidMonths(student, currentMonthKey);
    const message = generateMonthlyFeeWhatsAppMessage(student, unpaidMonths);

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // ----------------------------------------------------
  // Render: Passcode Gate Screen
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 pt-24 pb-12">
        <div className="w-full max-w-md">
          {/* Back button */}
          <button
            onClick={onBackToHome}
            className="flex items-center space-x-2 text-zinc-400 hover:text-white mb-6 text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dojo Home</span>
          </button>

          <div className="bg-slate-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Top martial accent stripe */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-red-600 to-yellow-500" />

            <div className="text-center space-y-3 mb-8">
              <div className="w-16 h-16 bg-red-600/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-500 shadow-lg shadow-red-500/10">
                <Lock className="w-8 h-8" />
              </div>
              <h1 className="font-heading text-2xl font-black uppercase tracking-tight text-white">
                COACH ACCESS GATE
              </h1>
              <p className="text-zinc-400 text-xs">
                Enter your authorized 6-character coach passcode to access branch attendance and fee reminders.
              </p>
            </div>

            <form onSubmit={handlePasscodeSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs uppercase font-mono tracking-wider font-bold mb-2">
                  Coach Passcode
                </label>
                <div className="relative">
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    name="dojo-coach-code"
                    maxLength={20}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    value={passcodeInput}
                    onChange={(e) => {
                      setPasscodeInput(e.target.value);
                      if (passcodeError) setPasscodeError('');
                    }}
                    placeholder="Enter authorized passcode"
                    autoFocus
                    className="w-full bg-slate-950 border border-zinc-700 rounded-xl pl-4 pr-12 py-3 text-center text-lg tracking-[0.25em] font-mono font-bold text-white uppercase focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder:text-xs placeholder:tracking-normal placeholder:normal-case placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(prev => !prev)}
                    aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passcodeError && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1.5 justify-center">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{passcodeError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={authenticating || !passcodeInput.trim()}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-heading font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Verify & Open Mat Portal</span>
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
              <span className="text-[11px] text-zinc-500 font-mono">
                LIONS KARATE CLUB PUNE · CHIEF INSTRUCTOR MARUTI JADHAV
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleFocusMark = async (student: Admission, status: 'present' | 'absent') => {
    await handleMarkAttendance(student, status);
    if (focusIndex < displayStudents.length - 1) {
      setFocusIndex(prev => prev + 1);
    }
  };

  const focusedStudent = displayStudents[focusIndex] || null;
  const remainingToMarkPresent = filteredStudents.filter(s => attendanceMap[s.studentId] !== 'present').length;

  // ----------------------------------------------------
  // Render: Authenticated Coach Portal Dashboard
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Calm Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-emerald-500/40 text-emerald-300 px-5 py-2.5 rounded-full shadow-2xl flex items-center space-x-2 text-xs font-semibold backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-5">
        {/* Top Calm Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/75 border border-zinc-800/90 rounded-2xl p-4 sm:p-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-[11px] font-mono text-amber-400 font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Coach Mat Portal · {currentBranchCoach}</span>
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Daily Roll Call &amp; Fee Check
            </h1>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-zinc-800 rounded-xl p-1">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label="Attendance Date"
                className="bg-transparent px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
              >
                Today
              </button>
            </div>

            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Refresh student roster"
              aria-label="Refresh student roster"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors cursor-pointer"
              title="Lock portal session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </div>

        {/* 1-Tap Branch Pills + Search + View Switch */}
        <div className="bg-slate-900/75 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Branch Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {majorBranches.map(b => {
                const isSelected = selectedBranch === b.name;
                const shortLabel = b.name.replace(' Branch', '');
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedBranch(b.name);
                      setFocusIndex(0);
                    }}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-red-600/20 border-red-500/60 text-white shadow-sm'
                        : 'bg-slate-950/70 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-red-400' : 'text-zinc-500'}`} />
                    <span>{shortLabel}</span>
                    <span className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] ${
                      isSelected ? 'bg-red-500/30 text-red-200' : 'bg-zinc-900 text-zinc-500'
                    }`}>
                      {branchCounts[b.name] || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search & Mode Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setFocusIndex(0);
                  }}
                  placeholder="Search name, Roll ID, phone..."
                  className="w-full bg-slate-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 transition-colors"
                />
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
              </div>

              <div className="inline-flex bg-slate-950 border border-zinc-800 rounded-xl p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('focus');
                    setFocusIndex(0);
                  }}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'focus'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Focus 1-by-1</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Roll-Call Progress Bar & Action */}
          <div className="pt-3 border-t border-zinc-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="font-mono font-bold text-white">
                  Roll Call: {metrics.marked} / {metrics.total} ({metrics.progressPct}%)
                </span>
                {metrics.total > 0 && unmarkedCount === 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                    <Sparkles className="w-3 h-3" />
                    <span>Class Complete! Osu!</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleMarkAllPresent}
                disabled={batchSaving || remainingToMarkPresent === 0}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
              >
                <CheckCheck className="w-4 h-4" />
                <span>
                  {remainingToMarkPresent === 0
                    ? 'All Present'
                    : `Mark ${remainingToMarkPresent} Remaining Present`}
                </span>
              </button>
            </div>

            {/* Smooth Progress Track */}
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-zinc-800/80">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-300"
                style={{ width: `${metrics.progressPct}%` }}
              />
            </div>

            {/* Instant Client-side Status Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {[
                { id: 'all' as const, label: `All (${metrics.total})` },
                { id: 'unmarked' as const, label: `Unmarked (${metrics.pending})` },
                { id: 'present' as const, label: `Present (${metrics.present})` },
                { id: 'absent' as const, label: `Absent (${metrics.absent})` },
                { id: 'fees-due' as const, label: `Fees Due (${metrics.feesDue})` }
              ].map(chip => {
                const active = statusFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(chip.id);
                      setFocusIndex(0);
                    }}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                      active
                        ? 'bg-zinc-100 text-slate-950 border-zinc-100'
                        : 'bg-slate-950/70 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area: Loading / Error / Empty / Focus Mode / Cards Grid */}
        {loading ? (
          <div className="bg-slate-900/60 border border-zinc-800 rounded-2xl py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-zinc-400 text-xs font-mono">Loading branch student roster...</p>
          </div>
        ) : error ? (
          <div className="bg-slate-900/60 border border-zinc-800 rounded-2xl py-16 text-center space-y-3 text-red-400 p-6">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm">{error}</p>
            <button
              type="button"
              onClick={fetchData}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : displayStudents.length === 0 ? (
          <div className="bg-slate-900/60 border border-zinc-800 rounded-2xl py-16 text-center space-y-3 p-6">
            <Users className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-zinc-200">
              {statusFilter === 'unmarked' && metrics.total > 0
                ? 'All students are marked!'
                : 'No students match this filter'}
            </h3>
            <p className="text-zinc-400 text-xs max-w-sm mx-auto">
              {statusFilter === 'unmarked' && metrics.total > 0
                ? 'Great job! Switch back to All to review or update anyone.'
                : `No students match your current filter in ${selectedBranch}.`}
            </p>
            {statusFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Show All Students
              </button>
            )}
          </div>
        ) : viewMode === 'focus' && focusedStudent ? (
          /* 🎯 FOCUS 1-BY-1 MINDFUL ROLL CALL VIEW */
          (() => {
            const status = attendanceMap[focusedStudent.studentId];
            const isAttendanceSaving = savingId === focusedStudent.studentId;
            const isFeeSaving = feeSavingId === focusedStudent.id;
            const isMonthPaid = (focusedStudent.paidMonths || []).includes(currentMonthKey);
            const unpaidMonths = getUnpaidMonths(focusedStudent, currentMonthKey);

            return (
              <div className="max-w-xl mx-auto">
                <div className="bg-slate-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                  {/* Card Top Navigation */}
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <button
                      type="button"
                      onClick={() => setFocusIndex(i => Math.max(0, i - 1))}
                      disabled={focusIndex === 0}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-35 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Prev</span>
                    </button>

                    <span className="font-mono text-[11px] font-bold text-amber-400">
                      Student {focusIndex + 1} of {displayStudents.length}
                    </span>

                    <button
                      type="button"
                      onClick={() => setFocusIndex(i => Math.min(displayStudents.length - 1, i + 1))}
                      disabled={focusIndex >= displayStudents.length - 1}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-35 cursor-pointer"
                    >
                      <span>Skip</span>
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Student Portrait & Details */}
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`w-24 h-24 rounded-2xl overflow-hidden bg-zinc-800 border-2 shadow-lg ${
                      status === 'present'
                        ? 'border-emerald-500'
                        : status === 'absent'
                          ? 'border-red-500'
                          : 'border-zinc-700'
                    }`}>
                      {focusedStudent.photoUrl ? (
                        <img
                          src={focusedStudent.photoUrl}
                          alt={focusedStudent.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold font-mono text-zinc-400">
                          {focusedStudent.fullName?.charAt(0) || 'K'}
                        </div>
                      )}
                    </div>

                    <div>
                      <h2 className="font-heading text-2xl font-black text-white">
                        {focusedStudent.fullName}
                      </h2>
                      <p className="text-xs font-mono text-amber-400 font-bold mt-0.5">
                        {focusedStudent.studentId} · {focusedStudent.beltLevel || 'White Belt'}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {focusedStudent.batch || 'Regular Batch'}
                        {focusedStudent.parentName ? ` · Parent: ${focusedStudent.parentName}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Big Thumb-Friendly Present / Absent Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isAttendanceSaving}
                      onClick={() => handleFocusMark(focusedStudent, 'present')}
                      className={`py-4 px-4 rounded-2xl text-sm font-heading font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                        status === 'present'
                          ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Present</span>
                    </button>

                    <button
                      type="button"
                      disabled={isAttendanceSaving}
                      onClick={() => handleFocusMark(focusedStudent, 'absent')}
                      className={`py-4 px-4 rounded-2xl text-sm font-heading font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                        status === 'absent'
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                          : 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/40'
                      }`}
                    >
                      <XCircle className="w-5 h-5" />
                      <span>Absent</span>
                    </button>
                  </div>

                  {/* Clean Bottom Fee & WhatsApp Strip */}
                  <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-zinc-400">{getShortMonthKey(currentMonthKey)} Fee:</span>
                      {isMonthPaid ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Paid ✓
                          </span>
                          <button
                            type="button"
                            disabled={isFeeSaving}
                            onClick={() => toggleStudentMonthPaid(focusedStudent, currentMonthKey)}
                            className="text-[10px] font-mono text-zinc-500 hover:text-red-400 underline cursor-pointer"
                          >
                            {isFeeSaving ? '...' : 'Undo'}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isFeeSaving}
                          onClick={() => toggleStudentMonthPaid(focusedStudent, currentMonthKey)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>{isFeeSaving ? 'Saving...' : 'Mark Paid'}</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendFeeReminder(focusedStudent)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        unpaidMonths.length > 0
                          ? 'bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30'
                          : 'bg-slate-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{unpaidMonths.length > 0 ? `Fee Reminder (${unpaidMonths.length}m)` : 'WhatsApp'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          /* ⊞ CLEAN RESPONSIVE CARDS GRID (No Horizontal Scrolling!) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayStudents.map((student) => {
              const status = attendanceMap[student.studentId];
              const isAttendanceSaving = savingId === student.studentId;
              const isFeeSaving = feeSavingId === student.id;
              const isMonthPaid = (student.paidMonths || []).includes(currentMonthKey);
              const unpaidMonths = getUnpaidMonths(student, currentMonthKey);

              return (
                <div
                  key={student.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between space-y-4 transition-all ${
                    status === 'present'
                      ? 'bg-emerald-950/15 border-emerald-500/35'
                      : status === 'absent'
                        ? 'bg-rose-950/15 border-red-500/35'
                        : 'bg-slate-900/75 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {/* Card Top: Photo + Name + Roll ID + Belt */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 shrink-0">
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold font-mono">
                            {student.fullName?.charAt(0) || 'K'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">{student.fullName}</h3>
                        <p className="text-[11px] font-mono text-amber-400 font-bold truncate">
                          {student.studentId} · {student.beltLevel || 'White Belt'}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span>{student.phone || student.whatsApp || 'N/A'}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Big Tap Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleMarkAttendance(student, 'present')}
                      disabled={isAttendanceSaving}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                        status === 'present'
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-950 text-zinc-300 hover:bg-emerald-500/15 hover:text-emerald-300 border border-zinc-800'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Present</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMarkAttendance(student, 'absent')}
                      disabled={isAttendanceSaving}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                        status === 'absent'
                          ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                          : 'bg-slate-950 text-zinc-300 hover:bg-red-500/15 hover:text-red-300 border border-zinc-800'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Absent</span>
                    </button>
                  </div>

                  {/* Card Footer: Fee Status + 1-Tap WhatsApp */}
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isMonthPaid ? (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{getShortMonthKey(currentMonthKey)} Paid</span>
                          </span>
                          <button
                            type="button"
                            disabled={isFeeSaving}
                            onClick={() => toggleStudentMonthPaid(student, currentMonthKey)}
                            className="text-[10px] font-mono text-zinc-500 hover:text-red-400 underline cursor-pointer"
                            title="Undo payment"
                          >
                            {isFeeSaving ? '...' : 'Undo'}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={isFeeSaving}
                          onClick={() => toggleStudentMonthPaid(student, currentMonthKey)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-emerald-600/85 hover:bg-emerald-500 text-white transition-all cursor-pointer"
                          title={`Mark ${formatMonthKey(currentMonthKey)} as Paid`}
                        >
                          {isFeeSaving ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCheck className="w-3 h-3" />
                          )}
                          <span>
                            {unpaidMonths.length > 1
                              ? `Pay (${unpaidMonths.length}m due)`
                              : `Mark Paid`}
                          </span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendFeeReminder(student)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                        unpaidMonths.length > 0
                          ? 'bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30'
                          : 'bg-slate-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                      title={`Send WhatsApp fee reminder to ${student.fullName}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{unpaidMonths.length > 0 ? 'Remind' : 'Note'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
