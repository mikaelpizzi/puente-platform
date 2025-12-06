import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetUploadSignatureMutation,
} from './productsApi';
import { useGetTagsQuery } from './tagsApi';
import { selectCurrentUser } from '../auth/authSlice';
import {
  addPendingProduct,
  selectPendingProducts,
  selectErrorProducts,
  removeErrorProduct,
} from './inventorySlice';

import { TagManager } from './TagManager';
import { OfflineSyncManager } from './OfflineSyncManager';
import { ProductCard } from '../../components/ProductCard';
import { Check, X, Tag as TagIcon, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export const InventoryDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { data: serverProducts, isLoading, error } = useGetProductsQuery();
  const { data: tags } = useGetTagsQuery();
  const pendingProducts = useSelector(selectPendingProducts);
  const errorProducts = useSelector(selectErrorProducts);

  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [getUploadSignature] = useGetUploadSignatureMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  // Bulk Actions State
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false);
  const [bulkSelectedTags, setBulkSelectedTags] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    sku: '',
    stock: 0,
    vertical: '',
    tags: [] as string[],
    imageUrl: '',
    attributes: {} as Record<string, any>,
  });
  const [isUploading, setIsUploading] = useState(false);

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

  const handleTagToggle = (tagName: string) => {
    setFormData((prev) => {
      const currentTags = prev.tags || [];
      if (currentTags.includes(tagName)) {
        return { ...prev, tags: currentTags.filter((t) => t !== tagName) };
      }
      if (currentTags.length >= 5) {
        toast.error('Máximo 5 etiquetas por producto');
        return prev;
      }
      return { ...prev, tags: [...currentTags, tagName] };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('Subiendo imagen...');

    try {
      // 1. Get signature (mocked or real)
      const { signature, timestamp, cloudName, apiKey } = await getUploadSignature().unwrap();

      // 2. Upload to Cloudinary (or mock if no env vars)
      // For this demo, if we detect the mock signature, we'll simulate a delay and return a placeholder
      if (signature.startsWith('mock_signature')) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const mockUrl = URL.createObjectURL(file); // Use local blob for immediate preview
        setFormData((prev) => ({ ...prev, imageUrl: mockUrl }));
        toast.success('Imagen subida (Simulación)', { id: toastId });
      } else {
        // Real Cloudinary Upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.secure_url) {
          setFormData((prev) => ({ ...prev, imageUrl: data.secure_url }));
          toast.success('Imagen subida correctamente', { id: toastId });
        } else {
          throw new Error('Upload failed');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error al subir imagen', { id: toastId });
    } finally {
      setIsUploading(false);
    }
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
      vertical: formData.tags?.[0] || 'other', // Backward compatibility
      tags: formData.tags || [],
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
      vertical: '',
      tags: [],
      imageUrl: '',
      attributes: {},
    });
  };

  const handleEditError = (product: any) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      sku: product.sku,
      stock: product.stock,
      vertical: product.vertical,
      tags: product.tags || [],
      imageUrl: product.imageUrl || '',
      attributes: product.attributes || {},
    });
    dispatch(removeErrorProduct(product.tempId));
    setIsModalOpen(true);
  };

  const handleBulkTagAssign = async () => {
    if (selectedProducts.length === 0 || bulkSelectedTags.length === 0) return;

    const toastId = toast.loading(
      `Asignando ${bulkSelectedTags.length} etiquetas a ${selectedProducts.length} productos...`,
    );

    try {
      await Promise.all(
        selectedProducts.map((id) => {
          const product = serverProducts?.find((p: any) => (p.id || p._id) === id);
          const currentTags = product?.tags || [];

          // Filter out tags that are already present
          const tagsToAdd = bulkSelectedTags.filter((t) => !currentTags.includes(t));

          if (tagsToAdd.length === 0) return Promise.resolve();

          // Enforce limit
          if (currentTags.length + tagsToAdd.length > 5) {
            // Try to add as many as possible up to 5
            const slotsAvailable = 5 - currentTags.length;
            if (slotsAvailable <= 0) {
              toast.error(`Producto "${product?.name}" ya tiene 5 etiquetas`, { id: toastId });
              return Promise.resolve();
            }
            // Add only what fits
            tagsToAdd.splice(slotsAvailable);
            toast(`Solo se agregaron algunas etiquetas a "${product?.name}" por límite`, {
              icon: '⚠️',
            });
          }

          const newTags = [...currentTags, ...tagsToAdd];

          return updateProduct({
            id,
            data: {
              tags: newTags,
              vertical: newTags[0] || 'other', // Keep vertical synced with first tag
            },
          }).unwrap();
        }),
      );
      toast.success('Etiquetas actualizadas', { id: toastId });
      setIsBulkTagModalOpen(false);
      setSelectedProducts([]);
      setIsSelectionMode(false);
      setBulkSelectedTags([]);
    } catch (error) {
      toast.error('Error al actualizar etiquetas', { id: toastId });
    }
  };

  const toggleBulkTagSelection = (tagName: string) => {
    setBulkSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName],
    );
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
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
  const allProducts = [
    ...errorProducts.map((p) => ({ ...p, id: p.tempId, status: 'error', errorMessage: p.error })),
    ...pendingProducts.map((p) => ({ ...p, id: p.tempId, status: 'pending' })),
    ...(serverProducts || []).map((p: any) => ({ ...p, id: p.id || p._id, status: 'synced' })),
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 transition-colors duration-200">
      <OfflineSyncManager />
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center transition-colors duration-200 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mi Inventario</h2>
          {isSelectionMode && (
            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs px-2 py-1 rounded-full font-medium">
              {selectedProducts.length} seleccionados
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {isSelectionMode ? (
            <>
              <button
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedProducts([]);
                }}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              {selectedProducts.length > 0 && (
                <button
                  onClick={() => setIsBulkTagModalOpen(true)}
                  className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-emerald-600 transition-colors flex items-center gap-2"
                >
                  <TagIcon className="w-4 h-4" />
                  Asignar
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setIsSelectionMode(true)}
                className="text-emerald-600 dark:text-emerald-400 px-3 py-2 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
              >
                Seleccionar
              </button>
              <button
                onClick={() => setIsTagManagerOpen(true)}
                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Etiquetas
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg active:scale-95 transition-transform hover:bg-emerald-600"
              >
                + Nuevo
              </button>
            </>
          )}
        </div>
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
            <div
              key={`${product.status}-${product.id || index}`}
              className={`relative group transition-all duration-200 rounded-xl ${
                isSelectionMode ? 'cursor-pointer active:scale-[0.98]' : ''
              } ${
                selectedProducts.includes(product.id)
                  ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : isSelectionMode
                    ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    : ''
              }`}
              onClick={() => isSelectionMode && toggleProductSelection(product.id)}
            >
              {isSelectionMode && selectedProducts.includes(product.id) && (
                <div className="absolute -top-2 -right-2 z-20 animate-in zoom-in-50 duration-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-900">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              )}
              <div className={isSelectionMode ? 'pointer-events-none' : ''}>
                <ProductCard product={product} variant="seller" onEditError={handleEditError} />
              </div>
            </div>
          ))
        )}
      </div>
      {/* Floating Action Button */}
      {!isSelectionMode && (
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="fixed bottom-24 right-4 bg-emerald-500 text-white p-4 rounded-full shadow-lg hover:bg-emerald-600 active:scale-95 transition-transform z-30 flex items-center justify-center"
          aria-label="Nuevo Producto"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
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
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
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
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagen del Producto
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 flex items-center justify-center group">
                    {formData.imageUrl ? (
                      <>
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                      <Upload className="w-4 h-4" />
                      {isUploading ? 'Subiendo...' : 'Subir Imagen'}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      JPG, PNG, WEBP hasta 5MB
                    </p>
                  </div>
                </div>
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
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
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
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Etiquetas (Máx. 5)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTagManagerOpen(true)}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    + Gestionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                  {tags?.map((tag) => {
                    const isSelected = formData.tags?.includes(tag.name);
                    return (
                      <button
                        key={tag._id}
                        type="button"
                        onClick={() => handleTagToggle(tag.name)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-white shadow-sm scale-105'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                  {tags?.length === 0 && (
                    <span className="text-sm text-gray-400 italic">
                      No hay etiquetas disponibles
                    </span>
                  )}
                </div>
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
                      value={formData.attributes.color || ''}
                      onChange={handleAttributeChange}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
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
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <TagManager isOpen={isTagManagerOpen} onClose={() => setIsTagManagerOpen(false)} />

      {/* Bulk Tag Assignment Modal */}
      {isBulkTagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white">Asignar Etiqueta</h3>
              <button onClick={() => setIsBulkTagModalOpen(false)} className="text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {tags?.map((tag) => {
                const isSelected = bulkSelectedTags.includes(tag.name);
                return (
                  <button
                    key={tag._id}
                    onClick={() => toggleBulkTagSelection(tag.name)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span
                      className={`font-medium ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                      {tag.name}
                    </span>
                  </button>
                );
              })}
              {tags?.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">No hay etiquetas creadas</p>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={handleBulkTagAssign}
                disabled={bulkSelectedTags.length === 0}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all"
              >
                Aplicar ({bulkSelectedTags.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
