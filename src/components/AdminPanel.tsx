import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  addDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType, checkFirestoreConnection, generateSequentialStudentId } from '../firebase';
import { Admission, BatchInfo, BATCH_TIMINGS, DOJO_BRANCHES, BELT_LEVELS, Receipt, ReceiptItem, ParentQuery, DisciplineGrades, GradeValue, calculateOverallGrade } from '../types';
import IDCard from './IDCard';
import ProgressCard from './ProgressCard';
import SEOVisibilityConsole from './SEOVisibilityConsole';
import { 
  ShieldCheck, 
  LogOut, 
  Users, 
  CheckCircle, 
  XCircle, 
  X,
  Clock, 
  Search, 
  Filter,
  Eye, 
  Trash2, 
  Award,
  Calendar,
  Phone,
  Mail,
  Home,
  AlertCircle,
  FileText,
  Plus,
  Cake,
  Gift,
  Edit2,
  Save,
  Check,
  Target,
  MapPin,
  DollarSign,
  Video,
  RefreshCw,
  Upload,
  Camera,
  Sparkles,
  Download,
  Printer,
  MessageSquare,
  MessageCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Share2,
  AlertOctagon,
  ArrowRight,
  Lock,
  Unlock,
  ExternalLink
} from 'lucide-react';

// @ts-ignore
import html2pdf from 'html2pdf.js';

// Required Admin check email literal configuration
const AUTHORIZED_ADMIN_EMAIL = "writingandreserching18@gmail.com";

const DEFAULT_STUDENT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23111'><rect width='100' height='100' fill='%231a1a1a'/><circle cx='50' cy='35' r='14' fill='%23c9a96e'/><path d='M50 50 L35 75 L30 73 L42 53 L38 50 L30 55 L28 50 L40 42 Z' fill='%23fff'/><path d='M50 50 L65 80 L72 82 L58 55 L65 48 L75 52 L78 47 L60 40 Z' fill='%23fff'/><path d='M42 45 H58 V49 H42 Z' fill='%239B1B20'/></svg>";

