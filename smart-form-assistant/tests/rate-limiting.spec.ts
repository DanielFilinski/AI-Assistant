import { test, expect } from '@playwright/test';

test.describe('Rate Limiting', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'rate-limit-test@example.com');
    await page.click('button:has-text("Send Magic Link")');
    
    const magicLinkElement = page.locator('[data-testid="magic-link"]');
    await expect(magicLinkElement).toBeVisible({ timeout: 10000 });
    const magicLinkHref = await magicLinkElement.getAttribute('href');
    await page.goto(magicLinkHref!);
    await expect(page).toHaveURL('/form', { timeout: 10000 });
  });

  test('rate limit enforcement for AI requests', async ({ page }) => {
    // Go to step 2 where we can use AI improve
    await page.click('button:has-text("Next")');
    
    // Fill required fields
    await page.fill('[name="currentPosition"]', 'Engineer');
    await page.fill('[name="company"]', 'Tech Co');
    await page.fill('[name="yearsOfExperience"]', '2');

    // Make 10 AI requests
    for (let i = 0; i < 10; i++) {
      await page.fill('[name="keyAchievements"]', `Achievement number ${i + 1}`);
      await page.click('text=✨ Improve with AI');
      
      // Wait for response
      try {
        await expect(
          page.locator('text=AI Suggestion, text=Rate limit exceeded').first()
        ).toBeVisible({ timeout: 30000 });
        
        // If we got AI Suggestion, close it
        const rejectBtn = page.locator('button:has-text("Reject")');
        if (await rejectBtn.isVisible()) {
          await rejectBtn.click();
        }
      } catch (error) {
        // If rate limit hit, break the loop
        break;
      }

      // Small delay between requests
      await page.waitForTimeout(500);
    }

    // 11th request should show rate limit error
    await page.fill('[name="keyAchievements"]', 'Achievement number 11');
    await page.click('text=✨ Improve with AI');

    // Should see rate limit error
    await expect(
      page.locator('text=Rate limit exceeded, text=Try again').first()
    ).toBeVisible({ timeout: 5000 });
  });
});

