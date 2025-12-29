import { expect, test } from '@playwright/test';

// These tests require backend to be running
// Skip in CI environments without backend access
test.describe('Marketing Chat Performance', () => {
  test.skip(({ browserName }) => true, 'Requires live backend - skipping in automated runs');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Dismiss any cookie banner if present
    const cookieBanner = page.locator('[data-testid="cookie-banner"], .cookie-consent');
    if (await cookieBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBanner.locator('button').first().click().catch(() => {});
    }
  });

  test('should measure Time to First Token (TTFT)', async ({ page }) => {
    const chatTrigger = page.locator('button[aria-label="Open chat with molē"]');
    await expect(chatTrigger).toBeVisible({ timeout: 15000 });
    await chatTrigger.click({ force: true });

    const chatDialog = page.locator('div[role="dialog"][aria-labelledby="chat-panel-title"]').first();
    const input = chatDialog.locator('textarea');
    await expect(input).toBeVisible();
    await input.fill('Performance test query');

    const start = Date.now();
    await chatDialog.locator('button[aria-label="Send message"]').click({ force: true });

    // Wait for first token (any text in assistant message)
    await chatDialog.locator('.chat-message-assistant-text').first().waitFor({ timeout: 30000 });
    const end = Date.now();
    const ttft = end - start;

    console.log(`TTFT: ${ttft}ms`);
    expect(ttft).toBeLessThan(15000); // 15s threshold for cold start
  });

  test('should monitor memory usage', async ({ page }) => {
    const chatTrigger = page.locator('button[aria-label="Open chat with molē"]');
    await expect(chatTrigger).toBeVisible({ timeout: 15000 });
    await chatTrigger.click({ force: true });

    const chatDialog = page.locator('div[role="dialog"][aria-labelledby="chat-panel-title"]').first();
    const input = chatDialog.locator('textarea');
    const send = chatDialog.locator('button[aria-label="Send message"]');
    await expect(input).toBeVisible();

    for (let i = 0; i < 2; i++) {
      await input.fill(`Message ${i}`);
      await send.click({ force: true });
      // Wait for response
      await chatDialog.locator('.chat-message-assistant-text').first().waitFor({ timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    // Check memory (Chrome only)
    const memory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize);
    if (memory) {
      console.log(`Used JS Heap: ${memory / 1024 / 1024} MB`);
      expect(memory).toBeLessThan(200 * 1024 * 1024); // < 200MB limit
    }
  });
});
