import { test, expect } from '@playwright/test';
import { testUsers, generateTestEmail } from '../fixtures/test-data';

test.describe('Authentication Flow', () => {
  test.describe('Login', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
      await expect(page.getByLabel(/correo/i)).toBeVisible();
      await expect(page.getByLabel(/contraseña/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/correo/i).fill('invalid@example.com');
      await page.getByLabel(/contraseña/i).fill('wrongpassword');
      await page.getByRole('button', { name: /entrar/i }).click();

      await expect(page.getByText(/credenciales/i)).toBeVisible({ timeout: 10000 });
    });

    test('should redirect to register page', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('link', { name: /crear cuenta/i }).click();

      await expect(page).toHaveURL(/\/register/);
    });
  });

  test.describe('Registration', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register');

      await expect(page.getByRole('heading', { name: /crear cuenta|registro/i })).toBeVisible();
      await expect(page.getByLabel(/nombre/i)).toBeVisible();
      await expect(page.getByLabel(/correo/i)).toBeVisible();
      await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/register');

      await page.getByLabel(/correo/i).fill('invalid-email');
      await page.getByLabel(/contraseña/i).focus(); // Trigger blur

      await expect(page.getByText(/correo.*válido/i)).toBeVisible();
    });

    test('should validate password strength', async ({ page }) => {
      await page.goto('/register');

      await page.getByLabel(/contraseña/i).fill('123');
      await page.getByLabel(/nombre/i).focus(); // Trigger blur

      await expect(page.getByText(/mínimo|caracteres/i)).toBeVisible();
    });
  });
});

test.describe('Authenticated Routes', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/inventory');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing orders', async ({ page }) => {
    await page.goto('/orders');

    await expect(page).toHaveURL(/\/login/);
  });
});
