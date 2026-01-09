import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Chip,
  IconButton,
} from '@mui/material';
import { Layout } from '@/shared/components/Layout';
import { useEmployees } from '@/modules/employee/hooks/useEmployees';
import { useAttendance } from '@/modules/attendance/hooks/useAttendance';
import { useAdvance } from '@/modules/advance/hooks/useAdvance';
import { formatDate } from '@/shared/utils/date.utils';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths } from 'date-fns';
import { th } from 'date-fns/locale';

const AttendanceCalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventType, setEventType] = useState<'attendance' | 'advance'>('attendance');
  const [attendanceType, setAttendanceType] = useState<'absent' | 'half'>('absent');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');

  const { employees } = useEmployees();
  const { records: attendanceRecords, createRecord: createAttendance, deleteRecord: deleteAttendance } = useAttendance();
  const { records: advanceRecords, createRecord: createAdvance, deleteRecord: deleteAdvance } = useAdvance();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setDialogOpen(true);
    setEventType('attendance');
    setAttendanceType('absent');
    setSelectedEmployeeId('');
    setAdvanceAmount('');
  };

  const handleCreateEvent = () => {
    if (!selectedDate || !selectedEmployeeId) return;

    const dateStr = formatDate(selectedDate);

    if (eventType === 'attendance') {
      createAttendance({
        employeeId: selectedEmployeeId,
        date: dateStr,
        type: attendanceType,
      });
    } else {
      const amount = parseFloat(advanceAmount);
      if (!isNaN(amount) && amount > 0) {
        createAdvance({
          employeeId: selectedEmployeeId,
          date: dateStr,
          amount,
        });
      }
    }

    setDialogOpen(false);
  };

  const handleDeleteAttendance = (employeeId: string, date: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) {
      deleteAttendance(employeeId, date);
    }
  };

  const handleDeleteAdvance = (employeeId: string, date: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) {
      deleteAdvance(employeeId, date);
    }
  };

  const getEventsForDay = (date: Date) => {
    const dateStr = formatDate(date);
    const attendance = attendanceRecords.filter(r => r.date === dateStr);
    const advances = advanceRecords.filter(r => r.date === dateStr);
    return { attendance, advances };
  };


  return (
    <Layout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            ปฏิทินการลงเวลา
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handlePrevMonth}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h6">
              {format(currentDate, 'MMMM yyyy', { locale: th })}
            </Typography>
            <IconButton onClick={handleNextMonth}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>

        <Card>
          <CardContent>
            <Grid container spacing={1}>
              {/* Day headers */}
              {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day) => (
                <Grid item xs={12 / 7} key={day}>
                  <Typography variant="subtitle2" align="center" fontWeight="bold">
                    {day}
                  </Typography>
                </Grid>
              ))}

              {/* Empty cells for days before month starts */}
              {Array.from({ length: monthStart.getDay() }).map((_, index) => (
                <Grid item xs={12 / 7} key={`empty-${index}`}>
                  <Box sx={{ height: 120 }} />
                </Grid>
              ))}

              {daysInMonth.map((day) => {
                const events = getEventsForDay(day);

                return (
                  <Grid item xs={12 / 7} key={day.toISOString()}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: 120,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        overflow: 'auto',
                      }}
                      onClick={() => handleDayClick(day)}
                    >
                      <Box sx={{ p: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {format(day, 'd')}
                        </Typography>
                        
                        {/* Attendance events */}
                        {events.attendance.map((record) => {
                          const employee = employees.find(e => e.id === record.employeeId);
                          if (!employee) return null;
                          return (
                            <Chip
                              key={`att-${record.employeeId}`}
                              label={`${employee.name.substring(0, 8)} - ${record.type === 'absent' ? 'ขาด' : 'ครึ่งวัน'}`}
                              size="small"
                              onDelete={(e) => handleDeleteAttendance(record.employeeId, record.date, e)}
                              sx={{
                                backgroundColor: employee.color,
                                color: '#fff',
                                fontSize: '0.65rem',
                                height: 20,
                                mt: 0.5,
                                width: '100%',
                                '& .MuiChip-deleteIcon': {
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  height: 14,
                                  width: 14,
                                  '&:hover': {
                                    color: '#fff',
                                  }
                                }
                              }}
                            />
                          );
                        })}

                        {/* Advance events */}
                        {events.advances.map((record, idx) => {
                          const employee = employees.find(e => e.id === record.employeeId);
                          if (!employee) return null;
                          return (
                            <Chip
                              key={`adv-${record.employeeId}-${idx}`}
                              label={`${employee.name.substring(0, 8)} - ฿${record.amount}`}
                              size="small"
                              onDelete={(e) => handleDeleteAdvance(record.employeeId, record.date, e)}
                              sx={{
                                backgroundColor: employee.color,
                                color: '#fff',
                                fontSize: '0.65rem',
                                height: 20,
                                mt: 0.5,
                                width: '100%',
                                opacity: 0.8,
                                '& .MuiChip-deleteIcon': {
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  height: 14,
                                  width: 14,
                                  '&:hover': {
                                    color: '#fff',
                                  }
                                }
                              }}
                            />
                          );
                        })}
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>

        {/* Event Creation Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            สร้างรายการ - {selectedDate && format(selectedDate, 'd MMMM yyyy', { locale: th })}
          </DialogTitle>
          <DialogContent>
            <FormControl fullWidth margin="normal">
              <InputLabel>ประเภทรายการ</InputLabel>
              <Select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as 'attendance' | 'advance')}
                label="ประเภทรายการ"
              >
                <MenuItem value="attendance">การลงเวลา (ขาด/ลา)</MenuItem>
                <MenuItem value="advance">เบิกล่วงหน้า</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>พนักงาน</InputLabel>
              <Select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                label="พนักงาน"
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {eventType === 'attendance' ? (
              <FormControl fullWidth margin="normal">
                <InputLabel>ประเภทการขาดงาน</InputLabel>
                <Select
                  value={attendanceType}
                  onChange={(e) => setAttendanceType(e.target.value as 'absent' | 'half')}
                  label="ประเภทการขาดงาน"
                >
                  <MenuItem value="absent">ขาดงาน</MenuItem>
                  <MenuItem value="half">ครึ่งวัน</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                label="จำนวนเงิน"
                type="number"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                margin="normal"
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button
              onClick={handleCreateEvent}
              variant="contained"
              disabled={!selectedEmployeeId || (eventType === 'advance' && !advanceAmount)}
            >
              บันทึก
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default AttendanceCalendarPage;
