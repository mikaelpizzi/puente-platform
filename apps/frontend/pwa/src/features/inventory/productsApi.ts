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
  attributes?: Record<string, any>;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  sku: string;
  stock: number;
  vertical: string;
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
  }),
});

export const { useGetProductsQuery, useCreateProductMutation } = productsApi;
