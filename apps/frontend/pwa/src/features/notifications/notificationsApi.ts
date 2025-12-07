import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Notification } from './notificationsSlice';

/**
 * RTK Query API for notifications polling.
 */
export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
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
  tagTypes: ['Notifications'],
  endpoints: (builder) => ({
    /**
     * Get new notifications since a given timestamp.
     * Used for polling.
     */
    getNotifications: builder.query<Notification[], { since?: string }>({
      query: ({ since }) => ({
        url: '/notifications',
        params: since ? { since } : undefined,
      }),
      providesTags: ['Notifications'],
    }),

    /**
     * Get unread count.
     */
    getUnreadCount: builder.query<{ count: number }, void>({
      query: () => '/notifications/unread-count',
      providesTags: ['Notifications'],
    }),
  }),
});

export const { useGetNotificationsQuery, useGetUnreadCountQuery } = notificationsApi;
