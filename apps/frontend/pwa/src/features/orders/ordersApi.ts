import { api } from '../../app/api';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  buyerId: string;
  sellerId: string;
  courierId?: string;
  status: OrderStatus;
  items: OrderItem[];
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
    notes?: string;
  };
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  sellerId: string;
  items: OrderItem[];
  total: number;
  shippingAddress?: Order['shippingAddress'];
  notes?: string;
}

export const ordersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOrdersAsBuyer: builder.query<Order[], OrderStatus | undefined>({
      query: (status) => ({
        url: '/orders/buyer',
        params: status ? { status } : undefined,
      }),
      providesTags: ['Orders'],
    }),
    getOrdersAsSeller: builder.query<Order[], OrderStatus | undefined>({
      query: (status) => ({
        url: '/orders/seller',
        params: status ? { status } : undefined,
      }),
      providesTags: ['Orders'],
    }),
    getOrdersAsCourier: builder.query<Order[], OrderStatus | undefined>({
      query: (status) => ({
        url: '/orders/courier',
        params: status ? { status } : undefined,
      }),
      providesTags: ['Orders'],
    }),
    getOrder: builder.query<Order, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Orders', id }],
    }),
    createOrder: builder.mutation<Order, CreateOrderRequest>({
      query: (body) => ({
        url: '/orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Orders'],
    }),
    updateOrderStatus: builder.mutation<Order, { id: string; status: OrderStatus }>({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Orders', id }, 'Orders'],
    }),
    cancelOrder: builder.mutation<Order, string>({
      query: (id) => ({
        url: `/orders/${id}/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Orders', id }, 'Orders'],
    }),
    dispatchOrder: builder.mutation<Order, string>({
      query: (id) => ({
        url: `/orders/${id}/dispatch`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Orders', id }, 'Orders', 'Jobs'],
    }),
  }),
});

export const {
  useGetOrdersAsBuyerQuery,
  useGetOrdersAsSellerQuery,
  useGetOrdersAsCourierQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
  useDispatchOrderMutation,
} = ordersApi;
