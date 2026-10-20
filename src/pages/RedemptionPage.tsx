import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { format } from 'date-fns';
import { Layout } from '@/shared/components/Layout';
import { memberService } from '@/modules/member/services/member.service';
import { Member } from '@/modules/member/types';
import { rewardsService, toThaiRewardsError } from '@/modules/rewards/services/rewards.service';
import {
  Prize,
  REDEMPTION_NOTE_MAX_LENGTH,
  REDEMPTION_STATUS_COLOR,
  REDEMPTION_STATUS_LABEL,
  Redemption,
  RedemptionAction,
  RedemptionStatus,
} from '@/modules/rewards/types';

const SEARCH_DEBOUNCE_MS = 300;
const formatDateTime = (iso: string) => format(new Date(iso), 'dd/MM/yyyy HH:mm');
const formatPoints = (n: number) => n.toLocaleString('th-TH');

const useDebounced = <T,>(value: T, ms = SEARCH_DEBOUNCE_MS): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
};

interface TabDef {
  key: string;
  label: string;
  statuses: RedemptionStatus[];
}

const TABS: TabDef[] = [
  { key: 'requested', label: 'รออนุมัติ', statuses: ['requested'] },
  { key: 'approved', label: 'อนุมัติแล้ว', statuses: ['approved'] },
  { key: 'delivered', label: 'รับของแล้ว', statuses: ['delivered'] },
  { key: 'closed', label: 'ปฏิเสธ/ยกเลิก', statuses: ['rejected', 'cancelled'] },
];

const ACTION_INFO: Record<
  RedemptionAction,
  { label: string; title: string; color: 'primary' | 'success' | 'error' | 'inherit'; withNote: boolean }
> = {
  approve: { label: 'อนุมัติ', title: 'อนุมัติการแลกของรางวัล', color: 'primary', withNote: false },
  deliver: { label: 'ส่งมอบแล้ว', title: 'ยืนยันว่าสมาชิกรับของแล้ว', color: 'success', withNote: false },
  reject: { label: 'ปฏิเสธ', title: 'ปฏิเสธคำขอแลกของรางวัล', color: 'error', withNote: true },
  cancel: { label: 'ยกเลิก', title: 'ยกเลิกการแลกของรางวัล', color: 'inherit', withNote: true },
};

const ACTIONS_BY_STATUS: Record<RedemptionStatus, RedemptionAction[]> = {
  requested: ['approve', 'reject', 'cancel'],
  approved: ['deliver', 'cancel'],
  delivered: [],
  rejected: [],
  cancelled: [],
};

/** Cancelled from LINE by the member: decidedBy = 'line' */
const cancelledByMember = (r: Redemption) => r.status === 'cancelled' && r.decidedBy === 'line';

const statusLabel = (r: Redemption) => (cancelledByMember(r) ? 'สมาชิกยกเลิกเอง' : REDEMPTION_STATUS_LABEL[r.status]);

const requestedByLabel = (r: Redemption) =>
  r.requestedBy === 'line' ? <Chip size="small" color="success" label="LINE" /> : r.requestedBy || '-';

