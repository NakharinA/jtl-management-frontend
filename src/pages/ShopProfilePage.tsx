import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { Layout } from '@/shared/components/Layout';
import { shopProfileService } from '@/modules/document/services/document.service';
import { ShopProfileInput } from '@/modules/document/types';

const EMPTY: ShopProfileInput = {
  name: '',
  taxId: '',
  branch: '',
  address: '',
  phone: '',
};

/** Seller details printed on receipts and delivery notes. The shop is not VAT-registered. */
const ShopProfilePage = () => {
  const [form, setForm] = useState<ShopProfileInput>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    shopProfileService
      .get()
      .then((p) =>
        setForm({
          name: p.name,
          taxId: p.taxId ?? '',
          branch: p.branch ?? '',
          address: p.address ?? '',
          phone: p.phone ?? '',
        }),
      )
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ'),
      )
      .finally(() => setIsLoading(false));
  }, []);

  const set =
    (key: keyof ShopProfileInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setSaved(false);
    };

  const taxIdDigits = (form.taxId ?? '').replace(/[\s-]/g, '');
  const taxIdInvalid = taxIdDigits !== '' && !/^\d{13}$/.test(taxIdDigits);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await shopProfileService.save({ ...form, taxId: taxIdDigits || null });
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ p: 2, maxWidth: 640 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          ข้อมูลร้าน
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          ใช้แสดงบนใบเสร็จรับเงินและใบส่งของ
        </Typography>

        {isLoading ? (
          <CircularProgress />
        ) : (
          <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              {saved && <Alert severity="success">บันทึกแล้ว</Alert>}
              <TextField label="ชื่อร้าน / บริษัท" value={form.name} onChange={set('name')} required />
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
                helperText="ใช้เมื่อมีเลขผู้เสียภาษี เช่น สำนักงานใหญ่ หรือ 00001"
              />
              <TextField
                label="ที่อยู่"
                value={form.address}
                onChange={set('address')}
                multiline
                minRows={2}
              />
              <TextField label="เบอร์โทร" value={form.phone} onChange={set('phone')} />
              <Box>
                <Button
                  variant="contained"
                  startIcon={isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={isSaving || !form.name.trim() || taxIdInvalid}
                >
                  บันทึก
                </Button>
              </Box>
            </Stack>
          </Paper>
        )}
      </Box>
    </Layout>
  );
};

export default ShopProfilePage;
