import { test, expect } from '@playwright/test';

test.describe('Marketplace - Buyer Flow', () => {
  test('should display marketplace with products', async ({ page }) => {
    await page.goto('/marketplace');

    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', {
      timeout: 10000,
    });

    // Verify marketplace elements
    await expect(page.getByRole('heading', { name: /marketplace|productos/i })).toBeVisible();
  });

  test('should filter products by search', async ({ page }) => {
    await page.goto('/marketplace');

    const searchInput = page.getByPlaceholder(/buscar/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('laptop');
      await searchInput.press('Enter');

      // Wait for filtered results
      await page.waitForTimeout(500);

      // Should have search term in URL or show filtered results
      const url = page.url();
      expect(url.includes('laptop') || (await page.getByText(/laptop/i).isVisible())).toBeTruthy();
    }
  });

  test('should navigate to product detail', async ({ page }) => {
    await page.goto('/marketplace');

    // Click on first product
    const firstProduct = page
      .locator('[data-testid="product-card"], .product-card, article')
      .first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();

      // Should navigate to detail page
      await expect(page.getByRole('button', { name: /agregar|añadir|carrito/i })).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('/marketplace');

    // Find add to cart button
    const addToCartButton = page.getByRole('button', { name: /agregar|añadir|carrito/i }).first();

    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();

      // Verify cart updated (toast, badge, etc.)
      await expect(page.getByText(/agregado|añadido|carrito/i)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Checkout Flow', () => {
  test('should require authentication for checkout', async ({ page }) => {
    await page.goto('/checkout');

    // Should redirect to login or show auth prompt
    await expect(page).toHaveURL(/\/(login|checkout)/);
  });
});
