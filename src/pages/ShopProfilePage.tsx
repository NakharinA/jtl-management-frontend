import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
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
  vatRegistered: false,
};

/** Seller details printed on receipts and tax invoices. */
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
          vatRegistered: p.vatRegistered,
        }),
      )
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ'),
      )
      .finally(() => setIsLoading(false));
  }, []);

  const set =
    (key: Exclude<keyof ShopProfileInput, 'vatRegistered'>) =>
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
          ใช้แสดงบนใบเสร็จและใบกำกับภาษี
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
                label="เลขประจำตัวผู้เสียภาษี (13 หลัก)"
                value={form.taxId}
                onChange={set('taxId')}
                error={taxIdInvalid}
                helperText={taxIdInvalid ? 'ต้องเป็นตัวเลข 13 หลัก' : 'จำเป็นสำหรับการออกใบกำกับภาษี'}
                inputProps={{ inputMode: 'numeric' }}
              />
              <TextField
                label="สาขา"
                value={form.branch}
                onChange={set('branch')}
                helperText="เช่น สำนักงานใหญ่ หรือ 00001 (เว้นว่าง = สำนักงานใหญ่)"
              />
              <TextField
                label="ที่อยู่"
                value={form.address}
                onChange={set('address')}
                multiline
                minRows={2}
              />
              <TextField label="เบอร์โทร" value={form.phone} onChange={set('phone')} />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.vatRegistered}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, vatRegistered: e.target.checked }));
                      setSaved(false);
                    }}
                  />
                }
                label="จดทะเบียนภาษีมูลค่าเพิ่ม (VAT) — จำเป็นสำหรับการออกใบกำกับภาษี"
              />
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
