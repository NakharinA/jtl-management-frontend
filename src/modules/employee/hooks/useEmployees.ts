import { useState, useEffect } from 'react';
import { Employee } from '../types';
import { employeeService } from '../services/employee.service';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to load employees', error);
      // Optional: Add setError state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const createEmployee = async (data: Omit<Employee, 'id'>) => {
    try {
      const newEmployee = await employeeService.create(data);
      setEmployees(prev => [...prev, newEmployee]);
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
        setEmployees(prev => prev.map(e => e.id === id ? updated : e));
      }
      return updated;
    } catch (error) {
       console.error('Failed to update employee', error);
       throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const success = await employeeService.delete(id);
      if (success) {
        setEmployees(prev => prev.filter(e => e.id !== id));
      }
      return success;
    } catch (error) {
      console.error('Failed to delete employee', error);
      return false;
    }
  };

  return {
    employees,
    isLoading,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    refreshEmployees: loadEmployees,
  };
};

