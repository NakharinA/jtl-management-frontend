import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import AttendanceCalendarPage from '@/pages/AttendanceCalendarPage';
import EmployeeConfigPage from '@/pages/EmployeeConfigPage';
import PayrollPage from '@/pages/PayrollPage';
import ProductPage from '@/pages/ProductPage';
import { useAuth } from '@/modules/auth/hooks/useAuth';

export const Router = () => {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/calendar" replace /> : <LoginPage />
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <AttendanceCalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <EmployeeConfigPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <ProtectedRoute>
              <PayrollPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/calendar" replace />} />
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
