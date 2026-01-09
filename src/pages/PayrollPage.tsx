import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import { Layout } from '@/shared/components/Layout';
import { useEmployees } from '@/modules/employee/hooks/useEmployees';
import { usePayroll } from '@/modules/payroll/hooks/usePayroll';
import { formatMonthYear } from '@/shared/utils/date.utils';
import CalculateIcon from '@mui/icons-material/Calculate';

const PayrollPage = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const { employees } = useEmployees();
  const { receipts, generatePayroll } = usePayroll();

  const handleEmployeeChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedEmployeeIds(typeof value === 'string' ? value.split(',') : value);
  };

  const handleGenerate = () => {
    const selectedEmployees = employees.filter(e => selectedEmployeeIds.includes(e.id));
    generatePayroll(selectedEmployees, selectedYear, selectedMonth);
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Layout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Payroll Generation
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={selectedYear.toString()}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    label="Year"
                  >
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={selectedMonth.toString()}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    label="Month"
                  >
                    {months.map((month) => (
                      <MenuItem key={month} value={month}>
                        {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Employees</InputLabel>
                  <Select
                    multiple
                    value={selectedEmployeeIds}
                    onChange={handleEmployeeChange}
                    input={<OutlinedInput label="Employees" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((id) => {
                          const emp = employees.find(e => e.id === id);
                          return emp ? <Chip key={id} label={emp.name} size="small" /> : null;
                        })}
                      </Box>
                    )}
                  >
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<CalculateIcon />}
                  onClick={handleGenerate}
                  disabled={selectedEmployeeIds.length === 0}
                >
                  Generate
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Payroll Receipts */}
        {receipts.length > 0 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Payroll Receipts - {formatMonthYear(selectedYear, selectedMonth)}
            </Typography>
            <Grid container spacing={3}>
              {receipts.map((receipt) => {
                const employee = employees.find(e => e.id === receipt.employeeId);
                if (!employee) return null;

                return (
                  <Grid item xs={12} md={6} lg={4} key={receipt.employeeId}>
                    <Card>
                      <CardContent>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: employee.color,
                            }}
                          />
                          <Typography variant="h6">{employee.name}</Typography>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Base Salary
                          </Typography>
                          <Typography variant="body2">
                            ฿{receipt.summary.baseSalary.toLocaleString()}
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Daily Rate
                          </Typography>
                          <Typography variant="body2">
                            ฿{receipt.summary.dailyRate.toLocaleString()}
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Worked Days
                          </Typography>
                          <Typography variant="body2">
                            {receipt.summary.workedDays}
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Half Days
                          </Typography>
                          <Typography variant="body2">
                            {receipt.summary.halfDays}
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Absent Days
                          </Typography>
                          <Typography variant="body2">
                            {receipt.summary.absentDays}
                          </Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body1" fontWeight="bold">
                            Gross Salary
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            ฿{receipt.summary.grossSalary.toLocaleString()}
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="error">
                            Total Advance
                          </Typography>
                          <Typography variant="body2" color="error">
                            -฿{receipt.summary.totalAdvance.toLocaleString()}
                          </Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="h6" color="primary">
                            Net Salary
                          </Typography>
                          <Typography variant="h6" color="primary">
                            ฿{receipt.summary.netSalary.toLocaleString()}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {receipts.length === 0 && (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" align="center">
                Select month, year, and employees, then click "Generate" to create payroll receipts.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Layout>
  );
};

export default PayrollPage;
