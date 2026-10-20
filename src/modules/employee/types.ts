// Employee types
export interface Employee {
  id: string;
  name: string;
  dailyRate: number;
  paydayAnchor: number;
  color: string;
  // Set when the employee was soft-deleted (resigned). Only present when fetched with includeDeleted.
  deletedAt?: string;
}

export const RESIGNED_SUFFIX = ' (ลาออกแล้ว)';

/** Display name; resigned employees get a "(ลาออกแล้ว)" suffix. */
export const employeeDisplayName = (employee: Employee) =>
  employee.deletedAt ? `${employee.name}${RESIGNED_SUFFIX}` : employee.name;
