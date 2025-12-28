import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import EmployeeManagement from './pages/EmployeeManagement';
import Calendar from './pages/Calendar';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  console.log("user : ", user)

  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <>
      <header className="header">
        <div className="header-content">
          <h1 className="logo">HR Payroll System</h1>
          <nav className="nav">
            <Link to="/" className="nav-link">
              Employees
            </Link>
            <button className="btn btn-secondary" onClick={logout}>
              Logout
            </button>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <EmployeeManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/calendar/:employeeId"
              element={
                <PrivateRoute>
                  <Calendar />
                </PrivateRoute>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
