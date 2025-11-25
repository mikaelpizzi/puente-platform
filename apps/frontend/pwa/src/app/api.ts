import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';

// Determine base URL based on environment
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      // By default, we'll add the token if it exists in the auth state
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Auth', 'Products', 'Orders', 'Deliveries', 'Jobs'],
  endpoints: () => ({}),
});
