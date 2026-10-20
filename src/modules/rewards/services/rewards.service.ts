import { ApiError, apiClient } from '../../../services/api.client';
import {
  CreateRedemptionPayload,
  Prize,
  PrizePayload,
  Redemption,
  RedemptionAction,
  RedemptionListParams,
  RedemptionListResult,
} from '../types';

export const rewardsService = {
  listPrizes: async (active?: boolean): Promise<Prize[]> => {
    return apiClient.get<Prize[]>('/prizes', active === undefined ? undefined : { active: String(active) });
  },

  createPrize: async (data: PrizePayload): Promise<Prize> => {
    return apiClient.post<Prize>('/prizes', data);
  },

  updatePrize: async (id: number, data: Partial<PrizePayload>): Promise<Prize> => {
    return apiClient.patch<Prize>(`/prizes/${id}`, data);
  },

  deletePrize: async (id: number): Promise<void> => {
    await apiClient.delete(`/prizes/${id}`);
  },

  listRedemptions: async ({
    statuses,
    memberId,
    search,
    page,
    pageSize,
  }: RedemptionListParams): Promise<RedemptionListResult> => {
    const params: Record<string, string> = { page: String(page), pageSize: String(pageSize) };
    if (statuses?.length) params.status = statuses.join(',');
    if (memberId) params.memberId = memberId;
    if (search?.trim()) params.search = search.trim();
    return apiClient.get<RedemptionListResult>('/redemptions', params);
  },

  createRedemption: async (data: CreateRedemptionPayload): Promise<Redemption> => {
    return apiClient.post<Redemption>('/redemptions', data);
  },

  act: async (id: string, action: RedemptionAction, note?: string): Promise<Redemption> => {
    const body = note?.trim() ? { note: note.trim() } : {};
    return apiClient.post<Redemption>(`/redemptions/${id}/${action}`, body);
  },
};

/**
 * Thai error text for rewards API failures. Business errors (points, stock, wrong status,
 * prize in use) already come back in Thai from the API and are shown as-is.
 */
export const toThaiRewardsError = (err: unknown, fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่'): string => {
  const msg = err instanceof Error ? err.message : '';
  if (err instanceof ApiError) {
    if (err.status === 403) return 'ไม่มีสิทธิ์ทำรายการนี้';
    if (err.status >= 500) return 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง';
    if (err.status === 400) {
      if (/pointsCost/i.test(msg)) return 'แต้มที่ใช้แลกต้องเป็นจำนวนเต็มมากกว่า 0';
      if (/stock/i.test(msg)) return 'จำนวนคงเหลือต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป (หรือเว้นว่างถ้าไม่จำกัด)';
      if (/name is required/i.test(msg)) return 'กรุณาระบุชื่อของรางวัล';
      if (/must be at most/i.test(msg)) return 'ข้อความยาวเกินกำหนด';
    }
  } else if (err instanceof TypeError) {
    return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต';
  }
  return msg || fallback;
};
