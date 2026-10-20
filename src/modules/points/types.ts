export const POINT_REASON_MAX_LENGTH = 200;
export const MAX_POINT_DELTA = 100000;

export type PointTransactionType = 'manual' | 'purchase' | 'redemption' | 'refund';

export const POINT_TRANSACTION_TYPE_LABEL: Record<PointTransactionType, string> = {
  manual: 'ปรับโดยพนักงาน',
  purchase: 'ซื้อสินค้า',
  redemption: 'แลกของรางวัล',
  refund: 'คืนแต้ม',
};

export interface PointTransaction {
  id: string;
  memberId: string;
  /** Positive = points added, negative = points removed */
  delta: number;
  balanceAfter: number;
  reason: string | null;
  type?: PointTransactionType;
  createdBy: string | null;
  createdAt: string;
  /** Present on the cross-member list (GET /points/transactions) */
  member?: { id: string; name: string; phone: string };
}

export interface MemberPointHistory {
  items: PointTransaction[];
  total: number;
  balance: number;
}

export interface PointTransactionList {
  items: PointTransaction[];
  total: number;
}

export interface AdjustPointsResult {
  balance: number;
  transaction: PointTransaction;
}
