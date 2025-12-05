import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useGetProductsQuery } from '../inventory/productsApi';
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  selectCartItems,
  selectCartTotal,
} from './cartSlice';
import { PaymentFlow } from '../finance/PaymentFlow';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';

export const CheckoutPage: React.FC = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const { data: products, isLoading } = useGetProductsQuery();

  const [view, setView] = useState<'cart' | 'keypad' | 'payment'>('cart');

  const handleAddToCart = (product: any) => {
    const existingItem = cartItems.find((item) => item.id === product.id);
    const currentQty = existingItem ? existingItem.quantity : 0;

    if (currentQty + 1 > product.stock) {
      toast.error('No hay suficiente stock');
      return;
    }

    dispatch(
      addToCart({
        id: String(product.id),
        name: product.name,
        price: Number(product.price),
        quantity: 1,
      }),
    );
    toast.success('Producto agregado');
  };

  const handleIncrement = (item: any) => {
    const product = products?.find((p) => p.id === item.id);
    if (!product) return;

    if (item.quantity + 1 > product.stock) {
      toast.error('No hay suficiente stock');
      return;
    }
    dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }));
  };

  const handlePayment = () => {
    if (cartItems.length === 0) return;
    setView('payment');
  };

  const handleFinish = () => {
    dispatch(clearCart());
    setView('cart');
  };

  if (view === 'payment') {
    return (
      <PaymentFlow
        initialAmount={total}
        cartItems={cartItems}
        onBack={() => setView('cart')}
        onComplete={handleFinish}
      />
    );
  }

  if (view === 'keypad') {
    return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <button
          onClick={() => setView('cart')}
          className="p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={20} /> Volver al Carrito
        </button>
        <div className="flex-1">
          <PaymentFlow onBack={() => setView('cart')} onComplete={() => setView('cart')} />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 p-4 max-w-4xl mx-auto dark:bg-gray-900 dark:text-white min-h-screen transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <ShoppingCart className="w-6 h-6 mr-2" />
          Punto de Venta
        </h2>
        <button
          onClick={() => setView('keypad')}
          className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Calculator size={18} />
          Teclado Rápido
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Selection */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-600 dark:text-gray-400">Productos</h3>
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products?.map((product, index) => (
                <button
                  key={`${product.id}-${index}`}
                  onClick={() => handleAddToCart(product)}
                  className="flex flex-col items-start p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:border-emerald-500 active:bg-emerald-50 dark:active:bg-emerald-900 transition-colors text-left"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    ${product.price}
                  </span>
                  <span className="text-xs text-gray-400">Stock: {product.stock}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-fit sticky top-4 border dark:border-gray-700">
          <h3 className="font-bold text-lg mb-4 border-b dark:border-gray-700 pb-2 text-gray-900 dark:text-white">
            Carrito Actual
          </h3>

          {cartItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400">El carrito está vacío</div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      ${item.price} x {item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))
                      }
                      className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleIncrement(item)}
                      className={`p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 ${
                        products?.find((p) => p.id === item.id)?.stock === item.quantity
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                      disabled={products?.find((p) => p.id === item.id)?.stock === item.quantity}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => dispatch(removeFromCart(item.id))}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="border-t dark:border-gray-700 pt-4 mt-4">
                <div className="flex justify-between items-center text-xl font-bold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="w-full mt-4 bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-600 active:scale-95 transition-transform"
              >
                Cobrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
