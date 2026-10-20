import { useEffect, useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import BlockIcon from '@mui/icons-material/Block';
import { PaymentMethod, PaymentResponse } from '../types';
import { CheckoutStep } from '../hooks/useCheckout';

interface Props {
  open: boolean;
  step: CheckoutStep;
  paymentMethod: PaymentMethod | null;
  paymentResult: PaymentResponse | null;
  errorMessage: string | null;
  subtotal: number;
  onConfirm: (details: { amountTendered?: number; referenceNumber?: string }) => void;
  onRetry: () => void;
  onClose: () => void;
  /** BLOCKED step: abandon the unpaid order and clear the cart. */
  onCancelOrder: () => void;
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'เงินสด',
  qr: 'QR Code',
  card: 'บัตรเครดิต',
};

function generateRef(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `TXN-${date}-${rand}`;
}

export const CheckoutDialog = ({
  open,
  step,
  paymentMethod,
  paymentResult,
  errorMessage,
  subtotal,
  onConfirm,
  onRetry,
  onClose,
  onCancelOrder,
}: Props) => {
  const [amountTendered, setAmountTendered] = useState(subtotal);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [amountError, setAmountError] = useState('');

  // Reset form when dialog opens or payment method changes
  useEffect(() => {
    if (open && step === 'PAYMENT_FORM') {
      setAmountTendered(subtotal);
      setReferenceNumber('');
      setAmountError('');
    }
  }, [open, step, paymentMethod, subtotal]);

  const handleConfirm = () => {
    if (paymentMethod === 'cash') {
      const amount = amountTendered;
      if (!amountTendered || isNaN(amount)) {
        setAmountError('กรุณาระบุจำนวนเงิน');
        return;
      }
      if (amount < subtotal) {
        setAmountError(
          `จำนวนเงินไม่พอ (ต้องการ ฿${subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })})`,
        );
        return;
      }
      onConfirm({ amountTendered: amount });
    } else {
      onConfirm({ referenceNumber: referenceNumber.trim() || generateRef() });
    }
  };

  const dialogTitle =
    step === 'SUCCESS'
      ? 'ขายสำเร็จ'
      : step === 'BLOCKED'
        ? 'ไม่สามารถซื้อได้ (Purchase blocked)'
      : step === 'ERROR'
        ? 'เกิดข้อผิดพลาด'
        : step === 'PROCESSING'
          ? 'กำลังประมวลผล...'
          : paymentMethod
            ? `ชำระด้วย${METHOD_LABELS[paymentMethod]}`
            : 'ชำระเงิน';

  return (
    <Dialog
      open={open}
      onClose={step === 'SUCCESS' || step === 'ERROR' || step === 'BLOCKED' ? onClose : undefined}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown={step === 'PROCESSING'}
    >
      <DialogTitle>{dialogTitle}</DialogTitle>

      <DialogContent>
        {/* PAYMENT FORM */}
        {step === 'PAYMENT_FORM' && (
          <Box sx={{ pt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                ยอดที่ต้องชำระ
              </Typography>
              <Typography variant="h6" fontWeight={700} color="primary">
                ฿{subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>

            {paymentMethod === 'cash' && (
              <TextField
                fullWidth
                label="รับเงินมา"
                type="number"
                value={amountTendered}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  setAmountTendered(Number(e.target.value));
                  setAmountError('');
                }}
                error={!!amountError}
                helperText={amountError || ' '}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">฿</InputAdornment>
                  ),
                }}
                inputProps={{ min: 0, step: 0.01 }}
                autoFocus
              />
            )}

            {(paymentMethod === 'qr' || paymentMethod === 'card') && (
              <TextField
                fullWidth
                label="หมายเลขอ้างอิง (ไม่บังคับ)"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                helperText="หากเว้นว่างจะสร้างให้อัตโนมัติ"
                autoFocus
              />
            )}
          </Box>
        )}

        {/* PROCESSING */}
        {step === 'PROCESSING' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, gap: 2 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              กำลังประมวลผลการชำระเงิน...
            </Typography>
          </Box>
        )}

        {/* SUCCESS */}
        {step === 'SUCCESS' && paymentResult && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 1.5 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 64, color: 'success.main' }} />
            <Typography variant="h6" fontWeight={700} color="success.main">
              ขายสำเร็จ
            </Typography>
            <Divider sx={{ width: '100%', my: 1 }} />
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">ยอดที่ชำระ</Typography>
                <Typography variant="body2" fontWeight={600}>
                  ฿{paymentResult.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
              {paymentResult.method === 'cash' && paymentResult.amountTendered !== undefined && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">รับเงินมา</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      ฿{paymentResult.amountTendered.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" fontWeight={700} color="success.dark">ทอนเงิน</Typography>
                    <Typography variant="body1" fontWeight={700} color="success.dark">
                      ฿{(paymentResult.change ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </>
              )}
              {paymentResult.referenceNumber && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">หมายเลขอ้างอิง</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {paymentResult.referenceNumber}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* BLOCKED (409 repurchase period) */}
        {step === 'BLOCKED' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 1.5 }}>
            <BlockIcon sx={{ fontSize: 64, color: 'warning.main' }} />
            <Alert severity="warning" sx={{ width: '100%' }}>
              <AlertTitle>ไม่สามารถซื้อได้ (Purchase blocked)</AlertTitle>
              {errorMessage}
            </Alert>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              ออเดอร์นี้ยังไม่ได้ชำระเงิน — ยกเลิกออเดอร์เพื่อล้างตะกร้า
              หรือปิดเพื่อกลับไปแก้ไขสินค้าในตะกร้า
            </Typography>
          </Box>
        )}

        {/* ERROR */}
        {step === 'ERROR' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 1.5 }}>
            <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />
            <Typography variant="body1" color="error" textAlign="center">
              {errorMessage ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {step === 'PAYMENT_FORM' && (
          <>
            <Button onClick={onClose} color="inherit">
              ยกเลิก
            </Button>
            <Button variant="contained" onClick={handleConfirm}>
              ยืนยันการชำระเงิน
            </Button>
          </>
        )}
        {step === 'SUCCESS' && (
          <Button variant="contained" color="success" fullWidth onClick={onClose}>
            ปิด
          </Button>
        )}
        {step === 'BLOCKED' && (
          <>
            <Button onClick={onCancelOrder} color="error">
              ยกเลิกออเดอร์
            </Button>
            <Button variant="contained" onClick={onClose}>
              ปิด
            </Button>
          </>
        )}
        {step === 'ERROR' && (
          <>
            <Button onClick={onClose} color="inherit">
              ยกเลิก
            </Button>
            <Button variant="contained" color="error" onClick={onRetry}>
              ลองใหม่
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
