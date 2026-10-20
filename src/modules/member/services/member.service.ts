import { ApiError, apiClient } from '../../../services/api.client';
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

export type MemberErrorAction = 'load' | 'save' | 'delete' | 'note';

/** Thai text for a 400 validation message; null when it is not recognised. */
const validationMessage = (msg: string): string | null => {
  if (/phone must be|phone is required/i.test(msg)) return 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0';
  if (/shopName is required/i.test(msg)) return 'กรุณาระบุชื่อร้านค้า';
  if (/taxId must be/i.test(msg)) return 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก (หรือเว้นว่าง)';
  if (/name is required/i.test(msg)) return 'กรุณาระบุชื่อ';
  if (/note is required/i.test(msg)) return 'กรุณาระบุบันทึก';
  if (/note must be at most/i.test(msg)) return 'บันทึกยาวเกิน 500 ตัวอักษร';
  if (/must be at most \d+ characters/i.test(msg)) return 'ข้อความยาวเกินกำหนด';
  return null;
};

/**
 * Thai error text for member API failures. Decides by HTTP status
 * (ApiError.status) first; the English message is only used to pick the
 * field for 400 validation errors, and as a last-resort fallback.
 */
export const toThaiMemberError = (
  err: unknown,
  fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่',
  action: MemberErrorAction = 'save',
): string => {
  const msg = err instanceof Error ? err.message : '';
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return validationMessage(msg) ?? (msg || 'ข้อมูลไม่ถูกต้อง');
      case 401:
        return 'หมดเวลาการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่';
      case 403:
        return 'ไม่มีสิทธิ์ทำรายการนี้';
      case 404:
        return 'ไม่พบข้อมูล (อาจถูกลบไปแล้ว)';
      case 409:
        // 409 on delete = member has purchase history; on save = duplicate phone
        return action === 'delete' || /purchase history/i.test(msg)
          ? 'ไม่สามารถลบได้ เนื่องจากสมาชิกมีประวัติการซื้อ/ใบเสร็จแล้ว แนะนำให้เก็บสมาชิกไว้เพื่อรักษาประวัติ'
          : 'เบอร์โทรศัพท์นี้เป็นสมาชิกอยู่แล้ว';
      default:
        if (err.status >= 500) return 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง';
    }
  } else if (err instanceof TypeError) {
    // fetch() rejects with a TypeError when the server cannot be reached
    return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต';
  }
  // Fallback: message matching for errors without a usable status
  if (!msg) return fallback;
  if (/already exists/i.test(msg)) return 'เบอร์โทรศัพท์นี้เป็นสมาชิกอยู่แล้ว';
  if (/purchase history/i.test(msg)) {
    return 'ไม่สามารถลบได้ เนื่องจากสมาชิกมีประวัติการซื้อ/ใบเสร็จแล้ว แนะนำให้เก็บสมาชิกไว้เพื่อรักษาประวัติ';
  }
  if (/not found/i.test(msg)) return 'ไม่พบข้อมูล (อาจถูกลบไปแล้ว)';
  return validationMessage(msg) ?? msg;
};
