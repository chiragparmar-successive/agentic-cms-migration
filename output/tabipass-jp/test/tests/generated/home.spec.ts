import { test, expect } from '@playwright/test';

test.describe('Home Page UI-Home-01', () => {
  test('Verify Homepage loads and displays key sections', async ({ page }) => {
    // Step 1: Navigate to home page
    await page.goto('/');

    // Step 2: Verify page title
    await expect(page).toHaveTitle(/TabiPass/);

    // Step 3: Verify Member Login button
    const loginButton = page.getByRole('button', { name: /ログイン/i }).or(page.getByText(/ログイン/i));
    await expect(loginButton.first()).toBeVisible();

    // Step 4: Scroll and verify mission statement (example)
    // await page.mouse.wheel(0, 500);
    // await expect(page.getByText(/旅の感動/i)).toBeVisible();
  });
});
