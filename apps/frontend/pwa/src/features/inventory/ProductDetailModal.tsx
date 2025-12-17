import React, { useState, useEffect } from 'react';
import {
  X,
  Tag as TagIcon,
  Share2,
  Edit,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../auth/authSlice';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onEdit?: (product: any) => void;
  onAddToCart?: (product: any) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  onEdit,
  onAddToCart,
}) => {
  const { t } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product]);

  if (!isOpen || !product) return null;

  const isSeller = user?.id === product.sellerId || user?.role === 'ADMIN';

  const displayImages =
    product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  const activeImage = displayImages[currentImageIndex];

  const getOptimizedUrl = (url?: string) => {
    if (!url) return '';
    if (!url.includes('cloudinary')) return url;
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/w_1200,c_limit,q_auto,f_auto/${parts[1]}`;
    }
    return url;
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    }
  };

  const handleShare = () => {
    const url = window.location.origin + `/products/${product.id}`;
    navigator.clipboard.writeText(url);
    toast.success(t('common.linkCopied'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button Mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full md:hidden backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-gray-100 dark:bg-gray-700 relative flex items-center justify-center min-h-[300px] md:min-h-full group">
          {/* Navigation Arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {displayImages.map((_: string, idx: number) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentImageIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {activeImage ? (
            <img
              src={getOptimizedUrl(activeImage)}
              alt={product.name}
              className="w-full h-full object-contain max-h-[50vh] md:max-h-full p-4 md:p-0"
            />
          ) : (
            <div className="text-gray-400 dark:text-gray-500 text-sm">{t('images.noImage')}</div>
          )}
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 flex flex-col h-full max-h-[60vh] md:max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start sticky top-0 bg-white dark:bg-gray-800 z-10">
            <div>
              {product.vertical && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1 block">
                  {product.vertical}
                </span>
              )}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight pr-8">
                {product.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="hidden md:block text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Price & Stock */}
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                ${product.price}
              </span>
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${product.stock > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-800'}`}
              >
                {product.stock > 0
                  ? t('inventory.available', { count: product.stock })
                  : t('marketplace.outOfStock')}
              </span>
            </div>

            {/* Description */}
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {product.description}
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    <TagIcon className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Attributes */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {t('common.details')}
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-xs text-gray-400 block capitalize mb-0.5">{key}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleShare}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="sm:hidden">{t('common.share')}</span>
            </button>

            {isSeller ? (
              <button
                onClick={() => {
                  if (onEdit) onEdit(product);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                <Edit className="w-5 h-5" />
                {t('inventory.editProduct')}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (onAddToCart) onAddToCart(product);
                }}
                disabled={product.stock <= 0}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                {t('checkout.addToCart')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
