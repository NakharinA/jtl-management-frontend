import { apiClient } from '../../../services/api.client';
import { Employee } from '../types';

export const employeeService = {
  /** Active employees; with includeDeleted, resigned (soft-deleted) ones too, with `deletedAt` set. */
  getAll: async (includeDeleted = false): Promise<Employee[]> => {
    return apiClient.get<Employee[]>(
      '/employees',
      includeDeleted ? { includeDeleted: 'true' } : undefined,
    );
  },

  /** Also returns resigned employees (with `deletedAt`), so history screens can show the name. */
  getById: async (id: string): Promise<Employee | null> => {
    return apiClient.get<Employee>(`/employees/${id}`);
  },

  create: async (employee: Omit<Employee, 'id'>): Promise<Employee> => {
    return apiClient.post<Employee>('/employees', employee);
  },

  update: async (id: string, data: Partial<Omit<Employee, 'id'>>): Promise<Employee | null> => {
    return apiClient.put<Employee>(`/employees/${id}`, data);
  },

  /** Soft delete: the employee is hidden, attendance and advance history are kept. */
  delete: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/employees/${id}`);
    return true;
  },

  restore: async (id: string): Promise<Employee> => {
    return apiClient.post<Employee>(`/employees/${id}/restore`, {});
  },
};
