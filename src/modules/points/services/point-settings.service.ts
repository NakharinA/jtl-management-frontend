import { apiClient } from '../../../services/api.client';
import {
  PointGroup,
  PointGroupInput,
  PointPreview,
  PointProductType,
  PointSettings,
  PointSummary,
} from '../types';

export const pointSettingsService = {
  getSettings: () => apiClient.get<PointSettings>('/points/settings'),

  updateSettings: (input: { pointValueBaht?: number; shopCustomersEarn?: boolean }) =>
    apiClient.put<PointSettings>('/points/settings', input),

  listGroups: () => apiClient.get<PointGroup[]>('/points/groups'),

  createGroup: (input: Required<Pick<PointGroupInput, 'name' | 'earnSharePercent' | 'defaultMarginPercent'>>) =>
    apiClient.post<PointGroup>('/points/groups', input),

  updateGroup: (id: number, input: PointGroupInput) => apiClient.patch<PointGroup>(`/points/groups/${id}`, input),

  deleteGroup: (id: number) => apiClient.delete<{ deleted: true }>(`/points/groups/${id}`),

  setGroupProductTypes: (id: number, productTypes: string[]) =>
    apiClient.put<PointGroup>(`/points/groups/${id}/product-types`, { productTypes }),

  listProductTypes: () => apiClient.get<PointProductType[]>('/points/product-types'),

  preview: (groupId?: number) =>
    apiClient.get<PointPreview>('/points/preview', groupId ? { groupId: String(groupId) } : undefined),

  summary: () => apiClient.get<PointSummary>('/points/summary'),
};

/** Maps backend (English) settings errors to Thai; unknown messages pass through. */
export const toThaiPointSettingsError = (err: unknown, fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่'): string => {
  const msg = err instanceof Error ? err.message : '';
  if (!msg) return fallback;
  if (/already exists/i.test(msg)) return 'มีกลุ่มชื่อนี้อยู่แล้ว';
  if (/pointValueBaht/i.test(msg)) return 'มูลค่าแต้มต้องมากกว่า 0';
  if (/earnSharePercent/i.test(msg)) return 'สัดส่วนคืนกำไรต้องอยู่ระหว่าง 0–100%';
  if (/defaultMarginPercent/i.test(msg)) return 'กำไรเริ่มต้นต้องอยู่ระหว่าง 0–100%';
  if (/name must/i.test(msg) || /name is required/i.test(msg)) return 'กรุณากรอกชื่อกลุ่ม (ไม่เกิน 100 ตัวอักษร)';
  if (/not found/i.test(msg)) return 'ไม่พบกลุ่ม (อาจถูกลบไปแล้ว)';
  return msg;
};
