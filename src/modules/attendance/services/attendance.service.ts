import { apiClient } from "../../../services/api.client";
import { AttendanceRecord } from "../types";

export const attendanceService = {
  getAll: async (
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceRecord[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return apiClient.get<AttendanceRecord[]>("/attendance", params);
  },

  getByEmployeeIdAndMonth: async (
    employeeId: string,
    year: number,
    month: number,
  ): Promise<AttendanceRecord[]> => {
    console.log(employeeId, year, month);
    return apiClient.get<AttendanceRecord[]>(
      `/attendance/${year}/${month}/${employeeId}`,
    );
  },

  getByMonth: async (
    year: number,
    month: number,
  ): Promise<AttendanceRecord[]> => {
    return apiClient.get<AttendanceRecord[]>(`/attendance/${year}/${month}`);
  },

  getByEmployeeAndMonth: async (
    employeeId: string,
    year: number,
    month: number,
  ): Promise<AttendanceRecord[]> => {
    const records = await attendanceService.getByEmployeeIdAndMonth(
      employeeId,
      year,
      month,
    );
    return records;
  },

  create: async (
    record: Omit<AttendanceRecord, "id">,
  ): Promise<AttendanceRecord> => {
    return apiClient.post<AttendanceRecord>("/attendance", record);
  },

  delete: async (
    id: string,
    doc: string,
    employeeId: string,
  ): Promise<boolean> => {
    await apiClient.delete(`/attendance/${doc}/${employeeId}/${id}`);
    return true;
  },
};
