import { useState, useEffect } from 'react';
import { AttendanceRecord } from '../types';
import { attendanceService } from '../services/attendance.service';

export const useAttendance = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRecords = () => {
    const data = attendanceService.getAll();
    setRecords(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const createRecord = (record: AttendanceRecord) => {
    const newRecord = attendanceService.create(record);
    loadRecords(); // Reload to ensure consistency
    return newRecord;
  };

  const deleteRecord = (employeeId: string, date: string) => {
    const success = attendanceService.delete(employeeId, date);
    if (success) {
      loadRecords();
    }
    return success;
  };

  const getByDateRange = (startDate: string, endDate: string) => {
    return attendanceService.getByDateRange(startDate, endDate);
  };

  const getByEmployeeAndMonth = (employeeId: string, year: number, month: number) => {
    return attendanceService.getByEmployeeAndMonth(employeeId, year, month);
  };

  return {
    records,
    isLoading,
    createRecord,
    deleteRecord,
    getByDateRange,
    getByEmployeeAndMonth,
    refreshRecords: loadRecords,
  };
};
