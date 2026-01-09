import { useState, useEffect } from 'react';
import { Employee } from '../types';
import { employeeService } from '../services/employee.service';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEmployees = () => {
    const data = employeeService.getAll();
    setEmployees(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const createEmployee = (data: Omit<Employee, 'id'>) => {
    const newEmployee = employeeService.create(data);
    setEmployees(prev => [...prev, newEmployee]);
    return newEmployee;
  };

  const updateEmployee = (id: string, data: Partial<Omit<Employee, 'id'>>) => {
    const updated = employeeService.update(id, data);
    if (updated) {
      setEmployees(prev => prev.map(e => e.id === id ? updated : e));
    }
    return updated;
  };

  const deleteEmployee = (id: string) => {
    const success = employeeService.delete(id);
    if (success) {
      setEmployees(prev => prev.filter(e => e.id !== id));
    }
    return success;
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
