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

/** Max quantity per product line when calculating points from products. */
export const MAX_ITEM_QUANTITY = 10000;

export interface PointItemInput {
  productId: string;
  quantity: number;
}

/** One line of POST /points/calculate: the product bought at retail price, no discount. */
export interface PointCalculationLine {
  productId: string;
  productName: string;
  productType: string;
  group: { id: number; name: string; active: boolean } | null;
  quantity: number;
  unitPrice: number;
  /** Which rule priced the line; null when the product earns nothing */
  rule?: PointRule | null;
  /** Points for this line alone (rounded down) */
  points: number;
}

export interface PointCalculation {
  items: PointCalculationLine[];
  /** Sum of the line points (each line already rounded down) */
  total: number;
  /** Why the member earns nothing (e.g. shop customers while shop earning is off) */
  note?: string;
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
  /** Fixed points per unit for every product of the group; null = not set (a type's own value wins) */
  pointsPerUnit?: number | null;
  active: boolean;
  sortOrder: number;
  productTypes: string[];
  /** Same types with their per-type settings */
  productTypeRules: PointTypeRule[];
  productCount: number;
}

/** Per-type settings of a product type mapped to a group. */
export interface PointTypeRule {
  productType: string;
  productCount: number;
  /** Fixed points per unit; null = use the profit formula */
  pointsPerUnit: number | null;
  /** Profit in baht per unit for products without a cost; null = the group's % */
  defaultProfitPerUnit: number | null;
}

/** Which rule prices a product's points. */
export type PointRule = 'fixed_type' | 'fixed_group' | 'cost' | 'type_profit' | 'group_percent';

export const isFixedRule = (rule: PointRule | null | undefined) => rule === 'fixed_type' || rule === 'fixed_group';

export const POINT_RULE_LABEL: Record<PointRule, string> = {
  fixed_type: 'แต้มต่อหน่วยของประเภท',
  fixed_group: 'แต้มต่อหน่วยของกลุ่ม',
  cost: 'กำไรจากต้นทุนสินค้า',
  type_profit: 'กำไรเริ่มต้น (฿/หน่วย)',
  group_percent: 'กำไรเริ่มต้น (%) ของกลุ่ม',
};

/** Max value of pointsPerUnit / defaultProfitPerUnit. */
export const MAX_TYPE_RULE_VALUE = 100000;

export interface PointGroupInput {
  name?: string;
  earnSharePercent?: number;
  defaultMarginPercent?: number;
  pointsPerUnit?: number | null;
  active?: boolean;
  sortOrder?: number;
}

export interface PointProductType {
  productType: string;
  productCount: number;
  groupId: number | null;
  groupName: string | null;
  pointsPerUnit?: number | null;
  defaultProfitPerUnit?: number | null;
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
  rule?: PointRule;
  typePointsPerUnit?: number | null;
  groupPointsPerUnit?: number | null;
  typeDefaultProfitPerUnit?: number | null;
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
