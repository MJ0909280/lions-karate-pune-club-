/**
 * Types and interfaces for the Legacy Karate Club web application.
 */

export interface Admission {
  id: string;             // Document ID in Firestore
  studentId: string;      // Formatted ID: LKCP-YYYY-XXX
  fullName: string;
  dob: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  parentName: string;
  phone: string;
  whatsApp: string;
  email: string;
  address: string;
  batch: string;          // Selected batch name
  beltLevel: string;      // Current belt color
  photoUrl: string;       // Compressed image as base64 string
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;      // Milliseconds timestamp
  updatedAt: number;      // Milliseconds timestamp
  approvedAt?: number;
  rejectedAt?: number;
  branch?: string;        // Selected Karate Training Branch
  coachName?: string;     // Automated assigned coach based on branch selection
  feesStatus?: 'Paid' | 'Unpaid'; // Track student fee status
  schoolName?: string;    // School / college / institution name
  lastCelebratedYear?: number; // The calendar year in which the student's birthday was marked celebrated
  paidMonths?: string[];   // Array of YYYY-MM formatted strings representing months paid
  lastPaymentDate?: number;
}

export interface BranchInfoStatic {
  id: string;
  name: string;
  coach: string;
}

export const DOJO_BRANCHES: BranchInfoStatic[] = [
  {
    id: 'manaji-nagar',
    name: 'Manaji Nagar Branch',
    coach: 'Maruti Jadhav Sir 2nd dan Black Belt'
  },
  {
    id: 'bhumkar-bridge',
    name: 'Bhumkar Bridge Branch',
    coach: 'Shivraj jejure Sir 2nd dan Black belt'
  },
  {
    id: 'jambulwadi-lakeview',
    name: 'Jambulwadi Lake View Branch',
    coach: 'Shital Samindar Mam assistant Coach'
  }
];

export interface BatchInfo {
  id: string;
  name: string;
  ageGroup: string;
  timing: string;
  days: string;
  focus: string;
  price: string;
  coaches?: string; // Comma-separated list or formatted name of assigned coaches
}

export interface CoachInfo {
  name: string;
  rank: string;
  role: string;
  experience: string;
  bio: string;
  image: string;
}

export const BELT_LEVELS = [
  { name: 'White Belt', color: 'border-slate-300 text-slate-300 bg-slate-900', bgClass: '#ffffff' },
  { name: 'Yellow', color: 'border-yellow-400 text-yellow-400 bg-slate-900', bgClass: '#facc15' },
  { name: 'Orange', color: 'border-orange-500 text-orange-500 bg-slate-900', bgClass: '#f97316' },
  { name: 'Green', color: 'border-emerald-500 text-emerald-500 bg-slate-900', bgClass: '#10b981' },
  { name: 'Blue', color: 'border-blue-500 text-blue-500 bg-slate-900', bgClass: '#3b82f6' },
  { name: 'Purple', color: 'border-purple-500 text-purple-500 bg-slate-900', bgClass: '#a855f7' },
  { name: 'Red', color: 'border-red-500 text-red-500 bg-slate-900', bgClass: '#ef4444' },
  { name: 'Brown', color: 'border-amber-700 text-amber-700 bg-slate-900', bgClass: '#b45309' },
  { name: 'Brown 1+2', color: 'border-amber-800 text-amber-800 bg-slate-900', bgClass: '#92400e' },
  { name: 'Brown 3+4', color: 'border-amber-900 text-amber-900 bg-slate-900', bgClass: '#78350f' },
  { name: 'Black 1st Dan', color: 'border-red-600 text-red-600 bg-black', bgClass: '#000000' }
] as const;

export const BATCH_TIMINGS: BatchInfo[] = [
  {
    id: 'little-tigers',
    name: 'Little Tigers',
    ageGroup: 'Kids (Ages 4 - 7)',
    timing: '05:00 PM - 06:00 PM / 06:00 PM - 07:00 PM / 07:00 PM - 08:00 PM',
    days: '6 Days a week (Mon - Sat)',
    focus: 'Coordination, Discipline, Focus & Fun Karate Basics built for young champions starting from Age 4',
    price: '$80/month'
  },
  {
    id: 'young-warriors5-14',
    name: 'Young Warriors',
    ageGroup: 'Youth (Ages 8 - 14)',
    timing: '05:00 PM - 06:00 PM / 06:00 PM - 07:00 PM / 07:00 PM - 08:00 PM',
    days: '6 Days a week (Mon - Sat)',
    focus: 'Self-Defense drills, Kata, Sparring (Kumite) & Strength. Multi-slot evening options.',
    price: '$95/month'
  },
  {
    id: 'elite-dojo-15-plus',
    name: 'Elite Dojo (Adults & Teens)',
    ageGroup: 'Teens & Adults (15+)',
    timing: '05:00 PM - 06:00 PM / 06:00 PM - 07:00 PM / 07:00 PM - 08:00 PM',
    days: '6 Days a week (Mon - Sat)',
    focus: 'Advanced Kata, Defensive Combat, Olympic Sparring & Mastery. Multi-slot evening options.',
    price: '$110/month'
  },
  {
    id: 'online-mentor',
    name: 'Online 1-on-1 Program',
    ageGroup: 'Adults & Kids (Flexible Time)',
    timing: 'Custom Morning & Evening Slots',
    days: 'Choose or Drop Text for Custom Slots',
    focus: 'Dedicated 1-on-1 private coaching, adult self-defense, and flexible virtual Shotokan belt promotions.',
    price: '$120/month'
  }
];

