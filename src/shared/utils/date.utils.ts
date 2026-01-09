import { format, parse, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns';

/**
 * Format a date to YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Parse a YYYY-MM-DD string to Date
 */
export const parseDate = (dateStr: string): Date => {
  return parse(dateStr, 'yyyy-MM-dd', new Date());
};

/**
 * Get the first day of a month
 */
export const getMonthStart = (year: number, month: number): Date => {
  return startOfMonth(new Date(year, month - 1));
};

/**
 * Get the last day of a month
 */
export const getMonthEnd = (year: number, month: number): Date => {
  return endOfMonth(new Date(year, month - 1));
};

/**
 * Get number of days in a month
 */
export const getMonthDays = (year: number, month: number): number => {
  return getDaysInMonth(new Date(year, month - 1));
};

/**
 * Format month/year for display
 */
export const formatMonthYear = (year: number, month: number): string => {
  return format(new Date(year, month - 1), 'MMMM yyyy');
};
