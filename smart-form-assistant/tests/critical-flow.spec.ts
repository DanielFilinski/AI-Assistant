import { test, expect } from '@playwright/test';
import { SAMPLE_RESUME } from './sample-resume';

test.describe('Critical User Flow', () => {
  test('full authentication and form flow with auto-save', async ({ page }) => {
    // 1. Navigate to login page
    await page.goto('/');
    await expect(page).toHaveURL('/login');

    // 2. Start authentication
    await page.fill('[name="email"]', 'test@example.com');
    await page.click('button:has-text("Send Magic Link")');

    // 3. Wait for magic link to be generated
    await expect(page.locator('text=Magic link generated')).toBeVisible({ timeout: 10000 });

    // 4. Get and click the magic link
    const magicLinkElement = page.locator('[data-testid="magic-link"]');
    const magicLinkHref = await magicLinkElement.getAttribute('href');
    expect(magicLinkHref).toBeTruthy();
    
    await page.goto(magicLinkHref!);

    // 5. Should be redirected to form
    await expect(page).toHaveURL('/form', { timeout: 10000 });
    await expect(page.locator('text=Job Application Form')).toBeVisible();

    // 6. Fill Step 1 - Personal Information
    await page.fill('[name="fullName"]', 'John Doe');
    await page.fill('[name="email"]', 'john@example.com');
    await page.fill('[name="phone"]', '+1-555-0123');
    await page.fill('[name="location"]', 'San Francisco, USA');

    // Wait for auto-save indicator
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 5000 });

    // 7. Click Next to go to Step 2
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=Step 2 of 4')).toBeVisible();

    // 8. Refresh page to test auto-save restoration
    await page.reload();

    // 9. Verify we're back on Step 2 with saved data
    await expect(page.locator('text=Step 2 of 4')).toBeVisible({ timeout: 10000 });

    // Navigate back to Step 1 to verify data was saved
    await page.click('button:has-text("Previous")');
    await expect(page.locator('[name="fullName"]')).toHaveValue('John Doe');
    await expect(page.locator('[name="email"]')).toHaveValue('john@example.com');
    await expect(page.locator('[name="phone"]')).toHaveValue('+1-555-0123');
    await expect(page.locator('[name="location"]')).toHaveValue('San Francisco, USA');

    // 10. Continue to fill remaining steps
    await page.click('button:has-text("Next")');
    
    // Step 2 - Work Experience
    await page.fill('[name="currentPosition"]', 'Senior Software Engineer');
    await page.fill('[name="company"]', 'TechCorp');
    await page.fill('[name="yearsOfExperience"]', '5');
    await page.fill('[name="keyAchievements"]', 'Led development of microservices architecture');
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Next")');

    // Step 3 - Technical Skills
    await expect(page.locator('text=Step 3 of 4')).toBeVisible();
    await page.fill('[name="primarySkills"]', 'Full-stack development, system architecture');
    await page.fill('[name="programmingLanguages"]', 'TypeScript, Python, Go');
    await page.fill('[name="frameworksAndTools"]', 'React, Next.js, Docker');
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Next")');

    // Step 4 - Motivation
    await expect(page.locator('text=Step 4 of 4')).toBeVisible();
    await page.fill('[name="motivation"]', 'I am excited about this opportunity because it aligns with my passion for building scalable systems.');
    await page.fill('[name="startDate"]', 'Immediately');
    await page.fill('[name="expectedSalary"]', '$120,000 - $150,000');
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 5000 });

    // 11. Go to review page
    await page.click('button:has-text("Review & Submit")');
    await expect(page.locator('text=Review Your Application')).toBeVisible();

    // Verify all data is displayed in review
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Senior Software Engineer')).toBeVisible();
    await expect(page.locator('text=TechCorp')).toBeVisible();

    // 12. Submit the form
    await page.click('button:has-text("Submit Application")');

    // 13. Verify submission success
    await expect(page.locator('text=Application Submitted!')).toBeVisible({ timeout: 10000 });
  });
});

