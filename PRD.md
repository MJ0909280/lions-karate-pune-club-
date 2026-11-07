# Product Requirements Document (PRD) — LIONS KARATE CLUB PUNE

## 1. Overview & Goals
Our goal is to evolve the Lions Karate Club website into a highly functional, compact, and premium full-stack portal. The application will solve two core challenges:
1. **Reduce Page Scrolling Density**: Make the landing page visually premium, interactive and compact so that parents do not experience scrolling fatigue.
2. **Student Progress & Exam Tracker**: Connect the frontend and backend of Admissions, Belt Ranks, and Grading Exams, enabling parents to track their child’s progress using a Coach-assigned Student ID.

---

## 2. Core Functional Modules

### A. Compact Landing Page UX (Scroll Reduction)
- **Interactive Training Batches Carousel**: Replace heavy vertical cards with an interactive carousel or compact tab filter (e.g., Kids, Youth, Adults).
- **Collapsible / Tabbed Sections**: Pack secondary details into sleek, modern, interactive drawer menus or hover interactions.
- **Micro-Animations**: Enhance transitions with smooth, purpose-driven animations using Framer Motion.

### B. Student Progress Portal (Lookup Tool)
- **Lookup Field**: Parents enter the Student ID in `LKCP-YYYY-XXX` format.
- **Profile Display**: Displays full name, branch, joining date, current belt level with a beautiful visual belt color design.
- **Belt Rank Progression timeline**: A sleek path illustrating current rank to Black Belt.
- **Exams Registry Tab / Form**: If approved, parents can register the child for an upcoming belt exam right from the tracker view!
- **Exams History Log**: Shows the history of all past exams, dates, results (Pass/Pending), assigned grades, and custom remarks left by the Coach.

### C. Coach Admin Section (Exams & Belt Grading Panel)
- **New "Exams & Grading" Tab**: Added to the secure Master Console. This displays all submitted exam registries in real-time.
- **Confirmation & Fees Approval**: Confirm registrations (approve slot/fee status) changing from `pending` to `approved`.
- **Belt Grading & Promotion Engine**:
  - Coach can grade an exam by entering the Grade (e.g., A, B+) and Sensei feedback comments.
  - Set state to `passed` or `failed`.
  - **AUTOMATIC PROMOTION**: Upon setting an exam as `passed`, the student's current belt level in their main `admissions` admission profile document automatically updates to the new belt rank!
- **Student Profile Management**: Directly modify belt levels, registration files, and view transaction records.

---

## 3. Database Schema Design (Firestore)

### Collection: `admissions` (Enrolled Students)
- `studentId`: string (Format: `LKCP-YYYY-XXX`)
- `fullName`: string
- `dob` / `age` / `gender`: student demographics
- `parentName` / `phone` / `whatsApp` / `email`: contact PII
- `branch`: string (selected Dojo Branch)
- `coachName`: string (automated based on branch)
- `batch`: string (session selection)
- `beltLevel`: string (current rank, e.g., "White Belt", "Yellow Belt")
- `feesStatus`: `'Paid' | 'Unpaid'`
- `status`: `'pending' | 'approved' | 'rejected'`
- `joiningDate`: number (timestamp populated on approval)
- `createdAt` / `updatedAt`: number (timestamp)

### Collection: `exams` (New)
- `id`: string (generator Doc ID)
- `studentId`: string (FK LKCP-YYYY-XXX)
- `studentName`: string
- `parentName`: string
- `parentPhone`: string
- `branch`: string
- `currentBelt`: string
- `targetBelt`: string
- `status`: `'pending' | 'approved' | 'passed' | 'failed'`
- `grade`: string (e.g., `'A'`, `'B+'`)
- `remarks`: string (Coach/Examiner remarks)
- `createdAt` / `updatedAt`: number

---

## 4. Visual Layout Strategy
1. **Interactive Cards**: Merge Gallery and Testimonials into a single horizontal slider.
2. **Tabbed Information Architecture**: Keep "About Us" and "Virtues" side-by-side using space-efficient design grids.
3. **Responsive Lookups**: Provide a seamless mobile tracker, letting parents check progress and pay exam fees without switching devices.
