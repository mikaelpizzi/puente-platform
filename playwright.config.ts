import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Puente Platform E2E Tests
 *
 * Run: pnpm test:e2e
 * Debug: pnpm test:e2e --debug
 */
export default defineConfig({
  testDir: './e2e/tests',

  // Run tests in parallel per file
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter config
  reporter: [['html', { open: 'never', outputFolder: 'e2e/report' }], ['list']],

  // Global timeout
  timeout: 30 * 1000,

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on retry
    video: 'on-first-retry',

    // Locale and timezone
    locale: 'es-VE',
    timezoneId: 'America/Caracas',
  },

  // Configure projects for major browsers
  projects: [
    // Desktop Chrome
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Mobile Chrome (Samsung Galaxy)
    {
      name: 'mobile-chrome',
      use: { ...devices['Galaxy S9+'] },
    },

    // Desktop Firefox (optional)
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'pnpm --filter @puente/pwa dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Output folder for artifacts
  outputDir: 'e2e/results',
});
