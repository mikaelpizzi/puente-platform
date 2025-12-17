import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import {
  selectCartItems,
  selectCartTotal,
  removeFromCart,
  updateQuantity,
} from '../features/checkout/cartSlice';
import { selectCurrentUser } from '../features/auth/authSlice';

export const FloatingCart: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const [isOpen, setIsOpen] = useState(false);

  // Group items by seller for Split Orders display
  const itemsBySeller = useMemo(() => {
    const grouped = new Map<string, typeof cartItems>();
    cartItems.forEach((item) => {
      const existing = grouped.get(item.sellerId) || [];
      existing.push(item);
      grouped.set(item.sellerId, existing);
    });
    return grouped;
  }, [cartItems]);

  const sellerCount = itemsBySeller.size;

  // Only show for buyers
  if (user?.role !== 'BUYER' || cartItems.length === 0) {
    return null;
  }

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
      >
        <ShoppingCart className="w-5 h-5" />
        <span className="font-bold">${cartTotal.toFixed(2)}</span>
        <span className="bg-white text-emerald-600 text-xs font-bold px-2 py-0.5 rounded-full">
          {totalItems}
        </span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Cart Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out max-h-[85vh] flex flex-col ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{t('checkout.cart')}</h3>
              <p className="text-sm text-gray-500">
                {totalItems} {totalItems === 1 ? t('checkout.item') : t('checkout.items')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Multi-seller info badge */}
        {sellerCount > 1 && (
          <div className="mx-4 mb-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400 text-sm">
              📦 {sellerCount} envíos separados
            </span>
          </div>
        )}

        {/* Cart Items - Grouped by Seller */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {Array.from(itemsBySeller.entries()).map(([sellerId, items], index) => {
            const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            return (
              <div key={sellerId} className="space-y-2">
                {/* Seller Header */}
                {sellerCount > 1 && (
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      📦 Envío {index + 1}
                    </span>
                    <span className="text-xs text-gray-400">${subtotal.toFixed(2)}</span>
                  </div>
                )}

                {/* Items for this seller */}
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {item.name}
                      </h4>
                      <p className="text-sm text-emerald-600 font-bold">${item.price.toFixed(2)}</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
                      <button
                        onClick={() => {
                          if (item.quantity > 1) {
                            dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }));
                          }
                        }}
                        className="w-7 h-7 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))
                        }
                        className="w-7 h-7 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => dispatch(removeFromCart(item.id))}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              {t('checkout.total')}
            </span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              ${cartTotal.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              navigate('/buyer-checkout');
            }}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25"
          >
            <ShoppingCart className="w-5 h-5" />
            {t('checkout.proceedToCheckout')}
          </button>
        </div>
      </div>
    </>
  );
};

export default FloatingCart;
