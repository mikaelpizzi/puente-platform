import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useCreateProductMutation, useUpdateProductMutation } from './productsApi';
import {
  selectPendingProducts,
  removePendingProduct,
  moveToError,
  PendingProduct,
} from './inventorySlice';
import { addConflict, selectHasConflicts } from '../sync/conflictSlice';
import { ConflictResolver } from '../sync/ConflictResolver';

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
  const hasConflicts = useSelector(selectHasConflicts);
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const isOnline = useOnlineStatus();
  const isSyncing = useRef(false);

  // Handle conflict resolution
  const handleConflictResolve = async (
    resolution: 'local' | 'server' | 'merge',
    data?: Record<string, unknown>,
  ) => {
    // The resolution will be handled by the sync process
    // This callback is for any additional side effects
    console.log('Conflict resolved with:', resolution, data);
  };

  useEffect(() => {
    const syncNext = async () => {
      // Don't sync if there are unresolved conflicts
      if (isSyncing.current || !isOnline || pendingProducts.length === 0 || hasConflicts) return;

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

        // Check for 409 Conflict
        if (error.status === 409) {
          // Server returned conflict - show resolver
          dispatch(
            addConflict({
              resourceType: 'product',
              resourceId: item.tempId,
              localVersion: item as unknown as Record<string, unknown>,
              serverVersion: error.data?.serverVersion || {},
              localTimestamp: new Date(item.timestamp).toISOString(),
              serverTimestamp: error.data?.serverTimestamp || new Date().toISOString(),
              fields: error.data?.conflictingFields || Object.keys(item),
            }),
          );
        } else if (error.status && error.status >= 400 && error.status < 500) {
          // Other client errors (validation, etc)
          dispatch(
            moveToError({
              tempId: item.tempId,
              error: error.data?.message || 'Error de validación',
            }),
          );
        }
        // Network/Server error (5xx or fetch error) - stop and wait for retry
      } finally {
        isSyncing.current = false;
      }
    };

    syncNext();
  }, [pendingProducts, isOnline, hasConflicts, dispatch, createProduct, updateProduct]);

  // Render ConflictResolver modal when there are conflicts
  return <ConflictResolver onResolve={handleConflictResolve} />;
};
