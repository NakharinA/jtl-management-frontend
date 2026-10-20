import { apiClient } from '../../../services/api.client';
import {
  DeleteMemberResult,
  Member,
  MemberDetail,
  MemberListParams,
  MemberListResult,
  MemberNote,
  MemberPayload,
} from '../types';

export const memberService = {
  list: async ({ search, type, page, pageSize }: MemberListParams): Promise<MemberListResult> => {
    const params: Record<string, string> = { page: String(page), pageSize: String(pageSize) };
    if (search?.trim()) params.search = search.trim();
    if (type) params.type = type;
    return apiClient.get<MemberListResult>('/members', params);
  },

  getById: async (id: string): Promise<MemberDetail> => {
    return apiClient.get<MemberDetail>(`/members/${id}`);
  },

  create: async (data: MemberPayload): Promise<Member> => {
    return apiClient.post<Member>('/members', data);
  },

  update: async (id: string, data: MemberPayload): Promise<Member> => {
    return apiClient.patch<Member>(`/members/${id}`, data);
  },

  delete: async (id: string): Promise<DeleteMemberResult> => {
    return apiClient.delete<DeleteMemberResult>(`/members/${id}`);
  },

  addNote: async (memberId: string, note: string): Promise<MemberNote> => {
    return apiClient.post<MemberNote>(`/members/${memberId}/notes`, { note });
  },

  updateNote: async (memberId: string, noteId: string, note: string): Promise<MemberNote> => {
    return apiClient.patch<MemberNote>(`/members/${memberId}/notes/${noteId}`, { note });
  },

  deleteNote: async (memberId: string, noteId: string): Promise<void> => {
    await apiClient.delete(`/members/${memberId}/notes/${noteId}`);
  },
};

/** Maps backend (English) error messages to Thai for display; unknown messages pass through. */
export const toThaiMemberError = (err: unknown, fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่'): string => {
  const msg = err instanceof Error ? err.message : '';
  if (!msg) return fallback;
  if (/already exists/i.test(msg)) return 'เบอร์โทรศัพท์นี้เป็นสมาชิกอยู่แล้ว';
  if (/phone must be/i.test(msg)) return 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0';
  if (/shopName is required/i.test(msg)) return 'กรุณาระบุชื่อร้านค้า';
  if (/taxId.*required|taxId must be/i.test(msg)) return 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก';
  if (/name is required/i.test(msg)) return 'กรุณาระบุชื่อ';
  if (/note is required/i.test(msg)) return 'กรุณาระบุบันทึก';
  if (/note must be at most/i.test(msg)) return 'บันทึกยาวเกิน 500 ตัวอักษร';
  if (/purchase history/i.test(msg)) {
    return 'ไม่สามารถลบได้ เนื่องจากสมาชิกมีประวัติการซื้อ/ใบเสร็จแล้ว แนะนำให้เก็บสมาชิกไว้เพื่อรักษาประวัติ';
  }
  if (/not found/i.test(msg)) return 'ไม่พบข้อมูล (อาจถูกลบไปแล้ว)';
  return msg;
};
