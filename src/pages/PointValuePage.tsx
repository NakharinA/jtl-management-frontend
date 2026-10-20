import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import { Layout } from '@/shared/components/Layout';
import {
  pointSettingsService,
  toThaiPointSettingsError,
} from '@/modules/points/services/point-settings.service';
import { PointSummary } from '@/modules/points/types';

const fmtNumber = (n: number, digits = 2) =>
  n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: digits });
const fmtBaht = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { month: 'long', year: 'numeric', timeZone: 'Asia/Bangkok' });

const StatCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <Paper sx={{ p: 2, flex: '1 1 200px' }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h5" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
      {value}
    </Typography>
    {sub && (
      <Typography variant="caption" color="text.secondary">
        {sub}
      </Typography>
    )}
  </Paper>
);

const PointValuePage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PointSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await pointSettingsService.summary());
    } catch (e) {
      setError(toThaiPointSettingsError(e, 'โหลดข้อมูลไม่สำเร็จ'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>
            มูลค่าแต้ม
          </Typography>
          <IconButton onClick={load} aria-label="โหลดใหม่">
            <RefreshIcon />
          </IconButton>
          <Button startIcon={<SettingsIcon />} variant="outlined" onClick={() => navigate('/points/settings')}>
            ตั้งค่าแต้ม
          </Button>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {loading && !data && <CircularProgress />}

        {data && (
          <>
            <Paper sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={800} color="primary.main">
                1 แต้ม = {fmtNumber(data.pointValueBaht, 4)} บาท
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                ต้นทุนของรางวัลที่ร้านจ่ายต่อ 1 แต้ม · แต้มไม่มีวันหมดอายุ
                {data.shopCustomersEarn ? ' · ลูกค้าร้านค้าได้แต้มด้วย' : ' · ให้แต้มเฉพาะลูกค้าทั่วไป'}
              </Typography>
            </Paper>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <StatCard
                label="แต้มคงค้างของสมาชิกทั้งหมด"
                value={`${fmtNumber(data.outstandingPoints, 0)} แต้ม`}
                sub={`มูลค่า ≈ ${fmtBaht(data.outstandingValueBaht)} บาท`}
              />
              <StatCard
                label={`แต้มที่ให้ไป (${monthLabel(data.month.start)})`}
                value={`${fmtNumber(data.month.issued, 0)} แต้ม`}
                sub={`จากการซื้อ ${fmtNumber(data.month.issuedPurchase, 0)} · เพิ่มเอง ${fmtNumber(data.month.issuedManual, 0)} · ≈ ${fmtBaht(data.month.issued * data.pointValueBaht)} บาท`}
              />
              <StatCard
                label={`แต้มที่แลกรางวัล (${monthLabel(data.month.start)})`}
                value={`${fmtNumber(data.month.redeemed, 0)} แต้ม`}
                sub={`≈ ${fmtBaht(data.month.redeemed * data.pointValueBaht)} บาท`}
              />
            </Box>

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                ซื้อเท่าไรได้ 1 แต้ม
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                เฉลี่ยจากสินค้าในกลุ่มที่ราคาขายปลีก
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>กลุ่ม</TableCell>
                      <TableCell align="right">สินค้า</TableCell>
                      <TableCell align="right">คืนกำไร</TableCell>
                      <TableCell>ซื้อประมาณ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.groups.map((g) => (
                      <TableRow key={g.id} sx={{ opacity: g.active ? 1 : 0.5 }}>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {g.name}
                          {!g.active && <Chip label="ปิดอยู่" size="small" sx={{ ml: 1 }} />}
                        </TableCell>
                        <TableCell align="right">{g.productCount}</TableCell>
                        <TableCell align="right">{fmtNumber(g.earnSharePercent)}%</TableCell>
                        <TableCell>
                          {g.avgBahtPerPoint !== null ? (
                            <Typography variant="body2" fontWeight={600}>
                              ซื้อ ~{fmtNumber(Math.round(g.avgBahtPerPoint), 0)} บาท ได้ 1 แต้ม
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              ยังไม่มีสินค้าที่ได้แต้ม
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
      </Box>
    </Layout>
  );
};

export default PointValuePage;
