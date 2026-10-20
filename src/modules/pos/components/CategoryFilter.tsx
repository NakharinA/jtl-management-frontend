import { Box, Chip } from '@mui/material';

interface Props {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export const CategoryFilter = ({ categories, selected, onSelect }: Props) => (
  <Box
    sx={{
      display: 'flex',
      gap: 1,
      // Scroll the chips inside this row; width 0 + minWidth 100% keeps the
      // chips' combined width from widening the page (min-content = 0).
      width: 0,
      minWidth: '100%',
      flexShrink: 0,
      overflowX: 'auto',
      overflowY: 'hidden',
      pb: 0.5,
      WebkitOverflowScrolling: 'touch',
      '& .MuiChip-root': { '@media (pointer: coarse)': { height: 36 } },
      '&::-webkit-scrollbar': { height: 4 },
      '&::-webkit-scrollbar-thumb': {
        bgcolor: 'grey.300',
        borderRadius: 2,
      },
    }}
  >
    <Chip
      label="ทั้งหมด"
      color={selected === '' ? 'primary' : 'default'}
      onClick={() => onSelect('')}
      sx={{ flexShrink: 0, cursor: 'pointer' }}
    />
    {categories.map((cat) => (
      <Chip
        key={cat}
        label={cat}
        color={selected === cat ? 'primary' : 'default'}
        onClick={() => onSelect(cat)}
        sx={{ flexShrink: 0, cursor: 'pointer' }}
      />
    ))}
  </Box>
);
