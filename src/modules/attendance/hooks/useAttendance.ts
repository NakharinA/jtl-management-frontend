import { useState, useEffect } from "react";
import { AttendanceRecord } from "../types";
import { attendanceService } from "../services/attendance.service";

export const useAttendance = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const setMonthAndLoad = async (year: number, month: number) => {
    await loadRecords(year, month);
  };

  const loadRecords = async (
    year: number = new Date().getFullYear(),
    month: number = new Date().getMonth() + 1,
  ) => {
    setIsLoading(true);
    try {
      const data = await attendanceService.getByMonth(year, month);
      setRecords(data);
    } catch (error) {
      console.error("Failed to load attendance records", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const createRecord = async (record: Omit<AttendanceRecord, "id">) => {
    try {
      const newRecord = await attendanceService.create(record);
      await loadRecords(); // Reload to ensure consistency
      return newRecord;
    } catch (error) {
      console.error("Failed to create attendance record", error);
      throw error;
    }
  };

  const deleteRecord = async (id: string, doc: string, employeeId: string) => {
    try {
      const success = await attendanceService.delete(id, doc, employeeId);
      if (success) {
        await loadRecords();
      }
      return success;
    } catch (error) {
      console.error("Failed to delete attendance record", error);
      return false;
    }
  };

  const getByDateRange = async (year: number, month: number) => {
    return attendanceService.getByMonth(year, month);
  };

  const getByEmployeeAndMonth = async (
    employeeId: string,
    year: number,
    month: number,
  ) => {
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
    setMonthAndLoad,
  };
};