function AdmissionsTableSkeleton() {
  return (
    <div className="animate-pulse w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-zinc-900 text-zinc-500 uppercase font-heading font-black text-[9px] tracking-widest">
              <th className="py-4.5 px-6">ID Pass</th>
              <th className="py-4.5 px-6">Student Bio</th>
              <th className="py-4.5 px-6">Branch & Coach</th>
              <th className="py-4.5 px-6">Batch Timings</th>
              <th className="py-4.5 px-6">Rank Belt</th>
              <th className="py-4.5 px-6">Review Status</th>
              <th className="py-4.5 px-6">Fees Status</th>
              <th className="py-4.5 px-6 text-right">Interactive Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/40 text-xs">
            {[1, 2, 3, 4, 5].map((idx) => (
              <tr key={idx} className="border-b border-zinc-900/20">
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded bg-zinc-850" />
                    <div className="w-20 h-4 bg-zinc-900 rounded" />
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="space-y-1.5">
                    <div className="w-28 h-4.5 bg-zinc-800 rounded" />
                    <div className="w-24 h-3 bg-zinc-900 rounded" />
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="space-y-1.5">
                    <div className="w-32 h-4 bg-zinc-800 rounded" />
                    <div className="w-20 h-3 bg-zinc-900 rounded" />
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="w-24 h-4 bg-zinc-850 rounded" />
                </td>
                <td className="py-4 px-6">
                  <div className="w-24 h-5 bg-zinc-850 rounded" />
                </td>
                <td className="py-4 px-6">
                  <div className="w-16 h-5 bg-zinc-900 rounded" />
                </td>
                <td className="py-4 px-6">
                  <div className="w-14 h-5 bg-zinc-900 rounded" />
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex justify-end space-x-2">
                    <div className="w-16 h-7 bg-zinc-850 rounded" />
                    <div className="w-8 h-7 bg-zinc-900 rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExamsTableSkeleton() {
  return (
    <div className="animate-pulse w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-zinc-450 text-[10px] uppercase font-bold tracking-wider font-mono border-b border-zinc-900">
              <th className="py-4 px-6">Student details</th>
              <th className="py-4 px-6">Dojo training Branch</th>
              <th className="py-4 px-6">Current & Target Belt</th>
              <th className="py-4 px-6">Registry state</th>
              <th className="py-4 px-6">Score & Comments</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/40 text-xs">
            {[1, 2, 3, 4, 5].map((idx) => (
              <tr key={idx} className="border-b border-zinc-900/20">
                <td className="py-4 px-6">
                  <div className="space-y-1.5">
                    <div className="w-20 h-3 bg-zinc-900 rounded" />
                    <div className="w-32 h-4 bg-zinc-800 rounded" />
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="w-28 h-4 bg-zinc-850 rounded" />
                </td>
                <td className="py-4 px-6">
                  <div className="space-y-1.5">
                    <div className="w-24 h-4 bg-zinc-800 rounded" />
                    <div className="w-24 h-3 bg-zinc-900 rounded" />
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="w-16 h-5 bg-zinc-900 rounded" />
                </td>
                <td className="py-4 px-6">
                  <div className="space-y-1">
                    <div className="w-32 h-4.5 bg-zinc-850 rounded" />
                    <div className="w-24 h-3.5 bg-zinc-900 rounded" />
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex justify-end space-x-2">
                    <div className="w-20 h-7 bg-zinc-850 rounded" />
                    <div className="w-8 h-7 bg-zinc-900 rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BatchesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse text-left">
      {[1, 2, 3].map((idx) => (
        <div key={idx} className="flex flex-col bg-slate-900/20 border border-zinc-900 overflow-hidden rounded-xl p-6 space-y-4">
          <div className="w-24 h-3 bg-zinc-900 rounded" />
          <div className="w-48 h-5.5 bg-zinc-800 rounded" />
          
          <div className="bg-slate-950/60 border border-zinc-900/50 p-3 rounded-lg space-y-2.5">
            <div className="flex items-center space-x-2">
              <div className="w-3.5 h-3.5 bg-zinc-900 rounded-full" />
              <div className="w-32 h-3 bg-zinc-900 rounded" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3.5 h-3.5 bg-zinc-900 rounded-full" />
              <div className="w-24 h-3.5 bg-zinc-800 rounded" />
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-zinc-900/30 p-2.5 rounded-lg">
            <div className="w-4 h-4 bg-zinc-850 rounded-full" />
            <div className="space-y-1">
              <div className="w-16 h-2.5 bg-zinc-900 rounded" />
              <div className="w-28 h-3.5 bg-zinc-800 rounded" />
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-900/40 flex justify-between items-center">
            <div className="w-20 h-4 bg-zinc-900 rounded" />
            <div className="flex space-x-1">
              <div className="w-7 h-7 bg-zinc-850 rounded" />
              <div className="w-7 h-7 bg-zinc-850 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SchedulesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse text-left">
      {[1, 2].map((idx) => (
        <div key={idx} className="bg-slate-900/20 border border-zinc-900 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-28 h-4.5 bg-zinc-800 rounded" />
            <div className="w-full h-3 bg-zinc-900 rounded" />
          </div>
          
          <div className="bg-slate-950/60 border border-zinc-900/50 p-3.5 rounded-xl space-y-2.5">
            <div className="w-24 h-3 bg-zinc-900 rounded" />
            <div className="w-48 h-3.5 bg-zinc-800 rounded" />
            <div className="w-32 h-3 bg-zinc-900 rounded" />
          </div>

          <div className="pt-2 border-t border-zinc-900/40 flex justify-between items-center">
            <div className="w-24 h-3 bg-zinc-900 rounded" />
            <div className="flex space-x-1.5">
              <div className="w-7 h-7 bg-zinc-850 rounded" />
              <div className="w-7 h-7 bg-zinc-850 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPanel() {
  // Auth and state managers
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Database live diagnostics state
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [checkingDb, setCheckingDb] = useState(false);

  const verifyDbConn = async () => {
    setCheckingDb(true);
    try {
      const res = await checkFirestoreConnection();
      setDbConnected(res);
    } catch {
      setDbConnected(false);
    } finally {
      setCheckingDb(false);
    }
  };

  useEffect(() => {
    verifyDbConn();
    const interval = setInterval(verifyDbConn, 30000);
    return () => clearInterval(interval);
  }, []);

  // Tab navigation console state
  const [adminTab, setAdminTab] = useState<'parent_queries' | 'admissions' | 'batches' | 'site_settings' | 'exams' | 'seo_ai' | 'bills' | 'duplicate_finder' | 'overdue_reminders'>('admissions');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 30-Day Overdue Reminders State
  const [overdueSearch, setOverdueSearch] = useState('');
  const [overdueThresholdDays, setOverdueThresholdDays] = useState<number>(30);
  const [copiedPhonesMessage, setCopiedPhonesMessage] = useState(false);
  const [overdueBranchFilter, setOverdueBranchFilter] = useState('all');

  // Helper to test if a student belongs to excluded institutions
  const isExcludedSchool = (schoolName?: string) => {
    if (!schoolName) return false;
    const clean = schoolName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return clean.includes('aryan') || clean.includes('vasundhara');
  };

  // Helper to extract overdue students (>30 days since last payment / admission)
  const getOverdueStudentsData = () => {
    const now = Date.now();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    return admissions
      .filter(student => !isExcludedSchool(student.schoolName))
      .map(student => {
        const sid = (student.studentId || '').trim().toLowerCase();
        const sName = (student.fullName || '').trim().toLowerCase();

        // Match receipts for this student
        const studentReceipts = receipts.filter(r => {
          const rId = (r.studentId || '').trim().toLowerCase();
          const rName = (r.studentName || '').trim().toLowerCase();
          return (sid && rId === sid) || (sName && rName === sName);
        });

        let latestReceiptTimestamp = 0;
        studentReceipts.forEach(r => {
          const t = r.createdAt || (r.date ? new Date(r.date).getTime() : 0);
          if (t && t > latestReceiptTimestamp) {
            latestReceiptTimestamp = t;
          }
        });

        const explicitLastPayment = (student as any).lastPaymentDate
          ? (typeof (student as any).lastPaymentDate === 'number'
              ? (student as any).lastPaymentDate
              : new Date((student as any).lastPaymentDate).getTime())
          : 0;

        const registrationTimestamp = student.createdAt || (student as any).updatedAt || 0;

        const lastPaymentTimestamp = Math.max(
          latestReceiptTimestamp,
          explicitLastPayment || 0,
          registrationTimestamp
        );

        const daysOverdue = lastPaymentTimestamp > 0
          ? Math.max(0, Math.floor((now - lastPaymentTimestamp) / MS_PER_DAY))
          : 999;

        return {
          student,
          lastPaymentTimestamp,
          daysOverdue,
          receiptsCount: studentReceipts.length,
          lastReceipt: studentReceipts[0] || null
        };
      })
      .filter(item => item.daysOverdue >= overdueThresholdDays)
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  };

  // Generate personalized WhatsApp click-to-chat URL
  const generateWhatsAppLink = (student: Admission, daysOverdue: number, lastPaymentTimestamp: number) => {
    const rawPhone = student.whatsApp || student.phone || '';
    const digitsOnly = rawPhone.replace(/[^0-9]/g, '');
    if (!digitsOnly) return null;

    const fullPhone = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;
    const lastDateFormatted = lastPaymentTimestamp > 0
      ? new Date(lastPaymentTimestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Admission Registration';

    const text = `🥋 *Lions Karate Club Pune — Monthly Fee Reminder*\n\n` +
      `Dear Parent of *${student.fullName}* (Karate Roll ID: *${student.studentId || 'N/A'}*),\n\n` +
      `This is a friendly reminder that karate monthly fees for *${student.fullName}* were last recorded on *${lastDateFormatted}* (*${daysOverdue} days ago*).\n\n` +
      `Kindly clear the pending fees at the Dojo or via UPI to keep attendance records and belt training progression up-to-date.\n\n` +
      `📍 *Branch:* ${student.branch || 'Lions Karate Club Dojo'}\n` +
      `🥋 *Batch:* ${student.batch || 'Regular Karate Batch'}\n\n` +
      `Thank you,\n*Sensei Maruti Jadhav*\nLions Karate Club Pune\n📞 Contact: +91 90496 88172`;

    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
  };

  // Copy all overdue parent phone numbers to clipboard
  const handleCopyAllOverdueNumbers = () => {
    const overdueData = getOverdueStudentsData();
    const phoneNumbers = overdueData
      .map(o => (o.student.whatsApp || o.student.phone || '').replace(/[^0-9]/g, ''))
      .filter(p => p.length >= 10);

    const uniquePhones = Array.from(new Set(phoneNumbers));
    if (uniquePhones.length === 0) {
      alert('No valid phone numbers found among overdue students.');
      return;
    }
    navigator.clipboard.writeText(uniquePhones.join(', '));
    setCopiedPhonesMessage(true);
    setTimeout(() => setCopiedPhonesMessage(false), 3000);
  };

  // Parents Online Queries States
  const [parentQueries, setParentQueries] = useState<ParentQuery[]>([]);
  const [parentQueriesLoading, setParentQueriesLoading] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<ParentQuery | null>(null);
  const [querySearch, setQuerySearch] = useState('');
  const [queryStatusFilter, setQueryStatusFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');
  const [queryTypeFilter, setQueryTypeFilter] = useState('all');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState('');

  // Editing Student IDs (Assigned later by Admin)
  const [isEditingId, setIsEditingId] = useState(false);
  const [newStudentIdVal, setNewStudentIdVal] = useState('');
  const [idEditError, setIdEditError] = useState('');
  const [idEditSuccess, setIdEditSuccess] = useState('');
  const [idEditSaving, setIdEditSaving] = useState(false);

  // Duplicate Student ID Diagnostic States
  const [duplicateRepairOpen, setDuplicateRepairOpen] = useState(false);
  const [diagIdInputs, setDiagIdInputs] = useState<{ [studentId: string]: string }>({});
  const [diagSaving, setDiagSaving] = useState<{ [studentId: string]: boolean }>({});
  const [diagErrors, setDiagErrors] = useState<{ [studentId: string]: string }>({});
  const [diagSuccesses, setDiagSuccesses] = useState<{ [studentId: string]: string }>({});
  const [isScanningDuplicates, setIsScanningDuplicates] = useState(false);
  const [lastScannedTime, setLastScannedTime] = useState<string | null>(null);
  const [scanStats, setScanStats] = useState<{ students: number; exams: number } | null>(null);

  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [editingCandidateNewId, setEditingCandidateNewId] = useState('');

  // Exam Mode Status (Active on exam days only)
  const [isExamActive, setIsExamActive] = useState<boolean>(() => localStorage.getItem('is_exam_day_active') === 'true');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'exam_settings'), (snap) => {
      if (snap.exists()) {
        const active = snap.data().isExamActive ?? false;
        setIsExamActive(active);
        localStorage.setItem('is_exam_day_active', String(active));
      }
    }, (err) => {
      console.warn("Could not read exam settings in admin:", err);
    });
    return () => unsub();
  }, []);

  const handleAdminToggleExamMode = async (newStatus: boolean) => {
    try {
      await setDoc(doc(db, 'settings', 'exam_settings'), {
        isExamActive: newStatus,
        updatedAt: Date.now()
      }, { merge: true });
      setIsExamActive(newStatus);
      localStorage.setItem('is_exam_day_active', String(newStatus));
      alert(`Exam Day Check-In Mode is now ${newStatus ? 'ACTIVE 🟢 (Parents can mark attendance)' : 'INACTIVE 🔴 (Check-in portal closed)'}`);
    } catch (err: any) {
      console.error("Failed to update exam mode:", err);
      setIsExamActive(newStatus);
      localStorage.setItem('is_exam_day_active', String(newStatus));
    }
  };

  const handleTriggerIntegrityScan = () => {
    setIsScanningDuplicates(true);
    setTimeout(() => {
      setIsScanningDuplicates(false);
      const now = new Date();
      setLastScannedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setScanStats({
        students: admissions.length,
        exams: exams.length
      });
      
      const { duplicateGroups } = getDuplicateIdGroups();
      const initialInputs: { [key: string]: string } = {};
      Object.values(duplicateGroups).flat().forEach(student => {
        initialInputs[student.id] = student.studentId;
      });
      setDiagIdInputs(prev => ({ ...prev, ...initialInputs }));
    }, 1100);
  };

  const handleUpdateQueryStatus = async (queryId: string, newStatus: 'new' | 'in_progress' | 'resolved') => {
    try {
      await updateDoc(doc(db, 'parent_queries', queryId), {
        status: newStatus,
        updatedAt: Date.now()
      });
      // Update selectedQuery if currently displayed
      if (selectedQuery && selectedQuery.id === queryId) {
        setSelectedQuery(prev => prev ? { ...prev, status: newStatus, updatedAt: Date.now() } : null);
      }
    } catch (error: any) {
      console.error('Error updating query status:', error);
      handleFirestoreError(error, OperationType.UPDATE, 'parent_queries');
    }
  };

  const handleUpdateQueryNotes = async (queryId: string, notes: string) => {
    try {
      await updateDoc(doc(db, 'parent_queries', queryId), {
        followUpNotes: notes.trim(),
        updatedAt: Date.now()
      });
      setEditingNotesId(null);
      // Update selectedQuery if currently displayed
      if (selectedQuery && selectedQuery.id === queryId) {
        setSelectedQuery(prev => prev ? { ...prev, followUpNotes: notes.trim(), updatedAt: Date.now() } : null);
      }
    } catch (error: any) {
      console.error('Error updating query notes:', error);
      handleFirestoreError(error, OperationType.UPDATE, 'parent_queries');
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this parent query enquiry? This action is permanent.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'parent_queries', queryId));
      if (selectedQuery?.id === queryId) {
        setSelectedQuery(null);
      }
    } catch (error: any) {
      console.error('Error deleting query:', error);
      handleFirestoreError(error, OperationType.DELETE, 'parent_queries');
    }
  };

  // Live Receipts Billing States
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

  // Bill Generator Form States
  const [bReceiptNo, setBReceiptNo] = useState('01');
  const [bDate, setBDate] = useState(new Date().toISOString().split('T')[0]);
  const [bStudentId, setBStudentId] = useState('');
  const [bStudentName, setBStudentName] = useState('');
  const [bParentName, setBParentName] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bWhatsApp, setBWhatsApp] = useState('');
  const [bEmail, setBEmail] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bBranch, setBBranch] = useState('Manaji Nagar Branch');
  const [bBatch, setBBatch] = useState('');
  const [bBeltLevel, setBBeltLevel] = useState('White Belt (10th Kyu - Beginner)');
  const [bPaymentMode, setBPaymentMode] = useState('Cash');
  const [bItems, setBItems] = useState<ReceiptItem[]>([{ id: '1', description: 'Monthly Tuition Fee', amount: 1500 }]);
  const [bPaidAmount, setBPaidAmount] = useState<number | ''>(1500);
  const [bRemarks, setBRemarks] = useState('');
  const [receiptSearchQuery, setReceiptSearchQuery] = useState('');
  const [showStuDropdown, setShowStuDropdown] = useState(false);
  const [selectedStudentForReceipt, setSelectedStudentForReceipt] = useState<Admission | null>(null);
  const [billSaving, setBillSaving] = useState(false);
  const [billError, setBillError] = useState('');
  const [downloadingPDF, setDownloadingPDF] = useState(false);

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

  const handleDownloadPDF = async () => {
    if (!selectedReceipt) return;
    setDownloadingPDF(true);
    
    const originalStyles = new Map<HTMLElement, string>();
    const tempStyles: HTMLStyleElement[] = [];
    
    // Store original functions and descriptors for exact restoration
    const originalGetComputedStyle = window.getComputedStyle;
    const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;
    const cssRulesDescriptor = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, 'cssRules');
    
    try {
      const element = document.getElementById('printable-receipt');
      if (!element) {
        console.error("Printable receipt element not found");
        return;
      }

      // 1. Monkeypatch window.getComputedStyle
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

      // 2. Monkeypatch CSSStyleDeclaration.prototype.getPropertyValue
      CSSStyleDeclaration.prototype.getPropertyValue = function (property: string) {
        const value = originalGetPropertyValue.call(this, property);
        if (typeof value === 'string' && (value.toLowerCase().includes('oklch') || value.toLowerCase().includes('oklab'))) {
          return convertUnsupportedColors(value);
        }
        return value;
      };

      // 3. Monkeypatch CSSStyleSheet.prototype.cssRules to intercept sheet.cssRules[i].style properties
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

      // 4. Sanitize all <style> elements
      const styleElements = Array.from(document.querySelectorAll('style'));
      styleElements.forEach((styleEl) => {
        const cssText = styleEl.textContent || '';
        if (cssText.toLowerCase().includes('oklch') || cssText.toLowerCase().includes('oklab')) {
          originalStyles.set(styleEl, cssText);
          styleEl.textContent = sanitizeUnsupportedColors(cssText);
        }
      });

      // 5. Sanitize all same-origin <link rel="stylesheet"> elements
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
        filename:     `LKC_Receipt_${selectedReceipt.receiptNo}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2.5, useCORS: true, logging: false, letterRendering: true },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      const clonedElement = element.cloneNode(true) as HTMLElement;
      clonedElement.style.display = 'block';
      clonedElement.style.background = '#ffffff';
      clonedElement.style.color = '#0f172a';
      
      // Sanitize inline style attributes on cloned tree elements directly
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
      // Restore all original functions and descriptors
      window.getComputedStyle = originalGetComputedStyle;
      CSSStyleDeclaration.prototype.getPropertyValue = originalGetPropertyValue;
      if (cssRulesDescriptor) {
        Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', cssRulesDescriptor);
      }

      // Restore original styles
      originalStyles.forEach((originalVal, el) => {
        if (el instanceof HTMLLinkElement) {
          el.disabled = false;
        } else if (el instanceof HTMLStyleElement) {
          el.textContent = originalVal;
        }
      });
      
      // Remove temporary style tags
      tempStyles.forEach((tempStyle) => {
        if (tempStyle.parentNode) {
          tempStyle.parentNode.removeChild(tempStyle);
        }
      });
      
      setDownloadingPDF(false);
    }
  };

  // Live Exams Admin Syncing States
  const [exams, setExams] = useState<any[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [gradingExam, setGradingExam] = useState<any | null>(null);
  const [adminDisciplinesGrades, setAdminDisciplinesGrades] = useState<DisciplineGrades>({});
  const [enteredGrade, setEnteredGrade] = useState('');
  const [enteredRemarks, setEnteredRemarks] = useState('');
  const [adminPublishResult, setAdminPublishResult] = useState(false);
  const [gradingSaving, setGradingSaving] = useState(false);
  const [gradingError, setGradingError] = useState('');

  const openGradingModal = (item: any, statusAction: 'passed' | 'failed') => {
    setGradingExam({ ...item, statusAction });
    const initialDisciplines = item.disciplinesGrades || {};
    setAdminDisciplinesGrades(initialDisciplines);
    const calculated = calculateOverallGrade(initialDisciplines);
    setEnteredGrade(item.grade || calculated || (statusAction === 'passed' ? 'A' : 'Fail (Requires Re-try)'));
    setEnteredRemarks(item.remarks || '');
    setAdminPublishResult(item.isPublished ?? true);
  };

  // Live Exam Schedules State
  const [examSchedules, setExamSchedules] = useState<any[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [examsSubTab, setExamsSubTab] = useState<'applications' | 'schedules'>('applications');
  const [copiedSchedId, setCopiedSchedId] = useState<string | null>(null);

  // Exam Schedule Form inputs
  const [schedModalOpen, setSchedModalOpen] = useState(false);
  const [editingSched, setEditingSched] = useState<any | null>(null);
  const [schedDate, setSchedDate] = useState('');
  const [schedBelt, setSchedBelt] = useState('');
  const [schedVenue, setSchedVenue] = useState('');
  const [schedPrereq, setSchedPrereq] = useState('');
  const [schedError, setSchedError] = useState('');
  const [schedSaving, setSchedSaving] = useState(false);

  // Search/Filters for exams tab
  const [examSearch, setExamSearch] = useState('');
  const [examStatusFilter, setExamStatusFilter] = useState<'all' | 'pending' | 'approved' | 'passed' | 'failed'>('all');
  const [examAttendanceFilter, setExamAttendanceFilter] = useState<'all' | 'present' | 'absent'>('all');

  // Bulk Grading state managers
  const [bulkGradingModalOpen, setBulkGradingModalOpen] = useState(false);
  const [bulkGradingScope, setBulkGradingScope] = useState<'present' | 'ungraded' | 'all_registered'>('present');
  const [bulkStatus, setBulkStatus] = useState<'passed' | 'failed'>('passed');
  const [bulkGrade, setBulkGrade] = useState<GradeValue>('A');
  const [bulkDisciplines, setBulkDisciplines] = useState<DisciplineGrades>({
    run: 'A',
    jump: 'A',
    sidesitups: 'A',
    kicks: 'A',
    conditionChecking: 'A',
    kata: 'A',
    kumite: 'A'
  });
  const [bulkRemarks, setBulkRemarks] = useState('Excellent effort, discipline, and execution shown during the Karate examination.');
  const [bulkPublish, setBulkPublish] = useState(true);
  const [bulkGradingSaving, setBulkGradingSaving] = useState(false);
  const [bulkGradingProgress, setBulkGradingProgress] = useState({ current: 0, total: 0 });

  const setAllBulkDisciplines = (gradeVal: GradeValue) => {
    setBulkDisciplines({
      run: gradeVal,
      jump: gradeVal,
      sidesitups: gradeVal,
      kicks: gradeVal,
      conditionChecking: gradeVal,
      kata: gradeVal,
      kumite: gradeVal
    });
    setBulkGrade(gradeVal);
  };

  // Site Video Configuration Inputs
  const [heroVideoInput, setHeroVideoInput] = useState('');
  const [aboutVideoInput, setAboutVideoInput] = useState('');
  const [kataVideoInput, setKataVideoInput] = useState('');
  const [kataVideoInput2, setKataVideoInput2] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  // WhatsApp Alert Configuration Inputs
  const [waEnabled, setWaEnabled] = useState(false);
  const [waPhoneNumber, setWaPhoneNumber] = useState('');
  const [waApiKey, setWaApiKey] = useState('');

  // Dynamic state managers represent batches in db
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  // Batch detailed Form states
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchInfo | null>(null);
  const [bName, setBName] = useState('');
  const [bAgeGroup, setBAgeGroup] = useState('');
  const [bDays, setBDays] = useState('');
  const [bTiming, setBTiming] = useState('');
  const [bFocus, setBFocus] = useState('');
  const [bPrice, setBPrice] = useState('');
  const [bCoaches, setBCoaches] = useState('');
  const [batchFormError, setBatchFormError] = useState('');
  const [batchFormSaving, setBatchFormSaving] = useState(false);

  // Modal displaying lists of users enrolled back
  const [viewingEnrolledBatch, setViewingEnrolledBatch] = useState<BatchInfo | null>(null);

  // Filter controllers
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'direct_exam'>('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [feesFilter, setFeesFilter] = useState<'all' | 'Paid' | 'Unpaid'>('all');

  // Detail Modal view
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [viewingIDCard, setViewingIDCard] = useState<Admission | null>(null);
  const [viewingProgressCard, setViewingProgressCard] = useState<Admission | null>(null);

  // Custom modal-dialog state to replace native window.confirm (which gets blocked inside iframe environments)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: () => {},
  });
  
  // Custom operational states
  const [loginError, setLoginError] = useState('');

  // Manual Student Entry States
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [manualFormError, setManualFormError] = useState('');
  const [manualSaving, setManualSaving] = useState(false);

  const [mStudentId, setMStudentId] = useState('');
  const [mIdLocked, setMIdLocked] = useState(true);
  const [mFullName, setMFullName] = useState('');
  const [mDob, setMDob] = useState('');
  const [mAge, setMAge] = useState<number | ''>('');
  const [mGender, setMGender] = useState<'male' | 'female' | 'other'>('male');
  const [mParentName, setMParentName] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mWhatsApp, setMWhatsApp] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mSchoolName, setMSchoolName] = useState('');
  const [mAddress, setMAddress] = useState('');
  const [mBatch, setMBatch] = useState('');
  const [mBeltLevel, setMBeltLevel] = useState('White Belt (10th Kyu - Beginner)');
  const [mBranch, setMBranch] = useState('Manaji Nagar Branch');
  const [mFeesStatus, setMFeesStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [mJoiningDate, setMJoiningDate] = useState('');
  const [mPhotoUrl, setMPhotoUrl] = useState('');
  const [mDragOver, setMDragOver] = useState(false);

  // Edit Student Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editAge, setEditAge] = useState<number | ''>('');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'other'>('male');
  const [editParentName, setEditParentName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWhatsApp, setEditWhatsApp] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editCoachName, setEditCoachName] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editBeltLevel, setEditBeltLevel] = useState('');
  const [editSchoolName, setEditSchoolName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editFeesStatus, setEditFeesStatus] = useState<'Paid' | 'Unpaid'>('Unpaid');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editDragOver, setEditDragOver] = useState(false);
  const [editProfileSaving, setEditProfileSaving] = useState(false);
  const [editProfileError, setEditProfileError] = useState('');

  // 1. Manage Firebase Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Enforce secure whitelist rule
        if (currentUser.email === AUTHORIZED_ADMIN_EMAIL) {
          setIsAdmin(true);
          setLoginError('');
        } else {
          setIsAdmin(false);
          setLoginError(`Access Denied. The logged-in Google account (${currentUser.email}) is not authorized as the Shihan Administrator.`);
        }
      } else {
        setIsAdmin(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Manage Real-time Admissions synced listeners for public stats and admin dashboard
  useEffect(() => {
    setDataLoading(true);
    const admissionsRef = collection(db, 'admissions');
    
    // Attach standard onSnapshot listener for instant state refresh on submissions
    const unsubscribe = onSnapshot(admissionsRef, (snapshot) => {
      const records: Admission[] = [];
      snapshot.forEach((docSnap) => {
        records.push({
          id: docSnap.id,
          ...docSnap.data()
        } as Admission);
      });
      // Sort newest submissions first
      records.sort((a, b) => b.createdAt - a.createdAt);
      setAdmissions(records);
      setDataLoading(false);
    }, (error) => {
      console.error("Firestore loading error: ", error);
      setDataLoading(false);
      if (user && isAdmin) {
        handleFirestoreError(error, OperationType.LIST, 'admissions');
      }
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  // 2b. Manage Real-time Parent Queries synced listeners
  useEffect(() => {
    if (!user || !isAdmin) {
      setParentQueries([]);
      return;
    }

    setParentQueriesLoading(true);
    const parentQueriesRef = collection(db, 'parent_queries');
    
    const unsubscribe = onSnapshot(parentQueriesRef, (snapshot) => {
      const records: ParentQuery[] = [];
      snapshot.forEach((docSnap) => {
        records.push({
          id: docSnap.id,
          ...docSnap.data()
        } as ParentQuery);
      });
      // Sort newest queries first
      records.sort((a, b) => b.createdAt - a.createdAt);
      setParentQueries(records);
      setParentQueriesLoading(false);
    }, (error) => {
      console.error("Parent queries loading error: ", error);
      setParentQueriesLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'parent_queries');
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  // Handle standard google pop-up session triggers
  const handleGoogleLogin = async () => {
    setLoginError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      const errorCode = err?.code || '';
      const errorMessage = err?.message || '';
      
      if (errorCode === 'auth/unauthorized-domain') {
        setLoginError(
          `🔑 UNAUTHORIZED DOMAIN ERROR\n\n` +
          `The domain "${window.location.hostname}" is not allowed to sign in with your Firebase Project.\n\n` +
          `How to authorize this domain:\n` +
          `1. Open your Firebase Console (https://console.firebase.google.com)\n` +
          `2. Click on "Authentication" in the left sidebar.\n` +
          `3. Go to the "Settings" tab at the top.\n` +
          `4. Click on "Authorized domains" from the list.\n` +
          `5. Click "Add domain" and enter:\n` +
          `   👉   ${window.location.hostname}\n` +
          `6. Click Add, wait 1 minute, and try clicking "Log in with Google" again!`
        );
      } else if (errorCode === 'auth/popup-blocked') {
        setLoginError(
          `🚫 POPUP BLOCKED\n\n` +
          `Your browser blocked the Google Authentication window.\n\n` +
          `How to fix:\n` +
          `1. Click the "Log in with Google" button again.\n` +
          `2. Watch the browser address bar for a "Popup Blocked" icon.\n` +
          `3. Click that icon and choose "Always allow popups from this site".`
        );
      } else if (errorCode === 'auth/operation-not-allowed') {
        setLoginError(
          `⚙️ GOOGLE PROVIDER IS DISABLED\n\n` +
          `Google Sign-In hasn't been enabled under your Firebase Project yet.\n\n` +
          `How to enable:\n` +
          `1. Go to Firebase Console -> Authentication -> Sign-in method.\n` +
          `2. Click "Add new provider" and select Google.\n` +
          `3. Enable it, fill in your project support email, and save.`
        );
      } else {
        setLoginError(
          `⚠️ AUTHENTICATION ERROR (${errorCode || 'unknown'})\n\n` +
          `${errorMessage || 'Verify popup settings or network connection.'}\n\n` +
          `Tip: If this is running on your Vercel URL, make sure "${window.location.hostname}" is added to "Authorized domains" in your Firebase console under Authentication -> Settings.`
        );
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setViewingIDCard(null);
      setSelectedAdmission(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Sync Batches dynamically
  useEffect(() => {
    if (!user || !isAdmin) {
      setBatches([]);
      return;
    }

    setBatchesLoading(true);
    const batchesRef = collection(db, 'batches');
    const unsubscribe = onSnapshot(batchesRef, (snapshot) => {
      const records: BatchInfo[] = [];
      snapshot.forEach((docSnap) => {
        records.push({
          id: docSnap.id,
          ...docSnap.data()
        } as BatchInfo);
      });
      setBatches(records);
      setBatchesLoading(false);
    }, (error) => {
      console.error("Firestore batches loading error: ", error);
      setBatchesLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'batches');
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  // Sync Site Video Settings in real-time
  useEffect(() => {
    if (!user || !isAdmin) return;
    const unsub = onSnapshot(doc(db, 'settings', 'video'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setHeroVideoInput(data.heroVideoUrl || 'https://res.cloudinary.com/dlzdagymx/video/upload/q_auto/f_auto/v1779342942/lions-karate-website-media/m3hfwi7bsfujadlsy5sl.mp4');
        setAboutVideoInput(data.aboutVideoUrl || 'https://res.cloudinary.com/dlzdagymx/video/upload/v1781891366/WhatsApp_Video_2026-06-19_at_9.51.10_PM_pog0dc.mp4');
        setKataVideoInput(data.kataVideoUrl || 'https://res.cloudinary.com/dlzdagymx/video/upload/v1784001539/WhatsApp_Video_2026-07-14_at_9.23.13_AM_sve0ia.mp4');
        setKataVideoInput2(data.kataVideoUrl2 || 'https://res.cloudinary.com/dlzdagymx/video/upload/v1783699434/Kata_hcvwxf.mp4');
      } else {
        setHeroVideoInput('https://res.cloudinary.com/dlzdagymx/video/upload/q_auto/f_auto/v1779342942/lions-karate-website-media/m3hfwi7bsfujadlsy5sl.mp4');
        setAboutVideoInput('https://res.cloudinary.com/dlzdagymx/video/upload/v1781891366/WhatsApp_Video_2026-06-19_at_9.51.10_PM_pog0dc.mp4');
        setKataVideoInput('https://res.cloudinary.com/dlzdagymx/video/upload/v1784001539/WhatsApp_Video_2026-07-14_at_9.23.13_AM_sve0ia.mp4');
        setKataVideoInput2('https://res.cloudinary.com/dlzdagymx/video/upload/v1783699434/Kata_hcvwxf.mp4');
      }
    }, (error) => {
      console.error("Firestore settings sync error: ", error);
    });
    return () => unsub();
  }, [user, isAdmin]);

  // Sync WhatsApp Site Notification Settings in real-time
  useEffect(() => {
    if (!user || !isAdmin) return;
    const unsub = onSnapshot(doc(db, 'settings', 'whatsapp'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setWaEnabled(!!data.enabled);
        setWaPhoneNumber(data.phoneNumber || '');
        setWaApiKey(data.apiKey || '');
      } else {
        setWaEnabled(false);
        setWaPhoneNumber('+91 90496 88172');
        setWaApiKey('');
      }
    }, (error) => {
      console.error("Firestore settings/whatsapp sync error: ", error);
    });
    return () => unsub();
  }, [user, isAdmin]);

  // Sync real-time Exams database
  useEffect(() => {
    if (!user || !isAdmin) {
      setExams([]);
      return;
    }

    setExamsLoading(true);
    const examsRef = collection(db, 'exams');
    const unsubscribe = onSnapshot(examsRef, (snapshot) => {
      const records: any[] = [];
      snapshot.forEach((docSnap) => {
        records.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      records.sort((a, b) => b.createdAt - a.createdAt);
      setExams(records);
      setExamsLoading(false);
    }, (error) => {
      console.error("Firestore exams sync error:", error);
      setExamsLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'exams');
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  // Sync real-time Exam Schedules database
  useEffect(() => {
    if (!user || !isAdmin) {
      setExamSchedules([]);
      return;
    }

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
      console.error("Firestore schedules sync error:", error);
      setSchedulesLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'exam_schedules');
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  // Sync real-time Receipts database
  useEffect(() => {
    if (!user || !isAdmin) {
      setReceipts([]);
      return;
    }

    setReceiptsLoading(true);
    const receiptsRef = collection(db, 'receipts');
    const unsubscribe = onSnapshot(receiptsRef, (snapshot) => {
      const records: Receipt[] = [];
      snapshot.forEach((docSnap) => {
        records.push({
          id: docSnap.id,
          ...docSnap.data()
        } as Receipt);
      });
      // Sort newest receipts first
      records.sort((a, b) => b.createdAt - a.createdAt);
      setReceipts(records);
      setReceiptsLoading(false);
    }, (error) => {
      console.error("Firestore receipts sync error:", error);
      setReceiptsLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'receipts');
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;

    setSettingsSaving(true);
    setSettingsSuccess(false);
    setSettingsError('');

    try {
      await setDoc(doc(db, 'settings', 'video'), {
        heroVideoUrl: heroVideoInput.trim(),
        aboutVideoUrl: aboutVideoInput.trim(),
        kataVideoUrl: kataVideoInput.trim(),
        kataVideoUrl2: kataVideoInput2.trim(),
        updatedAt: Date.now()
      });
      await setDoc(doc(db, 'settings', 'whatsapp'), {
        enabled: waEnabled,
        phoneNumber: waPhoneNumber.trim(),
        apiKey: waApiKey.trim(),
        updatedAt: Date.now()
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 4000);
    } catch (err: any) {
      console.error("Firestore settings write failure: ", err);
      setSettingsError("Failure executing write operation. Please check your admin privileges.");
      handleFirestoreError(err, OperationType.WRITE, 'settings/video');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Auto-generate numeric Receipt No starting from '01'
  useEffect(() => {
    if (receipts.length > 0) {
      const numericNos = receipts
        .map(r => parseInt(r.receiptNo, 10))
        .filter(num => !isNaN(num));
      const maxNo = numericNos.length > 0 ? Math.max(...numericNos) : receipts.length;
      const nextNo = String(maxNo + 1).padStart(2, '0');
      setBReceiptNo(nextNo);
    } else {
      setBReceiptNo('01');
    }
  }, [receipts, isGeneratingReceipt]);

  const handleSelectStudentForReceipt = (student: Admission) => {
    setSelectedStudentForReceipt(student);
    setBStudentId(student.studentId || '');
    setBStudentName(student.fullName || '');
    setBParentName(student.parentName || '');
    setBPhone(student.phone || '');
    setBWhatsApp(student.whatsApp || '');
    setBEmail(student.email || '');
    setBAddress(student.address || '');
    setBBranch(student.branch || 'Manaji Nagar Branch');
    setBBatch(student.batch || '');
    setBBeltLevel(student.beltLevel || 'White Belt (10th Kyu - Beginner)');
  };

  const handleClearStudentForReceipt = () => {
    setSelectedStudentForReceipt(null);
    setBStudentId('');
    setBStudentName('');
    setBParentName('');
    setBPhone('');
    setBWhatsApp('');
    setBEmail('');
    setBAddress('');
    setBBatch('');
  };

  const handleAddItem = () => {
    const newId = String(Date.now() + Math.random());
    setBItems([...bItems, { id: newId, description: '', amount: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (bItems.length === 1) return;
    const updated = bItems.filter(item => item.id !== id);
    setBItems(updated);
    
    const newTotal = updated.reduce((sum, item) => sum + (item.amount || 0), 0);
    setBPaidAmount(newTotal);
  };

  const handleItemChange = (id: string, field: 'description' | 'amount', value: any) => {
    const updated = bItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setBItems(updated);

    if (field === 'amount') {
      const newTotal = updated.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      setBPaidAmount(newTotal);
    }
  };

  const handleSaveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;

    if (!bStudentName.trim()) {
      setBillError('Please enter the Student Full Name.');
      return;
    }

    if (bItems.some(item => !item.description.trim() || Number(item.amount) <= 0)) {
      setBillError('Please ensure all items have a description and a valid amount greater than 0.');
      return;
    }

    setBillSaving(true);
    setBillError('');

    const total = bItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const paid = Number(bPaidAmount) || 0;
    const balance = total - paid;

    const receiptData: Receipt = {
      receiptNo: bReceiptNo.trim(),
      date: bDate,
      studentId: bStudentId.trim(),
      studentName: bStudentName.trim(),
      parentName: bParentName.trim(),
      phone: bPhone.trim(),
      whatsApp: bWhatsApp.trim(),
      email: bEmail.trim(),
      address: bAddress.trim(),
      branch: bBranch,
      batch: bBatch,
      beltLevel: bBeltLevel,
      paymentMode: bPaymentMode,
      items: bItems.map(item => ({ ...item, amount: Number(item.amount) })),
      totalAmount: total,
      paidAmount: paid,
      balanceAmount: balance,
      remarks: bRemarks.trim(),
      createdAt: Date.now()
    };

    try {
      const docRef = await addDoc(collection(db, 'receipts'), receiptData);
      
      if (selectedStudentForReceipt) {
        const studentDocRef = doc(db, 'admissions', selectedStudentForReceipt.id);
        const newFeesStatus = balance <= 0 ? 'Paid' : 'Unpaid';
        await updateDoc(studentDocRef, {
          feesStatus: newFeesStatus,
          updatedAt: Date.now()
        });
      }

      setIsGeneratingReceipt(false);
      setSelectedReceipt({ ...receiptData, id: docRef.id });

      // Reset form fields
      setBStudentId('');
      setBStudentName('');
      setBParentName('');
      setBPhone('');
      setBWhatsApp('');
      setBEmail('');
      setBAddress('');
      setBRemarks('');
      setBItems([{ id: '1', description: 'Monthly Tuition Fee', amount: 1500 }]);
      setBPaidAmount(1500);
      setSelectedStudentForReceipt(null);
    } catch (err: any) {
      console.error("Error saving bill:", err);
      setBillError("Failed to save receipt. " + (err?.message || ""));
    } finally {
      setBillSaving(false);
    }
  };

  const suggestNextStudentId = async () => {
    try {
      const nextId = await generateSequentialStudentId();
      setMStudentId(nextId);
    } catch (err) {
      console.warn("Failed to suggest unique ID:", err);
    }
  };

  const openEnrollModal = async () => {
    const defaultBatch = batches.length > 0 ? batches[0].name : BATCH_TIMINGS[0].name;
    setMBatch(defaultBatch);
    setMStudentId('Generating...');
    setMIdLocked(true);
    setMFullName('');
    setMDob('');
    setMAge('');
    setMGender('male');
    setMParentName('');
    setMPhone('');
    setMWhatsApp('');
    setMEmail('');
    setMAddress('');
    setMBeltLevel('White Belt (10th Kyu - Beginner)');
    setMBranch('Manaji Nagar Branch');
    setMFeesStatus('Paid');
    setMPhotoUrl('');
    setManualFormError('');
    setMJoiningDate(new Date().toISOString().split('T')[0]);
    
    setEnrollModalOpen(true);
    
    // Auto-generate suggested ID asynchronously
    await suggestNextStudentId();
  };

  const exportToCSV = () => {
    if (filteredAdmissions.length === 0) {
      return;
    }

    const headers = [
      "Roll ID",
      "Full Name",
      "School Name",
      "DOB",
      "Age",
      "Gender",
      "Parent Name",
      "Phone",
      "WhatsApp",
      "Email",
      "Address",
      "Batch",
      "Belt Level",
      "Branch",
      "Coach Name",
      "Review Status",
      "Fees Status",
      "Registration Date"
    ];

    const escapeCSVValue = (val: any) => {
      if (val === undefined || val === null) return "";
      let str = String(val);
      // Replace double quotes with double double quotes
      str = str.replace(/"/g, '""');
      // Wrap in double quotes if there are commas, double quotes, or newlines
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str}"`;
      }
      return str;
    };

    const rows = filteredAdmissions.map((student) => {
      const regDate = student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "";
      return [
        student.studentId || "N/A",
        student.fullName || "",
        student.schoolName || "",
        student.dob || "",
        student.age !== undefined ? student.age : "",
        student.gender || "",
        student.parentName || "",
        student.phone || "",
        student.whatsApp || "",
        student.email || "",
        student.address || "",
        student.batch || "",
        student.beltLevel || "",
        student.branch || "N/A",
        student.coachName || "N/A",
        student.status || "",
        student.feesStatus || "Unpaid",
        regDate
      ].map(escapeCSVValue).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    // Generate clean filename with current date
    const today = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `lions_karate_registry_${today}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const compressAndProcessMImage = (file: File) => {
    const isImageType = file.type ? file.type.startsWith('image/') : false;
    const isImageExt = /\.(jpg|jpeg|png|webp|heic|heif|bmp|svg|gif)$/i.test(file.name);

    if (!isImageType && !isImageExt) {
      setManualFormError('Please select a valid image file (.png, .jpg, .jpeg, .webp).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setManualFormError('Image file is too large (max 25MB). Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setManualFormError('Could not read photo file. Please try a different photo.');
    };

    reader.onload = (event) => {
      const dataUrlResult = event.target?.result as string;
      if (!dataUrlResult) return;

      const img = new Image();
      img.onerror = () => {
        if (dataUrlResult.length < 3 * 1024 * 1024) {
          setMPhotoUrl(dataUrlResult);
          setManualFormError('');
        } else {
          setMPhotoUrl(DEFAULT_STUDENT_AVATAR);
          setManualFormError('');
        }
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width || MAX_WIDTH;
          let height = img.height || MAX_HEIGHT;

          const size = Math.min(width, height);
          const offsetX = (width - size) / 2;
          const offsetY = (height - size) / 2;

          canvas.width = MAX_WIDTH;
          canvas.height = MAX_HEIGHT;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, MAX_WIDTH, MAX_HEIGHT);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            setMPhotoUrl(dataUrl);
            setManualFormError('');
          } else {
            setMPhotoUrl(dataUrlResult);
            setManualFormError('');
          }
        } catch (canvasErr) {
          console.warn('Manual photo canvas fallback:', canvasErr);
          setMPhotoUrl(dataUrlResult);
          setManualFormError('');
        }
      };
      img.src = dataUrlResult;
    };
    reader.readAsDataURL(file);
  };

  const handleMPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      compressAndProcessMImage(files[0]);
    }
  };

  const handleMDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setMDragOver(true);
  };

  const handleMDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setMDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      compressAndProcessMImage(files[0]);
    }
  };

  const compressAndProcessEditImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setEditProfileError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrlResult = e.target?.result as string;
      const img = new Image();
      img.onerror = () => {
        setEditPhotoUrl(DEFAULT_STUDENT_AVATAR);
        setEditProfileError('');
      };
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width || MAX_WIDTH;
          let height = img.height || MAX_HEIGHT;

          const size = Math.min(width, height);
          const offsetX = (width - size) / 2;
          const offsetY = (height - size) / 2;

          canvas.width = MAX_WIDTH;
          canvas.height = MAX_HEIGHT;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, MAX_WIDTH, MAX_HEIGHT);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            setEditPhotoUrl(dataUrl);
            setEditProfileError('');
          } else {
            setEditPhotoUrl(dataUrlResult);
            setEditProfileError('');
          }
        } catch (canvasErr) {
          console.warn('Edit photo canvas fallback:', canvasErr);
          setEditPhotoUrl(dataUrlResult);
          setEditProfileError('');
        }
      };
      img.src = dataUrlResult;
    };
    reader.readAsDataURL(file);
  };

  const handleEditPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      compressAndProcessEditImage(files[0]);
    }
  };

  const handleEditDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setEditDragOver(true);
  };

  const handleEditDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setEditDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      compressAndProcessEditImage(files[0]);
    }
  };

  const handleSaveManualStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mIdLocked && !mStudentId.trim()) {
      setManualFormError('Student Roll ID is required.');
      return;
    }
    if (!mFullName.trim()) {
      setManualFormError('Student full name is required.');
      return;
    }
    if (!mPhone.trim()) {
      setManualFormError('Contact phone is required.');
      return;
    }
    
    setManualSaving(true);
    setManualFormError('');

    try {
      const selectedBranch = DOJO_BRANCHES.find(b => b.name === mBranch) || DOJO_BRANCHES[0];
      const coachName = selectedBranch.coach;

      let finalStudentId = '';
      if (mIdLocked) {
        // Atomic dynamic generation at submission guarantees no duplicate can ever be created
        finalStudentId = await generateSequentialStudentId();
      } else {
        finalStudentId = mStudentId.trim().toUpperCase();
      }

      // Check for duplicate in Firestore directly for absolute precision!
      const checkQ = query(collection(db, 'admissions'), where('studentId', '==', finalStudentId));
      const checkSnap = await getDocs(checkQ);
      if (!checkSnap.empty) {
        setManualFormError(`The student roll ID "${finalStudentId}" is already taken in the directory. Please use a unique sequence.`);
        setManualSaving(false);
        return;
      }

      const joiningTimestamp = mJoiningDate ? new Date(mJoiningDate).getTime() : Date.now();

      const studentData = {
        studentId: finalStudentId,
        fullName: mFullName.trim(),
        dob: mDob || new Date(Date.now() - 315576000000).toISOString().split('T')[0],
        age: Number(mAge) || 10,
        gender: mGender,
        parentName: mParentName.trim() || 'Parent/Guardian',
        phone: mPhone.trim(),
        whatsApp: mWhatsApp.trim() || mPhone.trim(),
        email: mEmail.trim() || 'student@dojo.com',
        address: mAddress.trim() || 'Pune, Maharashtra',
        batch: mBatch,
        beltLevel: mBeltLevel,
        photoUrl: mPhotoUrl || DEFAULT_STUDENT_AVATAR,
        status: 'approved',
        createdAt: joiningTimestamp,
        updatedAt: Date.now(),
        approvedAt: Date.now(),
        branch: mBranch,
        coachName: coachName,
        feesStatus: mFeesStatus,
        schoolName: mSchoolName.trim()
      };

      await addDoc(collection(db, 'admissions'), studentData);
      setEnrollModalOpen(false);
    } catch (err: any) {
      console.error("Failed to manually register previous student:", err);
      setManualFormError(err.message || 'Failed to sync to database. Please retry.');
    } finally {
      setManualSaving(false);
    }
  };

  // Exam Grading Operations
  const handleApproveExamSlot = async (examId: string) => {
    try {
      const examRef = doc(db, 'exams', examId);
      await updateDoc(examRef, {
        status: 'approved',
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Failed to approve exam slot:", error);
      handleFirestoreError(error, OperationType.UPDATE, `exams/${examId}`);
    }
  };

  const handleGradeExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingExam) return;

    setGradingSaving(true);
    setGradingError('');

    try {
      const computedOverall = (adminDisciplinesGrades && Object.keys(adminDisciplinesGrades).length > 0)
        ? calculateOverallGrade(adminDisciplinesGrades)
        : undefined;
      const finalGradeValue = computedOverall || enteredGrade.trim() || 'A';

      // 1. Grade the exam document
      const examRef = doc(db, 'exams', gradingExam.id);
      await updateDoc(examRef, {
        status: gradingExam.statusAction,
        grade: finalGradeValue,
        disciplinesGrades: adminDisciplinesGrades,
        remarks: enteredRemarks.trim(),
        isPublished: adminPublishResult,
        updatedAt: Date.now()
      });

      // 2. If Passed AND Published, graduate the student's belt level in the admissions profile collection
      if (gradingExam.statusAction === 'passed' && adminPublishResult) {
        const admissionsRef = collection(db, 'admissions');
        
        // Find correct student in memory first for 100% accuracy on duplicate IDs
        const targetStudent = admissions.find(s => 
          (s.studentId || '').trim().toUpperCase() === (gradingExam.studentId || '').trim().toUpperCase() &&
          (s.fullName || '').trim().toLowerCase() === (gradingExam.studentName || '').trim().toLowerCase()
        ) || admissions.find(s => 
          (s.fullName || '').trim().toLowerCase() === (gradingExam.studentName || '').trim().toLowerCase()
        );
        
        if (targetStudent) {
          await updateDoc(doc(db, 'admissions', targetStudent.id), {
            beltLevel: gradingExam.targetBelt,
            updatedAt: Date.now()
          });
          console.log(`Successfully graduated student '${targetStudent.fullName}' to belt '${gradingExam.targetBelt}'`);
        } else {
          // Fallback to query
          const q = query(admissionsRef, where('studentId', '==', gradingExam.studentId));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const studentDoc = snap.docs[0];
            await updateDoc(doc(db, 'admissions', studentDoc.id), {
              beltLevel: gradingExam.targetBelt,
              updatedAt: Date.now()
            });
          }
        }
      }

      setGradingExam(null);
      setEnteredGrade('');
      setEnteredRemarks('');
    } catch (error: any) {
      console.error("Failed to grade exam:", error);
      setGradingError(error.message || 'Verification failed.');
      handleFirestoreError(error, OperationType.UPDATE, `exams/${gradingExam.id}`);
    } finally {
      setGradingSaving(false);
    }
  };

  const handleDeleteExamRecord = (examId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Erase Exam Registration",
      message: "Are you absolutely sure you want to permanently erase this exam registration? This action is irreversible.",
      confirmText: "Erase Record",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'exams', examId));
        } catch (error) {
          console.error("Failed to delete exam record:", error);
          handleFirestoreError(error, OperationType.DELETE, `exams/${examId}`);
        }
      }
    });
  };

  const handleSaveScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    if (!schedDate || !schedBelt || !schedVenue || !schedPrereq) {
      setSchedError('All fields are required.');
      return;
    }

    setSchedSaving(true);
    setSchedError('');

    try {
      const scheduleData = {
        examDate: schedDate.trim(),
        beltLevel: schedBelt.trim(),
        venueDetails: schedVenue.trim(),
        prerequisites: schedPrereq.trim(),
        updatedAt: Date.now()
      };

      if (editingSched) {
        await updateDoc(doc(db, 'exam_schedules', editingSched.id), {
          ...scheduleData
        });
      } else {
        await addDoc(collection(db, 'exam_schedules'), {
          ...scheduleData,
          createdAt: Date.now()
        });
      }

      setSchedModalOpen(false);
      setEditingSched(null);
      setSchedDate('');
      setSchedBelt('');
      setSchedVenue('');
      setSchedPrereq('');
    } catch (err: any) {
      console.error("Failed to save schedule:", err);
      setSchedError(err.message || "Failed to save schedule.");
      handleFirestoreError(err, OperationType.WRITE, 'exam_schedules');
    } finally {
      setSchedSaving(false);
    }
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Exam Schedule",
      message: "Are you sure you want to delete this scheduled exam? This will remove it from the scheduling boards and list.",
      confirmText: "Delete Schedule",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'exam_schedules', scheduleId));
        } catch (error) {
          console.error("Failed to delete exam schedule:", error);
          handleFirestoreError(error, OperationType.DELETE, `exam_schedules/${scheduleId}`);
        }
      }
    });
  };

  const handleCopyExamRegistrationLink = (schedId: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const directLink = `${baseUrl}#belt-exam`;
    navigator.clipboard.writeText(directLink).then(() => {
      setCopiedSchedId(schedId);
      setTimeout(() => {
        setCopiedSchedId(null);
      }, 3000);
    }).catch(err => {
      console.error("Failed to copy registration link:", err);
    });
  };

  const handleDownloadExamsCSV = () => {
    const filteredExams = exams.filter(item => {
      const sQuery = examSearch.toLowerCase();
      const matchQuery = item.studentId.toLowerCase().includes(sQuery) || 
        item.studentName.toLowerCase().includes(sQuery) ||
        (item.parentName && item.parentName.toLowerCase().includes(sQuery)) ||
        (item.parentPhone && item.parentPhone.includes(sQuery));
      const matchStatus = examStatusFilter === 'all' || item.status === examStatusFilter;
      return matchQuery && matchStatus;
    });

    if (filteredExams.length === 0) {
      alert("No student registration records found to download.");
      return;
    }

    // Define CSV headers
    const headers = [
      "Student Roll ID",
      "Student Name",
      "School Name",
      "Branch/Center",
      "Parent Name",
      "Parent Phone",
      "Current Belt",
      "Target Belt",
      "Coach Assigned",
      "Exam Date",
      "Venue Details",
      "Fees Status",
      "Approval/Registry State",
      "Checked-In (Present)",
      "Check-In Time",
      "Grade/Kyu Rank",
      "Sensei Remarks & Message"
    ];

    // Map each item to CSV row format with live student details from admissions
    const rows = filteredExams.map(item => {
      const matchedStudent = admissions.find(adm => 
        (adm.studentId && item.studentId && adm.studentId.trim().toUpperCase() === item.studentId.trim().toUpperCase()) ||
        (adm.fullName && item.studentName && adm.fullName.trim().toLowerCase() === item.studentName.trim().toLowerCase())
      );

      const studentName = matchedStudent?.fullName || item.studentName || '';
      const schoolName = matchedStudent?.schoolName || item.schoolName || '';
      const parentName = matchedStudent?.parentName || item.parentName || '';
      const parentPhone = matchedStudent?.phone || item.parentPhone || '';
      const branch = matchedStudent?.branch || item.branch || '';
      const coachName = matchedStudent?.coachName || item.coachName || '';

      return [
        item.studentId || matchedStudent?.studentId || '',
        studentName,
        schoolName,
        branch,
        parentName,
        parentPhone,
        item.currentBelt ? item.currentBelt.split(' (')[0] : (matchedStudent?.beltLevel || ''),
        item.targetBelt ? item.targetBelt.split(' (')[0] : '',
        coachName,
        item.examDate || '',
        item.venueDetails || '',
        item.feesStatus || 'Pending',
        item.status || 'pending',
        item.checkedIn ? 'Yes' : 'No',
        item.checkInTime || '',
        item.grade || '',
        item.remarks ? item.remarks.replace(/"/g, '""') : ''
      ];
    });

    // Build CSV string with UTF-8 BOM to preserve any Hindi or special characters correctly in Excel
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Lions_Karate_Belt_Exam_Registrations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQRCheckIn = () => {
    const checkinUrl = `${window.location.origin}/#checkin`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkinUrl)}`;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Belt Exam Day QR Check-In - Lions Karate Club Pune</title>
            <style>
              body {
                background-color: white;
                color: #1c1917;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                text-align: center;
                padding: 40px;
              }
              .container {
                max-width: 500px;
                margin: 0 auto;
                border: 4px solid #FF3B3F;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.05);
              }
              .logo {
                font-size: 24px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: #1c1917;
                margin-bottom: 5px;
              }
              .subtitle {
                font-size: 14px;
                color: #FF3B3F;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 30px;
              }
              .qr-code {
                width: 250px;
                height: 250px;
                margin: 0 auto 30px;
                display: block;
              }
              .instruction {
                font-size: 18px;
                font-weight: 800;
                margin-bottom: 10px;
                text-transform: uppercase;
              }
              .sub-instruction {
                font-size: 13px;
                color: #666;
                line-height: 1.5;
              }
              .footer-branding {
                margin-top: 40px;
                font-size: 11px;
                color: #999;
                letter-spacing: 1px;
                text-transform: uppercase;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">Lions Karate Club Pune</div>
              <div class="subtitle">Belt Grading Examination</div>
              <img class="qr-code" src="${qrUrl}" alt="Check-In QR Code" />
              <div class="instruction">Parents: Scan to Check-In</div>
              <div class="sub-instruction">
                Scan this QR code with your phone camera to quickly find your child's name/ID and mark them present for today's belt exam.
              </div>
              <div class="footer-branding">Courage • Respect • Discipline</div>
            </div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const openCreateScheduleModal = () => {
    setEditingSched(null);
    setSchedDate('');
    setSchedBelt('All Belt Levels (Open Exam)');
    setSchedVenue('');
    setSchedPrereq('');
    setSchedError('');
    setSchedModalOpen(true);
  };

  const openEditScheduleModal = (sched: any) => {
    setEditingSched(sched);
    setSchedDate(sched.examDate);
    setSchedBelt(sched.beltLevel);
    setSchedVenue(sched.venueDetails);
    setSchedPrereq(sched.prerequisites);
    setSchedError('');
    setSchedModalOpen(true);
  };

  // Seeding initial batch models if clean empty db
  const seedDefaultBatches = async () => {
    if (batches.length > 0) return;
    try {
      setBatchesLoading(true);
      for (const batchItem of BATCH_TIMINGS) {
        await setDoc(doc(db, 'batches', batchItem.id), {
          name: batchItem.name,
          ageGroup: batchItem.ageGroup,
          timing: batchItem.timing,
          days: batchItem.days,
          focus: batchItem.focus,
          price: batchItem.price,
          coaches: "Sensei Maruti Jadhav, Sensei Shivraj Jejure"
        });
      }
    } catch (error) {
      console.error("Failed to seed batches: ", error);
      handleFirestoreError(error, OperationType.WRITE, 'batches');
    } finally {
      setBatchesLoading(false);
    }
  };

  const openCreateBatchModal = () => {
    setEditingBatch(null);
    setBName('');
    setBAgeGroup('');
    setBDays('');
    setBTiming('');
    setBFocus('');
    setBPrice('');
    setBCoaches('');
    setBatchFormError('');
    setBatchModalOpen(true);
  };

  const openEditBatchModal = (b: BatchInfo) => {
    setEditingBatch(b);
    setBName(b.name);
    setBAgeGroup(b.ageGroup || '');
    setBDays(b.days);
    setBTiming(b.timing);
    setBFocus(b.focus || '');
    setBPrice(b.price || '');
    setBCoaches(b.coaches || '');
    setBatchFormError('');
    setBatchModalOpen(true);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName || !bDays || !bTiming) {
      setBatchFormError('Name, Days, and Timings schedule can not be blank.');
      return;
    }

    setBatchFormSaving(true);
    setBatchFormError('');
    try {
      const batchData = {
        name: bName.trim(),
        ageGroup: bAgeGroup.trim(),
        days: bDays.trim(),
        timing: bTiming.trim(),
        focus: bFocus.trim(),
        price: bPrice.trim(),
        coaches: bCoaches.trim()
      };

      if (editingBatch) {
        const bDocRef = doc(db, 'batches', editingBatch.id);
        await updateDoc(bDocRef, batchData);
      } else {
        const bColRef = collection(db, 'batches');
        await addDoc(bColRef, batchData);
      }
      setBatchModalOpen(false);
    } catch (error: any) {
      console.error("Failed to save batch: ", error);
      setBatchFormError(error.message || 'Error occurred while saving training program.');
      handleFirestoreError(error, editingBatch ? OperationType.UPDATE : OperationType.CREATE, `batches/${editingBatch?.id || ''}`);
    } finally {
      setBatchFormSaving(false);
    }
  };

  const handleDeleteBatch = (batchId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Training Batch",
      message: "Are you sure you want to delete this training batch? Direct selection on enrollment will be removed.",
      confirmText: "Delete Batch",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'batches', batchId));
        } catch (error) {
          console.error("Failed to delete batch: ", error);
          handleFirestoreError(error, OperationType.DELETE, `batches/${batchId}`);
        }
      }
    });
  };

  // Perform operational status changes: Approve / Reject
  const updateAdmissionStatus = async (docId: string, nextStatus: 'approved' | 'rejected') => {
    try {
      const docRef = doc(db, 'admissions', docId);
      const updateData: any = {
        status: nextStatus,
        updatedAt: Date.now()
      };
      if (nextStatus === 'approved') {
        updateData.approvedAt = Date.now();
      } else {
        updateData.rejectedAt = Date.now();
      }
      await updateDoc(docRef, updateData);
      
      // Update local detailed states if looking at the active record
      if (selectedAdmission && selectedAdmission.id === docId) {
        setSelectedAdmission({
          ...selectedAdmission,
          status: nextStatus,
          ...updateData
        });
      }
    } catch (error) {
      console.error("Failed to update status", error);
      handleFirestoreError(error, OperationType.UPDATE, `admissions/${docId}`);
    }
  };

  // Save edited or assigned Student Roll ID from the detailed modal
  const handleSaveNewStudentId = async () => {
    if (!selectedAdmission) return;
    const trimmedId = newStudentIdVal.trim().toUpperCase();
    if (!trimmedId) {
      setIdEditError('ID cannot be empty');
      return;
    }
    
    setIdEditSaving(true);
    setIdEditError('');
    setIdEditSuccess('');
    
    try {
      const oldId = selectedAdmission.studentId;
      
      // 1. Check if the new ID already exists for another student in admissions
      if (trimmedId !== oldId) {
        const checkQ = query(collection(db, 'admissions'), where('studentId', '==', trimmedId));
        const checkSnap = await getDocs(checkQ);
        // Ensure no other document has this studentId
        const conflicts = checkSnap.docs.filter(doc => doc.id !== selectedAdmission.id);
        if (conflicts.length > 0) {
          setIdEditError(`The Student ID '${trimmedId}' is already assigned to another student.`);
          setIdEditSaving(false);
          return;
        }
      }
      
      // 2. Update the student document in 'admissions'
      const studentDocRef = doc(db, 'admissions', selectedAdmission.id);
      await updateDoc(studentDocRef, {
        studentId: trimmedId,
        updatedAt: Date.now()
      });
      
      // 3. Update any exam registrations in 'exams' where studentId was oldId and studentName matches this student's name
      const examsQ = query(collection(db, 'exams'), where('studentId', '==', oldId));
      const examsSnap = await getDocs(examsQ);
      const updatePromises: Promise<void>[] = [];
      const studentNameLower = selectedAdmission.fullName.trim().toLowerCase();
      examsSnap.forEach((examDoc) => {
        const examData = examDoc.data();
        const examNameLower = (examData.studentName || '').trim().toLowerCase();
        if (examNameLower === studentNameLower) {
          updatePromises.push(
            updateDoc(doc(db, 'exams', examDoc.id), {
              studentId: trimmedId,
              updatedAt: Date.now()
            })
          );
        }
      });
      await Promise.all(updatePromises);
      
      // Update state
      setSelectedAdmission({
        ...selectedAdmission,
        studentId: trimmedId
      });
      
      // Also update the local admissions array
      setAdmissions(prev => prev.map(item => item.id === selectedAdmission.id ? { ...item, studentId: trimmedId } : item));

      // Also update local exams array state so it reflects instantly across other tabs in the Admin Panel
      setExams(prev => prev.map(exam => {
        const examNameLower = (exam.studentName || '').trim().toLowerCase();
        const examStudentId = (exam.studentId || '').trim().toUpperCase();
        if (examStudentId === (oldId || '').trim().toUpperCase() && examNameLower === studentNameLower) {
          return {
            ...exam,
            studentId: trimmedId
          };
        }
        return exam;
      }));
      
      setIdEditSuccess('Student Roll ID successfully updated across admissions and exams!');
      setTimeout(() => {
        setIsEditingId(false);
        setIdEditSuccess('');
      }, 2000);
    } catch (err: any) {
      console.error("Failed to update student ID:", err);
      setIdEditError(err.message || 'An unexpected error occurred.');
    } finally {
      setIdEditSaving(false);
    }
  };

  // Handle branch change inside profile editing to set coach dynamically
  const handleBranchChange = (branchName: string) => {
    setEditBranch(branchName);
    const branchObj = DOJO_BRANCHES.find(b => b.name === branchName);
    if (branchObj) {
      setEditCoachName(branchObj.coach);
    }
  };

  // Start editing student profile
  const handleStartEditProfile = () => {
    if (!selectedAdmission) return;
    setEditFullName(selectedAdmission.fullName || '');
    setEditPhotoUrl(selectedAdmission.photoUrl || '');
    setEditDragOver(false);
    setEditDob(selectedAdmission.dob || '');
    setEditAge(selectedAdmission.age || '');
    setEditGender(selectedAdmission.gender || 'male');
    setEditParentName(selectedAdmission.parentName || '');
    setEditPhone(selectedAdmission.phone || '');
    setEditWhatsApp(selectedAdmission.whatsApp || '');
    setEditEmail(selectedAdmission.email || '');
    setEditBranch(selectedAdmission.branch || 'Manaji Nagar Branch');
    setEditCoachName(selectedAdmission.coachName || '');
    setEditBatch(selectedAdmission.batch || '');
    setEditBeltLevel(selectedAdmission.beltLevel || 'White Belt');
    setEditSchoolName(selectedAdmission.schoolName || '');
    setEditAddress(selectedAdmission.address || '');
    setEditFeesStatus(selectedAdmission.feesStatus || 'Unpaid');
    setEditProfileError('');
    setIsEditingProfile(true);
  };

  // Save updated student profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;

    if (!editFullName.trim()) {
      setEditProfileError('Full Name is required');
      return;
    }
    if (!editPhone.trim()) {
      setEditProfileError('Phone Number is required');
      return;
    }

    setEditProfileSaving(true);
    setEditProfileError('');

    try {
      const docRef = doc(db, 'admissions', selectedAdmission.id);
      const updateData: Partial<Admission> = {
        fullName: editFullName.trim(),
        photoUrl: editPhotoUrl || selectedAdmission.photoUrl || DEFAULT_STUDENT_AVATAR,
        dob: editDob,
        age: Number(editAge) || 10,
        gender: editGender,
        parentName: editParentName.trim(),
        phone: editPhone.trim(),
        whatsApp: editWhatsApp.trim() || editPhone.trim(),
        email: editEmail.trim(),
        branch: editBranch,
        coachName: editCoachName,
        batch: editBatch,
        beltLevel: editBeltLevel,
        schoolName: editSchoolName.trim(),
        address: editAddress.trim(),
        feesStatus: editFeesStatus as 'Paid' | 'Unpaid',
        updatedAt: Date.now()
      };

      await updateDoc(docRef, updateData);

      // Cascade these profile updates to matching exam registrations in 'exams' collection
      try {
        const examsQ = query(collection(db, 'exams'));
        const examsSnap = await getDocs(examsQ);
        const examUpdatePromises: Promise<void>[] = [];
        
        const oldIdUpper = (selectedAdmission.studentId || '').trim().toUpperCase();
        const oldNameLower = (selectedAdmission.fullName || '').trim().toLowerCase();
        
        const examUpdatesMap: { [examId: string]: any } = {};

        examsSnap.forEach((examDoc) => {
          const examData = examDoc.data();
          const examStudentId = (examData.studentId || '').trim().toUpperCase();
          const examStudentName = (examData.studentName || '').trim().toLowerCase();

          const matchesId = oldIdUpper && examStudentId === oldIdUpper;
          const matchesName = oldNameLower && examStudentName === oldNameLower;

          if (matchesId || matchesName) {
            const examUpdate = {
              studentName: editFullName.trim(),
              parentName: editParentName.trim(),
              parentPhone: editPhone.trim(),
              branch: editBranch,
              coachName: editCoachName,
              currentBelt: editBeltLevel,
              schoolName: editSchoolName.trim(),
              updatedAt: Date.now()
            };
            examUpdatesMap[examDoc.id] = examUpdate;
            examUpdatePromises.push(
              updateDoc(doc(db, 'exams', examDoc.id), examUpdate)
            );
          }
        });

        if (examUpdatePromises.length > 0) {
          await Promise.all(examUpdatePromises);
          // Update local exams array state so it reflects instantly across other tabs in the Admin Panel
          setExams(prev => prev.map(exam => {
            if (examUpdatesMap[exam.id]) {
              return {
                ...exam,
                ...examUpdatesMap[exam.id]
              };
            }
            return exam;
          }));
        }
      } catch (cascadeErr) {
        console.error("Cascade update to exam registrations failed:", cascadeErr);
      }

      // Update local state to immediately show updated values
      const updatedAdmission = {
        ...selectedAdmission,
        ...updateData
      };
      setSelectedAdmission(updatedAdmission);
      
      // Also update the local admissions array
      setAdmissions(prev => prev.map(item => item.id === selectedAdmission.id ? { ...item, ...updateData } : item));
      
      setIsEditingProfile(false);
    } catch (err: any) {
      console.error("Failed to update student profile:", err);
      setEditProfileError(err.message || 'Failed to update student details. Please try again.');
    } finally {
      setEditProfileSaving(false);
    }
  };

  // Centralized diagnostic repair handler for resolving duplicate IDs
  const handleSaveDiagStudentId = async (student: Admission, newId: string) => {
    const trimmedId = newId.trim().toUpperCase();
    if (!trimmedId) {
      setDiagErrors(prev => ({ ...prev, [student.id]: 'ID cannot be empty' }));
      return;
    }
    
    setDiagSaving(prev => ({ ...prev, [student.id]: true }));
    setDiagErrors(prev => ({ ...prev, [student.id]: '' }));
    setDiagSuccesses(prev => ({ ...prev, [student.id]: '' }));
    
    try {
      const oldId = student.studentId;
      
      // 1. Check if the new ID already exists for another student in admissions (excluding this student's document itself)
      if (trimmedId !== oldId) {
        const checkQ = query(collection(db, 'admissions'), where('studentId', '==', trimmedId));
        const checkSnap = await getDocs(checkQ);
        // Ensure no other document has this studentId
        const conflicts = checkSnap.docs.filter(doc => doc.id !== student.id);
        if (conflicts.length > 0) {
          setDiagErrors(prev => ({ ...prev, [student.id]: `The Student ID '${trimmedId}' is already assigned to another student.` }));
          setDiagSaving(prev => ({ ...prev, [student.id]: false }));
          return;
        }
      }
      
      // 2. Update the student document in 'admissions'
      const studentDocRef = doc(db, 'admissions', student.id);
      await updateDoc(studentDocRef, {
        studentId: trimmedId,
        updatedAt: Date.now()
      });
      
      // 3. Update any exam registrations in 'exams' where studentId was oldId and studentName matches this student's name
      const examsQ = query(collection(db, 'exams'), where('studentId', '==', oldId));
      const examsSnap = await getDocs(examsQ);
      const updatePromises: Promise<void>[] = [];
      const studentNameLower = student.fullName.trim().toLowerCase();
      examsSnap.forEach((examDoc) => {
        const examData = examDoc.data();
        const examNameLower = (examData.studentName || '').trim().toLowerCase();
        if (examNameLower === studentNameLower) {
          updatePromises.push(
            updateDoc(doc(db, 'exams', examDoc.id), {
              studentId: trimmedId,
              updatedAt: Date.now()
            })
          );
        }
      });
      await Promise.all(updatePromises);
      
      setDiagSuccesses(prev => ({ ...prev, [student.id]: 'Updated successfully!' }));
      
      // Dynamically update the student's ID inside local admissions array state as well
      setAdmissions(prev => prev.map(item => item.id === student.id ? { ...item, studentId: trimmedId } : item));

      // Also update local exams array state so it reflects instantly across other tabs in the Admin Panel
      setExams(prev => prev.map(exam => {
        const examNameLower = (exam.studentName || '').trim().toLowerCase();
        const examStudentId = (exam.studentId || '').trim().toUpperCase();
        if (examStudentId === (oldId || '').trim().toUpperCase() && examNameLower === studentNameLower) {
          return {
            ...exam,
            studentId: trimmedId
          };
        }
        return exam;
      }));

      setTimeout(() => {
        setDiagSuccesses(prev => ({ ...prev, [student.id]: '' }));
      }, 3000);
    } catch (err: any) {
      console.error("Failed to update student ID in diagnosis:", err);
      setDiagErrors(prev => ({ ...prev, [student.id]: err.message || 'Error occurred.' }));
    } finally {
      setDiagSaving(prev => ({ ...prev, [student.id]: false }));
    }
  };

  // Diagnostic states for exam sync & profile generation
  const [syncSaving, setSyncSaving] = useState<{ [key: string]: boolean }>({});
  const [syncErrors, setSyncErrors] = useState<{ [key: string]: string }>({});
  const [syncSuccesses, setSyncSuccesses] = useState<{ [key: string]: string }>({});

  const handleSyncExamId = async (examId: string, admissionId: string, targetId: string, direction: 'exam-to-profile' | 'profile-to-exam') => {
    const key = `${examId}_${admissionId}_${direction}`;
    setSyncSaving(prev => ({ ...prev, [key]: true }));
    setSyncErrors(prev => ({ ...prev, [key]: '' }));
    setSyncSuccesses(prev => ({ ...prev, [key]: '' }));

    try {
      if (direction === 'exam-to-profile') {
        // Update exam's studentId to match the profile's studentId (targetId)
        await updateDoc(doc(db, 'exams', examId), {
          studentId: targetId,
          updatedAt: Date.now()
        });
        
        // Update local exams array state if loaded
        setExams(prev => prev.map(item => item.id === examId ? { ...item, studentId: targetId } : item));
        
        setSyncSuccesses(prev => ({ ...prev, [key]: 'Exam ID updated to match profile!' }));
      } else {
        // Update profile's studentId to match the exam's studentId (targetId)
        // First, check if the targetId is already taken by some other student in admissions
        const checkQ = query(collection(db, 'admissions'), where('studentId', '==', targetId));
        const checkSnap = await getDocs(checkQ);
        const conflicts = checkSnap.docs.filter(doc => doc.id !== admissionId);
        if (conflicts.length > 0) {
          setSyncErrors(prev => ({ ...prev, [key]: `ID '${targetId}' is already assigned to another student.` }));
          setSyncSaving(prev => ({ ...prev, [key]: false }));
          return;
        }

        await updateDoc(doc(db, 'admissions', admissionId), {
          studentId: targetId,
          updatedAt: Date.now()
        });
        
        // Also cascade to other exams if any
        setAdmissions(prev => prev.map(item => item.id === admissionId ? { ...item, studentId: targetId } : item));
        
        setSyncSuccesses(prev => ({ ...prev, [key]: 'Profile ID updated to match Exam ID!' }));
      }
      setTimeout(() => {
        setSyncSuccesses(prev => ({ ...prev, [key]: '' }));
      }, 3000);
    } catch (err: any) {
      console.error("Failed to sync ID:", err);
      setSyncErrors(prev => ({ ...prev, [key]: err.message || 'Error occurred.' }));
    } finally {
      setSyncSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleCreateProfileFromExam = async (exam: any) => {
    const key = `create_profile_${exam.id}`;
    setSyncSaving(prev => ({ ...prev, [key]: true }));
    setSyncErrors(prev => ({ ...prev, [key]: '' }));
    setSyncSuccesses(prev => ({ ...prev, [key]: '' }));

    try {
      // Intelligently check if we can generate a new ID or use the exam's ID (since it's already generated)
      const studentId = exam.studentId || await generateSequentialStudentId();
      
      const admissionPayload = {
        studentId: studentId,
        fullName: exam.studentName,
        dob: '',
        gender: 'other',
        parentName: exam.parentName || '',
        phone: exam.parentPhone || '',
        whatsApp: exam.parentPhone || '',
        email: '',
        address: '',
        batch: 'School Student Batch',
        beltLevel: exam.currentBelt || 'White Belt (10th Kyu - Beginner)',
        photoUrl: 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\' fill=\'%23111\'><rect width=\'100\' height=\'100\' fill=\'%231a1a1a\'/><circle cx=\'50\' cy=\'35\' r=\'14\' fill=\'%23c9a96e\'/><path d=\'M50 50 L35 75 L30 73 L42 53 L38 50 L30 55 L28 50 L40 42 Z\' fill=\'%23fff\'/><path d=\'M50 50 L65 80 L72 82 L58 55 L65 48 L75 52 L78 47 L60 40 Z\' fill=\'%23fff\'/><path d=\'M42 45 H58 V49 H42 Z\' fill=\'%239B1B20\'/></svg>',
        termsAccepted: true,
        status: 'approved',
        createdAt: Date.now(),
        approvedAt: Date.now(),
        isDirectExamRegistration: true,
        branch: exam.branch || 'Manaji Nagar Branch',
        schoolName: exam.schoolName || ''
      };

      await addDoc(collection(db, 'admissions'), admissionPayload);
      setSyncSuccesses(prev => ({ ...prev, [key]: `Profile successfully created and linked with Roll ID: ${studentId}!` }));
      
      setTimeout(() => {
        setSyncSuccesses(prev => ({ ...prev, [key]: '' }));
      }, 3000);
    } catch (err: any) {
      console.error("Failed to create profile:", err);
      setSyncErrors(prev => ({ ...prev, [key]: err.message || 'Error occurred.' }));
    } finally {
      setSyncSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const renderDiagnosticContent = (isModal: boolean = false) => {
    const { duplicateGroups, examMismatches, orphanedExams } = getDuplicateIdGroups();
    const duplicateKeys = Object.keys(duplicateGroups);
    
    const totalIssues = duplicateKeys.length + examMismatches.length + orphanedExams.length;

    if (totalIssues === 0) {
      return (
        <div className="bg-slate-900/40 border border-emerald-950/30 py-16 text-center text-emerald-400 text-sm font-semibold flex flex-col items-center justify-center gap-4 rounded-2xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          <div className="space-y-1">
            <h4 className="text-white font-heading font-black text-sm uppercase tracking-wider">System is Healthy & Synchronized!</h4>
            <p className="text-zinc-500 text-xs font-sans">No student ID conflicts, exam mismatches, or orphaned records were detected in the database.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Category 1: Profile ID Conflicts in Admissions */}
        {duplicateKeys.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-red-500/20 pb-2">
              <span className="bg-red-500 text-slate-950 text-[10px] font-heading font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                Group {duplicateKeys.length}
              </span>
              <h4 className="font-heading font-black text-xs text-red-500 uppercase tracking-widest">Conflicting Profile IDs (Admissions)</h4>
            </div>
            
            <div className="space-y-4">
              {duplicateKeys.map((sharedId) => {
                const students = duplicateGroups[sharedId];
                return (
                  <div key={sharedId} className="border border-zinc-900 bg-slate-900/20 rounded-2xl overflow-hidden shadow-md">
                    <div className="bg-red-500/5 px-6 py-3 border-b border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-red-400">
                          SHARED ID: <span className="bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30 text-white font-bold">{sharedId}</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-550">
                        {students.length} Student Profiles Affected
                      </span>
                    </div>

                    <div className="divide-y divide-zinc-900/40 p-5 space-y-4">
                      {students.map((student) => {
                        const inputVal = diagIdInputs[student.id] || student.studentId;
                        const isSaving = diagSaving[student.id] || false;
                        const errorMsg = diagErrors[student.id] || '';
                        const successMsg = diagSuccesses[student.id] || '';

                        return (
                          <div key={student.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 first:pt-0 text-left">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-900 shrink-0">
                                <img src={student.photoUrl || DEFAULT_STUDENT_AVATAR} alt="Portrait" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="font-heading font-black text-zinc-200 text-sm tracking-wide">{student.fullName}</div>
                                <div className="text-[10px] text-zinc-500 font-mono mt-0.5 space-x-1.5">
                                  <span>Branch: <strong className="text-zinc-400 font-semibold">{student.branch || 'Manaji Nagar Branch'}</strong></span>
                                  <span>•</span>
                                  <span>Batch: <strong className="text-zinc-400 font-semibold">{student.batch}</strong></span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <input 
                                type="text"
                                value={inputVal}
                                onChange={(e) => {
                                  const v = e.target.value.toUpperCase();
                                  setDiagIdInputs(prev => ({ ...prev, [student.id]: v }));
                                }}
                                placeholder="e.g. LKCP-2026-101"
                                className="bg-slate-950 border border-zinc-900 text-white rounded-lg px-3 py-2 text-xs font-mono w-full sm:w-44 focus:outline-none focus:border-red-500 transition-colors"
                              />

                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    setDiagIdInputs(prev => ({ ...prev, [student.id]: 'Generating...' }));
                                    const nextId = await generateSequentialStudentId();
                                    setDiagIdInputs(prev => ({ ...prev, [student.id]: nextId }));
                                  } catch (err) {
                                    console.error("Failed to generate unique id for diagnostic", err);
                                    setDiagIdInputs(prev => ({ ...prev, [student.id]: student.studentId }));
                                  }
                                }}
                                className="bg-zinc-900 hover:bg-zinc-850 text-yellow-500 text-[10px] font-heading font-black uppercase tracking-wider px-3 py-2 rounded-lg border border-zinc-850 cursor-pointer transition-all active:scale-95"
                              >
                                Generate Unique ID
                              </button>

                              <button
                                type="button"
                                disabled={isSaving || inputVal === student.studentId}
                                onClick={() => handleSaveDiagStudentId(student, inputVal)}
                                className={`text-[10px] uppercase tracking-widest font-heading font-black px-4 py-2 rounded-lg flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
                                  inputVal === student.studentId
                                    ? 'bg-zinc-900 text-zinc-600 border border-zinc-900 cursor-not-allowed'
                                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                                }`}
                              >
                                {isSaving ? 'Saving...' : 'Save & Sync'}
                              </button>
                            </div>

                            {(errorMsg || successMsg) && (
                              <div className="w-full text-right text-[11px]">
                                {errorMsg && <span className="text-red-500 font-semibold font-sans">{errorMsg}</span>}
                                {successMsg && <span className="text-emerald-500 font-bold font-sans">{successMsg}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category 2: Exam & Profile ID Mismatches */}
        {examMismatches.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-yellow-500/20 pb-2">
              <span className="bg-yellow-500 text-slate-950 text-[10px] font-heading font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                Mismatches {examMismatches.length}
              </span>
              <h4 className="font-heading font-black text-xs text-yellow-500 uppercase tracking-widest">Exam & Profile ID Mismatches</h4>
            </div>

            <div className="space-y-4">
              {examMismatches.map(({ exam, admission }) => {
                const keyExamToProfile = `${exam.id}_${admission.id}_exam-to-profile`;
                const keyProfileToExam = `${exam.id}_${admission.id}_profile-to-exam`;

                const savingE2P = syncSaving[keyExamToProfile] || false;
                const savingP2E = syncSaving[keyProfileToExam] || false;

                const errorE2P = syncErrors[keyExamToProfile] || '';
                const errorP2E = syncErrors[keyProfileToExam] || '';

                const successE2P = syncSuccesses[keyExamToProfile] || '';
                const successP2E = syncSuccesses[keyProfileToExam] || '';

                return (
                  <div key={`${exam.id}_${admission.id}`} className="border border-zinc-900 bg-slate-900/20 rounded-2xl p-5 text-left space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-900 shrink-0">
                          <img src={admission.photoUrl || DEFAULT_STUDENT_AVATAR} alt="Portrait" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-heading font-black text-zinc-100 text-sm tracking-wide">{admission.fullName}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            Branch: {admission.branch} | Parent Name: {admission.parentName}
                          </div>
                        </div>
                      </div>
                      <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[9px] font-heading font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                        ID Mismatch
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950 p-4 border border-zinc-900 rounded-xl">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Admission Profile ID:</span>
                        <div className="font-mono text-sm font-black text-emerald-400 flex items-center gap-1.5">
                          <span>{admission.studentId}</span>
                          <span className="text-[9px] font-sans font-normal text-zinc-500">(Source of Truth)</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Exam Registration ID:</span>
                        <div className="font-mono text-sm font-black text-red-400 flex items-center gap-1.5">
                          <span>{exam.studentId}</span>
                          <span className="text-[9px] font-sans font-normal text-zinc-500">(Mismatched Candidate ID)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-2">
                      {/* Sync Option A */}
                      <div className="flex flex-col items-stretch sm:items-end gap-1">
                        <button
                          type="button"
                          disabled={savingE2P || savingP2E}
                          onClick={() => handleSyncExamId(exam.id, admission.id, admission.studentId, 'exam-to-profile')}
                          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-heading font-black text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          {savingE2P ? 'Syncing...' : `Set Exam ID to match Profile (${admission.studentId})`}
                        </button>
                        {errorE2P && <span className="text-red-500 text-[10px] font-medium font-sans mt-0.5">{errorE2P}</span>}
                        {successE2P && <span className="text-emerald-400 text-[10px] font-bold font-sans mt-0.5">{successE2P}</span>}
                      </div>

                      {/* Sync Option B */}
                      <div className="flex flex-col items-stretch sm:items-end gap-1">
                        <button
                          type="button"
                          disabled={savingE2P || savingP2E}
                          onClick={() => handleSyncExamId(exam.id, admission.id, exam.studentId, 'profile-to-exam')}
                          className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-heading font-black text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          {savingP2E ? 'Syncing...' : `Set Profile ID to match Exam (${exam.studentId})`}
                        </button>
                        {errorP2E && <span className="text-red-500 text-[10px] font-medium font-sans mt-0.5">{errorP2E}</span>}
                        {successP2E && <span className="text-emerald-400 text-[10px] font-bold font-sans mt-0.5">{successP2E}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category 3: Orphaned Exam Registrations */}
        {orphanedExams.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-orange-500/20 pb-2">
              <span className="bg-orange-500 text-slate-950 text-[10px] font-heading font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                Orphans {orphanedExams.length}
              </span>
              <h4 className="font-heading font-black text-xs text-orange-500 uppercase tracking-widest">Orphaned Exam Candidates</h4>
            </div>

            <p className="text-zinc-500 text-xs text-left leading-relaxed font-sans">
              These candidate exam records have a Karate Roll ID that **does not exist** in the admissions directory. 
              Usually, this occurs when direct exam registration fails to store the main profile doc or when the profile is deleted.
            </p>

            <div className="space-y-4">
              {orphanedExams.map((exam) => {
                const key = `create_profile_${exam.id}`;
                const isSaving = syncSaving[key] || false;
                const errorMsg = syncErrors[key] || '';
                const successMsg = syncSuccesses[key] || '';

                return (
                  <div key={exam.id} className="border border-zinc-900 bg-slate-900/20 rounded-2xl p-5 text-left space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-900 shrink-0 flex items-center justify-center">
                          <Award className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <div className="font-heading font-black text-zinc-100 text-sm tracking-wide">{exam.studentName}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            Exam Target Belt: <strong className="text-yellow-500 font-semibold">{exam.targetBelt}</strong> | Phone: {exam.parentPhone || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] font-heading font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                        Orphaned Candidate
                      </span>
                    </div>

                    <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Unresolved Candidate ID:</span>
                        <div className="font-mono text-sm font-black text-orange-400">{exam.studentId || 'N/A'}</div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleCreateProfileFromExam(exam)}
                          className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 disabled:opacity-50 font-heading font-black text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                        >
                          {isSaving ? 'Creating...' : 'Auto-Create Student Profile'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteExamRecord(exam.id)}
                          className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-slate-950 font-heading font-black text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-lg border border-red-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                        >
                          Delete Exam Record
                        </button>
                      </div>

                      {(errorMsg || successMsg) && (
                        <div className="w-full text-right text-[10px] mt-1">
                          {errorMsg && <span className="text-red-500 font-medium font-sans">{errorMsg}</span>}
                          {successMsg && <span className="text-emerald-400 font-bold font-sans">{successMsg}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Save edited or assigned Candidate ID from the candidate table
  const handleSaveCandidateId = async (candidate: any) => {
    const trimmedId = editingCandidateNewId.trim().toUpperCase();
    if (!trimmedId) return;
    
    try {
      const oldId = candidate.studentId;
      const candidateNameLower = (candidate.studentName || '').trim().toLowerCase();
      
      // 1. Update the exam registration in 'exams'
      await updateDoc(doc(db, 'exams', candidate.id), {
        studentId: trimmedId,
        updatedAt: Date.now()
      });
      
      // 2. Also find and update any other exam registrations for this SAME student (by name) to keep them synced
      const otherExamsQ = query(collection(db, 'exams'), where('studentName', '==', candidate.studentName));
      const otherExamsSnap = await getDocs(otherExamsQ);
      const examPromises: Promise<void>[] = [];
      otherExamsSnap.forEach((examDoc) => {
        if (examDoc.id !== candidate.id) {
          examPromises.push(
            updateDoc(doc(db, 'exams', examDoc.id), {
              studentId: trimmedId,
              updatedAt: Date.now()
            })
          );
        }
      });
      await Promise.all(examPromises);
      
      // 3. Find the matching record in the 'admissions' state array (which contains all records)
      // First try: exact ID and case-insensitive name match
      let matchedStudent = admissions.find(student => 
        (student.studentId || '').trim().toUpperCase() === oldId.toUpperCase() &&
        (student.fullName || '').trim().toLowerCase() === candidateNameLower
      );
      
      // Second try: fallback to case-insensitive name match only
      if (!matchedStudent) {
        matchedStudent = admissions.find(student => 
          (student.fullName || '').trim().toLowerCase() === candidateNameLower
        );
      }
      
      if (matchedStudent) {
        // Update the unique matching student document in 'admissions'
        await updateDoc(doc(db, 'admissions', matchedStudent.id), {
          studentId: trimmedId,
          updatedAt: Date.now()
        });
        console.log(`Successfully updated student '${matchedStudent.fullName}' ID to '${trimmedId}'`);
      } else {
        // Fallback: if not found in state array (unexpected), search Firestore with queries
        console.log("Student not found in memory state, performing Firestore queries...");
        const admissionsQ = query(collection(db, 'admissions'), where('studentId', '==', oldId));
        const admissionsSnap = await getDocs(admissionsQ);
        const fallbackPromises: Promise<void>[] = [];
        
        let updatedByName = false;
        // Try searching by name exactly if we can't find by ID
        const admissionsNameQ = query(collection(db, 'admissions'), where('fullName', '==', candidate.studentName));
        const admissionsNameSnap = await getDocs(admissionsNameQ);
        
        admissionsNameSnap.forEach((admDoc) => {
          fallbackPromises.push(
            updateDoc(doc(db, 'admissions', admDoc.id), {
              studentId: trimmedId,
              updatedAt: Date.now()
            })
          );
          updatedByName = true;
        });
        
        // Only if we couldn't match by name at all, update matching IDs (to be safe)
        if (!updatedByName) {
          admissionsSnap.forEach((admDoc) => {
            fallbackPromises.push(
              updateDoc(doc(db, 'admissions', admDoc.id), {
                studentId: trimmedId,
                updatedAt: Date.now()
              })
            );
          });
        }
        await Promise.all(fallbackPromises);
      }
      
      setEditingCandidateId(null);
    } catch (err) {
      console.error("Failed to update candidate ID:", err);
    }
  };

  // Update Fees Payment state dynamically
  const updateFeesStatus = async (studentId: string, nextStatus: 'Paid' | 'Unpaid') => {
    try {
      const docRef = doc(db, 'admissions', studentId);
      await updateDoc(docRef, {
        feesStatus: nextStatus,
        updatedAt: Date.now()
      });
      
      // Sync detailed viewer active state copy
      if (selectedAdmission && selectedAdmission.id === studentId) {
        setSelectedAdmission({
          ...selectedAdmission,
          feesStatus: nextStatus
        });
      }
    } catch (error) {
      console.error("Failed to toggle fees status status", error);
      handleFirestoreError(error, OperationType.UPDATE, `admissions/${studentId}`);
    }
  };

  // Perform destructive entry removal
  const deleteAdmissionRecord = (docId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Erase Student Admission File",
      message: "Are you absolutely sure you want to permanently erase this student's admission files? This action is irreversible. All related exam records for this student will also be deleted.",
      confirmText: "Erase Entry",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          // Find the student profile in memory before deleting to get identifiers
          const student = admissions.find(a => a.id === docId);

          // Delete the student admission record
          await deleteDoc(doc(db, 'admissions', docId));
          setSelectedAdmission(null);
          setViewingIDCard(null);

          // Cascade delete related exam records matching studentId or fullName
          if (student) {
            const studentIdToMatch = (student.studentId || '').trim().toUpperCase();
            const fullNameToMatch = (student.fullName || '').trim().toLowerCase();

            const relatedExams = exams.filter(exam => {
              const examId = (exam.studentId || '').trim().toUpperCase();
              const examName = (exam.studentName || '').trim().toLowerCase();
              
              const matchesId = studentIdToMatch && examId === studentIdToMatch;
              const matchesName = fullNameToMatch && examName === fullNameToMatch;
              
              return matchesId || matchesName;
            });

            for (const relatedExam of relatedExams) {
              try {
                await deleteDoc(doc(db, 'exams', relatedExam.id));
              } catch (err) {
                console.error(`Failed to cascade delete exam record ${relatedExam.id}:`, err);
              }
            }
          }
        } catch (error) {
          console.error("Failed to delete record: ", error);
          handleFirestoreError(error, OperationType.DELETE, `admissions/${docId}`);
        }
      }
    });
  };

  // Calculate high-fidelity stats aggregates
  const stats = {
    total: admissions.length,
    pending: admissions.filter(a => a.status === 'pending').length,
    approved: admissions.filter(a => a.status === 'approved').length,
    rejected: admissions.filter(a => a.status === 'rejected').length,
    // Managed batches stats count
    totalBatches: batches.length || 4,
  };

  // Perform search criteria match filters
  const filteredAdmissions = admissions.filter((student) => {
    // 1. Search Query
    const searchLower = searchQuery.toLowerCase().trim();
    const nameMatch = student.fullName?.toLowerCase().includes(searchLower) || false;
    const parentMatch = student.parentName?.toLowerCase().includes(searchLower) || false;
    const phoneMatch = student.phone?.includes(searchLower) || student.whatsApp?.includes(searchLower) || false;
    const idMatch = student.studentId?.toLowerCase().includes(searchLower) || false;
    const beltMatch = student.beltLevel?.toLowerCase().includes(searchLower) || false;
    const matchesSearch = !searchLower || nameMatch || parentMatch || phoneMatch || idMatch || beltMatch;

    // 2. Status Match
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'direct_exam' 
        ? student.isDirectExamRegistration === true 
        : student.status === statusFilter;

    // 3. Batch Match
    const matchesBatch = batchFilter === 'all' || student.batch === batchFilter;

    // 4. Branch Match (graceful fallback for existing documents without a set branch)
    const matchesBranch = branchFilter === 'all' || (student.branch || 'Manaji Nagar Branch').toLowerCase().trim() === branchFilter.toLowerCase().trim();

    // 5. Fees Match (graceful fallback for existing documents without state)
    const matchesFees = feesFilter === 'all' || (student.feesStatus || 'Unpaid') === feesFilter;

    return matchesSearch && matchesStatus && matchesBatch && matchesBranch && matchesFees;
  });

  // Helper to check if a DOB string is in the current month
  const isBirthdayThisMonth = (dobString?: string) => {
    if (!dobString) return false;
    const currentMonthNum = new Date().getMonth(); // 0-indexed, 6 is July
    
    // Check YYYY-MM-DD format
    const dobParts = dobString.split('-');
    if (dobParts.length === 3) {
      const birthMonth = parseInt(dobParts[1], 10) - 1; // 0-indexed
      return birthMonth === currentMonthNum;
    }
    
    // Check MM/DD/YYYY format or others
    const dateObj = new Date(dobString);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.getMonth() === currentMonthNum;
    }
    return false;
  };

  // Helper to get all students with birthdays this month
  const getBirthdayStudents = () => {
    const currentYear = new Date().getFullYear();
    return admissions.filter(student => 
      student.status === 'approved' && 
      isBirthdayThisMonth(student.dob) &&
      student.lastCelebratedYear !== currentYear
    );
  };

  // Helper to mark birthday as celebrated for the current year
  const markBirthdayAsCelebrated = async (admissionId: string) => {
    const currentYear = new Date().getFullYear();
    try {
      await updateDoc(doc(db, 'admissions', admissionId), {
        lastCelebratedYear: currentYear,
        updatedAt: Date.now()
      });
      // Update local memory state
      setAdmissions(prev => prev.map(item => item.id === admissionId ? { ...item, lastCelebratedYear: currentYear } : item));
    } catch (error) {
      console.error("Failed to mark birthday as celebrated: ", error);
    }
  };

  // Helper to format birthday nicely (e.g. "July 12")
  const formatBirthdayDay = (dobString?: string) => {
    if (!dobString) return '';
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const dobParts = dobString.split('-');
    if (dobParts.length === 3) {
      const monthIndex = parseInt(dobParts[1], 10) - 1;
      const day = parseInt(dobParts[2], 10);
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${months[monthIndex]} ${day}`;
      }
    }
    const dateObj = new Date(dobString);
    if (!isNaN(dateObj.getTime())) {
      const monthIndex = dateObj.getMonth();
      const day = dateObj.getDate();
      return `${months[monthIndex]} ${day}`;
    }
    return dobString;
  };

  // Function to send customized WhatsApp birthday greeting from Chief Instructor
  const sendWhatsAppBirthdayGreeting = (student: Admission) => {
    const currentYear = new Date().getFullYear();
    const birthYear = student.dob ? parseInt(student.dob.split('-')[0], 10) : 0;
    const turningAge = birthYear ? (currentYear - birthYear) : student.age;
    
    const greetingText = `Greetings from Lions Karate Club Pune! 🥋✨\n\n` +
      `Dear *${student.fullName}*,\n\n` +
      `Wishing you a very Happy Birthday! 🎂🎉\n` +
      `May this year bring you strong spirit, focus, discipline, and excellent health. Keep training hard and shining on the tatami mat! 💪🔥\n\n` +
      `Best wishes & blessings,\n` +
      `*Chief Instructor Maruti Jadhav* 🥋\n` +
      `*LIONS KARATE CLUB PUNE*`;

    const phone = student.whatsApp || student.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Format standard Indian phone numbers with country code 91 if it's 10 digits
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(greetingText)}`;
    window.open(url, '_blank');
  };

  // Real-time grouping of duplicated student IDs and system mismatches for diagnosis and automated correction
  const getDuplicateIdGroups = () => {
    // 1. Admissions collection duplicates
    const groups: { [id: string]: Admission[] } = {};
    admissions.forEach(student => {
      const sId = (student.studentId || '').trim().toUpperCase();
      if (!sId) return;
      if (!groups[sId]) {
        groups[sId] = [];
      }
      groups[sId].push(student);
    });
    
    const duplicateGroups: { [id: string]: Admission[] } = {};
    let admissionsDuplicatesCount = 0;
    Object.keys(groups).forEach(id => {
      if (groups[id].length > 1) {
        duplicateGroups[id] = groups[id];
        admissionsDuplicatesCount += groups[id].length;
      }
    });

    // 2. Mismatched Exam IDs
    // Find exam registrations where the student exists in admissions, but with a DIFFERENT studentId
    const examMismatches: {
      exam: any;
      admission: Admission;
    }[] = [];

    // Find exam records that don't match any admission record (orphaned)
    const orphanedExams: any[] = [];

    exams.forEach(exam => {
      const examNameClean = (exam.studentName || '').trim().toLowerCase();
      const examIdClean = (exam.studentId || '').trim().toUpperCase();
      
      // Look up student by name in admissions
      const matchedAdmission = admissions.find(adm => 
        (adm.fullName || '').trim().toLowerCase() === examNameClean
      );

      if (matchedAdmission) {
        const admIdClean = (matchedAdmission.studentId || '').trim().toUpperCase();
        if (examIdClean !== admIdClean) {
          examMismatches.push({
            exam,
            admission: matchedAdmission
          });
        }
      } else {
        orphanedExams.push(exam);
      }
    });

    const totalIssuesCount = admissionsDuplicatesCount + examMismatches.length + orphanedExams.length;
    
    return {
      duplicateGroups,
      examMismatches,
      orphanedExams,
      hasDuplicates: totalIssuesCount > 0,
      totalDuplicatesCount: totalIssuesCount
    };
  };

  // Perform search criteria match filters for parent queries
  const filteredQueries = parentQueries.filter((q) => {
    const s = querySearch.trim().toLowerCase();
    const matchesSearch = !s || 
      q.parentName.toLowerCase().includes(s) || 
      (q.childName && q.childName.toLowerCase().includes(s)) ||
      q.phone.includes(s) ||
      (q.email && q.email.toLowerCase().includes(s)) ||
      q.message.toLowerCase().includes(s);

    const matchesStatus = queryStatusFilter === 'all' || q.status === queryStatusFilter;
    const matchesType = queryTypeFilter === 'all' || q.queryType === queryTypeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Extract unique batches list dynamically from Firestore if loaded, else fallback to actual admissions lists
  const batchesList: string[] = batches.length > 0
    ? batches.map(b => b.name)
    : Array.from(new Set(admissions.map(a => a.batch)));

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-zinc-400">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-heading font-medium text-xs tracking-widest uppercase">Verifying Admin Credentials...</span>
      </div>
    );
  }

  // A. Access-Denied / Secure Auth wall
  if (!user || isAdmin !== true) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-slate-900/40 border border-zinc-900 rounded-2xl p-8 text-center shadow-2xl relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500 rounded-t-2xl" />

          <div className="bg-yellow-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-yellow-500 glow-gold">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h1 className="font-title text-2xl font-black text-white uppercase tracking-wider mb-2">Shihan Admin Area</h1>
          <p className="text-zinc-500 text-xs px-2 mb-6 leading-relaxed">
            Authentication is sandboxed to the secure administrator account. Please log in using your Google credentials below.
          </p>

          {loginError && (
            <div className="mb-6 bg-red-950/40 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-start space-x-2 text-left text-[11px] leading-relaxed max-h-[300px] overflow-y-auto">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="whitespace-pre-line break-words flex-1 text-red-300 font-sans">
                {loginError}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-zinc-100 text-slate-900 font-heading font-bold text-xs uppercase tracking-widest py-4 px-6 rounded-lg transition-all transform hover:-translate-y-0.5 shadow-md cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-900" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.65 4.5 1.8l2.423-2.423C17.385 1.745 14.93 1 12.24 1 6.58 1 2 5.58 2 11.24s4.58 10.24 10.24 10.24c5.9 0 9.8-4.15 9.8-9.98 0-.67-.06-1.3-.16-1.9H12.24z" />
              </svg>
              <span>LOG IN WITH GOOGLE</span>
            </button>

            {user && (
              <button
                onClick={handleLogout}
                className="w-full font-heading font-semibold text-xs text-zinc-400 hover:text-white pt-2 block text-center uppercase tracking-widest underline"
              >
                Sign Out {user.email?.substring(0, 10)}...
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // B. Full Admin Console Workspace
  return (
    <div className="min-h-screen bg-slate-950 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Dynamic header row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-900 pb-8">
          <div>
            <div className="flex items-center space-x-2.5 text-yellow-500 mb-1.5">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-heading text-xs font-black uppercase tracking-widest block">SECURE DIRECTORY MASTER CONSOLE</span>
            </div>
            <h1 className="font-title text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
              Dojo Admission Registry
            </h1>
          </div>

          {/* Connected admin account details with dynamic DB indicators */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Live Database status diagnostics check */}
            <div 
              onClick={verifyDbConn}
              title="Click to manually reverify connection to the live Firestore Database"
              className="flex items-center space-x-2 bg-slate-900/60 border border-zinc-900 rounded-xl px-4 py-2.5 cursor-pointer hover:bg-zinc-900/80 transition-all text-left"
            >
              <div className={`w-2 h-2 rounded-full ${
                dbConnected === true ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 
                dbConnected === false ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)] animate-pulse' :
                'bg-amber-500 animate-pulse'
              }`} />
              <div className="flex flex-col select-none">
                <span className="font-heading font-black text-[9px] text-zinc-100 uppercase tracking-widest leading-none">
                  {dbConnected === true ? 'DATABASE ONLINE' : 
                   dbConnected === false ? 'DATABASE OFFLINE' : 
                   'PINGING DATABASE...'}
                </span>
                <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-wider block mt-1">
                  {dbConnected === true ? 'FIREBASE CLOUD CONNECTED' : 
                   dbConnected === false ? 'CONNECTION LOST (RETRYING...)' : 
                   'VERIFYING RESPONSIVENESS'}
                </span>
              </div>
              <RefreshCw className={`w-3 h-3 text-zinc-500 hover:text-white transition-colors ml-1 ${checkingDb ? 'animate-spin' : ''}`} />
            </div>

            <div className="flex items-center space-x-4 bg-slate-900/60 border border-zinc-900 rounded-xl px-4 py-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-yellow-500/30">
                <img src={user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=80&auto=format&fit=crop"} alt="Admin Profile" />
              </div>
              <div className="leading-none flex flex-col">
                <span className="font-heading font-black text-[10px] text-zinc-100 uppercase tracking-wider truncate max-w-[150px]">{user.displayName}</span>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-1">SHIHAN ADMINISTRATOR</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md hover:bg-zinc-850 text-zinc-400 hover:text-red-500 transition-colors tooltip cursor-pointer"
                title="Disconnect Panel"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Aggregate Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-slate-900/40 border border-zinc-900 p-5 rounded-xl flex items-center space-x-4">
            <div className="p-3 bg-zinc-800 rounded-lg text-zinc-300">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-550 uppercase font-bold block tracking-wider">Total Registers</span>
              <span className="font-mono text-lg sm:text-2xl font-black text-white mt-1 block">{stats.total}</span>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-zinc-900 p-5 rounded-xl flex items-center space-x-4">
            <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-500">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-[10px] text-yellow-500/80 uppercase font-bold block tracking-wider">Pending Review</span>
              <span className="font-mono text-lg sm:text-2xl font-black text-yellow-500 mt-1 block">{stats.pending}</span>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-zinc-900 p-5 rounded-xl flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-500/80 uppercase font-bold block tracking-wider">Approved Members</span>
              <span className="font-mono text-lg sm:text-2xl font-black text-emerald-500 mt-1 block">{stats.approved}</span>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-zinc-900 p-5 rounded-xl flex items-center space-x-4">
            <div className="p-3 bg-red-400/10 rounded-lg text-[#FF3B3F]">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-350 uppercase font-bold block tracking-wider">Managed Batches</span>
              <span className="font-mono text-lg sm:text-2xl font-black text-yellow-500 mt-1 block">{stats.totalBatches}</span>
            </div>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="border-b border-zinc-900 pb-px">
          {/* Desktop Version (xl and above) */}
          <div className="hidden xl:flex flex-row items-center justify-between gap-4">
            <div className="flex space-x-6">
              <button
                onClick={() => setAdminTab('admissions')}
                className={`font-heading font-black text-xs tracking-widest uppercase pb-4 border-b-2 transition-all cursor-pointer ${
                  adminTab === 'admissions' 
                    ? 'border-yellow-500 text-yellow-500 font-extrabold' 
                    : 'border-transparent text-zinc-550 hover:text-zinc-300'
                }`}
              >
                Student Directory
              </button>
              <button
                onClick={() => setAdminTab('parent_queries')}
                className={`font-heading font-black text-xs tracking-widest uppercase pb-4 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                  adminTab === 'parent_queries' 
                    ? 'border-yellow-500 text-yellow-500 font-extrabold' 
                    : 'border-transparent text-zinc-550 hover:text-zinc-300'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span>Parent Queries</span>
                {parentQueries.filter(q => q.status === 'new').length > 0 && (
                  <span className="bg-[#FF3B3F] text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold animate-bounce shrink-0">
                    {parentQueries.filter(q => q.status === 'new').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setAdminTab('batches')}
                className={`font-heading font-black text-xs tracking-widest uppercase pb-4 border-b-2 transition-all cursor-pointer ${
                  adminTab === 'batches' 
                    ? 'border-yellow-500 text-yellow-500 font-extrabold' 
                    : 'border-transparent text-zinc-550 hover:text-zinc-300'
                }`}
              >
                Karate Batches
              </button>
              <button
                onClick={() => setAdminTab('site_settings')}
                className={`font-heading font-black text-xs tracking-widest uppercase pb-4 border-b-2 transition-all cursor-pointer ${
                  adminTab === 'site_settings' 
                    ? 'border-yellow-500 text-yellow-500 font-extrabold' 
                    : 'border-transparent text-zinc-550 hover:text-zinc-350'
                }`}
              >
                Site Videos
              </button>
              <button
                onClick={() => setAdminTab('exams')}
                className={`font-heading font-black text-xs tracking-widest uppercase pb-4 border-b-2 transition-all cursor-pointer ${
                  adminTab === 'exams' 
                    ? 'border-yellow-500 text-yellow-500 font-extrabold' 
                    : 'border-transparent text-zinc-555 hover:text-zinc-350'
                }`}
              >
                Exams & Belt Grading
              </button>
              <button
                onClick={() => setAdminTab('seo_ai')}
                className={`font-heading font-black text-xs tracking-widest uppercase pb-4 border-b-2 transition-all cursor-pointer flex items-center space-x-1 ${
                  adminTab === 'seo_ai' 
                    ? 'border-yellow-500 text-yellow-500 font-extrabold' 
                    : 'border-transparent text-zinc-550 hover:text-zinc-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>GSC & AI SEO</span>
              </button>
              <button
                onClick={() => setAdminTab('bills')}
                className={`font-heading font-black text-xs tracking-widest uppercase pb-4 border-b-2 transition-all cursor-pointer flex items-center space-x-1 ${
                  adminTab === 'bills' 
                    ? 'border-yellow-500 text-yellow-500 font-extrabold' 
                    : 'border-transparent text-zinc-550 hover:text-zinc-350'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 shrink-0" />
                <span>Fees & Billing</span>
              </button>
              <button
                onClick={() => {
                  const { duplicateGroups } = getDuplicateIdGroups();
                  const initialInputs: { [key: string]: string } = {};
                  Object.values(duplicateGroups).flat().forEach(student => {
                    initialInputs[student.id] = student.studentId;
                  });
                  setDiagIdInputs(initialInputs);
                  setAdminTab('duplicate_finder');
                }}
                className={`font-heading font-black text-xs tracking-widest uppercase pb-4 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                  adminTab === 'duplicate_finder' 
                    ? 'border-[#FF3B3F] text-[#FF3B3F] font-extrabold' 
                    : 'border-transparent text-zinc-550 hover:text-red-400'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                <span>Duplicate Finder</span>
                {(() => {
                  const { totalDuplicatesCount } = getDuplicateIdGroups();
                  return totalDuplicatesCount > 0 ? (
                    <span className="bg-[#FF3B3F] text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold shrink-0 ml-1">
                      {totalDuplicatesCount}
                    </span>
                  ) : null;
                })()}
              </button>

              <button
                onClick={() => setAdminTab('overdue_reminders')}
                className={`font-heading font-black text-xs tracking-widest uppercase pb-4 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                  adminTab === 'overdue_reminders' 
                    ? 'border-[#FF3B3F] text-[#FF3B3F] font-extrabold' 
                    : 'border-transparent text-zinc-550 hover:text-red-400'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Overdue Reminders</span>
                {(() => {
                  const count = getOverdueStudentsData().length;
                  return count > 0 ? (
                    <span className="bg-[#FF3B3F] text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold shrink-0 ml-1">
                      {count}
                    </span>
                  ) : null;
                })()}
              </button>
            </div>

            {adminTab === 'bills' && (
              <div className="flex items-center space-x-3 pb-4">
                <button
                  onClick={() => {
                    setIsGeneratingReceipt(!isGeneratingReceipt);
                    setBillError('');
                  }}
                  className="font-heading font-extrabold text-[10px] uppercase tracking-wider bg-yellow-500 hover:bg-yellow-400 text-slate-950 px-4 py-2 rounded transition-all flex items-center space-x-1.5 shadow-md cursor-pointer animate-pulse"
                >
                  {isGeneratingReceipt ? (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Receipts Log</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Bill</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Version (Below xl) */}
          <div className="xl:hidden w-full flex flex-col space-y-3 pb-4 pt-1">
            <div className="relative w-full">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-full bg-slate-950 border border-zinc-900 rounded-xl px-4 py-3.5 flex items-center justify-between text-left shadow-lg cursor-pointer focus:outline-none hover:border-yellow-500/30 transition-all"
              >
                <div className="flex items-center space-x-3">
                  {adminTab === 'admissions' && <Users className="w-4 h-4 text-yellow-500" />}
                  {adminTab === 'parent_queries' && <MessageSquare className="w-4 h-4 text-yellow-500" />}
                  {adminTab === 'batches' && <Calendar className="w-4 h-4 text-yellow-500" />}
                  {adminTab === 'site_settings' && <Video className="w-4 h-4 text-yellow-500" />}
                  {adminTab === 'exams' && <Award className="w-4 h-4 text-yellow-500" />}
                  {adminTab === 'seo_ai' && <Sparkles className="w-4 h-4 text-yellow-500" />}
                  {adminTab === 'bills' && <DollarSign className="w-4 h-4 text-yellow-500" />}
                  {adminTab === 'duplicate_finder' && <AlertOctagon className="w-4 h-4 text-red-500" />}
                  {adminTab === 'overdue_reminders' && <MessageCircle className="w-4 h-4 text-red-500" />}

                  <span className="font-heading font-black text-xs uppercase tracking-widest text-zinc-100">
                    {adminTab === 'admissions' && 'Student Directory'}
                    {adminTab === 'parent_queries' && 'Parent Queries'}
                    {adminTab === 'batches' && 'Karate Batches'}
                    {adminTab === 'site_settings' && 'Site Videos'}
                    {adminTab === 'exams' && 'Exams & Belt Grading'}
                    {adminTab === 'seo_ai' && 'GSC & AI SEO'}
                    {adminTab === 'bills' && 'Fees & Billing'}
                    {adminTab === 'duplicate_finder' && 'Duplicate ID Finder'}
                    {adminTab === 'overdue_reminders' && 'Overdue Reminders'}
                  </span>

                  {adminTab === 'parent_queries' && parentQueries.filter(q => q.status === 'new').length > 0 && (
                    <span className="bg-[#FF3B3F] text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold">
                      {parentQueries.filter(q => q.status === 'new').length}
                    </span>
                  )}
                  {adminTab === 'duplicate_finder' && (() => {
                    const { totalDuplicatesCount } = getDuplicateIdGroups();
                    return totalDuplicatesCount > 0 ? (
                      <span className="bg-[#FF3B3F] text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ml-1.5">
                        {totalDuplicatesCount}
                      </span>
                    ) : null;
                  })()}
                  {adminTab === 'overdue_reminders' && (() => {
                    const count = getOverdueStudentsData().length;
                    return count > 0 ? (
                      <span className="bg-[#FF3B3F] text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ml-1.5">
                        {count}
                      </span>
                    ) : null;
                  })()}
                </div>
                {isMobileMenuOpen ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </button>

              {isMobileMenuOpen && (
                <div className="absolute z-50 left-0 right-0 mt-2 bg-slate-950 border border-zinc-900 rounded-xl overflow-hidden shadow-2xl divide-y divide-zinc-900/50">
                  <button
                    onClick={() => { setAdminTab('admissions'); setIsMobileMenuOpen(false); }}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-all hover:bg-zinc-900/65 ${
                      adminTab === 'admissions' ? 'bg-zinc-900/30 text-yellow-500' : 'text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Users className={`w-4 h-4 ${adminTab === 'admissions' ? 'text-yellow-500' : 'text-zinc-500'}`} />
                      <span className="font-heading font-bold text-xs uppercase tracking-wider">Student Directory</span>
                    </div>
                    {adminTab === 'admissions' && <Check className="w-3.5 h-3.5 text-yellow-500" />}
                  </button>

                  <button
                    onClick={() => { setAdminTab('parent_queries'); setIsMobileMenuOpen(false); }}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-all hover:bg-zinc-900/65 ${
                      adminTab === 'parent_queries' ? 'bg-zinc-900/30 text-yellow-500' : 'text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <MessageSquare className={`w-4 h-4 ${adminTab === 'parent_queries' ? 'text-yellow-500' : 'text-zinc-500'}`} />
                      <span className="font-heading font-bold text-xs uppercase tracking-wider">Parent Queries</span>
                      {parentQueries.filter(q => q.status === 'new').length > 0 && (
                        <span className="bg-[#FF3B3F] text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold">
                          {parentQueries.filter(q => q.status === 'new').length}
                        </span>
                      )}
                    </div>
                    {adminTab === 'parent_queries' && <Check className="w-3.5 h-3.5 text-yellow-500" />}
                  </button>

                  <button
                    onClick={() => { setAdminTab('batches'); setIsMobileMenuOpen(false); }}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-all hover:bg-zinc-900/65 ${
                      adminTab === 'batches' ? 'bg-zinc-900/30 text-yellow-500' : 'text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Calendar className={`w-4 h-4 ${adminTab === 'batches' ? 'text-yellow-500' : 'text-zinc-500'}`} />
                      <span className="font-heading font-bold text-xs uppercase tracking-wider">Karate Batches</span>
                    </div>
                    {adminTab === 'batches' && <Check className="w-3.5 h-3.5 text-yellow-500" />}
                  </button>

                  <button
                    onClick={() => { setAdminTab('site_settings'); setIsMobileMenuOpen(false); }}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-all hover:bg-zinc-900/65 ${
                      adminTab === 'site_settings' ? 'bg-zinc-900/30 text-yellow-500' : 'text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Video className={`w-4 h-4 ${adminTab === 'site_settings' ? 'text-yellow-500' : 'text-zinc-500'}`} />
                      <span className="font-heading font-bold text-xs uppercase tracking-wider">Site Videos</span>
                    </div>
                    {adminTab === 'site_settings' && <Check className="w-3.5 h-3.5 text-yellow-500" />}
                  </button>

                  <button
                    onClick={() => { setAdminTab('exams'); setIsMobileMenuOpen(false); }}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-all hover:bg-zinc-900/65 ${
                      adminTab === 'exams' ? 'bg-zinc-900/30 text-yellow-500' : 'text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Award className={`w-4 h-4 ${adminTab === 'exams' ? 'text-yellow-500' : 'text-zinc-500'}`} />
                      <span className="font-heading font-bold text-xs uppercase tracking-wider">Exams & Belt Grading</span>
                    </div>
                    {adminTab === 'exams' && <Check className="w-3.5 h-3.5 text-yellow-500" />}
                  </button>

                  <button
                    onClick={() => { setAdminTab('seo_ai'); setIsMobileMenuOpen(false); }}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-all hover:bg-zinc-900/65 ${
                      adminTab === 'seo_ai' ? 'bg-zinc-900/30 text-yellow-500' : 'text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Sparkles className={`w-4 h-4 ${adminTab === 'seo_ai' ? 'text-yellow-500' : 'text-zinc-500'}`} />
                      <span className="font-heading font-bold text-xs uppercase tracking-wider">GSC & AI SEO</span>
                    </div>
                    {adminTab === 'seo_ai' && <Check className="w-3.5 h-3.5 text-yellow-500" />}
                  </button>

                  <button
                    onClick={() => { setAdminTab('bills'); setIsMobileMenuOpen(false); }}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-all hover:bg-zinc-900/65 ${
                      adminTab === 'bills' ? 'bg-zinc-900/30 text-yellow-500' : 'text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <DollarSign className={`w-4 h-4 ${adminTab === 'bills' ? 'text-yellow-500' : 'text-zinc-500'}`} />
                      <span className="font-heading font-bold text-xs uppercase tracking-wider">Fees & Billing</span>
                    </div>
                    {adminTab === 'bills' && <Check className="w-3.5 h-3.5 text-yellow-500" />}
                  </button>

                  <button
                    onClick={() => {
                      const { duplicateGroups } = getDuplicateIdGroups();
                      const initialInputs: { [key: string]: string } = {};
                      Object.values(duplicateGroups).flat().forEach(student => {
                        initialInputs[student.id] = student.studentId;
                      });
                      setDiagIdInputs(initialInputs);
                      setAdminTab('duplicate_finder');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-all hover:bg-zinc-900/65 ${
                      adminTab === 'duplicate_finder' ? 'bg-zinc-900/30 text-red-500' : 'text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <AlertOctagon className={`w-4 h-4 ${adminTab === 'duplicate_finder' ? 'text-red-500' : 'text-zinc-500'}`} />
                      <span className="font-heading font-bold text-xs uppercase tracking-wider">Duplicate ID Finder</span>
                      {(() => {
                        const { totalDuplicatesCount } = getDuplicateIdGroups();
                        return totalDuplicatesCount > 0 ? (
                          <span className="bg-[#FF3B3F] text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold">
                            {totalDuplicatesCount}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    {adminTab === 'duplicate_finder' && <Check className="w-3.5 h-3.5 text-red-500" />}
                  </button>

                  <button
                    onClick={() => {
                      setAdminTab('overdue_reminders');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-all hover:bg-zinc-900/65 ${
                      adminTab === 'overdue_reminders' ? 'bg-zinc-900/30 text-red-500' : 'text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <MessageCircle className={`w-4 h-4 ${adminTab === 'overdue_reminders' ? 'text-red-500' : 'text-zinc-500'}`} />
                      <span className="font-heading font-bold text-xs uppercase tracking-wider">Overdue Reminders</span>
                      {(() => {
                        const count = getOverdueStudentsData().length;
                        return count > 0 ? (
                          <span className="bg-[#FF3B3F] text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold">
                            {count}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    {adminTab === 'overdue_reminders' && <Check className="w-3.5 h-3.5 text-red-500" />}
                  </button>
                </div>
              )}
            </div>

            {adminTab === 'bills' && (
              <div className="w-full pt-1.5">
                <button
                  onClick={() => {
                    setIsGeneratingReceipt(!isGeneratingReceipt);
                    setBillError('');
                  }}
                  className="w-full justify-center font-heading font-extrabold text-[11px] uppercase tracking-wider bg-yellow-500 hover:bg-yellow-400 text-slate-950 px-4 py-3 rounded-xl transition-all flex items-center space-x-1.5 shadow-md cursor-pointer"
                >
                  {isGeneratingReceipt ? (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Receipts Log</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Bill</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {adminTab === 'admissions' && (
            <div className="flex items-center space-x-3 pb-4 sm:pb-0">
              <button
                onClick={exportToCSV}
                disabled={filteredAdmissions.length === 0}
                className="font-heading font-extrabold text-[10px] uppercase tracking-wider bg-slate-950 hover:bg-slate-900 border border-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 px-4 py-2 rounded transition-all flex items-center space-x-1.5 shadow-md cursor-pointer"
                title="Export currently filtered student directory as CSV"
              >
                <Download className="w-3.5 h-3.5 text-zinc-550" />
                <span>Export Registry (CSV)</span>
              </button>
              <button
                onClick={openEnrollModal}
                className="font-heading font-extrabold text-[10px] uppercase tracking-wider bg-yellow-500 hover:bg-yellow-400 text-slate-950 px-4 py-2 rounded transition-all flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Existing Student</span>
              </button>
            </div>
          )}

          {adminTab === 'batches' && (
            <div className="flex items-center space-x-3 pb-4 sm:pb-0">
              {batches.length === 0 && (
                <button
                  onClick={seedDefaultBatches}
                  disabled={batchesLoading}
                  className="font-heading font-extrabold text-[10px] uppercase tracking-wider hover:bg-slate-900 border border-zinc-800 text-zinc-400 px-4 py-2 rounded transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Seed standard Batches</span>
                </button>
              )}
              <button
                onClick={openCreateBatchModal}
                className="font-heading font-extrabold text-[10px] uppercase tracking-wider bg-yellow-500 hover:bg-yellow-400 text-slate-950 px-4 py-2 rounded transition-all flex items-center space-x-1.5 shadow cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Batch</span>
              </button>
            </div>
          )}
        </div>

        {/* TAB 0: Real-time Parents Online Queries desk */}
        {adminTab === 'parent_queries' && (
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
              {/* Filter and search bar */}
              <div className="p-5 sm:p-6 border-b border-zinc-900 flex flex-col xl:flex-row gap-4 items-center justify-between">
                <div className="relative w-full xl:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search parent name, child name, phone or message..."
                    value={querySearch}
                    onChange={(e) => setQuerySearch(e.target.value)}
                    className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 placeholder:text-zinc-600 pl-11 pr-4 py-3 rounded-lg text-xs focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                  {/* Status filter */}
                  <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-zinc-900">
                    <span className="text-[10px] font-mono text-zinc-550 uppercase font-black">Status:</span>
                    <select
                      value={queryStatusFilter}
                      onChange={(e: any) => setQueryStatusFilter(e.target.value)}
                      className="bg-transparent text-zinc-350 text-xs focus:outline-none cursor-pointer font-sans"
                    >
                      <option value="all" className="bg-zinc-950 text-zinc-350">All Queries</option>
                      <option value="new" className="bg-zinc-950 text-yellow-500">New</option>
                      <option value="in_progress" className="bg-zinc-950 text-blue-400">In Progress</option>
                      <option value="resolved" className="bg-zinc-950 text-emerald-500">Resolved</option>
                    </select>
                  </div>

                  {/* Topic filter */}
                  <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-zinc-900">
                    <span className="text-[10px] font-mono text-zinc-550 uppercase font-black">Topic:</span>
                    <select
                      value={queryTypeFilter}
                      onChange={(e) => setQueryTypeFilter(e.target.value)}
                      className="bg-transparent text-zinc-350 text-xs focus:outline-none cursor-pointer font-sans"
                    >
                      <option value="all" className="bg-zinc-950">All Topics</option>
                      <option value="General Query">General Query</option>
                      <option value="Admission Enquiry">Admission Enquiry</option>
                      <option value="Fees & Billing Query">Fees & Billing</option>
                      <option value="Belt Exam & Promotions">Belt Exam</option>
                      <option value="Complaints or Feedback">Feedback</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {parentQueries.filter(q => q.status === 'new').length > 0 && (
                    <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-semibold px-3 py-1.5 rounded-lg font-mono">
                      {parentQueries.filter(q => q.status === 'new').length} Unhandled Enquiry
                    </span>
                  )}
                </div>
              </div>

              {parentQueriesLoading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-zinc-550 text-xs font-mono uppercase tracking-widest">Loading parents queries database...</p>
                </div>
              ) : filteredQueries.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="bg-slate-950 text-zinc-650 w-12 h-12 rounded-full border border-zinc-900 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="font-title text-base font-bold text-zinc-300 uppercase tracking-wide">No Parent Enquiries Found</h4>
                  <p className="text-zinc-550 text-xs max-w-sm mx-auto mt-2 font-sans">
                    No online submissions match your selected query filters or keyword. Parents can submit enquiries on the public contact section.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
                  
                  {/* Left panel: Query List (5 cols) */}
                  <div className="lg:col-span-5 border-r border-zinc-900 overflow-y-auto max-h-[600px] divide-y divide-zinc-900/60">
                    {filteredQueries.map((q) => {
                      const isSelected = selectedQuery?.id === q.id;
                      return (
                        <div 
                          key={q.id}
                          onClick={() => {
                            setSelectedQuery(q);
                            setEditingNotesId(null);
                            setEditingNotesText(q.followUpNotes || '');
                          }}
                          className={`p-4 sm:p-5 text-left transition-all cursor-pointer select-none relative group ${
                            isSelected 
                              ? 'bg-[#141214] border-l-4 border-yellow-500' 
                              : 'hover:bg-zinc-900/20 bg-transparent'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <span className="font-heading font-black text-xs sm:text-sm text-white tracking-wide block truncate max-w-[150px]">
                              {q.parentName}
                            </span>
                            
                            <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded font-black ${
                              q.status === 'new' 
                                ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/25'
                                : q.status === 'in_progress'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25'
                            }`}>
                              {q.status === 'new' ? 'new' : q.status === 'in_progress' ? 'in progress' : 'resolved'}
                            </span>
                          </div>

                          {q.childName && (
                            <span className="text-[10px] text-zinc-400 bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded inline-block font-sans mb-2">
                              Child: <span className="font-semibold text-zinc-300">{q.childName}</span>
                            </span>
                          )}

                          <p className="text-zinc-500 text-xs line-clamp-2 font-sans mb-3 pr-2">
                            {q.message}
                          </p>

                          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-550 pt-1">
                            <span>{q.queryType}</span>
                            <span>{new Date(q.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          {/* Quick change hover hint */}
                          {!isSelected && q.status === 'new' && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950 p-1.5 border border-zinc-900 rounded-lg text-[10px] text-zinc-400">
                              Click to view ↗
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Right panel: Details view (7 cols) */}
                  <div className="lg:col-span-7 bg-[#0b0a0b]/60 flex flex-col justify-between p-6 sm:p-8">
                    {selectedQuery ? (
                      <div className="space-y-6">
                        
                        {/* Header Area */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-550 block mb-1">ONLINE INQUIRY</span>
                            <h3 className="font-heading text-lg sm:text-2xl font-black text-white uppercase tracking-tight">
                              {selectedQuery.parentName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-xs text-zinc-400 font-sans">Topic:</span>
                              <span className="text-xs text-yellow-500 font-bold bg-yellow-500/5 px-2.5 py-0.5 rounded border border-yellow-500/10 font-sans">
                                {selectedQuery.queryType}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono text-zinc-550">
                              Received: {new Date(selectedQuery.createdAt).toLocaleString()}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-zinc-400">Status:</span>
                              <div className="flex rounded-md overflow-hidden border border-zinc-850">
                                <button
                                  onClick={() => handleUpdateQueryStatus(selectedQuery.id, 'new')}
                                  className={`px-2.5 py-1 text-[10px] font-mono font-black uppercase transition-colors cursor-pointer ${
                                    selectedQuery.status === 'new'
                                      ? 'bg-yellow-500 text-slate-950'
                                      : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  New
                                </button>
                                <button
                                  onClick={() => handleUpdateQueryStatus(selectedQuery.id, 'in_progress')}
                                  className={`px-2.5 py-1 text-[10px] font-mono font-black uppercase transition-colors cursor-pointer ${
                                    selectedQuery.status === 'in_progress'
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  In Progress
                                </button>
                                <button
                                  onClick={() => handleUpdateQueryStatus(selectedQuery.id, 'resolved')}
                                  className={`px-2.5 py-1 text-[10px] font-mono font-black uppercase transition-colors cursor-pointer ${
                                    selectedQuery.status === 'resolved'
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  Resolved
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bio Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-slate-950/80 border border-zinc-900/80 p-4 rounded-xl space-y-2">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Parent Contact</span>
                            
                            <div className="space-y-1.5 text-xs font-sans">
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-zinc-550 shrink-0" />
                                <a 
                                  href={`tel:${selectedQuery.phone}`} 
                                  className="text-zinc-300 hover:text-yellow-500 transition-colors font-mono font-bold"
                                >
                                  {selectedQuery.phone}
                                </a>
                              </div>

                              {selectedQuery.email ? (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-3.5 h-3.5 text-zinc-550 shrink-0" />
                                  <a 
                                    href={`mailto:${selectedQuery.email}`} 
                                    className="text-zinc-350 hover:text-yellow-500 transition-colors break-all"
                                  >
                                    {selectedQuery.email}
                                  </a>
                                </div>
                              ) : (
                                <span className="text-zinc-650 text-[11px] italic block">No email provided</span>
                              )}
                            </div>
                          </div>

                          <div className="bg-slate-950/80 border border-zinc-900/80 p-4 rounded-xl space-y-2">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Student Detail</span>
                            <div className="text-xs font-sans">
                              {selectedQuery.childName ? (
                                <div className="space-y-1">
                                  <p className="text-zinc-300">
                                    Name: <span className="font-semibold text-white">{selectedQuery.childName}</span>
                                  </p>
                                  <span className="text-[10px] text-zinc-500">Interested in joining LKCP training.</span>
                                </div>
                              ) : (
                                <span className="text-zinc-650 italic text-[11px] block py-1">No child name specified (General enquiry)</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Query message box */}
                        <div className="space-y-2">
                          <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest block font-bold">PARENTS ENQUIRY MESSAGE</span>
                          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl">
                            <p className="text-zinc-300 text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-wrap">
                              "{selectedQuery.message}"
                            </p>
                          </div>
                        </div>

                        {/* Follow up Notes Desk */}
                        <div className="bg-zinc-950/30 border border-zinc-900 p-5 rounded-xl space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono text-yellow-500/80 uppercase tracking-widest block font-bold">
                              INTERNAL ADMINISTRATIVE FOLLOW-UP NOTES
                            </span>
                            
                            {editingNotesId !== selectedQuery.id ? (
                              <button
                                onClick={() => {
                                  setEditingNotesId(selectedQuery.id);
                                  setEditingNotesText(selectedQuery.followUpNotes || '');
                                }}
                                className="text-[10px] font-mono uppercase text-yellow-500 hover:text-yellow-400 cursor-pointer flex items-center gap-1 font-bold"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>{selectedQuery.followUpNotes ? 'Edit Notes' : 'Add Notes'}</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdateQueryNotes(selectedQuery.id, editingNotesText)}
                                  className="text-[10px] font-mono uppercase text-emerald-500 hover:text-emerald-400 cursor-pointer flex items-center gap-1 font-bold"
                                >
                                  <Save className="w-3 h-3" />
                                  <span>Save</span>
                                </button>
                                <button
                                  onClick={() => setEditingNotesId(null)}
                                  className="text-[10px] font-mono uppercase text-zinc-500 hover:text-zinc-400 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>

                          {editingNotesId === selectedQuery.id ? (
                            <textarea
                              value={editingNotesText}
                              onChange={(e) => setEditingNotesText(e.target.value)}
                              placeholder="Type administrative updates here (e.g. 'Called parent. Parents agreed to bring the kid for a free demo session this Friday at 5:00 PM.')"
                              rows={3}
                              className="w-full text-xs font-sans text-zinc-200 bg-slate-950 border border-zinc-900 rounded-lg p-3 focus:outline-none focus:border-yellow-500/50"
                            />
                          ) : (
                            <div className="text-xs text-zinc-400 font-sans leading-relaxed">
                              {selectedQuery.followUpNotes ? (
                                <p className="bg-zinc-950/50 p-3 rounded border border-zinc-900/60 text-zinc-300 font-sans italic">
                                  "{selectedQuery.followUpNotes}"
                                </p>
                              ) : (
                                <p className="text-zinc-600 italic text-[11px]">
                                  No internal follow-up notes written yet. Keep logs of parental communications here to collaborate easily with other coaches.
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Call Actions Panel */}
                        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-zinc-900">
                          {/* Call Button */}
                          <a
                            href={`tel:${selectedQuery.phone}`}
                            className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white text-xs font-heading font-black uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call Parent</span>
                          </a>

                          {/* Precompiled Reply on WhatsApp */}
                          {(() => {
                            let cleanPhone = (selectedQuery.phone || '').replace(/\D/g, '');
                            if (cleanPhone.startsWith('0')) {
                              cleanPhone = cleanPhone.substring(1);
                            }
                            if (cleanPhone.length === 10) {
                              cleanPhone = `91${cleanPhone}`;
                            }
                            return (
                              <a
                                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                  `Hello ${selectedQuery.parentName}, this is Shihan Maruti Jadhav Sir from Lions Karate Club Pune. Thank you for your inquiry about ${selectedQuery.queryType}. We would love to invite you and ${selectedQuery.childName || 'your child'} for a free trial session at our Dojo branch! Let us know what time works best.`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-heading font-black uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>WhatsApp Reply</span>
                              </a>
                            );
                          })()}

                          <div className="ml-auto">
                            <button
                              onClick={() => handleDeleteQuery(selectedQuery.id)}
                              className="text-red-500 hover:text-red-400 hover:bg-red-500/5 p-2 rounded-lg transition-colors cursor-pointer"
                              title="Delete Query permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-24">
                        <div className="bg-slate-950 text-zinc-700 w-12 h-12 rounded-full border border-zinc-900 flex items-center justify-center mb-4">
                          <Eye className="w-5 h-5 animate-pulse" />
                        </div>
                        <h4 className="font-title text-sm font-bold text-zinc-400 uppercase tracking-widest">No Query Selected</h4>
                        <p className="text-zinc-650 text-xs max-w-xs mx-auto mt-1 font-sans">
                          Select a parent query from the left-hand column to view communications, update follow-up logs, and reply instantly.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 1: Real-time Admissions directory */}
        {adminTab === 'admissions' && (
          <div className="space-y-4">
            {/* Live Duplicate ID Diagnostic Alert Banner */}
            {(() => {
              const { hasDuplicates, totalDuplicatesCount } = getDuplicateIdGroups();
              if (!hasDuplicates) return null;
              return (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-left shadow-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-black text-xs uppercase tracking-wider text-red-500">Duplicate Student IDs Detected!</h4>
                      <p className="text-zinc-400 text-xs mt-1">
                        We found <strong className="text-white font-mono font-bold">{totalDuplicatesCount}</strong> student records that share identical Karate Roll IDs. This can lead to wrong reports, portal login conflicts, and incorrect belt progressions.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const { duplicateGroups } = getDuplicateIdGroups();
                      const initialInputs: { [key: string]: string } = {};
                      Object.values(duplicateGroups).flat().forEach(student => {
                        initialInputs[student.id] = student.studentId;
                      });
                      setDiagIdInputs(initialInputs);
                      setAdminTab('duplicate_finder');
                    }}
                    className="shrink-0 bg-[#FF3B3F] hover:bg-rose-600 text-white font-heading font-extrabold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all shadow-md flex items-center space-x-1.5 cursor-pointer active:scale-95"
                  >
                    <span>Analyze & Repair Duplicates</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })()}

            {/* 🎂 Current Month Birthday Celebrations Board */}
            {(() => {
              const birthdayStudents = getBirthdayStudents();
              const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
              
              return (
                <div className="bg-gradient-to-r from-rose-950/30 to-slate-900/40 border border-rose-900/30 p-5 rounded-2xl shadow-xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                        <Cake className="w-5 h-5 animate-bounce" />
                      </div>
                      <div>
                        <h3 className="font-heading font-black text-xs uppercase tracking-wider text-rose-400">
                          {currentMonthName} Birthday Celebrations 🎂
                        </h3>
                        <p className="text-zinc-400 text-xs mt-0.5">
                          Send personalized blessings from Chief Instructor Maruti Jadhav with a single click.
                        </p>
                      </div>
                    </div>
                    <span className="bg-rose-500/15 border border-rose-500/25 text-rose-400 font-mono font-bold text-[10px] px-2.5 py-1 rounded-full shrink-0">
                      {birthdayStudents.length} {birthdayStudents.length === 1 ? 'Student' : 'Students'}
                    </span>
                  </div>

                  {birthdayStudents.length === 0 ? (
                    <div className="py-4 text-center text-zinc-500 text-xs italic bg-slate-950/20 border border-zinc-900/50 rounded-xl">
                      🎉 No student birthdays registered in {currentMonthName}. Good luck to all on the tatami mat!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {birthdayStudents.map((student) => {
                        const currentYear = new Date().getFullYear();
                        const birthYear = student.dob ? parseInt(student.dob.split('-')[0], 10) : 0;
                        const turningAge = birthYear ? (currentYear - birthYear) : student.age;
                        
                        return (
                          <div 
                            key={student.id} 
                            className="bg-slate-950/40 border border-zinc-900/80 p-3.5 rounded-xl flex items-center justify-between hover:border-rose-900/40 transition-all group"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 relative">
                                <img 
                                  src={student.photoUrl || DEFAULT_STUDENT_AVATAR} 
                                  alt={student.fullName} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 bg-rose-500 text-[8px] p-0.5 rounded-tl-md">
                                  🎂
                                </div>
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-zinc-200 text-xs truncate group-hover:text-white transition-colors">
                                  {student.fullName}
                                </h4>
                                <p className="text-[10px] text-rose-400 font-medium mt-0.5 flex items-center gap-1.5">
                                  <span>{formatBirthdayDay(student.dob)}</span>
                                  <span className="text-zinc-600">•</span>
                                  <span className="bg-rose-500/10 text-rose-300 px-1 py-0.2 rounded text-[9px] font-semibold">
                                    Turning {turningAge}!
                                  </span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={async () => {
                                  sendWhatsAppBirthdayGreeting(student);
                                  await markBirthdayAsCelebrated(student.id);
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 p-2 rounded-lg transition-all shadow-md flex items-center justify-center cursor-pointer active:scale-95 group/btn"
                                title={`Send WhatsApp Greeting and mark done`}
                              >
                                <MessageSquare className="w-4 h-4 text-black group-hover/btn:scale-110 transition-transform" />
                              </button>

                              <button
                                type="button"
                                onClick={() => markBirthdayAsCelebrated(student.id)}
                                className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 p-2 rounded-lg border border-rose-500/25 transition-all shadow-md flex items-center justify-center cursor-pointer active:scale-95"
                                title="Mark as Celebrated/Done"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}



            <div className="bg-slate-900/40 border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
          {/* Filtering bar */}
          <div className="p-5 sm:p-6 border-b border-zinc-900 flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search inputs */}
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search by student name, phone, belt, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-zinc-850 text-zinc-300 placeholder:text-zinc-600 pl-11 pr-4 py-3 rounded-lg text-xs focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
              />
            </div>

            {/* Selector dropdown filters */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Status selectors */}
              <div className="flex items-center bg-slate-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-zinc-500 mr-2" />
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-zinc-400 font-heading text-xs tracking-wider outline-none cursor-pointer pr-4"
                >
                  <option value="all">ANY STATUS</option>
                  <option value="pending">PENDING</option>
                  <option value="approved">APPROVED</option>
                  <option value="rejected">REJECTED</option>
                  <option value="direct_exam">EXAM REGISTRATIONS</option>
                </select>
              </div>

              {/* Batches selectors */}
              <div className="flex items-center bg-slate-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-zinc-500 mr-2" />
                <select
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  className="bg-transparent text-zinc-400 font-heading text-xs tracking-wider outline-none cursor-pointer pr-4"
                >
                  <option value="all">ALL BATCHES</option>
                  {batchesList.map((st) => (
                    <option key={st} value={st}>{st.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Dojo Branches selectors */}
              <div className="flex items-center bg-slate-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-zinc-500 mr-2" />
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="bg-transparent text-zinc-400 font-heading text-xs tracking-wider outline-none cursor-pointer pr-4"
                >
                  <option value="all">ALL BRANCHES</option>
                  {DOJO_BRANCHES.map((b) => (
                    <option key={b.name} value={b.name}>{b.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Admission Fees selectors */}
              <div className="flex items-center bg-slate-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 shrink-0">
                <DollarSign className="w-3.5 h-3.5 text-zinc-500 mr-2" />
                <select
                  value={feesFilter}
                  onChange={(e: any) => setFeesFilter(e.target.value)}
                  className="bg-transparent text-zinc-400 font-heading text-xs tracking-wider outline-none cursor-pointer pr-4"
                >
                  <option value="all">ALL FEES</option>
                  <option value="Paid">PAID ONLY</option>
                  <option value="Unpaid">UNPAID ONLY</option>
                </select>
              </div>

              <div className="text-zinc-500 text-[10px] font-mono whitespace-nowrap lg:ml-2">
                Matching: {filteredAdmissions.length} records
              </div>
            </div>
          </div>

          {/* Actual Admissions list table container */}
          {dataLoading ? (
            <AdmissionsTableSkeleton />
          ) : filteredAdmissions.length === 0 ? (
            <div className="py-20 text-center text-zinc-600 text-xs font-light">
              No matching submission files recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-zinc-900 text-zinc-500 uppercase font-heading font-black text-[9px] tracking-widest">
                    <th className="py-4.5 px-6">ID Pass</th>
                    <th className="py-4.5 px-6">Student Bio</th>
                    <th className="py-4.5 px-6">Branch & Coach</th>
                    <th className="py-4.5 px-6">Batch Timings</th>
                    <th className="py-4.5 px-6">Rank Belt</th>
                    <th className="py-4.5 px-6">Review Status</th>
                    <th className="py-4.5 px-6">Fees Status</th>
                    <th className="py-4.5 px-6 text-right">Interactive Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40 text-xs text-zinc-300">
                  {filteredAdmissions.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-900/10 transition-colors">
                      {/* Photo + Pass ID */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-neutral-900 border border-zinc-800 shrink-0">
                            <img src={student.photoUrl || DEFAULT_STUDENT_AVATAR} alt="Portrait" className="w-full h-full object-cover" />
                          </div>
                          <span className="font-mono text-xs font-bold text-zinc-100">{student.studentId}</span>
                        </div>
                      </td>

                      {/* Name, Parent, Phone details */}
                      <td className="py-4 px-6 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-zinc-200 text-sm">{student.fullName}</span>
                          {isBirthdayThisMonth(student.dob) && (
                            <span 
                              className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[8px] font-heading font-black uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 animate-pulse" 
                              title={`Birthday this month!`}
                            >
                              🎂 Birthday
                            </span>
                          )}
                          {student.isDirectExamRegistration && (
                            <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-heading font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                              Exam Reg
                            </span>
                          )}
                        </div>
                        {student.parentName && (
                          <div className="text-[10px] text-zinc-400 font-medium">
                            Parent: <span className="text-zinc-300 font-semibold">{student.parentName}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-3 text-[10px] text-zinc-500">
                          <span>Age: {student.age} yrs</span>
                          <span>•</span>
                          <span>Phone: {student.phone}</span>
                        </div>
                        {student.schoolName && (
                          <div className="text-[10px] text-yellow-500/90 font-medium">
                            School: <span className="text-zinc-400 font-normal">{student.schoolName}</span>
                          </div>
                        )}
                      </td>

                      {/* Dojo Branch & Dedicated Coach */}
                      <td className="py-4 px-6 space-y-0.5">
                        <span className="text-zinc-200 font-bold block text-xs whitespace-nowrap">{student.branch || 'Manaji Nagar Branch'}</span>
                        <span className="text-zinc-500 block text-[10px] truncate max-w-[200px]" title={student.coachName || 'Maruti Jadhav Sir 2nd dan Black Belt'}>
                          Coach: {student.coachName || 'Maruti Jadhav Sir 2nd dan Black Belt'}
                        </span>
                      </td>

                      {/* Selected Batch timins */}
                      <td className="py-4 px-6 text-zinc-400 font-medium">
                        {student.batch}
                      </td>

                      {/* Belt rank level details */}
                      <td className="py-4 px-6">
                        <span className="font-semibold text-yellow-500 text-[11px] uppercase tracking-wide whitespace-nowrap">
                          {student.beltLevel.split(' ')[0]} Belt
                        </span>
                      </td>

                      {/* Operational Status tags */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center space-x-1 uppercase font-heading font-black text-[9px] tracking-widest px-2.5 py-1 rounded border ${
                          student.status === 'approved'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : student.status === 'rejected'
                            ? 'bg-red-500/10 border-red-500/20 text-red-500'
                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            student.status === 'approved' ? 'bg-emerald-500' : student.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                          <span>{student.status}</span>
                        </span>
                      </td>

                      {/* Connection state tracker with direct interactive toggle */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => {
                            const currentFees = student.feesStatus || 'Unpaid';
                            const nextFees = currentFees === 'Paid' ? 'Unpaid' : 'Paid';
                            updateFeesStatus(student.id, nextFees);
                          }}
                          className={`inline-flex items-center space-x-1 uppercase font-heading font-black text-[9px] tracking-widest px-2 py-0.5 rounded border transition-all cursor-pointer hover:scale-105 ${
                            (student.feesStatus || 'Unpaid') === 'Paid'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                          }`}
                          title="Click to toggle Paid/Unpaid status directly"
                        >
                          <span className={`w-1 h-1 rounded-full ${
                            (student.feesStatus || 'Unpaid') === 'Paid' ? 'bg-emerald-400' : 'bg-red-400'
                          }`} />
                          <span>{student.feesStatus || 'Unpaid'}</span>
                        </button>
                      </td>

                      {/* Action buttons triggers */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedAdmission(student)}
                            className="p-2 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="View Full File"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setViewingIDCard(student)}
                            className="p-2 rounded bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-slate-950 transition-all border border-yellow-500/10 cursor-pointer"
                            title="Issue Pass"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setViewingProgressCard(student)}
                            className="p-2 rounded bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 transition-all border border-emerald-500/10 cursor-pointer"
                            title="Progress Card"
                          >
                            <Award className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => deleteAdmissionRecord(student.id)}
                            className="p-2 rounded bg-red-500/10 hover:bg-red-650 text-red-500 hover:text-white transition-all border border-red-500/10 cursor-pointer"
                            title="Erase Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
        )}

        {/* TAB 2: Dynamic Karate Batches management console */}
        {adminTab === 'batches' && (
          <div className="space-y-6">
            {batchesLoading ? (
              <BatchesGridSkeleton />
            ) : batches.length === 0 ? (
              <div className="bg-slate-905 border border-zinc-900/60 rounded-2xl p-16 text-center space-y-6 max-w-xl mx-auto">
                <div className="bg-yellow-500/5 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-yellow-500">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-title text-base font-bold text-white uppercase tracking-wider">No Batches Configured</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed max-w-sm mx-auto mt-2">
                    Initialize your Karate Dojo by setting up batch programs. These listings update admission form choices automatically.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={seedDefaultBatches}
                    className="font-heading font-black text-[10px] uppercase tracking-wider hover:bg-zinc-900 border border-zinc-805 text-zinc-350 px-5 py-3 rounded-lg transition-all cursor-pointer"
                  >
                    Seed Standard Presets
                  </button>
                  <button
                    onClick={openCreateBatchModal}
                    className="font-heading font-black text-[10px] uppercase tracking-wider bg-yellow-500 hover:bg-yellow-400 text-slate-950 px-5 py-3 rounded-lg transition-all shadow cursor-pointer"
                  >
                    Create Custom Batch
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {batches.map((b) => {
                  const enrolledCount = admissions.filter(
                    (a) => a.batch.toLowerCase().trim() === b.name.toLowerCase().trim()
                  ).length;

                  return (
                    <div 
                      key={b.id} 
                      className="group relative flex flex-col bg-slate-900/40 border border-zinc-900 overflow-hidden rounded-xl transition-all duration-300 hover:border-yellow-500/30 hover:-translate-y-1"
                    >
                      <div className="absolute top-0 inset-x-0 h-[3px] bg-zinc-850 group-hover:bg-yellow-500 transition-all duration-300" />
                      
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">
                            {b.ageGroup || "All Age Groups"}
                          </span>
                        </div>
                        <h3 className="font-title text-base font-black text-white group-hover:text-yellow-500 transition-colors uppercase leading-tight mb-4">
                          {b.name}
                        </h3>

                        {/* Times & Days details */}
                        <div className="bg-slate-950/60 border border-zinc-900/50 p-3 rounded-lg mb-4 space-y-2 text-[10px] font-mono">
                          <div className="flex items-start space-x-2 text-zinc-400">
                            <Calendar className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                            <span>{b.days}</span>
                          </div>
                          <div className="flex items-start space-x-2 text-zinc-400">
                            <Clock className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                            <span className="text-zinc-300 font-bold">{b.timing}</span>
                          </div>
                        </div>

                        {/* Coaches row */}
                        {b.coaches && (
                          <div className="flex items-center space-x-2.5 bg-yellow-500/[0.04] border border-yellow-500/10 p-2.5 rounded-lg mb-4 text-[10px] leading-tight">
                            <Users className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                            <div>
                              <span className="text-[8px] uppercase tracking-widest text-zinc-500 block font-bold font-sans">INSTRUCTORS</span>
                              <span className="text-zinc-300 font-semibold mt-0.5 block font-sans">{b.coaches}</span>
                            </div>
                          </div>
                        )}

                        {/* Curriculum focus info */}
                        <div className="text-[11px] leading-relaxed text-zinc-400 mb-6 flex-grow font-sans">
                          <span className="text-[8px] uppercase font-mono tracking-widest text-[#FF3B3F] block font-bold mb-0.5">Focus Syllabus</span>
                          <p className="italic text-zinc-400">"{b.focus || "Traditional shotokan mechanics & defensive principles"}"</p>
                        </div>

                        {/* Enrolled Students statistics connector and views trigger */}
                        <div className="flex items-center justify-between bg-zinc-950/50 border border-zinc-900 p-3 rounded-lg mb-4 text-xs font-mono">
                          <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">ENROLLMENT ROSTER</span>
                          <button
                            onClick={() => setViewingEnrolledBatch(b)}
                            className="font-bold text-yellow-500 px-2 py-1 rounded bg-yellow-500/10 hover:bg-yellow-500 hover:text-slate-950 border border-yellow-500/10 transition-all text-[11px] cursor-pointer"
                          >
                            {enrolledCount} {enrolledCount === 1 ? 'Student' : 'Students'} &rarr;
                          </button>
                        </div>                        {/* Card bottom footer editing deleting */}
                        <div className="pt-4 border-t border-zinc-900 flex items-center justify-end text-xs font-mono mt-auto">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openEditBatchModal(b)}
                              className="p-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-500 transition-all cursor-pointer"
                              title="Edit Timings"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBatch(b.id)}
                              className="p-1.5 rounded bg-red-950/10 border border-red-500/10 hover:border-red-500 text-red-500/85 hover:text-white transition-all cursor-pointer"
                              title="Erase Batch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Site Videos Configuration Console */}
        {adminTab === 'site_settings' && (
          <div className="bg-slate-905 border border-zinc-900/60 rounded-2xl p-6 sm:p-10 max-w-3xl mx-auto space-y-8 animate-fade-in">
            <div className="flex items-center space-x-3.5 border-b border-zinc-900 pb-5">
              <div className="p-2.5 bg-yellow-500/10 text-yellow-500 rounded-lg">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base uppercase text-white tracking-wider">Dynamic Video Administration</h3>
                <p className="text-[11px] font-medium text-zinc-500 mt-0.5">Customize background loops and live Dojo session videos instantly.</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Hero Background Video field */}
              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">
                  Hero Section Background Video URL
                </label>
                <input
                  type="text"
                  value={heroVideoInput}
                  onChange={(e) => setHeroVideoInput(e.target.value)}
                  placeholder="e.g. https://example.com/club_hero_loop.mp4"
                  className="w-full bg-slate-950/80 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-yellow-500/50 transition-all font-mono placeholder:text-zinc-650"
                />
                <span className="block text-[10px] text-zinc-500 leading-normal">
                  Requires direct MP4 links, YouTube URL structures, or local relative files (e.g., <code className="text-zinc-400 font-mono bg-zinc-950 px-1 py-0.5 rounded text-[9px]">/hero.mp4</code>). Leave blank to revert to traditional Dojo loops automatically.
                </span>
              </div>

              {/* Dojo Live Practice Video URL (About Section) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">
                  Dojo Live Practice Video URL (About Section)
                </label>
                <input
                  type="text"
                  value={aboutVideoInput}
                  onChange={(e) => setAboutVideoInput(e.target.value)}
                  placeholder="e.g. https://example.com/dojo_practice.mp4"
                  className="w-full bg-slate-950/80 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-yellow-500/50 transition-all font-mono placeholder:text-zinc-650"
                />
                <span className="block text-[10px] text-zinc-500 leading-normal">
                  Requires direct MP4 links, YouTube URL structures, or local files (e.g., <code className="text-zinc-400 font-mono bg-zinc-950 px-1 py-0.5 rounded text-[9px]">/about_video.mp4</code>). Unmute volume toggle is equipped automatically.
                </span>
              </div>

              {/* Student Kata Showcase Video URL Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">
                    Kata Video 1: Individual Drill
                  </label>
                  <input
                    type="text"
                    value={kataVideoInput}
                    onChange={(e) => setKataVideoInput(e.target.value)}
                    placeholder="e.g. https://example.com/kata_1.mp4"
                    className="w-full bg-slate-950/80 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-yellow-500/50 transition-all font-mono placeholder:text-zinc-650"
                  />
                  <span className="block text-[10px] text-zinc-500 leading-normal">
                    Enter the direct MP4 URL or Cloudinary URL for the Individual Speed Drill video.
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">
                    Kata Video 2: Group Showcase
                  </label>
                  <input
                    type="text"
                    value={kataVideoInput2}
                    onChange={(e) => setKataVideoInput2(e.target.value)}
                    placeholder="e.g. https://example.com/kata_2.mp4"
                    className="w-full bg-slate-950/80 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-yellow-500/50 transition-all font-mono placeholder:text-zinc-650"
                  />
                  <span className="block text-[10px] text-zinc-500 leading-normal">
                    Enter the direct MP4 URL or Cloudinary URL for the synchronized Group Showcase video.
                  </span>
                </div>
              </div>

              {/* WhatsApp Auto-Alert server integration configuration */}
              <div className="border-t border-zinc-900/60 pt-6 space-y-5">
                <div className="flex items-center space-x-3.5 pb-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-sm uppercase text-white tracking-wider">WhatsApp Auto-Alert Server Integration</h3>
                    <p className="text-[10px] font-medium text-zinc-500 mt-0.5">Receive instant WhatsApp alerts automatically as soon as any student registers or submits inquiries.</p>
                  </div>
                </div>

                {/* Enable toggle switches */}
                <div className="flex items-center space-x-3 bg-zinc-950/40 p-3.5 border border-zinc-900/60 rounded-xl">
                  <input
                    type="checkbox"
                    id="waEnabled"
                    checked={waEnabled}
                    onChange={(e) => setWaEnabled(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <label htmlFor="waEnabled" className="text-xs text-zinc-300 font-medium select-none cursor-pointer">
                    Enable automatic background alerts on student admission forms and quick register inquiries.
                  </label>
                </div>

                {waEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in text-left">
                    {/* Admin WhatsApp Number phone prefix */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-mono text-zinc-400 font-extrabold uppercase tracking-wider">
                        My WhatsApp Phone Number (with Country Code)
                      </label>
                      <input
                        type="text"
                        value={waPhoneNumber}
                        onChange={(e) => setWaPhoneNumber(e.target.value)}
                        placeholder="e.g. 919049688172 (No spaces, pluses or dashes)"
                        className="w-full bg-slate-950/80 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-emerald-500/50 transition-all font-mono placeholder:text-zinc-650"
                      />
                      <span className="block text-[8px] text-zinc-500">
                        Include prefix code (e.g. <code className="font-mono text-zinc-400">91</code> for India, <code className="font-mono text-zinc-400">1</code> for US). Avoid leading sign (+).
                      </span>
                    </div>

                    {/* CallMeBot key credentials API key */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-mono text-zinc-400 font-extrabold uppercase tracking-wider">
                        CallMeBot Free API Key (Apikey)
                      </label>
                      <input
                        type="text"
                        value={waApiKey}
                        onChange={(e) => setWaApiKey(e.target.value)}
                        placeholder="e.g. 783295"
                        className="w-full bg-slate-950/80 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-emerald-500/50 transition-all font-mono placeholder:text-zinc-650"
                      />
                      <span className="block text-[8px] text-zinc-500">
                        Required to dispatch free WhatsApp API streams continuously directly into your inbox.
                      </span>
                    </div>

                    {/* Obtain instructions block guide box */}
                    <div className="md:col-span-2 bg-emerald-950/10 border border-emerald-500/10 p-4 rounded-xl space-y-2 text-left">
                      <span className="block font-heading font-black text-[9px] text-emerald-400 uppercase tracking-widest">
                        ⚡ Quick Guide: Obtain Free CallMeBot API Key in 60 Seconds:
                      </span>
                      <ol className="list-decimal list-inside text-[9px] text-zinc-400 leading-relaxed font-mono space-y-1">
                        <li>
                          Save one of CallMeBot's active bot numbers as a contact:
                          <ul className="list-disc list-inside pl-4 mt-0.5 space-y-0.5 text-[8px] text-zinc-500">
                            <li>Primary Bot: <strong className="text-emerald-400 select-all">+34 694 23 67 31</strong></li>
                            <li>Backup Bot A: <strong className="text-zinc-300 select-all">+34 623 78 64 49</strong></li>
                            <li>Backup Bot B: <strong className="text-zinc-300 select-all">+34 644 97 50 14</strong></li>
                          </ul>
                        </li>
                        <li className="mt-1">Send a WhatsApp message containing: <strong className="text-emerald-400 select-all">I allow callmebot to send me messages</strong></li>
                        <li>The bot will instantly reply with your personalized <strong className="text-zinc-300 font-bold">Apikey</strong> (e.g. <span className="text-yellow-500 font-bold">129482</span>). Copy and paste it here!</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>

              {/* Uploaded File Helper Alert Info */}
              <div className="bg-red-400/[0.03] border border-red-500/10 p-4.5 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-zinc-400 font-mono">
                  <span className="text-zinc-350 font-bold block uppercase tracking-wider mb-1">To use your uploaded Karate videos:</span>
                  1. Simply paste your host URL or cloud-hosted link dynamically above.<br />
                  2. Or if you uploaded the file via repository editor, use relative file coordinates (e.g. <code className="text-yellow-500 bg-black/40 px-1 py-0.5 rounded">/hero.mp4</code> or <code className="text-yellow-500 bg-black/40 px-1 py-0.5 rounded">/about_video.mp4</code>).
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  {settingsSuccess && (
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                      <Check className="w-4 h-4 text-emerald-400" />
                      Configuration saved successfully!
                    </span>
                  )}
                  {settingsError && (
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-red-500" />
                      {settingsError}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="w-full sm:w-auto font-heading font-black text-xs uppercase tracking-widest bg-yellow-500 hover:bg-yellow-400 text-slate-950 px-8 py-3.5 rounded shadow hover:shadow-yellow-500/25 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {settingsSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>SAVING CHANGES...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>APPLY DIRECTORIES</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: EXAMS & BELT GRADING TAB CONTENT */}
        {adminTab === 'exams' && (
          <div className="space-y-6 animate-fade-in">
            {/* Sub-Tabs Selector */}
            <div className="flex border-b border-zinc-900 gap-4 mb-2">
              <button
                onClick={() => setExamsSubTab('applications')}
                className={`py-3 px-1.5 text-xs font-heading font-black tracking-widest uppercase transition-all border-b-2 cursor-pointer ${
                  examsSubTab === 'applications'
                    ? 'border-yellow-500 text-yellow-500'
                    : 'border-transparent text-zinc-500 hover:text-white'
                }`}
              >
                Candidate Registrations ({exams.length})
              </button>
              <button
                onClick={() => setExamsSubTab('schedules')}
                className={`py-3 px-1.5 text-xs font-heading font-black tracking-widest uppercase transition-all border-b-2 cursor-pointer ${
                  examsSubTab === 'schedules'
                    ? 'border-yellow-500 text-yellow-500'
                    : 'border-transparent text-zinc-500 hover:text-white'
                }`}
              >
                Exam Manager / Schedules ({examSchedules.length})
              </button>
            </div>

            {examsSubTab === 'applications' && (
              <div className="space-y-6">
                {/* Live Exam Day Attendance & QR Code Signboard Panel */}
                <div className="bg-slate-905 border border-zinc-900 rounded-2xl p-6 flex flex-col lg:flex-row justify-between items-center gap-6 shadow-xl relative overflow-hidden">
                  {/* Subtle red martial stripe */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF3B3F]" />
                  
                  <div className="space-y-4 max-w-xl text-left pl-2 w-full lg:w-auto">
                    <div>
                      <div className="inline-flex items-center space-x-2 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full mb-2">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping" />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-yellow-500">Live Exam-Day Attendance Console</span>
                      </div>
                      <h3 className="font-heading font-black text-base uppercase text-white tracking-wide">Smartphone QR Check-In</h3>
                      <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                        Dojo admins can print this QR signboard and display it at the exam entry gate. Parents scan the QR code with their mobile devices, type their child's name, and instantly check them in.
                      </p>
                    </div>

                    {/* Live Statistics Counter with Interactive Filter Toggles */}
                    <div className="grid grid-cols-3 gap-3.5 pt-1.5">
                      <button
                        type="button"
                        onClick={() => setExamAttendanceFilter('all')}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          examAttendanceFilter === 'all'
                            ? 'bg-slate-900 border-yellow-500 shadow-md ring-1 ring-yellow-500/50'
                            : 'bg-slate-950 border-zinc-850 hover:border-zinc-700'
                        }`}
                      >
                        <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-wider block">Registered</span>
                        <span className="font-heading font-black text-xs text-white block mt-0.5 truncate">{exams.length} Students</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setExamAttendanceFilter('present')}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          examAttendanceFilter === 'present'
                            ? 'bg-emerald-950/30 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                            : 'bg-emerald-950/10 border-emerald-900/30 hover:border-emerald-700/50'
                        }`}
                      >
                        <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-wider block">✓ Present ({exams.filter((e: any) => e.checkedIn).length})</span>
                        <span className="font-heading font-black text-xs text-emerald-400 block mt-0.5 truncate">
                          {exams.filter((e: any) => e.checkedIn).length} Students
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExamAttendanceFilter('absent')}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          examAttendanceFilter === 'absent'
                            ? 'bg-red-950/30 border-red-500 shadow-md ring-1 ring-red-500/50'
                            : 'bg-red-950/10 border-red-900/20 hover:border-red-700/50'
                        }`}
                      >
                        <span className="text-[9px] font-mono text-red-400 uppercase tracking-wider block">✗ Absent ({exams.filter((e: any) => !e.checkedIn).length})</span>
                        <span className="font-heading font-black text-xs text-red-400 block mt-0.5 truncate">
                          {exams.filter((e: any) => !e.checkedIn).length} Students
                        </span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={handlePrintQRCheckIn}
                        className="bg-[#FF3B3F] hover:bg-red-600 text-white border border-[#FF3B3F]/30 px-4 py-2 rounded-lg text-[10px] font-heading font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Gate Signboard</span>
                      </button>
                      <button
                        onClick={() => window.open(`${window.location.origin}/#checkin`, '_blank')}
                        className="bg-zinc-900 border border-zinc-850 hover:border-zinc-750 text-zinc-300 hover:text-white px-4 py-2 rounded-lg text-[10px] font-heading font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer"
                        title="Open Check-In page in a new mobile-emulator tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Mobile Check-In Page</span>
                      </button>
                    </div>
                  </div>

                  {/* QR Code Graphic Frame */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-zinc-850 flex flex-col items-center justify-center shrink-0 w-44">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/#checkin')}`}
                      alt="Check-In QR"
                      className="w-32 h-32 bg-white p-1.5 rounded-lg border border-zinc-800"
                    />
                    <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-widest mt-3">Scan to Check-In</span>
                  </div>
                </div>

                {/* Filter & Attendance View Toggle Bar */}
                <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between bg-slate-900/40 border border-zinc-900 p-4.5 rounded-xl overflow-x-auto scrollbar-thin scroll-smooth">
                  {/* Attendance Mode Segmented Toggle Buttons */}
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-zinc-850 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExamAttendanceFilter('all')}
                      className={`px-3.5 py-1.5 rounded-lg text-[10px] font-heading font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                        examAttendanceFilter === 'all'
                          ? 'bg-yellow-500 text-slate-950 shadow-md font-extrabold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      All ({exams.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setExamAttendanceFilter('present')}
                      className={`px-3.5 py-1.5 rounded-lg text-[10px] font-heading font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                        examAttendanceFilter === 'present'
                          ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                          : 'text-emerald-400/80 hover:text-emerald-300'
                      }`}
                    >
                      ✓ Present ({exams.filter((e: any) => e.checkedIn).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setExamAttendanceFilter('absent')}
                      className={`px-3.5 py-1.5 rounded-lg text-[10px] font-heading font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                        examAttendanceFilter === 'absent'
                          ? 'bg-red-500 text-white shadow-md font-extrabold'
                          : 'text-red-400/80 hover:text-red-300'
                      }`}
                    >
                      ✗ Absent ({exams.filter((e: any) => !e.checkedIn).length})
                    </button>
                  </div>

                  <div className="relative w-full xl:w-64 shrink-0">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-550 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Query Roll ID or Name..."
                      value={examSearch}
                      onChange={(e) => setExamSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-zinc-855 py-2 pl-10 pr-4 rounded-lg text-xs font-medium text-white focus:outline-none focus:border-yellow-500 placeholder:text-zinc-650"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold font-mono whitespace-nowrap">STATUS:</span>
                      <select
                        value={examStatusFilter}
                        onChange={(e: any) => setExamStatusFilter(e.target.value)}
                        className="bg-slate-950 border border-zinc-850 py-2 px-3 rounded-lg text-xs font-medium text-zinc-350 focus:outline-none hover:border-zinc-800"
                      >
                        <option value="all">All Submissions</option>
                        <option value="pending">Review Pending</option>
                        <option value="approved">Slot Approved</option>
                        <option value="passed">Completed Passed</option>
                        <option value="failed">Requires Review</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleAdminToggleExamMode(!isExamActive)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-heading font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 whitespace-nowrap shadow-md ${
                        isExamActive
                          ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-extrabold shadow-emerald-500/20'
                          : 'bg-[#FF2A35]/10 text-[#FF2A35] border border-[#FF2A35]/30 hover:bg-[#FF2A35]/20'
                      }`}
                      title="Toggle whether parents can check in on Belt Exam day"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>{isExamActive ? '🟢 Exam Day Active (Click to Close)' : '⚡ Activate Exam Day Mode'}</span>
                    </button>

                    <button
                      onClick={handleDownloadExamsCSV}
                      className="bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-slate-950 border border-yellow-500/20 px-3.5 py-2 rounded-lg text-xs font-heading font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer shrink-0 whitespace-nowrap"
                      title="Download the currently filtered list as an Excel/CSV Sheet"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Sheet</span>
                    </button>

                    <button
                      onClick={() => setBulkGradingModalOpen(true)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-400/30 px-3.5 py-2 rounded-lg text-xs font-heading font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 whitespace-nowrap shadow-md hover:shadow-amber-500/20 active:scale-95"
                      title="Grade all students at once with 7-discipline evaluation and custom grades"
                    >
                      <Award className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                      <span>⚡ Bulk Grade Students</span>
                    </button>

                    <button
                      onClick={async () => {
                        const hasUnpublished = exams.some((e: any) => !e.isPublished && (e.status === 'passed' || e.status === 'failed'));
                        const targetState = hasUnpublished;
                        const actionName = targetState ? 'PUBLISH' : 'UNPUBLISH';
                        if (!window.confirm(`Are you sure you want to ${actionName} all graded exam results for parent portal view?`)) return;
                        try {
                          await Promise.all(
                            exams.map(async (e: any) => {
                              if (e.status === 'passed' || e.status === 'failed') {
                                await updateDoc(doc(db, 'exams', e.id), { isPublished: targetState, updatedAt: Date.now() });
                                if (targetState && e.status === 'passed') {
                                  const targetStudent = admissions.find(s => 
                                    (s.studentId || '').trim().toUpperCase() === (e.studentId || '').trim().toUpperCase()
                                  );
                                  if (targetStudent) {
                                    await updateDoc(doc(db, 'admissions', targetStudent.id), {
                                      beltLevel: e.targetBelt,
                                      updatedAt: Date.now()
                                    });
                                  }
                                }
                              }
                            })
                          );
                          alert(`Successfully ${actionName.toLowerCase()}ed all exam results!`);
                        } catch (err) {
                          console.error("Bulk publish error:", err);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-heading font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
                        exams.some((e: any) => e.isPublished)
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30'
                          : 'bg-purple-600 text-white hover:bg-purple-500 shadow-md'
                      }`}
                      title="Publish or unpublish all exam results for parent portal"
                    >
                      <Award className="w-4 h-4" />
                      <span>{exams.some((e: any) => !e.isPublished && (e.status === 'passed' || e.status === 'failed')) ? '📢 Publish All Results' : '🔒 Unpublish All'}</span>
                    </button>

                    <button
                      onClick={() => {
                        const generalUrl = `${window.location.origin}${window.location.pathname}#check-results`;
                        const msg = `🥋 *LIONS KARATE CLUB PUNE - CHECK BELT EXAM RESULTS* 🥋\n\nDear Parents & Students,\nThe official Karate Belt Grading Exam results have been published!\n\n👇 *Click link below and enter your Student ID / Roll No to check results & certificates:* \n${generalUrl}\n\nOSS! 🥋`;
                        
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(msg).then(() => {
                            alert("General Result Checking Link & WhatsApp message copied to clipboard!");
                          }).catch(() => {});
                        }

                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 px-3.5 py-2 rounded-lg text-xs font-heading font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                      title="Copy general exam results checking link to share on WhatsApp broadcast group"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      <span>📲 Share Group Link</span>
                    </button>
                  </div>
                </div>

                {/* Absent Students Quick Roster Callout Banner if 'absent' filter is active */}
                {examAttendanceFilter === 'absent' && (
                  <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-red-400">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        <h4 className="font-heading font-black text-xs uppercase tracking-wider">
                          Absent Candidates List ({exams.filter((e: any) => !e.checkedIn).length} Students)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        Showing students who have NOT checked in yet
                      </span>
                    </div>

                    {exams.filter((e: any) => !e.checkedIn).length === 0 ? (
                      <p className="text-xs text-emerald-400 font-bold">🎉 All registered students are PRESENT! Zero candidates absent.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                        {exams
                          .filter((e: any) => !e.checkedIn)
                          .map((absentCandidate: any) => (
                            <div key={absentCandidate.id} className="bg-slate-950 border border-zinc-850 p-2.5 rounded-lg flex items-center justify-between text-left">
                              <div className="space-y-0.5 min-w-0 pr-2">
                                <span className="font-heading font-black text-xs text-white uppercase block truncate">
                                  {absentCandidate.studentName}
                                </span>
                                <span className="font-mono text-[10px] text-yellow-500 block">
                                  ID: {absentCandidate.studentId}
                                </span>
                                {absentCandidate.parentPhone && (
                                  <span className="text-[10px] text-zinc-400 block truncate">
                                    📞 {absentCandidate.parentPhone}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={async () => {
                                  try {
                                    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                    await updateDoc(doc(db, 'exams', absentCandidate.id), {
                                      checkedIn: true,
                                      checkInTime: timeString,
                                      checkInTimestamp: Date.now(),
                                      updatedAt: Date.now()
                                    });
                                  } catch (err) {
                                    console.error("Failed to mark present:", err);
                                  }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-heading font-black uppercase px-2.5 py-1.5 rounded transition-all cursor-pointer shrink-0"
                              >
                                Mark Present
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {examsLoading && (
                  <ExamsTableSkeleton />
                )}

                {!examsLoading && (
                  <div className="bg-slate-905 border border-zinc-900 overflow-hidden rounded-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-950 text-zinc-450 text-[10px] uppercase font-bold tracking-wider font-mono border-b border-zinc-900">
                            <th className="py-4 px-6 min-w-[160px]">Student details</th>
                            <th className="py-4 px-6 min-w-[120px]">Dojo training Branch</th>
                            <th className="py-4 px-6 min-w-[120px]">Current & Target Belt</th>
                            <th className="py-4 px-6 min-w-[110px]">Registry state</th>
                            <th className="py-4 px-6 min-w-[110px]">Score & Comments</th>
                            <th className="py-4 pl-6 pr-8 text-right min-w-[180px]">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/40 text-xs">
                          {exams
                            .filter(item => {
                              const sQuery = examSearch.toLowerCase();
                              const matchQuery = item.studentId.toLowerCase().includes(sQuery) || 
                                item.studentName.toLowerCase().includes(sQuery) ||
                                (item.parentName && item.parentName.toLowerCase().includes(sQuery)) ||
                                (item.parentPhone && item.parentPhone.includes(sQuery));
                              const matchStatus = examStatusFilter === 'all' || item.status === examStatusFilter;
                              const matchAttendance = 
                                examAttendanceFilter === 'all' ? true :
                                examAttendanceFilter === 'present' ? item.checkedIn :
                                !item.checkedIn;
                              return matchQuery && matchStatus && matchAttendance;
                            })
                            .map((item) => {
                              return (
                                <tr key={item.id} className="hover:bg-slate-900/15 transition-colors">
                                  <td className="py-4.5 px-6 text-left min-w-[160px] whitespace-normal">
                                    {editingCandidateId === item.id ? (
                                      <div className="space-y-1.5 mt-1">
                                        <input
                                          type="text"
                                          value={editingCandidateNewId}
                                          onChange={(e) => setEditingCandidateNewId(e.target.value.toUpperCase())}
                                          placeholder="LKCP-..."
                                          className="bg-slate-950 border border-zinc-800 text-white rounded px-2.5 py-1 text-xs font-mono w-32 focus:outline-none focus:border-yellow-500"
                                        />
                                        <div className="flex gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleSaveCandidateId(item)}
                                            className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                                          >
                                            Save
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingCandidateId(null)}
                                            className="bg-zinc-850 hover:bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="font-heading font-black text-yellow-500 font-mono tracking-wider block">{item.studentId}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingCandidateId(item.id);
                                            setEditingCandidateNewId(item.studentId);
                                          }}
                                          className="text-zinc-500 hover:text-yellow-500 text-[9px] font-bold uppercase underline cursor-pointer"
                                          title="Edit Student ID"
                                        >
                                          Edit ID
                                        </button>
                                      </div>
                                    )}
                                    {(() => {
                                      const matchedStudent = admissions.find(adm => 
                                        (adm.studentId && item.studentId && adm.studentId.trim().toUpperCase() === item.studentId.trim().toUpperCase()) ||
                                        (adm.fullName && item.studentName && adm.fullName.trim().toLowerCase() === item.studentName.trim().toLowerCase())
                                      );
                                      const liveStudentName = matchedStudent?.fullName || item.studentName;
                                      const liveParentName = matchedStudent?.parentName || item.parentName;
                                      const liveSchoolName = matchedStudent?.schoolName || item.schoolName;
                                      const liveParentPhone = matchedStudent?.phone || item.parentPhone;
                                      const liveCoachName = matchedStudent?.coachName || item.coachName;

                                      return (
                                        <>
                                          <span className="text-white font-extrabold uppercase mt-1 block">{liveStudentName}</span>
                                          {liveParentName && <span className="text-zinc-400 text-[10px] font-medium mt-0.5 block">Parent: <strong className="text-zinc-300 font-semibold">{liveParentName}</strong></span>}
                                          {liveSchoolName && <span className="text-yellow-500/80 text-[10px] font-semibold mt-0.5 block">School: {liveSchoolName}</span>}
                                          {liveParentPhone && <span className="text-zinc-500 text-[10px] mt-0.5 block">Phone: {liveParentPhone}</span>}
                                          {liveCoachName && <span className="text-zinc-500 text-[10px] mt-0.5 block">Coach: {liveCoachName}</span>}
                                        </>
                                      );
                                    })()}
                                  </td>
                                  <td className="py-4.5 px-6 text-zinc-400 font-medium text-left min-w-[120px] whitespace-normal">
                                    {item.branch}
                                  </td>
                                  <td className="py-4.5 px-6 text-left font-mono min-w-[120px] whitespace-normal">
                                    <span className="text-zinc-550 block">Current: {item.currentBelt.split(' (')[0]}</span>
                                    <span className="text-emerald-400 font-semibold block mt-1">Target: {item.targetBelt.split(' (')[0]}</span>
                                  </td>
                                  <td className="py-4.5 px-6 text-left min-w-[110px] whitespace-normal">
                                    <div className="space-y-1.5">
                                      {item.status === 'pending' && (
                                        <span className="inline-block bg-yellow-500/10 text-yellow-550 border border-yellow-500/20 text-[9px] font-heading font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                          Pending Approval
                                        </span>
                                      )}
                                      {item.status === 'approved' && (
                                        <span className="inline-block bg-blue-500/10 text-blue-550 border border-blue-500/20 text-[9px] font-heading font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                          Slot Approved
                                        </span>
                                      )}
                                      {item.status === 'passed' && (
                                        <span className="inline-block bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[9px] font-heading font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                          Completed Passed
                                        </span>
                                      )}
                                      {item.status === 'failed' && (
                                        <span className="inline-block bg-red-500/10 text-red-450 border border-red-500/25 text-[9px] font-heading font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                          Requires Review
                                        </span>
                                      )}

                                      <div className="block mt-1">
                                        <span className={`inline-block text-[9px] font-heading font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                          item.feesStatus === 'Paid'
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}>
                                          Fees: {item.feesStatus || 'Pending'}
                                        </span>
                                      </div>

                                      <div className="block mt-1">
                                        {item.checkedIn ? (
                                          <span className="inline-block bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[9px] font-heading font-black px-2 py-0.5 rounded uppercase tracking-wider" title={`Checked-in at ${item.checkInTime}`}>
                                            ✓ Present ({item.checkInTime || 'Confirmed'})
                                          </span>
                                        ) : (
                                          <span className="inline-block bg-zinc-900 text-zinc-500 border border-zinc-800 text-[9px] font-heading font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                            ✗ Absent
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4.5 px-6 text-left min-w-[110px] whitespace-normal">
                                    {item.grade ? (
                                      <div>
                                        <span className="text-white font-bold block">Grade: {item.grade}</span>
                                        {item.remarks && <span className="text-zinc-500 text-[10px] block truncate max-w-xs mt-0.5" title={item.remarks}>{item.remarks}</span>}
                                      </div>
                                    ) : (
                                      <span className="text-zinc-655 italic">Not graded yet</span>
                                    )}
                                  </td>
                                  <td className="py-4.5 pl-6 pr-8 text-right min-w-[180px]">
                                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                                      {item.status === 'pending' && (
                                        <button
                                          onClick={() => handleApproveExamSlot(item.id)}
                                          className="bg-blue-600 hover:bg-blue-550 text-white text-[9px] font-heading font-black uppercase tracking-wider px-2 py-1 rounded transition-all cursor-pointer"
                                          title="Confirm exam slot or fee payment"
                                        >
                                          Approve
                                        </button>
                                      )}

                                      {/* Toggle for Fees Status in Admin for easy management */}
                                      <button
                                        onClick={async () => {
                                          try {
                                            const newFees = item.feesStatus === 'Paid' ? 'Pending' : 'Paid';
                                            await updateDoc(doc(db, 'exams', item.id), {
                                              feesStatus: newFees,
                                              updatedAt: Date.now()
                                            });
                                          } catch (err) {
                                            console.error("Failed to toggle fees status:", err);
                                          }
                                        }}
                                        className="bg-zinc-900 border border-zinc-800 hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-500 text-[9px] font-heading font-black uppercase tracking-wider px-2 py-1 rounded transition-all cursor-pointer"
                                        title="Toggle fee status"
                                      >
                                        Toggle Fee
                                      </button>

                                      {/* Manual attendance checkin toggle */}
                                      <button
                                        onClick={async () => {
                                          try {
                                            const newCheckedIn = !item.checkedIn;
                                            const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                            await updateDoc(doc(db, 'exams', item.id), {
                                              checkedIn: newCheckedIn,
                                              checkInTime: newCheckedIn ? timeString : null,
                                              checkInTimestamp: newCheckedIn ? Date.now() : null,
                                              updatedAt: Date.now()
                                            });
                                          } catch (err) {
                                            console.error("Failed to toggle attendance:", err);
                                          }
                                        }}
                                        className={`text-[9px] font-heading font-black uppercase tracking-wider px-2 py-1 rounded transition-all cursor-pointer ${
                                          item.checkedIn
                                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/30'
                                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#FF3B3F] hover:border-[#FF3B3F]/20'
                                        }`}
                                        title="Toggle student present/absent state manually"
                                      >
                                        {item.checkedIn ? 'Mark Absent' : 'Check In'}
                                      </button>

                                      {/* Share direct WhatsApp result link button */}
                                      <button
                                        onClick={() => {
                                          const directUrl = `${window.location.origin}${window.location.pathname}#check-results?studentId=${encodeURIComponent(item.studentId || '')}`;
                                          const msg = `🥋 *LIONS KARATE CLUB PUNE - BELT EXAM RESULT* 🥋\n\nDear Parent/Student (${item.studentName}),\nYour karate belt grading exam result for *${item.targetBelt}* has been published!\n\n👇 *Click link to check official result & belt certificate:* \n${directUrl}\n\nOSS! 🥋`;
                                          
                                          if (navigator.clipboard) {
                                            navigator.clipboard.writeText(msg).catch(() => {});
                                          }

                                          const phoneClean = (item.parentPhone || '').replace(/\D/g, '');
                                          const waUrl = phoneClean ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
                                          window.open(waUrl, '_blank');
                                        }}
                                        className="bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 text-[9px] font-heading font-black uppercase tracking-wider px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 shrink-0"
                                        title="Send direct result link to parent on WhatsApp"
                                      >
                                        <MessageCircle className="w-3 h-3 text-emerald-400" />
                                        <span>Share Link</span>
                                      </button>

                                      {/* Publish Result toggle for parents view */}
                                      {(item.status === 'passed' || item.status === 'failed') && (
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => openGradingModal(item, item.status)}
                                            className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-[9px] font-heading font-black uppercase tracking-wider px-2 py-1 rounded transition-all cursor-pointer"
                                            title="Edit/Upgrade student grade or feedback"
                                          >
                                            Edit Grade
                                          </button>
                                          <button
                                            onClick={async () => {
                                              try {
                                                const newPublished = !item.isPublished;
                                                await updateDoc(doc(db, 'exams', item.id), {
                                                  isPublished: newPublished,
                                                  updatedAt: Date.now()
                                                });
                                                if (newPublished && item.status === 'passed') {
                                                  const targetStudent = admissions.find(s => 
                                                    (s.studentId || '').trim().toUpperCase() === (item.studentId || '').trim().toUpperCase() &&
                                                    (s.fullName || '').trim().toLowerCase() === (item.studentName || '').trim().toLowerCase()
                                                  ) || admissions.find(s => 
                                                    (s.studentId || '').trim().toUpperCase() === (item.studentId || '').trim().toUpperCase()
                                                  );
                                                  if (targetStudent) {
                                                    await updateDoc(doc(db, 'admissions', targetStudent.id), {
                                                      beltLevel: item.targetBelt,
                                                      updatedAt: Date.now()
                                                    });
                                                  }
                                                }
                                              } catch (err) {
                                                console.error("Failed to toggle publish status:", err);
                                              }
                                            }}
                                            className={`text-[9px] font-heading font-black uppercase tracking-wider px-2 py-1 rounded transition-all cursor-pointer ${
                                              item.isPublished
                                                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30 hover:bg-purple-600/40'
                                                : 'bg-purple-600 text-white hover:bg-purple-500'
                                            }`}
                                            title={item.isPublished ? "Click to unpublish result from parent portal" : "Click to publish result to parent portal"}
                                          >
                                            {item.isPublished ? '📢 Published' : '🔒 Publish Result'}
                                          </button>
                                        </div>
                                      )}
                                      
                                      {item.status === 'approved' && (
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => openGradingModal(item, 'passed')}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-heading font-black uppercase tracking-widest px-2 py-1 rounded transition-all cursor-pointer"
                                            title="Assessed and passed"
                                          >
                                            Pass
                                          </button>
                                          <button
                                            onClick={() => openGradingModal(item, 'failed')}
                                            className="bg-red-650 hover:bg-red-600 text-white text-[9px] font-heading font-black uppercase tracking-widest px-2 py-1 rounded transition-all cursor-pointer"
                                            title="Assessed and failed"
                                          >
                                            Fail
                                          </button>
                                        </div>
                                      )}
                                      
                                      <button
                                        onClick={() => handleDeleteExamRecord(item.id)}
                                        className="p-1 px-1.5 border border-zinc-800 text-zinc-500 hover:text-red-500 hover:bg-red-500/5 rounded transition-all cursor-pointer"
                                        title="Erase Entry"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          {exams.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-20 text-center text-zinc-650">
                                No belt examinations registered on this branch yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {examsSubTab === 'schedules' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-900/40 border border-zinc-900 p-5 rounded-xl">
                  <div>
                    <h3 className="font-heading font-black text-sm uppercase text-white tracking-wider">Exam schedules list</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Manage upcoming examinations, belt targets, venue locations, and entry criteria.</p>
                  </div>
                  <button
                    onClick={openCreateScheduleModal}
                    className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-heading font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all flex items-center space-x-1.5 shadow-md hover:shadow-yellow-500/20 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-slate-950 stroke-[3px]" />
                    <span>Create Exam Schedule</span>
                  </button>
                </div>

                {schedulesLoading && (
                  <SchedulesGridSkeleton />
                )}

                {!schedulesLoading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {examSchedules.map((sched) => (
                      <div key={sched.id} className="bg-slate-905 border border-zinc-900 p-5 rounded-2xl relative shadow-lg flex flex-col justify-between hover:border-zinc-800 transition-all duration-200">
                        <div className="absolute top-4 right-4 flex items-center space-x-1.5">
                          <button
                            onClick={() => openEditScheduleModal(sched)}
                            className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-500 rounded transition-all cursor-pointer"
                            title="Edit Exam"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(sched.id)}
                            className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-red-500/20 text-zinc-400 hover:text-red-500 rounded transition-all cursor-pointer"
                            title="Delete Exam"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-heading font-black text-yellow-500 bg-yellow-500/10 px-2.5 py-0.5 rounded border border-yellow-500/15 uppercase tracking-wider inline-block">
                              {sched.beltLevel.includes('All Belt Levels') ? sched.beltLevel : `Target: ${sched.beltLevel}`}
                            </span>
                            <h4 className="font-title text-base font-black text-white uppercase tracking-tight pt-1 flex items-center gap-2">
                              <Calendar className="w-4.5 h-4.5 text-zinc-500" />
                              {sched.examDate}
                            </h4>
                          </div>

                          <div className="space-y-2.5 text-xs text-zinc-450 border-t border-zinc-900/60 pt-3">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-zinc-550 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Venue / location details</span>
                                <span className="font-mono text-zinc-300">{sched.venueDetails}</span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 text-zinc-550 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Required prerequisites</span>
                                <span className="text-zinc-350 whitespace-pre-line leading-relaxed">{sched.prerequisites}</span>
                              </div>
                            </div>
                          </div>

                          {/* Direct Parent Registration Link Sharer */}
                          <div className="mt-4 bg-zinc-950/40 p-3.5 border border-zinc-900 rounded-xl space-y-2.5 text-left">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] uppercase font-extrabold text-yellow-500/80 tracking-wider">Exam Registration Sharer</span>
                              <span className="text-[9px] text-zinc-500 font-mono">#belt-exam</span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                onClick={() => handleCopyExamRegistrationLink(sched.id)}
                                className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 hover:text-yellow-400 border border-yellow-500/25 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 text-xs font-bold transition-all cursor-pointer"
                              >
                                {copiedSchedId === sched.id ? (
                                  <>
                                    <Check className="w-4 h-4 text-emerald-400 stroke-[3px]" />
                                    <span className="text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Link</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  const directLink = `${window.location.origin}${window.location.pathname}#belt-exam`;
                                  const msg = `🥋 *LIONS KARATE CLUB - BELT EXAM REGISTRATION* \n\nDear Parent,\nRegistration is now open for the upcoming Belt Grading Examination!\n\n📅 *Exam Date:* ${sched.examDate}\n📍 *Venue Details:* ${sched.venueDetails || "Main Dojo Gym"}\n🎯 *Target:* ${sched.beltLevel}\n\n👉 *Please tap the link below to register your child online instantly:* \n${directLink}\n\n_Note: Please make sure to fill in the School Name correctly on the registration form so we can print the official standardized Kyu grade certificates with accurate details!_`;
                                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                                }}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/20 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 text-xs font-bold transition-all cursor-pointer"
                                title="Share registration link directly on WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5 text-emerald-100" />
                                <span>Share on WhatsApp</span>
                              </button>
                            </div>

                            <p className="text-[9px] text-zinc-500 leading-normal text-center">
                              Send this direct registration form link to parents. They can register online from their phone!
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-zinc-900/60 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                          <span>Updated: {new Date(sched.updatedAt).toLocaleDateString()}</span>
                          <span className="text-emerald-500 font-bold bg-emerald-500/5 px-2.5 py-0.5 rounded border border-emerald-500/10 uppercase tracking-widest">Active Schedule</span>
                        </div>
                      </div>
                    ))}

                    {examSchedules.length === 0 && (
                      <div className="col-span-1 md:col-span-2 py-16 text-center text-zinc-650 bg-slate-900/10 border border-zinc-900 rounded-xl">
                        No upcoming exams scheduled yet. Click "Create Exam Schedule" to add entry.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* NESTED SCHEDULER DIALOG MODAL */}
            {schedModalOpen && (
              <div className="fixed inset-0 z-55 overflow-y-auto bg-black/85 backdrop-blur-sm flex justify-center p-4 items-center">
                <div className="bg-slate-900 border border-zinc-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500" />
                  
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between">
                    <span className="font-heading font-black text-xs uppercase tracking-widest text-white">
                      {editingSched ? 'Modify Exam Schedule' : 'Create Exam Schedule'}
                    </span>
                    <button
                      onClick={() => setSchedModalOpen(false)}
                      className="p-1 text-zinc-500 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSaveScheduleSubmit} className="p-6 space-y-4">
                    {schedError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-xs font-medium">
                        {schedError}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">
                        Exam Date & Time
                      </label>
                      <input
                        type="text"
                        value={schedDate}
                        placeholder="e.g. Sunday, Oct 18, 2026 - 10:00 AM"
                        onChange={(e) => setSchedDate(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-medium placeholder:text-zinc-650"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">
                        Target Belt Level
                      </label>
                      <select
                        value={schedBelt}
                        onChange={(e) => setSchedBelt(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-yellow-500"
                        required
                      >
                        <option value="">-- Choose Belt Level --</option>
                        <option value="All Belt Levels (Open Exam)">All Belt Levels (Open Exam)</option>
                        {BELT_LEVELS.map((belt) => (
                          <option key={belt.name} value={belt.name}>{belt.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">
                        Venue / Location Details
                      </label>
                      <input
                        type="text"
                        value={schedVenue}
                        placeholder="e.g. Lions Head Dojo, Shahu Stadium Road, Kohinoor Center"
                        onChange={(e) => setSchedVenue(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-medium placeholder:text-zinc-650"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">
                        Rules & Prerequisites
                      </label>
                      <textarea
                        value={schedPrereq}
                        placeholder="e.g. Minimum 3 Months as Orange Belt, 80% Attendance, Shivan Recommendation"
                        rows={3}
                        onChange={(e) => setSchedPrereq(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-medium placeholder:text-zinc-650 min-h-[80px]"
                        required
                      />
                    </div>

                    <div className="pt-4 border-t border-zinc-850 flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setSchedModalOpen(false)}
                        className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-bold uppercase tracking-widest cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={schedSaving}
                        className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-heading font-black rounded-lg text-xs uppercase tracking-widest flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {schedSaving ? (
                          <>
                            <RefreshCw className="w-3 animate-spin text-slate-950" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Publish Schedule</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {adminTab === 'seo_ai' && (
          <div className="animate-fade-in py-2">
            <SEOVisibilityConsole />
          </div>
        )}

        {adminTab === 'bills' && (
          <div className="animate-fade-in py-2 space-y-6">
            {/* Quick Stats Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/40 border border-zinc-900 p-5 rounded-xl flex items-center space-x-4">
                <div className="p-3 bg-zinc-800 rounded-lg text-zinc-300">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-550 uppercase font-bold block tracking-wider">Total Invoiced</span>
                  <span className="font-mono text-lg sm:text-2xl font-black text-white mt-1 block">
                    ₹{receipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <div className="bg-slate-900/40 border border-zinc-900 p-5 rounded-xl flex items-center space-x-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
                  <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-emerald-500/80 uppercase font-bold block tracking-wider">Total Received</span>
                  <span className="font-mono text-lg sm:text-2xl font-black text-emerald-500 mt-1 block">
                    ₹{receipts.reduce((sum, r) => sum + (r.paidAmount || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <div className="bg-slate-900/40 border border-zinc-900 p-5 rounded-xl flex items-center space-x-4">
                <div className="p-3 bg-red-400/10 rounded-lg text-[#FF3B3F]">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-350 uppercase font-bold block tracking-wider">Outstanding Balance</span>
                  <span className="font-mono text-lg sm:text-2xl font-black text-yellow-500 mt-1 block">
                    ₹{receipts.reduce((sum, r) => sum + (r.balanceAmount || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Section */}
            {!isGeneratingReceipt ? (
              <div className="bg-slate-900/40 border border-zinc-900 rounded-2xl overflow-hidden p-6 space-y-6">
                {/* Search Bar & Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-heading font-black text-lg text-white uppercase tracking-tight">Receipts Log</h3>
                    <p className="text-zinc-500 text-xs mt-1">Manage and print student tuition and uniform fee receipts.</p>
                  </div>
                  <div className="relative max-w-md w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
                    <input
                      type="text"
                      placeholder="Search by receipt # or student name..."
                      value={receiptSearchQuery}
                      onChange={(e) => setReceiptSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                {/* Receipts List */}
                {receiptsLoading ? (
                  <div className="py-12 text-center text-zinc-500 text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-yellow-500" />
                    <span>Loading billing history...</span>
                  </div>
                ) : receipts.length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-zinc-855 rounded-xl space-y-3">
                    <FileText className="w-10 h-10 text-zinc-700 mx-auto" />
                    <p className="text-zinc-500 text-xs">No receipts found in database.</p>
                    <button
                      onClick={() => setIsGeneratingReceipt(true)}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-heading font-black text-[10px] uppercase tracking-widest rounded-lg transition-all"
                    >
                      Create First Receipt
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950 border-b border-zinc-900 text-zinc-500 uppercase font-heading font-black text-[9px] tracking-widest">
                          <th className="py-4 px-6">Receipt #</th>
                          <th className="py-4 px-6">Date</th>
                          <th className="py-4 px-6">Student Bio</th>
                          <th className="py-4 px-6">Fee Particulars</th>
                          <th className="py-4 px-6">Amount Paid</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/40 text-xs">
                        {receipts
                          .filter(r => {
                            const queryLower = receiptSearchQuery.toLowerCase().trim();
                            return !queryLower || 
                              r.receiptNo.toLowerCase().includes(queryLower) ||
                              r.studentName.toLowerCase().includes(queryLower) ||
                              r.studentId?.toLowerCase().includes(queryLower);
                          })
                          .map((receipt) => {
                            const isPaid = (receipt.balanceAmount || 0) <= 0;
                            return (
                              <tr key={receipt.id} className="hover:bg-zinc-900/10 border-b border-zinc-900/20 transition-all">
                                <td className="py-4 px-6 font-mono font-black text-white">LKC-{receipt.receiptNo}</td>
                                <td className="py-4 px-6 text-zinc-400">
                                  {new Date(receipt.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </td>
                                <td className="py-4 px-6">
                                  <div className="font-bold text-white uppercase">{receipt.studentName}</div>
                                  <div className="text-[10px] text-zinc-500 mt-0.5">{receipt.studentId ? `ID: ${receipt.studentId}` : 'Custom Entry'} • {receipt.phone}</div>
                                </td>
                                <td className="py-4 px-6 text-zinc-400">
                                  <div className="max-w-[200px] truncate" title={receipt.items.map(i => i.description).join(', ')}>
                                    {receipt.items.map(i => `${i.description} (₹${i.amount})`).join(', ')}
                                  </div>
                                </td>
                                <td className="py-4 px-6 font-mono font-bold text-white">
                                  ₹{receipt.paidAmount} <span className="text-[10px] text-zinc-500">/ ₹{receipt.totalAmount}</span>
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-rose-500/10 text-rose-400 border border-rose-500/15'}`}>
                                    {isPaid ? 'PAID' : `DUE: ₹${receipt.balanceAmount}`}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => setSelectedReceipt(receipt)}
                                      className="p-1.5 bg-slate-950 border border-zinc-800 hover:border-yellow-500 hover:text-yellow-500 text-zinc-400 rounded transition-all cursor-pointer"
                                      title="View & Print Receipt"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setConfirmDialog({
                                          isOpen: true,
                                          title: 'Delete Receipt',
                                          message: `Are you sure you want to permanently delete receipt LKC-${receipt.receiptNo} for ${receipt.studentName}? This action is irreversible.`,
                                          confirmText: 'Delete',
                                          cancelText: 'Cancel',
                                          onConfirm: async () => {
                                            try {
                                              await deleteDoc(doc(db, 'receipts', receipt.id!));
                                              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                            } catch (err) {
                                              console.error("Delete receipt err: ", err);
                                              alert("Failed to delete receipt.");
                                            }
                                          }
                                        });
                                      }}
                                      className="p-1.5 bg-slate-950 border border-zinc-800 hover:border-red-500 hover:text-red-500 text-zinc-400 rounded transition-all cursor-pointer"
                                      title="Delete Receipt"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveReceipt} className="bg-slate-900/40 border border-zinc-900 rounded-2xl p-6 space-y-6">
                {billError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-lg text-xs font-medium">
                    {billError}
                  </div>
                )}

                {/* Section A: Search and Auto-populate */}
                <div className="bg-slate-950 border border-zinc-900 p-5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-yellow-500 font-extrabold uppercase tracking-widest font-mono">Step 1</span>
                      <h4 className="font-heading font-bold text-sm text-white uppercase mt-0.5">Select Student from Directory</h4>
                    </div>
                    {selectedStudentForReceipt && (
                      <button
                        type="button"
                        onClick={handleClearStudentForReceipt}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Clear Selected Student (Custom Entry)</span>
                      </button>
                    )}
                  </div>

                  {!selectedStudentForReceipt ? (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
                      <input
                        type="text"
                        placeholder="Type student name to search our registered admissions..."
                        value={receiptSearchQuery}
                        onChange={(e) => {
                          setReceiptSearchQuery(e.target.value);
                          setShowStuDropdown(true);
                        }}
                        onFocus={() => setShowStuDropdown(true)}
                        className="w-full bg-slate-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-3 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:border-yellow-500"
                      />

                      {showStuDropdown && receiptSearchQuery.trim() && (
                        <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-zinc-800 rounded-lg shadow-xl max-h-52 overflow-y-auto z-50 divide-y divide-zinc-850">
                          {admissions
                            .filter(a => a.fullName.toLowerCase().includes(receiptSearchQuery.toLowerCase()))
                            .map(student => (
                              <button
                                key={student.id}
                                type="button"
                                onClick={() => {
                                  handleSelectStudentForReceipt(student);
                                  setReceiptSearchQuery('');
                                  setShowStuDropdown(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-xs flex justify-between items-center transition-all cursor-pointer"
                              >
                                <div>
                                  <span className="font-black text-white uppercase">{student.fullName}</span>
                                  <span className="text-[10px] text-zinc-500 ml-2 block sm:inline">Parent: {student.parentName}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-850 px-2 py-0.5 rounded">{student.studentId}</span>
                                </div>
                              </button>
                            ))}
                          {admissions.filter(a => a.fullName.toLowerCase().includes(receiptSearchQuery.toLowerCase())).length === 0 && (
                            <div className="p-4 text-center text-zinc-600 text-xs">No matching student found. Keep typing or enter student details manually below!</div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-zinc-900/30 border border-zinc-850 p-4 rounded-lg flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/15 px-2 py-0.5 rounded uppercase">Connected Student</span>
                        <h5 className="font-heading font-black text-base text-white uppercase">{selectedStudentForReceipt.fullName}</h5>
                        <p className="text-zinc-500 text-[10px]">
                          Roll ID: <strong className="text-zinc-300 font-mono">{selectedStudentForReceipt.studentId}</strong> • Parent: {selectedStudentForReceipt.parentName} • Contact: {selectedStudentForReceipt.phone}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-zinc-400 block font-bold">{selectedStudentForReceipt.beltLevel}</span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">{selectedStudentForReceipt.batch}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section B: Receipt Meta and Bio Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Bill parameters */}
                  <div className="bg-slate-950 border border-zinc-900 p-5 rounded-xl space-y-4">
                    <h4 className="font-heading font-bold text-xs text-white uppercase tracking-wider border-b border-zinc-900 pb-2">Receipt Info</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">Receipt Number</label>
                        <input
                          type="text"
                          value={bReceiptNo}
                          onChange={(e) => setBReceiptNo(e.target.value)}
                          className="w-full bg-slate-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500"
                          placeholder="e.g. 01"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">Receipt Date</label>
                        <input
                          type="date"
                          value={bDate}
                          onChange={(e) => setBDate(e.target.value)}
                          className="w-full bg-slate-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">Payment Method</label>
                      <select
                        value={bPaymentMode}
                        onChange={(e) => setBPaymentMode(e.target.value)}
                        className="w-full bg-slate-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-yellow-500"
                        required
                      >
                        <option value="Cash">Cash (Offline Handover)</option>
                        <option value="GPay">GPay (UPI Transfer)</option>
                        <option value="PhonePe">PhonePe (UPI Transfer)</option>
                        <option value="UPI">Other UPI / QR Code</option>
                        <option value="Bank Transfer">Direct Bank IMPS / NEFT</option>
                        <option value="Card">Credit / Debit Card</option>
                        <option value="Check">Check / DD Instrument</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column: Student details (mostly auto-filled or custom typed) */}
                  <div className="bg-slate-950 border border-zinc-900 p-5 rounded-xl space-y-4">
                    <h4 className="font-heading font-bold text-xs text-white uppercase tracking-wider border-b border-zinc-900 pb-2">Student & Parent Details</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">Student Full Name</label>
                        <input
                          type="text"
                          value={bStudentName}
                          onChange={(e) => setBStudentName(e.target.value)}
                          disabled={!!selectedStudentForReceipt}
                          className="w-full bg-slate-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white disabled:opacity-40 focus:outline-none focus:border-yellow-500"
                          placeholder="e.g. Atharva Pawar"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">Roll ID (Optional)</label>
                        <input
                          type="text"
                          value={bStudentId}
                          onChange={(e) => setBStudentId(e.target.value)}
                          disabled={!!selectedStudentForReceipt}
                          className="w-full bg-slate-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white disabled:opacity-40 focus:outline-none focus:border-yellow-500"
                          placeholder="e.g. LKCP-2026-003"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">Parent Name</label>
                        <input
                          type="text"
                          value={bParentName}
                          onChange={(e) => setBParentName(e.target.value)}
                          disabled={!!selectedStudentForReceipt}
                          className="w-full bg-slate-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white disabled:opacity-40 focus:outline-none focus:border-yellow-500"
                          placeholder="e.g. Sanjay Pawar"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">Contact Phone</label>
                        <input
                          type="text"
                          value={bPhone}
                          onChange={(e) => setBPhone(e.target.value)}
                          disabled={!!selectedStudentForReceipt}
                          className="w-full bg-slate-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white disabled:opacity-40 focus:outline-none focus:border-yellow-500"
                          placeholder="e.g. +91 98765 43210"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C: Itemization Table */}
                <div className="bg-slate-950 border border-zinc-900 p-5 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-3">
                    <div>
                      <span className="text-[10px] text-yellow-500 font-extrabold uppercase tracking-widest font-mono">Step 2</span>
                      <h4 className="font-heading font-bold text-sm text-white uppercase mt-0.5">Itemized Invoice Particulars</h4>
                    </div>
                    {/* Presets Helper */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newId = String(Date.now() + Math.random());
                          setBItems([...bItems, { id: newId, description: 'Monthly Tuition Fee', amount: 1500 }]);
                          setBPaidAmount((prev) => (Number(prev) || 0) + 1500);
                        }}
                        className="px-2.5 py-1 text-[9px] font-black bg-zinc-900 border border-zinc-800 hover:border-yellow-500 hover:text-yellow-500 text-zinc-400 rounded transition-all cursor-pointer uppercase"
                      >
                        + Monthly Fees (₹1500)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newId = String(Date.now() + Math.random());
                          setBItems([...bItems, { id: newId, description: 'Karate Gi (Official Uniform)', amount: 1200 }]);
                          setBPaidAmount((prev) => (Number(prev) || 0) + 1200);
                        }}
                        className="px-2.5 py-1 text-[9px] font-black bg-zinc-900 border border-zinc-800 hover:border-yellow-500 hover:text-yellow-500 text-zinc-400 rounded transition-all cursor-pointer uppercase"
                      >
                        + Karate Gi (₹1200)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newId = String(Date.now() + Math.random());
                          setBItems([...bItems, { id: newId, description: 'Belt Grading Examination Fee', amount: 800 }]);
                          setBPaidAmount((prev) => (Number(prev) || 0) + 800);
                        }}
                        className="px-2.5 py-1 text-[9px] font-black bg-zinc-900 border border-zinc-800 hover:border-yellow-500 hover:text-yellow-500 text-zinc-400 rounded transition-all cursor-pointer uppercase"
                      >
                        + Belt Exam (₹800)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {bItems.map((item, index) => (
                      <div key={item.id} className="flex gap-4 items-center">
                        <span className="text-[10px] font-mono font-bold text-zinc-550 w-6 text-center">#{index + 1}</span>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                            placeholder="Description (e.g. Monthly Tuition Fee - July)"
                            className="w-full bg-slate-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500"
                            required
                          />
                        </div>
                        <div className="w-32">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">₹</span>
                            <input
                              type="number"
                              value={item.amount || ''}
                              onChange={(e) => handleItemChange(item.id, 'amount', Number(e.target.value))}
                              placeholder="0"
                              className="w-full bg-slate-900 border border-zinc-800 rounded-lg pl-6 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 font-mono text-right"
                              required
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={bItems.length === 1}
                          className="p-2.5 border border-zinc-800 hover:border-red-500 hover:text-red-500 text-zinc-500 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 flex justify-start">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Line Item</span>
                    </button>
                  </div>
                </div>

                {/* Section D: Pricing Totals Bottom Sheet */}
                <div className="bg-slate-950 border border-zinc-900 p-5 rounded-xl">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex-1 space-y-1.5">
                      <label className="block text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">Receipt Remarks / Payment Details</label>
                      <textarea
                        value={bRemarks}
                        onChange={(e) => setBRemarks(e.target.value)}
                        placeholder="e.g. Received offline cash. Registration for upcoming state kumite tournament included."
                        rows={3}
                        className="w-full bg-slate-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 min-h-[72px]"
                      />
                    </div>

                    <div className="w-full md:w-80 bg-zinc-900/40 border border-zinc-850 p-4 rounded-lg space-y-3.5">
                      <div className="flex justify-between items-center text-xs text-zinc-400 font-bold border-b border-zinc-850/60 pb-2">
                        <span>Invoice Subtotal:</span>
                        <span className="font-mono text-sm text-white">₹{bItems.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)}</span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-widest">Amount Paid (₹)</label>
                          <button
                            type="button"
                            onClick={() => setBPaidAmount(bItems.reduce((sum, i) => sum + (Number(i.amount) || 0), 0))}
                            className="text-[9px] font-bold text-yellow-500 hover:text-yellow-400 uppercase tracking-wider cursor-pointer"
                          >
                            Mark Fully Paid
                          </button>
                        </div>
                        <input
                          type="number"
                          value={bPaidAmount === '' ? '' : bPaidAmount}
                          onChange={(e) => setBPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-slate-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 font-mono text-right font-black"
                          required
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs text-zinc-400 font-bold pt-1.5">
                        <span>Balance Due:</span>
                        <span className="font-mono text-sm font-black text-[#FF3B3F]">
                          ₹{bItems.reduce((sum, i) => sum + (Number(i.amount) || 0), 0) - (Number(bPaidAmount) || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="pt-4 border-t border-zinc-900 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsGeneratingReceipt(false);
                      setBillError('');
                    }}
                    className="px-5 py-2.5 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={billSaving}
                    className="px-8 py-2.5 bg-[#FF3B3F] hover:bg-rose-500 text-white font-heading font-black rounded-lg text-xs uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {billSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Receipt...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save & Generate Receipt</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>

      {/* MODAL 1: Complete Admission File Profile Drawer */}
      {selectedAdmission && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-sm flex justify-center p-4 items-start sm:items-center">
          <div className="bg-slate-900 border border-zinc-850 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative my-6 sm:my-12">
            <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500" />
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-850 flex items-center justify-between">
              <div className="flex items-center space-x-3 uppercase">
                <ShieldCheck className="w-5 h-5 text-yellow-500" />
                <h3 className="font-title text-base font-bold text-white tracking-wider">Student Registry File</h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setSelectedAdmission(null);
                  setIsEditingProfile(false);
                }}
                className="bg-[#FF3B3F] hover:bg-rose-600 text-white font-heading font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1 shadow-md active:scale-95 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5 text-white stroke-[3px]" />
                <span className="hidden xs:inline">CLOSE</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">
              <div className="flex flex-row gap-4 items-center">
                {/* Profile Photo */}
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 shrink-0">
                  <img src={selectedAdmission.photoUrl || DEFAULT_STUDENT_AVATAR} alt="Student" className="w-full h-full object-cover object-top" />
                </div>
                {/* Visual Metadata banner */}
                <div className="text-left space-y-1 flex-grow">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-title text-base sm:text-lg font-bold text-white uppercase tracking-wider">{selectedAdmission.fullName}</h4>
                    {!isEditingProfile && (
                      <button 
                        type="button"
                        onClick={handleStartEditProfile}
                        className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-heading font-black text-[9px] uppercase tracking-widest px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1 shadow-md active:scale-95 cursor-pointer shrink-0"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-950" />
                        <span>Edit Details</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-zinc-550 font-mono">
                    <span className="flex items-center gap-1.5">
                      <span>ID: {selectedAdmission.studentId}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          setIsEditingId(true);
                          setNewStudentIdVal(selectedAdmission.studentId);
                          setIdEditError('');
                          setIdEditSuccess('');
                        }}
                        className="text-yellow-500 hover:text-yellow-400 text-[10px] font-bold uppercase underline tracking-wider cursor-pointer"
                      >
                        Edit ID
                      </button>
                    </span>
                    <span>•</span>
                    <span>Age: {selectedAdmission.age} yrs</span>
                    <span>•</span>
                    <span>Gender: {selectedAdmission.gender}</span>
                  </div>

                  {isEditingId && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-zinc-850 space-y-3 mt-2 text-left">
                      <label className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider block">
                        Modify Student Roll ID
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={newStudentIdVal}
                          onChange={(e) => setNewStudentIdVal(e.target.value.toUpperCase())}
                          placeholder="e.g. LKCP-2026-118"
                          className="bg-slate-900 border border-zinc-800 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-yellow-500 flex-grow"
                        />
                        <button
                          type="button"
                          onClick={handleSaveNewStudentId}
                          disabled={idEditSaving}
                          className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs px-3 py-1.5 rounded-lg font-bold disabled:opacity-50 cursor-pointer"
                        >
                          {idEditSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingId(false);
                            setIdEditError('');
                            setIdEditSuccess('');
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      {idEditError && <span className="text-red-500 text-[10px] block">{idEditError}</span>}
                      {idEditSuccess && <span className="text-emerald-500 text-[10px] block">{idEditSuccess}</span>}
                    </div>
                  )}

                  <div className="pt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/10 whitespace-nowrap">
                      {selectedAdmission.beltLevel.split(' ')[0]} Belt
                    </span>
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded whitespace-nowrap">
                      Batch: {selectedAdmission.batch}
                    </span>
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-sky-400 bg-sky-500/5 border border-sky-500/15 px-2 py-0.5 rounded whitespace-nowrap">
                      Branch: {selectedAdmission.branch || 'Manaji Nagar Branch'}
                    </span>
                  </div>
                </div>
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4 text-left border-t border-zinc-850/60 pt-4.5">
                  {editProfileError && (
                    <div className="bg-red-950/40 border border-red-500/20 text-red-400 p-3.5 rounded-lg flex items-start space-x-2 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{editProfileError}</span>
                    </div>
                  )}

                  {/* Student Photo Upload & Preview Section */}
                  <div className="p-3.5 bg-slate-950/60 border border-zinc-850 rounded-xl space-y-2">
                    <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold">
                      Student ID Passport Photo / Badge Image
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      <div 
                        onDragOver={handleEditDragOver}
                        onDragLeave={() => setEditDragOver(false)}
                        onDrop={handleEditDrop}
                        onClick={() => document.getElementById('edit-photo-file-input')?.click()}
                        className={`sm:col-span-2 h-[95px] border-2 border-dashed rounded-xl flex flex-col justify-center items-center px-3 text-center cursor-pointer transition-all ${
                          editDragOver ? 'border-yellow-500 bg-yellow-500/5' : 'border-zinc-800 bg-slate-900/40 hover:border-zinc-700'
                        }`}
                      >
                        <input 
                          id="edit-photo-file-input"
                          type="file"
                          onChange={handleEditPhotoSelect}
                          accept="image/*"
                          className="hidden"
                        />
                        <Upload className="w-5 h-5 text-zinc-400 mb-1" />
                        <span className="text-zinc-300 text-xs font-medium">Click or drag & drop to update photo</span>
                        <span className="text-zinc-550 text-[9px] mt-0.5">JPG, PNG, WebP (Square ratio best)</span>
                      </div>

                      <div className="flex flex-col items-center justify-center p-2 bg-slate-900 border border-zinc-850 rounded-xl h-[95px]">
                        {editPhotoUrl ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-yellow-500/30">
                            <img src={editPhotoUrl} alt="Preview" className="w-full h-full object-cover object-top" />
                            <button
                              type="button"
                              onClick={() => setEditPhotoUrl('')}
                              className="absolute inset-0 bg-black/75 opacity-0 hover:opacity-100 flex items-center justify-center text-red-400 text-[9px] uppercase font-bold tracking-wide transition-opacity"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-zinc-600">
                            <Camera className="w-5 h-5 mb-1 text-zinc-500" />
                            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">No Photo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Student Full Name *</label>
                      <input
                        type="text"
                        required
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-800 text-zinc-200 px-3 py-2.5 rounded-lg text-xs font-semibold focus:outline-none focus:border-yellow-500 transition-all"
                      />
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Date of Birth</label>
                      <input
                        type="date"
                        value={editDob}
                        onChange={(e) => setEditDob(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-800 text-zinc-200 px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                      />
                    </div>

                    {/* Age */}
                    <div>
                      <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Student Age</label>
                      <input
                        type="number"
                        min="3"
                        max="90"
                        value={editAge}
                        onChange={(e) => setEditAge(e.target.value ? Number(e.target.value) : '')}
                        className="w-full bg-slate-950 border border-zinc-800 text-zinc-200 px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Gender *</label>
                      <select
                        value={editGender}
                        onChange={(e: any) => setEditGender(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-800 text-zinc-200 px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Guardian Name */}
                    <div>
                      <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Guardian / Parent Name</label>
                      <input
                        type="text"
                        value={editParentName}
                        onChange={(e) => setEditParentName(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-800 text-zinc-200 px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                      />
                    </div>

                    {/* Primary Phone */}
                    <div>
                      <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Primary Phone *</label>
                      <input
                        type="tel"
                        required
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-800 text-zinc-200 px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">WhatsApp Contact</label>
                      <input
                        type="tel"
                        value={editWhatsApp}
                        onChange={(e) => setEditWhatsApp(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-800 text-zinc-200 px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Email Identifier</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-800 text-zinc-200 px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                      />
                    </div>

                    {/* Dojo Branch */}
                    <div>
                      <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Dojo Branch *</label>
                      <select
                        value={editBranch}
                        onChange={(e) => handleBranchChange(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-800 text-zinc-200 px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                      >
                        {DOJO_BRANCHES.map(b => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Program Batch Cohort * */}
                    <div>
                      <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Program Batch Cohort *</label>
                      <select
                        value={editBatch}
                        onChange={(e) => setEditBatch(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-800 text-zinc-200 px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                      >
                        {batches.map(b => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                        {BATCH_TIMINGS.map(b => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Current Belt Level */}
                    <div>
                      <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Current Belt level *</label>
                      <select
                        value={editBeltLevel}
                        onChange={(e) => setEditBeltLevel(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-800 text-zinc-200 px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                      >
                        {BELT_LEVELS.map(b => (
                          <option key={b.name} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Fees Status */}
                    <div>
                      <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Fees Status *</label>
                      <select
                        value={editFeesStatus}
                        onChange={(e: any) => setEditFeesStatus(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-800 text-zinc-200 px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                      </select>
                    </div>

                    {/* School Name */}
                    <div className="md:col-span-2">
                      <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">School / Institution Name</label>
                      <input
                        type="text"
                        value={editSchoolName}
                        onChange={(e) => setEditSchoolName(e.target.value)}
                        className="w-full bg-slate-950 border border-zinc-800 text-zinc-200 px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                      />
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Physical Address</label>
                      <textarea
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-950 border border-zinc-800 text-zinc-200 px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-zinc-850">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white font-heading font-black text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editProfileSaving}
                      className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-heading font-black text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                    >
                      {editProfileSaving ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3" />
                          <span>Save Student Details</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* Comprehensive parameters list grid - optimized for mobile 2-column view */}
                  <div className="grid grid-cols-2 gap-x-5 gap-y-3.5 border-t border-b border-zinc-850/60 py-4.5 text-xs">
                    {/* DOB / Age */}
                    <div>
                      <span className="text-zinc-550 uppercase tracking-widest text-[9px] block">DOB / Age</span>
                      <span className="text-zinc-300 font-medium mt-0.5 block">{selectedAdmission.dob} / {selectedAdmission.age} yrs</span>
                    </div>

                    {/* Guardian Name */}
                    <div>
                      <span className="text-zinc-550 uppercase tracking-widest text-[9px] block">Guardian Name</span>
                      <span className="text-zinc-300 font-medium mt-0.5 block truncate max-w-[160px]" title={selectedAdmission.parentName || 'Self / Legal Guardian'}>{selectedAdmission.parentName || 'Self / Legal Guardian'}</span>
                    </div>

                    {/* Phone */}
                    <div>
                      <span className="text-zinc-550 uppercase tracking-widest text-[9px] block">Primary Phone</span>
                      <a href={`tel:${selectedAdmission.phone}`} className="text-yellow-500 hover:underline mt-0.5 flex items-center space-x-1.5">
                        <Phone className="w-3 h-3 shrink-0" />
                        <span>{selectedAdmission.phone}</span>
                      </a>
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <span className="text-zinc-550 uppercase tracking-widest text-[9px] block">WhatsApp Contact</span>
                      {(() => {
                        let rawPhone = selectedAdmission.whatsApp || selectedAdmission.phone || '';
                        let cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0+/, '');
                        if (cleanPhone.startsWith('910') && cleanPhone.length === 13) {
                          cleanPhone = '91' + cleanPhone.substring(3);
                        } else if (cleanPhone.length === 10) {
                          cleanPhone = `91${cleanPhone}`;
                        }
                        return (
                          <a href={`https://api.whatsapp.com/send?phone=${cleanPhone}`} target="_blank" rel="noreferrer" className="text-yellow-500 hover:underline mt-0.5 flex items-center space-x-1.5">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{selectedAdmission.whatsApp || selectedAdmission.phone}</span>
                          </a>
                        );
                      })()}
                    </div>

                    {/* Email */}
                    <div className="col-span-2 xs:col-span-1">
                      <span className="text-zinc-550 uppercase tracking-widest text-[9px] block">Email Identifier</span>
                      <a href={`mailto:${selectedAdmission.email}`} className="text-zinc-300 hover:text-white mt-0.5 flex items-center space-x-1.5 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate block max-w-full">{selectedAdmission.email}</span>
                      </a>
                    </div>

                    {/* Fees Status */}
                    <div className="col-span-2 xs:col-span-1">
                      <span className="text-zinc-550 uppercase tracking-widest text-[9px] block">Induction Fees</span>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className={`inline-flex items-center space-x-1 uppercase font-heading font-black text-[9px] tracking-wider px-2 py-0.5 rounded border ${
                          (selectedAdmission.feesStatus || 'Unpaid') === 'Paid'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            (selectedAdmission.feesStatus || 'Unpaid') === 'Paid' ? 'bg-emerald-400' : 'bg-red-400'
                          }`} />
                          <span>{selectedAdmission.feesStatus || 'Unpaid'}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            const currentFees = selectedAdmission.feesStatus || 'Unpaid';
                            const nextFees = currentFees === 'Paid' ? 'Unpaid' : 'Paid';
                            updateFeesStatus(selectedAdmission.id, nextFees);
                          }}
                          className="text-[9px] bg-zinc-805 hover:bg-zinc-800 hover:text-white text-zinc-350 px-1.5 py-0.5 rounded border border-zinc-800 transition-colors uppercase font-heading font-semibold cursor-pointer"
                        >
                          Toggle
                        </button>
                      </div>
                    </div>

                    {/* Training Branch */}
                    <div>
                      <span className="text-zinc-550 uppercase tracking-widest text-[9px] block">Training Branch</span>
                      <span className="text-yellow-500 font-bold mt-0.5 block truncate max-w-[160px]" title={selectedAdmission.branch || 'Manaji Nagar Branch'}>{selectedAdmission.branch || 'Manaji Nagar Branch'}</span>
                    </div>

                    {/* Designated Coach */}
                    <div>
                      <span className="text-zinc-550 uppercase tracking-widest text-[9px] block">Designated Coach</span>
                      <span className="text-zinc-400 font-medium mt-0.5 block truncate max-w-[160px]" title={selectedAdmission.coachName || 'Maruti Jadhav Sir 2nd dan Black Belt'}>{selectedAdmission.coachName || 'Maruti Jadhav Sir'}</span>
                    </div>

                    {/* School Name - occupies full width if present */}
                    {selectedAdmission.schoolName && (
                      <div className="col-span-2 border-t border-zinc-850/30 pt-2.5">
                        <span className="text-zinc-550 uppercase tracking-widest text-[9px] block">School / Institution / College</span>
                        <span className="text-yellow-500 font-medium mt-0.5 block leading-relaxed uppercase">{selectedAdmission.schoolName}</span>
                      </div>
                    )}

                    {/* Physical Address - occupies full width */}
                    <div className="col-span-2 border-t border-zinc-850/30 pt-2.5">
                      <span className="text-zinc-550 uppercase tracking-widest text-[9px] block">Physical Address</span>
                      <span className="text-zinc-300 font-medium mt-0.5 block leading-relaxed">{selectedAdmission.address}</span>
                    </div>
                  </div>

                  {/* Actions approval panel */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-[10px] text-zinc-500 font-mono">Current review status:</span>
                      <span className={`uppercase text-[10px] font-bold px-2.5 py-0.5 rounded border border-yellow-500/10 ${
                        selectedAdmission.status === 'approved' ? 'bg-emerald-500/5 text-emerald-500' : selectedAdmission.status === 'rejected' ? 'bg-red-500/5 text-red-500' : 'bg-yellow-500/5 text-yellow-500'
                      }`}>{selectedAdmission.status}</span>
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      {selectedAdmission.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateAdmissionStatus(selectedAdmission.id, 'rejected')}
                            className="w-full sm:w-auto text-center font-heading font-black text-[10px] uppercase tracking-wider bg-transparent hover:bg-red-950/20 border border-red-500/30 hover:border-red-500 text-red-500 px-5 py-2.5 rounded transition-all cursor-pointer"
                          >
                            REJECT REGISTER
                          </button>
                          <button
                            onClick={() => updateAdmissionStatus(selectedAdmission.id, 'approved')}
                            className="w-full sm:w-auto text-center font-heading font-black text-[10px] uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded transition-all shadow shadow-emerald-500/10 cursor-pointer"
                          >
                            APPROVE DOJO ENTRY
                          </button>
                        </>
                      )}

                      {selectedAdmission.status === 'approved' && (
                        <button
                          onClick={() => updateAdmissionStatus(selectedAdmission.id, 'rejected')}
                          className="w-full sm:w-auto text-center font-heading font-black text-[10px] uppercase tracking-wider border border-zinc-800 hover:bg-zinc-850 hover:text-zinc-200 text-zinc-400 px-5 py-2.5 rounded transition-all cursor-pointer"
                        >
                          REVOKE APPROVAL
                        </button>
                      )}

                      {selectedAdmission.status === 'rejected' && (
                        <button
                          onClick={() => updateAdmissionStatus(selectedAdmission.id, 'approved')}
                          className="w-full sm:w-auto text-center font-heading font-black text-[10px] uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded transition-all cursor-pointer"
                        >
                          RE-APPROVE
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ID Card generation popup panel */}
      {viewingIDCard && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-zinc-850 rounded-2xl overflow-hidden p-6 relative my-8">
            
            {/* Nav */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-850/60 uppercase">
              <span className="font-heading font-bold text-sm text-zinc-100 uppercase tracking-widest block">Issue Pass Terminal</span>
              <button 
                type="button"
                onClick={() => setViewingIDCard(null)}
                className="bg-[#FF3B3F] hover:bg-rose-600 text-white font-heading font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg transition-all duration-150 flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-white stroke-[3px]" />
                <span>CLOSE</span>
              </button>
            </div>

            {/* Passes */}
            <IDCard admission={viewingIDCard} showSuccessBanner={false} />

            {/* Bottom close helper to guarantee ease of use */}
            <div className="mt-8 pt-4 border-t border-zinc-850/60 flex justify-center">
              <button
                type="button"
                onClick={() => setViewingIDCard(null)}
                className="w-full sm:w-auto px-6 py-3 border border-zinc-850 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-[10px] font-heading font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4 stroke-[2.5px]" />
                <span>Close Terminal & Return</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2.5: Shareable Progress Card generation popup panel */}
      {viewingProgressCard && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-md flex justify-center items-start p-2 sm:p-4 md:p-6">
          <div className="w-full max-w-5xl bg-slate-900 border border-zinc-850 rounded-2xl overflow-hidden p-4 sm:p-6 relative my-2 sm:my-8">
            
            {/* Header / Nav */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-850/60 uppercase">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-emerald-400 animate-pulse" />
                <span className="font-heading font-bold text-sm text-zinc-100 uppercase tracking-widest block">Shareable Progress Card Terminal</span>
              </div>
              <button 
                type="button"
                onClick={() => setViewingProgressCard(null)}
                className="bg-[#FF3B3F] hover:bg-rose-600 text-white font-heading font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg transition-all duration-150 flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-white stroke-[3px]" />
                <span>CLOSE</span>
              </button>
            </div>

            {/* Passes */}
            <ProgressCard admission={viewingProgressCard} onClose={() => setViewingProgressCard(null)} />

            {/* Bottom close helper to guarantee ease of use */}
            <div className="mt-8 pt-4 border-t border-zinc-850/60 flex justify-center">
              <button
                type="button"
                onClick={() => setViewingProgressCard(null)}
                className="w-full sm:w-auto px-6 py-3 border border-zinc-850 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-[10px] font-heading font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4 stroke-[2.5px]" />
                <span>Close Terminal & Return</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: Batch Timing Creator & Editor Dialog */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-zinc-855 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500" />
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-850 flex items-center justify-between">
              <span className="font-heading font-black text-xs uppercase tracking-widest text-zinc-100 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-yellow-500" />
                <span>{editingBatch ? 'Edit Dojo Timing Program' : 'Initiate Dojo Training Batch'}</span>
              </span>
              <button 
                type="button"
                onClick={() => setBatchModalOpen(false)}
                className="text-zinc-550 hover:text-white text-xs font-heading font-black cursor-pointer uppercase"
              >
                Cancel
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveBatch} className="p-6 space-y-4">
              {batchFormError && (
                <div className="bg-red-950/40 border border-red-500/20 text-red-400 p-3.5 rounded-lg flex items-start space-x-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{batchFormError}</span>
                </div>
              )}

              {/* Batch Name */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Cohort Program Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Little Tigers, Elite Dojo, Young Warriors"
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 pl-3.5 pr-4 py-2.5 rounded-lg text-xs font-medium focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-650"
                />
              </div>

              {/* Age Level Target */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Age Group Classification</label>
                <input
                  type="text"
                  placeholder="e.g. Kids (Ages 4-7), Adults (Ages 15+)"
                  value={bAgeGroup}
                  onChange={(e) => setBAgeGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 pl-3.5 pr-4 py-2.5 rounded-lg text-xs font-medium focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-650"
                />
              </div>

              {/* Schedule Days */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Days of Training Week *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mon, Wed, Fri or Tuesday & Thursday"
                  value={bDays}
                  onChange={(e) => setBDays(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 pl-3.5 pr-4 py-2.5 rounded-lg text-xs font-medium focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-650"
                />
              </div>

              {/* Timing */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Class Time Range *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 05:00 PM - 06:00 PM"
                  value={bTiming}
                  onChange={(e) => setBTiming(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 pl-3.5 pr-4 py-2.5 rounded-lg text-xs font-medium focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-650"
                />
              </div>

              {/* Coaches Assigned */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Assigned Shihan / Sensei Instructors</label>
                <input
                  type="text"
                  placeholder="e.g. Sensei Maruti Jadhav, Sensei Shivraj Jejure"
                  value={bCoaches}
                  onChange={(e) => setBCoaches(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 pl-3.5 pr-4 py-2.5 rounded-lg text-xs font-medium focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-650"
                />
              </div>

              {/* Syllabus Focus */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Syllabus Curriculum Focus</label>
                <input
                  type="text"
                  placeholder="e.g. Traditional Katas, Kumite and basic self defence drill block"
                  value={bFocus}
                  onChange={(e) => setBFocus(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 pl-3.5 pr-4 py-2.5 rounded-lg text-xs font-medium focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-650"
                />
              </div>

              {/* Price / Monthly tuition Fee */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Investment / Tuition Fee</label>
                <input
                  type="text"
                  placeholder="e.g. $85/month"
                  value={bPrice}
                  onChange={(e) => setBPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 pl-3.5 pr-4 py-2.5 rounded-lg text-xs font-medium focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-650"
                />
              </div>

              {/* Bottom buttons */}
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="font-heading font-black text-[10px] uppercase tracking-wider hover:bg-zinc-850 border border-zinc-800 text-zinc-400 px-5 py-3 rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchFormSaving}
                  className="font-heading font-black text-[10px] uppercase tracking-wider bg-yellow-500 hover:bg-yellow-400 text-slate-950 px-5 py-3 rounded-lg transition-all flex items-center space-x-1.5 shadow cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{batchFormSaving ? 'Saving...' : 'Commit cohort'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Dynamic Enrolled Student Roster Modal */}
      {viewingEnrolledBatch && (() => {
        const enrolledStudents = admissions.filter(
          (a) => a.batch.toLowerCase().trim() === viewingEnrolledBatch.name.toLowerCase().trim()
        );

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-zinc-850 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500" />
              
              {/* Header */}
              <div className="px-6 py-5 border-b border-zinc-850 flex items-center justify-between">
                <div className="flex items-center space-x-3 uppercase">
                  <Users className="w-5 h-5 text-yellow-500" />
                  <div>
                    <h3 className="font-title text-base font-bold text-white tracking-wider">Cohort Enrollment Roster</h3>
                    <span className="text-[9px] font-mono text-zinc-505 uppercase font-black block mt-0.5">{viewingEnrolledBatch.name}</span>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setViewingEnrolledBatch(null)}
                  className="text-zinc-505 hover:text-white text-xs font-heading font-black cursor-pointer uppercase"
                >
                  Dismiss
                </button>
              </div>

              {/* Roster list */}
              <div className="p-6">
                {enrolledStudents.length === 0 ? (
                  <div className="py-12 text-center text-zinc-650 font-light text-xs">
                    No students currently registered under this timing cohort.
                  </div>
                ) : (
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-900/50 pr-2">
                    {enrolledStudents.map((st) => (
                      <div key={st.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-9 h-9 rounded-md overflow-hidden bg-neutral-900 border border-zinc-800 shrink-0">
                            <img src={st.photoUrl || DEFAULT_STUDENT_AVATAR} alt={st.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <span className="font-bold text-zinc-150 block">{st.fullName}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">ID: {st.studentId || 'LKCP-NEW'}</span>
                          </div>
                        </div>

                        {/* Middle belt */}
                        <div className="hidden sm:block">
                          <span className="font-mono text-[10px] font-bold text-yellow-500 uppercase bg-yellow-500/5 px-2 py-0.5 rounded border border-yellow-550/10">
                            {st.beltLevel}
                          </span>
                        </div>

                        {/* Quick reviews actions */}
                        <div className="flex items-center space-x-1.5 flex-row">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAdmission(st);
                              setViewingEnrolledBatch(null);
                            }}
                            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-400 cursor-pointer"
                            title="Inspect Student's file"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setViewingIDCard(st);
                              setViewingEnrolledBatch(null);
                            }}
                            className="p-1.5 rounded bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-slate-950 duration-200 cursor-pointer"
                            title="Review Dojo pass card"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-950 border-t border-zinc-850 flex items-center justify-between text-[10px] font-mono">
                <span className="text-zinc-500 font-bold uppercase">MATCHING: {enrolledStudents.length} ENROLLED STUDENT FILES</span>
                <button
                  type="button"
                  onClick={() => setViewingEnrolledBatch(null)}
                  className="text-yellow-505 font-black hover:text-white cursor-pointer uppercase tracking-widest bg-yellow-500/10 px-3 py-1.5 rounded border border-yellow-500/20 hover:bg-yellow-500"
                >
                  Close Roster
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 5: Manual Student Registry */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-zinc-850 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative col-span-1 border-0">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-500" />
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-850 flex items-center justify-between">
              <span className="font-heading font-black text-xs uppercase tracking-widest text-zinc-100 flex items-center space-x-2">
                <Users className="w-4 h-4 text-yellow-500" />
                <span>Enroll Previous Student (Manual Registry)</span>
              </span>
              <button 
                type="button"
                onClick={() => setEnrollModalOpen(false)}
                className="text-zinc-550 hover:text-white text-xs font-heading font-black cursor-pointer uppercase"
              >
                Cancel
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveManualStudent} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar text-left grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {manualFormError && (
                <div className="md:col-span-2 bg-red-955/40 border border-red-500/20 text-red-400 p-3.5 rounded-lg flex items-start space-x-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{manualFormError}</span>
                </div>
              )}

              {/* Photo Upload Row (Col Span 2) */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold">1. Student Photo Passport</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div
                    onDragOver={handleMDragOver}
                    onDragLeave={() => setMDragOver(false)}
                    onDrop={handleMDrop}
                    onClick={() => document.getElementById('manual-photo-file-input')?.click()}
                    className={`md:col-span-2 h-[120px] border-2 border-dashed rounded-xl flex flex-col justify-center items-center px-4 text-center cursor-pointer transition-all ${
                      mDragOver ? 'border-yellow-500 bg-yellow-500/5' : 'border-zinc-800 bg-slate-950/20 hover:border-zinc-700'
                    }`}
                  >
                    <input 
                      id="manual-photo-file-input"
                      type="file"
                      onChange={handleMPhotoSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <Upload className="w-6 h-6 text-zinc-500 mb-1" />
                    <span className="text-zinc-400 text-xs font-heading font-medium">Drag & Drop photo here or <span className="text-yellow-500 font-semibold">Browse</span></span>
                    <span className="text-zinc-650 text-[9px] mt-0.5 block">Square badge sizing recommended</span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-3 bg-slate-950/40 border border-zinc-900 rounded-xl h-[120px]">
                    {mPhotoUrl ? (
                      <div className="relative w-18 h-18 rounded-lg overflow-hidden border border-yellow-500/20">
                        <img src={mPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setMPhotoUrl('')}
                          className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-red-500 text-[9px] uppercase font-bold tracking-wide transition-opacity"
                        >
                          Erase
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-zinc-700">
                        <Camera className="w-6 h-6 mb-1 text-zinc-600" />
                        <span className="text-[9px] uppercase font-bold tracking-wider">Preview Badge</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Student ID */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5 flex items-center justify-between">
                  <span>LKCP Student Roll ID *</span>
                  <span className={`text-[8.5px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                    mIdLocked ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {mIdLocked ? '🔒 AUTO-LOCKED' : '🔓 UNLOCKED / MANUAL'}
                  </span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="e.g. LKCP-2025-001"
                    value={mStudentId}
                    onChange={(e) => setMStudentId(e.target.value.toUpperCase())}
                    disabled={mIdLocked}
                    className={`w-full bg-slate-950 border text-xs font-mono uppercase tracking-widest focus:outline-none transition-all placeholder:text-zinc-750 rounded-lg px-3.5 py-2.5 pr-10 ${
                      mIdLocked 
                        ? 'border-zinc-800 text-zinc-400 cursor-not-allowed bg-slate-950/40 opacity-80' 
                        : 'border-yellow-500 text-yellow-400 focus:border-yellow-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setMIdLocked(!mIdLocked)}
                    title={mIdLocked ? "Click to manually edit student Roll ID" : "Click to lock & use auto-generated ID"}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors ${
                      mIdLocked ? 'text-zinc-500 hover:text-yellow-500' : 'text-yellow-500 hover:text-zinc-400'
                    }`}
                  >
                    {mIdLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-zinc-650 mt-1 block font-medium">
                  {mIdLocked 
                    ? "System auto-suggested a unique ID to prevent duplicates. Click Lock to edit manually." 
                    : "Editable sequence. Enter a custom ID or click Lock to use the automated generator."}
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Atharva Maruti Jadhav"
                  value={mFullName}
                  onChange={(e) => setMFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-855 text-zinc-200 px-3.5 py-2.5 rounded-lg text-xs font-semibold focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-700"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={mDob}
                  onChange={(e) => setMDob(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                />
              </div>

              {/* Age */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Student Age *</label>
                <input
                  type="number"
                  required
                  min="3"
                  max="90"
                  placeholder="e.g. 10"
                  value={mAge}
                  onChange={(e) => setMAge(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Gender *</label>
                <select
                  value={mGender}
                  onChange={(e: any) => setMGender(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-202 px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Joining Date */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Admission Joining Date *</label>
                <input
                  type="date"
                  required
                  value={mJoiningDate}
                  onChange={(e) => setMJoiningDate(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                />
                <span className="text-[10px] text-zinc-650 mt-1 block">Very important for backlogging previous students correctly!</span>
              </div>

              {/* Current Belt Level */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Current Belt level *</label>
                <select
                  value={mBeltLevel}
                  onChange={(e) => setMBeltLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                >
                  {BELT_LEVELS.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Dojo Branch */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Dojo Branch Selection *</label>
                <select
                  value={mBranch}
                  onChange={(e) => setMBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                >
                  {DOJO_BRANCHES.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Program Batch Cohort */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Program Batch Cohort *</label>
                <select
                  value={mBatch}
                  onChange={(e) => setMBatch(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.name}>{b.name} ({b.ageGroup})</option>
                  ))}
                  {batches.length === 0 && BATCH_TIMINGS.map(b => (
                    <option key={b.id} value={b.name}>{b.name} ({b.ageGroup})</option>
                  ))}
                </select>
              </div>

              {/* Fees Status */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Annual / Admission Fee Status *</label>
                <select
                  value={mFeesStatus}
                  onChange={(e: any) => setMFeesStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all"
                >
                  <option value="Paid">Mark as PAID</option>
                  <option value="Unpaid">Mark as UNPAID</option>
                </select>
              </div>

              {/* Parent / Guardian Name */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Parent / Guardian Name</label>
                <input
                  type="text"
                  placeholder="Parent Name"
                  value={mParentName}
                  onChange={(e) => setMParentName(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-700"
                />
              </div>

              {/* Phone Line */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Contact Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="Phone Line"
                  value={mPhone}
                  onChange={(e) => setMPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-700"
                />
              </div>

              {/* WhatsApp Line */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">WhatsApp Contact (if different)</label>
                <input
                  type="tel"
                  placeholder="WhatsApp Line"
                  value={mWhatsApp}
                  onChange={(e) => setMWhatsApp(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-700"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Student Email Address</label>
                <input
                  type="email"
                  placeholder="student@dojo.com"
                  value={mEmail}
                  onChange={(e) => setMEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-755"
                />
              </div>

              {/* School Name */}
              <div>
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">School / College Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dynamic High School, Pune"
                  value={mSchoolName}
                  onChange={(e) => setMSchoolName(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-700"
                />
              </div>

              {/* Physical Address (Col Span 2) */}
              <div className="md:col-span-2">
                <label className="text-zinc-400 uppercase tracking-widest text-[9px] block font-bold mb-1.5">Student Residential Address</label>
                <textarea
                  rows={2}
                  placeholder="Pune, Maharashtra"
                  value={mAddress}
                  onChange={(e) => setMAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-zinc-850 text-zinc-200 px-3.5 py-2.5 rounded-lg text-xs focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-750"
                />
              </div>

              {/* Form Actions Footer within scroll container */}
              <div className="md:col-span-2 pt-4 border-t border-zinc-850 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEnrollModalOpen(false)}
                  className="px-4 py-2.5 text-[10px] font-heading font-black uppercase tracking-wider text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualSaving}
                  className="bg-yellow-500 hover:bg-yellow-450 text-slate-950 px-6 py-2.5 text-[10px] font-heading font-black uppercase tracking-widest rounded-lg transition-all flex items-center space-x-2 shadow cursor-pointer text-slate-950 font-extrabold"
                >
                  {manualSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-slate-950" />
                      <span>Instate Approved Student</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: EXAM ASSESSMENT AND GRADING MODEL OVERLAY */}
      {gradingExam && (
        <div className="fixed inset-0 z-55 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-zinc-850 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${gradingExam.statusAction === 'passed' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            
            <form onSubmit={handleGradeExamSubmit} className="p-6 space-y-5">
              <div className="text-left">
                <h4 className="font-title text-base font-extrabold text-white uppercase tracking-wider">
                  Grade Examination Review
                </h4>
                <p className="text-[11px] text-zinc-450 mt-1 leading-normal">
                  Rate the physical performance of scholar <strong className="text-white select-all">{gradingExam.studentName}</strong> (LKCP ID: {gradingExam.studentId}) testing for their <span className="text-yellow-500 font-bold">{gradingExam.targetBelt.split(' (')[0]}</span> kyu standard.
                </p>
                {gradingExam.statusAction === 'passed' ? (
                  <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 text-[10px] font-mono p-2 py-1.5 rounded mt-3 text-center uppercase tracking-wider font-extrabold">
                    👉 On success, student will graduate to: {gradingExam.targetBelt.split(' (')[0]} Belt!
                  </div>
                ) : (
                  <div className="bg-red-500/10 text-red-400 border border-red-500/15 text-[10px] font-mono p-2 py-1.5 rounded mt-3 text-center uppercase tracking-wider font-extrabold">
                    ⚠️ Set exam result slot to: Requires Review / Restudy.
                  </div>
                )}
              </div>

              {gradingError && (
                <div className="bg-red-500/5 border border-red-500/15 p-3 rounded-lg text-red-400 text-xs text-left">
                  {gradingError}
                </div>
              )}

              <div className="space-y-4 text-left">
                {/* 7 Disciplines Admin Edit Grid */}
                <div className="bg-slate-950 p-3 rounded-xl border border-zinc-800 space-y-2">
                  <span className="text-[9px] font-heading font-black text-yellow-500 uppercase tracking-wider block">
                    7-Discipline Assessment Scores
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { key: 'run', label: '1. RUN' },
                      { key: 'jump', label: '2. JUMP' },
                      { key: 'sidesitups', label: '3. SIDESITUPS' },
                      { key: 'kicks', label: '4. KICKS' },
                      { key: 'conditionChecking', label: '5. CONDITION CHECKING' },
                      { key: 'kata', label: '6. KATA' },
                      { key: 'kumite', label: '7. KUMITE' },
                    ].map(disc => {
                      const currentVal = (adminDisciplinesGrades as any)?.[disc.key] || '';
                      return (
                        <div key={disc.key} className="flex items-center justify-between bg-slate-900 p-1.5 rounded border border-zinc-850">
                          <span className="text-[10px] font-mono text-zinc-350">{disc.label}:</span>
                          <select
                            value={currentVal}
                            onChange={(e) => {
                              const newVal = e.target.value as GradeValue;
                              const updated = { ...adminDisciplinesGrades, [disc.key]: newVal };
                              setAdminDisciplinesGrades(updated);
                              const autoCalc = calculateOverallGrade(updated);
                              if (autoCalc) {
                                setEnteredGrade(autoCalc);
                              }
                            }}
                            className="bg-slate-950 text-yellow-400 font-black text-[10px] px-1.5 py-0.5 rounded border border-zinc-800 focus:outline-none"
                          >
                            <option value="">None</option>
                            <option value="A+">A+</option>
                            <option value="A">A</option>
                            <option value="B+">B+</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="F">F</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 text-[9px] uppercase tracking-wider font-bold mb-1.5 block">Overall Kyu Performance Grade *</label>
                  <input
                    type="text"
                    required
                    value={enteredGrade}
                    onChange={(e) => setEnteredGrade(e.target.value)}
                    placeholder="Overall Grade e.g. A+, A, B+, B, C, F"
                    className="w-full bg-slate-950 border border-zinc-800 text-yellow-400 font-black text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-yellow-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-[9px] uppercase tracking-wider font-bold mb-1.5 block">Sensei Remarks & feedback comments *</label>
                  <textarea
                    required
                    rows={3}
                    value={enteredRemarks}
                    onChange={(e) => setEnteredRemarks(e.target.value)}
                    placeholder="e.g. Magnificent execution of Heian Shodan kata, crisp blocks but core needs minor focus..."
                    className="w-full bg-slate-950 border border-zinc-800 text-zinc-305 text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-yellow-500 h-20 placeholder:text-zinc-700"
                  />
                </div>

                {/* Publish Result toggle checkbox */}
                <div className="bg-slate-950 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
                  <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-heading font-black uppercase text-zinc-300">
                    <input
                      type="checkbox"
                      checked={adminPublishResult}
                      onChange={(e) => setAdminPublishResult(e.target.checked)}
                      className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                    />
                    <span>Publish result immediately to Parent/Student Portal</span>
                  </label>
                  <span className={`text-[9px] font-heading font-black uppercase px-2 py-0.5 rounded border ${
                    adminPublishResult ? 'bg-purple-600/20 text-purple-300 border-purple-500/30' : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                  }`}>
                    {adminPublishResult ? '📢 Will Publish' : '🔒 Draft / Private'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-850 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setGradingExam(null);
                    setEnteredGrade('');
                    setEnteredRemarks('');
                  }}
                  className="px-4 py-2 text-[10px] font-heading font-black uppercase tracking-wider text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={gradingSaving}
                  className="bg-yellow-500 hover:bg-yellow-455 text-slate-950 px-5 py-2.5 text-[10px] font-heading font-black uppercase tracking-wider rounded-lg transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer text-slate-950"
                >
                  {gradingSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Assessment Grade</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BULK GRADE STUDENTS OVERLAY */}
      {bulkGradingModalOpen && (
        <div className="fixed inset-0 z-55 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/30 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative my-8 text-left">
            <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-6 py-4 flex items-center justify-between text-slate-950">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                <h3 className="font-heading font-black text-sm uppercase tracking-wider text-slate-950">
                  ⚡ BULK GRADE CANDIDATES - BATCH EVALUATOR
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBulkGradingModalOpen(false)}
                className="text-slate-950/70 hover:text-slate-950 text-xl font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                let targetExams = [...exams];
                if (bulkGradingScope === 'present') {
                  targetExams = targetExams.filter(item => item.checkedIn === true);
                } else if (bulkGradingScope === 'ungraded') {
                  targetExams = targetExams.filter(item => item.checkedIn === true && (item.status === 'approved' || item.status === 'pending' || !item.grade));
                }

                if (targetExams.length === 0) {
                  alert("No matching candidates found for this batch evaluation scope.");
                  return;
                }

                if (!window.confirm(`Are you sure you want to grade ${targetExams.length} student(s) as "${bulkStatus.toUpperCase()}" with Grade "${bulkGrade}"?`)) {
                  return;
                }

                setBulkGradingSaving(true);
                setBulkGradingProgress({ current: 0, total: targetExams.length });

                try {
                  let completed = 0;
                  for (const examDoc of targetExams) {
                    await updateDoc(doc(db, 'exams', examDoc.id), {
                      status: bulkStatus,
                      grade: bulkGrade,
                      disciplinesGrades: bulkDisciplines,
                      remarks: bulkRemarks.trim(),
                      isPublished: bulkPublish,
                      updatedAt: Date.now()
                    });

                    if (bulkStatus === 'passed' && bulkPublish) {
                      const targetStudent = admissions.find(s =>
                        (s.studentId || '').trim().toUpperCase() === (examDoc.studentId || '').trim().toUpperCase()
                      );
                      if (targetStudent) {
                        await updateDoc(doc(db, 'admissions', targetStudent.id), {
                          beltLevel: examDoc.targetBelt,
                          updatedAt: Date.now()
                        });
                      }
                    }

                    completed++;
                    setBulkGradingProgress({ current: completed, total: targetExams.length });
                  }

                  alert(`Successfully evaluated and saved grades for ${completed} candidate(s)!`);
                  setBulkGradingModalOpen(false);
                } catch (err) {
                  console.error("Bulk grading failed:", err);
                  alert("Failed to save bulk grades. Please check network connection and try again.");
                } finally {
                  setBulkGradingSaving(false);
                }
              }}
              className="p-6 space-y-5"
            >
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-start space-x-2.5 text-xs text-emerald-300">
                <span className="text-base shrink-0">🥋</span>
                <p className="leading-relaxed">
                  <strong className="font-bold text-emerald-200">Strict Exam Applicant Filter:</strong> Bulk grading applies <strong className="underline">ONLY</strong> to students who submitted an official Belt Exam Registration Form. General Dojo members who did not register for the exam are strictly excluded.
                </p>
              </div>

              {/* Target Candidate Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-heading font-black text-zinc-300 uppercase tracking-wider block">
                  1. Select Target Exam Candidates Batch
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkGradingScope('present')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      bulkGradingScope === 'present'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                        : 'bg-slate-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-black block text-emerald-400">✓ Present Exam Candidates ({exams.filter(e => e.checkedIn).length})</span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">Applied + Gate Checked-In Only</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkGradingScope('ungraded')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      bulkGradingScope === 'ungraded'
                        ? 'bg-purple-500/15 border-purple-500 text-purple-300 ring-1 ring-purple-500/50'
                        : 'bg-slate-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-black block text-purple-300">⏳ Present & Pending Grade ({exams.filter(e => e.checkedIn && (e.status === 'approved' || e.status === 'pending' || !e.grade)).length})</span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">Applied + Checked-in + Un-evaluated</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkGradingScope('all_registered')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      bulkGradingScope === 'all_registered'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                        : 'bg-slate-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-black block">All Exam Applicants ({exams.length})</span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">All belt exam registrants</span>
                  </button>
                </div>

                {/* Candidate Count Preview Box */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-zinc-850 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 text-[11px]">
                    Verified belt exam applicants to grade in this batch:
                  </span>
                  <span className="font-heading font-black text-amber-400 text-xs px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                    {bulkGradingScope === 'present'
                      ? exams.filter(e => e.checkedIn).length
                      : bulkGradingScope === 'ungraded'
                      ? exams.filter(e => e.checkedIn && (e.status === 'approved' || e.status === 'pending' || !e.grade)).length
                      : exams.length}{' '}
                    Exam Candidates (0 General Dojo Members)
                  </span>
                </div>
              </div>

              {/* Status Outcome & Overall Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-zinc-850">
                <div>
                  <label className="text-[10px] font-heading font-black text-zinc-300 uppercase tracking-wider block mb-1.5">
                    2. Exam Outcome Status
                  </label>
                  <select
                    value={bulkStatus}
                    onChange={(e: any) => setBulkStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-zinc-800 text-xs text-white p-2.5 rounded-lg font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="passed">✅ PASSED (Promote / Belt Award)</option>
                    <option value="failed">❌ REQUIRES RE-TRY (Needs Re-evaluation)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-heading font-black text-zinc-300 uppercase tracking-wider block mb-1.5">
                    3. Overall Letter Grade
                  </label>
                  <select
                    value={bulkGrade}
                    onChange={(e: any) => setBulkGrade(e.target.value)}
                    className="w-full bg-slate-900 border border-zinc-800 text-xs text-amber-400 p-2.5 rounded-lg font-black focus:outline-none focus:border-amber-500"
                  >
                    <option value="A+">A+ (Mastery Execution)</option>
                    <option value="A">A (Excellent Performance)</option>
                    <option value="B+">B+ (Good Competency)</option>
                    <option value="B">B (Satisfactory Standard)</option>
                    <option value="C">C (Needs Improvement)</option>
                    <option value="F">F (Fail / Requires Re-test)</option>
                  </select>
                </div>
              </div>

              {/* 7-Discipline Score Batch Presets */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-zinc-850">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-[10px] font-heading font-black text-zinc-300 uppercase tracking-wider block">
                    4. 7-Discipline Physical Scores
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] text-zinc-500 font-mono">1-Click Presets:</span>
                    {(['A+', 'A', 'B+', 'B'] as GradeValue[]).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAllBulkDisciplines(preset)}
                        className="bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all cursor-pointer"
                      >
                        Set All {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {[
                    { id: 'run', label: '1. Running / Speed' },
                    { id: 'jump', label: '2. High Jumping' },
                    { id: 'sidesitups', label: '3. Side Sit-ups' },
                    { id: 'kicks', label: '4. Kicking Drill' },
                    { id: 'conditionChecking', label: '5. Conditioning' },
                    { id: 'kata', label: '6. Shotokan Kata' },
                    { id: 'kumite', label: '7. Sparring (Kumite)' },
                  ].map((disc) => (
                    <div key={disc.id} className="bg-slate-900 p-2 rounded-lg border border-zinc-850">
                      <span className="text-[9px] font-bold text-zinc-400 block mb-1 truncate">{disc.label}</span>
                      <select
                        value={(bulkDisciplines as any)[disc.id] || 'A'}
                        onChange={(e) => setBulkDisciplines(prev => ({ ...prev, [disc.id]: e.target.value as GradeValue }))}
                        className="w-full bg-slate-950 border border-zinc-800 text-[11px] font-bold text-white p-1 rounded focus:outline-none focus:border-amber-500"
                      >
                        <option value="A+">A+</option>
                        <option value="A">A</option>
                        <option value="B+">B+</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="F">F</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-[10px] font-heading font-black text-zinc-300 uppercase tracking-wider block mb-1.5">
                  5. Sensei Remarks / Feedback
                </label>
                <input
                  type="text"
                  value={bulkRemarks}
                  onChange={(e) => setBulkRemarks(e.target.value)}
                  placeholder="e.g. Excellent effort, discipline, and execution shown during the Karate examination."
                  className="w-full bg-slate-950 border border-zinc-850 text-xs text-white p-3 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Publish Toggle */}
              <div className="bg-slate-950 p-3 rounded-xl border border-zinc-850 flex items-center justify-between">
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-heading font-black uppercase text-zinc-300">
                  <input
                    type="checkbox"
                    checked={bulkPublish}
                    onChange={(e) => setBulkPublish(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                  />
                  <span>Publish results immediately to Parent/Student Portal</span>
                </label>
                <span className={`text-[9px] font-heading font-black uppercase px-2 py-0.5 rounded border ${
                  bulkPublish ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                }`}>
                  {bulkPublish ? '📢 Will Publish' : '🔒 Save as Draft'}
                </span>
              </div>

              {/* Progress Indicator when saving */}
              {bulkGradingSaving && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-center space-y-1.5">
                  <div className="flex items-center justify-center space-x-2 text-amber-400 font-heading font-black text-xs uppercase tracking-wider">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Grading Candidates... ({bulkGradingProgress.current} / {bulkGradingProgress.total})</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                    <div
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${(bulkGradingProgress.current / (bulkGradingProgress.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-3 border-t border-zinc-850 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  disabled={bulkGradingSaving}
                  onClick={() => setBulkGradingModalOpen(false)}
                  className="px-4 py-2 text-[10px] font-heading font-black uppercase tracking-wider text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkGradingSaving}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-2.5 text-[10px] font-heading font-black uppercase tracking-wider rounded-lg transition-all flex items-center space-x-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {bulkGradingSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                      <span>Confirm & Apply Bulk Grades</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG OVERLAY */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-55 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-zinc-850 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-6 space-y-5 text-left relative">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h4 className="font-title text-base font-extrabold text-white uppercase tracking-wider">
                  {confirmDialog.title}
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed mt-1.5 font-sans">
                  {confirmDialog.message}
                </p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-zinc-850 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-[10.5px] font-heading font-black uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {confirmDialog.cancelText}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await confirmDialog.onConfirm();
                  } catch (e) {
                    console.error("Action error during delete: ", e);
                  } finally {
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  }
                }}
                className="bg-red-500 hover:bg-red-650 text-white px-5 py-2.5 text-[10.5px] font-heading font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer"
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Receipt Print/View Overlay */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-55 overflow-y-auto bg-black/90 backdrop-blur-sm flex justify-center p-4 items-start sm:items-center no-print">
          <div className="bg-slate-900 border border-zinc-850 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl relative my-6 sm:my-12">
            <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500" />
            
            {/* Header / Actions toolbar */}
            <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between no-print">
              <span className="font-heading font-black text-xs uppercase tracking-widest text-zinc-100 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-yellow-500" />
                <span>Fees Receipt Preview</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-heading font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  disabled={downloadingPDF}
                  onClick={handleDownloadPDF}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-heading font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingPDF ? 'Downloading...' : 'Download PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-heading font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Receipt container shown on screen */}
            <div className="p-5 bg-slate-955 max-h-[70vh] overflow-y-auto no-print">
              <p className="text-zinc-500 text-[10px] text-center mb-3">This is a digital preview. Click "Print / Download PDF" to save or print on your physical printer.</p>
              
              {/* Paper Look-alike for preview */}
              <div className="bg-white text-slate-900 p-6 rounded-xl shadow-md space-y-4 max-w-2xl mx-auto font-sans">
                {/* Top Registration Bar */}
                <div className="flex justify-between items-center text-[8.5px] font-mono text-zinc-500 border-b border-zinc-150 pb-1 mb-1">
                  <span className="font-bold tracking-wider text-zinc-600">CLUB REGISTER NO: PU000121240</span>
                  <span className="tracking-widest uppercase font-bold text-zinc-400">Official Fees Receipt</span>
                </div>

                {/* Brand Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src="https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781350907/logo_new_bgwsw9.jpg"
                      alt="Lions Karate Club Pune Logo"
                      className="w-12 h-12 rounded-full object-cover border border-zinc-200"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h2 className="font-heading font-black text-base tracking-tight text-slate-950 uppercase">LIONS KARATE CLUB PUNE</h2>
                      <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Approved Dojo • Affiliated with Karate India Association</p>
                      <p className="text-[8px] text-zinc-405 mt-0.5">Phone: +91 90496 88172 | Email: LIONSKARATECLUBPUNE09@gmail.com</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-block bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1 text-left">
                      <span className="text-[8px] text-zinc-400 uppercase block font-mono tracking-wider font-bold">RECEIPT NO</span>
                      <strong className="text-xs font-mono font-black text-slate-950 block">LKC-{selectedReceipt.receiptNo}</strong>
                    </div>
                    <div className="text-[9px] text-zinc-500 mt-1.5 font-mono">Date: {new Date(selectedReceipt.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                  </div>
                </div>

                {/* Student Particulars Grid */}
                <div className="bg-zinc-50/70 border border-zinc-150 p-3 rounded-lg grid grid-cols-2 gap-3 text-[10px] text-zinc-750">
                  <div className="space-y-1">
                    <div>
                      <span className="text-[8.5px] text-zinc-400 uppercase block font-mono">Student Name</span>
                      <strong className="text-slate-950 uppercase text-xs">{selectedReceipt.studentName}</strong>
                    </div>
                    {selectedReceipt.studentId && (
                      <div>
                        <span className="text-[8.5px] text-zinc-400 uppercase block font-mono">Roll Student ID</span>
                        <span className="font-mono font-bold text-slate-800">{selectedReceipt.studentId}</span>
                      </div>
                    )}
                    {selectedReceipt.parentName && (
                      <div>
                        <span className="text-[8.5px] text-zinc-400 uppercase block font-mono">Parent / Guardian Name</span>
                        <span className="font-bold text-slate-800 uppercase">{selectedReceipt.parentName}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-right">
                    <div>
                      <span className="text-[8.5px] text-zinc-400 uppercase block font-mono">Contact Details</span>
                      <span className="font-bold text-slate-800">{selectedReceipt.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[8.5px] text-zinc-400 uppercase block font-mono">Training Program / Dojo Batch</span>
                      <span className="font-bold text-slate-800 uppercase">{selectedReceipt.batch || 'Regular Dojo Batch'}</span>
                    </div>
                    <div>
                      <span className="text-[8.5px] text-zinc-400 uppercase block font-mono">Karate Belt Level Rank</span>
                      <span className="font-bold text-slate-800 uppercase text-[9.5px]">{selectedReceipt.beltLevel}</span>
                    </div>
                  </div>
                </div>

                {/* Items Invoice Table */}
                <div className="border border-zinc-250 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-zinc-100/85 border-b border-zinc-250 text-zinc-650 font-bold uppercase text-[8.5px] tracking-wider">
                        <th className="py-1.5 px-3 w-12 text-center">S.No</th>
                        <th className="py-1.5 px-3">Fee Particulars Description</th>
                        <th className="py-1.5 px-3 text-right w-32">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {selectedReceipt.items.map((item, index) => (
                        <tr key={item.id || index} className="text-slate-805">
                          <td className="py-1.5 px-3 text-center font-mono text-zinc-400">{index + 1}</td>
                          <td className="py-1.5 px-3 font-medium uppercase">{item.description}</td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold">₹{item.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pricing summary */}
                <div className="flex justify-between items-start pt-1.5">
                  <div className="max-w-[340px] text-[9.5px] text-zinc-500 italic space-y-1">
                    {selectedReceipt.remarks && (
                      <div>
                        <strong className="text-zinc-600 uppercase font-mono not-italic block text-[7.5px] tracking-widest font-bold">Remarks & payment details:</strong>
                        <span>{selectedReceipt.remarks}</span>
                      </div>
                    )}
                    <div className="pt-1">
                      <strong className="text-zinc-600 uppercase font-mono not-italic block text-[7.5px] tracking-widest font-bold">Disclaimer:</strong>
                      <span>This is an official computer-generated fee receipt. Paid amount is non-refundable and non-transferable.</span>
                    </div>
                  </div>

                  <div className="w-56 bg-zinc-50/70 border border-zinc-200 p-3 rounded-lg space-y-1.5 text-[11px]">
                    <div className="flex justify-between font-medium text-zinc-600">
                      <span>Total Invoice:</span>
                      <span className="font-mono font-bold text-slate-900">₹{selectedReceipt.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 border-b border-zinc-250 pb-1.5">
                      <span>Amount Received ({selectedReceipt.paymentMode}):</span>
                      <span className="font-mono">₹{selectedReceipt.paidAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="font-bold text-zinc-600">Balance Due:</span>
                      <span className="font-mono font-black text-[#FF3B3F] text-xs">₹{selectedReceipt.balanceAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Signature Block */}
                <div className="pt-4 flex justify-between text-[9.5px] text-zinc-500 border-t border-dashed border-zinc-200">
                  <div className="text-center w-36">
                    <div className="h-10 flex items-center justify-center relative">
                      <img
                        src="https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781350907/logo_new_bgwsw9.jpg"
                        alt="Lions Karate Club Pune Logo Seal"
                        className="w-9 h-9 rounded-full object-cover border border-[#FF3B3F]/45 opacity-80 filter saturate-150 rotate-[-8deg] mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute -bottom-1 text-[7px] font-sans font-black text-[#FF3B3F] bg-white/95 px-1 py-0.5 border border-[#FF3B3F]/35 rounded uppercase tracking-wider scale-90 rotate-[10deg]">
                        LKC SEAL
                      </div>
                    </div>
                    <div className="border-t border-zinc-200 mt-1 pt-0.5 font-mono uppercase text-[7.5px] font-bold tracking-wider text-zinc-400">Chief Dojo Seal</div>
                  </div>

                  <div className="text-center w-36">
                    <div className="h-8 flex items-end justify-center font-kanji font-black text-zinc-800 text-xs tracking-wide">Jadhav Sensei</div>
                    <div className="border-t border-zinc-200 mt-1 pt-0.5 font-mono uppercase text-[7.5px] font-bold tracking-wider text-zinc-400">Authorized Signature</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Container specifically formatted for A4 PDF download */}
            <div id="printable-receipt" className="hidden print:block bg-white text-slate-900 p-8 space-y-4 font-sans w-[210mm] text-[10px]">
              {/* Top Registration Bar */}
              <div className="flex justify-between items-center text-[8.5px] font-mono text-zinc-500 border-b border-zinc-200 pb-1 mb-1">
                <span className="font-bold tracking-wider text-zinc-600">CLUB REGISTER NO: PU000121240</span>
                <span className="tracking-widest uppercase font-bold text-zinc-400">Official Fees Receipt</span>
              </div>

              {/* Brand Header */}
              <div className="flex items-center justify-between border-b border-zinc-300 pb-3">
                <div className="flex items-center space-x-3.5">
                  <img
                    src="https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781350907/logo_new_bgwsw9.jpg"
                    alt="Lions Karate Club Pune Logo"
                    className="w-12 h-12 rounded-full object-cover border border-zinc-250"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h1 className="font-heading font-black text-base tracking-tight text-slate-950 uppercase">LIONS KARATE CLUB PUNE</h1>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Approved Karate Dojo • Affiliated with Karate India Association</p>
                    <p className="text-[8px] text-zinc-455 mt-0.5">Phone: +91 90496 88172 | Email: LIONSKARATECLUBPUNE09@gmail.com</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-zinc-50 border border-zinc-250 rounded px-2.5 py-1 text-left">
                    <span className="text-[8px] text-zinc-400 uppercase block font-mono tracking-wider font-bold">RECEIPT NO</span>
                    <strong className="text-xs font-mono font-black text-slate-950 block">LKC-{selectedReceipt.receiptNo}</strong>
                  </div>
                  <div className="text-[9px] text-zinc-550 mt-1.5 font-mono">Date: {new Date(selectedReceipt.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                </div>
              </div>

              {/* Student Particulars Grid */}
              <div className="bg-zinc-50 border border-zinc-250 p-3 rounded-lg grid grid-cols-2 gap-3 text-[10px] text-zinc-700 font-sans">
                <div className="space-y-1">
                  <div>
                    <span className="text-[8.5px] text-zinc-500 uppercase block font-mono">Student Name</span>
                    <strong className="text-slate-950 uppercase text-xs">{selectedReceipt.studentName}</strong>
                  </div>
                  {selectedReceipt.studentId && (
                    <div>
                      <span className="text-[8.5px] text-zinc-500 uppercase block font-mono">Roll Student ID</span>
                      <span className="font-mono font-bold text-slate-800">{selectedReceipt.studentId}</span>
                    </div>
                  )}
                  {selectedReceipt.parentName && (
                    <div>
                      <span className="text-[8.5px] text-zinc-500 uppercase block font-mono">Parent / Guardian Name</span>
                      <span className="font-bold text-slate-800 uppercase">{selectedReceipt.parentName}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-right">
                  <div>
                    <span className="text-[8.5px] text-zinc-500 uppercase block font-mono">Contact Details</span>
                    <span className="font-bold text-slate-800">{selectedReceipt.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-zinc-500 uppercase block font-mono">Training Program / Dojo Batch</span>
                    <span className="font-bold text-slate-800 uppercase">{selectedReceipt.batch || 'Regular Dojo Batch'}</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-zinc-500 uppercase block font-mono">Karate Belt Level Rank</span>
                    <span className="font-bold text-slate-800 uppercase text-[9.5px]">{selectedReceipt.beltLevel}</span>
                  </div>
                </div>
              </div>

              {/* Items Invoice Table */}
              <div className="border border-zinc-250 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-250 text-zinc-800 font-bold uppercase text-[8.5px] tracking-wider">
                      <th className="py-1.5 px-3 w-12 text-center">S.No</th>
                      <th className="py-1.5 px-3">Fee Particulars Description</th>
                      <th className="py-1.5 px-3 text-right w-32">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {selectedReceipt.items.map((item, index) => (
                      <tr key={item.id || index} className="text-slate-900">
                        <td className="py-1.5 px-3 text-center font-mono text-zinc-400">{index + 1}</td>
                        <td className="py-1.5 px-3 font-medium uppercase">{item.description}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold">₹{item.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pricing summary */}
              <div className="flex justify-between items-start pt-1.5">
                <div className="max-w-[340px] text-[9.5px] text-zinc-550 italic space-y-1">
                  {selectedReceipt.remarks && (
                    <div>
                      <strong className="text-zinc-700 uppercase font-mono not-italic block text-[7.5px] tracking-widest font-bold">Remarks & payment details:</strong>
                      <span>{selectedReceipt.remarks}</span>
                    </div>
                  )}
                  <div className="pt-1">
                    <strong className="text-zinc-700 uppercase font-mono not-italic block text-[7.5px] tracking-widest font-bold">Disclaimer:</strong>
                    <span>This is an official computer-generated fee receipt. Paid amount is non-refundable and non-transferable.</span>
                  </div>
                </div>

                <div className="w-56 bg-zinc-50 border border-zinc-250 p-3 rounded-lg space-y-1.5 text-[11px]">
                  <div className="flex justify-between font-medium text-zinc-600">
                    <span>Total Invoice:</span>
                    <span className="font-mono font-bold text-slate-900">₹{selectedReceipt.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-b border-zinc-250 pb-1.5">
                    <span>Amount Received ({selectedReceipt.paymentMode}):</span>
                    <span className="font-mono">₹{selectedReceipt.paidAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-bold text-zinc-600">Balance Due:</span>
                    <span className="font-mono font-black text-slate-950 text-xs">₹{selectedReceipt.balanceAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Signature Block */}
              <div className="pt-4 flex justify-between text-[9.5px] text-zinc-550 border-t border-dashed border-zinc-300">
                <div className="text-center w-36">
                  <div className="h-10 flex items-center justify-center relative">
                    <img
                      src="https://res.cloudinary.com/dlzdagymx/image/upload/q_auto/f_auto/v1781350907/logo_new_bgwsw9.jpg"
                      alt="Lions Karate Club Pune Logo Seal"
                      className="w-10 h-10 rounded-full object-cover border border-[#FF3B3F]/55 opacity-90 filter saturate-150 rotate-[-8deg]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 text-[7px] font-sans font-black text-[#FF3B3F] bg-white px-1.5 py-0.5 border border-[#FF3B3F]/55 rounded uppercase tracking-wider scale-90 rotate-[10deg]">
                      LKC SEAL
                    </div>
                  </div>
                  <div className="border-t border-zinc-250 mt-1 pt-0.5 font-mono uppercase text-[7.5px] font-bold tracking-wider text-zinc-500">Chief Dojo Seal</div>
                </div>

                <div className="text-center w-36">
                  <div className="h-8 flex items-end justify-center font-kanji font-black text-zinc-900 text-xs tracking-wide">Jadhav Sensei</div>
                  <div className="border-t border-zinc-250 mt-1 pt-0.5 font-mono uppercase text-[7.5px] font-bold tracking-wider text-zinc-500">Authorized Signature</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {adminTab === 'duplicate_finder' && (
        <div className="space-y-6 animate-fade-in py-2">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
            <div className="flex items-center space-x-3 text-red-500 uppercase">
              <AlertOctagon className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="font-heading font-black text-sm tracking-widest text-white uppercase">Duplicate ID Diagnostic & Repair Console</h3>
                <p className="text-[10px] text-zinc-500 font-medium normal-case mt-0.5">Detect, resolve and auto-assign unique student identifiers</p>
              </div>
            </div>

            <button
              onClick={handleTriggerIntegrityScan}
              disabled={isScanningDuplicates}
              className={`font-heading font-extrabold text-[11px] uppercase tracking-wider px-5 py-3 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer ${
                isScanningDuplicates
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-850 animate-pulse'
                  : 'bg-[#FF3B3F] hover:bg-rose-600 text-white hover:shadow-red-500/10 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningDuplicates ? 'animate-spin text-zinc-400' : 'text-white'}`} />
              <span>{isScanningDuplicates ? 'Scanning Database...' : 'Tap to Scan Database'}</span>
            </button>
          </div>

          {/* Active Scan Status Display */}
          {isScanningDuplicates && (
            <div className="bg-slate-950/80 border border-red-500/30 p-6 rounded-2xl text-center space-y-3 animate-pulse">
              <div className="w-8 h-8 border-2 border-[#FF3B3F] border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#FF3B3F] uppercase tracking-widest block">Active Runtime Integrity Scan</span>
                <p className="text-white font-heading font-black text-xs uppercase tracking-wider">Analyzing all admissions profiles & belt grading registration records in Firestore...</p>
              </div>
            </div>
          )}

          {!isScanningDuplicates && lastScannedTime && (
            <div className="bg-slate-900/40 border border-emerald-950/45 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
              <div className="flex items-center space-x-3 text-emerald-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-heading font-black uppercase tracking-wider text-white">Integrity Scan Completed!</span>
                  <p className="text-zinc-400 mt-1">
                    Successfully validated <strong className="text-emerald-400 font-bold">{scanStats?.students || 0}</strong> active student profiles and <strong className="text-emerald-400 font-bold">{scanStats?.exams || 0}</strong> belt grading records in real time.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-zinc-850 self-start sm:self-center font-bold">
                LAST CHECKED: {lastScannedTime}
              </span>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-slate-900/40 border border-zinc-900 p-5 rounded-2xl text-left space-y-3">
            <h4 className="font-heading font-black text-xs uppercase tracking-wider text-yellow-500">How to use the Diagnostic Console:</h4>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Below are grouped listings of students who currently share the **exact same Karate Roll ID** in the database. 
              Duplicate IDs cause registration errors, portal login conflicts, and misaligned belt progression histories.
            </p>
            <div className="text-zinc-500 text-[11px] font-sans space-y-1">
              <div>• <strong className="text-zinc-300">Generate Unique ID:</strong> Click this button to instantly query the database and suggest a fresh, guaranteed-unique, sequential Roll ID.</div>
              <div>• <strong className="text-zinc-300">Save & Sync:</strong> Saves the updated Roll ID directly to the student's profile and automatically cascades the update to all their registered Belt Grading Exams.</div>
            </div>
          </div>

          {!isScanningDuplicates && renderDiagnosticContent(false)}
        </div>
      )}

      {adminTab === 'overdue_reminders' && (
        <div className="space-y-6 animate-fade-in py-2">
          {/* Header Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-black text-sm sm:text-base tracking-widest text-white uppercase">
                    30-Day Overdue Fee Reminders & WhatsApp Dispatcher
                  </h3>
                  <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Auto-Filtered
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-medium normal-case mt-1">
                  Queries the <strong className="text-white">admissions</strong> database for students whose last payment is older than {overdueThresholdDays} days. Students from <span className="text-yellow-500 font-bold">Aryan Public School</span> and <span className="text-yellow-500 font-bold">Vasundhara Preprimary School</span> are automatically excluded.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyAllOverdueNumbers}
                className="font-heading font-bold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-850 text-zinc-200 hover:text-white cursor-pointer active:scale-95"
              >
                {copiedPhonesMessage ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Phone Numbers Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy All Overdue Numbers</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Metric Overview Cards */}
          {(() => {
            const overdueData = getOverdueStudentsData();
            const excludedCount = admissions.filter(s => isExcludedSchool(s.schoolName)).length;
            const totalWithPhone = overdueData.filter(o => (o.student.whatsApp || o.student.phone)).length;
            const estimatedOverdueAmount = overdueData.length * 1500;

            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-slate-950 border border-red-500/30 p-4 rounded-xl shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-bl-full pointer-events-none" />
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block tracking-wider">
                    Overdue Students (&gt;{overdueThresholdDays} Days)
                  </span>
                  <div className="flex items-baseline space-x-2 mt-1.5">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-red-500 tabular-nums">
                      {overdueData.length}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      of {admissions.length - excludedCount} eligible
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-emerald-950/60 p-4 rounded-xl shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block tracking-wider">
                    Exempted Schools Excluded
                  </span>
                  <div className="flex items-baseline space-x-2 mt-1.5">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                      {excludedCount}
                    </span>
                    <span className="text-[10px] text-emerald-500/90 font-medium">
                      Aryan & Vasundhara
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-zinc-900 p-4 rounded-xl shadow-lg relative overflow-hidden">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block tracking-wider">
                    WhatsApp Reachable
                  </span>
                  <div className="flex items-baseline space-x-2 mt-1.5">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-yellow-500 tabular-nums">
                      {totalWithPhone}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      valid numbers
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-zinc-900 p-4 rounded-xl shadow-lg relative overflow-hidden">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block tracking-wider">
                    Est. Outstanding Dues
                  </span>
                  <div className="flex items-baseline space-x-1 mt-1.5">
                    <span className="font-mono text-xl sm:text-2xl font-black text-white tabular-nums">
                      ₹{estimatedOverdueAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      (@₹1,500/mo)
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Search & Filter Bar */}
          <div className="bg-slate-950 border border-zinc-900 p-3.5 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search overdue students by name, Karate Roll ID, school, or parent phone..."
                value={overdueSearch}
                onChange={(e) => setOverdueSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-zinc-500 text-[10px] uppercase font-bold">Branch:</span>
                <select
                  value={overdueBranchFilter}
                  onChange={(e) => setOverdueBranchFilter(e.target.value)}
                  className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-950">All Branches</option>
                  {DOJO_BRANCHES.map(b => (
                    <option key={b.id} value={b.name} className="bg-slate-950">{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-zinc-500 text-[10px] uppercase font-bold">Threshold:</span>
                <select
                  value={overdueThresholdDays}
                  onChange={(e) => setOverdueThresholdDays(Number(e.target.value))}
                  className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value={30} className="bg-slate-950">30+ Days Overdue</option>
                  <option value={45} className="bg-slate-950">45+ Days Overdue</option>
                  <option value={60} className="bg-slate-950">60+ Days Overdue</option>
                  <option value={90} className="bg-slate-950">90+ Days Overdue</option>
                </select>
              </div>
            </div>
          </div>

          {/* Overdue Students Table */}
          {(() => {
            const rawOverdue = getOverdueStudentsData();
            const queryClean = overdueSearch.trim().toLowerCase();

            const filteredList = rawOverdue.filter(item => {
              const { student } = item;
              if (overdueBranchFilter !== 'all' && student.branch !== overdueBranchFilter) {
                return false;
              }
              if (!queryClean) return true;

              const nameMatch = (student.fullName || '').toLowerCase().includes(queryClean);
              const idMatch = (student.studentId || '').toLowerCase().includes(queryClean);
              const phoneMatch = (student.phone || '').includes(queryClean) || (student.whatsApp || '').includes(queryClean);
              const schoolMatch = (student.schoolName || '').toLowerCase().includes(queryClean);
              const parentMatch = (student.parentName || '').toLowerCase().includes(queryClean);

              return nameMatch || idMatch || phoneMatch || schoolMatch || parentMatch;
            });

            if (filteredList.length === 0) {
              return (
                <div className="bg-slate-950 border border-zinc-900 rounded-2xl p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-heading font-black text-sm uppercase tracking-wider text-white">
                    No Overdue Students Found
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                    {overdueSearch 
                      ? 'No overdue student profiles match your search criteria. Try modifying your search query or threshold.'
                      : `All active students are current on their fees (or belong to exempted partner schools Aryan Public School and Vasundhara Preprimary School).`}
                  </p>
                </div>
              );
            }

            return (
              <div className="bg-slate-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-900/60 border-b border-zinc-850 text-zinc-400 uppercase font-heading font-black text-[9px] tracking-widest">
                        <th className="py-4 px-5">Student Bio</th>
                        <th className="py-4 px-5">Karate Roll ID</th>
                        <th className="py-4 px-5">School / Institution</th>
                        <th className="py-4 px-5">Branch & Batch</th>
                        <th className="py-4 px-5">Parent & Phone</th>
                        <th className="py-4 px-5">Last Payment & Elapsed</th>
                        <th className="py-4 px-5 text-right">1-Click WhatsApp Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/60 text-xs">
                      {filteredList.map(({ student, daysOverdue, lastPaymentTimestamp, receiptsCount }) => {
                        const waUrl = generateWhatsAppLink(student, daysOverdue, lastPaymentTimestamp);
                        const rawPhone = student.whatsApp || student.phone || '';
                        const formattedDate = lastPaymentTimestamp > 0
                          ? new Date(lastPaymentTimestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Registration Date';

                        return (
                          <tr key={student.id} className="hover:bg-zinc-900/30 transition-colors">
                            {/* Student Bio */}
                            <td className="py-3.5 px-5">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={student.photoUrl || DEFAULT_STUDENT_AVATAR}
                                  alt={student.fullName}
                                  className="w-9 h-9 rounded-full object-cover border border-zinc-800 bg-zinc-900 shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = DEFAULT_STUDENT_AVATAR;
                                  }}
                                />
                                <div>
                                  <span className="font-heading font-black text-xs uppercase text-white block">
                                    {student.fullName}
                                  </span>
                                  <div className="flex items-center space-x-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                                    <span>{student.beltLevel || 'White Belt'}</span>
                                    <span>•</span>
                                    <span className="capitalize">{student.gender || 'N/A'}, {student.age ? `${student.age} yrs` : 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Karate Roll ID */}
                            <td className="py-3.5 px-5">
                              <span className="font-mono text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-md border border-yellow-500/20 inline-block">
                                {student.studentId || 'UNASSIGNED'}
                              </span>
                            </td>

                            {/* School / Institution */}
                            <td className="py-3.5 px-5">
                              <span className="text-xs text-zinc-300 font-medium block">
                                {student.schoolName || 'General / Private'}
                              </span>
                              <span className="text-[10px] text-zinc-500 block mt-0.5">
                                Non-exempt institution
                              </span>
                            </td>

                            {/* Branch & Batch */}
                            <td className="py-3.5 px-5">
                              <span className="text-xs text-zinc-300 font-medium block">
                                {student.branch || 'Main Dojo'}
                              </span>
                              <span className="text-[10px] text-zinc-500 block mt-0.5">
                                {student.batch || 'Regular Karate'}
                              </span>
                            </td>

                            {/* Parent Contact */}
                            <td className="py-3.5 px-5">
                              <span className="text-xs text-zinc-300 block font-medium">
                                {student.parentName || 'Parent / Guardian'}
                              </span>
                              <div className="flex items-center space-x-1.5 text-zinc-400 font-mono text-[11px] mt-0.5">
                                <Phone className="w-3 h-3 text-zinc-500 shrink-0" />
                                <span>{rawPhone || 'No contact saved'}</span>
                              </div>
                            </td>

                            {/* Last Payment & Recency */}
                            <td className="py-3.5 px-5">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-1.5">
                                  <Calendar className="w-3 h-3 text-zinc-500 shrink-0" />
                                  <span className="text-xs font-mono text-zinc-300 font-bold tabular-nums">
                                    {formattedDate}
                                  </span>
                                </div>
                                <div>
                                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                                    daysOverdue >= 60 
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  }`}>
                                    {daysOverdue} days overdue
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* WhatsApp Action */}
                            <td className="py-3.5 px-5 text-right">
                              {waUrl ? (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-heading font-black text-[11px] uppercase tracking-wider px-3.5 py-2.5 rounded-xl shadow-md shadow-emerald-950/50 transition-all cursor-pointer whitespace-nowrap"
                                  title={`Open WhatsApp chat with ${rawPhone}`}
                                >
                                  <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                                  <span>Send WhatsApp</span>
                                  <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="inline-flex items-center space-x-1.5 bg-zinc-900 border border-zinc-800 text-zinc-500 font-heading font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded-xl cursor-not-allowed whitespace-nowrap"
                                >
                                  <span>No Phone Saved</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-zinc-850/60 bg-zinc-950/60 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
                  <span>
                    Showing <strong className="text-zinc-300">{filteredList.length}</strong> overdue students (&gt;{overdueThresholdDays} days without recorded payment)
                  </span>
                  <span className="font-mono text-[11px]">
                    Tip: Click "Send WhatsApp" to open WhatsApp Web or the app with pre-filled reminder
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Duplicate ID Diagnostic & Repair Modal */}
      {duplicateRepairOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-md flex justify-center p-4 items-start sm:items-center">
          <div className="bg-slate-900 border border-zinc-850 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl relative my-6">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF3B3F]" />
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-850 flex items-center justify-between">
              <div className="flex items-center space-x-3 text-red-500 uppercase">
                <AlertOctagon className="w-5 h-5 text-red-500 animate-pulse" />
                <h3 className="font-title text-base font-bold text-white tracking-wider">Duplicate ID Diagnostic & Repair Console</h3>
              </div>
              <button 
                type="button"
                onClick={() => setDuplicateRepairOpen(false)}
                className="bg-[#FF3B3F] hover:bg-rose-600 text-white font-heading font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-md"
              >
                <X className="w-3.5 h-3.5 text-white stroke-[3px]" />
                <span>Close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="bg-slate-950 p-4 border border-zinc-850 rounded-xl text-left">
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  Below are groups of students who currently share the **exact same Karate Roll ID** or have ID inconsistencies in the database. Correcting these will ensure accurate database synchronization, secure student portal logins, and individual progression.
                </p>
                <p className="text-yellow-500/95 text-[11px] font-medium mt-2 flex items-center gap-1.5 font-sans">
                  <span>💡 Tip: Click "Generate Unique ID" to instantly fetch a brand new sequential ID for any student!</span>
                </p>
              </div>

              {renderDiagnosticContent(true)}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-zinc-850 bg-slate-950 flex justify-end">
              <button 
                type="button"
                onClick={() => setDuplicateRepairOpen(false)}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
              >
                All Set
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
