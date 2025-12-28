import api from './api';
import { PayrollSummary } from '../types';

export const payrollApi = {
  getEarnedSoFar: (employeeId: string) =>
    api.get<number>(`/payroll/employee/${employeeId}/earned`),
  
  getSummary: (employeeId: string) =>
    api.get<PayrollSummary>(`/payroll/employee/${employeeId}/summary`),
};
