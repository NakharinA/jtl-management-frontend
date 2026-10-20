import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
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
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Layout } from '@/shared/components/Layout';
import { consumerService } from '@/modules/pos/services/consumer.service';
import { Consumer } from '@/modules/pos/types';
import { formatDate } from '@/shared/utils/date.utils';

const POSConsumerPage = () => {
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Search + pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Register dialog
  const [registerOpen, setRegisterOpen] = useState(false);
  const [regPhone, setRegPhone] = useState('');
  const [regName, setRegName] = useState('');
  const [regError, setRegError] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);

  const loadConsumers = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await consumerService.getAll();
      setConsumers(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConsumers();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return consumers;
    return consumers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q),
    );
  }, [consumers, searchQuery]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleOpenRegister = () => {
    setRegPhone('');
    setRegName('');
    setRegError('');
    setRegisterOpen(true);
  };

  const handleRegister = async () => {
    if (!regPhone.trim()) {
      setRegError('กรุณาระบุเบอร์โทรศัพท์');
      return;
    }
    if (!regName.trim()) {
      setRegError('กรุณาระบุชื่อ');
      return;
    }
    setRegSubmitting(true);
    setRegError('');
    try {
      await consumerService.register(regPhone.trim(), regName.trim());
      setRegisterOpen(false);
      loadConsumers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('409') || msg.toLowerCase().includes('already')) {
        setRegError('เบอร์โทรศัพท์นี้ลงทะเบียนแล้ว');
      } else {
        setRegError(msg || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } finally {
      setRegSubmitting(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ p: { xs: 1.5, md: 2 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            ผู้บริโภค
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenRegister}
          >
            ลงทะเบียน
          </Button>
        </Box>

        {/* Toolbar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <TextField
            placeholder="ค้นหาชื่อหรือเบอร์โทรศัพท์..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
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
          <IconButton onClick={loadConsumers} disabled={isLoading} title="รีเฟรช">
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Table */}
        {loadError ? (
          <Typography color="error">{loadError}</Typography>
        ) : isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>ชื่อ</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>โทรศัพท์</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>วันที่ลงทะเบียน</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        {searchQuery ? 'ไม่พบผู้บริโภคที่ตรงกับการค้นหา' : 'ยังไม่มีผู้บริโภค'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((c, idx) => (
                      <TableRow key={c.id} hover>
                        <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.phone}</TableCell>
                        <TableCell>
                          {c.registeredAt ? formatDate(new Date(c.registeredAt)) : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage="ต่อหน้า:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} จาก ${count}`}
            />
          </Paper>
        )}

        {/* Register Dialog */}
        <Dialog open={registerOpen} onClose={() => setRegisterOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>ลงทะเบียนผู้บริโภค</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="เบอร์โทรศัพท์"
              value={regPhone}
              onChange={(e) => setRegPhone(e.target.value)}
              margin="normal"
              autoFocus
              inputProps={{ maxLength: 20 }}
            />
            <TextField
              fullWidth
              label="ชื่อ"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              margin="normal"
              inputProps={{ maxLength: 100 }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
            />
            {regError && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {regError}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRegisterOpen(false)} disabled={regSubmitting}>
              ยกเลิก
            </Button>
            <Button
              variant="contained"
              onClick={handleRegister}
              disabled={regSubmitting}
            >
              {regSubmitting ? <CircularProgress size={20} /> : 'ลงทะเบียน'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default POSConsumerPage;
