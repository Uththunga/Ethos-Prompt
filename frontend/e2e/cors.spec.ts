import { expect, test } from '@playwright/test';

// E2E CORS sanity test
// This test listens for console errors that contain common CORS indicators
// while performing a minimal user flow that triggers callable function usage.
// It will fail fast if any CORS-related error messages are observed.

test.describe('CORS validation', () => {
  test.beforeEach(async () => {
    const projectName = test.info().project.name;
    test.skip(
      projectName !== 'chromium',
      'Skipping CORS validation E2E tests on non-Chromium projects in this environment.'
    );
  });

  test('no CORS errors during prompt flows', async ({ page }) => {
    const corsErrors: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (/CORS|Access-Control-Allow-Origin|preflight|No \'Access-Control-Allow-Origin\' header/i.test(text)) {
        corsErrors.push(text);
      }
    });

    // Navigate to prompts page
    await page.goto('/prompts');

    // If login is required, attempt a basic login if login form is present
    const hasLogin = await page.getByRole('button', { name: /sign in|login/i }).isVisible().catch(() => false);
    if (hasLogin) {
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('testpassword');
      await page.getByRole('button', { name: /sign in|login/i }).click();
      // Wait for redirect to dashboard or prompts
      await page.waitForURL(/(dashboard|prompts)/, { timeout: 15000 }).catch(() => {});
    }

    // Go to /prompts again to ensure we're on the page
    await page.goto('/prompts');

    // Click AI-Assisted Creation if visible (this likely triggers callable usage)
    const aiCreateBtn = page.getByRole('button', { name: /ai-assisted creation/i });
    if (await aiCreateBtn.isVisible().catch(() => false)) {
      await aiCreateBtn.click();
    }

    // Give time for any callables to execute and log errors
    await page.waitForTimeout(3000);

    // Assert no CORS errors were observed
    expect(corsErrors, `CORS errors detected:\n${corsErrors.join('\n')}`).toHaveLength(0);
  });
});
