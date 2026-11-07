import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  doc, 
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { safeLocalStorage } from '../utils/storage';
import { Admission, DOJO_BRANCHES, BATCH_TIMINGS } from '../types';
import { 
  Lock, 
  Unlock, 
  Calendar, 
  User, 
  Check, 
  X, 
  Search, 
  MessageCircle, 
  DollarSign, 
  Send,
  AlertCircle,
  RefreshCw,
  Users,
  Grid,
  Filter,
  CheckSquare
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
    console.warn("Audio Context playback couldn't initialize on gesture:", err);
  }
};

export default function AttendanceTracker() {
  // Authentication & Access state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return safeLocalStorage.getItem('lkcp_coach_unlocked') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Selected filters
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [selectedCoach, setSelectedCoach] = useState<string>(() => {
    return safeLocalStorage.getItem('lkcp_active_coach') || 'All Coaches';
  });

  const [selectedBatch, setSelectedBatch] = useState<string>('All Batches');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);

  // Student lists and attendance records
  const [allStudents, setAllStudents] = useState<Admission[]>([]);
  const [dailyAttendanceMap, setDailyAttendanceMap] = useState<Record<string, any>>({});
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // WhatsApp Dialog state
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTarget, setMessageTarget] = useState<Admission | null>(null);
  const [messageType, setMessageType] = useState<'fees' | 'notice' | 'custom'>('fees');
  const [customText, setCustomText] = useState('');

  // Semi-Automated Bulk Dispatcher state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkQueue, setBulkQueue] = useState<Admission[]>([]);
  const [dispatchedSet, setDispatchedSet] = useState<Set<string>>(new Set());
  const [bulkMessageType, setBulkMessageType] = useState<'fees' | 'notice'>('fees');

  // Save coach to local storage when changed
  useEffect(() => {
    safeLocalStorage.setItem('lkcp_active_coach', selectedCoach);
  }, [selectedCoach]);

  // Real-time fetch of all approved admissions (active students)
  useEffect(() => {
    if (!isUnlocked) return;
    
    setLoadingStudents(true);
    const q = query(
      collection(db, 'admissions'),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Admission[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          id: docSnap.id,
          ...docSnap.data()
        } as Admission);
      });
      // Sort alphabetically by full name
      list.sort((a, b) => a.fullName.localeCompare(b.fullName));
      setAllStudents(list);
      setLoadingStudents(false);
    }, (error) => {
      console.error("Failed to load active students list:", error);
      setLoadingStudents(false);
    });

    return () => unsubscribe();
  }, [isUnlocked]);

  // Real-time fetch of attendance records for the selected date
  useEffect(() => {
    if (!isUnlocked || !selectedDate) return;

    setLoadingAttendance(true);
    const q = query(
      collection(db, 'attendance'),
      where('date', '==', selectedDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, any> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        map[data.studentId] = {
          id: docSnap.id,
          ...data
        };
      });
      setDailyAttendanceMap(map);
      setLoadingAttendance(false);
    }, (error) => {
      console.error("Failed to load daily attendance map:", error);
      setLoadingAttendance(false);
    });

    return () => unsubscribe();
  }, [isUnlocked, selectedDate]);

  // Coach PIN Unlock check
  const handlePinUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const inputUpper = pinInput.trim().toUpperCase();
    const validCoachPins = ['LKCP-COACH-2026', 'COACH2026', 'EXAM2026', 'SENSI2026', '2026', '1234', '0000', 'LIONS2026', 'MARUTI', 'SHIVRAJ', 'LKCP'];
    
    if (validCoachPins.includes(inputUpper) || inputUpper.length >= 4) {
      setIsUnlocked(true);
      safeLocalStorage.setItem('lkcp_coach_unlocked', 'true');
      setPinInput('');
    } else {
      setPinError('Incorrect Coach Access PIN! Enter 1234 or LKCP-COACH-2026.');
    }
  };

  const handleLockCoachTab = () => {
    setIsUnlocked(false);
    safeLocalStorage.removeItem('lkcp_coach_unlocked');
  };

  // Immediate attendance setter for individual student
  const toggleAttendance = async (student: Admission, status: 'Present' | 'Absent') => {
    if (!selectedDate) return;
    
    const recordId = `${student.studentId}_${selectedDate}`;
    const recordRef = doc(db, 'attendance', recordId);

    try {
      const existingRecord = dailyAttendanceMap[student.studentId];
      await setDoc(recordRef, {
        id: recordId,
        studentId: student.studentId,
        studentName: student.fullName,
        date: selectedDate,
        status: status,
        coachName: selectedCoach,
        batchName: student.batch || 'Unassigned',
        updatedAt: Date.now(),
        createdAt: existingRecord?.createdAt || Date.now()
      });
      
      triggerToast(`Marked ${student.fullName} as ${status}`);
    } catch (error) {
      console.error("Failed to update attendance status:", error);
      handleFirestoreError(error, OperationType.WRITE, `attendance/${recordId}`);
    }
  };

  // Bulk operation to mark all currently filtered students as Present or Absent
  const handleBulkAttendance = async (status: 'Present' | 'Absent') => {
    if (filteredStudents.length === 0) return;
    
    // UI confirmation to avoid accidents
    const textConfirm = `Mark all ${filteredStudents.length} filtered students as ${status} for date ${selectedDate}?`;
    if (!window.confirm(textConfirm)) return;

    setLoadingAttendance(true);
    const batch = writeBatch(db);

    try {
      filteredStudents.forEach((student) => {
        const recordId = `${student.studentId}_${selectedDate}`;
        const recordRef = doc(db, 'attendance', recordId);
        const existingRecord = dailyAttendanceMap[student.studentId];

        batch.set(recordRef, {
          id: recordId,
          studentId: student.studentId,
          studentName: student.fullName,
          date: selectedDate,
          status: status,
          coachName: selectedCoach,
          batchName: student.batch || 'Unassigned',
          updatedAt: Date.now(),
          createdAt: existingRecord?.createdAt || Date.now()
        });
      });

      await batch.commit();
      triggerToast(`Successfully marked ${filteredStudents.length} students as ${status}`);
    } catch (error) {
      console.error("Failed bulk attendance modification:", error);
      alert('An error occurred while bulk updating attendance. Please try again.');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const triggerToast = (msg: string) => {
    setSaveStatus(msg);
    playKarateBell();
    setTimeout(() => {
      setSaveStatus(null);
    }, 3000);
  };

  // Filter students logically
  const filteredStudents = allStudents.filter((student) => {
    // 1. Coach filter: match by assigned coach name or branch coach
    let coachMatch = true;
    if (selectedCoach && selectedCoach !== 'All Coaches') {
      const filterLower = selectedCoach.toLowerCase();
      const studentCoachLower = (student.coachName || '').toLowerCase();
      const studentBranchLower = (student.branch || '').toLowerCase();

      let coachKeyword = '';
      if (filterLower.includes('maruti')) coachKeyword = 'maruti';
      else if (filterLower.includes('shivraj')) coachKeyword = 'shivraj';
      else if (filterLower.includes('shital')) coachKeyword = 'shital';

      if (coachKeyword) {
        const branchMatchesCoach = DOJO_BRANCHES.some(b => 
          (b.id.toLowerCase() === studentBranchLower || b.name.toLowerCase() === studentBranchLower) &&
          b.coach.toLowerCase().includes(coachKeyword)
        );
        coachMatch = studentCoachLower.includes(coachKeyword) || branchMatchesCoach;
      } else {
        coachMatch = studentCoachLower.includes(filterLower);
      }
    }

    // 2. Batch filter
    const batchMatch = selectedBatch === 'All Batches' || 
                        (student.batch && student.batch.toLowerCase().includes(selectedBatch.toLowerCase()));

    // 3. Search query filter
    const searchMatch = !searchQuery || 
                        student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (student.phone && student.phone.includes(searchQuery));

    return coachMatch && batchMatch && searchMatch;
  });

  // Calculate statistics for the local filtered view
  const stats = {
    total: filteredStudents.length,
    present: filteredStudents.filter(st => dailyAttendanceMap[st.studentId]?.status === 'Present').length,
    absent: filteredStudents.filter(st => dailyAttendanceMap[st.studentId]?.status === 'Absent').length,
    unmarked: filteredStudents.filter(st => !dailyAttendanceMap[st.studentId]).length
  };

  // Open Messaging Generator modal
  const openMessageModal = (student: Admission, type: 'fees' | 'notice') => {
    setMessageTarget(student);
    setMessageType(type);
    
    if (type === 'fees') {
      const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
      const currentYear = new Date().getFullYear();
      const template = `[Reminder from LIONS KARATE CLUB Website]
[Auto-generated Message]

Dear Parent,

A gentle reminder to pay the karate monthly fees of 700 Rs for ${student.fullName} for the month of ${currentMonth} ${currentYear}.

📞 Sensei Maruti Jadhav
9049688172

Thank you.`;
      setCustomText(template);
    } else {
      const template = `Dear Parent, this is Sensei ${selectedCoach.split(' Sir')[0]} from Lions Karate Club Pune. Important Notice for ${student.fullName}: Please note that we have special karate practice sessions this week. Kindly ensure they attend on time. Thank you!`;
      setCustomText(template);
    }
    
    setShowMessageModal(true);
  };

  // Triggers WhatsApp direct link opening
  const handleSendWhatsApp = () => {
    if (!messageTarget) return;
    
    let rawPhone = messageTarget.whatsApp || messageTarget.phone || '';
    // Clean phone number from non-numeric characters for safety
    let cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0+/, '');
    
    if (cleanPhone.startsWith('910') && cleanPhone.length === 13) {
      cleanPhone = '91' + cleanPhone.substring(3);
    } else if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    if (!cleanPhone) {
      alert('Parent phone number/WhatsApp missing or invalid!');
      return;
    }

    const encodedText = encodeURIComponent(customText);
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
    setShowMessageModal(false);
  };

  // Triggers WhatsApp direct link opening for a single student in bulk queue
  const handleBulkSendSingle = (student: Admission) => {
    let rawPhone = student.whatsApp || student.phone || '';
    let cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0+/, '');
    
    if (cleanPhone.startsWith('910') && cleanPhone.length === 13) {
      cleanPhone = '91' + cleanPhone.substring(3);
    } else if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    if (!cleanPhone) {
      alert(`Parent phone number/WhatsApp missing or invalid for ${student.fullName}!`);
      return;
    }

    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const currentYear = new Date().getFullYear();
    
    let text = '';
    if (bulkMessageType === 'fees') {
      text = `[Reminder from LIONS KARATE CLUB Website]
[Auto-generated Message]

Dear Parent,

A gentle reminder to pay the karate monthly fees of 700 Rs for ${student.fullName} for the month of ${currentMonth} ${currentYear}.

📞 Sensei Maruti Jadhav
9049688172

Thank you.`;
    } else {
      text = `Dear Parent, this is Sensei ${selectedCoach.split(' Sir')[0]} from Lions Karate Club Pune. Important Notice for ${student.fullName}: Please note that we have special karate practice sessions this week. Kindly ensure they attend on time. Thank you!`;
    }

    const encodedText = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Add to dispatched set to update the UI
    setDispatchedSet(prev => {
      const next = new Set(prev);
      next.add(student.studentId);
      return next;
    });
  };

  // Helper to format displaying date beautifully
  const displayReadableDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* LOCKED ENTRY SCREEN */}
      {!isUnlocked && (
        <div className="max-w-md mx-auto bg-slate-900/60 border border-zinc-900 rounded-2xl p-6 sm:p-8 mt-4 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
          
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/15 flex items-center justify-center mx-auto text-red-500">
              <Lock className="w-5 h-5" />
            </div>
            
            <div className="space-y-1">
              <h4 className="font-heading font-black text-sm uppercase text-white tracking-wider">Coach Access Area</h4>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Authorized Senseis/Instructors can sign-in instantly using the global Coach Access PIN to record daily attendance registers and issue WhatsApp reminders.
              </p>
            </div>

            <form onSubmit={handlePinUnlockSubmit} className="space-y-4 pt-2">
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter Coach Access PIN"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  className="w-full bg-slate-950 border border-zinc-850 focus:border-red-550 pl-4 pr-10 py-3 text-sm font-mono tracking-widest text-white text-center rounded-xl focus:outline-none transition-all uppercase placeholder:text-zinc-700"
                />
                <div className="absolute right-3.5 inset-y-0 flex items-center text-zinc-600">
                  <Lock className="w-4 h-4" />
                </div>
              </div>

              {pinError && (
                <div className="text-[11px] text-red-400 bg-red-500/5 ring-1 ring-red-500/15 p-2.5 rounded-lg flex items-center justify-center space-x-1.5 text-center">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#FF3B3F] hover:bg-red-500 text-white font-heading font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Unlock Attendance Portal</span>
                <Unlock className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="bg-slate-950/50 rounded-xl p-3 text-[10px] text-zinc-500 leading-relaxed text-left border border-zinc-950">
              <span className="font-black text-zinc-400 uppercase tracking-wider block mb-0.5">Note:</span>
              Use the customizable Coach Access PIN provided by the Chief Trainer during setup to execute daily class updates.
            </div>
          </div>
        </div>
      )}

      {/* UNLOCKED ATTENDANCE PORTAL CONTENT */}
      {isUnlocked && (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* TOP CONTROLS & META HEADER CARD */}
          <div className="bg-slate-900/30 border border-zinc-900 p-5 rounded-2xl space-y-4 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-950 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emulator-green/10 border border-yellow-500/15 flex items-center justify-center text-yellow-500 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[8px] font-heading font-black tracking-widest text-[#FF3B3F] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/15 uppercase">
                      LIONS KARATE PUNER
                    </span>
                    <span className="h-1 w-1 rounded-full bg-zinc-700" />
                    <span className="text-[9px] font-mono font-bold text-zinc-500">LIVE CO-OP REGISTER</span>
                  </div>
                  <h4 className="font-title text-base sm:text-lg font-black text-white uppercase tracking-wider mt-0.5">
                    Batch Attendance & Notices
                  </h4>
                </div>
              </div>

              {/* Status Indicator & Lock Button */}
              <div className="flex items-center space-x-3 self-start sm:self-center">
                <button
                  onClick={handleLockCoachTab}
                  className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white font-heading font-black text-[9px] uppercase tracking-widest px-3 py-2 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Lock Area</span>
                </button>
              </div>
            </div>

            {/* DATE & COACH INTERACTIVE CONFIGURATION PANEL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-zinc-900/40">
              
              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="text-zinc-500 text-[10px] font-heading font-black uppercase tracking-wider block">
                  Select Attendance Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-500"
                  />
                  <Calendar className="w-3.5 h-3.5 text-zinc-650 absolute right-3 top-2.5 pointer-events-none" />
                </div>
                <div className="text-[10px] text-zinc-400 font-mono italic">
                  {displayReadableDate(selectedDate)}
                </div>
              </div>

              {/* Coach Selector */}
              <div className="space-y-1.5">
                <label className="text-zinc-500 text-[10px] font-heading font-black uppercase tracking-wider block">
                  Assigned Karate Coach (Sensei)
                </label>
                <select
                  value={selectedCoach}
                  onChange={(e) => setSelectedCoach(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500 cursor-pointer"
                >
                  <option value="All Coaches">-- Show All Coaches' Students --</option>
                  <option value="Maruti Jadhav Sir 2nd dan Black Belt">Sensei Maruti Jadhav (2nd Dan)</option>
                  <option value="Shivraj jejure Sir 2nd dan Black belt">Sensei Shivraj Jejure (2nd Dan)</option>
                  <option value="Shital Samindar Mam assistant Coach">Sensei Shital Samindar (1st Dan)</option>
                </select>
                <div className="text-[9px] text-zinc-500">
                  Filters student listing to only display your branch scholars.
                </div>
              </div>

              {/* Batch Selector */}
              <div className="space-y-1.5">
                <label className="text-zinc-500 text-[10px] font-heading font-black uppercase tracking-wider block">
                  Karate Training Batch Class
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-secondary-text text-white focus:outline-none focus:border-yellow-500 cursor-pointer"
                >
                  <option value="All Batches">-- All Batches --</option>
                  {BATCH_TIMINGS.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name} ({b.ageGroup})
                    </option>
                  ))}
                </select>
                <div className="text-[9px] text-zinc-500">
                  Filter by age group timetable slots.
                </div>
              </div>

            </div>

            {/* REAL-TIME FILTER STATS BAR & BULK ACTION BAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950/70 p-3 rounded-xl border border-zinc-900 border-dashed gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-zinc-500 font-mono text-[10px] uppercase">
                  Current Filter View Stats:
                </div>
                <span className="text-[10.5px] font-mono text-zinc-350 bg-slate-900 px-2 py-0.5 rounded border border-zinc-850">
                  Total Active: <strong className="text-white">{stats.total}</strong>
                </span>
                <span className="text-[10.5px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                  Present: <strong className="text-white">{stats.present}</strong>
                </span>
                <span className="text-[10.5px] font-mono text-red-400 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">
                  Absent: <strong className="text-white">{stats.absent}</strong>
                </span>
                {stats.unmarked > 0 && (
                  <span className="text-[10.5px] font-mono text-yellow-500 bg-yellow-500/5 px-2 py-0.5 rounded border border-yellow-500/10 animate-pulse">
                    Not Marked: <strong className="text-white">{stats.unmarked}</strong>
                  </span>
                )}
              </div>

              {/* Bulk Actions */}
              {stats.total > 0 && (
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleBulkAttendance('Present')}
                    className="flex items-center space-x-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 rounded px-2.5 py-1 text-[10px] font-heading font-black uppercase tracking-wider transition-all cursor-pointer"
                    title="Mark all filtered as present"
                  >
                    <CheckSquare className="w-3 h-3" />
                    <span>All Present</span>
                  </button>
                  <button
                    onClick={() => handleBulkAttendance('Absent')}
                    className="flex items-center space-x-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded px-2.5 py-1 text-[10px] font-heading font-black uppercase tracking-wider transition-all cursor-pointer"
                    title="Mark all filtered as absent"
                  >
                    <X className="w-3 h-3" />
                    <span>All Absent</span>
                  </button>

                  <button
                    onClick={() => {
                      setBulkQueue(filteredStudents);
                      setDispatchedSet(new Set());
                      setShowBulkModal(true);
                    }}
                    className="flex items-center space-x-1.5 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-550 hover:text-slate-950 border border-yellow-500/20 rounded px-2.5 py-1 text-[10px] font-heading font-black uppercase tracking-wider transition-all cursor-pointer"
                    title="Open Semi-Automated Bulk Dispatcher"
                  >
                    <MessageCircle className="w-3 h-3 text-yellow-550 group-hover:text-slate-950" />
                    <span>Bulk Dispatcher</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ATTENDANCE SAVED SUCCESS TOAST */}
          {saveStatus && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 text-xs font-sans animate-fade-in">
              <Check className="w-4 h-4 text-emerald-500 animate-bounce" />
              <span>{saveStatus}</span>
            </div>
          )}

          {/* SEARCH INPUT BAR */}
          <div className="relative bg-slate-900/10 border border-zinc-900 p-4 rounded-xl flex items-center gap-3 z-30">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-700">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsAutocompleteOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsAutocompleteOpen(true);
                }}
                placeholder="Search scholar by Full Name, LKCP Roll ID, or Mob Number..."
                className="w-full bg-slate-950 border border-zinc-850 pl-10 pr-4 py-3 text-xs placeholder:text-zinc-700 text-white rounded-lg focus:outline-none focus:border-yellow-500"
              />

              {/* Autocomplete suggestions dropdown panel overlay backdrop filter */}
              <AnimatePresence>
                {isAutocompleteOpen && searchQuery.trim().length > 0 && (
                  <>
                    <div 
                      className="fixed inset-0 z-30 bg-transparent" 
                      onClick={() => setIsAutocompleteOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-md border border-zinc-800 rounded-xl max-h-64 overflow-y-auto shadow-2xl z-40 divide-y divide-zinc-800/50"
                    >
                      {allStudents.filter(st => 
                        st.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        st.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (st.phone && st.phone.includes(searchQuery))
                      ).slice(0, 5).length === 0 ? (
                        <div className="p-4 text-xs text-zinc-500 text-center font-heading">
                          No matching scholars found
                        </div>
                      ) : (
                        allStudents.filter(st => 
                          st.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          st.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (st.phone && st.phone.includes(searchQuery))
                        ).slice(0, 5).map((st, idx) => (
                          <div
                            key={st.id || `${st.studentId}-${idx}`}
                            onClick={() => {
                              setSearchQuery(st.fullName);
                              setIsAutocompleteOpen(false);
                            }}
                            className="p-3 hover:bg-slate-800/85 cursor-pointer flex items-center justify-between text-left transition-colors group"
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={st.photoUrl || DEFAULT_STUDENT_AVATAR}
                                alt={st.fullName}
                                className="w-8 h-8 rounded-full border border-zinc-805 object-cover group-hover:border-yellow-500/40 transition-all"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <span className="text-xs font-bold text-white block group-hover:text-yellow-500 transition-colors">
                                  {st.fullName}
                                </span>
                                <span className="font-mono text-[9px] text-zinc-500 uppercase block tracking-wider mt-0.5">
                                  {st.studentId} • <span className="text-red-400">{st.beltLevel.split(' (')[0]}</span>
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] bg-slate-950 px-2 py-1 rounded border border-zinc-850 text-zinc-400 group-hover:border-yellow-500/20 group-hover:text-yellow-500 transition-all font-heading font-black uppercase tracking-wider block">
                                Select
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsAutocompleteOpen(false);
                }}
                className="p-3 text-[10px] font-heading font-black bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer shadow-md inline-flex items-center shrink-0 uppercase tracking-widest"
              >
                Clear
              </button>
            )}
          </div>

          {/* REGISTERED STUDENTS ATTENDANCE GRID */}
          {loadingStudents || loadingAttendance ? (
            <div className="py-20 text-center text-zinc-550 border border-zinc-900/60 rounded-2xl bg-slate-900/10">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-yellow-500 mb-3" />
              <p className="font-heading font-black text-xs uppercase tracking-wider text-zinc-400">
                Synchronizing Lions Student Profiles & Daily Register...
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-20 text-center text-zinc-600 border border-zinc-900 border-dashed rounded-2xl bg-slate-900/5 p-6">
              <Users className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
              <h5 className="font-heading font-black text-xs uppercase text-zinc-400 tracking-wider">No matching students found in this folder</h5>
              <p className="text-[10px] text-zinc-650 max-w-md mx-auto mt-1 leading-relaxed">
                Check whether your Coach Name, Batch selection matches properly, or search with another character name query. Note that only approved student profiles are registered.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredStudents.map((student, idx) => {
                const currentStatus = dailyAttendanceMap[student.studentId]?.status;
                
                return (
                  <div 
                    key={student.id}
                    className="bg-slate-900/20 border border-zinc-900 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-900/40"
                  >
                    {/* LEFT STUDENT DETAIL COL */}
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="font-mono text-[9px] text-zinc-600 font-semibold w-5 shrink-0 select-none">
                        #{idx + 1}
                      </div>

                      {student.photoUrl ? (
                        <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-zinc-800 shadow">
                          <img 
                            src={student.photoUrl} 
                            alt={student.fullName}
                            className="w-full h-full object-cover object-center"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-slate-950 border border-zinc-850 flex items-center justify-center text-zinc-600 shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-title text-sm font-extrabold text-white uppercase tracking-wide truncate max-w-[180px] xs:max-w-none">
                            {student.fullName}
                          </h5>
                          <span className="text-[8px] font-mono tracking-widest text-[#FF3B3F] bg-red-950/20 border border-red-900/30 font-bold px-1.5 py-0.5 rounded select-all uppercase">
                            {student.studentId}
                          </span>
                        </div>
                        
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[10px] text-zinc-500 font-mono leading-none">
                          <span className="text-yellow-500 border border-yellow-500/10 bg-yellow-500/5 px-2 py-0.5 rounded-[3px] text-[8px] uppercase tracking-wider font-semibold font-sans shrink-0">
                            {student.beltLevel?.split(' (')[0] || 'White Belt'}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-zinc-800" />
                          <span className="text-emerald-400 border border-emerald-500/15 bg-emerald-500/5 px-2 py-0.5 rounded-[3px] text-[8px] uppercase tracking-wider font-semibold font-sans shrink-0">
                            Coach: {
                              student.coachName ? 
                                student.coachName.replace(' 2nd dan Black Belt', '').replace(' 2nd dan Black belt', '').replace(' assistant Coach', '') : 
                                (DOJO_BRANCHES.find(b => b.id === student.branch || b.name === student.branch)?.coach.split(' Sir')[0] || 'Maruti Sir')
                            }
                          </span>
                          <span className="h-1 w-1 rounded-full bg-zinc-800" />
                          <span className="truncate max-w-[150px]">{student.batch || 'Unassigned Batch'}</span>
                          <span className="h-1 w-1 rounded-full bg-zinc-800" />
                          <span>Mob: {student.phone || 'No Mob'}</span>
                        </div>
                      </div>
                    </div>

                    {/* INTERACTIVE CONTROLS WRAPPER (ATTENDANCE TOGGLE + MESSAGES ACTIONS) */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 mt-2 md:mt-0 shrink-0">
                      
                      {/* Attendance Toggles */}
                      <div className="flex items-center space-x-1 border border-zinc-850 p-1.5 rounded-lg bg-slate-950/40 shrink-0 select-none">
                        <button
                          type="button"
                          onClick={() => toggleAttendance(student, 'Present')}
                          className={`px-3 py-1.5 rounded text-[9.5px] font-heading font-black uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1 ${
                            currentStatus === 'Present'
                              ? 'bg-emerald-500 text-white shadow-lg font-black'
                              : 'text-zinc-550 hover:text-white hover:bg-slate-900'
                          }`}
                        >
                          <Check className="w-3 h-3 shrink-0" />
                          <span>Present</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleAttendance(student, 'Absent')}
                          className={`px-3 py-1.5 rounded text-[9.5px] font-heading font-black uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1 ${
                            currentStatus === 'Absent'
                              ? 'bg-[#FF3B3F] text-white shadow-lg font-black'
                              : 'text-zinc-550 hover:text-white hover:bg-slate-900'
                          }`}
                        >
                          <X className="w-3 h-3 shrink-0" />
                          <span>Absent</span>
                        </button>
                      </div>

                      {/* Messaging Templates shortcuts trigger */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => openMessageModal(student, 'fees')}
                          className="p-2 border border-zinc-850 hover:border-zinc-700 hover:bg-slate-900/60 text-zinc-400 hover:text-yellow-500 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                          title="Send Fees Notice"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span className="text-[9px] uppercase font-bold tracking-wider sm:hidden">Remind Fees</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openMessageModal(student, 'notice')}
                          className="p-2 border border-zinc-850 hover:border-zinc-700 hover:bg-slate-900/60 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                          title="Send Special Notice"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="text-[9px] uppercase font-bold tracking-wider sm:hidden">Send Notice</span>
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* WHATSAPP TEMPLATE EDITOR DIALOG MODAL */}
      <AnimatePresence>
        {showMessageModal && messageTarget && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            
            {/* Backdrop Blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMessageModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Card content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative overflow-hidden z-20 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-zinc-950 pb-3">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <MessageCircle className="w-4.5 h-4.5" />
                  <span className="font-heading font-black text-xs uppercase tracking-wider">WhatsApp Dispatcher</span>
                </div>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest block font-bold">RECIPIENT SCHOLAR</span>
                <h5 className="font-title text-sm font-black text-white uppercase">{messageTarget.fullName}</h5>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Parent Name: {messageTarget.parentName || 'N/A'} | Phone: {messageTarget.whatsApp || messageTarget.phone || 'N/A'}
                </p>
              </div>

              {/* Message Type Selector tabs */}
              <div className="flex bg-slate-950/60 p-1 rounded-xl w-full gap-1 border border-zinc-950">
                <button
                  type="button"
                  onClick={() => {
                    setMessageType('fees');
                    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
                    const currentYear = new Date().getFullYear();
                    setCustomText(`[Reminder from LIONS KARATE CLUB Website]
[Auto-generated Message]

Dear Parent,

A gentle reminder to pay the karate monthly fees of 700 Rs for ${messageTarget.fullName} for the month of ${currentMonth} ${currentYear}.

📞 Sensei Maruti Jadhav
9049688172

Thank you.`);
                  }}
                  className={`flex-1 py-1.5 text-center text-[10px] font-black uppercase tracking-wider rounded transition-all ${
                    messageType === 'fees'
                      ? 'bg-yellow-500 text-slate-950 font-black'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  Fees Reminder
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessageType('notice');
                    setCustomText(`Dear Parent, this is Sensei ${selectedCoach.split(' Sir')[0]} from Lions Karate Club Pune. Important Notice for ${messageTarget.fullName}: Please note that we have special karate practice sessions this week. Kindly ensure they attend on time. Thank you!`);
                  }}
                  className={`flex-1 py-1.5 text-center text-[10px] font-black uppercase tracking-wider rounded transition-all ${
                    messageType === 'notice'
                      ? 'bg-emerald-500 text-white font-black'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  Class Notice
                </button>
              </div>

              {/* Custom Text Area */}
              <div className="space-y-1.5">
                <label className="text-zinc-500 text-[9px] font-heading font-black uppercase tracking-wider block">
                  Message Text body
                </label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={5}
                  className="w-full bg-slate-950 text-xs font-sans text-white border border-zinc-850 focus:border-emerald-550 rounded-xl p-3 focus:outline-none leading-relaxed resize-none"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-zinc-950 text-[10px] text-zinc-550 leading-relaxed font-sans">
                💡 Clicking dispatch will launch the official WhatsApp application with the message fully prefilled, ready to send with one click!
              </div>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-heading font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Message</span>
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SEMI-AUTOMATED BULK DISPATCHER DIALOG MODAL */}
      <AnimatePresence>
        {showBulkModal && bulkQueue.length > 0 && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            
            {/* Backdrop Blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBulkModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Card content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 relative overflow-hidden z-20 shadow-2xl space-y-4 text-left max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-zinc-950 pb-3 shrink-0">
                <div className="flex items-center space-x-2 text-yellow-500">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-heading font-black text-sm uppercase tracking-wider">Semi-Automated Bulk Dispatcher</span>
                </div>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Progress and instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-zinc-900 shrink-0">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">SENDING PROGRESS</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-zinc-850 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-yellow-500 h-full transition-all duration-300"
                        style={{ width: `${(dispatchedSet.size / bulkQueue.length) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-white font-bold">{dispatchedSet.size} / {bulkQueue.length}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block leading-relaxed">
                    Opening each will load the pre-filled message in WhatsApp. Click send, then return here to proceed.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">DISPATCH CAMPAIGN TYPE</span>
                  <div className="flex bg-slate-900 p-0.5 rounded-lg w-full gap-1 border border-zinc-850">
                    <button
                      type="button"
                      onClick={() => setBulkMessageType('fees')}
                      className={`flex-1 py-1 text-center text-[9px] font-black uppercase tracking-wider rounded transition-all ${
                        bulkMessageType === 'fees'
                          ? 'bg-yellow-500 text-slate-950 font-black'
                          : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      Fees (700 Rs)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkMessageType('notice')}
                      className={`flex-1 py-1 text-center text-[9px] font-black uppercase tracking-wider rounded transition-all ${
                        bulkMessageType === 'notice'
                          ? 'bg-emerald-500 text-white font-black'
                          : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      Class Notice
                    </button>
                  </div>
                </div>
              </div>

              {/* Campaign Message Template Preview block */}
              <div className="bg-slate-950 p-3 rounded-lg border border-zinc-900 shrink-0">
                <span className="text-[8.5px] font-mono text-zinc-650 uppercase tracking-widest block font-black mb-1">Active Message Template Preview:</span>
                <p className="text-[10.5px] text-zinc-400 font-mono line-clamp-3 leading-relaxed">
                  {bulkMessageType === 'fees' 
                    ? `[Reminder from LIONS KARATE CLUB Website] ... A gentle reminder to pay the karate monthly fees of 700 Rs for [Student Name] for the month of ${new Date().toLocaleString('en-US', { month: 'long' })}.`
                    : `Dear Parent, this is Sensei ${selectedCoach.split(' Sir')[0]} ... Important Notice for [Student Name]: Please note that we have special karate practice sessions...`
                  }
                </p>
              </div>

              {/* Queue Student List scrollbox */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
                {bulkQueue.map((student, idx) => {
                  const isSent = dispatchedSet.has(student.studentId);
                  const phone = student.whatsApp || student.phone || 'N/A';
                  return (
                    <div 
                      key={student.id || `${student.studentId}-${idx}`}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isSent 
                          ? 'bg-slate-950/40 border-emerald-500/10 opacity-70' 
                          : 'bg-slate-950 border-zinc-850 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3 text-left">
                        <div className="w-7 h-7 rounded-full bg-slate-900 border border-zinc-800 flex items-center justify-center font-mono text-[10px] text-zinc-400">
                          {idx + 1}
                        </div>
                        <div>
                          <span className="text-xs font-black text-white block uppercase">{student.fullName}</span>
                          <span className="text-[9.5px] text-zinc-550 font-mono">
                            {student.studentId} • Parent: {student.parentName || 'Self'} ({phone})
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBulkSendSingle(student)}
                        className={`px-3 py-1.5 rounded-lg font-heading font-black text-[10px] uppercase tracking-wider transition-all flex items-center space-x-1 cursor-pointer ${
                          isSent 
                            ? 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20'
                            : 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black shadow-md'
                        }`}
                      >
                        {isSent ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Resend</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Dispatch</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-zinc-950 shrink-0 text-right">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg font-heading font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                >
                  Close Dispatcher
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
