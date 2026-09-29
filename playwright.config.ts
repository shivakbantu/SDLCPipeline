import { defineConfig, devices } from '@playwright/test';

/**
 * Base URL is intentionally configurable because the application URL is not available in-repo.
 * Provide via env: BASE_URL=https://your-app.example.com
 */
const baseURL = process.env.BASE_URL || 'https://example.com';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  outputDir: 'test-results/artifacts',
});
