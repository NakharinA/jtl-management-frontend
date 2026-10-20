import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Snackbar,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { Layout } from '@/shared/components/Layout';
import { uploadService } from '@/services/upload.service';
import { isApiError } from '@/services/api.client';
import { rewardsService, toThaiRewardsError } from '@/modules/rewards/services/rewards.service';
import { PRIZE_DESCRIPTION_MAX_LENGTH, PRIZE_NAME_MAX_LENGTH, Prize, PrizePayload } from '@/modules/rewards/types';

const formatPoints = (n: number) => n.toLocaleString('th-TH');

interface FormState {
  name: string;
  description: string;
  imageUrl: string;
  pointsCost: string;
  stock: string; // '' = unlimited
  active: boolean;
  sortOrder: string;
}

const emptyForm: FormState = {
  name: '',
  description: '',
  imageUrl: '',
  pointsCost: '',
  stock: '',
  active: true,
  sortOrder: '0',
};

const isWholeNumber = (s: string) => /^\d+$/.test(s.trim());

const PrizeCard = ({
  prize,
  onEdit,
  onDelete,
}: {
  prize: Prize;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const pending = prize.counts.requested + prize.counts.approved;
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', opacity: prize.active ? 1 : 0.6 }}>
      {prize.imageUrl ? (
        <CardMedia component="img" image={prize.imageUrl} alt={prize.name} sx={{ height: 160, objectFit: 'cover' }} />
      ) : (
        <Box
          sx={{
            height: 160,
            bgcolor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'grey.400',
          }}
        >
          <CardGiftcardIcon sx={{ fontSize: 64 }} />
        </Box>
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 0.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1, wordBreak: 'break-word' }}>
            {prize.name}
          </Typography>
          {!prize.active && <Chip size="small" label="ปิดการแลก" />}
        </Box>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
          {formatPoints(prize.pointsCost)} แต้ม
        </Typography>
        <Typography variant="body2" color={prize.stock === 0 ? 'error' : 'text.secondary'}>
          คงเหลือ: {prize.stock === null ? 'ไม่จำกัด' : formatPoints(prize.stock)}
        </Typography>
        {prize.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
            {prize.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
          {pending > 0 && <Chip size="small" color="warning" label={`รอดำเนินการ ${pending}`} />}
          {prize.counts.delivered > 0 && (
            <Chip size="small" color="success" variant="outlined" label={`แลกแล้ว ${prize.counts.delivered}`} />
          )}
        </Box>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <IconButton size="small" onClick={onEdit} title="แก้ไข">
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" color="error" onClick={onDelete} title="ลบ">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  );
};

const PrizePage = () => {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [filter, setFilter] = useState<'all' | 'active'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  // form dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Prize | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // delete dialog
  const [deleting, setDeleting] = useState<Prize | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteInUse, setDeleteInUse] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setPrizes(await rewardsService.listPrizes(filter === 'active' ? true : undefined));
    } catch (err) {
      setLoadError(toThaiRewardsError(err, 'เกิดข้อผิดพลาดในการโหลดข้อมูล'));
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview('');
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (prize: Prize) => {
    setEditing(prize);
    setForm({
      name: prize.name,
      description: prize.description ?? '',
      imageUrl: prize.imageUrl ?? '',
      pointsCost: String(prize.pointsCost),
      stock: prize.stock === null ? '' : String(prize.stock),
      active: prize.active,
      sortOrder: String(prize.sortOrder),
    });
    setImageFile(null);
    setImagePreview(prize.imageUrl ?? '');
    setFormError(null);
    setDialogOpen(true);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setForm((f) => ({ ...f, imageUrl: '' }));
  };

  const pointsError = form.pointsCost !== '' && (!isWholeNumber(form.pointsCost) || Number(form.pointsCost) < 1);
  const stockError = form.stock.trim() !== '' && !isWholeNumber(form.stock);
  const sortError = form.sortOrder.trim() !== '' && !/^-?\d+$/.test(form.sortOrder.trim());
  const canSave =
    form.name.trim() !== '' &&
    form.pointsCost !== '' &&
    !pointsError &&
    !stockError &&
    !sortError &&
    form.name.length <= PRIZE_NAME_MAX_LENGTH &&
    form.description.length <= PRIZE_DESCRIPTION_MAX_LENGTH;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setFormError(null);
    try {
      let imageUrl = form.imageUrl;
      if (imageFile) imageUrl = await uploadService.uploadImage(imageFile, 'prizes');
      const payload: PrizePayload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        imageUrl: imageUrl || null,
        pointsCost: Number(form.pointsCost),
        stock: form.stock.trim() === '' ? null : Number(form.stock),
        active: form.active,
        sortOrder: form.sortOrder.trim() === '' ? 0 : Number(form.sortOrder),
      };
      if (editing) {
        await rewardsService.updatePrize(editing.id, payload);
        setToast('บันทึกของรางวัลแล้ว');
      } else {
        await rewardsService.createPrize(payload);
        setToast('เพิ่มของรางวัลแล้ว');
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      setFormError(toThaiRewardsError(err, 'บันทึกไม่สำเร็จ'));
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (prize: Prize) => {
    setDeleting(prize);
    setDeleteError(null);
    setDeleteInUse(false);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await rewardsService.deletePrize(deleting.id);
      setToast('ลบของรางวัลแล้ว');
      setDeleting(null);
      load();
    } catch (err) {
      setDeleteInUse(isApiError(err, 409));
      setDeleteError(toThaiRewardsError(err, 'ลบไม่สำเร็จ'));
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await rewardsService.updatePrize(deleting.id, { active: false });
      setToast('ปิดการแลกของรางวัลแล้ว');
      setDeleting(null);
      load();
    } catch (err) {
      setDeleteError(toThaiRewardsError(err, 'บันทึกไม่สำเร็จ'));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ p: { xs: 1.5, md: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            ของรางวัล
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={filter}
            onChange={(_, v) => v && setFilter(v)}
          >
            <ToggleButton value="all">ทั้งหมด</ToggleButton>
            <ToggleButton value="active">เปิดให้แลก</ToggleButton>
          </ToggleButtonGroup>
          <IconButton onClick={load} disabled={isLoading} title="รีเฟรช">
            <RefreshIcon />
          </IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            เพิ่มของรางวัล
          </Button>
        </Box>

        {loadError ? (
          <Alert severity="error">{loadError}</Alert>
        ) : isLoading && prizes.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : prizes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <CardGiftcardIcon sx={{ fontSize: 56, mb: 1 }} />
            <Typography>ยังไม่มีของรางวัล กด "เพิ่มของรางวัล" เพื่อเริ่มต้น</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {prizes.map((p) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
                <PrizeCard prize={p} onEdit={() => openEdit(p)} onDelete={() => openDelete(p)} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* ── Prize form ─────────────────────────────────────────────── */}
        <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editing ? 'แก้ไขของรางวัล' : 'เพิ่มของรางวัล'}</DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <Box sx={{ mt: 1, mb: 1 }}>
              <Box
                sx={{
                  width: '100%',
                  height: 180,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  border: '1px dashed',
                  borderColor: 'grey.400',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  mb: 1,
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                    <CloudUploadIcon sx={{ fontSize: 40, mb: 0.5 }} />
                    <Typography variant="body2">คลิกเพื่ออัปโหลดรูปภาพ</Typography>
                  </Box>
                )}
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              {imagePreview && (
                <Button size="small" color="error" onClick={handleRemoveImage}>
                  ลบรูปภาพ
                </Button>
              )}
            </Box>

            <TextField
              fullWidth
              required
              label="ชื่อของรางวัล"
              placeholder="เช่น รถจักรยานยนต์, ทองคำ 1 สลึง, เมล็ดพันธุ์, ปุ๋ยอินทรีย์"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              inputProps={{ maxLength: PRIZE_NAME_MAX_LENGTH }}
              margin="normal"
            />
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="รายละเอียด"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              inputProps={{ maxLength: PRIZE_DESCRIPTION_MAX_LENGTH }}
              margin="normal"
            />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              <TextField
                fullWidth
                required
                label="แต้มที่ใช้แลก"
                value={form.pointsCost}
                onChange={(e) => setForm({ ...form, pointsCost: e.target.value.replace(/[^\d]/g, '') })}
                error={pointsError}
                helperText={pointsError ? 'ต้องเป็นจำนวนเต็มมากกว่า 0' : ' '}
                inputProps={{ inputMode: 'numeric' }}
                InputProps={{ endAdornment: <InputAdornment position="end">แต้ม</InputAdornment> }}
                margin="normal"
              />
              <TextField
                fullWidth
                label="จำนวนคงเหลือ"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value.replace(/[^\d]/g, '') })}
                error={stockError}
                helperText="เว้นว่าง = ไม่จำกัด"
                inputProps={{ inputMode: 'numeric' }}
                margin="normal"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                label="ลำดับการแสดง"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                error={sortError}
                helperText="น้อยแสดงก่อน"
                sx={{ width: 160 }}
                margin="normal"
              />
              <FormControlLabel
                control={<Switch checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />}
                label={form.active ? 'เปิดให้แลก' : 'ปิดการแลก'}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} disabled={saving}>
              ยกเลิก
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={!canSave || saving}>
              {saving ? <CircularProgress size={20} /> : 'บันทึก'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Delete confirm ─────────────────────────────────────────── */}
        <Dialog open={!!deleting} onClose={() => !deleteBusy && setDeleting(null)} maxWidth="xs" fullWidth>
          <DialogTitle>ลบของรางวัล</DialogTitle>
          <DialogContent>
            {deleteError ? (
              <Alert severity={deleteInUse ? 'warning' : 'error'}>{deleteError}</Alert>
            ) : (
              <DialogContentText>ต้องการลบ "{deleting?.name}" ใช่หรือไม่?</DialogContentText>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleting(null)} disabled={deleteBusy}>
              ปิด
            </Button>
            {deleteInUse ? (
              deleting?.active && (
                <Button variant="contained" onClick={handleDeactivate} disabled={deleteBusy}>
                  ปิดการแลกแทน
                </Button>
              )
            ) : (
              <Button variant="contained" color="error" onClick={handleDelete} disabled={deleteBusy}>
                {deleteBusy ? <CircularProgress size={20} /> : 'ลบ'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <Snackbar
          open={!!toast}
          autoHideDuration={4000}
          onClose={() => setToast('')}
          message={toast}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Box>
    </Layout>
  );
};

export default PrizePage;
