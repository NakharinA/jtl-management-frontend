import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
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
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import { Layout } from '@/shared/components/Layout';
import { memberService, toThaiMemberError } from '@/modules/member/services/member.service';
import { Member } from '@/modules/member/types';
import { pointsService, toThaiPointsError } from '@/modules/points/services/points.service';
import {
  MAX_POINT_DELTA,
  POINT_REASON_MAX_LENGTH,
  POINT_TRANSACTION_TYPE_LABEL,
  PointTransaction,
} from '@/modules/points/types';

const SEARCH_DEBOUNCE_MS = 300;

const formatDateTime = (iso: string) => format(new Date(iso), 'dd/MM/yyyy HH:mm');
const formatPoints = (n: number) => n.toLocaleString('th-TH');

const DeltaCell = ({ delta }: { delta: number }) => (
  <Typography
    variant="body2"
    sx={{ fontWeight: 600, color: delta > 0 ? 'success.main' : 'error.main', whiteSpace: 'nowrap' }}
  >
    {delta > 0 ? '+' : '−'}
    {formatPoints(Math.abs(delta))}
  </Typography>
);

/** Transaction type label (ซื้อสินค้า / แลกของรางวัล / ...) followed by the reason. */
const ReasonCell = ({ t }: { t: PointTransaction }) => (
  <>
    {t.type && <Chip size="small" variant="outlined" label={POINT_TRANSACTION_TYPE_LABEL[t.type] ?? t.type} sx={{ mr: 1 }} />}
    {t.reason || (!t.type && <Dash />)}
  </>
);

const useDebounced = <T,>(value: T, ms = SEARCH_DEBOUNCE_MS): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
};

