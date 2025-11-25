import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useCreateProductMutation } from './productsApi';
import {
  selectPendingProducts,
  removePendingProduct,
  moveToError,
  PendingProduct,
} from './inventorySlice';

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

export const OfflineSyncManager: React.FC = () => {
  const dispatch = useDispatch();
  const pendingProducts = useSelector(selectPendingProducts);
  const [createProduct] = useCreateProductMutation();
  const isOnline = useOnlineStatus();
  const isSyncing = useRef(false);

  useEffect(() => {
    const syncNext = async () => {
      if (isSyncing.current || !isOnline || pendingProducts.length === 0) return;

      isSyncing.current = true;
      const item: PendingProduct = pendingProducts[0];

      try {
        // Remove tempId and timestamp before sending to API
        const { tempId, timestamp, ...productData } = item;

        await createProduct(productData).unwrap();

        // Success: Remove from pending queue
        // This will trigger the effect again to process the next item
        dispatch(removePendingProduct(tempId));
      } catch (error: any) {
        console.error('Sync failed for item:', item.tempId, error);

        // Check for 4xx Client Errors (Validation, etc)
        // RTK Query error format usually has 'status'
        if (error.status && error.status >= 400 && error.status < 500) {
          dispatch(
            moveToError({
              tempId: item.tempId,
              error: error.data?.message || 'Error de validación',
            }),
          );
          // Moving to error removes from pending, triggering effect for next item
        } else {
          // Network/Server error (5xx or fetch error)
          // Stop processing. Wait for next online event or retry.
          // We do NOT remove from pending.
        }
      } finally {
        isSyncing.current = false;
      }
    };

    syncNext();
  }, [pendingProducts, isOnline, dispatch, createProduct]);

  return null; // This component doesn't render anything
};
