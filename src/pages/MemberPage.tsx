import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import { Layout } from '@/shared/components/Layout';
import { useMembers } from '@/modules/member/hooks/useMembers';
import { memberService, toThaiMemberError } from '@/modules/member/services/member.service';
import { CUSTOMER_TYPE_LABEL, CustomerType, Member, MemberPayload } from '@/modules/member/types';
import { MemberFormDialog } from '@/modules/member/components/MemberFormDialog';
import { MemberDetailDialog } from '@/modules/member/components/MemberDetailDialog';
import { formatDate } from '@/shared/utils/date.utils';

const MemberPage = () => {
  const {
    members,
    total,
    isLoading,
    loadError,
    search,
    setSearch,
    type,
    setType,
    page,
    setPage,
    pageSize,
    setPageSize,
    refresh,
  } = useMembers();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<Member | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState('');

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (member: Member) => {
    setEditing(member);
    setFormOpen(true);
  };

  const handleSubmit = async (data: MemberPayload) => {
    if (editing) {
      await memberService.update(editing.id, data);
      setToast('บันทึกข้อมูลสมาชิกแล้ว');
    } else {
      await memberService.create(data);
      setToast('เพิ่มสมาชิกแล้ว');
    }
    refresh();
  };

  const openDelete = (member: Member) => {
    setDeleting(member);
    setDeleteError('');
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      const result = await memberService.delete(deleting.id);
      setDeleting(null);
      setToast(
        result.lineLinked
          ? 'ลบสมาชิกแล้ว (ริชเมนู LINE ของสมาชิกไม่ได้ถูกเปลี่ยน)'
          : 'ลบสมาชิกแล้ว',
      );
      refresh();
    } catch (err) {
      setDeleteError(toThaiMemberError(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ p: { xs: 1.5, md: 2 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            สมาชิก
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            เพิ่มสมาชิก
          </Button>
        </Box>

        {/* Toolbar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="ค้นหาชื่อ, เบอร์โทร หรือชื่อร้าน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ maxWidth: 360, flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <ToggleButtonGroup
            exclusive
            size="small"
            value={type}
            onChange={(_, v: CustomerType | '' | null) => v !== null && setType(v)}
          >
            <ToggleButton value="">ทั้งหมด</ToggleButton>
            <ToggleButton value="person">บุคคล</ToggleButton>
            <ToggleButton value="shop">ร้านค้า</ToggleButton>
          </ToggleButtonGroup>
          <IconButton onClick={refresh} disabled={isLoading} title="รีเฟรช">
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Table */}
        {loadError ? (
          <Alert severity="error">{loadError}</Alert>
        ) : (
          <Paper sx={{ position: 'relative' }}>
            {isLoading && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'rgba(255,255,255,0.6)',
                  zIndex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>ชื่อ</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>โทรศัพท์</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>ประเภท</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      แต้ม
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>บันทึกล่าสุด</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>วันที่สมัคร</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      จัดการ
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.length === 0 && !isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        {search || type ? 'ไม่พบสมาชิกที่ตรงกับการค้นหา' : 'ยังไม่มีสมาชิก'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((m) => (
                      <TableRow key={m.id} hover sx={{ cursor: 'pointer' }} onClick={() => setDetailId(m.id)}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {m.name}
                          </Typography>
                          {m.customerType === 'shop' && m.shopName && (
                            <Typography variant="caption" color="text.secondary">
                              {m.shopName}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{m.phone}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <Chip
                              size="small"
                              label={CUSTOMER_TYPE_LABEL[m.customerType]}
                              color={m.customerType === 'shop' ? 'secondary' : 'default'}
                            />
                            {m.lineLinked && (
                              <Chip
                                size="small"
                                label="LINE"
                                color="success"
                                variant="outlined"
                                title={m.lineDisplayName ?? undefined}
                              />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{m.points.toLocaleString('th-TH')}</TableCell>
                        <TableCell sx={{ maxWidth: 240 }}>
                          {m.latestNote ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <StickyNote2OutlinedIcon fontSize="small" color="action" />
                              <Typography variant="body2" noWrap title={m.latestNote}>
                                {m.latestNote}
                              </Typography>
                              {m.noteCount > 1 && (
                                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                  +{m.noteCount - 1}
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.disabled">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(new Date(m.createdAt))}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                          <IconButton size="small" title="แก้ไข" onClick={() => openEdit(m)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" title="ลบ" color="error" onClick={() => openDelete(m)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(e) => setPageSize(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage="ต่อหน้า:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} จาก ${count}`}
            />
          </Paper>
        )}

        <MemberFormDialog
          open={formOpen}
          member={editing}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />

        <MemberDetailDialog
          memberId={detailId}
          onClose={() => setDetailId(null)}
          onEdit={(m) => {
            setDetailId(null);
            openEdit(m);
          }}
          onNotesChanged={refresh}
        />

        {/* Delete confirm */}
        <Dialog open={!!deleting} onClose={deleteBusy ? undefined : () => setDeleting(null)} maxWidth="xs" fullWidth>
          <DialogTitle>ลบสมาชิก</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ต้องการลบสมาชิก <b>{deleting?.name}</b> ({deleting?.phone}) ใช่หรือไม่? บันทึกของพนักงานทั้งหมดจะถูกลบด้วย
            </DialogContentText>
            {deleting?.lineLinked && (
              <Alert severity="info" sx={{ mt: 2 }}>
                สมาชิกนี้เชื่อมต่อ LINE อยู่ การลบจะไม่เปลี่ยนริชเมนู LINE ของสมาชิก
              </Alert>
            )}
            {deleteError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {deleteError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleting(null)} disabled={deleteBusy}>
              ยกเลิก
            </Button>
            <Button color="error" variant="contained" onClick={handleDelete} disabled={deleteBusy || !!deleteError}>
              {deleteBusy ? <CircularProgress size={20} /> : 'ลบ'}
            </Button>
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

export default MemberPage;
