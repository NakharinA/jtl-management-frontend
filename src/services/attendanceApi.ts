import api from './api';
import { Attendance, AttendanceType } from '../types';

export const attendanceApi = {
  setAttendance: (data: { employeeId: string; date: string; type: AttendanceType }) =>
    api.post<Attendance>('/attendance', data),
  
  getCalendar: (employeeId: string, startDate: string, endDate: string) =>
    api.get<Attendance[]>('/attendance/calendar', {
      params: { employeeId, startDate, endDate },
    }),
};
