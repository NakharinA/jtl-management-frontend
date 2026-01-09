import { Employee } from '../types';

const STORAGE_KEY = 'employees';

export const employeeService = {
  getAll: (): Employee[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  getById: (id: string): Employee | null => {
    const employees = employeeService.getAll();
    return employees.find(e => e.id === id) || null;
  },

  create: (employee: Omit<Employee, 'id'>): Employee => {
    const employees = employeeService.getAll();
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString(),
    };
    employees.push(newEmployee);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    return newEmployee;
  },

  update: (id: string, data: Partial<Omit<Employee, 'id'>>): Employee | null => {
    const employees = employeeService.getAll();
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) return null;
    
    employees[index] = { ...employees[index], ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    return employees[index];
  },

  delete: (id: string): boolean => {
    const employees = employeeService.getAll();
    const filtered = employees.filter(e => e.id !== id);
    if (filtered.length === employees.length) return false;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },
};
