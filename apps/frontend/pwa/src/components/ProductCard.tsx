import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface Product {
  id?: string;
  tempId?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku?: string;
  vertical?: string;
  status?: 'synced' | 'pending' | 'error';
  errorMessage?: string;
  attributes?: Record<string, any>;
}

interface ProductCardProps {
  product: Product;
  variant: 'seller' | 'buyer';
  onEditError?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant,
  onEditError,
  onAddToCart,
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 border transition-colors duration-200 ${
        product.status === 'error'
          ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
          : 'border-gray-100 dark:border-gray-700'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
            {product.status === 'pending' && (
              <Clock className="w-4 h-4 text-gray-400 animate-pulse" />
            )}
            {product.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {product.description}
          </p>
          {product.status === 'error' && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
              {product.errorMessage}
            </p>
          )}
        </div>
        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-medium px-2.5 py-0.5 rounded">
          ${product.price}
        </span>
      </div>
      <div className="mt-4 flex justify-between items-center text-sm">
        <span
          className={`px-2 py-1 rounded ${
            product.stock > 0
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}
        >
          Stock: {product.stock}
        </span>

        {variant === 'seller' && (
          <>
            {product.status === 'error' ? (
              <button
                onClick={() => onEditError && onEditError(product)}
                className="text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:underline"
              >
                Corregir
              </button>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 text-xs">SKU: {product.sku}</span>
            )}
          </>
        )}

        {variant === 'buyer' && product.stock > 0 && (
          <button
            onClick={() => onAddToCart && onAddToCart(product)}
            className="bg-emerald-500 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-emerald-600 transition-colors"
          >
            Agregar
          </button>
        )}
      </div>
    </div>
  );
};
