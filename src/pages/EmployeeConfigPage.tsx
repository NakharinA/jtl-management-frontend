import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import { Layout } from '@/shared/components/Layout';
import { useEmployees } from '@/modules/employee/hooks/useEmployees';
import { Employee } from '@/modules/employee/types';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const EmployeeConfigPage = () => {
  const { employees, createEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    dailyRate: '',
    paymentDay: '',
    color: '#1976d2',
  });

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        dailyRate: employee.dailyRate.toString(),
        paymentDay: employee.paydayAnchor.toString(),
        color: employee.color,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        dailyRate: '',
        paymentDay: '',
        color: '#1976d2',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEmployee(null);
  };

  const handleSubmit = () => {
    const data: Omit<Employee, 'id'> = {
      name: formData.name,
      dailyRate: parseFloat(formData.dailyRate),
      paydayAnchor: parseInt(formData.paymentDay),
      color: formData.color,
    };

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, data);
    } else {
      createEmployee(data);
    }

    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบพนักงานคนนี้?')) {
      deleteEmployee(id);
    }
  };

  return (
    <Layout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            จัดการพนักงาน
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            เพิ่มพนักงาน
          </Button>
        </Box>

        <Card>
          <CardContent>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ชื่อ-นามสกุล</TableCell>
                    <TableCell align="right">ค่าแรงรายวัน</TableCell>
                    <TableCell align="right">วันตัดรอบเงินเดือน</TableCell>
                    <TableCell>สี</TableCell>
                    <TableCell align="right">จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary">
                          ไม่พบข้อมูลพนักงาน คลิก "เพิ่มพนักงาน" เพื่อสร้างใหม่
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell align="right">{employee.dailyRate} ฿</TableCell>
                        <TableCell align="right">{employee.paydayAnchor}</TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              width: 40,
                              height: 24,
                              backgroundColor: employee.color,
                              borderRadius: 1,
                              border: '1px solid #ccc',
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(employee)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(employee.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingEmployee ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงาน'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="ชื่อ-นามสกุล"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              autoFocus
            />
            <TextField
              fullWidth
              label="ค่าแรงรายวัน"
              type="number"
              value={formData.dailyRate}
              onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="วันตัดรอบเงินเดือน (1-31)"
              type="number"
              value={formData.paymentDay}
              onChange={(e) => setFormData({ ...formData, paymentDay: e.target.value })}
              margin="normal"
              inputProps={{ min: 1, max: 31 }}
            />
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                สีประจำตัว
              </Typography>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                style={{ width: '100%', height: 40, cursor: 'pointer' }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>ยกเลิก</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!formData.name || !formData.dailyRate || !formData.paymentDay}
            >
              {editingEmployee ? 'บันทึก' : 'สร้าง'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default EmployeeConfigPage;
