import { Box, Button, Divider } from '@mui/material';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { PaymentMethod } from '../types';

interface Props {
  onCheckout: (method: PaymentMethod) => void;
  disabled?: boolean;
}

const PAYMENT_METHODS: { method: PaymentMethod; label: string; icon: React.ReactNode; color: 'success' | 'info' | 'secondary' }[] = [
  { method: 'cash', label: 'เงินสด', icon: <LocalAtmIcon />, color: 'success' },
  { method: 'qr', label: 'QR Code', icon: <QrCode2Icon />, color: 'info' },
  { method: 'card', label: 'บัตรเครดิต', icon: <CreditCardIcon />, color: 'secondary' },
];

// Matches PC / iPad-landscape heights where three stacked buttons would
// squeeze the cart list (two-column layout only; phones use the tab layout).
const SHORT_SCREEN = '@media (max-height: 860px) and (min-width: 768px)';

export const CheckoutButtons = ({ onCheckout, disabled }: Props) => (
  <Box sx={{ px: 2, pb: 2, flexShrink: 0 }}>
    <Divider sx={{ mb: 1.5 }} />
    {/* Short screens (laptops, iPad landscape): one row so more cart items fit */}
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        [SHORT_SCREEN]: { flexDirection: 'row' },
      }}
    >
      {PAYMENT_METHODS.map(({ method, label, icon, color }) => (
        <Button
          key={method}
          variant="contained"
          color={color}
          size="large"
          fullWidth
          disabled={disabled}
          startIcon={icon}
          onClick={() => onCheckout(method)}
          sx={{
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 700,
            [SHORT_SCREEN]: {
              flexDirection: 'column',
              gap: 0.25,
              py: 1,
              px: 0.5,
              minWidth: 0,
              fontSize: '0.9rem',
              lineHeight: 1.3,
              '& .MuiButton-startIcon': { m: 0 },
            },
          }}
        >
          {label}
        </Button>
      ))}
    </Box>
  </Box>
);
