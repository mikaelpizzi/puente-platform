import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useGetProductsQuery, useCreateProductMutation } from './productsApi';
import { selectCurrentUser } from '../auth/authSlice';
import {
  addPendingProduct,
  selectPendingProducts,
  selectErrorProducts,
  retryErrorProduct,
  removeErrorProduct,
} from './inventorySlice';
import { Plus } from 'lucide-react';
import { ProductCard } from '../../components/ProductCard';

export const InventoryDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { data: serverProducts, isLoading, error } = useGetProductsQuery();
  const pendingProducts = useSelector(selectPendingProducts);
  const errorProducts = useSelector(selectErrorProducts);

  const [createProduct] = useCreateProductMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    sku: '',
    stock: 0,
    vertical: 'other',
    attributes: {} as Record<string, any>,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value,
    }));
  };

  const handleAttributeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.price < 0 || formData.stock < 0) {
      alert('El precio y el stock no pueden ser negativos');
      return;
    }

    const productData = {
      ...formData,
      sellerId: user?.id,
    };

    // Offline-First Strategy
    if (!navigator.onLine) {
      dispatch(addPendingProduct(productData));
      setIsModalOpen(false);
      resetForm();
      return;
    }

    try {
      await createProduct(productData).unwrap();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to create product:', err);
      // If network fails during request, fallback to offline queue
      // But createProduct might throw a validation error too.
      // For now, simple alert, but ideally we check error type.
      alert('Error al crear producto. Intente más tarde o verifique su conexión.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      sku: '',
      stock: 0,
      vertical: 'other',
      attributes: {},
    });
  };

  const handleRetry = (tempId: string) => {
    dispatch(retryErrorProduct(tempId));
  };

  const handleEditError = (product: any) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      sku: product.sku,
      stock: product.stock,
      vertical: product.vertical,
      attributes: product.attributes || {},
    });
    dispatch(removeErrorProduct(product.tempId));
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">Error al cargar inventario</div>;
  }

  // Combine lists: Error > Pending > Server
  // We map them to a common structure for display
  const allProducts = [
    ...errorProducts.map((p) => ({ ...p, id: p.tempId, status: 'error', errorMessage: p.error })),
    ...pendingProducts.map((p) => ({ ...p, id: p.tempId, status: 'pending' })),
    ...(serverProducts || []).map((p) => ({ ...p, status: 'synced' })),
  ];

  return (
    <div className="pb-20">
      {/* Padding for bottom nav */}
      <div className="bg-white dark:bg-gray-800 shadow p-4 sticky top-0 z-10 flex justify-between items-center transition-colors duration-200">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Mi Inventario</h2>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg active:scale-95 transition-transform hover:bg-emerald-600"
        >
          + Nuevo
        </button>
      </div>
      {/* Product List */}
      <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {allProducts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400 col-span-full">
            <p>No tienes productos aún.</p>
            <p className="text-sm">¡Agrega el primero!</p>
          </div>
        ) : (
          allProducts.map((product: any, index: number) => (
            <ProductCard
              key={`${product.status}-${product.id || index}`}
              product={product}
              variant="seller"
              onEditError={handleEditError}
            />
          ))
        )}
      </div>
      {/* Floating Action Button */}
      <button
        onClick={() => {
          resetForm();
          setIsModalOpen(true);
        }}
        className="fixed bottom-20 right-4 bg-emerald-500 text-white p-4 rounded-full shadow-lg hover:bg-emerald-600 active:scale-95 transition-transform z-30 flex items-center justify-center"
        aria-label="Nuevo Producto"
      >
        <Plus className="w-6 h-6" />
      </button>
      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl w-full max-w-md p-6 animate-slide-up shadow-xl transition-colors duration-200">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Nuevo Producto</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Nombre
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Descripción
                </label>
                <input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Precio
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="stock"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Stock
                  </label>
                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="vertical"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Categoría / Vertical
                </label>
                <select
                  id="vertical"
                  name="vertical"
                  value={formData.vertical}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="food">Alimentos</option>
                  <option value="fashion">Moda / Ropa</option>
                  <option value="crafts">Artesanías</option>
                  <option value="electronics">Electrónica</option>
                  <option value="other">Otros</option>
                </select>
              </div>

              {/* Dynamic Attributes */}
              {formData.vertical === 'fashion' && (
                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Talla
                    </label>
                    <select
                      name="size"
                      value={formData.attributes.size || ''}
                      onChange={handleAttributeChange}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Seleccionar</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Color
                    </label>
                    <input
                      name="color"
                      type="text"
                      placeholder="Ej: Rojo"
                      value={formData.attributes.color || ''}
                      onChange={handleAttributeChange}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {formData.vertical === 'food' && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Fecha de Vencimiento
                  </label>
                  <input
                    name="expirationDate"
                    type="date"
                    value={formData.attributes.expirationDate || ''}
                    onChange={handleAttributeChange}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              {formData.vertical === 'electronics' && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Garantía (meses)
                  </label>
                  <input
                    name="warrantyMonths"
                    type="number"
                    min="0"
                    placeholder="Ej: 12"
                    value={formData.attributes.warrantyMonths || ''}
                    onChange={handleAttributeChange}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="sku"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  SKU
                </label>
                <input
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
