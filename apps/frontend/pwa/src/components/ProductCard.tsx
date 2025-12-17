import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  AlertTriangle,
  Image as ImageIcon,
  Edit2,
  ShoppingCart,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Product {
  id?: string;
  tempId?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku?: string;
  vertical?: string;
  tags?: string[];
  imageUrl?: string;
  images?: string[];
  status?: 'synced' | 'pending' | 'error';
  errorMessage?: string;
  attributes?: Record<string, any>;
  sellerId?: string;
}

interface ProductCardProps {
  product: Product;
  variant: 'seller' | 'buyer';
  onEdit?: (product: Product) => void;
  onEditError?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onView?: (product: Product) => void;
  onTrash?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant,
  onEdit,
  onEditError,
  onAddToCart,
  onTrash,
  onView,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  // Normalize images
  const displayImages =
    product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  const currentImage = displayImages[currentImageIndex];

  const getOptimizedUrl = (url?: string) => {
    if (!url) return '';
    if (!url.includes('cloudinary')) return url;
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/w_500,h_500,c_fill,q_auto,f_auto/${parts[1]}`;
    }
    return url;
  };

  const optimizedImage = getOptimizedUrl(currentImage);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      onView(product);
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
      setIsLoading(true);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
      setIsLoading(true);
    }
  };

  return (
    <div
      className={`group bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all duration-300 hover:shadow-md h-full flex flex-col overflow-hidden ${
        product.status === 'error'
          ? 'border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800'
          : 'border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-900'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div
        onClick={handleImageClick}
        className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden cursor-pointer group/image"
      >
        {/* Navigation Arrows */}
        {displayImages.length > 1 && isHovered && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm opacity-0 group-hover/image:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm opacity-0 group-hover/image:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {/* Dots Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1">
              {displayImages.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    idx === currentImageIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Skeleton Loader */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center"></div>
        )}

        {/* Error Fallback */}
        {(hasError || !currentImage) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-800">
            <ImageIcon className="w-10 h-10 mb-2 opacity-30" />
            <span className="text-[10px] uppercase tracking-wider font-medium opacity-50">
              No Image
            </span>
          </div>
        )}

        {/* Actual Image */}
        {currentImage && !hasError && (
          <img
            src={optimizedImage}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        )}

        {/* Status Badges */}
        <div className="absolute top-2 right-2 flex gap-1 z-10 pointer-events-none">
          {product.status === 'pending' && (
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Clock className="w-3 h-3" />
              <span className="hidden sm:inline">Pendiente</span>
            </span>
          )}
          {product.status === 'error' && (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <AlertTriangle className="w-3 h-3" />
              Error
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div
          onClick={handleImageClick}
          className="flex justify-between items-start gap-2 cursor-pointer"
        >
          <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 text-base group-hover:text-emerald-600 transition-colors">
            {product.name}
          </h3>
          <span className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
            ${product.price}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 min-h-[1.5rem]">
          {product.tags?.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] px-2 py-0.5 bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 rounded-full border border-gray-100 dark:border-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[2.5rem]">
          {product.description}
        </p>

        {product.status === 'error' && (
          <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-900/30">
            {product.errorMessage}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-50 dark:border-gray-700">
          <div
            className={`text-xs font-medium ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}
          >
            {product.stock > 0
              ? t('inventory.available', { count: product.stock })
              : t('marketplace.outOfStock')}
          </div>

          <div className="flex gap-2 items-center">
            {variant === 'seller' ? (
              <>
                {product.status === 'error' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEditError) onEditError(product);
                    }}
                    className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm"
                  >
                    {t('inventory.fix')}
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    {/* Trash Button - Elegant styling, aligned with Edit */}
                    {onTrash && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrash(product);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEdit) onEdit(product);
                      }}
                      className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      {t('common.edit')}
                    </button>
                  </div>
                )}
              </>
            ) : (
              product.stock > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAddToCart) onAddToCart(product);
                  }}
                  className="text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-1"
                >
                  <ShoppingCart className="w-3 h-3" />
                  {t('common.add')}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
