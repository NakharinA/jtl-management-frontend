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

// Bigger hit areas on touch screens (iPad) without changing the desktop look.
const iconButtonSx = {
  p: 0.5,
  minWidth: 32,
  minHeight: 32,
  '@media (pointer: coarse)': { minWidth: 40, minHeight: 40 },
};

export const CartItemRow = ({ item, onUpdateQuantity, onRemove, disabled }: Props) => {
  const lineTotal = item.quantity * item.unitPrice;

  return (
    <Box
      sx={{
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      {/* Name: full width, up to 2 lines so long Thai names stay readable in a narrow cart */}
      <Typography
        variant="body2"
        fontWeight={600}
        title={item.productName}
        sx={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          overflowWrap: 'anywhere',
        }}
      >
        {item.productName}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
        {/* Unit price */}
        <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1, minWidth: 48 }}>
          ฿{item.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </Typography>

        {/* Quantity controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
          <IconButton
            size="small"
            disabled={disabled}
            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
            sx={iconButtonSx}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{ minWidth: 26, textAlign: 'center' }}
          >
            {item.quantity}
          </Typography>
          <IconButton
            size="small"
            disabled={disabled}
            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
            sx={iconButtonSx}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Line total */}
        <Typography
          variant="body2"
          fontWeight={700}
          noWrap
          sx={{ minWidth: 64, textAlign: 'right', flexShrink: 0 }}
        >
          ฿{lineTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </Typography>

        {/* Remove */}
        <IconButton
          size="small"
          disabled={disabled}
          onClick={() => onRemove(item.productId)}
          sx={{ ...iconButtonSx, color: 'error.main', flexShrink: 0 }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};
