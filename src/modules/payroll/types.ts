// Payroll types
export interface PayrollSummary {
  baseSalary: number;
  dailyRate: number;
  workedDays: number;
  halfDays: number;
  absentDays: number;
  grossSalary: number;
  totalAdvance: number;
  netSalary: number;
}

export interface PayrollReceipt {
  employeeId: string;
  month: number;
  year: number;
  summary: PayrollSummary;
}
