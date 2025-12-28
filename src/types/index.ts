export enum AttendanceType {
  FULL = 'FULL',
  HALF = 'HALF',
  ABSENT = 'ABSENT',
  HOLIDAY = 'HOLIDAY',
}

export enum PayCycleStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Employee {
  id: string;
  name: string;
  dailyRate: number;
  paydayAnchor: number;
  currentCycleId: string;
  status: EmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  type: AttendanceType;
  createdAt: Date;
}

export interface PayCycle {
  id: string;
  employeeId: string;
  startDate: string;
  payday: string;
  status: PayCycleStatus;
  totalEarned?: number;
  totalAdvanced?: number;
  createdAt: Date;
  closedAt?: Date;
}

export interface Advance {
  id: string;
  employeeId: string;
  cycleId: string;
  date: string;
  amount: number;
  createdAt: Date;
}

export interface PayrollSummary {
  employee: Employee;
  currentCycle: PayCycle | null;
  earnedSoFar: number;
  totalAdvanced: number;
  remaining: number;
}
