import { useState, useEffect } from 'react';
import { AdvanceRecord } from '../types';
import { advanceService } from '../services/advance.service';

export const useAdvance = () => {
  const [records, setRecords] = useState<AdvanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRecords = () => {
    const data = advanceService.getAll();
    setRecords(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const createRecord = (record: AdvanceRecord) => {
    const newRecord = advanceService.create(record);
    setRecords(prev => [...prev, newRecord]);
    return newRecord;
  };

  const deleteRecord = (employeeId: string, date: string) => {
    const success = advanceService.delete(employeeId, date);
    if (success) {
      loadRecords();
    }
    return success;
  };

  const getByDateRange = (startDate: string, endDate: string) => {
    return advanceService.getByDateRange(startDate, endDate);
  };

  const getByEmployeeAndMonth = (employeeId: string, year: number, month: number) => {
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
