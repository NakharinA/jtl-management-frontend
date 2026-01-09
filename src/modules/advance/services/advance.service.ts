import { AdvanceRecord } from '../types';

const STORAGE_KEY = 'advance_records';

export const advanceService = {
  getAll: (): AdvanceRecord[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  getByDateRange: (startDate: string, endDate: string): AdvanceRecord[] => {
    const records = advanceService.getAll();
    return records.filter(r => r.date >= startDate && r.date <= endDate);
  },

  getByEmployeeAndMonth: (employeeId: string, year: number, month: number): AdvanceRecord[] => {
    const records = advanceService.getAll();
    const monthStr = month.toString().padStart(2, '0');
    const prefix = `${year}-${monthStr}`;
    return records.filter(r => r.employeeId === employeeId && r.date.startsWith(prefix));
  },

  create: (record: AdvanceRecord): AdvanceRecord => {
    const records = advanceService.getAll();
    records.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return record;
  },

  delete: (employeeId: string, date: string): boolean => {
    const records = advanceService.getAll();
    const filtered = records.filter(
      r => !(r.employeeId === employeeId && r.date === date)
    );
    if (filtered.length === records.length) return false;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },
};
