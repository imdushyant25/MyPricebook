// src/context/ProductContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Product } from '../types/product.types';

interface ProductContextProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextProps | undefined>(undefined);

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProductContext must be used within a ProductProvider');
  }
  return context;
};

interface ProductProviderProps {
  children: ReactNode;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Placeholder function - will be implemented when needed
  const refreshProducts = async () => {
    setLoading(true);
    try {
      // API call here
      // const data = await getProducts();
      // setProducts(data);
    } catch (error) {
      console.error('Error refreshing products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProductContext.Provider value={{ products, setProducts, loading, setLoading, refreshProducts }}>
      {children}
    </ProductContext.Provider>
  );
};

export default ProductContext;