import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';
import { useGetProductQuery } from '../inventory/productsApi';
import { useGetSellerReviewsQuery, useGetSellerStatsQuery } from '../reviews/reviewsApi';
import { ReviewsList } from '../reviews/ReviewsList';
import { addToCart } from '../checkout/cartSlice';
import { selectCurrentUser } from '../auth/authSlice';
import toast from 'react-hot-toast';

export const ProductDetailPage: React.FC = () => {
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
      <div className="p-4 pb-24">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Producto no encontrado
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            El producto que buscas no existe o fue eliminado.
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
    toast.success(`${quantity}x ${product.name} añadido al carrito`);
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

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="p-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{product.name}</h1>
      </div>

      {/* Image Gallery */}
      <div className="relative bg-gray-100 dark:bg-gray-800 aspect-square">
        {images.length > 0 ? (
          <>
            <img
              src={images[currentImageIndex]}
              alt={product.name}
              className="w-full h-full object-contain"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-gray-900/80 rounded-full shadow-lg"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-gray-900/80 rounded-full shadow-lg"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentImageIndex
                          ? 'bg-emerald-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-24 h-24 text-gray-300" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{product.name}</h2>
            <span className="text-2xl font-bold text-emerald-600">${product.price.toFixed(2)}</span>
          </div>

          {product.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">{product.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span
              className={`flex items-center gap-1 ${
                product.stock > 0 ? 'text-green-600' : 'text-red-500'
              }`}
            >
              <Package className="w-4 h-4" />
              {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
            </span>
            {product.sku && <span>SKU: {product.sku}</span>}
          </div>

          {/* Seller Rating Preview */}
          {stats && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Vendedor:</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {stats.averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-500">({stats.totalReviews} reseñas)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quantity & Add to Cart */}
        {user?.role === 'BUYER' && product.stock > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Cantidad:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-xl font-bold"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-lg text-gray-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-xl font-bold"
                >
                  +
                </button>
              </div>
            </div>
            <button
              onClick={handleAddToCart}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              Añadir al carrito - ${(product.price * quantity).toFixed(2)}
            </button>
          </div>
        )}

        {/* Seller Reviews */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Reseñas del Vendedor
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
  );
};

export default ProductDetailPage;
