import { test, expect } from '@playwright/test';

/**
 * NOTE:
 * Repo does not contain application UI or routes; this suite provides a smoke check that
 * the configured BASE_URL is reachable and has expected baseline properties.
 *
 * Replace/extend with app-specific tests once routes/selectors are known.
 */

test.describe('Smoke - base URL reachability', () => {
  test('GET / returns 2xx/3xx and has a title', async ({ page, baseURL }) => {
    await page.goto(baseURL || '/');

    // Playwright throws on non-2xx/3xx only when waitUntil is "load"? We validate explicitly.
    const response = await page.goto(baseURL || '/');
    expect(response, 'Expected a response when navigating to baseURL').not.toBeNull();

    const status = response!.status();
    expect(status, `Expected baseURL to be reachable. Got status ${status}`).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(400);

    await expect(page).toHaveTitle(/.+/);
  });

  test('page contains a <body> element', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
