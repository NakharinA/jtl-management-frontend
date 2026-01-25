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

  getByDateRange: async (
    startDate: string,
    endDate: string,
  ): Promise<AdvanceRecord[]> => {
    return advanceService.getAll(startDate, endDate);
  },

  getByEmployeeAndMonth: async (
    employeeId: string,
    year: number,
    month: number,
  ): Promise<AdvanceRecord[]> => {
    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, "0")}-${lastDay}`;

    const records = await advanceService.getAll(startDate, endDate);
    console.log("records : ", records);
    return records.filter((r) => r.employeeId === employeeId);
  },

  create: async (record: AdvanceRecord): Promise<AdvanceRecord> => {
    return apiClient.post<AdvanceRecord>("/advance", record);
  },

  delete: async (employeeId: string, date: string): Promise<boolean> => {
    await apiClient.delete("/advance", { employeeId, date });
    return true;
  },
};
