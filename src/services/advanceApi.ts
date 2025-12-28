import api from './api';
import { Advance } from '../types';

export const advanceApi = {
  create: (data: { employeeId: string; cycleId: string; date: string; amount: number }) =>
    api.post<Advance>('/advances', data),
  
  getByCycle: (cycleId: string) =>
    api.get<Advance[]>(`/advances/cycle/${cycleId}`),
  
  getByEmployee: (employeeId: string) =>
    api.get<Advance[]>(`/advances/employee/${employeeId}`),
};
