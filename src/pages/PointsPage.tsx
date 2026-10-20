import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
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
  Typography,
} from '@mui/material';
import ExposureIcon from '@mui/icons-material/Exposure';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import { Layout } from '@/shared/components/Layout';
import { memberService, toThaiMemberError } from '@/modules/member/services/member.service';
import { Member } from '@/modules/member/types';
import { pointsService, toThaiPointsError } from '@/modules/points/services/points.service';
import { AdjustPointsDialog } from '@/modules/points/components/AdjustPointsDialog';
import { MemberPicker } from '@/modules/points/components/MemberPicker';
import { useDebounced } from '@/shared/hooks/useDebounced';
import {
  AdjustPointsResult,
  POINT_TRANSACTION_TYPE_LABEL,
  PointTransaction,
} from '@/modules/points/types';

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

/** Balance, adjust button and history for one member. */
const MemberPointsPanel = ({
  member,
  refreshKey,
  onAdjust,
}: {
  member: Member;
  /** Changes after every adjustment so the balance and history reload. */
  refreshKey: number;
  onAdjust: () => void;
}) => {
  const [balance, setBalance] = useState(member.points);
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
  }, [load, refreshKey]);

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

          <Box sx={{ display: 'flex', alignItems: 'center', alignSelf: 'center' }}>
            <Button variant="outlined" size="large" startIcon={<ExposureIcon />} onClick={onAdjust}>
              เพิ่ม/ลดแต้ม
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

    </>
  );
};

/** Recent adjustments across all members, shown when no member is selected. */
const RecentAdjustments = ({
  onSelectMember,
  refreshKey,
}: {
  onSelectMember: (memberId: string) => void;
  refreshKey: number;
}) => {
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
  }, [load, refreshKey]);

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
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdjusted = (target: Member, result: AdjustPointsResult) => {
    const delta = result.transaction.delta;
    setAdjustOpen(false);
    setToast(
      `${delta > 0 ? 'เพิ่ม' : 'ลด'} ${formatPoints(Math.abs(delta))} แต้มให้ ${target.name} แล้ว — คงเหลือ ${formatPoints(result.balance)} แต้ม`,
    );
    // Show the member that was just adjusted, with the new balance
    setMember({ ...target, points: result.balance });
    if (memberId !== target.id) selectMember(target.id);
    setRefreshKey((k) => k + 1);
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Typography variant="h4" component="h1">
            แต้มสะสม
          </Typography>
          <Button variant="contained" size="large" startIcon={<ExposureIcon />} onClick={() => setAdjustOpen(true)}>
            เพิ่ม/ลดแต้ม
          </Button>
        </Box>

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
          <MemberPointsPanel
            key={member.id}
            member={member}
            refreshKey={refreshKey}
            onAdjust={() => setAdjustOpen(true)}
          />
        ) : !memberId ? (
          <RecentAdjustments onSelectMember={selectMember} refreshKey={refreshKey} />
        ) : (
          !memberError && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )
        )}

        <AdjustPointsDialog
          open={adjustOpen}
          onClose={() => setAdjustOpen(false)}
          initialMember={memberId && member?.id === memberId ? member : null}
          onDone={handleAdjusted}
        />

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
