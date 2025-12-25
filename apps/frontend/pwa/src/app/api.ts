import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import type { RootState } from './store';
import { updateTokens, logout } from '../features/auth/authSlice';

// Determine base URL based on environment
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create a single Mutex instance for token refresh
const mutex = new Mutex();

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

// Custom baseQuery that handles 401 errors with automatic token refresh
// Uses Mutex to prevent race conditions when multiple requests fail simultaneously
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  // Wait if another request is currently refreshing the token
  await mutex.waitForUnlock();

  // Attempt the original request
  let result = await rawBaseQuery(args, api, extraOptions);

  // If we get a 401, attempt to refresh the token
  if (result.error && result.error.status === 401) {
    // Check if mutex is NOT locked (we're the first to detect the 401)
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();

      try {
        const refreshToken = (api.getState() as RootState).auth.refreshToken;

        if (refreshToken) {
          // Attempt to refresh the token
          const refreshResult = await rawBaseQuery(
            {
              url: '/auth/refresh',
              method: 'POST',
              headers: { Authorization: `Bearer ${refreshToken}` },
            },
            api,
            extraOptions,
          );

          if (refreshResult.data) {
            // Store the new tokens
            const tokenData = refreshResult.data as { accessToken: string; refreshToken: string };
            api.dispatch(updateTokens(tokenData));

            // Retry the original request with the new token
            result = await rawBaseQuery(args, api, extraOptions);
          } else {
            // Refresh failed - token is truly expired
            api.dispatch(logout());

            // Redirect to login
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              window.location.href = '/login?session=expired';
            }
          }
        } else {
          // No refresh token available - logout
          api.dispatch(logout());

          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login?session=expired';
          }
        }
      } finally {
        // Always release the mutex
        release();
      }
    } else {
      // Another request is already refreshing the token
      // Wait for it to complete, then retry with the new token
      await mutex.waitForUnlock();
      result = await rawBaseQuery(args, api, extraOptions);
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
