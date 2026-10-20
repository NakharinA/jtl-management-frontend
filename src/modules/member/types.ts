export type CustomerType = 'person' | 'shop';

export const CUSTOMER_TYPE_LABEL: Record<CustomerType, string> = {
  person: 'บุคคล',
  shop: 'ร้านค้า',
};

export const DEFAULT_BRANCH = 'สำนักงานใหญ่';
export const NOTE_MAX_LENGTH = 500;

export interface Member {
  id: string;
  name: string;
  phone: string;
  customerType: CustomerType;
  shopName: string | null;
  taxId: string | null;
  branch: string | null;
  address: string | null;
  points: number;
  lineLinked: boolean;
  lineDisplayName: string | null;
  linePictureUrl: string | null;
  consentAt: string | null;
  createdAt: string;
  updatedAt: string;
  noteCount: number;
  latestNote?: string;
}

export interface MemberNote {
  id: string;
  note: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberDetail extends Member {
  notes: MemberNote[];
}

export interface MemberListParams {
  search?: string;
  type?: CustomerType | '';
  page: number; // 1-based
  pageSize: number;
}

export interface MemberListResult {
  items: Member[];
  total: number;
}

export interface MemberPayload {
  name: string;
  phone: string;
  customerType: CustomerType;
  shopName?: string | null;
  taxId?: string | null;
  branch?: string | null;
  address?: string | null;
}

export interface DeleteMemberResult {
  id: string;
  deleted: true;
  lineLinked: boolean;
  message: string;
}
