import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Order, PaymentResponse } from '../types';

interface Props {
  order: Order | null;
  payment: PaymentResponse | null;
  paymentLoading: boolean;
  onClose: () => void;
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'เงินสด',
  qr: 'QR Code',
  card: 'บัตรเครดิต',
};

export const OrderDetailDialog = ({ order, payment, paymentLoading, onClose }: Props) => {
  if (!order) return null;

  const formattedDate = new Date(order.createdAt).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Dialog open={!!order} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        รายละเอียดคำสั่งซื้อ
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          #{order.id}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formattedDate}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {/* Items */}
        <Typography variant="subtitle2" gutterBottom>
          รายการสินค้า
        </Typography>
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>สินค้า</TableCell>
              <TableCell align="right">จำนวน</TableCell>
              <TableCell align="right">ราคา/ชิ้น</TableCell>
              <TableCell align="right">รวม</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {order.items.map((item) => (
              <TableRow key={item.productId}>
                <TableCell>{item.productName}</TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">
                  ฿{item.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell align="right">
                  ฿{item.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Financial summary */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">ยอดรวม</Typography>
            <Typography variant="body2">
              ฿{order.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
          {order.tax > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                ภาษี ({(order.taxRate * 100).toFixed(0)}%)
              </Typography>
              <Typography variant="body2">
                ฿{order.tax.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          )}
          {order.discount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">ส่วนลด</Typography>
              <Typography variant="body2" color="error.main">
                -฿{order.discount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          )}
          <Divider sx={{ my: 0.5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body1" fontWeight={700}>ยอดสุทธิ</Typography>
            <Typography variant="body1" fontWeight={700}>
              ฿{order.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Box>

        {/* Payment info */}
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle2" gutterBottom>
          ข้อมูลการชำระเงิน
        </Typography>

        {paymentLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : payment ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">วิธีชำระ</Typography>
              <Typography variant="body2">
                {METHOD_LABELS[payment.method] ?? payment.method}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">จำนวนที่ชำระ</Typography>
              <Typography variant="body2">
                ฿{payment.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
            {payment.method === 'cash' && payment.amountTendered !== undefined && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">รับเงินมา</Typography>
                  <Typography variant="body2">
                    ฿{payment.amountTendered.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">ทอนเงิน</Typography>
                  <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>
                    ฿{(payment.change ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </>
            )}
            {payment.referenceNumber && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">เลขอ้างอิง</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {payment.referenceNumber}
                </Typography>
              </Box>
            )}
          </Box>
        ) : order.paymentStatus !== 'paid' ? (
          <Typography variant="body2" color="text.secondary">ยังไม่ได้ชำระเงิน</Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">ไม่พบข้อมูลการชำระเงิน</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>ปิด</Button>
      </DialogActions>
    </Dialog>
  );
};
