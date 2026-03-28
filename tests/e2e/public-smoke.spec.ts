import { test, expect } from '@playwright/test';

test.describe('Public routes', () => {
  test('landing page renders primary marketing copy', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/jobflow/i);
    await expect(page.locator('a[href="/privacy"]').first()).toBeVisible();
    await expect(page.locator('a[href="/terms"]').first()).toBeVisible();
  });

  test('terms page loads', async ({ page }) => {
    await page.goto('/terms');

    await expect(page).toHaveURL(/\/terms$/);
    await expect(page.getByRole('heading', { level: 1, name: /terms/i })).toBeVisible();
  });

  test('privacy page loads', async ({ page }) => {
    await page.goto('/privacy');

    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole('heading', { level: 1, name: /privacy/i })).toBeVisible();
  });

  test('unknown route falls back to not found', async ({ page }) => {
    await page.goto('/definitely-not-a-real-route');

    await expect(page).toHaveURL(/definitely-not-a-real-route$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/not found|404|something went wrong/i);
  });
});
