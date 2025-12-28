import api from './api';
import { Employee } from '../types';

export const employeeApi = {
  getAll: () => api.get<Employee[]>('/employees'),
  
  getById: (id: string) => api.get<Employee>(`/employees/${id}`),
  
  create: (data: { name: string; dailyRate: number; paydayAnchor: number }) =>
    api.post<Employee>('/employees', data),
  
  update: (id: string, data: Partial<Employee>) =>
    api.patch<Employee>(`/employees/${id}`, data),
  
  delete: (id: string) => api.delete(`/employees/${id}`),
};
