import { expect, test } from '@playwright/test';

test.describe('Marketing Chat UI', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Dismiss any cookie banner or consent modal if present
    const cookieBanner = page.locator('[data-testid="cookie-banner"], .cookie-consent, [aria-label*="cookie"]');
    if (await cookieBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBanner.locator('button').first().click().catch(() => {});
    }
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({ path: `test-results/failure-${testInfo.title.replace(/\s+/g, '-')}.png` });
    }
  });

  test('should open the chat modal and display UI elements', async ({ page }) => {
    // Find the chat trigger button - use force click to bypass overlay
    const chatTrigger = page.locator('button[aria-label="Open chat with molē"]');
    await expect(chatTrigger).toBeVisible({ timeout: 15000 });
    await chatTrigger.click({ force: true });

    // Use specific selector for chat dialog (not mobile menu)
    const chatDialog = page.locator('div[role="dialog"][aria-labelledby="chat-panel-title"]').first();
    await expect(chatDialog).toBeVisible({ timeout: 5000 });

    // Wait for slide-in animation to complete
    await page.waitForTimeout(500);

    // Verify chat elements within dialog
    await expect(chatDialog.locator('text=molē').first()).toBeVisible();
    const chatInput = chatDialog.locator('textarea');
    await expect(chatInput).toBeVisible();

    // Verify send button exists
    const sendButton = chatDialog.locator('button[aria-label="Send message"]');
    await expect(sendButton).toBeVisible();
  });

  test('should allow typing in the chat input', async ({ page }) => {
    // Open chat with force click
    const chatTrigger = page.locator('button[aria-label="Open chat with molē"]');
    await expect(chatTrigger).toBeVisible({ timeout: 15000 });
    await chatTrigger.click({ force: true });

    const chatDialog = page.locator('div[role="dialog"][aria-labelledby="chat-panel-title"]').first();
    await expect(chatDialog).toBeVisible();
    await page.waitForTimeout(500); // Wait for animation

    const input = chatDialog.locator('textarea');
    await expect(input).toBeVisible();

    // Type a message
    const testMessage = 'Hello test message';
    await input.fill(testMessage);

    // Verify the input has the text
    await expect(input).toHaveValue(testMessage);
  });

  // These tests require backend integration - skip in CI without backend
  test.skip('should send message and display in chat', async ({ page }) => {
    // Requires chat service integration
  });

  test.skip('should receive streaming response from assistant', async ({ page }) => {
    // Requires backend SSE endpoint
  });
});
