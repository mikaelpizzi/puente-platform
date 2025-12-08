/**
 * Test fixtures for E2E tests.
 * Provides common test data and utility functions.
 */

export const testUsers = {
  buyer: {
    email: 'buyer-test@puente.com',
    password: 'TestPuente123!',
    role: 'BUYER',
  },
  seller: {
    email: 'seller-test@puente.com',
    password: 'TestPuente123!',
    role: 'SELLER',
  },
  courier: {
    email: 'courier-test@puente.com',
    password: 'TestPuente123!',
    role: 'COURIER',
  },
} as const;

export const testProducts = {
  laptop: {
    title: 'Laptop HP Pavilion 15',
    description: 'Laptop para trabajo y estudio, 8GB RAM, 256GB SSD',
    price: 450,
    currency: 'USDT',
    stock: 5,
    vertical: 'TECH',
  },
  groceries: {
    title: 'Cesta de Verduras Frescas',
    description: 'Tomates, pimientos, cebollas y zanahorias orgánicas',
    price: 15,
    currency: 'USDT',
    stock: 20,
    vertical: 'GROCERIES',
  },
} as const;

export const testAddresses = {
  caracas: {
    label: 'home',
    street: 'Av. Francisco de Miranda, Centro Comercial Lido',
    city: 'Caracas',
    state: 'Distrito Capital',
    country: 'Venezuela',
    zipCode: '1010',
    latitude: 10.4806,
    longitude: -66.9036,
  },
} as const;

/**
 * Wait for network to be idle.
 */
export async function waitForNetworkIdle(page: {
  waitForLoadState: (state: string) => Promise<void>;
}) {
  await page.waitForLoadState('networkidle');
}

/**
 * Generate unique test email.
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  return `${prefix}-${timestamp}@puente-test.com`;
}
