// Attendance types
export interface AttendanceRecord {
  employeeId: string;
  date: string; // YYYY-MM-DD
  type: 'absent' | 'half';
}
