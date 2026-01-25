// Attendance types
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  type: "absent" | "half";
}
