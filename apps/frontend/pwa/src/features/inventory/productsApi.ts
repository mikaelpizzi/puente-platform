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
  sellerId?: string;
  attributes?: Record<string, any>;
}

export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({
      query: () => '/products',
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
  }),
});

export const { useGetProductsQuery, useCreateProductMutation, useUpdateProductMutation } =
  productsApi;