/** Member search (name / phone / shop) used by the counter-redemption dialog. */
const MemberSearch = ({ value, onChange }: { value: Member | null; onChange: (m: Member | null) => void }) => {
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
      value={value}
      onChange={(_, m) => onChange(m)}
      inputValue={input}
      onInputChange={(_, v) => setInput(v)}
      options={value && !options.some((o) => o.id === value.id) ? [value, ...options] : options}
      filterOptions={(x) => x}
      getOptionLabel={(m) => `${m.name} (${m.phone})`}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      loading={loading}
      noOptionsText={input.trim() ? 'ไม่พบสมาชิก' : 'พิมพ์ชื่อหรือเบอร์โทรเพื่อค้นหา'}
      renderOption={(props, m) => (
        <li {...props} key={m.id}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1 }}>
            <span>
              {m.name} <Typography component="span" variant="body2" color="text.secondary">({m.phone})</Typography>
            </span>
            <Typography variant="body2" color="primary" sx={{ whiteSpace: 'nowrap' }}>
              {formatPoints(m.points)} แต้ม
            </Typography>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="สมาชิก"
          placeholder="ค้นหาชื่อหรือเบอร์โทร"
          InputProps={{
            ...params.InputProps,
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

/** Staff redeems a prize for a member at the counter. */
const CounterRedeemDialog = ({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: (r: Redemption) => void;
}) => {
  const [member, setMember] = useState<Member | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [prizesLoading, setPrizesLoading] = useState(false);
  const [prizeId, setPrizeId] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [approve, setApprove] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMember(null);
    setPrizeId('');
    setNote('');
    setApprove(true);
    setConfirming(false);
    setError(null);
    setPrizesLoading(true);
    rewardsService
      .listPrizes(true)
      .then(setPrizes)
      .catch((err) => setError(toThaiRewardsError(err, 'โหลดรายการของรางวัลไม่สำเร็จ')))
      .finally(() => setPrizesLoading(false));
  }, [open]);

  // Refresh the balance from the server when a member is picked
  useEffect(() => {
    if (!member) return;
    let cancelled = false;
    memberService
      .getById(member.id)
      .then((m) => !cancelled && m.points !== member.points && setMember(m))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id]);

  const prize = prizes.find((p) => p.id === prizeId) ?? null;
  const balance = member?.points ?? 0;
  const notEnough = !!member && !!prize && prize.pointsCost > balance;
  const canSubmit = !!member && !!prize && !notEnough && prize.stock !== 0 && note.length <= REDEMPTION_NOTE_MAX_LENGTH;

  const handleSubmit = async () => {
    if (!member || !prize) return;
    setBusy(true);
    setError(null);
    try {
      const r = await rewardsService.createRedemption({
        memberId: member.id,
        prizeId: prize.id,
        note: note.trim() || undefined,
        approve,
      });
      onDone(r);
    } catch (err) {
      setError(toThaiRewardsError(err, 'แลกของรางวัลไม่สำเร็จ'));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>แลกของรางวัลที่หน้าร้าน</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {confirming && member && prize ? (
          <Box>
            <DialogContentText sx={{ mb: 1 }}>
              ยืนยันแลก <b>{prize.name}</b> ให้ <b>{member.name}</b> ({member.phone})
            </DialogContentText>
            <Typography>แต้มคงเหลือ: {formatPoints(balance)} แต้ม</Typography>
            <Typography color="error">ใช้: −{formatPoints(prize.pointsCost)} แต้ม</Typography>
            <Typography sx={{ fontWeight: 700 }}>
              คงเหลือหลังแลก: {formatPoints(balance - prize.pointsCost)} แต้ม
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              สถานะ: {approve ? 'อนุมัติแล้ว (รอส่งมอบ)' : 'รออนุมัติ'}
              {note.trim() && ` · หมายเหตุ: ${note.trim()}`}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <MemberSearch value={member} onChange={setMember} />
            {member && (
              <Alert severity="info" icon={false}>
                แต้มคงเหลือของ {member.name}: <b>{formatPoints(balance)}</b> แต้ม
              </Alert>
            )}
            <TextField
              select
              label="ของรางวัล"
              value={prizeId}
              onChange={(e) => setPrizeId(Number(e.target.value))}
              disabled={prizesLoading}
              helperText={
                prizesLoading
                  ? 'กำลังโหลด...'
                  : prizes.length === 0
                    ? 'ยังไม่มีของรางวัลที่เปิดให้แลก'
                    : notEnough
                      ? `แต้มไม่พอ (ขาดอีก ${formatPoints(prize!.pointsCost - balance)} แต้ม)`
                      : ' '
              }
              error={notEnough}
            >
              {prizes.map((p) => {
                const outOfStock = p.stock === 0;
                const tooExpensive = !!member && p.pointsCost > balance;
                return (
                  <MenuItem key={p.id} value={p.id} disabled={outOfStock}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                      <span>
                        {p.name}
                        {outOfStock && ' (หมด)'}
                        {p.stock !== null && p.stock > 0 && (
                          <Typography component="span" variant="body2" color="text.secondary">
                            {' '}
                            · เหลือ {formatPoints(p.stock)}
                          </Typography>
                        )}
                      </span>
                      <Typography component="span" color={tooExpensive ? 'error' : 'primary'}>
                        {formatPoints(p.pointsCost)} แต้ม
                      </Typography>
                    </Box>
                  </MenuItem>
                );
              })}
            </TextField>
            <TextField
              label="หมายเหตุ"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              inputProps={{ maxLength: REDEMPTION_NOTE_MAX_LENGTH }}
            />
            <FormControlLabel
              control={<Checkbox checked={approve} onChange={(e) => setApprove(e.target.checked)} />}
              label="อนุมัติทันที (ไม่ต้องรออนุมัติ)"
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {confirming ? (
          <>
            <Button onClick={() => setConfirming(false)} disabled={busy}>
              ย้อนกลับ
            </Button>
            <Button variant="contained" onClick={handleSubmit} disabled={busy}>
              {busy ? <CircularProgress size={20} /> : 'ยืนยันแลก'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>ยกเลิก</Button>
            <Button variant="contained" onClick={() => setConfirming(true)} disabled={!canSubmit}>
              ถัดไป
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

const RedemptionPage = () => {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [items, setItems] = useState<Redemption[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<RedemptionStatus, number> | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [counterOpen, setCounterOpen] = useState(false);

  // action confirm
  const [pending, setPending] = useState<{ r: Redemption; action: RedemptionAction } | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await rewardsService.listRedemptions({
        statuses: TABS[tab].statuses,
        search: debouncedSearch,
        page: page + 1,
        pageSize,
      });
      setItems(data.items);
      setTotal(data.total);
      setCounts(data.counts);
    } catch (err) {
      setLoadError(toThaiRewardsError(err, 'เกิดข้อผิดพลาดในการโหลดข้อมูล'));
    } finally {
      setIsLoading(false);
    }
  }, [tab, debouncedSearch, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const tabCount = useMemo(
    () => (t: TabDef) => (counts ? t.statuses.reduce((sum, s) => sum + (counts[s] ?? 0), 0) : 0),
    [counts],
  );

  const openAction = (r: Redemption, action: RedemptionAction) => {
    setPending({ r, action });
    setActionNote('');
    setActionError(null);
  };

  const runAction = async () => {
    if (!pending) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const info = ACTION_INFO[pending.action];
      await rewardsService.act(pending.r.id, pending.action, info.withNote ? actionNote : undefined);
      setToast(
        info.withNote
          ? `${info.label}แล้ว คืน ${formatPoints(pending.r.pointsCost)} แต้มให้ ${pending.r.member.name}`
          : `${info.label}เรียบร้อย`,
      );
      setPending(null);
      load();
    } catch (err) {
      setActionError(toThaiRewardsError(err, 'ทำรายการไม่สำเร็จ'));
    } finally {
      setActionBusy(false);
    }
  };

  const showDecision = tab !== 0;

  return (
    <Layout>
      <Box sx={{ p: { xs: 1.5, md: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            แลกแต้ม
          </Typography>
          <Button variant="contained" startIcon={<StorefrontIcon />} onClick={() => setCounterOpen(true)}>
            แลกที่หน้าร้าน
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              setPage(0);
            }}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ flexGrow: 1 }}
          >
            {TABS.map((t, i) => (
              <Tab
                key={t.key}
                label={
                  <Badge
                    color={i === 0 ? 'warning' : 'default'}
                    badgeContent={tabCount(t)}
                    max={999}
                    showZero={false}
                    sx={{ '& .MuiBadge-badge': { right: -14, top: 2 } }}
                  >
                    {t.label}
                  </Badge>
                }
                sx={{ pr: 4 }}
              />
            ))}
          </Tabs>
          <TextField
            size="small"
            placeholder="ค้นหาสมาชิก (ชื่อ/เบอร์) หรือของรางวัล"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: '100%', sm: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <IconButton onClick={load} disabled={isLoading} title="รีเฟรช">
            <RefreshIcon />
          </IconButton>
        </Box>

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
                    <TableCell sx={{ fontWeight: 700 }}>วันที่ขอ</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>สมาชิก</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>ของรางวัล</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      แต้ม
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>สถานะ</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>ขอโดย</TableCell>
                    {showDecision && <TableCell sx={{ fontWeight: 700 }}>ดำเนินการโดย</TableCell>}
                    <TableCell sx={{ fontWeight: 700 }}>หมายเหตุ</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      จัดการ
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 && !isLoading ? (
                    <TableRow>
                      <TableCell colSpan={showDecision ? 9 : 8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        ไม่มีรายการ
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(r.createdAt)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {r.member.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {r.member.phone} · คงเหลือ {formatPoints(r.member.points)} แต้ม
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar variant="rounded" src={r.prizeImageUrl ?? undefined} sx={{ width: 36, height: 36 }}>
                              <CardGiftcardIcon fontSize="small" />
                            </Avatar>
                            <span>{r.prizeName}</span>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          {formatPoints(r.pointsCost)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={REDEMPTION_STATUS_COLOR[r.status]}
                            label={statusLabel(r)}
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 180, wordBreak: 'break-all' }}>{requestedByLabel(r)}</TableCell>
                        {showDecision && (
                          <TableCell sx={{ maxWidth: 200 }}>
                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                              {r.decidedBy === 'line' ? 'สมาชิก (LINE)' : r.decidedBy || '-'}
                            </Typography>
                            {r.decidedAt && (
                              <Typography variant="caption" color="text.secondary" component="div">
                                {formatDateTime(r.decidedAt)}
                              </Typography>
                            )}
                            {r.deliveredAt && (
                              <Typography variant="caption" color="success.main" component="div">
                                รับของ {formatDateTime(r.deliveredAt)}
                              </Typography>
                            )}
                          </TableCell>
                        )}
                        <TableCell sx={{ maxWidth: 240, whiteSpace: 'pre-line' }}>{r.note || '-'}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {ACTIONS_BY_STATUS[r.status].map((a) => (
                              <Button
                                key={a}
                                size="small"
                                variant={a === 'approve' || a === 'deliver' ? 'contained' : 'outlined'}
                                color={ACTION_INFO[a].color}
                                onClick={() => openAction(r, a)}
                                sx={{ whiteSpace: 'nowrap' }}
                              >
                                {ACTION_INFO[a].label}
                              </Button>
                            ))}
                          </Box>
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
              onRowsPerPageChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage="ต่อหน้า:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} จาก ${count}`}
            />
          </Paper>
        )}

        {/* ── Action confirm ─────────────────────────────────────────── */}
        <Dialog open={!!pending} onClose={() => !actionBusy && setPending(null)} maxWidth="xs" fullWidth>
          {pending && (
            <>
              <DialogTitle>{ACTION_INFO[pending.action].title}</DialogTitle>
              <DialogContent>
                {actionError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {actionError}
                  </Alert>
                )}
                <DialogContentText>
                  {pending.r.member.name} ({pending.r.member.phone})
                  <br />
                  {pending.r.prizeName} · {formatPoints(pending.r.pointsCost)} แต้ม
                </DialogContentText>
                {ACTION_INFO[pending.action].withNote && (
                  <>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      ระบบจะคืน {formatPoints(pending.r.pointsCost)} แต้มให้สมาชิก และคืนจำนวนของรางวัลเข้าสต็อก
                    </Alert>
                    <TextField
                      fullWidth
                      label="เหตุผล / หมายเหตุ"
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      inputProps={{ maxLength: REDEMPTION_NOTE_MAX_LENGTH }}
                      sx={{ mt: 2 }}
                    />
                  </>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setPending(null)} disabled={actionBusy}>
                  ปิด
                </Button>
                <Button
                  variant="contained"
                  color={ACTION_INFO[pending.action].color === 'inherit' ? 'error' : ACTION_INFO[pending.action].color}
                  onClick={runAction}
                  disabled={actionBusy}
                >
                  {actionBusy ? <CircularProgress size={20} /> : `ยืนยัน${ACTION_INFO[pending.action].label}`}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        <CounterRedeemDialog
          open={counterOpen}
          onClose={() => setCounterOpen(false)}
          onDone={(r) => {
            setCounterOpen(false);
            setToast(`แลก ${r.prizeName} ให้ ${r.member.name} แล้ว (คงเหลือ ${formatPoints(r.member.points)} แต้ม)`);
            const target = TABS.findIndex((t) => t.statuses.includes(r.status));
            if (target >= 0 && target !== tab) {
              setTab(target);
              setPage(0);
            } else {
              load();
            }
          }}
        />

        <Snackbar
          open={!!toast}
          autoHideDuration={5000}
          onClose={() => setToast('')}
          message={toast}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Box>
    </Layout>
  );
};

export default RedemptionPage;
