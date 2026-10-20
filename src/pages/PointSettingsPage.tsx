import { useCallback, useEffect, useMemo, useState } from 'react';
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
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Layout } from '@/shared/components/Layout';
import {
  pointSettingsService,
  toThaiPointSettingsError,
} from '@/modules/points/services/point-settings.service';
import {
  EARN_SHARE_NORMAL_MAX,
  EARN_SHARE_NORMAL_MIN,
  MAX_TYPE_RULE_VALUE,
  POINT_RULE_LABEL,
  isFixedRule,
  PointGroup,
  PointPreview,
  PointProductType,
  PointTypeRule,
} from '@/modules/points/types';

const fmtNumber = (n: number, digits = 2) =>
  n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: digits });
const fmtBaht = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const isShareOutsideNormal = (p: number) => p < EARN_SHARE_NORMAL_MIN || p > EARN_SHARE_NORMAL_MAX;

const parsePercent = (s: string): number | null => {
  if (s.trim() === '') return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return Math.round(n * 100) / 100;
};

/** Inline % input that commits on blur / Enter when the value is valid and changed. */
const PercentField = ({
  value,
  onCommit,
  disabled,
  warn,
}: {
  value: number;
  onCommit: (v: number) => Promise<void>;
  disabled?: boolean;
  warn?: (v: number) => string | null;
}) => {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const parsed = parsePercent(text);
  const warning = parsed !== null && warn ? warn(parsed) : null;

  const commit = async () => {
    if (parsed === null) {
      setText(String(value));
      return;
    }
    if (parsed !== value) {
      try {
        await onCommit(parsed);
      } catch {
        setText(String(value));
      }
    }
  };

  return (
    <TextField
      size="small"
      type="number"
      value={text}
      disabled={disabled}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      error={parsed === null}
      sx={{ width: 120 }}
      inputProps={{ min: 0, max: 100, step: 0.5 }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            {warning ? (
              <Tooltip title={warning}>
                <WarningAmberIcon fontSize="small" color="warning" />
              </Tooltip>
            ) : (
              '%'
            )}
          </InputAdornment>
        ),
      }}
    />
  );
};

/** '' -> null (not set); otherwise 0..MAX_TYPE_RULE_VALUE rounded to 2 decimals, or undefined if invalid. */
const parseOptionalAmount = (s: string): number | null | undefined => {
  if (s.trim() === '') return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > MAX_TYPE_RULE_VALUE) return undefined;
  return Math.round(n * 100) / 100;
};

/** Inline optional number input (empty = not set) that commits on blur / Enter. */
const OptionalAmountField = ({
  value,
  unit,
  placeholder,
  onCommit,
}: {
  value: number | null;
  unit: string;
  placeholder: string;
  onCommit: (v: number | null) => Promise<void>;
}) => {
  const asText = (v: number | null) => (v === null ? '' : String(v));
  const [text, setText] = useState(asText(value));
  useEffect(() => setText(asText(value)), [value]);
  const parsed = parseOptionalAmount(text);

  const commit = async () => {
    if (parsed === undefined) {
      setText(asText(value));
      return;
    }
    if (parsed !== value) {
      try {
        await onCommit(parsed);
      } catch {
        setText(asText(value));
      }
    }
  };

  return (
    <TextField
      size="small"
      type="number"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      error={parsed === undefined}
      sx={{ width: 150 }}
      inputProps={{ min: 0, max: MAX_TYPE_RULE_VALUE, step: 1 }}
      InputProps={{ endAdornment: <InputAdornment position="end">{unit}</InputAdornment> }}
    />
  );
};

