import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { CUSTOMER_TYPE_LABEL, MemberDetail, NOTE_MAX_LENGTH } from '../types';
import { memberService, toThaiMemberError } from '../services/member.service';

interface MemberDetailDialogProps {
  memberId: string | null;
  onClose: () => void;
  onEdit: (member: MemberDetail) => void;
  /** Called after notes change so the list can refresh its note preview. */
  onNotesChanged: () => void;
}

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <Box sx={{ display: 'flex', gap: 1, py: 0.25 }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
      {value || '-'}
    </Typography>
  </Box>
);

export const MemberDetailDialog = ({ memberId, onClose, onEdit, onNotesChanged }: MemberDetailDialogProps) => {
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [newNote, setNewNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!memberId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      setMember(await memberService.getById(memberId));
    } catch (err) {
      setLoadError(toThaiMemberError(err, 'เกิดข้อผิดพลาดในการโหลดข้อมูล', 'load'));
    } finally {
      setIsLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    if (memberId) {
      setMember(null);
      setNewNote('');
      setNoteError('');
      setEditingId(null);
      setConfirmDeleteId(null);
      load();
    }
  }, [memberId, load]);

  const runNoteAction = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setNoteError('');
    try {
      await action();
      await load();
      onNotesChanged();
      return true;
    } catch (err) {
      setNoteError(toThaiMemberError(err, undefined, 'note'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleAddNote = async () => {
    const text = newNote.trim();
    if (!memberId || !text) {
      setNoteError('กรุณาระบุบันทึก');
      return;
    }
    if (await runNoteAction(() => memberService.addNote(memberId, text))) setNewNote('');
  };

  const handleSaveEdit = async () => {
    const text = editingText.trim();
    if (!memberId || !editingId) return;
    if (!text) {
      setNoteError('กรุณาระบุบันทึก');
      return;
    }
    if (await runNoteAction(() => memberService.updateNote(memberId, editingId, text))) setEditingId(null);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!memberId) return;
    if (await runNoteAction(() => memberService.deleteNote(memberId, noteId))) setConfirmDeleteId(null);
  };

  return (
    <Dialog open={!!memberId} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {member?.linePictureUrl && <Avatar src={member.linePictureUrl} alt={member.lineDisplayName ?? ''} />}
        <Box sx={{ flexGrow: 1 }}>
          {member?.name ?? 'รายละเอียดสมาชิก'}
          {member && (
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              <Chip
                size="small"
                label={CUSTOMER_TYPE_LABEL[member.customerType]}
                color={member.customerType === 'shop' ? 'secondary' : 'default'}
              />
              {member.lineLinked && <Chip size="small" label="LINE" color="success" />}
            </Stack>
          )}
        </Box>
        <IconButton onClick={onClose} aria-label="ปิด">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {isLoading && !member ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : loadError ? (
          <Alert severity="error">{loadError}</Alert>
        ) : member ? (
          <>
            <InfoRow label="เบอร์โทรศัพท์" value={member.phone} />
            <InfoRow label="แต้มสะสม" value={member.points.toLocaleString('th-TH')} />
            {member.lineLinked && <InfoRow label="ชื่อใน LINE" value={member.lineDisplayName} />}
            {member.consentAt && <InfoRow label="ยินยอม PDPA เมื่อ" value={formatDateTime(member.consentAt)} />}
            {member.customerType === 'shop' && (
              <>
                <InfoRow label="ชื่อร้านค้า" value={member.shopName} />
                <InfoRow label="เลขประจำตัวผู้เสียภาษี" value={member.taxId} />
                <InfoRow label="สาขา" value={member.branch} />
                <InfoRow label="ที่อยู่" value={member.address} />
              </>
            )}
            <InfoRow label="สมัครเมื่อ" value={formatDateTime(member.createdAt)} />

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              บันทึกของพนักงาน ({member.notes.length})
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="เพิ่มบันทึกสั้น ๆ เช่น ชอบสินค้าแบรนด์ไหน, รับของทุกวันศุกร์"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
                multiline
                maxRows={4}
                inputProps={{ maxLength: NOTE_MAX_LENGTH }}
                helperText={`${newNote.trim().length}/${NOTE_MAX_LENGTH}`}
                disabled={busy}
              />
              <Button variant="contained" onClick={handleAddNote} disabled={busy || !newNote.trim()}>
                เพิ่ม
              </Button>
            </Box>
            {noteError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {noteError}
              </Alert>
            )}

            {member.notes.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                ยังไม่มีบันทึก
              </Typography>
            ) : (
              <List dense disablePadding>
                {member.notes.map((n) => (
                  <ListItem key={n.id} divider alignItems="flex-start" sx={{ px: 0, display: 'block' }}>
                    {editingId === n.id ? (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          multiline
                          maxRows={4}
                          autoFocus
                          inputProps={{ maxLength: NOTE_MAX_LENGTH }}
                          disabled={busy}
                        />
                        <IconButton size="small" color="primary" onClick={handleSaveEdit} disabled={busy} title="บันทึก">
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setEditingId(null)} disabled={busy} title="ยกเลิก">
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {n.note}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {n.createdBy || 'ไม่ระบุ'} · {formatDateTime(n.createdAt)}
                            {n.updatedAt !== n.createdAt && ' (แก้ไขแล้ว)'}
                          </Typography>
                        </Box>
                        {confirmDeleteId === n.id ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption">ลบ?</Typography>
                            <Button size="small" color="error" onClick={() => handleDeleteNote(n.id)} disabled={busy}>
                              ลบ
                            </Button>
                            <Button size="small" onClick={() => setConfirmDeleteId(null)} disabled={busy}>
                              ยกเลิก
                            </Button>
                          </Box>
                        ) : (
                          <Box sx={{ whiteSpace: 'nowrap' }}>
                            <IconButton
                              size="small"
                              title="แก้ไข"
                              onClick={() => {
                                setEditingId(n.id);
                                setEditingText(n.note);
                                setNoteError('');
                              }}
                              disabled={busy}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              title="ลบ"
                              color="error"
                              onClick={() => setConfirmDeleteId(n.id)}
                              disabled={busy}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </>
        ) : null}
      </DialogContent>
      <DialogActions>
        {member && (
          <Button startIcon={<EditIcon />} onClick={() => onEdit(member)}>
            แก้ไขข้อมูลสมาชิก
          </Button>
        )}
        <Button onClick={onClose}>ปิด</Button>
      </DialogActions>
    </Dialog>
  );
};