export interface ExamSchedule {
  id: string;
  examDate: string;
  beltLevel: string;
  venueDetails: string;
  prerequisites: string;
  createdAt: number;
  updatedAt: number;
}

export type GradeValue = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'F';

export interface DisciplineGrades {
  run?: GradeValue;
  jump?: GradeValue;
  sidesitups?: GradeValue;
  kicks?: GradeValue;
  conditionChecking?: GradeValue;
  kata?: GradeValue;
  kumite?: GradeValue;
}

export interface ExamRegistration {
  id: string; // Document ID in Firestore
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
  disciplinesGrades?: DisciplineGrades;
  examinerName?: string;
  gradedAt?: number;
  checkedIn?: boolean;
  checkInTime?: string;
  checkInTimestamp?: number;
  createdAt: number;
  updatedAt: number;
}

export const GRADE_POINTS: Record<GradeValue, number> = {
  'A+': 4.3,
  'A': 4.0,
  'B+': 3.3,
  'B': 3.0,
  'C': 2.0,
  'F': 0.0
};

export function calculateOverallGrade(disciplines?: DisciplineGrades): GradeValue | undefined {
  if (!disciplines) return undefined;
  const values = Object.values(disciplines).filter((v): v is GradeValue => Boolean(v));
  if (values.length === 0) return undefined;

  let totalPoints = 0;
  values.forEach((g) => {
    totalPoints += GRADE_POINTS[g] ?? 0;
  });

  const avg = totalPoints / values.length;
  if (avg >= 4.1) return 'A+';
  if (avg >= 3.6) return 'A';
  if (avg >= 3.1) return 'B+';
  if (avg >= 2.5) return 'B';
  if (avg >= 1.5) return 'C';
  return 'F';
}

export interface ReceiptItem {
  id: string;
  description: string;
  amount: number;
}

export interface Receipt {
  id?: string;
  receiptNo: string;
  date: string;
  studentId: string;
  studentName: string;
  parentName: string;
  phone: string;
  whatsApp: string;
  email: string;
  address: string;
  branch: string;
  batch: string;
  beltLevel: string;
  paymentMode: string;
  items: ReceiptItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  remarks: string;
  createdAt: number;
}

export interface ParentQuery {
  id: string; // Document ID in Firestore
  parentName: string;
  childName?: string;
  phone: string;
  email?: string;
  queryType: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  followUpNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  branch: string;
  status: 'present' | 'absent';
  markedAt: number;
  markedBy?: string;
}

export function isExcludedSchool(schoolName?: string | null): boolean {
  if (!schoolName) return false;
  const normalized = schoolName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalized.includes('aryan') || normalized.includes('vasundhara');
}

export function getCurrentMonthKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthKey(key: string): string {
  const parts = key.split('-');
  if (parts.length < 2) return key;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const date = new Date(year, month, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export function getShortMonthKey(key: string): string {
  const parts = key.split('-');
  if (parts.length < 2) return key;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const date = new Date(year, month, 1);
  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}

// System starts fee tracking from November 2026 (no fake past months)
export const FEE_SYSTEM_START_MONTH = '2026-11';

export function getUnpaidMonths(student: Admission, currentKey: string = getCurrentMonthKey()): string[] {
  const paidSet = new Set(student.paidMonths || []);
  const unpaid: string[] = [];

  // Parse start year/month (November 2026) and currentKey
  const [startYear, startMonth] = FEE_SYSTEM_START_MONTH.split('-').map(Number);
  const [currYear, currMonth] = currentKey.split('-').map(Number);

  // If currentKey is prior to start month, only evaluate currentKey
  if (currYear < startYear || (currYear === startYear && currMonth < startMonth)) {
    if (!paidSet.has(currentKey)) {
      unpaid.push(currentKey);
    }
    return unpaid;
  }

  // Iterate from launch month up to currentKey
  let y = startYear;
  let m = startMonth;
  while (y < currYear || (y === currYear && m <= currMonth)) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    if (!paidSet.has(key)) {
      unpaid.push(key);
    }
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  return unpaid;
}

export function generateMonthlyFeeWhatsAppMessage(student: Admission, unpaidMonths: string[]): string {
  const formattedMonthNames = unpaidMonths.map(formatMonthKey).join(', ');
  const monthSummary = unpaidMonths.length === 1 
    ? `for *${formattedMonthNames}*` 
    : `for *${formattedMonthNames}* (Total: *${unpaidMonths.length} Months Pending*)`;

  return `🥋 *LIONS KARATE CLUB PUNE*
*Monthly Dojo Training Fee Reminder*

Dear Parent of *${student.fullName}* (Student ID: *${student.studentId}*),
🥋 *Branch:* ${student.branch || 'Manaji Nagar Branch'}
🥋 *Belt Level:* ${student.beltLevel}

This is a gentle reminder that monthly karate training fees ${monthSummary} are pending. Dojo fees are collected between the *1st and 10th of every month*.

Kindly complete the payment at your earliest convenience to maintain continuous training and attendance records.

For UPI / Cash payment details or receipt queries, please contact Chief Instructor:
*Sensei Maruti Jadhav*
📞 +91 90496 88172

Thank you for your cooperation!
OSS! 🥋`;
}
