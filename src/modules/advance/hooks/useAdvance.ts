import { useState, useEffect } from "react";
import { AdvanceRecord } from "../types";
import { advanceService } from "../services/advance.service";

export const useAdvance = () => {
  const [records, setRecords] = useState<AdvanceRecord[]>([]);
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
      const data = await advanceService.getByMonth(year, month);
      setRecords(data);
    } catch (error) {
      console.error("Failed to load advance records", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const createRecord = async (record: Omit<AdvanceRecord, "id">) => {
    try {
      const newRecord = await advanceService.create(record);
      await loadRecords(); // Reload to ensure consistency
      return newRecord;
    } catch (error) {
      console.error("Failed to create advance record", error);
      throw error;
    }
  };

  const deleteRecord = async (id: string, doc: string, employeeId: string) => {
    try {
      const success = await advanceService.delete(id, doc, employeeId);
      if (success) {
        await loadRecords();
      }
      return success;
    } catch (error) {
      console.error("Failed to delete advance record", error);
      return false;
    }
  };

  const getByDateRange = async (year: number, month: number) => {
    return advanceService.getByMonth(year, month);
  };

  const getByEmployeeAndMonth = async (
    employeeId: string,
    year: number,
    month: number,
  ) => {
    return advanceService.getByEmployeeAndMonth(employeeId, year, month);
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
