export interface Product {
  id: string;
  productName: string;
  productType: string;
  productCategory?: string;
  stock?: number;
  productAttribute: Record<string, string>;
  productCost: number;
  wholesalePrice: number;
  retailPrice: number;
  barcode: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceLog {
  id: string;
  action: 'create' | 'update';
  previousCost?: number;
  previousWholesalePrice?: number;
  previousRetailPrice?: number;
  newCost: number;
  newWholesalePrice: number;
  newRetailPrice: number;
  changedAt: string;
}

export type CreateProductPayload = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProductPayload = Partial<CreateProductPayload>;
