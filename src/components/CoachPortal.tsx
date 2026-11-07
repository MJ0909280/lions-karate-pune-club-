import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, Unlock, ShieldCheck, Users, CheckCircle2, XCircle, 
  Calendar, MapPin, Search, MessageCircle, CheckCheck, 
  AlertCircle, LogOut, RefreshCw, Award, ArrowLeft, Filter, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Admission, DOJO_BRANCHES, isExcludedSchool, 
  getCurrentMonthKey, formatMonthKey, getShortMonthKey, 
  getUnpaidMonths, generateMonthlyFeeWhatsAppMessage 
} from '../types';

interface CoachPortalProps {
  onBackToHome: () => void;
}

const COACH_PASSCODE = 'LKCP09';
const SESSION_KEY = 'lkcp_coach_auth_session';

export default function CoachPortal({ onBackToHome }: CoachPortalProps) {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [passcodeInput, setPasscodeInput] = useState('');
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Handle Passcode Submission
  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    setPasscodeError('');

    const cleanInput = passcodeInput.trim().toUpperCase();
    if (cleanInput === COACH_PASSCODE) {
      try {
        sessionStorage.setItem(SESSION_KEY, 'true');
      } catch (err) {
        console.warn('Session storage warning:', err);
      }
      setIsAuthenticated(true);
      setPasscodeInput('');
    } else {
      setPasscodeError('Invalid passcode. Please enter the authorized coach code.');
    }
    setAuthenticating(false);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (err) {
      console.warn('Session storage warning:', err);
    }
    setIsAuthenticated(false);
    setPasscodeInput('');
  };

  // Fetch Students & Attendance records when authenticated
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch all admissions
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

      // 2. Fetch attendance logs for selected date
      const attendanceSnap = await getDocs(collection(db, 'attendance_logs'));
      const dailyMap: Record<string, 'present' | 'absent'> = {};
      attendanceSnap.forEach((d) => {
        const record = d.data();
        if (record.date === selectedDate && record.studentId) {
          dailyMap[record.studentId] = record.status === 'absent' ? 'absent' : 'present';
        }
      });
      setAttendanceMap(dailyMap);
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
  }, [isAuthenticated, selectedDate]);

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

  // Attendance metrics
  const metrics = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    filteredStudents.forEach(s => {
      const status = attendanceMap[s.studentId];
      if (status === 'present') presentCount++;
      else if (status === 'absent') absentCount++;
    });
    return {
      total: filteredStudents.length,
      present: presentCount,
      absent: absentCount,
      pending: filteredStudents.length - (presentCount + absentCount)
    };
  }, [filteredStudents, attendanceMap]);

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

  // Mark All Present in current filtered view
  const handleMarkAllPresent = async () => {
    if (filteredStudents.length === 0) return;
    setBatchSaving(true);

    const updatedMap = { ...attendanceMap };
    const promises: Promise<void>[] = [];

    for (const student of filteredStudents) {
      if (!student.studentId) continue;
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
      showToast(`All ${filteredStudents.length} students marked PRESENT!`);
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
                    type="password"
                    maxLength={10}
                    value={passcodeInput}
                    onChange={(e) => {
                      setPasscodeInput(e.target.value);
                      if (passcodeError) setPasscodeError('');
                    }}
                    placeholder="Enter passcode (LKCP09)"
                    autoFocus
                    className="w-full bg-slate-950 border border-zinc-700 rounded-xl px-4 py-3 text-center text-lg tracking-[0.3em] font-mono font-bold text-white uppercase focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  />
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

  // ----------------------------------------------------
  // Render: Authenticated Coach Portal Dashboard
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-emerald-500/40 text-emerald-400 px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-mono text-yellow-500 font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-yellow-500" />
              <span>AUTHORIZED COACH MAT PORTAL</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              DAILY ATTENDANCE & FEE REMINDERS
            </h1>
            <p className="text-zinc-400 text-xs">
              Select your dojo branch, record student presence, and send 1-click WhatsApp monthly fee reminders.
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Refresh student roster"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors cursor-pointer"
              title="Lock portal session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock Portal</span>
            </button>
          </div>
        </div>

        {/* Controls Card: Branch Filter, Date Picker, and Search */}
        <div className="bg-slate-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Branch Selection */}
            <div>
              <label className="block text-zinc-400 text-xs font-mono font-bold uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-yellow-500" />
                <span>Select Training Branch</span>
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-slate-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-yellow-500 transition-colors cursor-pointer font-bold"
              >
                {majorBranches.map(b => (
                  <option key={b.id} value={b.name}>
                    {b.name} ({branchCounts[b.name] || 0} registered)
                  </option>
                ))}
              </select>
              <div className="mt-1.5 flex items-center space-x-1.5 text-[11px] text-zinc-400 font-mono">
                <span className="text-yellow-500 font-bold">Coach:</span>
                <span className="truncate text-zinc-300 font-semibold">{currentBranchCoach}</span>
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-zinc-400 text-xs font-mono font-bold uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-500" />
                <span>Attendance Date</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-red-500 transition-colors font-mono"
                />
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Quick Student Search */}
            <div>
              <label className="block text-zinc-400 text-xs font-mono font-bold uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Search className="w-3.5 h-3.5 text-blue-400" />
                <span>Find Student / Roll No</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student name, ID, parent, or phone..."
                  className="w-full bg-slate-950 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-400 transition-colors"
                />
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              </div>
            </div>
          </div>

          {/* Quick Metrics & Batch Action Bar */}
          <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-zinc-400">
                Roster: <strong className="text-white font-mono">{metrics.total}</strong>
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Present: <strong className="font-mono">{metrics.present}</strong></span>
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-red-400 flex items-center gap-1 font-semibold">
                <XCircle className="w-3.5 h-3.5" />
                <span>Absent: <strong className="font-mono">{metrics.absent}</strong></span>
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-500 font-mono">
                Unmarked: <strong>{metrics.pending}</strong>
              </span>
            </div>

            <button
              onClick={handleMarkAllPresent}
              disabled={batchSaving || filteredStudents.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All {filteredStudents.length} Present</span>
            </button>
          </div>
        </div>

        {/* Student Roster Table */}
        <div className="bg-slate-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-yellow-500 animate-spin mx-auto" />
              <p className="text-zinc-400 text-xs font-mono">Loading branch student roster...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center space-y-3 text-red-400 p-6">
              <AlertCircle className="w-8 h-8 mx-auto" />
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
              >
                Retry
              </button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-20 text-center space-y-3 p-6">
              <Users className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-zinc-300">No students found</h3>
              <p className="text-zinc-500 text-xs max-w-sm mx-auto">
                No active students match the selected branch ({selectedBranch}) and search filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-zinc-400 text-[11px] uppercase font-bold tracking-wider font-mono border-b border-zinc-800">
                    <th className="py-4 px-4 sm:px-6">Student & Belt</th>
                    <th className="py-4 px-4 sm:px-6">Branch & Contact</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Daily Attendance ({selectedDate})</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Monthly Fees ({formatMonthKey(currentMonthKey)})</th>
                    <th className="py-4 px-4 sm:px-6 text-right">Fee Reminder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-xs">
                  {filteredStudents.map((student) => {
                    const status = attendanceMap[student.studentId];
                    const isAttendanceSaving = savingId === student.studentId;
                    const isFeeSaving = feeSavingId === student.id;
                    const isMonthPaid = (student.paidMonths || []).includes(currentMonthKey);
                    const unpaidMonths = getUnpaidMonths(student, currentMonthKey);

                    return (
                      <tr 
                        key={student.id} 
                        className={`transition-colors hover:bg-slate-850/50 ${
                          status === 'present' ? 'bg-emerald-950/10' : status === 'absent' ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        {/* Student Name & ID */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 shrink-0">
                              {student.photoUrl ? (
                                <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold font-mono">
                                  {student.fullName?.charAt(0) || 'K'}
                                </div>
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-bold text-white block text-sm">{student.fullName}</span>
                              <div className="flex items-center space-x-2 text-[10px]">
                                <span className="font-mono text-yellow-500 font-bold">{student.studentId}</span>
                                <span className="text-zinc-600">·</span>
                                <span className="text-zinc-300 font-medium">{student.beltLevel || 'White Belt'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Branch & Parent Contact */}
                        <td className="py-4 px-4 sm:px-6 space-y-1">
                          <span className="text-zinc-300 font-medium block">
                            {student.branch || student.schoolName || selectedBranch}
                          </span>
                          <div className="flex items-center space-x-2 text-[10px] text-zinc-400">
                            {student.parentName && <span>Parent: {student.parentName}</span>}
                            {student.parentName && <span>·</span>}
                            <span>📞 {student.phone || student.whatsApp || 'N/A'}</span>
                          </div>
                        </td>

                        {/* Attendance Toggles */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleMarkAttendance(student, 'present')}
                              disabled={isAttendanceSaving}
                              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                status === 'present'
                                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-emerald-500/20 hover:text-emerald-400 border border-zinc-700'
                              }`}
                              title="Mark Present"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Present</span>
                            </button>

                            <button
                              onClick={() => handleMarkAttendance(student, 'absent')}
                              disabled={isAttendanceSaving}
                              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                status === 'absent'
                                  ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-red-500/20 hover:text-red-400 border border-zinc-700'
                              }`}
                              title="Mark Absent"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Absent</span>
                            </button>
                          </div>
                        </td>

                        {/* Monthly Fee 1-Tap Toggle & Status (For All Students) */}
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            {isMonthPaid ? (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Paid ✓</span>
                                </span>
                                <button
                                  type="button"
                                  disabled={isFeeSaving}
                                  onClick={() => toggleStudentMonthPaid(student, currentMonthKey)}
                                  className="text-[9px] font-mono text-zinc-500 hover:text-red-400 underline cursor-pointer"
                                  title="Undo payment"
                                >
                                  {isFeeSaving ? '...' : 'Undo'}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={isFeeSaving}
                                onClick={() => toggleStudentMonthPaid(student, currentMonthKey)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-heading font-black uppercase tracking-wider bg-emerald-600/90 hover:bg-emerald-500 text-white active:scale-95 transition-all cursor-pointer border border-emerald-500/40"
                                title={`Mark ${formatMonthKey(currentMonthKey)} as Paid`}
                              >
                                {isFeeSaving ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Saving...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCheck className="w-3 h-3" />
                                    <span>Mark Paid</span>
                                  </>
                                )}
                              </button>
                            )}

                            {unpaidMonths.length > 1 && (
                              <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                {unpaidMonths.length} Months Pending
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 1-Click WhatsApp Monthly Fee Reminder (For All Students) */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <button
                            onClick={() => handleSendFeeReminder(student)}
                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
                              unpaidMonths.length > 0
                                ? 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 hover:border-emerald-500'
                                : 'bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-700'
                            }`}
                            title={`Send WhatsApp fee reminder to ${student.fullName}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{unpaidMonths.length > 0 ? 'Send Reminder' : 'Send Note'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
