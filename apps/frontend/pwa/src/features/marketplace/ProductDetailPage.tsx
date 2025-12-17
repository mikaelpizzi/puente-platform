import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Store,
  Share2,
  Heart,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useGetProductQuery } from '../inventory/productsApi';
import { useGetSellerReviewsQuery, useGetSellerStatsQuery } from '../reviews/reviewsApi';
import { ReviewsList } from '../reviews/ReviewsList';
import { addToCart } from '../checkout/cartSlice';
import { selectCurrentUser } from '../auth/authSlice';
import toast from 'react-hot-toast';

export const ProductDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  const {
    data: product,
    isLoading,
    error,
  } = useGetProductQuery(productId || '', {
    skip: !productId,
  });

  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch seller reviews if product has sellerId
  const { data: reviews = [], isLoading: isLoadingReviews } = useGetSellerReviewsQuery(
    { sellerId: product?.sellerId || '' },
    { skip: !product?.sellerId },
  );

  const { data: stats } = useGetSellerStatsQuery(product?.sellerId || '', {
    skip: !product?.sellerId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-4 pb-24 max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-6 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('common.back')}
        </button>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('marketplace.productNotFound')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {t('marketplace.productNotFoundMessage')}
          </p>
        </div>
      </div>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        sellerId: product.sellerId,
      }),
    );
    toast.success(t('marketplace.addedToCart', { count: quantity, name: product.name }));
  };

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(t('common.linkCopied'));
  };

  const isInStock = product.stock > 0;
  const canAddToCart = user?.role === 'BUYER' && isInStock;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:p-6">
          {/* Left Column: Image Gallery */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            {/* Main Image */}
            <div className="relative bg-white dark:bg-gray-800 lg:rounded-2xl lg:shadow-lg overflow-hidden">
              <div className="aspect-square relative group">
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[currentImageIndex]}
                      alt={product.name}
                      className="w-full h-full object-contain bg-gray-50 dark:bg-gray-900"
                    />
                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <Package className="w-24 h-24 text-gray-300 dark:text-gray-600" />
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="px-4 py-3 flex gap-2 overflow-x-auto bg-gray-50 dark:bg-gray-900/50">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Info */}
          <div className="p-4 lg:p-0 space-y-4">
            {/* Product Header Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
              {/* Category Badge */}
              {product.vertical && (
                <span className="inline-block px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-full mb-3">
                  {product.vertical}
                </span>
              )}

              {/* Title & Price */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                  {product.name}
                </h1>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl lg:text-4xl font-bold text-emerald-600">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                  {product.description}
                </p>
              )}

              {/* Stock & SKU */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span
                  className={`flex items-center gap-1.5 font-medium ${
                    isInStock ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {isInStock ? (
                    <>
                      <Check className="w-4 h-4" />
                      {t('inventory.available', { count: product.stock })}
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      {t('marketplace.outOfStock')}
                    </>
                  )}
                </span>
                {product.sku && (
                  <span className="text-gray-500 dark:text-gray-400">
                    SKU: <span className="font-mono">{product.sku}</span>
                  </span>
                )}
              </div>

              {/* Seller Rating */}
              {stats && (
                <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                      <Store className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('marketplace.seller')}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold text-gray-900 dark:text-white">
                            {stats.averageRating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          ({stats.totalReviews} {t('reviews.reviews')})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quantity & Add to Cart Card */}
            {canAddToCart && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {t('checkout.quantity')}
                  </span>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition-colors flex items-center justify-center text-xl font-bold text-gray-600 dark:text-gray-300"
                    >
                      −
                    </button>
                    <span className="w-14 text-center font-bold text-lg text-gray-900 dark:text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="w-10 h-10 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition-colors flex items-center justify-center text-xl font-bold text-gray-600 dark:text-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {t('checkout.addToCart')} - ${(product.price * quantity).toFixed(2)}
                </button>
              </div>
            )}

            {/* Out of Stock Message */}
            {user?.role === 'BUYER' && !isInStock && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 dark:text-red-400 font-medium">
                  {t('marketplace.outOfStockMessage')}
                </p>
              </div>
            )}

            {/* Seller Reviews Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                {t('reviews.sellerReviews')}
              </h3>
              <ReviewsList
                reviews={reviews}
                stats={stats}
                isLoading={isLoadingReviews}
                showStats={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
