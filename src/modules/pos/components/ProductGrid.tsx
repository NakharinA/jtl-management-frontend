import { Box, CircularProgress, Grid, Typography } from '@mui/material';
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

  return (
    <Grid container spacing={1.5} sx={{ alignContent: 'flex-start' }}>
      {products.map((product) => (
        <Grid item xs={6} sm={4} md={3} key={product.id}>
          <POSProductCard
            product={product}
            onAddToCart={onAddToCart}
            disabled={disabled}
          />
        </Grid>
      ))}
    </Grid>
  );
};
