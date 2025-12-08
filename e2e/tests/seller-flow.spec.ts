import { test, expect } from '@playwright/test';

test.describe('Seller Dashboard Flow', () => {
  // Note: These tests require authentication. In CI, use storageState or API login.

  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/inventory');

    await expect(page).toHaveURL(/\/login/);
  });

  test.describe('Inventory Management (authenticated)', () => {
    // Skip auth tests in this basic setup
    test.skip('should display inventory dashboard', async ({ page }) => {
      // This test would use authenticated state
      await page.goto('/inventory');

      await expect(page.getByRole('heading', { name: /inventario|productos/i })).toBeVisible();
    });

    test.skip('should create new product', async ({ page }) => {
      await page.goto('/inventory');

      // Click add product button
      await page.getByRole('button', { name: /agregar|nuevo|crear/i }).click();

      // Fill form
      await page.getByLabel(/título|nombre/i).fill('Test Product');
      await page.getByLabel(/precio/i).fill('100');
      await page.getByLabel(/stock|cantidad/i).fill('10');

      // Submit
      await page.getByRole('button', { name: /guardar|crear/i }).click();

      // Verify success
      await expect(page.getByText(/creado|guardado/i)).toBeVisible();
    });
  });
});

test.describe('Orders Management', () => {
  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/orders');

    await expect(page).toHaveURL(/\/login/);
  });

  test.describe('Order List (authenticated)', () => {
    test.skip('should display orders list', async ({ page }) => {
      await page.goto('/orders');

      await expect(page.getByRole('heading', { name: /pedidos|órdenes/i })).toBeVisible();
    });
  });
});
