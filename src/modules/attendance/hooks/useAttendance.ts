import { useState, useEffect } from 'react';
import { AttendanceRecord } from '../types';
import { attendanceService } from '../services/attendance.service';

export const useAttendance = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await attendanceService.getAll();
      setRecords(data);
    } catch (error) {
      console.error('Failed to load attendance records', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const createRecord = async (record: AttendanceRecord) => {
    try {
      const newRecord = await attendanceService.create(record);
      await loadRecords(); // Reload to ensure consistency
      return newRecord;
    } catch (error) {
      console.error('Failed to create attendance record', error);
      throw error;
    }
  };

  const deleteRecord = async (employeeId: string, date: string) => {
    try {
      const success = await attendanceService.delete(employeeId, date);
      if (success) {
        await loadRecords();
      }
      return success;
    } catch (error) {
      console.error('Failed to delete attendance record', error);
      return false;
    }
  };

  const getByDateRange = async (startDate: string, endDate: string) => {
    return attendanceService.getByDateRange(startDate, endDate);
  };

  const getByEmployeeAndMonth = async (employeeId: string, year: number, month: number) => {
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