/** Per-type settings of one group: default baht profit and optional fixed points per unit. */
const TypeRulesTable = ({
  group,
  onCommit,
}: {
  group: PointGroup;
  onCommit: (rule: PointTypeRule, input: { pointsPerUnit?: number | null; defaultProfitPerUnit?: number | null }) => Promise<void>;
}) => {
  const rules = group.productTypeRules ?? group.productTypes.map((t) => ({
    productType: t,
    productCount: 0,
    pointsPerUnit: null,
    defaultProfitPerUnit: null,
  }));
  if (rules.length === 0) return null;
  return (
    <Table size="small" sx={{ '& td, & th': { borderBottom: 'none', py: 0.5 } }}>
      <TableHead>
        <TableRow>
          <TableCell sx={{ color: 'text.secondary' }}>ประเภทสินค้า</TableCell>
          <TableCell align="right" sx={{ color: 'text.secondary' }}>
            สินค้า
          </TableCell>
          <TableCell sx={{ color: 'text.secondary' }}>กำไรเริ่มต้น (฿/หน่วย)</TableCell>
          <TableCell sx={{ color: 'text.secondary' }}>แต้มต่อหน่วย (ไม่บังคับ)</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rules.map((r) => (
          <TableRow key={r.productType}>
            <TableCell>{r.productType}</TableCell>
            <TableCell align="right">{r.productCount}</TableCell>
            <TableCell>
              <OptionalAmountField
                value={r.defaultProfitPerUnit}
                unit="฿"
                placeholder={`${fmtNumber(group.defaultMarginPercent)}%`}
                onCommit={(v) => onCommit(r, { defaultProfitPerUnit: v })}
              />
            </TableCell>
            <TableCell>
              <OptionalAmountField
                value={r.pointsPerUnit}
                unit="แต้ม"
                placeholder={group.pointsPerUnit != null ? `${fmtNumber(group.pointsPerUnit)} (กลุ่ม)` : "—"}
                onCommit={(v) => onCommit(r, { pointsPerUnit: v })}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const shareWarning = (v: number) =>
  isShareOutsideNormal(v)
    ? `ปกติให้คืน ${EARN_SHARE_NORMAL_MIN}–${EARN_SHARE_NORMAL_MAX}% ของกำไร (ตอนนี้ ${fmtNumber(v)}%)`
    : null;

// ─── General settings ────────────────────────────────────────────────────────

const GeneralSettings = ({ onSaved, onError }: { onSaved: (msg: string) => void; onError: (msg: string) => void }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pointValue, setPointValue] = useState('');
  const [savedValue, setSavedValue] = useState<number | null>(null);
  const [shopEarn, setShopEarn] = useState(false);
  const [savedShopEarn, setSavedShopEarn] = useState(false);

  useEffect(() => {
    pointSettingsService
      .getSettings()
      .then((s) => {
        setPointValue(String(s.pointValueBaht));
        setSavedValue(s.pointValueBaht);
        setShopEarn(s.shopCustomersEarn);
        setSavedShopEarn(s.shopCustomersEarn);
      })
      .catch((e) => onError(toThaiPointSettingsError(e, 'โหลดการตั้งค่าไม่สำเร็จ')))
      .finally(() => setLoading(false));
  }, [onError]);

  const value = Number(pointValue);
  const valueValid = pointValue.trim() !== '' && Number.isFinite(value) && value > 0 && value < 1000000;
  const dirty = valueValid && (value !== savedValue || shopEarn !== savedShopEarn);

  const save = async () => {
    setSaving(true);
    try {
      const s = await pointSettingsService.updateSettings({ pointValueBaht: value, shopCustomersEarn: shopEarn });
      setSavedValue(s.pointValueBaht);
      setPointValue(String(s.pointValueBaht));
      setSavedShopEarn(s.shopCustomersEarn);
      setShopEarn(s.shopCustomersEarn);
      onSaved('บันทึกการตั้งค่าแล้ว');
    } catch (e) {
      onError(toThaiPointSettingsError(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start' }}>
      <TextField
        label="มูลค่า 1 แต้ม"
        size="small"
        type="number"
        value={pointValue}
        onChange={(e) => setPointValue(e.target.value)}
        error={!valueValid}
        helperText={valueValid ? 'ต้นทุนของรางวัลที่ 1 แต้มแลกได้' : 'ต้องมากกว่า 0'}
        sx={{ width: 220 }}
        inputProps={{ min: 0, step: 0.1 }}
        InputProps={{ endAdornment: <InputAdornment position="end">บาท/แต้ม</InputAdornment> }}
      />
      <Box>
        <FormControlLabel
          control={<Switch checked={shopEarn} onChange={(e) => setShopEarn(e.target.checked)} />}
          label="ลูกค้าร้านค้า (ขายส่ง) ได้รับแต้ม"
        />
        <Typography variant="caption" color="text.secondary" display="block">
          {shopEarn ? 'ลูกค้าร้านค้าจะได้รับแต้มจากการซื้อเหมือนลูกค้าทั่วไป' : 'ยังไม่เปิดใช้ — ตอนนี้ให้แต้มเฉพาะลูกค้าทั่วไป'}
        </Typography>
      </Box>
      <Button variant="contained" onClick={save} disabled={!dirty || saving} sx={{ mt: 0.5 }}>
        {saving ? 'กำลังบันทึก...' : 'บันทึก'}
      </Button>
    </Box>
  );
};

// ─── Group dialogs ───────────────────────────────────────────────────────────

const AddGroupDialog = ({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (g: PointGroup) => void;
}) => {
  const [name, setName] = useState('');
  const [share, setShare] = useState('5');
  const [margin, setMargin] = useState('10');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setShare('5');
      setMargin('10');
      setError(null);
    }
  }, [open]);

  const shareN = parsePercent(share);
  const marginN = parsePercent(margin);
  const valid = name.trim() !== '' && name.trim().length <= 100 && shareN !== null && marginN !== null;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      const g = await pointSettingsService.createGroup({
        name: name.trim(),
        earnSharePercent: shareN!,
        defaultMarginPercent: marginN!,
      });
      onCreated(g);
    } catch (e) {
      setError(toThaiPointSettingsError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>เพิ่มกลุ่มสินค้า</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="ชื่อกลุ่ม" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <TextField
          label="คืนกำไรเป็นแต้ม"
          type="number"
          value={share}
          onChange={(e) => setShare(e.target.value)}
          error={shareN === null}
          helperText={shareN !== null ? shareWarning(shareN) ?? 'สัดส่วนของกำไรที่คืนให้ลูกค้า' : '0–100%'}
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
        />
        <TextField
          label="กำไรเริ่มต้น (%)"
          type="number"
          value={margin}
          onChange={(e) => setMargin(e.target.value)}
          error={marginN === null}
          helperText="ใช้เมื่อสินค้าไม่ได้กรอกต้นทุน และประเภทสินค้าไม่ได้กำหนดกำไรเริ่มต้นเป็น ฿"
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
        />
        <Typography variant="caption" color="text.secondary">
          หลังเพิ่มกลุ่มแล้ว กดปุ่มแก้ไขในช่อง "ประเภทสินค้า" เพื่อเลือกประเภทสินค้าที่ได้แต้ม
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ยกเลิก</Button>
        <Button variant="contained" onClick={submit} disabled={!valid || saving}>
          {saving ? 'กำลังบันทึก...' : 'เพิ่ม'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ProductTypesDialog = ({
  group,
  onClose,
  onSaved,
}: {
  group: PointGroup | null;
  onClose: () => void;
  onSaved: (g: PointGroup) => void;
}) => {
  const [types, setTypes] = useState<PointProductType[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!group) return;
    setSelected(group.productTypes);
    setError(null);
    setLoading(true);
    pointSettingsService
      .listProductTypes()
      .then(setTypes)
      .catch((e) => setError(toThaiPointSettingsError(e, 'โหลดประเภทสินค้าไม่สำเร็จ')))
      .finally(() => setLoading(false));
  }, [group]);

  const byType = useMemo(() => new Map(types.map((t) => [t.productType, t])), [types]);
  const moved = selected.filter((t) => {
    const info = byType.get(t);
    return info && info.groupId !== null && info.groupId !== group?.id;
  });

  const submit = async () => {
    if (!group) return;
    setSaving(true);
    setError(null);
    try {
      onSaved(await pointSettingsService.setGroupProductTypes(group.id, selected));
    } catch (e) {
      setError(toThaiPointSettingsError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={group !== null} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>ประเภทสินค้าในกลุ่ม "{group?.name}"</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Autocomplete
          multiple
          loading={loading}
          options={types.map((t) => t.productType)}
          value={selected}
          onChange={(_, v) => setSelected(v)}
          filterSelectedOptions
          renderOption={(props, option) => {
            const info = byType.get(option);
            const other = info && info.groupId !== null && info.groupId !== group?.id ? info.groupName : null;
            return (
              <li {...props} key={option}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                  <span>{option}</span>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                    {info?.productCount ?? 0} สินค้า{other ? ` · อยู่ในกลุ่ม ${other}` : ''}
                  </Typography>
                </Box>
              </li>
            );
          }}
          renderInput={(params) => <TextField {...params} label="ประเภทสินค้า (product type)" placeholder="เลือกประเภท" />}
          loadingText="กำลังโหลด..."
          noOptionsText="ไม่มีประเภทสินค้าอื่น"
        />
        {moved.length > 0 && (
          <Alert severity="warning">
            {moved.map((t) => `"${t}" (จากกลุ่ม ${byType.get(t)?.groupName})`).join(', ')} จะถูกย้ายมากลุ่มนี้
            — ประเภทหนึ่งอยู่ได้แค่กลุ่มเดียว
          </Alert>
        )}
        <Typography variant="caption" color="text.secondary">
          สินค้าที่ประเภทไม่อยู่ในกลุ่มใดจะไม่ได้รับแต้ม
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ยกเลิก</Button>
        <Button variant="contained" onClick={submit} disabled={saving || loading}>
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Preview ─────────────────────────────────────────────────────────────────

const PreviewTable = ({ groups, reloadKey }: { groups: PointGroup[]; reloadKey: number }) => {
  const [groupId, setGroupId] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<PointPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    pointSettingsService
      .preview(groupId === '' ? undefined : groupId)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(toThaiPointSettingsError(e, 'โหลดตัวอย่างไม่สำเร็จ')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [groupId, reloadKey]);

  useEffect(() => setPage(0), [groupId, search]);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = data?.items ?? [];
    return q ? all.filter((i) => i.productName.toLowerCase().includes(q) || i.productType.toLowerCase().includes(q)) : all;
  }, [data, search]);

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>กลุ่ม</InputLabel>
          <Select label="กลุ่ม" value={groupId} onChange={(e) => setGroupId(e.target.value as number | '')}>
            <MenuItem value="">ทุกกลุ่ม</MenuItem>
            {groups.map((g) => (
              <MenuItem key={g.id} value={g.id}>
                {g.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField size="small" label="ค้นหาสินค้า" value={search} onChange={(e) => setSearch(e.target.value)} />
        {data && (
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
            คิดที่ราคาขายปลีก · 1 แต้ม = {fmtNumber(data.pointValueBaht, 4)} บาท
          </Typography>
        )}
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>สินค้า</TableCell>
              <TableCell>กลุ่ม</TableCell>
              <TableCell align="right">ราคาปลีก</TableCell>
              <TableCell align="right">ต้นทุน</TableCell>
              <TableCell align="right">กำไรที่ใช้</TableCell>
              <TableCell>วิธีคิด</TableCell>
              <TableCell align="right">แต้ม/ชิ้น</TableCell>
              <TableCell align="right">ซื้อกี่บาทได้ 1 แต้ม</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary' }}>
                  ไม่มีสินค้าที่ได้แต้ม
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              items.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((i) => (
                <TableRow key={i.productId} hover sx={{ opacity: i.groupActive ? 1 : 0.5 }}>
                  <TableCell>
                    <Typography variant="body2">{i.productName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {i.productType}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {i.groupName}
                    {!i.groupActive && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        ปิดอยู่
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">{fmtBaht(i.retailPrice)}</TableCell>
                  <TableCell align="right">{i.productCost > 0 ? fmtBaht(i.productCost) : '—'}</TableCell>
                  <TableCell align="right">
                    {isFixedRule(i.rule) ? (
                      '—'
                    ) : i.rule === 'type_profit' && i.typeDefaultProfitPerUnit != null ? (
                      <>
                        {fmtBaht(i.typeDefaultProfitPerUnit)} ฿
                        <Typography variant="caption" color="text.secondary" display="block">
                          {fmtNumber(i.marginPercent)}%
                        </Typography>
                      </>
                    ) : (
                      `${fmtNumber(i.marginPercent)}%`
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {i.rule ? POINT_RULE_LABEL[i.rule] : i.marginSource === 'default' ? 'ค่าเริ่มต้นกลุ่ม' : 'ต้นทุนสินค้า'}
                    </Typography>
                    {isFixedRule(i.rule) && (
                      <Typography variant="caption" color="text.secondary">
                        {fmtNumber((i.rule === 'fixed_type' ? i.typePointsPerUnit : i.groupPointsPerUnit) ?? 0)} แต้ม/หน่วย
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={`${fmtNumber(i.pointsPerUnitExact, 4)} แต้ม (แต้มจริงปัดเศษลงเป็นจำนวนเต็มต่อรายการ)`}>
                      <span>{fmtNumber(i.pointsPerUnitExact)}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">{i.bahtPerPoint !== null ? fmtBaht(i.bahtPerPoint) : '—'}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={items.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(Number(e.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={[25, 50, 100]}
        labelRowsPerPage="แถวต่อหน้า"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} จาก ${count}`}
      />
    </>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

const PointSettingsPage = () => {
  const [groups, setGroups] = useState<PointGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [typesGroup, setTypesGroup] = useState<PointGroup | null>(null);
  const [deleteGroup, setDeleteGroup] = useState<PointGroup | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const showSaved = useCallback((message: string) => setToast({ message, severity: 'success' }), []);
  const showError = useCallback((message: string) => setToast({ message, severity: 'error' }), []);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setGroups(await pointSettingsService.listGroups());
    } catch (e) {
      setLoadError(toThaiPointSettingsError(e, 'โหลดกลุ่มสินค้าไม่สำเร็จ'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const replaceGroup = (g: PointGroup) => {
    setGroups((prev) => prev.map((x) => (x.id === g.id ? g : x)));
    setPreviewKey((k) => k + 1);
  };

  const patchGroup = async (g: PointGroup, input: Parameters<typeof pointSettingsService.updateGroup>[1]) => {
    try {
      replaceGroup(await pointSettingsService.updateGroup(g.id, input));
      showSaved(`บันทึกกลุ่ม ${g.name} แล้ว`);
    } catch (e) {
      showError(toThaiPointSettingsError(e));
      throw e;
    }
  };

  const patchTypeRule = async (
    rule: PointTypeRule,
    input: { pointsPerUnit?: number | null; defaultProfitPerUnit?: number | null },
  ) => {
    try {
      const updated = await pointSettingsService.updateProductTypeRule(rule.productType, input);
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          productTypeRules: (g.productTypeRules ?? []).map((r) =>
            r.productType === rule.productType
              ? {
                  ...r,
                  pointsPerUnit: updated.pointsPerUnit ?? null,
                  defaultProfitPerUnit: updated.defaultProfitPerUnit ?? null,
                }
              : r,
          ),
        })),
      );
      setPreviewKey((k) => k + 1);
      showSaved(`บันทึกประเภท ${rule.productType} แล้ว`);
    } catch (e) {
      showError(toThaiPointSettingsError(e));
      throw e;
    }
  };

  const confirmDelete = async () => {
    if (!deleteGroup) return;
    setDeleting(true);
    try {
      await pointSettingsService.deleteGroup(deleteGroup.id);
      showSaved(`ลบกลุ่ม ${deleteGroup.name} แล้ว`);
      setDeleteGroup(null);
      await loadGroups();
      setPreviewKey((k) => k + 1);
    } catch (e) {
      showError(toThaiPointSettingsError(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            ตั้งค่าแต้ม
          </Typography>
          <Typography variant="body2" color="text.secondary">
            แต้มจากการซื้อ = กำไรของสินค้าในกลุ่ม × สัดส่วนคืนกำไร ÷ มูลค่า 1 แต้ม หรือแต้มคงที่ต่อหน่วยของประเภทสินค้า
            · ปัดเศษลงเป็นจำนวนเต็มทีละรายการ ยอดรวมบิล = ผลบวกของทุกรายการ · แต้มไม่มีวันหมดอายุ
          </Typography>
        </Box>

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            ทั่วไป
          </Typography>
          <GeneralSettings
            onSaved={(m) => {
              showSaved(m);
              setPreviewKey((k) => k + 1);
            }}
            onError={showError}
          />
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ flexGrow: 1 }}>
              กลุ่มสินค้าที่ได้แต้ม
            </Typography>
            <IconButton onClick={loadGroups} size="small" aria-label="โหลดใหม่">
              <RefreshIcon />
            </IconButton>
            <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setAddOpen(true)}>
              เพิ่มกลุ่ม
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ปกติคืนกำไร {EARN_SHARE_NORMAL_MIN}–{EARN_SHARE_NORMAL_MAX}%
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            ลำดับการคิดแต้มของแต่ละสินค้า: (1) <b>แต้มต่อหน่วย</b> ของประเภท (2) <b>แต้มต่อหน่วย (ทั้งกลุ่ม)</b> — ถ้ากำหนด
            ได้แต้มตามนั้นเลย × จำนวน (ไม่ขึ้นกับกำไร สัดส่วนคืนกำไร มูลค่าแต้ม หรือส่วนลด) (3) ถ้าสินค้ามี<b>ต้นทุน</b>{' '}
            ใช้กำไรจริง (ราคาขาย − ต้นทุน) (4) ถ้าไม่มีต้นทุน ใช้ <b>กำไรเริ่มต้น (฿/หน่วย)</b> ของประเภท (5) ถ้าไม่ได้กำหนด
            ใช้ <b>กำไรเริ่มต้น (%)</b> ของกลุ่ม · เว้นว่างไว้ = ไม่กำหนด
          </Alert>
          {loadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loadError}
            </Alert>
          )}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>กลุ่ม</TableCell>
                  <TableCell>ประเภทสินค้า</TableCell>
                  <TableCell align="right">สินค้า</TableCell>
                  <TableCell>คืนกำไรเป็นแต้ม</TableCell>
                  <TableCell>
                    กำไรเริ่มต้น (%)
                    <Typography variant="caption" color="text.secondary" display="block">
                      ใช้เมื่อประเภทไม่ได้กำหนด ฿
                    </Typography>
                  </TableCell>
                  <TableCell>
                    แต้มต่อหน่วย (ทั้งกลุ่ม)
                    <Typography variant="caption" color="text.secondary" display="block">
                      ถ้าใส่ ทุกสินค้าในกลุ่มนี้ได้แต้มตามนี้ต่อหน่วย (ประเภทที่ตั้งเองจะใช้ค่าของประเภทแทน)
                    </Typography>
                  </TableCell>
                  <TableCell align="center">เปิดใช้</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && groups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                )}
                {!loading && groups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary' }}>
                      ยังไม่มีกลุ่ม
                    </TableCell>
                  </TableRow>
                )}
                {groups.map((g) => [
                  <TableRow key={g.id} hover sx={{ opacity: g.active ? 1 : 0.6, '& > td': { borderBottom: g.productTypes.length > 0 ? 'none' : undefined } }}>
                    <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{g.name}</TableCell>
                    <TableCell sx={{ maxWidth: 360 }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                        {g.productTypes.length === 0 && (
                          <Typography variant="caption" color="warning.main">
                            ยังไม่ได้เลือกประเภท
                          </Typography>
                        )}
                        {g.productTypes.map((t) => (
                          <Chip key={t} label={t} size="small" />
                        ))}
                        <IconButton size="small" onClick={() => setTypesGroup(g)} aria-label="แก้ไขประเภทสินค้า">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{g.productCount}</TableCell>
                    <TableCell>
                      <PercentField
                        value={g.earnSharePercent}
                        warn={shareWarning}
                        onCommit={(v) => patchGroup(g, { earnSharePercent: v })}
                      />
                    </TableCell>
                    <TableCell>
                      <PercentField
                        value={g.defaultMarginPercent}
                        onCommit={(v) => patchGroup(g, { defaultMarginPercent: v })}
                      />
                    </TableCell>
                    <TableCell>
                      <OptionalAmountField
                        value={g.pointsPerUnit ?? null}
                        unit="แต้ม"
                        placeholder="—"
                        onCommit={(v) => patchGroup(g, { pointsPerUnit: v })}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={g.active}
                        onChange={(e) => patchGroup(g, { active: e.target.checked }).catch(() => {})}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="error" onClick={() => setDeleteGroup(g)} aria-label="ลบกลุ่ม">
                        <DeleteOutlineIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>,
                  g.productTypes.length > 0 && (
                    <TableRow key={`${g.id}-types`} sx={{ opacity: g.active ? 1 : 0.6 }}>
                      <TableCell />
                      <TableCell colSpan={7} sx={{ pt: 0 }}>
                        <TypeRulesTable group={g} onCommit={patchTypeRule} />
                      </TableCell>
                    </TableRow>
                  ),
                ])}
              </TableBody>
            </Table>
          </TableContainer>
          {groups.some((g) => isShareOutsideNormal(g.earnSharePercent)) && (
            <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mt: 2 }}>
              มีกลุ่มที่คืนกำไรนอกช่วงปกติ {EARN_SHARE_NORMAL_MIN}–{EARN_SHARE_NORMAL_MAX}%:{' '}
              {groups
                .filter((g) => isShareOutsideNormal(g.earnSharePercent))
                .map((g) => `${g.name} (${fmtNumber(g.earnSharePercent)}%)`)
                .join(', ')}
            </Alert>
          )}
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            ตัวอย่างแต้มต่อสินค้า
          </Typography>
          <PreviewTable groups={groups} reloadKey={previewKey} />
        </Paper>
      </Box>

      <AddGroupDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(g) => {
          setAddOpen(false);
          showSaved(`เพิ่มกลุ่ม ${g.name} แล้ว`);
          loadGroups();
          setTypesGroup(g);
        }}
      />
      <ProductTypesDialog
        group={typesGroup}
        onClose={() => setTypesGroup(null)}
        onSaved={() => {
          setTypesGroup(null);
          showSaved('บันทึกประเภทสินค้าแล้ว');
          // Other groups may have lost a type that moved here
          loadGroups();
          setPreviewKey((k) => k + 1);
        }}
      />
      <Dialog open={deleteGroup !== null} onClose={() => !deleting && setDeleteGroup(null)}>
        <DialogTitle>ลบกลุ่ม "{deleteGroup?.name}"?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            สินค้าในกลุ่มนี้ ({deleteGroup?.productCount ?? 0} รายการ) จะไม่ได้รับแต้มอีก แต้มที่ลูกค้าได้ไปแล้วไม่เปลี่ยน
            ถ้าต้องการหยุดชั่วคราวให้ปิด "เปิดใช้" แทน
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteGroup(null)} disabled={deleting}>
            ยกเลิก
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>
            {deleting ? 'กำลังลบ...' : 'ลบ'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={toast !== null}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast?.severity ?? 'success'} onClose={() => setToast(null)} variant="filled">
          {toast?.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
};

export default PointSettingsPage;
