import { PayrollReceipt, PayrollSummary } from '../types';
import { Employee } from '@/modules/employee/types';
import { AttendanceRecord } from '@/modules/attendance/types';
import { AdvanceRecord } from '@/modules/advance/types';
import { getDaysInMonth } from 'date-fns';

/**
 * Calculate payroll for an employee for a given month
 * Following the rules from Planning.md:
 * 1. dailyRate = baseSalary / daysInMonth
 * 2. Full day = 1, Half day = 0.5, Absent = 0
 * 3. Default (no record) = full day
 * 4. grossSalary = dailyRate * workedDays
 * 5. netSalary = grossSalary - totalAdvance
 */
export const calculatePayroll = (
  employee: Employee,
  year: number,
  month: number,
  attendanceRecords: AttendanceRecord[],
  advanceRecords: AdvanceRecord[]
): PayrollReceipt => {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const dailyRate = employee.baseSalary / daysInMonth;

  // Count attendance
  let absentDays = 0;
  let halfDays = 0;

  attendanceRecords.forEach(record => {
    if (record.type === 'absent') {
      absentDays++;
    } else if (record.type === 'half') {
      halfDays++;
    }
  });

  // Calculate worked days
  // Default is full day, so: total days - absent days - (half days * 0.5)
  const workedDays = daysInMonth - absentDays - (halfDays * 0.5);

  // Calculate gross salary
  const grossSalary = dailyRate * workedDays;

  // Calculate total advance
  const totalAdvance = advanceRecords.reduce((sum, record) => sum + record.amount, 0);

  // Calculate net salary
  const netSalary = grossSalary - totalAdvance;

  const summary: PayrollSummary = {
    baseSalary: employee.baseSalary,
    dailyRate: Math.round(dailyRate * 100) / 100, // Round to 2 decimals
    workedDays: Math.round(workedDays * 100) / 100,
    halfDays,
    absentDays,
    grossSalary: Math.round(grossSalary * 100) / 100,
    totalAdvance: Math.round(totalAdvance * 100) / 100,
    netSalary: Math.round(netSalary * 100) / 100,
  };

  return {
    employeeId: employee.id,
    month,
    year,
    summary,
  };
};
