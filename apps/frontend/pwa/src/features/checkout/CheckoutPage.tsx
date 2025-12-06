import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useGetProductsQuery } from '../inventory/productsApi';
import { useGetTagsQuery } from '../inventory/tagsApi';
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  selectCartItems,
  selectCartTotal,
} from './cartSlice';
import { PaymentFlow } from '../finance/PaymentFlow';
import { ShoppingCart, Trash2, Plus, Minus, Search, Package, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const CheckoutPage: React.FC = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const { data: products, isLoading } = useGetProductsQuery();
  const { data: tags } = useGetTagsQuery();

  const [view, setView] = useState<'cart' | 'payment'>('cart');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Derived state for filtering
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' ||
        (product.tags && product.tags.includes(selectedCategory)) ||
        product.vertical === selectedCategory; // Backward compatibility
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Extract unique categories
  const categories = useMemo(() => {
    if (!tags) return ['all'];
    return ['all', ...tags.map((t) => t.name)];
  }, [tags]);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 pb-24">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <ShoppingCart className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              Punto de Venta
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 ml-14">
              Gestiona tus ventas de forma rápida y eficiente
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Products (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search & Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sticky top-20 z-10 backdrop-blur-xl bg-opacity-90 dark:bg-opacity-90">
              <div className="flex flex-col gap-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-full mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  No se encontraron productos
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Intenta con otra búsqueda o categoría
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredProducts.map((product, index) => (
                  <button
                    key={`${product.id}-${index}`}
                    onClick={() => handleAddToCart(product)}
                    className="group relative flex flex-col items-start p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-200 text-left overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="w-full mb-3">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {product.tags && product.tags.length > 0 ? (
                          product.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">
                            {product.vertical
                              ? product.vertical.charAt(0).toUpperCase() + product.vertical.slice(1)
                              : 'General'}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 min-h-[2.5rem]">
                        {product.name}
                      </h3>
                    </div>

                    <div className="mt-auto w-full pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        ${product.price}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Cart (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col h-[calc(100vh-8rem)] sticky top-8 overflow-hidden">
              {/* Cart Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white">Carrito</h3>
                  <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full">
                    {cartItems.length} items
                  </span>
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                    <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                    <p>Tu carrito está vacío</p>
                    <p className="text-sm mt-2 opacity-60">
                      Selecciona productos para comenzar una venta
                    </p>
                  </div>
                ) : (
                  cartItems.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                          ${item.price}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() =>
                            dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))
                          }
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-gray-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleIncrement(item)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 transition-colors"
                          disabled={
                            products?.find((p) => p.id === item.id)?.stock === item.quantity
                          }
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => dispatch(removeFromCart(item.id))}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Total a cobrar</span>
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    ${total.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={cartItems.length === 0}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span>Cobrar</span>
                  <div className="bg-white/20 rounded-lg px-2 py-0.5 text-sm">
                    {cartItems.length}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
