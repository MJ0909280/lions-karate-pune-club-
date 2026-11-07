# Monthly Fee Cycle Tracker (1st–10th) & Dynamic Multi-Month Reminders Implementation Plan

Replace arbitrary 30-day overdue numbers with a practical 1st-to-10th monthly fee tracker. Allows coaches and admins to 1-tap mark each student's monthly fee as Paid or Unpaid, automatically tracking unpaid months and generating dynamic WhatsApp reminders that list the exact unpaid months.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were clarified and confirmed:
> - **Removal of 30-Day Overdue Banner**: The arbitrary statistics banner ("OVERDUE STUDENTS (>30 DAYS) 77 of 79 eligible / EST. OUTSTANDING DUES ₹1,15,500") is removed completely.
> - **Monthly Due Date Context**: The dojo fee collection period is the **1st to 10th of every month**.
> - **1-Tap Paid Toggles**: 1-tap button to mark the current month as Paid or Unpaid, accessible in **both Coach Portal and Admin Panel**.
> - **Multi-Month Accumulation**: If a previous month was not paid, it remains marked unpaid. The system dynamically detects all unpaid months (e.g., *October, November — 2 Months Pending*).
> - **Dynamic WhatsApp Message**: The WhatsApp message explicitly names the unpaid months and requests the parent contact Sensei Maruti Jadhav for the exact payment breakdown without hardcoded arbitrary rupee amounts.
> - **Persistence**: Monthly fee payment statuses saved per student in Firestore (`monthly_fee_records` or student `paidMonths: string[]` e.g. `["2026-10", "2026-11"]`).

---

## 1. Overview & Core Concept

1. **Monthly Due Logic (1st–10th)**:
   - Karate training fees are due between the 1st and 10th of each month.
   - For any active student, the system evaluates fee status for the current calendar month and any preceding months they were enrolled.
2. **1-Tap Paid/Unpaid Status**:
   - For each student, coaches and admins see the current month status (e.g. `Nov 2026: [✓ Paid] / [Mark Paid]`).
   - If marked Paid, the student is up-to-date. Next month (Dec 2026), only December will be due.
   - If left Unpaid, when the next month arrives, the system registers both months as pending.
3. **Dynamic WhatsApp Reminder**:
   - If 1 month unpaid: *"Reminder for November 2026 monthly karate training fees (Due: 1st–10th)."*
   - If 2+ months unpaid: *"Important Reminder: Monthly training fees are pending for: October 2026, November 2026 (Total: 2 Months). Kindly clear the pending dues."*
   - Includes Sensei Maruti Jadhav's contact (+91 90496 88172) and UPI/Cash guidance.
4. **Aryan & Vasundhara Protection**:
   - Preserves automatic exemption for Aryan Public School and Vasundhara Preprimary School students where fees are managed directly by school administration.

---

## 2. User Experience & Visual Design

### Key User Flows

```
               [Coach Portal / Admin Panel]
                           │
                           ▼
          [Student Row: Monthly Fee Tracker]
    ┌──────────────────────────────────────────────┐
    │ Student: Aarav Sharma (ID: LKCP-2026-012)    │
    │ Branch: Manaji Nagar Branch                  │
    │                                              │
    │ Status: ⚠️ 2 Months Pending                   │
    │  • Oct 2026: [Unpaid] [Mark Paid]            │
    │  • Nov 2026: [Unpaid] [Mark Paid]            │
    │                                              │
    │ [💬 Send WhatsApp Reminder (2 Months)]       │
    └──────────────────────┬───────────────────────┘
                           │
                           ▼ (Click)
    [WhatsApp Launched with Personalized Message]
    "Dear Parent of Aarav Sharma,
     Monthly fees are pending for: October 2026, November 2026.
     Kindly complete the payment (Due date: 1st-10th of every month)..."
```

### Visual Styling
- **Status Badges**:
  - Green unboxed text (`text-emerald-400`): Up-to-date (`Nov 2026 Paid`).
  - Amber badge (`text-yellow-400 bg-yellow-500/10`): Current month due (1st–10th cycle).
  - Crimson badge (`text-rose-400 bg-rose-500/10`): 2+ months overdue with exact count (`2 Months Pending`).
- **1-Tap Action**:
  - Compact toggle button `[✓ Mark Nov Paid]` which instantly turns to `[Paid ✓]` with green checkmark.
- **Clean Table**:
  - Replaces the 4 arbitrary stat cards with a clean, focused control strip:
    - Quick branch filter (`Manaji Nagar`, `Bhumkar Bridge`, `Jambulwadi Lake View`).
    - Month selector (`November 2026`).
    - Simple summary counter (`Paid: X · Pending: Y`).

