import { useState, useEffect } from 'react';
import { AdvanceRecord } from '../types';
import { advanceService } from '../services/advance.service';

export const useAdvance = () => {
  const [records, setRecords] = useState<AdvanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await advanceService.getAll();
      setRecords(data);
    } catch (error) {
      console.error('Failed to load advance records', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const createRecord = async (record: AdvanceRecord) => {
    try {
      const newRecord = await advanceService.create(record);
      setRecords(prev => [...prev, newRecord]);
      return newRecord;
    } catch (error) {
      console.error('Failed to create advance record', error);
      throw error;
    }
  };

  const deleteRecord = async (employeeId: string, date: string) => {
    try {
      const success = await advanceService.delete(employeeId, date);
      if (success) {
        await loadRecords(); // Or verify if filtering local state is preferred for performance, but consistancy is key
      }
      return success;
    } catch (error) {
       console.error('Failed to delete advance record', error);
       return false;
    }
  };

  const getByDateRange = async (startDate: string, endDate: string) => {
    return advanceService.getByDateRange(startDate, endDate);
  };

  const getByEmployeeAndMonth = async (employeeId: string, year: number, month: number) => {
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
  };
};

