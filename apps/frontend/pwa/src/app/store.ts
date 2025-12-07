import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';
import { ordersApi } from '../features/orders/ordersApi';
import authReducer from '../features/auth/authSlice';
import cartReducer from '../features/checkout/cartSlice';
import inventoryReducer from '../features/inventory/inventorySlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    auth: authReducer,
    cart: cartReducer,
    inventory: inventoryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware, ordersApi.middleware),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
