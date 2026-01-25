import { apiClient } from '../../../services/api.client';
import { AttendanceRecord } from '../types';

export const attendanceService = {
  getAll: async (startDate?: string, endDate?: string): Promise<AttendanceRecord[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return apiClient.get<AttendanceRecord[]>('/attendance', params);
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<AttendanceRecord[]> => {
    return attendanceService.getAll(startDate, endDate);
  },

  getByEmployeeAndMonth: async (employeeId: string, year: number, month: number): Promise<AttendanceRecord[]> => {
    // API might not support filtering by employeeId directly in 'getAll', or maybe it does?
    // The requirement says GET /attendance with startDate and endDate only.
    // So we fetch by range and filter client side for specific employee if needed.
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    // efficient way to get end of month is tricky without date-fns here, but let's just grab the whole month
    // actually, let's just fetch everything for that range and filter.
    // simpler: assume we can pass startDate and endDate covering the month.
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
    
    const records = await attendanceService.getAll(startDate, endDate);
    return records.filter(r => r.employeeId === employeeId);
  },

  create: async (record: AttendanceRecord): Promise<AttendanceRecord> => {
    return apiClient.post<AttendanceRecord>('/attendance', record);
  },

  delete: async (employeeId: string, date: string): Promise<boolean> => {
    await apiClient.delete('/attendance', { employeeId, date });
    return true;
  },
};

