export const PRIZE_NAME_MAX_LENGTH = 200;
export const PRIZE_DESCRIPTION_MAX_LENGTH = 2000;
export const REDEMPTION_NOTE_MAX_LENGTH = 500;

export interface Prize {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  pointsCost: number;
  /** null = unlimited */
  stock: number | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  counts: { requested: number; approved: number; delivered: number };
}

export interface PrizePayload {
  name: string;
  description: string | null;
  imageUrl: string | null;
  pointsCost: number;
  stock: number | null;
  active: boolean;
  sortOrder: number;
}

export type RedemptionStatus = 'requested' | 'approved' | 'delivered' | 'rejected' | 'cancelled';

export const REDEMPTION_STATUS_LABEL: Record<RedemptionStatus, string> = {
  requested: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  delivered: 'รับของแล้ว',
  rejected: 'ปฏิเสธ',
  cancelled: 'ยกเลิก',
};

export const REDEMPTION_STATUS_COLOR: Record<
  RedemptionStatus,
  'warning' | 'info' | 'success' | 'error' | 'default'
> = {
  requested: 'warning',
  approved: 'info',
  delivered: 'success',
  rejected: 'error',
  cancelled: 'default',
};

export interface Redemption {
  id: string;
  memberId: string;
  member: { id: string; name: string; phone: string; points: number };
  prizeId: number;
  prizeName: string;
  prizeImageUrl: string | null;
  pointsCost: number;
  status: RedemptionStatus;
  /** "line" when the member asked from LINE, otherwise the staff email */
  requestedBy: string | null;
  note: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RedemptionListParams {
  statuses?: RedemptionStatus[];
  memberId?: string;
  search?: string;
  page: number; // 1-based
  pageSize: number;
}

export interface RedemptionListResult {
  items: Redemption[];
  total: number;
  counts: Record<RedemptionStatus, number>;
}

export interface CreateRedemptionPayload {
  memberId: string;
  prizeId: number;
  note?: string;
  /** Hand the prize over now: create as approved instead of waiting for approval */
  approve?: boolean;
}

export type RedemptionAction = 'approve' | 'deliver' | 'reject' | 'cancel';
