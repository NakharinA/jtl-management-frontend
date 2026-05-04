import { Box, Divider, Typography } from '@mui/material';

interface Props {
  subtotal: number;
}

export const OrderSummary = ({ subtotal }: Props) => (
  <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
    <Divider sx={{ mb: 1.5 }} />
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        ยอดรวม
      </Typography>
      <Typography variant="body2">
        ฿{subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="subtitle1" fontWeight={700}>
        รวมทั้งสิ้น
      </Typography>
      <Typography variant="subtitle1" fontWeight={700} color="primary">
        ฿{subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
      </Typography>
    </Box>
    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'right' }}>
      ราคารวมภาษีแล้ว
    </Typography>
  </Box>
);
