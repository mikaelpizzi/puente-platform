import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ProofOfDeliveryData } from './ProofOfDelivery';

/**
 * RTK Query API for delivery operations.
 */
export const deliveryApi = createApi({
  reducerPath: 'deliveryApi',
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
  tagTypes: ['Delivery', 'CourierOrders'],
  endpoints: (builder) => ({
    /**
     * Get all orders assigned to the current courier.
     */
    getCourierOrders: builder.query<Order[], { status?: string }>({
      query: ({ status }) => ({
        url: '/products/orders/courier',
        params: status ? { status } : undefined,
      }),
      providesTags: ['CourierOrders'],
    }),

    /**
     * Complete a delivery with Proof of Delivery.
     */
    completeDelivery: builder.mutation<Order, { orderId: string; pod: ProofOfDeliveryData }>({
      query: ({ orderId, pod }) => ({
        url: `/products/orders/${orderId}/complete-delivery`,
        method: 'POST',
        body: pod,
      }),
      invalidatesTags: ['CourierOrders', 'Delivery'],
    }),
  }),
});

export const { useGetCourierOrdersQuery, useCompleteDeliveryMutation } = deliveryApi;

/**
 * Order interface matching the backend schema.
 */
interface Order {
  _id: string;
  buyerId: string;
  sellerId: string;
  courierId?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  notes?: string;
  proofOfDelivery?: {
    photoUrl?: string;
    signatureUrl?: string;
    capturedAt?: string;
    capturedBy?: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
  };
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}
