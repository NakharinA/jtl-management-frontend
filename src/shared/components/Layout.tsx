import { ReactNode } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import LogoutIcon from '@mui/icons-material/Logout';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/calendar', label: 'ปฏิทิน', icon: <CalendarMonthIcon /> },
    { path: '/employees', label: 'พนักงาน', icon: <PeopleIcon /> },
    { path: '/payroll', label: 'เงินเดือน', icon: <PaymentIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
            JTL Employee Management
          </Typography>
          
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            ออกจากระบบ
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 4 }}>
        {children}
      </Container>
    </Box>
  );
};
