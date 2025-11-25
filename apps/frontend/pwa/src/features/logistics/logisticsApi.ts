import { api } from '../../app/api';

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
    getAvailableJobs: builder.query<Job[], void>({
      query: () => '/logistics/jobs',
      providesTags: ['Jobs'],
    }),
    getPublicDelivery: builder.query<PublicDeliveryInfo, string>({
      query: (trackingId) => `/logistics/tracking/${trackingId}`,
    }),
    acceptJob: builder.mutation<Job, string>({
      query: (jobId) => ({
        url: `/logistics/jobs/${jobId}/accept`,
        method: 'POST',
      }),
      invalidatesTags: ['Jobs'],
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
