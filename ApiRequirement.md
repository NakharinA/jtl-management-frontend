# API Requirements

This document outlines the API endpoints and data structures required by the JTL Employee Management frontend.

## Authentication

Handles user login and session management.

### `POST /auth/login`

**Description**: Authenticate user and return a token.

- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": "string",
    "email": "string",
    "name": "string",
    "token": "string"
  }
  ```

---

## Employees

Manage employee profiles and configurations.

### `GET /employees`

**Description**: Fetch all employees.

- **Response (200 OK)**: `Employee[]`

### `POST /employees`

**Description**: Create a new employee.

- **Request Body**:
  ```json
  {
    "name": "string",
    "baseSalary": "number", // Represents Daily Rate (ค่าแรงรายวัน)
    "paymentDay": "number", // 1-31
    "color": "string" // Hex code
  }
  ```

### `PUT /employees/:id`

**Description**: Update employee details.

- **Request Body**: (Partial) `Employee`

### `DELETE /employees/:id`

**Description**: Delete an employee.

---

## Attendance

Track absences and half-days.

### `GET /attendance`

**Description**: Fetch all attendance records (optionally filter by date range).

- **Query Params**: `startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD)

### `POST /attendance`

**Description**: Log an attendance event.

- **Request Body**:
  ```json
  {
    "employeeId": "string",
    "date": "string", // YYYY-MM-DD
    "type": "absent" | "half"
  }
  ```

### `DELETE /attendance`

**Description**: Remove an attendance record.

- **Query Params**: `employeeId`, `date`

---

## Advance Payments

Track salary advances.

### `GET /advance`

**Description**: Fetch all advance records (optionally filter by date range).

### `POST /advance`

**Description**: Record a new advance payment.

- **Request Body**:
  ```json
  {
    "employeeId": "string",
    "date": "string", // YYYY-MM-DD
    "amount": "number"
  }
  ```

### `DELETE /advance`

**Description**: Remove an advance record.

- **Query Params**: `employeeId`, `date`

---

## Payroll (Optional Recommendation)

While currently handled on the frontend, a production API should ideally calculate this server-side.

### `POST /payroll/calculate`

**Description**: Generate payroll receipts for selected employees and month.

- **Request Body**:
  ```json
  {
    "employeeIds": ["string"],
    "year": "number",
    "month": "number"
  }
  ```
- **Response (200 OK)**: `PayrollReceipt[]`

---

## Data Models

### Employee

```typescript
interface Employee {
  id: string;
  name: string;
  baseSalary: number; // Daily Rate
  paymentDay: number;
  color: string;
}
```

### AttendanceRecord

```typescript
interface AttendanceRecord {
  employeeId: string;
  date: string;
  type: "absent" | "half";
}
```

### AdvanceRecord

```typescript
interface AdvanceRecord {
  employeeId: string;
  date: string;
  amount: number;
}
```
