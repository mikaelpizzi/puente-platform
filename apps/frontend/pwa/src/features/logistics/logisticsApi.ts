import { api } from '../../app/api';
import { Order } from '../orders/ordersApi';

export interface Location {
  lat: number;
  lng: number;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  distance: number; // in km
  earnings: number;
  status: 'available' | 'accepted' | 'in-progress' | 'completed';
}

export interface PublicDeliveryInfo {
  id: string;
  status: 'preparing' | 'picked_up' | 'in_transit' | 'delivered';
  eta: string; // ISO string or "15 min"
  courier?: {
    name: string;
    location: Location;
  };
  origin: Location;
  destination: Location;
}

export const logisticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get available orders for couriers (from orders service)
    getAvailableJobs: builder.query<Order[], void>({
      query: () => '/orders/available-jobs',
      providesTags: ['Jobs', 'Orders'],
    }),
    getPublicDelivery: builder.query<PublicDeliveryInfo, string>({
      query: (trackingId) => `/logistics/tracking/${trackingId}`,
    }),
    // Accept a job (assign courier to order)
    acceptJob: builder.mutation<Order, string>({
      query: (orderId) => ({
        url: `/orders/${orderId}/assign-courier`,
        method: 'PATCH',
        body: {}, // courierId will be taken from x-user-id header
      }),
      invalidatesTags: ['Jobs', 'Orders'],
    }),
    updateLocation: builder.mutation<void, Location>({
      query: (location) => ({
        url: '/logistics/location',
        method: 'POST',
        body: location,
      }),
    }),
    completeDelivery: builder.mutation<Job, string>({
      query: (jobId) => ({
        url: `/logistics/jobs/${jobId}/complete`,
        method: 'POST',
      }),
      invalidatesTags: ['Jobs'],
    }),
  }),
});

export const {
  useGetAvailableJobsQuery,
  useGetPublicDeliveryQuery,
  useAcceptJobMutation,
  useUpdateLocationMutation,
  useCompleteDeliveryMutation,
} = logisticsApi;
