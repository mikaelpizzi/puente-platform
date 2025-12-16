import { api } from '../../app/api';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  stock: number;
  vertical: string;
  sellerId: string;
  tags?: string[];
  imageUrl?: string;
  images?: string[];
  inventoryStatus?: 'ACTIVE' | 'TRASH';
  attributes?: Record<string, any>;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  sku: string;
  stock: number;
  vertical: string; // Deprecated but kept for backward compatibility
  tags?: string[];
  imageUrl?: string;
  images?: string[];
  inventoryStatus?: 'ACTIVE' | 'TRASH';
  sellerId?: string;
  attributes?: Record<string, any>;
}

export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<
      Product[],
      {
        search?: string;
        minPrice?: number;
        maxPrice?: number;
        tags?: string[];
        vertical?: string;
      } | void
    >({
      query: (params) => {
        if (!params) return '/products';
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.set('search', params.search);
        if (params.minPrice) queryParams.set('minPrice', params.minPrice.toString());
        if (params.maxPrice) queryParams.set('maxPrice', params.maxPrice.toString());
        if (params.tags) params.tags.forEach((t) => queryParams.append('tags', t));
        if (params.vertical) queryParams.set('vertical', params.vertical);
        return `/products?${queryParams.toString()}`;
      },
      providesTags: ['Products'],
    }),
    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (newProduct) => ({
        url: '/products',
        method: 'POST',
        body: newProduct,
      }),
      invalidatesTags: ['Products'],
      // Optimistic UI Update
      onQueryStarted: async (newProduct, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          productsApi.util.updateQueryData('getProducts', undefined, (draft) => {
            // Create a temporary optimistic product
            const optimisticProduct: Product = {
              id: 'temp-' + Date.now(),
              sellerId: 'current-user', // This would ideally come from auth state
              ...newProduct,
            };
            draft.push(optimisticProduct);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    updateProduct: builder.mutation<Product, { id: string; data: Partial<CreateProductRequest> }>({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),
    getProduct: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: ['Products'],
    }),
    uploadImage: builder.mutation<{ public_id: string; secure_url: string; url: string }, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: '/products/upload',
          method: 'POST',
          body: formData,
        };
      },
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUploadImageMutation,
} = productsApi;
