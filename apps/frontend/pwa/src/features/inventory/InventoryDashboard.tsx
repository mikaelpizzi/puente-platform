import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
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
import { ProductDetailModal } from './ProductDetailModal';
import { MultiImageDropzone } from './MultiImageDropzone';
import { ModalWrapper } from '../../components/ModalWrapper';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { Check, X, Tag as TagIcon, Plus, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export const InventoryDashboard: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const {
    data: serverProducts,
    isLoading,
    error,
  } = useGetProductsQuery({
    // Fetch all for user
  });
  const { data: tags } = useGetTagsQuery();
  const pendingProducts = useSelector(selectPendingProducts);
  const errorProducts = useSelector(selectErrorProducts);

  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false);
  const [bulkSelectedTags, setBulkSelectedTags] = useState<string[]>([]);

  // Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Tab for Trash
  const [currentTab, setCurrentTab] = useState<'ACTIVE' | 'TRASH'>('ACTIVE');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    sku: '',
    stock: 0,
    vertical: '',
    tags: [] as string[],
    imageUrl: '', // kept for compatibility logic
    images: [] as string[],
    attributes: {} as Record<string, any>,
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [viewingProduct, setViewingProduct] = useState<any | null>(null);

  // Helper handling input
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
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
        toast.error(t('inventory.maxTags'));
        return prev;
      }
      return { ...prev, tags: [...currentTags, tagName] };
    });
  };

  const handleImagesChange = (newImages: string[]) => {
    setFormData((prev) => ({
      ...prev,
      images: newImages,
      imageUrl: newImages.length > 0 ? newImages[0] : '',
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
      vertical: formData.tags?.[0] || 'other',
      tags: formData.tags || [],
      images: formData.images || [],
      imageUrl: formData.images?.[0] || formData.imageUrl,
      inventoryStatus: 'ACTIVE' as const,
    };

    if (!navigator.onLine) {
      dispatch(addPendingProduct(productData));
      setIsModalOpen(false);
      resetForm();
      return;
    }

    try {
      if (editingProductId) {
        await updateProduct({ id: editingProductId, data: productData }).unwrap();
        toast.success(t('inventory.productUpdated'));
      } else {
        await createProduct(productData).unwrap();
        toast.success(t('inventory.productCreated'));
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save product:', err);
      alert('Error al guardar producto.');
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
      images: [],
      attributes: {},
    });
    setEditingProductId(null);
  };

  const handleEditError = (product: any) => {
    populateForm(product);
    dispatch(removeErrorProduct(product.tempId));
    setIsModalOpen(true);
  };

  const handleEdit = (product: any) => {
    populateForm(product);
    setEditingProductId(product.id || product._id);
    setIsModalOpen(true);
  };

  const populateForm = (product: any) => {
    let initialImages = product.images || [];
    if (initialImages.length === 0 && product.imageUrl) {
      initialImages = [product.imageUrl];
    }

    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      sku: product.sku,
      stock: product.stock,
      vertical: product.vertical,
      tags: product.tags || [],
      imageUrl: product.imageUrl || '',
      images: initialImages,
      attributes: product.attributes || {},
    });
  };

  const handleBulkTagAssign = async () => {
    if (selectedProducts.length === 0 || bulkSelectedTags.length === 0) return;
    const toastId = toast.loading(t('inventory.assigningTags'));
    try {
      await Promise.all(
        selectedProducts.map((id) => {
          const product = serverProducts?.find((p: any) => (p.id || p._id) === id);
          if (!product) return Promise.resolve();
          const currentTags = product.tags || [];
          const tagsToAdd = bulkSelectedTags.filter((t) => !currentTags.includes(t));
          if (tagsToAdd.length === 0) return Promise.resolve();

          const newTags = [...currentTags, ...tagsToAdd];
          return updateProduct({ id, data: { tags: newTags } }).unwrap();
        }),
      );
      toast.success(t('inventory.tagsUpdated'), { id: toastId });
      setIsBulkTagModalOpen(false);
      setSelectedProducts([]);
      setIsSelectionMode(false);
      setBulkSelectedTags([]);
    } catch (error) {
      toast.error(t('errors.generic'), { id: toastId });
    }
  };

  // Trash Logic
  const handleTrashRequest = (product: any) => {
    setConfirmationModal({
      isOpen: true,
      title: t('inventory.moveToTrash'),
      message: t('inventory.confirmMoveToTrash', { name: product.name }),
      confirmText: t('common.move'),
      variant: 'warning',
      onConfirm: async () => {
        try {
          await updateProduct({
            id: product.id || product._id,
            data: { inventoryStatus: 'TRASH' },
          }).unwrap();
          toast.success(t('inventory.movedToTrash'));
        } catch (e) {
          toast.error(t('errors.generic'));
        }
      },
    });
  };

  const handleRestore = async (product: any) => {
    try {
      await updateProduct({
        id: product.id || product._id,
        data: { inventoryStatus: 'ACTIVE' },
      }).unwrap();
      toast.success(t('inventory.productRestored'));
    } catch (e) {
      toast.error(t('errors.generic'));
    }
  };

  const handleDeletePermanentlyRequest = (product: any) => {
    setConfirmationModal({
      isOpen: true,
      title: t('inventory.deleteForever'),
      message: t('inventory.confirmDeleteForever', { name: product.name }),
      confirmText: t('common.delete'),
      variant: 'danger',
      onConfirm: async () => {
        // Placeholder for now
        toast.error('Función de eliminación permanente pendiente de backend');
      },
    });
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
    return <div className="p-4 text-red-500">{t('errors.generic')}</div>;
  }

  const allProductsRaw = [
    ...errorProducts.map((p) => ({ ...p, id: p.tempId, status: 'error', errorMessage: p.error })),
    ...pendingProducts.map((p) => ({ ...p, id: p.tempId, status: 'pending' })),
    ...(serverProducts || []).map((p: any) => ({
      ...p,
      id: p.id || p._id,
      status: 'synced',
      inventoryStatus: p.inventoryStatus || 'ACTIVE',
    })),
  ];

  const filteredProducts = allProductsRaw.filter((p) => {
    const status = p.inventoryStatus || 'ACTIVE';
    if (p.status !== 'synced') return currentTab === 'ACTIVE';
    return currentTab === 'ACTIVE' ? status === 'ACTIVE' : status === 'TRASH';
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 transition-colors duration-200">
      <OfflineSyncManager />
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-colors duration-200 border-b border-gray-100 dark:border-gray-700">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('inventory.title')}
              </h2>
              {isSelectionMode && (
                <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs px-2 py-1 rounded-full font-medium">
                  {t('inventory.selected', { count: selectedProducts.length })}
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
                  {selectedProducts.length > 0 && currentTab === 'ACTIVE' && (
                    <button
                      onClick={() => setIsBulkTagModalOpen(true)}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-emerald-600 transition-colors flex items-center gap-2"
                    >
                      <TagIcon className="w-4 h-4" />
                      {t('inventory.assign')}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsSelectionMode(true)}
                    className="text-emerald-600 dark:text-emerald-400 px-3 py-2 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                  >
                    {t('inventory.select')}
                  </button>
                  {currentTab === 'ACTIVE' && (
                    <>
                      <button
                        onClick={() => setIsTagManagerOpen(true)}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {t('inventory.tags')}
                      </button>
                      <button
                        onClick={() => {
                          resetForm();
                          setIsModalOpen(true);
                        }}
                        className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg active:scale-95 transition-transform hover:bg-emerald-600"
                      >
                        + {t('common.new')}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setCurrentTab('ACTIVE')}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 ${currentTab === 'ACTIVE' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
              {t('inventory.active')}
            </button>
            <button
              onClick={() => setCurrentTab('TRASH')}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-1 ${currentTab === 'TRASH' ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
              <Trash2 className="w-4 h-4" />
              {t('inventory.trash')}
            </button>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400 col-span-full">
            {currentTab === 'ACTIVE' ? (
              <>
                <p>{t('inventory.noActiveProducts')}</p>
                <p className="text-sm">{t('inventory.addFirstProduct')}</p>
              </>
            ) : (
              <p>{t('inventory.trashEmpty')}</p>
            )}
          </div>
        ) : (
          filteredProducts.map((product: any, index: number) => (
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
                {/* Wrap Card for Actions */}
                <div className="relative">
                  <ProductCard
                    product={product}
                    variant="seller"
                    onEditError={handleEditError}
                    onEdit={currentTab === 'TRASH' ? undefined : handleEdit}
                    onTrash={currentTab === 'ACTIVE' ? handleTrashRequest : undefined}
                    onView={setViewingProduct}
                  />

                  {/* Trash Actions Overlay for Card (Restoring/Hard Delete) */}
                  {currentTab === 'TRASH' && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-[1px] flex items-center justify-center gap-2 rounded-xl z-10 transition-opacity opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(product);
                        }}
                        className="bg-emerald-100 text-emerald-700 p-2 rounded-full hover:bg-emerald-200 transition-colors shadow-sm"
                        title="Restaurar"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePermanentlyRequest(product);
                        }}
                        className="bg-red-100 text-red-700 p-2 rounded-full hover:bg-red-200 transition-colors shadow-sm"
                        title="Eliminar Definitivamente"
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button - Only on Active */}
      {!isSelectionMode && currentTab === 'ACTIVE' && (
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

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        product={viewingProduct}
        onEdit={(p) => {
          handleEdit(p);
          setViewingProduct(null);
        }}
      />

      {/* Create/Edit Modal with ModalWrapper */}
      <ModalWrapper
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProductId ? t('inventory.editProduct') : t('inventory.newProduct')}
      >
        {/* Reuse form logic here or split into component for cleaner file if needed */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('inventory.productName')}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="Ej. Taza de cerámica"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('inventory.description')}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange as any}
              required
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
              placeholder="Detalles del producto..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('inventory.images')} ({t('inventory.max5')})
            </label>
            <MultiImageDropzone images={formData.images} onChange={handleImagesChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inventory.price')} ($)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price || ''}
                onChange={handleInputChange}
                onWheel={(e) => e.currentTarget.blur()}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('inventory.stock')}
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock || ''}
                onChange={handleInputChange}
                onWheel={(e) => e.currentTarget.blur()}
                required
                min="0"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('inventory.tags')} ({t('inventory.max5')})
              </label>
              <span
                className="text-xs text-emerald-600 cursor-pointer hover:underline"
                onClick={() => setIsTagManagerOpen(true)}
              >
                + {t('inventory.manage')}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className="hover:text-emerald-900 dark:hover:text-emerald-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleTagToggle(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                disabled={formData.tags.length >= 5}
              >
                <option value="">{t('inventory.addTag')}...</option>
                {tags?.map((tag) => (
                  <option
                    key={tag._id}
                    value={tag.name}
                    disabled={formData.tags.includes(tag.name)}
                  >
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('inventory.sku')} ({t('common.optional')})
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="Código único"
            />
          </div>

          {/* Dynamic Attributes (Simplified for now) */}
          {formData.tags?.[0] === 'clothing' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs">Talla</label>
                <input
                  name="size"
                  onChange={handleAttributeChange}
                  className="w-full border rounded p-1"
                  placeholder="S, M, L..."
                />
              </div>
              <div>
                <label className="text-xs">Color</label>
                <input
                  name="color"
                  onChange={handleAttributeChange}
                  className="w-full border rounded p-1"
                  placeholder="Rojo, Azul..."
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium shadow-md active:scale-95"
            >
              {editingProductId ? t('inventory.saveChanges') : t('inventory.createProduct')}
            </button>
          </div>
        </form>
      </ModalWrapper>

      {/* Tag Manager Modal */}
      <TagManager isOpen={isTagManagerOpen} onClose={() => setIsTagManagerOpen(false)} />

      {/* Bulk Tag Modal */}
      {isBulkTagModalOpen && (
        <ModalWrapper
          isOpen={isBulkTagModalOpen}
          onClose={() => setIsBulkTagModalOpen(false)}
          title={t('inventory.bulkTagAssignment')}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('inventory.selectTagsFor', { count: selectedProducts.length })}
            </p>

            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
              {tags?.map((tag) => (
                <button
                  key={tag._id}
                  onClick={() => toggleBulkTagSelection(tag.name)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    bulkSelectedTags.includes(tag.name)
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-emerald-300'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
              {tags?.length === 0 && (
                <span className="text-gray-400 text-sm">{t('inventory.noTags')}</span>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setIsBulkTagModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-500"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleBulkTagAssign}
                disabled={bulkSelectedTags.length === 0}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium shadow hover:bg-emerald-600 disabled:opacity-50"
              >
                Asignar ({bulkSelectedTags.length})
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* Confirmation Modal - Shared for Trash/Delete */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        variant={confirmationModal.variant as any}
        confirmText={confirmationModal.confirmText}
      />
    </div>
  );
};
