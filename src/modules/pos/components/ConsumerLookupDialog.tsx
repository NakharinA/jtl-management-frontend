import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Consumer } from '../types';
import { ConsumerStep } from '../hooks/useConsumer';

interface Props {
  open: boolean;
  step: ConsumerStep;
  phone: string;
  consumer: Consumer | null;
  error: string | null;
  onSetPhone: (phone: string) => void;
  onLookup: (phone: string) => void;
  onRegister: (name: string) => void;
  onConfirm: (consumer: Consumer) => void;
  onClose: () => void;
}

export const ConsumerLookupDialog = ({
  open,
  step,
  phone,
  consumer,
  error,
  onSetPhone,
  onLookup,
  onRegister,
  onConfirm,
  onClose,
}: Props) => {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');

  const isLoading = step === 'LOOKING_UP' || step === 'REGISTERING';

  const handleLookup = () => {
    if (!phone.trim()) return;
    onLookup(phone.trim());
  };

  const handleRegister = () => {
    if (!name.trim()) {
      setNameError('กรุณาระบุชื่อ');
      return;
    }
    setNameError('');
    onRegister(name.trim());
  };

  const handleConfirm = () => {
    if (consumer) onConfirm(consumer);
  };

  const handleClose = () => {
    setName('');
    setNameError('');
    onClose();
  };

  const dialogTitle =
    step === 'FOUND'
      ? 'พบข้อมูลผู้บริโภค'
      : step === 'NOT_FOUND'
        ? 'ลงทะเบียนผู้บริโภค'
        : 'ค้นหาผู้บริโภค';

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : handleClose}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown={isLoading}
    >
      <DialogTitle>{dialogTitle}</DialogTitle>

      <DialogContent>
        {/* ── PHONE INPUT ── */}
        {(step === 'PHONE_INPUT' || step === 'NOT_FOUND') && (
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="หมายเลขโทรศัพท์"
              value={phone}
              onChange={(e) => onSetPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              disabled={step === 'NOT_FOUND'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              inputProps={{ maxLength: 10 }}
              autoFocus={step === 'PHONE_INPUT'}
              error={!!error}
              helperText={error ?? ' '}
            />

            {step === 'NOT_FOUND' && (
              <>
                <Typography variant="body2" color="text.secondary">
                  ไม่พบผู้บริโภคสำหรับเบอร์นี้ กรุณาลงทะเบียน
                </Typography>
                <TextField
                  fullWidth
                  label="ชื่อ-นามสกุล"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                  error={!!nameError}
                  helperText={nameError ?? ' '}
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </>
            )}
          </Box>
        )}

        {/* ── LOADING ── */}
        {isLoading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, gap: 2 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              {step === 'LOOKING_UP' ? 'กำลังค้นหา...' : 'กำลังลงทะเบียน...'}
            </Typography>
          </Box>
        )}

        {/* ── FOUND ── */}
        {step === 'FOUND' && consumer && (
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 56, color: 'success.main' }} />
            <Box
              sx={{
                width: '100%',
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">ชื่อ</Typography>
                <Typography variant="body2" fontWeight={600}>{consumer.name}</Typography>
              </Box>
              <Divider sx={{ my: 0.75 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">โทรศัพท์</Typography>
                <Typography variant="body2" fontWeight={600}>{consumer.phone}</Typography>
              </Box>
              <Divider sx={{ my: 0.75 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">ID</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {consumer.id}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {step === 'PHONE_INPUT' && (
          <>
            <Button onClick={handleClose} color="inherit">ยกเลิก</Button>
            <Button variant="contained" onClick={handleLookup} disabled={!phone.trim()}>
              ค้นหา
            </Button>
          </>
        )}
        {step === 'NOT_FOUND' && (
          <>
            <Button onClick={handleClose} color="inherit">ยกเลิก</Button>
            <Button variant="contained" onClick={handleRegister}>
              ลงทะเบียน
            </Button>
          </>
        )}
        {step === 'FOUND' && (
          <>
            <Button onClick={handleClose} color="inherit">ยกเลิก</Button>
            <Button variant="contained" color="success" onClick={handleConfirm}>
              ยืนยัน
            </Button>
          </>
        )}
        {isLoading && <Box sx={{ height: 36 }} />}
      </DialogActions>
    </Dialog>
  );
};
