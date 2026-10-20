import { PaymentMethod } from '../pos/types';

export type DocumentType = 'receipt' | 'delivery_note';

export interface ShopProfile {
  name: string;
  taxId: string | null;
  branch: string | null;
  address: string | null;
  phone: string | null;
  configured: boolean;
  updatedAt: string | null;
}

export interface ShopProfileInput {
  name: string;
  taxId?: string | null;
  branch?: string | null;
  address?: string | null;
  phone?: string | null;
}

export interface BuyerInput {
  name: string;
  /** Optional; 13 digits when given */
  taxId?: string;
  branch?: string;
  address?: string;
}

/** Seller details as printed: snapshot taken at issue time (or the current profile for older documents). */
export interface DocumentSeller {
  name: string;
  taxId: string | null;
  branch: string | null;
  address: string | null;
  phone: string | null;
  /** false when the document predates seller snapshots */
  snapshot: boolean;
}

export interface SalesDocumentItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SalesDocument {
  id: string;
  type: DocumentType;
  documentNo: string;
  issuedAt: string;
  orderId: string;
  memberId: string | null;
  seller: DocumentSeller;
  buyer: {
    name: string | null;
    taxId: string | null;
    branch: string | null;
    address: string | null;
  };
  subtotal: number;
  discount: number;
  total: number;
  items: SalesDocumentItem[];
  order: {
    id: string;
    createdAt: string;
    subtotal: number;
    taxRate: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: PaymentMethod | null;
    paymentStatus: string;
    status: string;
  };
  payment: {
    id: string;
    method: PaymentMethod;
    amount: number;
    amountTendered: number | null;
    change: number | null;
    referenceNumber: string | null;
    processedAt: string;
  } | null;
}

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  receipt: 'ใบเสร็จรับเงิน',
  delivery_note: 'ใบส่งของ / ใบเสร็จรับเงิน',
};
