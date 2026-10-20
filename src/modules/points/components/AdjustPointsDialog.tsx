import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Member } from '@/modules/member/types';
import { pointsService, toThaiPointsError } from '@/modules/points/services/points.service';
import { pointSettingsService } from '@/modules/points/services/point-settings.service';
import {
  AdjustPointsResult,
  MAX_ITEM_QUANTITY,
  MAX_POINT_DELTA,
  POINT_REASON_MAX_LENGTH,
  PointCalculation,
  PointItemInput,
  PointPreviewItem,
} from '@/modules/points/types';
import { useDebounced } from '@/shared/hooks/useDebounced';
import { MemberPicker } from './MemberPicker';

const formatPoints = (n: number) => n.toLocaleString('th-TH');
const formatBaht = (n: number) => n.toLocaleString('th-TH', { maximumFractionDigits: 2 });

type Direction = 'add' | 'remove';
type AddMode = 'products' | 'manual';

interface Line {
  key: number;
  productType: string | null;
  productId: string | null;
  quantity: string;
}

interface TypeOption {
  productType: string;
  groupName: string;
  groupActive: boolean;
  products: PointPreviewItem[];
}

let nextLineKey = 1;
const emptyLine = (): Line => ({ key: nextLineKey++, productType: null, productId: null, quantity: '1' });

const isValidQuantity = (q: string) => /^\d+$/.test(q) && Number(q) >= 1 && Number(q) <= MAX_ITEM_QUANTITY;

/** Product types (point groups' types) in group order, each with its products. */
const useProductCatalog = (enabled: boolean) => {
  const [types, setTypes] = useState<TypeOption[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled || types) return;
    let cancelled = false;
    setError('');
    pointSettingsService
      .preview()
      .then((res) => {
        if (cancelled) return;
        const byType = new Map<string, TypeOption>();
        // Preview items come sorted by group order, then type, then product name
        for (const item of res.items) {
          let t = byType.get(item.productType);
          if (!t) {
            t = { productType: item.productType, groupName: item.groupName, groupActive: item.groupActive, products: [] };
            byType.set(item.productType, t);
          }
          t.products.push(item);
        }
        setTypes([...byType.values()]);
      })
      .catch((err) => !cancelled && setError(toThaiPointsError(err, 'โหลดรายการสินค้าไม่สำเร็จ')));
    return () => {
      cancelled = true;
    };
  }, [enabled, types]);

  return { types, error };
};

export interface AdjustPointsDialogProps {
  open: boolean;
  onClose: () => void;
  /** Pre-selected member (e.g. the one shown on the page); staff can still change it. */
  initialMember: Member | null;
  onDone: (member: Member, result: AdjustPointsResult) => void;
}

