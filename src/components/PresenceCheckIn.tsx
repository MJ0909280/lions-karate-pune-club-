import React, { useState } from 'react';
import { QrCode, CheckCircle2, UserCheck, Printer, Smartphone, Download, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function PresenceCheckIn({ onBackToHome }: { onBackToHome?: () => void }) {
  const [studentIdInput, setStudentIdInput] = useState<string>('');
  const [checkingIn, setCheckingIn] = useState<boolean>(false);
  const [statusState, setStatusState] = useState<{
    type: 'success' | 'already_marked' | 'invalid_id' | 'error';
    studentName?: string;
    studentId?: string;
    message?: string;
  } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Construct direct live attendance URL for QR Code
  const attendanceUrl = `${window.location.origin}/#qr-checkin`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(attendanceUrl)}&color=000000&bgcolor=ffffff`;

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrCodeImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Lions_Karate_Attendance_QR.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(qrCodeImageUrl, '_blank');
    }
  };

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawId = studentIdInput.trim().toUpperCase();

    if (!rawId) {
      setStatusState({
        type: 'invalid_id',
        message: 'Please enter Student ID.'
      });
      return;
    }

    setCheckingIn(true);
    setStatusState(null);

    try {
      let matchedName = '';
      let matchedId = '';
      let foundInDb = false;

      // 1. Strict Backend ID Verification across students, admissions, and candidates
      try {
        // Check 'students' collection
        const snapStudents = await getDocs(collection(db, 'students'));
        const matchedStudentDoc = snapStudents.docs.find(d => {
          const data = d.data();
          const sid = (data.studentId || data.rollNo || d.id || '').toString().trim().toUpperCase();
          return sid === rawId || sid.replace(/[^a-zA-Z0-9]/g, '') === rawId.replace(/[^a-zA-Z0-9]/g, '');
        });

        if (matchedStudentDoc) {
          const data = matchedStudentDoc.data();
          matchedName = data.fullName || data.name || data.studentName || 'Karate Student';
          matchedId = data.studentId || rawId;
          foundInDb = true;
        } else {
          // Check 'admissions' collection
          const snapAdmissions = await getDocs(collection(db, 'admissions'));
          const matchedAdmissionDoc = snapAdmissions.docs.find(d => {
            const data = d.data();
            const sid = (data.studentId || data.rollNo || d.id || '').toString().trim().toUpperCase();
            return sid === rawId || sid.replace(/[^a-zA-Z0-9]/g, '') === rawId.replace(/[^a-zA-Z0-9]/g, '');
          });

          if (matchedAdmissionDoc) {
            const data = matchedAdmissionDoc.data();
            matchedName = data.fullName || data.name || data.studentName || 'Karate Student';
            matchedId = data.studentId || rawId;
            foundInDb = true;
          } else {
            // Check 'candidates' collection
            const snapCandidates = await getDocs(collection(db, 'candidates'));
            const matchedCandidateDoc = snapCandidates.docs.find(d => {
              const data = d.data();
              const sid = (data.studentId || data.rollNo || d.id || '').toString().trim().toUpperCase();
              return sid === rawId || sid.replace(/[^a-zA-Z0-9]/g, '') === rawId.replace(/[^a-zA-Z0-9]/g, '');
            });

            if (matchedCandidateDoc) {
              const data = matchedCandidateDoc.data();
              matchedName = data.studentName || data.fullName || 'Karate Student';
              matchedId = data.studentId || rawId;
              foundInDb = true;
            }
          }
        }
      } catch (dbQueryErr) {
        console.warn('Firestore student lookup error:', dbQueryErr);
      }

      // If ID does NOT exist in backend
      if (!foundInDb || !matchedId) {
        setStatusState({
          type: 'invalid_id',
          message: 'Invalid Student ID. Please check your ID and try again.'
        });
        setCheckingIn(false);
        return;
      }

      // 2. Duplicate Attendance Protection: Check Student ID + Today's Date
      const todayStr = new Date().toISOString().split('T')[0];
      try {
        const attendanceLogsRef = collection(db, 'attendance_logs');
        const qToday = query(
          attendanceLogsRef,
          where('studentId', '==', matchedId),
          where('date', '==', todayStr)
        );
        const existingAttendance = await getDocs(qToday);

        if (!existingAttendance.empty) {
          setStatusState({
            type: 'already_marked',
            studentName: matchedName,
            studentId: matchedId
          });
          setStudentIdInput('');
          setCheckingIn(false);
          return;
        }
      } catch (dupErr) {
        console.warn('Duplicate check warning:', dupErr);
      }

      // 3. Create exactly one attendance record in Firestore
      await addDoc(collection(db, 'attendance_logs'), {
        studentId: matchedId,
        studentName: matchedName,
        status: 'Present',
        date: todayStr,
        timestamp: serverTimestamp()
      });

      setStatusState({
        type: 'success',
        studentName: matchedName,
        studentId: matchedId
      });
      setStudentIdInput('');
    } catch (err: any) {
      console.error('Attendance recording error:', err);
      setStatusState({
        type: 'error',
        message: 'Something went wrong. Please try again.'
      });
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#060607] text-[#fafafa] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Navigation / Branding Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e1e22] pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-[#FF2A35] font-mono text-xs font-bold uppercase tracking-widest bg-[#FF2A35]/10 border border-[#FF2A35]/20 px-3 py-1 rounded-full">
              <QrCode className="w-3.5 h-3.5" />
              <span>Lions Karate Club Pune</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
              Mark Today's Attendance
            </h1>
            <p className="text-[#A1A1AA] text-xs sm:text-sm">
              Scan QR code at the Dojo or enter student ID below to mark attendance.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowPrintModal(true)}
              className="inline-flex items-center gap-2 bg-[#161619] hover:bg-[#1e1e22] text-[#FAFAFA] border border-[#1e1e22] hover:border-[#FF2A35]/40 font-heading font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg"
            >
              <Printer className="w-4 h-4 text-[#FF2A35]" />
              <span>Print Poster</span>
            </button>

            <button
              onClick={handleDownloadQR}
              className="inline-flex items-center gap-2 bg-[#FF2A35] hover:bg-red-600 text-white font-heading font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-[#FF2A35]/20"
            >
              <Download className="w-4 h-4" />
              <span>Download QR</span>
            </button>
            
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="inline-flex items-center gap-1 text-xs text-[#A1A1AA] hover:text-white transition-colors uppercase font-mono tracking-wider pl-2"
              >
                ← Back
              </button>
            )}
          </div>
        </div>

        {/* Attendance Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* SECTION 1: Clean, Single-Field Attendance Form */}
          <div className="md:col-span-7 bg-[#0E0E10] border border-[#1E1E22] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E1E22] pb-4">
              <div>
                <h2 className="font-heading text-lg sm:text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#FF2A35]" />
                  <span>Mark Today's Attendance</span>
                </h2>
                <p className="text-[#A1A1AA] text-xs mt-1">
                  Enter student ID number to record presence
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md shrink-0">
                ● Live Check-in
              </span>
            </div>

            <form onSubmit={handleManualCheckIn} className="space-y-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-2 font-semibold">
                  Student ID Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LKCP-2026-238"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  className="w-full bg-[#161619] border border-[#1E1E22] focus:border-[#FF2A35] rounded-xl px-4 py-3.5 text-base text-white placeholder-zinc-600 focus:outline-none transition-colors font-mono tracking-wide"
                />
              </div>

              {/* Status Notifications */}
              {statusState?.type === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold space-y-1"
                >
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Attendance Marked Successfully ✓</span>
                  </div>
                  {statusState.studentName && (
                    <p className="text-zinc-300 font-mono text-[11px] pl-6">
                      {statusState.studentName} ({statusState.studentId})
                    </p>
                  )}
                </motion.div>
              )}

              {statusState?.type === 'already_marked' && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-semibold space-y-1"
                >
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Attendance Already Marked ✓</span>
                  </div>
                  <p className="text-zinc-300 text-[11px] pl-6 font-mono">
                    {statusState.studentName} ({statusState.studentId}) has already been checked in today.
                  </p>
                </motion.div>
              )}

              {statusState?.type === 'invalid_id' && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <div>
                    <span className="font-bold block text-sm">Invalid Student ID</span>
                    <span className="text-[11px] text-zinc-400">Please check your ID and try again.</span>
                  </div>
                </motion.div>
              )}

              {statusState?.type === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{statusState.message || 'Something went wrong. Please try again.'}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={checkingIn}
                className="w-full bg-[#FF2A35] hover:bg-[#FF4D55] text-white font-heading font-black text-sm uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-[#FF2A35]/20 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {checkingIn ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{checkingIn ? 'Verifying...' : 'MARK PRESENT'}</span>
              </button>
            </form>
          </div>

          {/* SECTION 2: Dojo Wall QR Code Preview Card */}
          <div className="md:col-span-5 bg-[#0E0E10] border border-[#1E1E22] rounded-2xl p-6 space-y-5 shadow-2xl text-center">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF2A35] font-bold bg-[#FF2A35]/10 px-2.5 py-1 rounded-md border border-[#FF2A35]/20 inline-block">
                Dojo Entrance QR Code
              </span>
              <h3 className="font-heading text-lg font-black text-white uppercase tracking-wider">
                SCAN TO MARK ATTENDANCE
              </h3>
              <p className="text-[#A1A1AA] text-xs">
                Enter Your Student ID
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-inner inline-block mx-auto border-2 border-zinc-300">
              <img
                src={qrCodeImageUrl}
                alt="Scan to Mark Attendance QR Code"
                className="w-48 h-48 object-contain"
                loading="lazy"
              />
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#A1A1AA]">
              <Smartphone className="w-4 h-4 text-[#FF2A35]" />
              <span>Works directly on smartphone cameras</span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="w-full py-2.5 bg-[#FF2A35]/10 hover:bg-[#FF2A35] text-[#FF2A35] hover:text-white border border-[#FF2A35]/30 rounded-xl font-heading font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download QR Code (PNG)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="w-full py-2.5 bg-[#161619] hover:bg-[#1E1E22] text-zinc-300 hover:text-white border border-[#1E1E22] rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#FF2A35]" />
                <span>Print Poster For Dojo Wall</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* High-Resolution Printable Dojo Wall Poster Modal */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-slate-950 w-full max-w-md rounded-2xl p-8 space-y-6 shadow-2xl relative border-4 border-red-600"
            >
              {/* Poster Header */}
              <div className="text-center space-y-2 border-b-2 border-zinc-200 pb-4">
                <div className="inline-flex items-center gap-2 bg-red-600 text-white font-heading font-black text-xs uppercase px-3 py-1 rounded-full">
                  Lions Karate Club Pune
                </div>
                <h2 className="font-heading text-2xl font-black uppercase text-slate-900 tracking-wide">
                  SCAN TO MARK ATTENDANCE
                </h2>
                <p className="text-zinc-600 text-xs font-semibold">
                  Enter Your Student ID
                </p>
              </div>

              {/* Poster QR Image */}
              <div className="flex flex-col items-center justify-center space-y-3 py-2">
                <img
                  src={qrCodeImageUrl}
                  alt="Dojo Attendance QR Poster"
                  className="w-64 h-64 border-4 border-slate-900 rounded-xl p-2 shadow-md"
                />
                <p className="text-xs font-bold font-mono text-center text-slate-800">
                  📲 Scan with any phone camera to mark present
                </p>
              </div>

              {/* Poster Footer */}
              <div className="bg-slate-100 p-3 rounded-xl text-center text-[11px] text-zinc-700 font-sans">
                <strong>Narhe Dojo:</strong> Manaji Nagar, Pune | <strong>Helpline:</strong> +91 90496 88172
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-heading font-black text-xs uppercase py-3 rounded-xl transition-all text-center cursor-pointer shadow-md"
                >
                  Print Poster Now
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-3 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
