import { InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const POSSearchBar = ({ value, onChange }: Props) => (
  <TextField
    fullWidth
    autoFocus
    placeholder="ค้นหาสินค้า (ชื่อ, บาร์โค้ด)"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    size="small"
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon fontSize="small" />
        </InputAdornment>
      ),
    }}
    sx={{ bgcolor: 'background.paper' }}
  />
);
