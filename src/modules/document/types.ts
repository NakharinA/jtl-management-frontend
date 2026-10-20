import { PaymentMethod } from '../pos/types';

export type DocumentType = 'receipt' | 'tax_invoice';

export interface ShopProfile {
  name: string;
  taxId: string | null;
  branch: string | null;
  address: string | null;
  phone: string | null;
  vatRegistered: boolean;
  configured: boolean;
  updatedAt: string | null;
}

export interface ShopProfileInput {
  name: string;
  taxId?: string | null;
  branch?: string | null;
  address?: string | null;
  phone?: string | null;
  vatRegistered: boolean;
}

export interface BuyerInput {
  name: string;
  taxId: string;
  branch?: string;
  address: string;
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
  seller: ShopProfile;
  buyer: {
    name: string | null;
    taxId: string | null;
    branch: string | null;
    address: string | null;
  };
  subtotal: number;
  discount: number;
  vat: number;
  vatRate: number;
  /** VAT was extracted from VAT-inclusive prices */
  vatInclusive: boolean;
  amountBeforeVat: number;
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
  tax_invoice: 'ใบกำกับภาษี',
};
