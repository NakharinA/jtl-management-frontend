import { useCallback, useEffect, useState } from 'react';
import { CustomerType, Member } from '../types';
import { memberService, toThaiMemberError } from '../services/member.service';

const SEARCH_DEBOUNCE_MS = 300;

export const useMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearchState] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [type, setTypeState] = useState<CustomerType | ''>('');
  const [page, setPage] = useState(0); // 0-based for MUI TablePagination
  const [pageSize, setPageSizeState] = useState(10);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await memberService.list({
        search: debouncedSearch,
        type,
        page: page + 1,
        pageSize,
      });
      setMembers(data.items);
      setTotal(data.total);
    } catch (err) {
      setLoadError(toThaiMemberError(err, 'เกิดข้อผิดพลาดในการโหลดข้อมูล', 'load'));
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, type, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const setSearch = (value: string) => {
    setSearchState(value);
    setPage(0);
  };

  const setType = (value: CustomerType | '') => {
    setTypeState(value);
    setPage(0);
  };

  const setPageSize = (value: number) => {
    setPageSizeState(value);
    setPage(0);
  };

  return {
    members,
    total,
    isLoading,
    loadError,
    search,
    setSearch,
    type,
    setType,
    page,
    setPage,
    pageSize,
    setPageSize,
    refresh: load,
  };
};