/** Search box that looks members up by name / phone / shop name. */
const MemberPicker = ({ value, onChange }: { value: Member | null; onChange: (m: Member | null) => void }) => {
  const [input, setInput] = useState('');
  const debouncedInput = useDebounced(input);
  const [options, setOptions] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const search = debouncedInput.trim();
    if (!search) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    memberService
      .list({ search, page: 1, pageSize: 10 })
      .then((res) => !cancelled && setOptions(res.items))
      .catch(() => !cancelled && setOptions([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedInput]);

  return (
    <Autocomplete
      sx={{ maxWidth: 420, flexGrow: 1 }}
      size="small"
      value={value}
      options={value && !options.some((o) => o.id === value.id) ? [value, ...options] : options}
      filterOptions={(x) => x}
      getOptionLabel={(m) => `${m.name} (${m.phone})`}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      loading={loading}
      onChange={(_, m) => onChange(m)}
      inputValue={input}
      onInputChange={(_, v) => setInput(v)}
      noOptionsText={input.trim() ? 'ไม่พบสมาชิก' : 'พิมพ์ชื่อหรือเบอร์โทรเพื่อค้นหา'}
      loadingText="กำลังค้นหา..."
      renderOption={(props, m) => (
        <li {...props} key={m.id}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
            <Box>
              <Typography variant="body2">{m.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {m.phone}
                {m.shopName ? ` · ${m.shopName}` : ''}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              {formatPoints(m.points)} แต้ม
            </Typography>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="ค้นหาสมาชิก: ชื่อ, เบอร์โทร หรือชื่อร้าน..."
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {loading && <CircularProgress size={18} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

/** Balance, adjust form and history for one member. */
const MemberPointsPanel = ({ member, onAdjusted }: { member: Member; onAdjusted: (msg: string) => void }) => {
  const [balance, setBalance] = useState(member.points);
  const [items, setItems] = useState<PointTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await pointsService.memberHistory(member.id, page + 1, pageSize);
      setItems(data.items);
      setTotal(data.total);
      setBalance(data.balance);
    } catch (err) {
      setLoadError(toThaiPointsError(err, 'เกิดข้อผิดพลาดในการโหลดประวัติแต้ม'));
    } finally {
      setIsLoading(false);
    }
  }, [member.id, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const amountNum = Number(amount);
  const amountValid = /^\d+$/.test(amount) && amountNum > 0 && amountNum <= MAX_POINT_DELTA;
  const delta = mode === 'add' ? amountNum : -amountNum;
  const balanceAfter = balance + delta;
  let amountError = '';
  if (amount !== '' && !amountValid) {
    amountError = `กรุณาระบุจำนวนเต็ม 1 – ${formatPoints(MAX_POINT_DELTA)}`;
  } else if (amountValid && balanceAfter < 0) {
    amountError = `แต้มไม่พอ (คงเหลือ ${formatPoints(balance)} แต้ม)`;
  }
  const canSubmit = amountValid && !amountError && reason.length <= POINT_REASON_MAX_LENGTH;

  const handleConfirm = async () => {
    setBusy(true);
    setSubmitError('');
    try {
      const result = await pointsService.adjust(member.id, delta, reason);
      setBalance(result.balance);
      setConfirmOpen(false);
      setAmount('');
      setReason('');
      onAdjusted(
        `${mode === 'add' ? 'เพิ่ม' : 'ลด'} ${formatPoints(amountNum)} แต้มแล้ว — คงเหลือ ${formatPoints(result.balance)} แต้ม`,
      );
      if (page === 0) load();
      else setPage(0);
    } catch (err) {
      setSubmitError(toThaiPointsError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: 200 }}>
            <Typography variant="h6">{member.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {member.phone}
              {member.shopName ? ` · ${member.shopName}` : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              แต้มคงเหลือ
            </Typography>
            <Typography variant="h3" color="primary" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              {formatPoints(balance)}
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) {
                setSubmitError('');
                setConfirmOpen(true);
              }
            }}
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, maxWidth: 420 }}
          >
            <ToggleButtonGroup
              exclusive
              size="small"
              value={mode}
              onChange={(_, v: 'add' | 'remove' | null) => v && setMode(v)}
            >
              <ToggleButton value="add" color="success" sx={{ flex: 1 }}>
                เพิ่มแต้ม
              </ToggleButton>
              <ToggleButton value="remove" color="error" sx={{ flex: 1 }}>
                ลดแต้ม
              </ToggleButton>
            </ToggleButtonGroup>
            <TextField
              label="จำนวนแต้ม"
              size="small"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
              inputProps={{ inputMode: 'numeric' }}
              error={!!amountError}
              helperText={
                amountError ||
                (amountValid ? `คงเหลือหลังปรับ: ${formatPoints(balanceAfter)} แต้ม` : ' ')
              }
            />
            <TextField
              label="เหตุผล (ไม่บังคับ)"
              size="small"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              inputProps={{ maxLength: POINT_REASON_MAX_LENGTH }}
              helperText={`${reason.length}/${POINT_REASON_MAX_LENGTH}`}
            />
            <Button type="submit" variant="contained" color={mode === 'add' ? 'success' : 'error'} disabled={!canSubmit}>
              {mode === 'add' ? 'เพิ่มแต้ม' : 'ลดแต้ม'}
            </Button>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6">ประวัติแต้ม</Typography>
        <IconButton onClick={load} disabled={isLoading} title="รีเฟรช">
          <RefreshIcon />
        </IconButton>
      </Box>
      {loadError ? (
        <Alert severity="error">{loadError}</Alert>
      ) : (
        <Paper sx={{ position: 'relative' }}>
          {isLoading && <LoadingOverlay />}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>วันที่</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    แต้ม
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    คงเหลือ
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>เหตุผล</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>โดย</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 && !isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      ยังไม่มีประวัติแต้ม
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(t.createdAt)}</TableCell>
                      <TableCell align="right">
                        <DeltaCell delta={t.delta} />
                      </TableCell>
                      <TableCell align="right">{formatPoints(t.balanceAfter)}</TableCell>
                      <TableCell sx={{ maxWidth: 320 }}><ReasonCell t={t} /></TableCell>
                      <TableCell>{t.createdBy || <Dash />}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Pagination
            total={total}
            page={page}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(s) => {
              setPageSize(s);
              setPage(0);
            }}
          />
        </Paper>
      )}

      <Dialog open={confirmOpen} onClose={busy ? undefined : () => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{mode === 'add' ? 'ยืนยันการเพิ่มแต้ม' : 'ยืนยันการลดแต้ม'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {mode === 'add' ? 'เพิ่ม' : 'ลด'} <b>{formatPoints(amountNum)}</b> แต้ม {mode === 'add' ? 'ให้' : 'ของ'}{' '}
            <b>{member.name}</b> ({member.phone})
          </DialogContentText>
          <DialogContentText sx={{ mt: 1 }}>
            แต้มคงเหลือ: {formatPoints(balance)} → <b>{formatPoints(balanceAfter)}</b>
          </DialogContentText>
          {reason.trim() && <DialogContentText sx={{ mt: 1 }}>เหตุผล: {reason.trim()}</DialogContentText>}
          {submitError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {submitError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={busy}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            color={mode === 'add' ? 'success' : 'error'}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? <CircularProgress size={20} /> : 'ยืนยัน'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/** Recent adjustments across all members, shown when no member is selected. */
const RecentAdjustments = ({ onSelectMember }: { onSelectMember: (memberId: string) => void }) => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [items, setItems] = useState<PointTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await pointsService.recent(debouncedSearch, page + 1, pageSize);
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setLoadError(toThaiPointsError(err, 'เกิดข้อผิดพลาดในการโหลดข้อมูล'));
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          รายการปรับแต้มล่าสุด
        </Typography>
        <TextField
          placeholder="กรองตามชื่อหรือเบอร์โทร..."
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          sx={{ width: 260 }}
        />
        <IconButton onClick={load} disabled={isLoading} title="รีเฟรช">
          <RefreshIcon />
        </IconButton>
      </Box>
      {loadError ? (
        <Alert severity="error">{loadError}</Alert>
      ) : (
        <Paper sx={{ position: 'relative' }}>
          {isLoading && <LoadingOverlay />}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>วันที่</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>สมาชิก</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    แต้ม
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    คงเหลือ
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>เหตุผล</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>โดย</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 && !isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      {search ? 'ไม่พบรายการที่ตรงกับการค้นหา' : 'ยังไม่มีการปรับแต้ม'}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((t) => (
                    <TableRow key={t.id} hover sx={{ cursor: 'pointer' }} onClick={() => onSelectMember(t.memberId)}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(t.createdAt)}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{t.member?.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.member?.phone}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <DeltaCell delta={t.delta} />
                      </TableCell>
                      <TableCell align="right">{formatPoints(t.balanceAfter)}</TableCell>
                      <TableCell sx={{ maxWidth: 280 }}><ReasonCell t={t} /></TableCell>
                      <TableCell>{t.createdBy || <Dash />}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Pagination
            total={total}
            page={page}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(s) => {
              setPageSize(s);
              setPage(0);
            }}
          />
        </Paper>
      )}
    </>
  );
};

const Dash = () => (
  <Typography component="span" variant="body2" color="text.disabled">
    -
  </Typography>
);

const LoadingOverlay = () => (
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
);

const Pagination = ({
  total,
  page,
  pageSize,
  onPage,
  onPageSize,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}) => (
  <TablePagination
    component="div"
    count={total}
    page={page}
    onPageChange={(_, p) => onPage(p)}
    rowsPerPage={pageSize}
    onRowsPerPageChange={(e) => onPageSize(parseInt(e.target.value, 10))}
    rowsPerPageOptions={[10, 25, 50]}
    labelRowsPerPage="ต่อหน้า:"
    labelDisplayedRows={({ from, to, count }) => `${from}–${to} จาก ${count}`}
  />
);

const PointsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const memberId = searchParams.get('memberId');
  const [member, setMember] = useState<Member | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const selectMember = (id: string | null) => {
    setSearchParams(id ? { memberId: id } : {});
  };

  useEffect(() => {
    if (!memberId) {
      setMember(null);
      setMemberError(null);
      return;
    }
    if (member?.id === memberId) return;
    let cancelled = false;
    setMemberError(null);
    memberService
      .getById(memberId)
      .then((m) => !cancelled && setMember(m))
      .catch((err) => {
        if (cancelled) return;
        setMember(null);
        setMemberError(toThaiMemberError(err, 'ไม่พบสมาชิก'));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  return (
    <Layout>
      <Box sx={{ p: { xs: 1.5, md: 2 } }}>
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
          แต้มสะสม
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <MemberPicker value={member} onChange={(m) => selectMember(m?.id ?? null)} />
          {memberId && (
            <Chip label="ดูรายการทั้งหมด" onDelete={() => selectMember(null)} deleteIcon={<CloseIcon />} />
          )}
        </Box>

        {memberError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {memberError}
          </Alert>
        )}

        {memberId && member?.id === memberId ? (
          <MemberPointsPanel key={member.id} member={member} onAdjusted={setToast} />
        ) : !memberId ? (
          <RecentAdjustments onSelectMember={selectMember} />
        ) : (
          !memberError && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )
        )}

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

export default PointsPage;
