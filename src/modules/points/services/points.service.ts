import { apiClient } from '../../../services/api.client';
import { AdjustPointsResult, MemberPointHistory, PointTransactionList } from '../types';

export const pointsService = {
  adjust: async (memberId: string, delta: number, reason?: string): Promise<AdjustPointsResult> => {
    const body: { delta: number; reason?: string } = { delta };
    if (reason?.trim()) body.reason = reason.trim();
    return apiClient.post<AdjustPointsResult>(`/members/${memberId}/points/adjust`, body);
  },

  memberHistory: async (memberId: string, page: number, pageSize: number): Promise<MemberPointHistory> => {
    return apiClient.get<MemberPointHistory>(`/members/${memberId}/points/transactions`, {
      page: String(page),
      pageSize: String(pageSize),
    });
  },

  recent: async (search: string, page: number, pageSize: number): Promise<PointTransactionList> => {
    const params: Record<string, string> = { page: String(page), pageSize: String(pageSize) };
    if (search.trim()) params.search = search.trim();
    return apiClient.get<PointTransactionList>('/points/transactions', params);
  },
};

/** Maps backend (English) point errors to Thai for display; unknown messages pass through. */
export const toThaiPointsError = (err: unknown, fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่'): string => {
  const msg = err instanceof Error ? err.message : '';
  if (!msg) return fallback;
  const notEnough = msg.match(/Not enough points: the member has (\d+) points/i);
  if (notEnough) return `แต้มไม่พอ สมาชิกมีแต้มคงเหลือ ${Number(notEnough[1]).toLocaleString('th-TH')} แต้ม`;
  if (/delta must not be 0/i.test(msg)) return 'จำนวนแต้มต้องมากกว่า 0';
  if (/delta must be between/i.test(msg)) return 'จำนวนแต้มต่อครั้งต้องไม่เกิน 100,000 แต้ม';
  if (/delta must be an integer/i.test(msg)) return 'จำนวนแต้มต้องเป็นจำนวนเต็ม';
  if (/reason must be at most/i.test(msg)) return 'เหตุผลยาวเกิน 200 ตัวอักษร';
  if (/not found/i.test(msg)) return 'ไม่พบสมาชิก (อาจถูกลบไปแล้ว)';
  return msg;
};
