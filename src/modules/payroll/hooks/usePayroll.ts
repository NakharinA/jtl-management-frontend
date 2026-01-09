import { useState } from 'react';
import { PayrollReceipt } from '../types';
import { Employee } from '@/modules/employee/types';
import { attendanceService } from '@/modules/attendance/services/attendance.service';
import { advanceService } from '@/modules/advance/services/advance.service';
import { calculatePayroll } from '../services/payroll.service';

export const usePayroll = () => {
  const [receipts, setReceipts] = useState<PayrollReceipt[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePayroll = (employees: Employee[], year: number, month: number) => {
    setIsGenerating(true);
    
    const newReceipts: PayrollReceipt[] = employees.map(employee => {
      const attendanceRecords = attendanceService.getByEmployeeAndMonth(employee.id, year, month);
      const advanceRecords = advanceService.getByEmployeeAndMonth(employee.id, year, month);
      
      return calculatePayroll(employee, year, month, attendanceRecords, advanceRecords);
    });

    setReceipts(newReceipts);
    setIsGenerating(false);
    return newReceipts;
  };

  const clearReceipts = () => {
    setReceipts([]);
  };

  return {
    receipts,
    isGenerating,
    generatePayroll,
    clearReceipts,
  };
};
