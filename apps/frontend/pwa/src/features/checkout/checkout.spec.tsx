import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CheckoutPage } from './CheckoutPage';
import cartReducer from './cartSlice';
import * as productsApi from '../inventory/productsApi';

// Mock the API hooks
vi.mock('../inventory/productsApi', () => ({
  useGetProductsQuery: vi.fn(),
  productsApi: {
    reducerPath: 'productsApi',
    reducer: (state = {}) => state,
    middleware: (getDefault: any) => getDefault(),
  },
}));

// Mock QRCode component since it might use canvas/svg which can be tricky in jsdom
vi.mock('react-qr-code', () => ({
  default: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

const createTestStore = () =>
  configureStore({
    reducer: {
      cart: cartReducer,
      [productsApi.productsApi.reducerPath]: productsApi.productsApi.reducer,
    },
    middleware: (getDefault) => getDefault(),
  });

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds items to cart and calculates total', () => {
    // Mock products
    (productsApi.useGetProductsQuery as any).mockReturnValue({
      data: [
        { id: '1', name: 'Product A', price: 100, stock: 10 },
        { id: '2', name: 'Product B', price: 50, stock: 5 },
      ],
      isLoading: false,
    });

    const store = createTestStore();
    render(
      <Provider store={store}>
        <CheckoutPage />
      </Provider>,
    );

    // Add Product A (click the button in the list)
    // Since "Product A" appears in the list, we can find it.
    // Initially it appears once.
    const productAButton = screen.getByText('Product A');
    fireEvent.click(productAButton);

    // Now "Product A" should appear twice (list + cart)
    const productAElements = screen.getAllByText('Product A');
    expect(productAElements).toHaveLength(2);

    expect(screen.getByText('$100.00')).toBeTruthy(); // Total

    // Add Product B
    const productBButton = screen.getByText('Product B');
    fireEvent.click(productBButton);

    // Check total (100 + 50 = 150)
    expect(screen.getByText('$150.00')).toBeTruthy();
  });

  it('generates QR code on payment', () => {
    // Mock products
    (productsApi.useGetProductsQuery as any).mockReturnValue({
      data: [{ id: '1', name: 'Product A', price: 100, stock: 10 }],
      isLoading: false,
    });

    const store = createTestStore();
    render(
      <Provider store={store}>
        <CheckoutPage />
      </Provider>,
    );

    // Add item
    fireEvent.click(screen.getByText('Product A'));

    // Click Pay
    fireEvent.click(screen.getByText('Cobrar'));

    // Check for QR code
    expect(screen.getByTestId('qr-code')).toBeTruthy();

    // Check QR content contains amount
    const qrContent = screen.getByTestId('qr-code').textContent;
    expect(qrContent).toContain('"amount":100');
  });
});
