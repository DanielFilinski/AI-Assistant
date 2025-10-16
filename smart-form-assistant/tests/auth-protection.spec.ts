import { test, expect } from '@playwright/test';

test.describe('Authentication Protection', () => {
  test('redirects to login when accessing form without auth', async ({ page, context }) => {
    // Clear all cookies
    await context.clearCookies();

    // Try to access form page
    await page.goto('/form');

    // Should be redirected to login
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('API endpoints return 401 without authentication', async ({ request, context }) => {
    // Clear cookies
    await context.clearCookies();

    // Test forms/progress endpoint
    const progressResponse = await request.get('/api/forms/progress');
    expect(progressResponse.status()).toBe(401);

    // Test AI autofill endpoint
    const autofillResponse = await request.post('/api/ai/autofill', {
      data: { resumeText: 'test resume' },
    });
    expect(autofillResponse.status()).toBe(401);

    // Test AI improve endpoint
    const improveResponse = await request.post('/api/ai/improve', {
      data: { text: 'test', field: 'keyAchievements' },
    });
    expect(improveResponse.status()).toBe(401);
  });

  test('successful logout clears session', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'logout-test@example.com');
    await page.click('button:has-text("Send Magic Link")');
    
    const magicLinkElement = page.locator('[data-testid="magic-link"]');
    await expect(magicLinkElement).toBeVisible({ timeout: 10000 });
    const magicLinkHref = await magicLinkElement.getAttribute('href');
    await page.goto(magicLinkHref!);
    
    // Verify we're logged in
    await expect(page).toHaveURL('/form', { timeout: 10000 });

    // Logout
    await page.click('text=Logout');

    // Should be redirected to login
    await expect(page).toHaveURL('/login', { timeout: 5000 });

    // Try to access form again
    await page.goto('/form');

    // Should be redirected back to login
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });
});

