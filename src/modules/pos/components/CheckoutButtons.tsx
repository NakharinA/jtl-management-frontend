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

export const CheckoutButtons = ({ onCheckout, disabled }: Props) => (
  <Box sx={{ px: 2, pb: 2 }}>
    <Divider sx={{ mb: 1.5 }} />
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
          sx={{ py: 1.5, fontSize: '1rem', fontWeight: 700 }}
        >
          {label}
        </Button>
      ))}
    </Box>
  </Box>
);
