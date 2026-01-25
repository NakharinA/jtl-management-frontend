import { apiClient } from "../../../services/api.client";
import { AdvanceRecord } from "../types";

export const advanceService = {
  getAll: async (
    startDate?: string,
    endDate?: string,
  ): Promise<AdvanceRecord[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return apiClient.get<AdvanceRecord[]>("/advance", params);
  },

  getByEmployeeId: async (
    employeeId: string,
    year: number,
    month: number,
  ): Promise<AdvanceRecord[]> => {
    return apiClient.get<AdvanceRecord[]>(
      `/advance/${year}/${month}/${employeeId}`,
    );
  },

  getByMonth: async (year: number, month: number): Promise<AdvanceRecord[]> => {
    return apiClient.get<AdvanceRecord[]>(`/advance/${year}/${month}`);
  },

  getByEmployeeAndMonth: async (
    employeeId: string,
    year: number,
    month: number,
  ): Promise<AdvanceRecord[]> => {
    const records = await advanceService.getByEmployeeId(
      employeeId,
      year,
      month,
    );
    return records;
  },

  create: async (record: Omit<AdvanceRecord, "id">): Promise<AdvanceRecord> => {
    return apiClient.post<AdvanceRecord>("/advance", record);
  },

  delete: async (
    id: string,
    doc: string,
    employeeId: string,
  ): Promise<boolean> => {
    await apiClient.delete(`/advance/${doc}/${employeeId}/${id}`);
    return true;
  },
};
