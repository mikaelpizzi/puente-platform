import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';
import authReducer from '../features/auth/authSlice';
import cartReducer from '../features/checkout/cartSlice';
import inventoryReducer from '../features/inventory/inventorySlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import conflictReducer from '../features/sync/conflictSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    cart: cartReducer,
    inventory: inventoryReducer,
    notifications: notificationsReducer,
    conflicts: conflictReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
