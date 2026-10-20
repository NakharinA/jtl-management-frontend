import { Box, CircularProgress, Typography } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { Product } from '../../product/types';
import { POSProductCard } from './POSProductCard';

interface Props {
  products: Product[];
  isLoading: boolean;
  onAddToCart: (product: Product) => void;
  disabled?: boolean;
}

export const ProductGrid = ({ products, isLoading, onAddToCart, disabled }: Props) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, pt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (products.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 8, color: 'text.secondary' }}>
        <SearchOffIcon sx={{ fontSize: 64, mb: 1, color: 'grey.300' }} />
        <Typography variant="body1">ไม่พบสินค้า</Typography>
      </Box>
    );
  }

  // Columns follow the panel width (not the viewport), so the grid stays tidy
  // whether the cart sits beside it, the nav drawer is open, or on a phone.
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(auto-fill, minmax(140px, 1fr))',
          sm: 'repeat(auto-fill, minmax(150px, 1fr))',
          xl: 'repeat(auto-fill, minmax(170px, 1fr))',
        },
        gap: 1.5,
        alignContent: 'flex-start',
        pb: 0.5,
      }}
    >
      {products.map((product) => (
        <POSProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          disabled={disabled}
        />
      ))}
    </Box>
  );
};
