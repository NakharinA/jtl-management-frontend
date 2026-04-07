import { useState, useEffect } from 'react';
import { Product, PriceLog, CreateProductPayload, UpdateProductPayload } from '../types';
import { productService } from '../services/product.service';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const createProduct = async (data: CreateProductPayload): Promise<Product> => {
    const newProduct = await productService.create(data);
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  };

  const updateProduct = async (id: string, data: UpdateProductPayload): Promise<Product> => {
    const updated = await productService.update(id, data);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deleteProduct = async (id: string): Promise<void> => {
    await productService.delete(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const getPriceLogs = async (id: string): Promise<PriceLog[]> => {
    return productService.getPriceLogs(id);
  };

  return {
    products,
    isLoading,
    createProduct,
    updateProduct,
    deleteProduct,
    getPriceLogs,
    refreshProducts: loadProducts,
  };
};
