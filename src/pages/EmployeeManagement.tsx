import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeApi } from '../services/employeeApi';
import { payrollApi } from '../services/payrollApi';
import { Employee, PayrollSummary } from '../types';

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [summaries, setSummaries] = useState<Record<string, PayrollSummary>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    dailyRate: '',
    paydayAnchor: '15',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await employeeApi.getAll();
      const employeeList = response.data;
      setEmployees(employeeList);

      // Load summaries for each employee
      const summaryPromises = employeeList.map(async (emp) => {
        try {
          const summaryRes = await payrollApi.getSummary(emp.id);
          return { id: emp.id, summary: summaryRes.data };
        } catch {
          return { id: emp.id, summary: null };
        }
      });

      const summaryResults = await Promise.all(summaryPromises);
      const summaryMap: Record<string, PayrollSummary> = {};
      summaryResults.forEach((result) => {
        if (result.summary) {
          summaryMap[result.id] = result.summary;
        }
      });
      setSummaries(summaryMap);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await employeeApi.update(editingEmployee.id, {
          name: formData.name,
          dailyRate: parseFloat(formData.dailyRate),
          paydayAnchor: parseInt(formData.paydayAnchor),
        });
      } else {
        await employeeApi.create({
          name: formData.name,
          dailyRate: parseFloat(formData.dailyRate),
          paydayAnchor: parseInt(formData.paydayAnchor),
        });
      }
      setShowForm(false);
      setEditingEmployee(null);
      setFormData({ name: '', dailyRate: '', paydayAnchor: '15' });
      loadEmployees();
    } catch (error) {
      console.error('Failed to save employee:', error);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      dailyRate: employee.dailyRate.toString(),
      paydayAnchor: employee.paydayAnchor.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this employee?')) {
      try {
        await employeeApi.delete(id);
        loadEmployees();
      } catch (error) {
        console.error('Failed to delete employee:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex-between mb-4">
        <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Employee Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(true);
            setEditingEmployee(null);
            setFormData({ name: '', dailyRate: '', paydayAnchor: '15' });
          }}
        >
          + Add Employee
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="dailyRate">Daily Rate (฿)</label>
                <input
                  id="dailyRate"
                  type="number"
                  step="0.01"
                  className="input"
                  value={formData.dailyRate}
                  onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="paydayAnchor">Payday (Day of Month)</label>
                <input
                  id="paydayAnchor"
                  type="number"
                  min="1"
                  max="31"
                  className="input"
                  value={formData.paydayAnchor}
                  onChange={(e) => setFormData({ ...formData, paydayAnchor: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEmployee ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Daily Rate</th>
              <th>Payday</th>
              <th>Earned So Far</th>
              <th>Advanced</th>
              <th>Remaining</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => {
              const summary = summaries[employee.id];
              return (
                <tr key={employee.id}>
                  <td style={{ fontWeight: '600' }}>{employee.name}</td>
                  <td>฿{employee.dailyRate.toLocaleString()}</td>
                  <td>Day {employee.paydayAnchor}</td>
                  <td>฿{summary?.earnedSoFar.toLocaleString() || '0'}</td>
                  <td>฿{summary?.totalAdvanced.toLocaleString() || '0'}</td>
                  <td>
                    <span className="badge badge-success">
                      ฿{summary?.remaining.toLocaleString() || '0'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem' }}
                        onClick={() => navigate(`/calendar/${employee.id}`)}
                      >
                        Calendar
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem' }}
                        onClick={() => handleEdit(employee)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.5rem 1rem' }}
                        onClick={() => handleDelete(employee.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeManagement;
