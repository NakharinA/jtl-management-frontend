import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { employeeApi } from '../services/employeeApi';
import { attendanceApi } from '../services/attendanceApi';
import { payrollApi } from '../services/payrollApi';
import { advanceApi } from '../services/advanceApi';
import { Employee, Attendance, AttendanceType, PayrollSummary, Advance } from '../types';

const Calendar: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendances, setAttendances] = useState<Record<string, Attendance>>({});
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');

  useEffect(() => {
    if (employeeId) {
      loadData();
    }
  }, [employeeId, currentMonth]);

  const loadData = async () => {
    if (!employeeId) return;

    try {
      const [empRes, summaryRes, advancesRes] = await Promise.all([
        employeeApi.getById(employeeId),
        payrollApi.getSummary(employeeId),
        advanceApi.getByEmployee(employeeId),
      ]);

      setEmployee(empRes.data);
      setSummary(summaryRes.data);
      setAdvances(advancesRes.data);

      // Load attendance for current month
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const attendanceRes = await attendanceApi.getCalendar(
        employeeId,
        format(start, 'yyyy-MM-dd'),
        format(end, 'yyyy-MM-dd')
      );

      const attendanceMap: Record<string, Attendance> = {};
      attendanceRes.data.forEach((att) => {
        attendanceMap[att.date] = att;
      });
      setAttendances(attendanceMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayClick = async (date: Date) => {
    if (!employeeId) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const currentAttendance = attendances[dateStr];

    // Cycle through attendance types
    let nextType: AttendanceType;
    if (!currentAttendance || currentAttendance.type === AttendanceType.FULL) {
      nextType = AttendanceType.ABSENT;
    } else if (currentAttendance.type === AttendanceType.ABSENT) {
      nextType = AttendanceType.HALF;
    } else if (currentAttendance.type === AttendanceType.HALF) {
      nextType = AttendanceType.HOLIDAY;
    } else {
      nextType = AttendanceType.FULL;
    }

    try {
      await attendanceApi.setAttendance({
        employeeId,
        date: dateStr,
        type: nextType,
      });
      loadData();
    } catch (error) {
      console.error('Failed to set attendance:', error);
    }
  };

  const handleAdvanceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !summary?.currentCycle) return;

    try {
      await advanceApi.create({
        employeeId,
        cycleId: summary.currentCycle.id,
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: parseFloat(advanceAmount),
      });
      setShowAdvanceModal(false);
      setAdvanceAmount('');
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create advance');
    }
  };

  const getDayClass = (dateStr: string) => {
    const attendance = attendances[dateStr];
    if (!attendance) return '';
    
    switch (attendance.type) {
      case AttendanceType.ABSENT:
        return 'absent';
      case AttendanceType.HALF:
        return 'half';
      case AttendanceType.HOLIDAY:
        return 'holiday';
      default:
        return '';
    }
  };

  const hasAdvance = (dateStr: string) => {
    return advances.some((adv) => adv.date === dateStr);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!employee || !summary) {
    return <div className="container">Employee not found</div>;
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="container">
      <div className="flex-between mb-4">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>{employee.name}</h1>
          <p className="text-muted">Daily Rate: ฿{employee.dailyRate.toLocaleString()}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdvanceModal(true)}>
          Request Advance
        </button>
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card">
          <h3 className="mb-2">Earned So Far</h3>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>
            ฿{summary.earnedSoFar.toLocaleString()}
          </p>
        </div>

        <div className="card">
          <h3 className="mb-2">Total Advanced</h3>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--warning)' }}>
            ฿{summary.totalAdvanced.toLocaleString()}
          </p>
        </div>

        <div className="card">
          <h3 className="mb-2">Remaining</h3>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--info)' }}>
            ฿{summary.remaining.toLocaleString()}
          </p>
        </div>

        <div className="card">
          <h3 className="mb-2">Next Payday</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>
            {summary.currentCycle?.payday || 'N/A'}
          </p>
        </div>
      </div>

      <div className="calendar">
        <div className="calendar-header">
          <button className="btn btn-secondary" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            ← Previous
          </button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button className="btn btn-secondary" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            Next →
          </button>
        </div>

        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} style={{ textAlign: 'center', fontWeight: '600', padding: 'var(--spacing-sm)' }}>
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            return (
              <div
                key={dateStr}
                className={`calendar-day ${getDayClass(dateStr)}`}
                onClick={() => handleDayClick(day)}
              >
                <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>{format(day, 'd')}</span>
                {hasAdvance(dateStr) && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>💰</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3">
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <div className="flex gap-1" style={{ alignItems: 'center' }}>
              <div style={{ width: '20px', height: '20px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}></div>
              <span className="text-muted">Full Day</span>
            </div>
            <div className="flex gap-1" style={{ alignItems: 'center' }}>
              <div style={{ width: '20px', height: '20px', background: 'hsla(0, 84%, 60%, 0.2)', border: '1px solid var(--error)', borderRadius: '4px' }}></div>
              <span className="text-muted">Absent</span>
            </div>
            <div className="flex gap-1" style={{ alignItems: 'center' }}>
              <div style={{ width: '20px', height: '20px', background: 'hsla(45, 100%, 60%, 0.2)', border: '1px solid var(--warning)', borderRadius: '4px' }}></div>
              <span className="text-muted">Half Day</span>
            </div>
            <div className="flex gap-1" style={{ alignItems: 'center' }}>
              <div style={{ width: '20px', height: '20px', background: 'hsla(200, 98%, 60%, 0.2)', border: '1px solid var(--info)', borderRadius: '4px' }}></div>
              <span className="text-muted">Holiday</span>
            </div>
            <div className="flex gap-1" style={{ alignItems: 'center' }}>
              <span>💰</span>
              <span className="text-muted">Advance</span>
            </div>
          </div>
        </div>
      </div>

      {showAdvanceModal && (
        <div className="modal-overlay" onClick={() => setShowAdvanceModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Request Advance</h2>
              <p className="text-muted">
                Available: ฿{summary.remaining.toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleAdvanceRequest}>
              <div className="input-group">
                <label htmlFor="amount">Amount (฿)</label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  max={summary.remaining}
                  className="input"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  required
                  placeholder="Enter amount"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdvanceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Request Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