/** Add or remove a member's points: manual number, or (when adding) calculated from products bought. */
export const AdjustPointsDialog = ({ open, onClose, initialMember, onDone }: AdjustPointsDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [member, setMember] = useState<Member | null>(initialMember);
  const [direction, setDirection] = useState<Direction>('add');
  const [addMode, setAddMode] = useState<AddMode>('products');
  const [amount, setAmount] = useState('');
  const [lines, setLines] = useState<Line[]>(() => [emptyLine()]);
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Reset every time the dialog opens
  useEffect(() => {
    if (!open) return;
    setMember(initialMember);
    setDirection('add');
    setAddMode('products');
    setAmount('');
    setLines([emptyLine()]);
    setReason('');
    setConfirming(false);
    setSubmitError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const productMode = direction === 'add' && addMode === 'products';
  const { types, error: catalogError } = useProductCatalog(open && productMode);
  const typeByName = useMemo(() => new Map((types ?? []).map((t) => [t.productType, t])), [types]);
  const productById = useMemo(
    () => new Map((types ?? []).flatMap((t) => t.products.map((p): [string, PointPreviewItem] => [p.productId, p]))),
    [types],
  );

  // ---------- Live calculation (product mode) ----------
  const completeItems: PointItemInput[] = lines
    .filter((l) => l.productId && isValidQuantity(l.quantity))
    .map((l) => ({ productId: l.productId!, quantity: Number(l.quantity) }));
  const itemsKey = JSON.stringify(completeItems);
  const debouncedKey = useDebounced(itemsKey);
  const [calc, setCalc] = useState<{ key: string; memberId: string | null; result: PointCalculation } | null>(null);
  const [calcError, setCalcError] = useState('');
  const [calcLoading, setCalcLoading] = useState(false);

  useEffect(() => {
    if (!open || !productMode) return;
    const items = JSON.parse(debouncedKey) as PointItemInput[];
    if (items.length === 0) {
      setCalc(null);
      setCalcError('');
      setCalcLoading(false);
      return;
    }
    let cancelled = false;
    const memberId = member?.id ?? null;
    setCalcLoading(true);
    setCalcError('');
    pointsService
      .calculate(items, memberId)
      .then((result) => !cancelled && setCalc({ key: debouncedKey, memberId, result }))
      .catch((err) => !cancelled && setCalcError(toThaiPointsError(err, 'คำนวณแต้มไม่สำเร็จ')))
      .finally(() => !cancelled && setCalcLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, productMode, debouncedKey, member?.id]);

  const calcFresh = !!calc && calc.key === itemsKey && calc.memberId === (member?.id ?? null);
  const pointsByLine = new Map<number, number>();
  if (calcFresh) {
    // calc.result.items is in the same order as completeItems
    let i = 0;
    for (const l of lines) {
      if (l.productId && isValidQuantity(l.quantity)) pointsByLine.set(l.key, calc!.result.items[i++]?.points ?? 0);
    }
  }
  const lineSum = [...pointsByLine.values()].reduce((s, n) => s + n, 0);

  // ---------- Delta and validation ----------
  const balance = member?.points ?? 0;
  const amountNum = Number(amount);
  const amountValid = /^\d+$/.test(amount) && amountNum > 0 && amountNum <= MAX_POINT_DELTA;
  const delta = productMode ? (calcFresh ? calc!.result.total : 0) : direction === 'add' ? amountNum : -amountNum;
  const balanceAfter = balance + delta;

  let amountError = '';
  if (!productMode) {
    if (amount !== '' && !amountValid) amountError = `กรุณาระบุจำนวนเต็ม 1 – ${formatPoints(MAX_POINT_DELTA)}`;
    else if (amountValid && member && balanceAfter < 0) amountError = `แต้มไม่พอ (คงเหลือ ${formatPoints(balance)} แต้ม)`;
  }
  const linesIncomplete = lines.some((l) => !l.productId || !isValidQuantity(l.quantity));
  const productReady =
    calcFresh && !calcLoading && !linesIncomplete && delta > 0 && delta <= MAX_POINT_DELTA && !calcError;
  const canSubmit =
    !!member &&
    reason.length <= POINT_REASON_MAX_LENGTH &&
    (productMode ? productReady : amountValid && !amountError);

  // ---------- Line editing ----------
  const updateLine = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const setLineType = (key: number, productType: string | null) => {
    const t = productType ? typeByName.get(productType) : undefined;
    // A type with a single product selects it right away
    updateLine(key, { productType, productId: t && t.products.length === 1 ? t.products[0].productId : null });
  };

  // ---------- Submit ----------
  const handleConfirm = async () => {
    if (!member) return;
    setBusy(true);
    setSubmitError('');
    try {
      const result = productMode
        ? await pointsService.adjustByItems(member.id, completeItems, reason)
        : await pointsService.adjust(member.id, delta, reason);
      onDone(member, result);
    } catch (err) {
      setSubmitError(toThaiPointsError(err));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  const actionLabel = direction === 'add' ? 'เพิ่มแต้ม' : 'ลดแต้ม';
  const actionColor = direction === 'add' ? 'success' : 'error';

  const productSummary = completeItems
    .map((i) => {
      const p = productById.get(i.productId);
      return p ? `${p.productType} ${p.productName} ×${formatPoints(i.quantity)}` : '';
    })
    .filter(Boolean);

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle>เพิ่ม/ลดแต้ม</DialogTitle>
      <DialogContent dividers>
        {confirming && member ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography>
              {direction === 'add' ? 'เพิ่ม' : 'ลด'} <b>{formatPoints(Math.abs(delta))}</b> แต้ม{' '}
              {direction === 'add' ? 'ให้' : 'ของ'} <b>{member.name}</b> ({member.phone})
            </Typography>
            {productMode && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  คำนวณจากสินค้า:
                </Typography>
                {productSummary.map((s, i) => (
                  <Typography key={i} variant="body2">
                    • {s}
                  </Typography>
                ))}
              </Box>
            )}
            <Typography>
              แต้มคงเหลือ: {formatPoints(balance)} → <b>{formatPoints(balanceAfter)}</b>
            </Typography>
            {reason.trim() && <Typography>{productMode ? 'หมายเหตุ' : 'เหตุผล'}: {reason.trim()}</Typography>}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                สมาชิก
              </Typography>
              <MemberPicker value={member} onChange={setMember} fullWidth autoFocus={!initialMember} />
              {member && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  แต้มคงเหลือ <b>{formatPoints(balance)}</b> แต้ม
                  {member.customerType === 'shop' ? ' · ลูกค้าร้านค้า' : ''}
                </Typography>
              )}
            </Box>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={direction}
              onChange={(_, v: Direction | null) => v && setDirection(v)}
            >
              <ToggleButton value="add" color="success" sx={{ flex: 1 }}>
                เพิ่มแต้ม
              </ToggleButton>
              <ToggleButton value="remove" color="error" sx={{ flex: 1 }}>
                ลดแต้ม
              </ToggleButton>
            </ToggleButtonGroup>

            {direction === 'add' && (
              <ToggleButtonGroup
                exclusive
                size="small"
                color="primary"
                value={addMode}
                onChange={(_, v: AddMode | null) => v && setAddMode(v)}
              >
                <ToggleButton value="products" sx={{ flex: 1 }}>
                  คำนวณจากสินค้า
                </ToggleButton>
                <ToggleButton value="manual" sx={{ flex: 1 }}>
                  กำหนดเอง
                </ToggleButton>
              </ToggleButtonGroup>
            )}

            {productMode ? (
              <ProductLines
                lines={lines}
                types={types}
                catalogError={catalogError}
                typeByName={typeByName}
                pointsByLine={pointsByLine}
                calcLoading={calcLoading || itemsKey !== debouncedKey}
                onType={setLineType}
                onChange={updateLine}
                onRemove={(key) => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : [emptyLine()]))}
                onAdd={() => setLines((ls) => [...ls, emptyLine()])}
                total={calcFresh ? calc!.result.total : null}
                lineSum={lineSum}
                note={calcFresh ? calc!.result.note : undefined}
                calcError={calcError}
                onUseManual={() => setAddMode('manual')}
              />
            ) : (
              <TextField
                label="จำนวนแต้ม"
                size="small"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
                inputProps={{ inputMode: 'numeric' }}
                error={!!amountError}
                helperText={
                  amountError ||
                  (amountValid && member ? `คงเหลือหลังปรับ: ${formatPoints(balanceAfter)} แต้ม` : ' ')
                }
              />
            )}

            <TextField
              label={productMode ? 'หมายเหตุ (ไม่บังคับ)' : 'เหตุผล (ไม่บังคับ)'}
              size="small"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              inputProps={{ maxLength: POINT_REASON_MAX_LENGTH }}
              helperText={
                productMode
                  ? `ระบบบันทึกเหตุผลเป็น "ซื้อสินค้า: ..." ให้อัตโนมัติ · ${reason.length}/${POINT_REASON_MAX_LENGTH}`
                  : `${reason.length}/${POINT_REASON_MAX_LENGTH}`
              }
            />
          </Box>
        )}
        {submitError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {submitError}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        {confirming ? (
          <>
            <Button onClick={() => setConfirming(false)} disabled={busy}>
              ย้อนกลับ
            </Button>
            <Button variant="contained" color={actionColor} onClick={handleConfirm} disabled={busy}>
              {busy ? <CircularProgress size={20} /> : 'ยืนยัน'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>ยกเลิก</Button>
            <Button
              variant="contained"
              color={actionColor}
              disabled={!canSubmit}
              onClick={() => {
                setSubmitError('');
                setConfirming(true);
              }}
            >
              {canSubmit ? `${actionLabel} ${formatPoints(Math.abs(delta))} แต้ม` : actionLabel}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

interface ProductLinesProps {
  lines: Line[];
  types: TypeOption[] | null;
  catalogError: string;
  typeByName: Map<string, TypeOption>;
  pointsByLine: Map<number, number>;
  calcLoading: boolean;
  onType: (key: number, productType: string | null) => void;
  onChange: (key: number, patch: Partial<Line>) => void;
  onRemove: (key: number) => void;
  onAdd: () => void;
  total: number | null;
  lineSum: number;
  note?: string;
  calcError: string;
  onUseManual: () => void;
}

const ProductLines = ({
  lines,
  types,
  catalogError,
  typeByName,
  pointsByLine,
  calcLoading,
  onType,
  onChange,
  onRemove,
  onAdd,
  total,
  lineSum,
  note,
  calcError,
  onUseManual,
}: ProductLinesProps) => {
  if (catalogError) return <Alert severity="error">{catalogError}</Alert>;
  if (!types) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (types.length === 0) {
    return (
      <Alert severity="info" action={<Button onClick={onUseManual}>กำหนดเอง</Button>}>
        ยังไม่มีประเภทสินค้าที่ได้แต้ม (ตั้งค่าได้ที่หน้า ตั้งค่าแต้ม)
      </Alert>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {lines.map((line, idx) => {
          const type = line.productType ? typeByName.get(line.productType) : undefined;
          const product = type?.products.find((p) => p.productId === line.productId) ?? null;
          const qtyError = line.quantity !== '' && !isValidQuantity(line.quantity);
          const points = pointsByLine.get(line.key);
          return (
            <Box
              key={line.key}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'minmax(0,1.2fr) minmax(0,1.5fr) 90px 80px 40px' },
                gap: 1,
                alignItems: 'start',
                pb: { xs: 1.5, sm: 0 },
                borderBottom: { xs: idx < lines.length - 1 ? 1 : 0, sm: 0 },
                borderColor: 'divider',
              }}
            >
              <Autocomplete
                size="small"
                sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}
                options={types}
                groupBy={(t) => t.groupName}
                getOptionLabel={(t) => t.productType}
                isOptionEqualToValue={(a, b) => a.productType === b.productType}
                value={type ?? null}
                onChange={(_, t) => onType(line.key, t?.productType ?? null)}
                renderOption={(props, t) => (
                  <li {...props} key={t.productType}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                      <span>{t.productType}</span>
                      <Typography variant="caption" color="text.secondary">
                        {t.groupActive ? `${t.products.length} รายการ` : 'พักการให้แต้ม'}
                      </Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => <TextField {...params} label="ยี่ห้อ/ประเภท" />}
              />
              <Autocomplete
                size="small"
                sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}
                disabled={!type}
                options={type?.products ?? []}
                getOptionLabel={(p) => p.productName}
                isOptionEqualToValue={(a, b) => a.productId === b.productId}
                value={product}
                onChange={(_, p) => onChange(line.key, { productId: p?.productId ?? null })}
                renderOption={(props, p) => (
                  <li {...props} key={p.productId}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                      <span>{p.productName}</span>
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {formatBaht(p.retailPrice)} บาท
                      </Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="สินค้า"
                    helperText={product ? `ราคาขายปลีก ${formatBaht(product.retailPrice)} บาท` : undefined}
                  />
                )}
              />
              <TextField
                size="small"
                label="จำนวน"
                value={line.quantity}
                onChange={(e) => onChange(line.key, { quantity: e.target.value.replace(/[^\d]/g, '') })}
                inputProps={{ inputMode: 'numeric' }}
                error={qtyError}
                helperText={qtyError ? `1 – ${formatPoints(MAX_ITEM_QUANTITY)}` : undefined}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minHeight: 40 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, whiteSpace: 'nowrap', color: points ? 'success.main' : 'text.secondary' }}
                >
                  {points === undefined ? '–' : `+${formatPoints(points)}`} แต้ม
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minHeight: 40 }}>
                <IconButton size="small" onClick={() => onRemove(line.key)} title="ลบรายการ">
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          );
        })}

        <Box>
          <Button size="small" startIcon={<AddIcon />} onClick={onAdd}>
            เพิ่มรายการ
          </Button>
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              คิดตามราคาขายปลีก ไม่มีส่วนลด (สูตรเดียวกับการซื้อที่ POS)
            </Typography>
            {total !== null && total !== lineSum && (
              <Typography variant="caption" color="text.secondary">
                รวมเศษแต้มของทุกรายการก่อนปัดลง
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {calcLoading && <CircularProgress size={16} />}
            <Typography variant="h6" sx={{ whiteSpace: 'nowrap' }}>
              รวม <b>{total === null ? '–' : formatPoints(total)}</b> แต้ม
            </Typography>
          </Box>
        </Box>

        {calcError && <Alert severity="error">{calcError}</Alert>}
        {note && (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={onUseManual}>
                กำหนดเอง
              </Button>
            }
          >
            {note}
          </Alert>
        )}
        {total === 0 && !note && !calcLoading && (
          <Alert severity="info">สินค้าที่เลือกไม่ได้แต้ม (ไม่อยู่ในกลุ่มที่ให้แต้ม หรือกลุ่มพักการให้แต้ม)</Alert>
        )}
        {total !== null && total > MAX_POINT_DELTA && (
          <Alert severity="error">เพิ่มได้ไม่เกิน {formatPoints(MAX_POINT_DELTA)} แต้มต่อครั้ง</Alert>
        )}
      </Box>
    </Paper>
  );
};
