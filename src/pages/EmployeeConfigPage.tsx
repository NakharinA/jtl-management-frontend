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
    baseSalary: '',
    paymentDay: '',
    color: '#1976d2',
  });

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        baseSalary: employee.baseSalary.toString(),
        paymentDay: employee.paymentDay.toString(),
        color: employee.color,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        baseSalary: '',
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
    const data = {
      name: formData.name,
      baseSalary: parseFloat(formData.baseSalary),
      paymentDay: parseInt(formData.paymentDay),
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
    if (window.confirm('Are you sure you want to delete this employee?')) {
      deleteEmployee(id);
    }
  };

  return (
    <Layout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Employee Configuration
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Employee
          </Button>
        </Box>

        <Card>
          <CardContent>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Base Salary</TableCell>
                    <TableCell align="right">Payment Day</TableCell>
                    <TableCell>Color</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary">
                          No employees found. Click "Add Employee" to create one.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell align="right">฿{employee.baseSalary.toLocaleString()}</TableCell>
                        <TableCell align="right">{employee.paymentDay}</TableCell>
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
            {editingEmployee ? 'Edit Employee' : 'Add Employee'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              autoFocus
            />
            <TextField
              fullWidth
              label="Base Salary"
              type="number"
              value={formData.baseSalary}
              onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Payment Day (1-31)"
              type="number"
              value={formData.paymentDay}
              onChange={(e) => setFormData({ ...formData, paymentDay: e.target.value })}
              margin="normal"
              inputProps={{ min: 1, max: 31 }}
            />
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Color
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
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!formData.name || !formData.baseSalary || !formData.paymentDay}
            >
              {editingEmployee ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default EmployeeConfigPage;
