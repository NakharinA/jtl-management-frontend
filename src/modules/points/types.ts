export const POINT_REASON_MAX_LENGTH = 200;
export const MAX_POINT_DELTA = 100000;

export interface PointTransaction {
  id: string;
  memberId: string;
  /** Positive = points added, negative = points removed */
  delta: number;
  balanceAfter: number;
  reason: string | null;
  /** manual | purchase | redemption | refund (older backends omit it) */
  type?: 'manual' | 'purchase' | 'redemption' | 'refund';
  /** Set on purchase points */
  orderId?: string | null;
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

// ---------- Purchase points: settings, groups, preview, value ----------

export interface PointSettings {
  /** Prize cost in baht that 1 point represents */
  pointValueBaht: number;
  shopCustomersEarn: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface PointGroup {
  id: number;
  name: string;
  /** Share of the profit given back as points, % */
  earnSharePercent: number;
  /** Margin used for products without a cost, % */
  defaultMarginPercent: number;
  active: boolean;
  sortOrder: number;
  productTypes: string[];
  productCount: number;
}

export interface PointGroupInput {
  name?: string;
  earnSharePercent?: number;
  defaultMarginPercent?: number;
  active?: boolean;
  sortOrder?: number;
}

export interface PointProductType {
  productType: string;
  productCount: number;
  groupId: number | null;
  groupName: string | null;
}

export interface PointPreviewItem {
  productId: string;
  productName: string;
  productType: string;
  groupId: number;
  groupName: string;
  groupActive: boolean;
  earnSharePercent: number;
  retailPrice: number;
  productCost: number;
  marginPercent: number;
  marginSource: 'product' | 'default';
  pointBahtPerUnit: number;
  pointsPerUnitExact: number;
  pointsPerUnit: number;
  bahtPerPoint: number | null;
}

export interface PointPreview {
  pointValueBaht: number;
  items: PointPreviewItem[];
}

export interface PointSummary {
  pointValueBaht: number;
  shopCustomersEarn: boolean;
  groups: {
    id: number;
    name: string;
    active: boolean;
    earnSharePercent: number;
    defaultMarginPercent: number;
    productCount: number;
    avgBahtPerPoint: number | null;
  }[];
  outstandingPoints: number;
  outstandingValueBaht: number;
  month: {
    start: string;
    issuedPurchase: number;
    issuedManual: number;
    issued: number;
    redeemed: number;
  };
}

/** Normal range for the give-back share; outside it the settings page shows a warning. */
export const EARN_SHARE_NORMAL_MIN = 5;
export const EARN_SHARE_NORMAL_MAX = 10;
