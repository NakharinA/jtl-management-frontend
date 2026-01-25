import { useState } from 'react';
import { PayrollReceipt } from '../types';
import { Employee } from '@/modules/employee/types';
import { attendanceService } from '@/modules/attendance/services/attendance.service';
import { advanceService } from '@/modules/advance/services/advance.service';
import { calculatePayroll } from '../services/payroll.service';

export const usePayroll = () => {
  const [receipts, setReceipts] = useState<PayrollReceipt[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePayroll = async (employees: Employee[], year: number, month: number) => {
    setIsGenerating(true);
    
    try {
      const promises = employees.map(async (employee) => {
        // Parallel fetching for each employee
        const [attendanceRecords, advanceRecords] = await Promise.all([
          attendanceService.getByEmployeeAndMonth(employee.id, year, month),
          advanceService.getByEmployeeAndMonth(employee.id, year, month),
        ]);
        
        return calculatePayroll(employee, year, month, attendanceRecords, advanceRecords);
      });

      const newReceipts = await Promise.all(promises);

      setReceipts(newReceipts);
      setIsGenerating(false);
      return newReceipts;
    } catch (error) {
      console.error('Failed to generate payroll', error);
      setIsGenerating(false);
      return [];
    }
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
