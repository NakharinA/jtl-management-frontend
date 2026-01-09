import { AttendanceRecord } from '../types';

const STORAGE_KEY = 'attendance_records';

export const attendanceService = {
  getAll: (): AttendanceRecord[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  getByDateRange: (startDate: string, endDate: string): AttendanceRecord[] => {
    const records = attendanceService.getAll();
    return records.filter(r => r.date >= startDate && r.date <= endDate);
  },

  getByEmployeeAndMonth: (employeeId: string, year: number, month: number): AttendanceRecord[] => {
    const records = attendanceService.getAll();
    const monthStr = month.toString().padStart(2, '0');
    const prefix = `${year}-${monthStr}`;
    return records.filter(r => r.employeeId === employeeId && r.date.startsWith(prefix));
  },

  create: (record: AttendanceRecord): AttendanceRecord => {
    const records = attendanceService.getAll();
    // Remove existing record for same employee and date
    const filtered = records.filter(
      r => !(r.employeeId === record.employeeId && r.date === record.date)
    );
    filtered.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return record;
  },

  delete: (employeeId: string, date: string): boolean => {
    const records = attendanceService.getAll();
    const filtered = records.filter(
      r => !(r.employeeId === employeeId && r.date === date)
    );
    if (filtered.length === records.length) return false;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },
};
