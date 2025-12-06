import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { InventoryDashboard } from './InventoryDashboard';
import * as productsApi from './productsApi';
import inventoryReducer from './inventorySlice';

// Mock the API hooks
vi.mock('./productsApi', () => ({
  useGetProductsQuery: vi.fn(),
  useCreateProductMutation: vi.fn(),
  productsApi: {
    reducerPath: 'productsApi',
    reducer: (state = {}) => state,
    middleware: (getDefault: any) => getDefault(),
  },
}));

describe('InventoryDashboard', () => {
  const mockUnwrap = vi.fn();
  const mockCreateProduct = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUnwrap.mockResolvedValue({});
    mockCreateProduct.mockReturnValue({ unwrap: mockUnwrap });

    // Default mock implementation for mutation
    (productsApi.useCreateProductMutation as any).mockReturnValue([
      mockCreateProduct,
      { isLoading: false },
    ]);

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });
  });

  const createTestStore = () =>
    configureStore({
      reducer: {
        inventory: inventoryReducer,
        [productsApi.productsApi.reducerPath]: productsApi.productsApi.reducer,
      },
      middleware: (getDefault) => getDefault(),
    });

  it('renders loading state initially', () => {
    // Mock isLoading: true
    (productsApi.useGetProductsQuery as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(
      <Provider store={createTestStore()}>
        <InventoryDashboard />
      </Provider>,
    );

    // Check for skeleton loader (pulse animation)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders product list and opens modal when "Nuevo" button is clicked', () => {
    // Mock success state
    (productsApi.useGetProductsQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(
      <Provider store={createTestStore()}>
        <InventoryDashboard />
      </Provider>,
    );

    // Should not show skeletons
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(0);

    const newButton = screen.getByText('+ Nuevo');
    fireEvent.click(newButton);

    expect(screen.getByText('Nuevo Producto')).toBeTruthy();
  });

  it('validates negative inputs', () => {
    // Mock success state
    (productsApi.useGetProductsQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    // Mock window.alert
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <Provider store={createTestStore()}>
        <InventoryDashboard />
      </Provider>,
    );

    // Open modal
    fireEvent.click(screen.getByText('+ Nuevo'));

    // Fill form with valid data first
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Test Product' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Test Desc' } });
    fireEvent.change(screen.getByLabelText('Stock'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('SKU'), { target: { value: 'TEST-123' } });

    // Fill form with negative price
    const priceInput = screen.getByLabelText('Precio');
    fireEvent.change(priceInput, { target: { value: '-10' } });

    // Submit
    const saveButton = screen.getByText('Guardar');
    fireEvent.click(saveButton);

    // HTML5 validation might prevent submission, or our JS check might.
    // Either way, the mutation should not be called.
    expect(mockCreateProduct).not.toHaveBeenCalled();

    alertMock.mockRestore();
  });

  it('calls createProduct mutation with correct data when online', () => {
    // Mock success state
    (productsApi.useGetProductsQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(
      <Provider store={createTestStore()}>
        <InventoryDashboard />
      </Provider>,
    );

    // Open modal
    fireEvent.click(screen.getByText('+ Nuevo'));

    // Fill form
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Coca Cola' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Refresco' } });
    fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '1500' } });
    fireEvent.change(screen.getByLabelText('Stock'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('SKU'), { target: { value: 'COKE-001' } });

    // Submit
    fireEvent.click(screen.getByText('Guardar'));

    expect(mockCreateProduct).toHaveBeenCalledWith({
      name: 'Coca Cola',
      description: 'Refresco',
      price: 1500,
      stock: 10,
      sku: 'COKE-001',
      vertical: 'general',
    });
  });

  it('adds to pending queue when offline', () => {
    // Mock offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

    // Mock success state (empty list)
    (productsApi.useGetProductsQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    const store = createTestStore();
    render(
      <Provider store={store}>
        <InventoryDashboard />
      </Provider>,
    );

    // Open modal
    fireEvent.click(screen.getByText('+ Nuevo'));

    // Fill form
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Offline Product' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Desc' } });
    fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Stock'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('SKU'), { target: { value: 'OFF-1' } });

    // Submit
    fireEvent.click(screen.getByText('Guardar'));

    // Should NOT call mutation
    expect(mockCreateProduct).not.toHaveBeenCalled();

    // Should be in store
    const state = store.getState();
    expect(state.inventory.pendingProducts).toHaveLength(1);
    expect(state.inventory.pendingProducts[0].name).toBe('Offline Product');

    // Should appear in UI (we need to re-render or check if the component updates)
    // The component is connected to the store, so it should update.
    expect(screen.getByText('Offline Product')).toBeTruthy();
  });
});
