import api from './api';
import { PayCycle } from '../types';

export const payCycleApi = {
  getCurrentCycle: (employeeId: string) =>
    api.get<PayCycle>(`/paycycles/employee/${employeeId}/current`),
  
  closeCycle: (data: { cycleId: string; employeeId: string; paydayAnchor: number }) =>
    api.post<PayCycle>('/paycycles/close', data),
};
