import { apiClient } from '../../../services/api.client';
import {
  BuyerInput,
  DocumentType,
  SalesDocument,
  ShopProfile,
  ShopProfileInput,
} from '../types';

export const documentService = {
  /** Issues (or returns the already-issued) document for a paid order. */
  issue: async (
    orderId: string,
    type?: DocumentType,
    buyer?: BuyerInput,
  ): Promise<SalesDocument> => {
    return apiClient.post<SalesDocument>(`/pos/orders/${orderId}/documents`, {
      ...(type ? { type } : {}),
      ...(buyer ? { buyer } : {}),
    });
  },

  listByOrder: async (orderId: string): Promise<SalesDocument[]> => {
    return apiClient.get<SalesDocument[]>(`/pos/orders/${orderId}/documents`);
  },

  get: async (id: string): Promise<SalesDocument> => {
    return apiClient.get<SalesDocument>(`/documents/${id}`);
  },
};

export const shopProfileService = {
  get: async (): Promise<ShopProfile> => {
    return apiClient.get<ShopProfile>('/shop-profile');
  },

  save: async (data: ShopProfileInput): Promise<ShopProfile> => {
    return apiClient.put<ShopProfile>('/shop-profile', data);
  },
};

/** Opens the printable view of a document in a new window. */
export const openPrintWindow = (documentId: string) => {
  window.open(`/print/documents/${documentId}`, '_blank', 'noopener');
};
