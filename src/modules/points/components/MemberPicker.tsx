import { useEffect, useState } from 'react';
import { Autocomplete, Box, CircularProgress, InputAdornment, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { memberService } from '@/modules/member/services/member.service';
import { Member } from '@/modules/member/types';
import { useDebounced } from '@/shared/hooks/useDebounced';

const formatPoints = (n: number) => n.toLocaleString('th-TH');

/** Search box that looks members up by name / phone / shop name. */
export const MemberPicker = ({
  value,
  onChange,
  fullWidth = false,
  autoFocus = false,
}: {
  value: Member | null;
  onChange: (m: Member | null) => void;
  fullWidth?: boolean;
  autoFocus?: boolean;
}) => {
  const [input, setInput] = useState('');
  const debouncedInput = useDebounced(input);
  const [options, setOptions] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const search = debouncedInput.trim();
    if (!search) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    memberService
      .list({ search, page: 1, pageSize: 10 })
      .then((res) => !cancelled && setOptions(res.items))
      .catch(() => !cancelled && setOptions([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedInput]);

  return (
    <Autocomplete
      sx={fullWidth ? undefined : { maxWidth: 420, flexGrow: 1 }}
      fullWidth={fullWidth}
      size="small"
      value={value}
      options={value && !options.some((o) => o.id === value.id) ? [value, ...options] : options}
      filterOptions={(x) => x}
      getOptionLabel={(m) => `${m.name} (${m.phone})`}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      loading={loading}
      onChange={(_, m) => onChange(m)}
      inputValue={input}
      onInputChange={(_, v) => setInput(v)}
      noOptionsText={input.trim() ? 'ไม่พบสมาชิก' : 'พิมพ์ชื่อหรือเบอร์โทรเพื่อค้นหา'}
      loadingText="กำลังค้นหา..."
      renderOption={(props, m) => (
        <li {...props} key={m.id}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
            <Box>
              <Typography variant="body2">{m.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {m.phone}
                {m.shopName ? ` · ${m.shopName}` : ''}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              {formatPoints(m.points)} แต้ม
            </Typography>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          autoFocus={autoFocus}
          placeholder="ค้นหาสมาชิก: ชื่อ, เบอร์โทร หรือชื่อร้าน..."
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {loading && <CircularProgress size={18} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};
