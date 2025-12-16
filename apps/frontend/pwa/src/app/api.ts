import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';

// Determine base URL based on environment
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    // By default, we'll add the token if it exists in the auth state
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Custom baseQuery that handles 401 errors
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  // If we get a 401, the token is expired or invalid
  if (result.error && result.error.status === 401) {
    // Clear token from localStorage
    localStorage.removeItem('token');

    // Dispatch logout action to clear Redux state
    api.dispatch({ type: 'auth/logout' });

    // Redirect to login page
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login?session=expired';
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'Products', 'Orders', 'Deliveries', 'Jobs', 'Tags', 'Addresses'],
  endpoints: () => ({}),
});
