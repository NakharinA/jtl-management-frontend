import { useEffect, useState } from 'react';

/** Returns `value` once it has stopped changing for `ms` milliseconds. */
export const useDebounced = <T,>(value: T, ms = 300): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
};
