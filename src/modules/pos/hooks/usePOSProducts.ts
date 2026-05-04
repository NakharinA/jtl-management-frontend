import { useState, useEffect, useMemo } from 'react';
import { Product } from '../../product/types';
import { productService } from '../../product/services/product.service';

export const usePOSProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [prods, cats] = await Promise.all([
          productService.getAll(),
          productService.getCategories(),
        ]);
        setProducts(prods);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load POS products/categories', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory =
        !selectedCategory || p.productCategory === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        p.productName.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        (p.productCategory ?? '').toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, selectedCategory]);

  return {
    products,
    categories,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredProducts,
  };
};
