# 30-Day Overdue Fee Reminders Tab in Admin Panel

Add a dedicated, automated fee reminder dashboard inside the Admin Panel that filters active students from the `admissions` collection whose last fee payment date is older than 30 days (or has no recorded payment within 30 days of admission), excludes students enrolled from Aryan Public School and Vasundhara Preprimary School, and provides a 1-click WhatsApp reminder button with personalized parent messaging.

### User Review & Critical Decisions

> [!IMPORTANT]
> The clarifying questions were completed with recommended standards:
> - **Payment Recency Tracking**: The system calculates the last payment date by inspecting the most recent entry for the student across the `receipts` collection and the `admissions` document (`lastPaymentDate` or `createdAt` as fallback).
> - **School Exclusion Filter**: Strict case-insensitive matching for `"Aryan Public School"` and `"Vasundhara Preprimary School"` (e.g. variations such as `"aryan public"`, `"vasundhara"`, `"vasundhara preprimary"`, `"aryan"`) to exclude those institutional cohorts from receiving karate fee reminder prompts.
> - **Default WhatsApp Template**: Friendly, branded message from Lions Karate Club Pune containing the student's name, Karate Roll ID, days overdue, and Sensei contact details. Includes an in-tab editable message preview so the admin can customize before sending if desired.
> - **Navigation Tab Label**: Integrated as **"Overdue Reminders"** with an amber/red overdue counter badge in the Admin Panel navigation bar.

---

### 1. Overview & Core Concept

- **What It Does**: Scans all student records in the `admissions` collection, joins them with payment history from `receipts` (and student document payment fields), identifies records where more than 30 days have elapsed since their last payment, filters out students belonging to Aryan Public School and Vasundhara Preprimary School, and presents an interactive action list with direct WhatsApp launch buttons.
- **Target Persona**: Dojo Administrator (Shihan / Admin) tracking fee collections and following up with parents on outstanding dues without manually cross-referencing school rosters or paper registers.
- **Key Value**: Eliminates manual cross-checking of school names and payment dates; allows 1-click overdue reminders directly through WhatsApp Web / mobile app with proper country code formatting (`+91`).

---

### 2. User Experience & Visual Design

- **Navigation & Tab Placement**:
  - A new tab named **"Overdue Reminders"** placed alongside existing Admin tabs (*Student Directory*, *Parent Queries*, *Fees & Billing*, *Duplicate Finder*).
  - Displays a dynamic badge showing the count of students with payments overdue by > 30 days (excluding the two exempted schools).
- **Dashboard Metrics & Summary Cards**:
  - Total Overdue Students (>30 Days).
  - Total Outstanding Est. Fees.
  - Exempted School Filter Indicator (tagging Aryan Public School & Vasundhara Preprimary as excluded).
  - Quick Search bar (by student name, Roll ID, or parent phone number).
- **Interactive Student List**:
  - High-density data grid adhering to Dojo dark theme (`#0E0E10`, `#161619`, with `#FF2A35` and `#EAB308` accents).
  - Columns: Student Photo & Bio, Karate Roll ID, Branch & Batch, School Name, Last Payment Date, Days Overdue, and WhatsApp Quick Action.
  - Tabular numerals (`font-mono tabular-nums`) for dates, days elapsed, and phone numbers.
- **1-Click WhatsApp Trigger**:
  - Green WhatsApp action button (`bg-emerald-600 hover:bg-emerald-500`) formatted with `https://wa.me/{phone}?text={encodedMessage}`.
  - Pre-populates a polite reminder:
    ```
    🥋 Lions Karate Club Pune — Monthly Fee Reminder
    
    Dear Parent,
    This is a friendly reminder that karate training fees for [Student Name] (ID: [LKCP-YYYY-XXX]) were last updated on [Date] ([X] days ago).
    
    Kindly update the monthly dues at the Dojo or via UPI at your convenience.
    
    Sensei Maruti Jadhav
    Lions Karate Club Pune
    📞 +91 90496 88172
    ```
  - Also supports a **"Copy Phone Numbers"** quick tool to copy all overdue parents' phone numbers for bulk broadcast if needed.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Joint Recency Calculation (Receipts + Admissions)**
  - *Chosen Approach*: Examine the latest timestamp between `receipt.createdAt` / `receipt.date` (matched by `studentId` or `studentName`) and the admission's `lastPaymentDate` / `createdAt`. If greater than $30 \times 24 \times 60 \times 60 \times 1000$ ms, mark as overdue.
  - *Why*: In Firestore, some students have payments recorded as `receipts` documents, while others have initial payments during admission. Looking at both guarantees no false positives for recently paying students.
- **Decision 2: Strict Normalized School Filtering**
  - *Chosen Approach*: Normalize `student.schoolName` (lowercase, trim, stripped spaces/punctuation) and exclude if it contains `"aryan"` or `"vasundhara"`.
  - *Why*: Accommodates typo variations from parents when filling the admission form (e.g. `"Aryan public School"`, `"Aryan Public"`, `"Vasundhara Pre-Primary"`, `"Vasundhara pre primary"`).
- **Decision 3: Zero-Disruption Tab Addition**
  - *Chosen Approach*: Add `overdue_reminders` to `adminTab` state type in `AdminPanel.tsx` and render as a peer tab with standard desktop and mobile drawer navigation support.
  - *Why*: Keeps the existing *Student Directory*, *Bills*, and *Queries* tabs intact while giving the admin a dedicated focused space for dues collection.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                 Firestore Realtime Collections              │
│   ┌───────────────────────────┐ ┌─────────────────────────┐ │
│   │   'admissions' Collection │ │  'receipts' Collection  │ │
│   │  (fullName, studentId,    │ │ (studentId, paidAmount, │ │
│   │   schoolName, phone, ...) │ │  createdAt, date, ...)  │ │
│   └─────────────┬─────────────┘ └────────────┬────────────┘ │
└─────────────────┼────────────────────────────┼──────────────┘
                  ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 AdminPanel Overdue Hook/Filter               │
│                                                             │
│ 1. Normalize schoolName                                     │
│    -> Exclude: /aryan/i and /vasundhara/i                   │
│                                                             │
│ 2. Compute Last Payment Date:                               │
│    -> max(latestReceiptDate, lastPaymentDate, createdAt)    │
│                                                             │
│ 3. Filter:                                                  │
│    -> (Now - LastPaymentDate) > 30 Days                     │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               "Overdue Reminders" Tab UI                    │
│  ┌───────────────────────┐  ┌────────────────────────────┐  │
│  │ Metrics: Count & Days │  │ Search & WhatsApp Template │  │
│  └───────────────────────┘  └────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Student Overdue Table & 1-Click WhatsApp Direct Links │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

- **Interactive Component & State Mapping**:
  - `adminTab`: Updated to include `'overdue_reminders'`.
  - `overdueSearch`: Text search state for filtering students by name, ID, or phone.
  - `customReminderMsg`: Editable reminder message prefix state.
  - WhatsApp URL generation: Formats phone numbers by stripping non-digit characters and prepending `91` if not already included.
