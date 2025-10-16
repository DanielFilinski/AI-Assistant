import { test, expect } from '@playwright/test';
import { SAMPLE_RESUME } from './sample-resume';

test.describe('AI Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'ai-test@example.com');
    await page.click('button:has-text("Send Magic Link")');
    
    const magicLinkElement = page.locator('[data-testid="magic-link"]');
    await expect(magicLinkElement).toBeVisible({ timeout: 10000 });
    const magicLinkHref = await magicLinkElement.getAttribute('href');
    await page.goto(magicLinkHref!);
    await expect(page).toHaveURL('/form', { timeout: 10000 });
  });

  test('AI autofill from resume', async ({ page }) => {
    // 1. Click Import from Resume button
    await page.click('button:has-text("Import from Resume")');

    // 2. Modal should open
    await expect(page.locator('text=Paste your resume text here')).toBeVisible();

    // 3. Paste resume text
    await page.fill('[name="resumeText"]', SAMPLE_RESUME);

    // 4. Click Extract Information
    await page.click('button:has-text("Extract Information")');

    // 5. Wait for extraction to complete
    await expect(page.locator('[data-testid="extracted-data"]')).toBeVisible({ timeout: 30000 });

    // 6. Verify extracted data is displayed
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=john.doe@email.com')).toBeVisible();

    // 7. Accept extracted data
    await page.click('button:has-text("Accept & Fill Form")');

    // 8. Verify form fields are filled
    await expect(page.locator('[name="fullName"]')).toHaveValue('John Doe');
    await expect(page.locator('[name="email"]')).toHaveValue('john.doe@email.com');
    await expect(page.locator('[name="phone"]')).toHaveValue('+1-555-0123');
  });

  test('AI improve text functionality', async ({ page }) => {
    // Navigate to Step 2
    await page.click('button:has-text("Next")'); // Skip step 1 for now
    
    // Fill in required fields for Step 2
    await page.fill('[name="currentPosition"]', 'Developer');
    await page.fill('[name="company"]', 'Company');
    await page.fill('[name="yearsOfExperience"]', '3');
    
    // Fill achievements with basic text
    const basicText = 'I worked on projects and helped the team';
    await page.fill('[name="keyAchievements"]', basicText);

    // Click AI Improve button
    await page.click('text=✨ Improve with AI');

    // Wait for improved text to appear
    await expect(page.locator('text=AI Suggestion')).toBeVisible({ timeout: 30000 });

    // Improved text should be different from original
    const improvedText = await page.locator('[data-testid="extracted-data"], .bg-indigo-50').textContent();
    expect(improvedText).toBeTruthy();

    // Accept the improved text
    await page.click('button:has-text("Accept")');

    // Verify the field was updated
    const fieldValue = await page.locator('[name="keyAchievements"]').inputValue();
    expect(fieldValue).not.toBe(basicText);
    expect(fieldValue.length).toBeGreaterThan(basicText.length);
  });
});

