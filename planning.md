# Planning.md

## Project Overview

This project is a **Static React Frontend Application** for an **Employee Attendance & Payroll System**. The system focuses on attendance tracking, advance payments, and payroll calculation with a clean, white-themed UI. It is designed to be **backend-ready** for future integration with **NestJS + Firebase Firestore**, but currently runs entirely as a static site with mock/local data.

The primary goal of this document is to define a **clear architecture and development plan** so that an AI Coder can generate code correctly without ambiguity.

---

## 1. Hard Constraints (Must Not Violate)

1. **Project Initialization**
   - The project MUST be created using an official React project bootstrap command.
   - Examples (choose one):
     - `npm create vite@latest`
     - `npx create-react-app`
   - ❌ Do NOT manually create files before project initialization.

2. **Output Type**
   - Static site only (HTML / CSS / JS).
   - No SSR, no server runtime dependency.

3. **UI Framework Rules**
   - Material UI (MUI v5) is the **primary UI library**.
   - Tailwind CSS may be used **only as a secondary utility** (spacing, layout tweaks).
   - Do NOT replace MUI components with Tailwind equivalents.

4. **Theme**
   - Light theme only.
   - Primary color: white.
   - Clean, minimal, business-oriented UI.

5. **Responsive Target**
   - Primary: Desktop (PC).
   - Secondary: iPad / Tablet.
   - Mobile phones are NOT a priority.

---

## 2. Application Pages

The application consists of **four client-side routes**:

| Route | Page | Description |
|------|------|------------|
| `/login` | LoginPage | Static mock authentication page |
| `/calendar` | AttendanceCalendarPage | Attendance & advance tracking via calendar |
| `/employees` | EmployeeConfigPage | Employee configuration (master data) |
| `/payroll` | PayrollPage | Payroll calculation & receipt view |

All pages except `/login` must be protected by an authentication guard.

---

## 3. High-Level Flow

1. User opens the app
2. Authentication check
   - Not authenticated → redirect to `/login`
   - Authenticated → redirect to `/calendar`
3. User navigates between Calendar, Employees, and Payroll pages

---

## 4. Domain Separation

The frontend must respect the following domain boundaries:

| Domain | Responsibility |
|------|---------------|
| Auth | Login state only (mock) |
| Employee | Employee master/config data |
| Attendance | Daily attendance records |
| Advance | Advance payment records |
| Payroll | Derived data only (never stored) |

---

## 5. Data Models (Frontend Perspective)

### Employee
```ts
Employee {
  id: string
  name: string
  baseSalary: number
  paymentDay: number
  color: string
}
```

### Attendance Record
```ts
AttendanceRecord {
  employeeId: string
  date: 'YYYY-MM-DD'
  type: 'absent' | 'half'
}
```

### Advance Record
```ts
AdvanceRecord {
  employeeId: string
  date: 'YYYY-MM-DD'
  amount: number
}
```

### Payroll Receipt (Derived)
```ts
PayrollReceipt {
  employeeId: string
  month: number
  year: number
  summary: {
    baseSalary: number
    dailyRate: number
    workedDays: number
    halfDays: number
    absentDays: number
    grossSalary: number
    totalAdvance: number
    netSalary: number
  }
}
```

---

## 6. Calendar UX Rules

- The calendar is the core UI.
- Clicking on a **day cell** directly opens the Create Event modal.
- There is **no explicit "Create Event" button**.
- Events include:
  - Attendance (absent / half day)
  - Advance payment

---

## 7. Payroll Page Rules

- Payroll calculation is separated from the calendar.
- User must:
  1. Select month
  2. Select one or more employees
  3. Generate payroll
- The result is shown as **receipt-style cards**.
- Only selected employees are shown.
- Payroll data is calculated on demand and never stored.

---

## 8. Salary Calculation Rules

1. `dailyRate = baseSalary / daysInMonth`
2. Full day = 1
3. Half day = 0.5
4. Absent = 0
5. Default (no record) = full day
6. `grossSalary = dailyRate * workedDays`
7. `netSalary = grossSalary - totalAdvance`

All calculations must be done using **pure functions**.

---

## 9. State & Service Architecture

### Component Rule
- Components must not contain business logic.
- Components call hooks only.

### Hook Rule
- Hooks coordinate state and call services.

### Service Rule
- Services abstract data access.
- Current phase: mock / in-memory / localStorage.
- Future phase: replace with NestJS API or Firestore SDK.

```
Component → Hook → Service → (Mock | Future API)
```

---

## 10. Folder Structure (Target)

```txt
src/
 ├─ app/
 │   ├─ App.tsx
 │   ├─ Router.tsx
 │   └─ ProtectedRoute.tsx
 │
 ├─ pages/
 │   ├─ LoginPage.tsx
 │   ├─ AttendanceCalendarPage.tsx
 │   ├─ EmployeeConfigPage.tsx
 │   └─ PayrollPage.tsx
 │
 ├─ modules/
 │   ├─ auth/
 │   ├─ employee/
 │   ├─ attendance/
 │   └─ payroll/
 │
 ├─ services/
 │   ├─ api.client.ts
 │   └─ firestore.client.ts
 │
 └─ shared/
     ├─ components/
     ├─ hooks/
     └─ utils/
```

---

## 11. Backend Assumptions (Future)

- Backend framework: NestJS
- Database: Firebase Firestore
- Authentication: Firebase Auth
- Frontend must remain compatible with these assumptions.

---

## 12. Explicit Non-Goals (Current Phase)

- No backend implementation
- No real authentication
- No PDF export
- No mobile-first optimization
- No multi-tenant / role system

---

## 13. Definition of Done (For AI Coder)

The implementation is considered correct if:
- The project is bootstrapped via a React CLI command
- The app builds as a static site
- All four pages exist and are routed correctly
- UI uses MUI as primary components
- Calendar click creates events
- Payroll is receipt-based and derived only
- Code structure follows this planning document strictly

