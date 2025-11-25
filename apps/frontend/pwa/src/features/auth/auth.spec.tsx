import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import authReducer, { setCredentials } from './authSlice';
import { RequireAuth } from './RequireAuth';
import { api } from '../../app/api';

// Mock the API
const mockStore = configureStore({
  reducer: {
    auth: authReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

describe('Auth Feature', () => {
  it('redirects unauthenticated users to login', () => {
    render(
      <Provider store={mockStore}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <div>Protected Content</div>
                </RequireAuth>
              }
            />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText('Login Page')).toBeTruthy();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('allows authenticated users to access protected routes', () => {
    // Set authenticated state
    mockStore.dispatch(
      setCredentials({
        user: { id: '1', email: 'test@test.com', role: 'seller' },
        token: 'fake-token',
      }),
    );

    render(
      <Provider store={mockStore}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <div>Protected Content</div>
                </RequireAuth>
              }
            />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText('Protected Content')).toBeTruthy();
  });
});
