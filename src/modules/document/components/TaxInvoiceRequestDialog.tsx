import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { BuyerInput } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (buyer: BuyerInput) => Promise<unknown>;
}

const EMPTY: BuyerInput = { name: '', taxId: '', branch: 'สำนักงานใหญ่', address: '' };

export const TaxInvoiceRequestDialog = ({ open, onClose, onSubmit }: Props) => {
  const [form, setForm] = useState<BuyerInput>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError(null);
    }
  }, [open]);

  const taxIdDigits = form.taxId.replace(/[\s-]/g, '');
  const taxIdInvalid = form.taxId !== '' && !/^\d{13}$/.test(taxIdDigits);
  const canSubmit =
    form.name.trim() !== '' && /^\d{13}$/.test(taxIdDigits) && form.address.trim() !== '';

  const set =
    (key: keyof BuyerInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: form.name.trim(),
        taxId: taxIdDigits,
        branch: form.branch?.trim() || undefined,
        address: form.address.trim(),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ออกใบกำกับภาษีไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>ขอใบกำกับภาษี</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="ชื่อผู้ซื้อ / บริษัท"
            value={form.name}
            onChange={set('name')}
            required
            autoFocus
          />
          <TextField
            label="เลขประจำตัวผู้เสียภาษี (13 หลัก)"
            value={form.taxId}
            onChange={set('taxId')}
            required
            error={taxIdInvalid}
            helperText={taxIdInvalid ? 'ต้องเป็นตัวเลข 13 หลัก' : ' '}
            inputProps={{ inputMode: 'numeric' }}
          />
          <TextField
            label="สาขา"
            value={form.branch}
            onChange={set('branch')}
            helperText="เช่น สำนักงานใหญ่ หรือ 00001"
          />
          <TextField
            label="ที่อยู่"
            value={form.address}
            onChange={set('address')}
            required
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : undefined}
        >
          ออกใบกำกับภาษี
        </Button>
      </DialogActions>
    </Dialog>
  );
};
