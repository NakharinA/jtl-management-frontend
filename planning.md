# Planning.md

## Project Overview

This project is a **React Frontend Application** for an **Employee Attendance & Payroll System**. The system focuses on attendance tracking, advance payments, and payroll calculation with a clean, white-themed UI. It involves integration with a **NestJS Backend** via REST API.

---

## 1. Hard Constraints (Must Not Violate)

1. **Project Initialization**

   - The project MUST be created using an official React project bootstrap command.
   - Component Library: Material UI (MUI v5).
   - Styling: Tailwind CSS (secondary).

2. **Output Type**

   - Single Page Application (SPA).
   - API Integration via `fetch` to `https://api-home.pueyleng.com/`.

3. **UI Framework Rules**

   - Material UI (MUI v5) is the **primary UI library**.
   - Navigation: **Left Sidebar (Drawer)** for iPad/Desktop optimization.
   - Clean, minimal, business-oriented UI.

4. **Theme**

   - Light theme only.
   - Primary color: white/blue.

5. **Responsive Target**
   - Primary: Desktop (PC) & iPad.
   - Secondary: Mobile.

---

## 2. Application Pages

The application consists of **four client-side routes**:

| Route        | Page                   | Description                                |
| ------------ | ---------------------- | ------------------------------------------ |
| `/login`     | LoginPage              | Authentication page (Real API)             |
| `/calendar`  | AttendanceCalendarPage | Attendance & advance tracking via calendar |
| `/employees` | EmployeeConfigPage     | Employee configuration (master data)       |
| `/payroll`   | PayrollPage            | Payroll calculation & receipt view         |

All pages except `/login` must be protected by an authentication guard checking for a valid JWT token.

---

## 3. High-Level Flow

1. User opens the app
2. Authentication check (JWT in localStorage)
   - Not authenticated → redirect to `/login`
   - Authenticated → redirect to `/calendar`
3. User navigates between Calendar, Employees, and Payroll pages via **Left Sidebar**.

---

## 4. Domain Separation

| Domain     | Responsibility              |
| ---------- | --------------------------- |
| Auth       | Login & Token Management    |
| Employee   | Employee master/config data |
| Attendance | Daily attendance records    |
| Advance    | Advance payment records     |
| Payroll    | Derived data calculation    |

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
- Payroll data is calculated on demand.

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
- **Current Phase**: Real API integration (`api.client.ts`).
- Storage: Remote Backend (`https://api-home.pueyleng.com/`).

```
Component → Hook → Service → API Client → Backend
```

---

## 10. Folder Structure (Current)

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
 │   ├─ api.client.ts (Real API)
 │
 └─ shared/
     ├─ components/
     │   └─ Layout.tsx (Sidebar)
     ├─ hooks/
     └─ utils/
```

---

## 11. Backend Integration

- Base URL: `https://api-home.pueyleng.com/`
- Authentication: JWT (Bearer Token)
- Endpoints:
  - `POST /auth/login`
  - `GET/POST/PUT/DELETE /employees`
  - `GET/POST/DELETE /attendance`
  - `GET/POST/DELETE /advance`

---

## 12. Explicit Non-Goals

- No PDF export (yet)
- No multi-tenant / role system (yet)
