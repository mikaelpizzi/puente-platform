import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { AddressFormData } from './AddressForm';

/**
 * RTK Query API for address operations.
 */
export const addressesApi = createApi({
  reducerPath: 'addressesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Addresses'],
  endpoints: (builder) => ({
    /**
     * Get all addresses for the current user.
     */
    getAddresses: builder.query<SavedAddress[], void>({
      query: () => '/products/addresses',
      providesTags: ['Addresses'],
    }),

    /**
     * Get default address.
     */
    getDefaultAddress: builder.query<SavedAddress | null, void>({
      query: () => '/products/addresses/default',
      providesTags: ['Addresses'],
    }),

    /**
     * Create a new address.
     */
    createAddress: builder.mutation<SavedAddress, AddressFormData>({
      query: (data) => ({
        url: '/products/addresses',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Addresses'],
    }),

    /**
     * Update an existing address.
     */
    updateAddress: builder.mutation<SavedAddress, { id: string; data: Partial<AddressFormData> }>({
      query: ({ id, data }) => ({
        url: `/products/addresses/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Addresses'],
    }),

    /**
     * Set an address as default.
     */
    setDefaultAddress: builder.mutation<SavedAddress, string>({
      query: (id) => ({
        url: `/products/addresses/${id}/set-default`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Addresses'],
    }),

    /**
     * Delete an address.
     */
    deleteAddress: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({
        url: `/products/addresses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Addresses'],
    }),
  }),
});

export const {
  useGetAddressesQuery,
  useGetDefaultAddressQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useSetDefaultAddressMutation,
  useDeleteAddressMutation,
} = addressesApi;

/**
 * Saved address interface matching the backend schema.
 */
interface SavedAddress {
  _id: string;
  userId: string;
  label: 'home' | 'work' | 'other';
  customName?: string;
  street: string;
  city: string;
  state: string;
  zipCode?: string;
  country: string;
  details?: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  phone?: string;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
}
