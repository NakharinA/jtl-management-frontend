import { Box, IconButton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { CartItem } from '../types';

interface Props {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  disabled?: boolean;
}

export const CartItemRow = ({ item, onUpdateQuantity, onRemove, disabled }: Props) => {
  const lineTotal = item.quantity * item.unitPrice;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      {/* Name + unit price */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap title={item.productName}>
          {item.productName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ฿{item.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </Typography>
      </Box>

      {/* Quantity controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        <IconButton
          size="small"
          disabled={disabled}
          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
          sx={{ p: 0.5, minWidth: 32, minHeight: 32 }}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{ minWidth: 28, textAlign: 'center' }}
        >
          {item.quantity}
        </Typography>
        <IconButton
          size="small"
          disabled={disabled}
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
          sx={{ p: 0.5, minWidth: 32, minHeight: 32 }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Line total */}
      <Typography
        variant="body2"
        fontWeight={700}
        sx={{ minWidth: 72, textAlign: 'right', flexShrink: 0 }}
      >
        ฿{lineTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
      </Typography>

      {/* Remove */}
      <IconButton
        size="small"
        disabled={disabled}
        onClick={() => onRemove(item.productId)}
        sx={{ p: 0.5, color: 'error.main', flexShrink: 0 }}
      >
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};
