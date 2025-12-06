import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart, Search, Filter, X } from 'lucide-react';
import { useGetProductsQuery } from '../inventory/productsApi';
import { ProductCard } from '../../components/ProductCard';
import { addToCart, selectCartItems, selectCartTotal } from '../checkout/cartSlice';
import { useGetTagsQuery } from '../inventory/tagsApi';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

export const MarketplacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  // Filter State
  const [searchTerm, setSearchTerm] = React.useState(searchParams.get('search') || '');
  const [minPrice, setMinPrice] = React.useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = React.useState(searchParams.get('maxPrice') || '');
  const [selectedTags, setSelectedTags] = React.useState<string[]>(
    searchParams.getAll('tags') || [],
  );

  const debouncedSearch = useDebounce(searchTerm, 500);
  const debouncedMinPrice = useDebounce(minPrice, 500);
  const debouncedMaxPrice = useDebounce(maxPrice, 500);

  // Sync URL with filters
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (debouncedMinPrice) params.set('minPrice', debouncedMinPrice);
    if (debouncedMaxPrice) params.set('maxPrice', debouncedMaxPrice);
    selectedTags.forEach((tag) => params.append('tags', tag));
    setSearchParams(params);
  }, [debouncedSearch, debouncedMinPrice, debouncedMaxPrice, selectedTags, setSearchParams]);

  const {
    data: products,
    isLoading,
    error,
  } = useGetProductsQuery({
    search: debouncedSearch,
    minPrice: debouncedMinPrice ? Number(debouncedMinPrice) : undefined,
    maxPrice: debouncedMaxPrice ? Number(debouncedMaxPrice) : undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
  });

  const { data: tags } = useGetTagsQuery();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName],
    );
  };

  const handleAddToCart = (product: any) => {
    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      }),
    );
    toast.success(`${product.name} agregado al carrito`);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-2">Error al cargar productos</p>
        <button onClick={() => window.location.reload()} className="text-emerald-600 underline">
          Reintentar
        </button>
      </div>
    );
  }

  const availableProducts = products?.filter((p: any) => p.stock > 0) || [];

  return (
    <div className="pb-24">
      <div className="bg-white dark:bg-gray-800 shadow p-4 sticky top-0 z-10 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Marketplace</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Explora y compra productos</p>
          </div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-2 rounded-full transition-colors ${
              isFilterOpen || selectedTags.length > 0 || minPrice || maxPrice
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {isFilterOpen && (
          <div className="pt-2 space-y-4 animate-in slide-in-from-top-2 duration-200 border-t border-gray-100 dark:border-gray-700">
            {/* Price Range */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 block">
                Precio
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-900"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-900"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 block">
                Categorías
              </label>
              <div className="flex flex-wrap gap-2">
                {tags?.map((tag) => {
                  const isSelected = selectedTags.includes(tag.name);
                  return (
                    <button
                      key={tag._id}
                      onClick={() => toggleTag(tag.name)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {availableProducts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 col-span-full">
            <p>No hay productos disponibles en este momento.</p>
          </div>
        ) : (
          availableProducts.map((product: any) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="buyer"
              onAddToCart={handleAddToCart}
            />
          ))
        )}
      </div>

      {/* Floating Cart Button */}
      {cartItems.length > 0 && (
        <button
          onClick={() => navigate('/checkout')}
          className="fixed bottom-20 right-4 bg-emerald-500 text-white p-4 rounded-full shadow-lg hover:bg-emerald-600 active:scale-95 transition-transform z-30 flex items-center gap-2"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="font-bold">${cartTotal.toFixed(2)}</span>
        </button>
      )}
    </div>
  );
};
