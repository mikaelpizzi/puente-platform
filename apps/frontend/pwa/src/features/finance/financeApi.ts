import { api } from '../../app/api';

export interface Order {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  qrCode?: string; // URL or data for QR
  paymentLink?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface CreateOrderRequest {
  sellerId: string;
  buyerId?: string;
  items: OrderItem[];
}

export const financeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation<Order, CreateOrderRequest>({
      query: (body) => ({
        url: '/finance/orders',
        method: 'POST',
        body,
      }),
    }),
    getOrderStatus: builder.query<Order, string>({
      query: (orderId) => `/finance/orders/${orderId}`,
      // Polling will be controlled by the component using the pollingInterval option
    }),
  }),
});

export const { useCreateOrderMutation, useGetOrderStatusQuery } = financeApi;
