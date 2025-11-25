import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { CreateProductRequest } from './productsApi';

export interface PendingProduct extends CreateProductRequest {
  tempId: string;
  timestamp: number;
}

export interface ErrorProduct extends PendingProduct {
  error: string;
}

interface InventoryState {
  pendingProducts: PendingProduct[];
  errorProducts: ErrorProduct[];
}

// Load from localStorage if available
const loadState = (): InventoryState => {
  try {
    const serializedState = localStorage.getItem('inventoryState');
    if (serializedState === null) {
      return { pendingProducts: [], errorProducts: [] };
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return { pendingProducts: [], errorProducts: [] };
  }
};

const initialState: InventoryState = loadState();

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    addPendingProduct: (state, action: PayloadAction<CreateProductRequest>) => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      state.pendingProducts.push({
        ...action.payload,
        tempId,
        timestamp: Date.now(),
      });
      localStorage.setItem('inventoryState', JSON.stringify(state));
    },
    removePendingProduct: (state, action: PayloadAction<string>) => {
      state.pendingProducts = state.pendingProducts.filter((p) => p.tempId !== action.payload);
      localStorage.setItem('inventoryState', JSON.stringify(state));
    },
    moveToError: (state, action: PayloadAction<{ tempId: string; error: string }>) => {
      const product = state.pendingProducts.find((p) => p.tempId === action.payload.tempId);
      if (product) {
        state.pendingProducts = state.pendingProducts.filter(
          (p) => p.tempId !== action.payload.tempId,
        );
        state.errorProducts.push({ ...product, error: action.payload.error });
      }
      localStorage.setItem('inventoryState', JSON.stringify(state));
    },
    removeErrorProduct: (state, action: PayloadAction<string>) => {
      state.errorProducts = state.errorProducts.filter((p) => p.tempId !== action.payload);
      localStorage.setItem('inventoryState', JSON.stringify(state));
    },
    retryErrorProduct: (state, action: PayloadAction<string>) => {
      const product = state.errorProducts.find((p) => p.tempId === action.payload);
      if (product) {
        state.errorProducts = state.errorProducts.filter((p) => p.tempId !== action.payload);
        // Remove error field and add back to pending
        const { error, ...pendingProduct } = product;
        state.pendingProducts.push(pendingProduct);
      }
      localStorage.setItem('inventoryState', JSON.stringify(state));
    },
  },
});

export const {
  addPendingProduct,
  removePendingProduct,
  moveToError,
  removeErrorProduct,
  retryErrorProduct,
} = inventorySlice.actions;

export const selectPendingProducts = (state: RootState) => state.inventory.pendingProducts;
export const selectErrorProducts = (state: RootState) => state.inventory.errorProducts;

export default inventorySlice.reducer;
