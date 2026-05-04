import { Box, Typography } from '@mui/material';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { CartItem } from '../types';
import { CartItemRow } from './CartItemRow';

interface Props {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  disabled?: boolean;
}

export const CartPanel = ({ items, onUpdateQuantity, onRemove, disabled }: Props) => {
  if (items.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
          py: 4,
        }}
      >
        <ShoppingCartOutlinedIcon sx={{ fontSize: 56, mb: 1, color: 'grey.300' }} />
        <Typography variant="body2">ยังไม่มีสินค้าในตะกร้า</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
      {items.map((item) => (
        <CartItemRow
          key={item.productId}
          item={item}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemove}
          disabled={disabled}
        />
      ))}
    </Box>
  );
};
