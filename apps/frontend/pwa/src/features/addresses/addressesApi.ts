import { api } from '../../app/api';
import { AddressFormData } from './AddressForm';

/**
 * Saved address interface matching the backend schema.
 */
export interface SavedAddress {
  _id: string;
  userId: string;
  label: 'home' | 'work' | 'other';
  customName?: string;
  street: string;
  city: string;
  state: string;
  zipCode?: string;
  country?: string;
  details?: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  phone?: string;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export const addressesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get all addresses for the current user.
     */
    getAddresses: builder.query<SavedAddress[], void>({
      query: () => '/addresses',
      providesTags: ['Addresses'],
    }),

    /**
     * Get default address.
     */
    getDefaultAddress: builder.query<SavedAddress | null, void>({
      query: () => '/addresses/default',
      providesTags: ['Addresses'],
    }),

    /**
     * Create a new address.
     */
    createAddress: builder.mutation<SavedAddress, AddressFormData>({
      query: (data) => ({
        url: '/addresses',
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
        url: `/addresses/${id}`,
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
        url: `/addresses/${id}/set-default`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Addresses'],
    }),

    /**
     * Delete an address.
     */
    deleteAddress: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({
        url: `/addresses/${id}`,
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
