import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Layout } from '@/shared/components/Layout';
import { useOrderHistory } from '@/modules/pos/hooks/useOrderHistory';
import { OrderDetailDialog } from '@/modules/pos/components/OrderDetailDialog';

const today = new Date().toISOString().split('T')[0];
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'รอชำระ',
  paid: 'ชำระแล้ว',
  failed: 'ล้มเหลว',
};

const PAYMENT_STATUS_COLOR: Record<
  string,
  'default' | 'success' | 'error' | 'warning'
> = {
  pending: 'warning',
  paid: 'success',
  failed: 'error',
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  open: 'เปิด',
  confirmed: 'ยืนยันแล้ว',
  cancelled: 'ยกเลิก',
};

const ORDER_STATUS_COLOR: Record<
  string,
  'default' | 'success' | 'info' | 'warning'
> = {
  open: 'info',
  confirmed: 'success',
  cancelled: 'default',
};

const METHOD_LABELS: Record<string, string> = {
  cash: 'เงินสด',
  qr: 'QR Code',
  card: 'บัตรเครดิต',
};

const POSOrderHistoryPage = () => {
  const [from, setFrom] = useState(sevenDaysAgo);
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  const {
    orders,
    isLoading,
    error,
    selectedOrder,
    selectedPayment,
    isDetailLoading,
    fetchOrders,
    openDetail,
    closeDetail,
  } = useOrderHistory();

  useEffect(() => {
    fetchOrders({ from, to, status, paymentStatus });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    fetchOrders({ from, to, status, paymentStatus });
  };

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          ประวัติการขาย
        </Typography>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <TextField
              label="จากวันที่"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="ถึงวันที่"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>สถานะคำสั่งซื้อ</InputLabel>
              <Select
                value={status}
                label="สถานะคำสั่งซื้อ"
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
                <MenuItem value="open">เปิด</MenuItem>
                <MenuItem value="confirmed">ยืนยันแล้ว</MenuItem>
                <MenuItem value="cancelled">ยกเลิก</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>สถานะชำระเงิน</InputLabel>
              <Select
                value={paymentStatus}
                label="สถานะชำระเงิน"
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
                <MenuItem value="pending">รอชำระ</MenuItem>
                <MenuItem value="paid">ชำระแล้ว</MenuItem>
                <MenuItem value="failed">ล้มเหลว</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={isLoading}
            >
              ค้นหา
            </Button>
          </Box>
        </Paper>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>วันที่/เวลา</TableCell>
                  <TableCell>เลขที่คำสั่งซื้อ</TableCell>
                  <TableCell align="center">รายการ</TableCell>
                  <TableCell align="right">ยอดสุทธิ</TableCell>
                  <TableCell align="center">วิธีชำระ</TableCell>
                  <TableCell align="center">สถานะชำระ</TableCell>
                  <TableCell align="center">สถานะคำสั่งซื้อ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                      sx={{ py: 4, color: 'text.secondary' }}
                    >
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow
                      key={order.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => openDetail(order)}
                    >
                      <TableCell>
                        {new Date(order.createdAt).toLocaleString('th-TH', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        #{order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell align="center">{order.items.length} รายการ</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        ฿{order.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="center">
                        {order.paymentMethod
                          ? (METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod)
                          : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={
                            PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus
                          }
                          color={PAYMENT_STATUS_COLOR[order.paymentStatus] ?? 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={ORDER_STATUS_LABEL[order.status] ?? order.status}
                          color={ORDER_STATUS_COLOR[order.status] ?? 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      <OrderDetailDialog
        order={selectedOrder}
        payment={selectedPayment}
        paymentLoading={isDetailLoading}
        onClose={closeDetail}
      />
    </Layout>
  );
};

export default POSOrderHistoryPage;
