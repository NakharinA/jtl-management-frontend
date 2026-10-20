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

interface BuyerForm {
  name: string;
  taxId: string;
  branch: string;
  address: string;
}

const EMPTY: BuyerForm = { name: '', taxId: '', branch: '', address: '' };

/** Buyer details for a delivery note (ใบส่งของ/ใบเสร็จรับเงิน) for a walk-in / person customer. */
export const DeliveryNoteRequestDialog = ({ open, onClose, onSubmit }: Props) => {
  const [form, setForm] = useState<BuyerForm>(EMPTY);
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
  // Tax ID and address are optional; only the buyer name is required
  const canSubmit = form.name.trim() !== '' && !taxIdInvalid;

  const set =
    (key: keyof BuyerForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: form.name.trim(),
        taxId: taxIdDigits || undefined,
        // A branch only means something alongside a tax ID
        branch: taxIdDigits ? form.branch.trim() || 'สำนักงานใหญ่' : undefined,
        address: form.address.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ออกใบส่งของไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>ขอใบส่งของ / ใบเสร็จรับเงิน</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="ชื่อผู้ซื้อ / ร้าน / บริษัท"
            value={form.name}
            onChange={set('name')}
            required
            autoFocus
          />
          <TextField
            label="เลขประจำตัวผู้เสียภาษี (ถ้ามี)"
            value={form.taxId}
            onChange={set('taxId')}
            error={taxIdInvalid}
            helperText={taxIdInvalid ? 'ต้องเป็นตัวเลข 13 หลัก' : 'ไม่บังคับ — ถ้ากรอกต้องเป็นตัวเลข 13 หลัก'}
            inputProps={{ inputMode: 'numeric' }}
          />
          <TextField
            label="สาขา"
            value={form.branch}
            onChange={set('branch')}
            disabled={!taxIdDigits}
            placeholder="สำนักงานใหญ่"
            helperText="ใช้เมื่อมีเลขผู้เสียภาษี เช่น สำนักงานใหญ่ หรือ 00001"
          />
          <TextField
            label="ที่อยู่"
            value={form.address}
            onChange={set('address')}
            helperText="แนะนำให้กรอก (ไม่บังคับ)"
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
          ออกใบส่งของ
        </Button>
      </DialogActions>
    </Dialog>
  );
};
