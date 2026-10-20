import { useState, useEffect, useMemo } from 'react';
import { Employee } from '../types';
import { employeeService } from '../services/employee.service';

interface UseEmployeesOptions {
  /** Also load resigned (soft-deleted) employees into `allEmployees`, e.g. for history views. */
  includeDeleted?: boolean;
}

export const useEmployees = ({ includeDeleted = false }: UseEmployeesOptions = {}) => {
  // Everything loaded; contains resigned employees only when includeDeleted is set.
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active employees: use these for pickers and new records.
  const employees = useMemo(() => allEmployees.filter(e => !e.deletedAt), [allEmployees]);

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await employeeService.getAll(includeDeleted);
      setAllEmployees(data);
    } catch (error) {
      console.error('Failed to load employees', error);
      // Optional: Add setError state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [includeDeleted]);

  const createEmployee = async (data: Omit<Employee, 'id'>) => {
    try {
      const newEmployee = await employeeService.create(data);
      setAllEmployees(prev => [...prev, newEmployee]);
      return newEmployee;
    } catch (error) {
      console.error('Failed to create employee', error);
      throw error;
    }
  };

  const updateEmployee = async (id: string, data: Partial<Omit<Employee, 'id'>>) => {
    try {
      const updated = await employeeService.update(id, data);
      if (updated) {
        setAllEmployees(prev => prev.map(e => e.id === id ? updated : e));
      }
      return updated;
    } catch (error) {
       console.error('Failed to update employee', error);
       throw error;
    }
  };

  // Soft delete. Resigned employees stay in `allEmployees` (with deletedAt) when includeDeleted is set.
  const deleteEmployee = async (id: string) => {
    try {
      const success = await employeeService.delete(id);
      if (success) {
        const deletedAt = new Date().toISOString();
        setAllEmployees(prev =>
          includeDeleted
            ? prev.map(e => (e.id === id ? { ...e, deletedAt } : e))
            : prev.filter(e => e.id !== id),
        );
      }
      return success;
    } catch (error) {
      console.error('Failed to delete employee', error);
      return false;
    }
  };

  const restoreEmployee = async (id: string) => {
    try {
      const restored = await employeeService.restore(id);
      setAllEmployees(prev =>
        prev.some(e => e.id === id) ? prev.map(e => (e.id === id ? restored : e)) : [...prev, restored],
      );
      return true;
    } catch (error) {
      console.error('Failed to restore employee', error);
      return false;
    }
  };

  return {
    employees,
    allEmployees,
    isLoading,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    restoreEmployee,
    refreshEmployees: loadEmployees,
  };
};
