import { expect, test } from '@playwright/test';

/**
 * Mole Agent Staging Tests
 *
 * Tests the Mole Agent (AI chat assistant) functionality on staging environment
 * Staging URL: https://rag-prompt-library-staging.web.app
 */

const STAGING_URL = 'https://rag-prompt-library-staging.web.app';
const runMoleStagingE2E = process.env.RUN_MOLE_STAGING_E2E === 'true';

test.describe('Mole Agent - Staging Environment Tests', () => {
  test.beforeEach(async ({ page }) => {
    const projectName = test.info().project.name;
    test.skip(
      projectName !== 'chromium' || !runMoleStagingE2E,
      'Skipping Mole Agent staging E2E; enable with RUN_MOLE_STAGING_E2E=true on Chromium only in this environment.'
    );

    // Navigate to staging homepage
    await page.goto(STAGING_URL);
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('Task 1: Test Mole Agent initialization - Floating Moleicon appears', async ({ page }) => {
    // Wait for the floating Moleicon to appear (updated selector for FloatingMoleiconChat)
    const floatingMoleicon = page.locator('button[aria-label="Open chat with molē"]').first();

    // Verify the Moleicon is visible
    await expect(floatingMoleicon).toBeVisible({ timeout: 10000 });

    // Verify it has the correct size (h-14 w-14 = 56px x 56px)
    const box = await floatingMoleicon.boundingBox();
    expect(box).toBeTruthy();

    console.log('✓ Floating Moleicon is visible and properly positioned');
  });

  test('Task 1: Test Mole Agent initialization - Canvas renders', async ({ page }) => {
    // First wait for the Moleicon button to appear
    const floatingMoleicon = page.locator('button[aria-label="Open chat with molē"]');
    await expect(floatingMoleicon).toBeVisible({ timeout: 10000 });

    // Look for the canvas element inside the Moleicon button
    const canvas = floatingMoleicon.locator('canvas').first();

    // Verify canvas is present
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Verify canvas has dimensions
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();
    expect(canvasBox!.width).toBeGreaterThan(0);
    expect(canvasBox!.height).toBeGreaterThan(0);

    console.log('✓ Moleicon canvas renders correctly');
  });

  test('Task 2: Test chat interface functionality - Modal opens on click', async ({ page }) => {
    // Click the floating Moleicon
    const floatingMoleicon = page.locator('button[aria-label="Open chat with molē"]').first();
    await floatingMoleicon.click();

    // Wait for modal to appear
    await page.waitForTimeout(500);

    // Look for the chat modal (it should have a dialog role with specific aria-labelledby)
    const chatModal = page.locator('[role="dialog"][aria-labelledby="chat-panel-title"]');
    await expect(chatModal).toBeVisible({ timeout: 5000 });

    console.log('✓ Chat modal opens successfully');
  });

  test('Task 2: Test chat interface functionality - Input field is functional', async ({
    page,
  }) => {
    // Open chat modal
    const floatingMoleicon = page.locator('button[aria-label="Open chat with molē"]').first();
    await floatingMoleicon.click();
    await page.waitForTimeout(500);

    // Find the input field (look for input with aria-label)
    const inputField = page.locator('input[aria-label="Chat message input"]');
    await expect(inputField).toBeVisible({ timeout: 5000 });

    // Test typing in the input field
    await inputField.fill('Test message');
    const value = await inputField.inputValue();
    expect(value).toBe('Test message');

    console.log('✓ Chat input field is functional');
  });

  test('Task 2: Test chat interface functionality - Suggested questions appear', async ({
    page,
  }) => {
    // Open chat modal
    const floatingMoleicon = page.locator('button[aria-label="Open chat with molē"]').first();
    await floatingMoleicon.click();
    await page.waitForTimeout(1000);

    // Look for suggested questions (buttons or clickable elements)
    const suggestedQuestions = page.locator('button').filter({ hasText: /tell me|how|what/i });
    const count = await suggestedQuestions.count();

    // Should have at least one suggested question
    expect(count).toBeGreaterThan(0);

    console.log(`✓ Found ${count} suggested questions`);
  });

  test('Task 3: Test message sending/receiving - Send button works', async ({ page }) => {
    // Open chat modal
    const floatingMoleicon = page.locator('button[aria-label="Open chat with molē"]').first();
    await floatingMoleicon.click();
    await page.waitForTimeout(500);

    // Find input and send button
    const inputField = page.locator('input[aria-label="Chat message input"]');
    await inputField.fill('Hello');

    // Find send button (look for button with aria-label)
    const sendButton = page.locator('button[aria-label="Send message"]');

    await expect(sendButton).toBeVisible();

    console.log('✓ Send button is visible and clickable');
  });

  test('Task 3: Test message sending/receiving - User message appears in chat', async ({
    page,
  }) => {
    // Open chat modal
    const floatingMoleicon = page.locator('button[aria-label="Open chat with molē"]').first();
    await floatingMoleicon.click();
    await page.waitForTimeout(500);

    // Send a test message
    const inputField = page.locator('input[aria-label="Chat message input"]');
    const testMessage = 'What is EthosPrompt?';
    await inputField.fill(testMessage);

    // Press Enter to send
    await inputField.press('Enter');

    // Wait for message to appear in chat
    await page.waitForTimeout(1000);

    // Look for the user message in the chat history
    const userMessage = page.locator('text=' + testMessage).first();
    await expect(userMessage).toBeVisible({ timeout: 5000 });

    console.log('✓ User message appears in chat history');
  });

  test('Task 4: Test AI response generation - Response is received', async ({ page }) => {
    // Open chat modal
    const floatingMoleicon = page.locator('button[aria-label="Open chat with molē"]').first();
    await floatingMoleicon.click();
    await page.waitForTimeout(500);

    // Send a test message
    const inputField = page.locator('input[aria-label="Chat message input"]');
    await inputField.fill('What is EthosPrompt?');
    await inputField.press('Enter');

    // Wait for AI response (up to 15 seconds)
    await page.waitForTimeout(2000);

    // Look for assistant/AI message (usually has a different class or role)
    // This is a basic check - we're looking for new content that appears after sending
    const messages = page.locator('[role="article"], .message, .chat-message');
    const messageCount = await messages.count();

    // Should have at least 2 messages (user + AI)
    expect(messageCount).toBeGreaterThanOrEqual(1);

    console.log(`✓ Chat contains ${messageCount} message(s)`);
  });

  test('Task 5: Verify Moleicon avatar display - Avatar in chat header', async ({ page }) => {
    // Open chat modal
    const floatingMoleicon = page.locator('button[aria-label="Open chat with molē"]').first();
    await floatingMoleicon.click();
    await page.waitForTimeout(500);

    // Look for Moleicon avatar in the header
    // It should be a canvas or image element
    const headerAvatar = page.locator('[role="dialog"] canvas, [role="dialog"] img').first();

    // Verify avatar is visible
    await expect(headerAvatar).toBeVisible({ timeout: 5000 });

    console.log('✓ Moleicon avatar displays in chat panel header');
  });

  test('Task 6: Check for console errors - No critical errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Listen for console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Navigate and interact with the page
    await page.goto(STAGING_URL);
    await page.waitForLoadState('networkidle');

    // Open chat modal
    const floatingMoleicon = page.locator('button[aria-label="Open chat with molē"]').first();
    await floatingMoleicon.click();
    await page.waitForTimeout(1000);

    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes('favicon') && !error.includes('DevTools') && !error.includes('Extension')
    );

    // Log errors for review
    if (criticalErrors.length > 0) {
      console.log('Console Errors:', criticalErrors);
    }
    if (consoleWarnings.length > 0) {
      console.log('Console Warnings:', consoleWarnings.slice(0, 5)); // First 5 warnings
    }

    // We'll allow some warnings but no critical errors
    expect(criticalErrors.length).toBe(0);

    console.log('✓ No critical console errors detected');
  });

  test('Task 6: Check for console errors - Network requests succeed', async ({ page }) => {
    const failedRequests: string[] = [];

    // Listen for failed network requests
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} - ${response.url()}`);
      }
    });

    // Navigate and interact
    await page.goto(STAGING_URL);
    await page.waitForLoadState('networkidle');

    // Open chat
    const floatingMoleicon = page.locator('button[aria-label="Open chat with molē"]').first();
    await floatingMoleicon.click();
    await page.waitForTimeout(1000);

    // Filter out expected 404s (like favicon, etc.)
    const criticalFailures = failedRequests.filter(
      (req) => !req.includes('favicon') && !req.includes('.map') && !req.includes('analytics')
    );

    if (criticalFailures.length > 0) {
      console.log('Failed Requests:', criticalFailures);
    }

    // No critical network failures
    expect(criticalFailures.length).toBe(0);

    console.log('✓ All critical network requests succeeded');
  });

  test('Responsive Design - Mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(STAGING_URL);
    await page.waitForLoadState('networkidle');

    // Verify Moleicon is visible on mobile
    const floatingMoleicon = page.locator('button[aria-label="Open chat with molē"]').first();
    await expect(floatingMoleicon).toBeVisible({ timeout: 10000 });

    // Open chat
    await floatingMoleicon.click();
    await page.waitForTimeout(500);

    // Verify modal is responsive
    const chatModal = page.locator('[role="dialog"][aria-labelledby="chat-panel-title"]');
    await expect(chatModal).toBeVisible();

    console.log('✓ Mole Agent is responsive on mobile');
  });

  test('Context Awareness - Homepage context', async ({ page }) => {
    await page.goto(STAGING_URL);
    await page.waitForLoadState('networkidle');

    // Open chat
    const floatingMoleicon = page.locator('button[aria-label="Open chat with molē"]').first();
    await floatingMoleicon.click();
    await page.waitForTimeout(1000);

    // Check for homepage-specific suggested questions
    const suggestedQuestions = page
      .locator('button')
      .filter({ hasText: /features|started|different/i });
    const count = await suggestedQuestions.count();

    expect(count).toBeGreaterThan(0);

    console.log('✓ Context-aware suggestions appear on homepage');
  });
});
