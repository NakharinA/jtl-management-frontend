import { useState, useMemo, useRef, ChangeEvent } from 'react';
import {
    Autocomplete,
    Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
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
  Tooltip,
  Typography,
} from '@mui/material';
import { Layout } from '@/shared/components/Layout';
import { useProducts } from '@/modules/product/hooks/useProducts';
import { Product, PriceLog, CreateProductPayload } from '@/modules/product/types';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InventoryIcon from '@mui/icons-material/Inventory';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadService } from '@/services/upload.service';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS = [
  '#1976d2', '#388e3c', '#f57c00', '#7b1fa2',
  '#c62828', '#00796b', '#0288d1', '#558b2f',
  '#ad1457', '#4527a0',
];

const EMPTY_FORM = {
  productName: '',
  productType: '',
  productCost: '',
  wholesalePrice: '',
  retailPrice: '',
  barcode: '',
  productAttribute: '',
  imageUrl: '',
};

// ─── ProductCard ──────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onViewLogs: (p: Product) => void;
}

const ProductCard = ({ product, onEdit, onDelete, onViewLogs }: ProductCardProps) => {
  const [wholesaleRevealed, setWholesaleRevealed] = useState(false);

  return (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Box
      sx={{
        height: 160,
        bgcolor: 'grey.100',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.productName}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <InventoryIcon sx={{ fontSize: 56, color: 'grey.400' }} />
      )}
    </Box>

    <CardContent sx={{ flexGrow: 1, pb: 0 }}>
      <Typography variant="subtitle1" fontWeight={600} noWrap title={product.productName}>
        {product.productName}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
        บาร์โค้ด: {product.barcode}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 0.25, mt: 1 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          onClick={() => setWholesaleRevealed((v) => !v)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            filter: wholesaleRevealed ? 'none' : 'blur(4px)',
            userSelect: 'none',
            transition: 'filter 0.2s',
          }}
        >
          ส่ง​ : {product.wholesalePrice.toLocaleString()} ฿
        </Typography>
        <Typography variant="h6" fontWeight={1000} color="primary.main">
          {product.retailPrice.toLocaleString()} ฿
        </Typography>
      </Box>

      {Object.keys(product.productAttribute).length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
          {Object.entries(product.productAttribute).slice(0, 3).map(([k, v]) => (
            <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined" />
          ))}
          {Object.keys(product.productAttribute).length > 3 && (
            <Chip label={`+${Object.keys(product.productAttribute).length - 3}`} size="small" />
          )}
        </Box>
      )}
    </CardContent>

    <CardActions sx={{ justifyContent: 'flex-end', pt: 0.5 }}>
      <Tooltip title="ประวัติราคา">
        <IconButton size="small" color="info" onClick={() => onViewLogs(product)}>
          <HistoryIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="แก้ไข">
        <IconButton size="small" color="primary" onClick={() => onEdit(product)}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="ลบ">
        <IconButton size="small" color="error" onClick={() => onDelete(product.id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </CardActions>
  </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const ProductPage = () => {
  const { products, isLoading, createProduct, updateProduct, deleteProduct, getPriceLogs } =
    useProducts();

  // View navigation
  const [view, setView] = useState<'categories' | 'products'>('categories');
  const [selectedType, setSelectedType] = useState('');

  // Pagination + search
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [searchQuery, setSearchQuery] = useState('');

  // Product form dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Price log dialog
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [priceLogs, setPriceLogs] = useState<PriceLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedProductName, setSelectedProductName] = useState('');

  // ── Derived data ────────────────────────────────────────────────────────────

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => map.set(p.productType, (map.get(p.productType) || 0) + 1));
    return Array.from(map.entries()).map(([type, count], idx) => ({ type, count, colorIndex: idx }));
  }, [products]);

  const existingTypes = useMemo(
    () => Array.from(new Set(products.map((p) => p.productType))).sort(),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const inType = products.filter((p) => p.productType === selectedType);
    if (!searchQuery.trim()) return inType;
    return inType.filter((p) =>
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [products, selectedType, searchQuery]);

  const paginatedProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleSelectCategory = (type: string) => {
    setSelectedType(type);
    setSearchQuery('');
    setPage(0);
    setView('products');
  };

  const handleBackToCategories = () => {
    setView('categories');
    setSelectedType('');
    setSearchQuery('');
    setPage(0);
  };

  // ── Form helpers ────────────────────────────────────────────────────────────

  const handleOpenCreate = (prefilledType?: string) => {
    setEditingProduct(null);
    setFormData({ ...EMPTY_FORM, productType: prefilledType ?? '' });
    setImageFile(null);
    setImagePreview('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      productName: product.productName,
      productType: product.productType,
      productCost: product.productCost.toString(),
      wholesalePrice: product.wholesalePrice.toString(),
      retailPrice: product.retailPrice.toString(),
      barcode: product.barcode,
      productAttribute: Object.keys(product.productAttribute).length
        ? JSON.stringify(product.productAttribute, null, 2)
        : '',
      imageUrl: product.imageUrl ?? '',
    });
    setImageFile(null);
    setImagePreview(product.imageUrl ?? '');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData((f) => ({ ...f, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    let parsedAttributes: Record<string, string> = {};
    try {
      if (formData.productAttribute.trim()) {
        parsedAttributes = JSON.parse(formData.productAttribute);
      }
    } catch {
      alert('คุณสมบัติสินค้า (JSON) ไม่ถูกต้อง');
      return;
    }

    setSubmitting(true);
    try {
      let finalImageUrl = formData.imageUrl;

      if (imageFile) {
        finalImageUrl = await uploadService.uploadImage(imageFile, 'products');
      }

      const payload: CreateProductPayload = {
        productName: formData.productName,
        productType: formData.productType,
        productCost: parseFloat(formData.productCost),
        wholesalePrice: parseFloat(formData.wholesalePrice),
        retailPrice: parseFloat(formData.retailPrice),
        barcode: formData.barcode,
        productAttribute: parsedAttributes,
        imageUrl: finalImageUrl || undefined,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
        setPage(0);
      }
      handleCloseDialog();
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?')) {
      deleteProduct(id).catch(() => alert('ลบสินค้าไม่สำเร็จ'));
    }
  };

  const handleViewLogs = async (product: Product) => {
    setSelectedProductName(product.productName);
    setPriceLogs([]);
    setLogDialogOpen(true);
    setLogsLoading(true);
    try {
      const logs = await getPriceLogs(product.id);
      setPriceLogs(logs);
    } catch {
      alert('โหลดประวัติราคาไม่สำเร็จ');
    } finally {
      setLogsLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <Box>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : view === 'categories' ? (
          // ────────────────────────────────── Category View ──────────────────
          <>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Typography variant="h4" component="h1">
                จัดการสินค้า
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenCreate()}
              >
                เพิ่มสินค้า
              </Button>
            </Box>

            {categories.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <InventoryIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
                <Typography color="text.secondary">
                  ยังไม่มีสินค้า คลิก "เพิ่มสินค้า" เพื่อเริ่มต้น
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {categories.map(({ type, count, colorIndex }) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={type}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { boxShadow: 6, transform: 'translateY(-3px)' },
                      }}
                      onClick={() => handleSelectCategory(type)}
                    >
                      <Box
                        sx={{
                          bgcolor: CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length],
                          height: 90,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <InventoryIcon sx={{ fontSize: 44, color: 'white' }} />
                      </Box>
                      <CardContent>
                        <Typography variant="h6" fontWeight={600} noWrap>
                          {type}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {count} สินค้า
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        ) : (
          // ────────────────────────────────── Product Grid View ──────────────
          <>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="กลับ">
                  <IconButton onClick={handleBackToCategories}>
                    <ArrowBackIcon />
                  </IconButton>
                </Tooltip>
                <Box>
                  <Typography variant="h4" component="h1">
                    {selectedType}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filteredProducts.length} สินค้า
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenCreate(selectedType)}
              >
                เพิ่มสินค้า
              </Button>
            </Box>

            {/* Search bar */}
            <TextField
              fullWidth
              placeholder="ค้นหาชื่อสินค้า..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            {paginatedProducts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography color="text.secondary">ไม่พบสินค้าที่ตรงกับการค้นหา</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {paginatedProducts.map((product) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                    <ProductCard
                      product={product}
                      onEdit={handleOpenEdit}
                      onDelete={handleDelete}
                      onViewLogs={handleViewLogs}
                    />
                  </Grid>
                ))}
              </Grid>
            )}

            <TablePagination
              component="div"
              count={filteredProducts.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[8, 16, 32]}
              labelRowsPerPage="ต่อหน้า:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} จาก ${count}`}
              sx={{ mt: 2 }}
            />
          </>
        )}

        {/* ── Product Form Dialog ──────────────────────────────────────────── */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</DialogTitle>
          <DialogContent>
            {/* Image upload / preview */}
            <Box sx={{ mt: 1, mb: 1 }}>
              <Box
                sx={{
                  width: '100%',
                  height: 180,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  border: '1px dashed',
                  borderColor: 'grey.400',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  mb: 1,
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                    <CloudUploadIcon sx={{ fontSize: 40, mb: 0.5 }} />
                    <Typography variant="body2">คลิกเพื่ออัปโหลดรูปภาพ</Typography>
                  </Box>
                )}
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              {imagePreview && (
                <Button size="small" color="error" onClick={handleRemoveImage}>
                  ลบรูปภาพ
                </Button>
              )}
            </Box>

            <TextField
              fullWidth
              label="ชื่อสินค้า"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              margin="normal"
              autoFocus
            />
            <Autocomplete
              freeSolo
              options={existingTypes}
              value={formData.productType}
              onChange={(_, value) => setFormData({ ...formData, productType: value ?? '' })}
              onInputChange={(_, value) => setFormData({ ...formData, productType: value })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="ประเภทสินค้า"
                  margin="normal"
                  placeholder="เลือกหรือพิมพ์ประเภทใหม่"
                />
              )}
            />
            <TextField
              fullWidth
              label="บาร์โค้ด"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="ราคาทุน (฿)"
              type="number"
              value={formData.productCost}
              onChange={(e) => setFormData({ ...formData, productCost: e.target.value })}
              margin="normal"
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              fullWidth
              label="ราคาส่ง (฿)"
              type="number"
              value={formData.wholesalePrice}
              onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
              margin="normal"
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              fullWidth
              label="ราคาปลีก (฿)"
              type="number"
              value={formData.retailPrice}
              onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
              margin="normal"
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              fullWidth
              label='คุณสมบัติสินค้า (JSON เช่น {"color":"black"})'
              value={formData.productAttribute}
              onChange={(e) => setFormData({ ...formData, productAttribute: e.target.value })}
              margin="normal"
              multiline
              minRows={3}
              placeholder='{"color": "black", "weight": "200g"}'
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={submitting}>
              ยกเลิก
            </Button>
            <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <CircularProgress size={20} /> : editingProduct ? 'บันทึก' : 'เพิ่ม'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Price Log Dialog ─────────────────────────────────────────────── */}
        <Dialog
          open={logDialogOpen}
          onClose={() => setLogDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>ประวัติราคา — {selectedProductName}</DialogTitle>
          <DialogContent>
            {logsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : priceLogs.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                ไม่พบประวัติราคา
              </Typography>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>วันที่</TableCell>
                      <TableCell>การกระทำ</TableCell>
                      <TableCell align="right">ทุนเก่า</TableCell>
                      <TableCell align="right">ทุนใหม่</TableCell>
                      <TableCell align="right">ราคาส่งเก่า</TableCell>
                      <TableCell align="right">ราคาส่งใหม่</TableCell>
                      <TableCell align="right">ราคาปลีกเก่า</TableCell>
                      <TableCell align="right">ราคาปลีกใหม่</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {priceLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.changedAt).toLocaleString('th-TH')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.action === 'create' ? 'สร้าง' : 'แก้ไข'}
                            size="small"
                            color={log.action === 'create' ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {log.previousCost != null
                            ? `${log.previousCost.toLocaleString()} ฿`
                            : '-'}
                        </TableCell>
                        <TableCell align="right">{log.newCost.toLocaleString()} ฿</TableCell>
                        <TableCell align="right">
                          {log.previousWholesalePrice != null
                            ? `${log.previousWholesalePrice.toLocaleString()} ฿`
                            : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {log.newWholesalePrice.toLocaleString()} ฿
                        </TableCell>
                        <TableCell align="right">
                          {log.previousRetailPrice != null
                            ? `${log.previousRetailPrice.toLocaleString()} ฿`
                            : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {log.newRetailPrice.toLocaleString()} ฿
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLogDialogOpen(false)}>ปิด</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default ProductPage;
