import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { CustomerType, DEFAULT_BRANCH, Member, MemberPayload } from '../types';
import { toThaiMemberError } from '../services/member.service';

interface MemberFormDialogProps {
  open: boolean;
  /** Member being edited; null to create a new member. */
  member: Member | null;
  onClose: () => void;
  onSubmit: (data: MemberPayload) => Promise<void>;
}

interface FormState {
  name: string;
  phone: string;
  customerType: CustomerType;
  shopName: string;
  taxId: string;
  branch: string;
  address: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const digitsOnly = (value: string) => value.replace(/[\s-]/g, '');

const initialState = (member: Member | null): FormState => ({
  name: member?.name ?? '',
  phone: member?.phone ?? '',
  customerType: member?.customerType ?? 'person',
  shopName: member?.shopName ?? '',
  taxId: member?.taxId ?? '',
  branch: member?.branch ?? DEFAULT_BRANCH,
  address: member?.address ?? '',
});

const validate = (form: FormState): FormErrors => {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'กรุณาระบุชื่อ';
  const phone = digitsOnly(form.phone);
  if (!phone) errors.phone = 'กรุณาระบุเบอร์โทรศัพท์';
  else if (!/^0[0-9]{9}$/.test(phone)) errors.phone = 'ต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0';
  if (form.customerType === 'shop') {
    if (!form.shopName.trim()) errors.shopName = 'กรุณาระบุชื่อร้านค้า';
    const taxId = digitsOnly(form.taxId);
    if (!taxId) errors.taxId = 'กรุณาระบุเลขประจำตัวผู้เสียภาษี';
    else if (!/^[0-9]{13}$/.test(taxId)) errors.taxId = 'ต้องเป็นตัวเลข 13 หลัก';
  }
  return errors;
};

export const MemberFormDialog = ({ open, member, onClose, onSubmit }: MemberFormDialogProps) => {
  const [form, setForm] = useState<FormState>(initialState(member));
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialState(member));
      setErrors({});
      setTouched(false);
      setSubmitError('');
    }
  }, [open, member]);

  const update = (field: keyof FormState, value: string) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched) setErrors(validate(next));
  };

  const handleSubmit = async () => {
    setTouched(true);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const isShop = form.customerType === 'shop';
    const payload: MemberPayload = {
      name: form.name.trim(),
      phone: digitsOnly(form.phone),
      customerType: form.customerType,
      shopName: isShop ? form.shopName.trim() : null,
      taxId: isShop ? digitsOnly(form.taxId) : null,
      branch: isShop ? form.branch.trim() || DEFAULT_BRANCH : null,
      address: isShop ? form.address.trim() || null : null,
    };

    setSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setSubmitError(toThaiMemberError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isShop = form.customerType === 'shop';

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{member ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิก'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            ประเภทลูกค้า
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            color="primary"
            value={form.customerType}
            onChange={(_, v: CustomerType | null) => v && update('customerType', v)}
          >
            <ToggleButton value="person">
              <PersonIcon fontSize="small" sx={{ mr: 0.5 }} /> บุคคล
            </ToggleButton>
            <ToggleButton value="shop">
              <StorefrontIcon fontSize="small" sx={{ mr: 0.5 }} /> ร้านค้า
            </ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            {isShop ? 'ร้านค้าจะได้รับใบกำกับภาษีเต็มรูป' : 'บุคคลทั่วไปจะได้รับใบเสร็จรับเงินอย่างย่อ'}
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="ชื่อ"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          margin="normal"
          autoFocus
          required
          error={!!errors.name}
          helperText={errors.name}
          inputProps={{ maxLength: 200 }}
        />
        <TextField
          fullWidth
          label="เบอร์โทรศัพท์"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          margin="normal"
          required
          error={!!errors.phone}
          helperText={errors.phone || 'ตัวเลข 10 หลัก เช่น 0812345678'}
          inputProps={{ maxLength: 20, inputMode: 'tel' }}
        />

        {isShop && (
          <>
            <TextField
              fullWidth
              label="ชื่อร้านค้า / ชื่อนิติบุคคล"
              value={form.shopName}
              onChange={(e) => update('shopName', e.target.value)}
              margin="normal"
              required
              error={!!errors.shopName}
              helperText={errors.shopName}
              inputProps={{ maxLength: 500 }}
            />
            <TextField
              fullWidth
              label="เลขประจำตัวผู้เสียภาษี"
              value={form.taxId}
              onChange={(e) => update('taxId', e.target.value)}
              margin="normal"
              required
              error={!!errors.taxId}
              helperText={errors.taxId || 'ตัวเลข 13 หลัก'}
              inputProps={{ maxLength: 20, inputMode: 'numeric' }}
            />
            <TextField
              fullWidth
              label="สาขา"
              value={form.branch}
              onChange={(e) => update('branch', e.target.value)}
              margin="normal"
              helperText="เช่น สำนักงานใหญ่ หรือเลขสาขา 00001"
              inputProps={{ maxLength: 100 }}
            />
            <TextField
              fullWidth
              label="ที่อยู่"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              margin="normal"
              multiline
              minRows={2}
              inputProps={{ maxLength: 500 }}
            />
          </>
        )}

        {member?.lineLinked && (
          <Alert severity="info" sx={{ mt: 2 }}>
            สมาชิกนี้เชื่อมต่อ LINE แล้ว ข้อมูล LINE และแต้มสะสมจัดการโดยแอป LINE
          </Alert>
        )}
        {submitError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {submitError}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          ยกเลิก
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <CircularProgress size={20} /> : 'บันทึก'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
