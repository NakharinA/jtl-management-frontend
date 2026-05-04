import { Product } from '../product/types';

// ─── Product ─────────────────────────────────────────────────────────────────

export type POSProduct = Product & {
  productCategory: string;
  stock: number;
};

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  cartId: string;
  items: OrderItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'failed';
  status: 'open' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface CheckoutPreview {
  cartId: string;
  items: OrderItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  discount: number;
  total: number;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export type PaymentMethod = 'cash' | 'qr' | 'card';

export interface CashPaymentRequest {
  method: 'cash';
  amountTendered: number;
}

export interface QrCardPaymentRequest {
  method: 'qr' | 'card';
  referenceNumber: string;
}

export type ProcessPaymentRequest = CashPaymentRequest | QrCardPaymentRequest;

export interface PaymentResponse {
  paymentId: string;
  orderId: string;
  status: 'success' | 'failed';
  method: PaymentMethod;
  amount: number;
  amountTendered?: number;
  change?: number;
  referenceNumber?: string;
  processedAt: string;
}
