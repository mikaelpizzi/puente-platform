import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useGetProductsQuery } from '../inventory/productsApi';
import { ProductCard } from '../../components/ProductCard';
import { addToCart, selectCartItems, selectCartTotal } from '../checkout/cartSlice';
import toast from 'react-hot-toast';

export const MarketplacePage: React.FC = () => {
  const { data: products, isLoading, error } = useGetProductsQuery();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);

  const handleAddToCart = (product: any) => {
    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      }),
    );
    toast.success(`${product.name} agregado al carrito`);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-2">Error al cargar productos</p>
        <button onClick={() => window.location.reload()} className="text-emerald-600 underline">
          Reintentar
        </button>
      </div>
    );
  }

  const availableProducts = products?.filter((p: any) => p.stock > 0) || [];

  return (
    <div className="pb-24">
      <div className="bg-white dark:bg-gray-800 shadow p-4 sticky top-0 z-10">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Marketplace</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Explora y compra productos</p>
      </div>

      <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {availableProducts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 col-span-full">
            <p>No hay productos disponibles en este momento.</p>
          </div>
        ) : (
          availableProducts.map((product: any) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="buyer"
              onAddToCart={handleAddToCart}
            />
          ))
        )}
      </div>

      {/* Floating Cart Button */}
      {cartItems.length > 0 && (
        <button
          onClick={() => navigate('/checkout')}
          className="fixed bottom-20 right-4 bg-emerald-500 text-white p-4 rounded-full shadow-lg hover:bg-emerald-600 active:scale-95 transition-transform z-30 flex items-center gap-2"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="font-bold">${cartTotal.toFixed(2)}</span>
        </button>
      )}
    </div>
  );
};