---

## 3. Technical Architecture & Data Strategy

### Data Model & Firestore Structure

```
Firestore: admissions/{studentDocId}
├── paidMonths: ["2026-09", "2026-10"]  <-- Array of YYYY-MM strings marked paid
└── lastPaymentDate: timestamp
```
Or subcollection/document in `monthly_fees/{studentId}`:
- `studentId`: string
- `paidMonths`: Record<string, boolean> (e.g. `{"2026-10": true, "2026-11": false}`)
- `updatedAt`: timestamp

Using `paidMonths: string[]` on the `admissions` document (and synced in `admissions` state) provides:
- Instant atomic reads with the student document.
- Zero extra queries or latency.
- Simple 1-tap toggling: `arrayUnion(currentMonthKey)` / `arrayRemove(currentMonthKey)`.

### Dynamic Message Generator

```typescript
function generateMonthlyFeeWhatsAppMessage(student: Admission, unpaidMonths: string[]): string {
  const monthNames = unpaidMonths.map(formatMonthName).join(', ');
  const monthCountText = unpaidMonths.length === 1 
    ? `for *${monthNames}*` 
    : `for *${monthNames}* (Total: *${unpaidMonths.length} Months Pending*)`;

  return `🥋 *LIONS KARATE CLUB PUNE*
*Monthly Dojo Training Fee Reminder*

Dear Parent of *${student.fullName}* (Student ID: *${student.studentId}*),
🥋 *Branch:* ${student.branch || 'Manaji Nagar Branch'}
🥋 *Belt Level:* ${student.beltLevel}

This is a gentle reminder that karate training fees ${monthCountText} are pending. Monthly dojo fees are collected between the *1st and 10th of every month*.

Kindly complete the payment at your earliest convenience to keep training records up to date.

For UPI / Cash payment details or receipt queries, please contact Chief Instructor:
*Sensei Maruti Jadhav*
📞 +91 90496 88172

Thank you for your cooperation!
OSS! 🥋`;
}
```

---

## 4. Components to Update

1. **`src/components/AdminPanel.tsx`**:
   - In the `Overdue Reminders` tab:
     - Remove the arbitrary stats cards (`OVERDUE STUDENTS (>30 DAYS) 77 of 79`, `EST. OUTSTANDING DUES ₹1,15,500`, `COPY ALL OVERDUE NUMBERS`).
     - Introduce the Monthly Cycle Manager (1st–10th).
     - Display current month + unpaid month pills for each student.
     - Add 1-tap `[Mark Paid]`/`[Unmark]` button for the current month.
     - Hook WhatsApp button to `generateMonthlyFeeWhatsAppMessage`.
   - In `Student Directory`:
     - Keep the individual student WhatsApp reminder button synced with unpaid months.
2. **`src/components/CoachPortal.tsx`**:
   - Add monthly fee payment status column next to attendance:
     - Shows current month status: `[✓ Paid]` or `[Mark Paid]`.
     - 1-tap updates `paidMonths` in Firestore.
     - WhatsApp button sends the multi-month reminder message.

---

## 5. Verification & Completed Results

- [x] **Removed Old Cards**: Completely removed the 4 confusing 30-day overdue stat cards shown in `image_ecf9de67.png` (`OVERDUE STUDENTS (>30 DAYS)`, `EST. OUTSTANDING DUES ₹1,15,500 (@₹1,500/mo)`, and `COPY ALL OVERDUE NUMBERS`).
- [x] **1-Tap Paid Toggles**: 1-tap `[✓ Mark Paid]` button live in both Admin Panel and Coach Portal with real-time Firestore persistence and undo capability.
- [x] **Multi-Month Dynamic Accumulation**: System evaluates past months and current month (1st–10th cycle); accumulated unpaid months appear with pill badges and can be marked paid individually.
- [x] **Personalized WhatsApp Reminders**: Mentions exact unpaid months (e.g. `for October 2026, November 2026 (Total: 2 Months Pending)`) without hardcoded rupee sums, directing parents to Chief Instructor Sensei Maruti Jadhav (+91 90496 88172).
- [x] **Branch Isolation**: Coach Portal is password-protected (`LKCP09`) and isolates students strictly by the 3 official branches (`Manaji Nagar Branch`, `Bhumkar Bridge Branch`, `Jambulwadi Lake View Branch`).
- [x] **Partner School Exemption**: Students enrolled under Aryan Public School and Vasundhara Preprimary School remain excluded from fee reminders as their fees are school-managed.
- [x] **Code Quality & Build**: Code compiled cleanly with 0 errors across TypeScript lint and Vite build. Dev server running on port 3000.
