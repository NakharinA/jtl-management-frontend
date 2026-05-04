import { Box, Card, CardActionArea, CardContent, Chip, Typography } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Product } from '../../product/types';

interface Props {
  product: Product;
  onAddToCart: (product: Product) => void;
  disabled?: boolean;
}

const LOW_STOCK_THRESHOLD = 5;

export const POSProductCard = ({ product, onAddToCart, disabled }: Props) => {
  const isLowStock =
    product.stock !== undefined && product.stock < LOW_STOCK_THRESHOLD;
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        opacity: isOutOfStock ? 0.5 : 1,
        transition: 'transform 0.1s, box-shadow 0.1s',
        '&:hover': !isOutOfStock
          ? { transform: 'translateY(-2px)', boxShadow: 4 }
          : {},
      }}
    >
      <CardActionArea
        disabled={disabled || isOutOfStock}
        onClick={() => onAddToCart(product)}
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        {/* Product Image */}
        <Box
          sx={{
            height: 120,
            bgcolor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.productName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <InventoryIcon sx={{ fontSize: 48, color: 'grey.400' }} />
          )}
          {isOutOfStock && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" color="white" fontWeight={700}>
                หมดสต็อก
              </Typography>
            </Box>
          )}
        </Box>

        {/* Card Content */}
        <CardContent sx={{ flexGrow: 1, p: 1.5, pb: '12px !important' }}>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            title={product.productName}
            sx={{ mb: 0.5 }}
          >
            {product.productName}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
            <Chip
              label={`฿${product.retailPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
              size="small"
              color="primary"
              sx={{ fontWeight: 700, fontSize: '0.75rem' }}
            />
            {isLowStock && !isOutOfStock && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <WarningAmberIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                <Typography variant="caption" color="warning.main">
                  เหลือ {product.stock}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
