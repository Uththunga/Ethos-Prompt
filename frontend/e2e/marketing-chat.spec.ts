import { expect, test } from '@playwright/test';

// E2E: Marketing chat flow on marketing homepage
// Requires a local Marketing API server running at VITE_API_BASE_URL
// In CI/local dev we set OPENROUTER_USE_MOCK=true so responses are canned and zero-cost

const runMarketingChatE2E = process.env.RUN_MARKETING_CHAT_E2E === 'true';

test.describe('Marketing Chat (molē) - Homepage', () => {
  test.beforeEach(async () => {
    const projectName = test.info().project.name;
    test.skip(
      projectName !== 'chromium' || !runMarketingChatE2E,
      'Skipping marketing chat E2E; enable with RUN_MARKETING_CHAT_E2E=true on Chromium only in this environment.'
    );
  });

  test('opens chat, sends a message, and shows assistant reply with suggestions', async ({
    page,
  }) => {
    // Mock the marketing API to ensure deterministic, zero-cost E2E
    await page.route('**/api/ai/marketing-chat', async (route) => {
      const json = {
        success: true,
        response:
          'EthosPrompt is a smart, modular RAG-enabled prompt management system... (mocked in E2E)',
        conversation_id: 'e2e-test-convo',
        sources: [],
        suggested_questions: [
          'What services does EthosPrompt offer?',
          'How does your RAG work?',
          'Can I schedule a demo?',
        ],
        metadata: { mock: true },
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(json),
      });
    });

    // Navigate to marketing homepage
    await page.goto('/');

    // Open floating molē chat button
    const openButton = page.getByRole('button', { name: /open chat with molē/i });
    await expect(openButton).toBeVisible();
    await openButton.click();

    // Modal should appear
    await expect(page.getByRole('dialog', { name: /chat with molē/i })).toBeVisible();

    // Type a question and send
    const input = page.getByRole('textbox', { name: /chat message input/i });
    await input.fill('What services does EthosPrompt offer?');
    await page.getByRole('button', { name: /send message/i }).click();

    // Assistant reply should render (mocked above)
    await expect(page.getByText(/You might also want to know:/i)).toBeVisible({ timeout: 20000 });

    // Close the chat
    await page.getByRole('button', { name: /close chat/i }).click();
    const panel = page.getByRole('dialog', { name: /chat with molē/i });
    // Off-canvas panel uses translate-x utilities when hidden
    await expect(panel).toHaveClass(/translate-x-full/);
  });

  test('ROI Calculator flow - full 2-step form completion', async ({ page }) => {
    // Mock API with ROI-related response
    await page.route('**/api/ai/marketing-chat', async (route) => {
      const json = {
        success: true,
        response: 'Our AI chatbot can save your team significant time and reduce costs through automation. You can calculate your potential ROI to see the exact savings.',
        conversation_id: 'e2e-roi-test',
        sources: [],
        suggested_questions: ['How much can I save?', 'Tell me about pricing'],
        metadata: { mock: true },
      };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
    });

    await page.goto('/');

    // Open chat
    await page.getByRole('button', { name: /open chat/i }).click();
    await expect(page.getByRole('dialog', { name: /chat with molē/i })).toBeVisible();

    // Send ROI-related question
    const input = page.getByRole('textbox', { name: /chat message input/i });
    await input.fill('Tell me about ROI and savings');
    await page.getByRole('button', { name: /send message/i }).click();

    // Wait for response and button to appear
    await expect(page.getByText(/calculate/i)).toBeVisible({ timeout: 10000 });

    // Click "Calculate ROI" button
    await page.getByRole('button', { name: /Calculate ROI/i }).click();

    // Form should appear
    await expect(page.getByText(/ROI Calculator/i)).toBeVisible();

    // Fill step 1
    await page.getByLabel(/Team Size/i).fill('10');
    await page.getByLabel(/Monthly Customer Inquiries/i).fill('500');
    await page.getByRole('button', { name: /Next/i }).click();

    // Should advance to step 2
    await expect(page.getByLabel(/Avg. Response Time/i)).toBeVisible();

    // Fill step 2
    await page.getByLabel(/Avg. Response Time/i).fill('2');
    await page.getByLabel(/Hourly Employee Cost/i).fill('50');
    await page.getByRole('button', { name: /Calculate ROI/i }).click();

    // Results should display
    await expect(page.getByText(/Your Potential Savings/i)).toBeVisible();
    await expect(page.getByText(/Annual Savings/i)).toBeVisible();

    // Schedule Consultation button should appear
    await expect(page.getByRole('button', { name: /Schedule Consultation/i })).toBeVisible();
  });

  test('Consultation Request flow - form submission with validation', async ({ page }) => {
    // Mock API with consultation-related response
    await page.route('**/api/ai/marketing-chat', async (route) => {
      const json = {
        success: true,
        response: 'I\'d be happy to schedule a consultation with you. Please fill out the form below and we\'ll be in touch within 24 hours.',
        conversation_id: 'e2e-consultation-test',
        sources: [],
        suggested_questions: [],
        metadata: { mock: true },
      };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
    });

    // Mock the quotation service endpoint
    await page.route('**/api/quotations', async (route) => {
      const json = {
        success: true,
        referenceNumber: 'EP-E2E-TEST-1234',
        message: 'Request submitted successfully',
      };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
    });

    await page.goto('/');

    // Open chat
    await page.getByRole('button', { name: /open chat/i }).click();

    // Send consultation request
    const input = page.getByRole('textbox', { name: /chat message input/i });
    await input.fill('I want to schedule a consultation');
    await page.getByRole('button', { name: /send message/i }).click();

    // Wait for response and button
    await expect(page.getByText(/consultation/i)).toBeVisible({ timeout: 10000 });

    // Click "Request Consultation" button
    await page.getByRole('button', { name: /Request Consultation/i }).click();

    // Form should appear
    await expect(page.getByText(/Request a Consultation/i)).toBeVisible();

    // Try submitting without filling (should show errors)
    await page.getByRole('button', { name: /Submit Request/i }).click();
    await expect(page.getByText(/required/i).first()).toBeVisible();

    // Fill the form
    await page.getByLabel(/Your Name/i).fill('Jane Smith');
    await page.getByLabel(/Email Address/i).fill('jane@example.com');
    await page.getByLabel(/Company Name/i).fill('Test Corp');
    await page.getByLabel(/Email/i).check(); // Contact preference
    await page.getByLabel(/Additional Notes/i).fill('Looking for AI chatbot solutions');

    // Submit
    await page.getByRole('button', { name: /Submit Request/i }).click();

    // Success message should appear
    await expect(page.getByText(/Thank You, Jane Smith!/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Reference: EP-E2E-TEST-1234/i)).toBeVisible();

    // Continue Chatting button should be present
    await expect(page.getByRole('button', { name: /Continue Chatting/i })).toBeVisible();
  });

  test('Form close button works correctly', async ({ page }) => {
    await page.route('**/api/ai/marketing-chat', async (route) => {
      const json = {
        success: true,
        response: 'Let me help you calculate your potential savings with our ROI calculator.',
        conversation_id: 'e2e-close-test',
        sources: [],
        suggested_questions: [],
        metadata: { mock: true },
      };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
    });

    await page.goto('/');
    await page.getByRole('button', { name: /open chat/i }).click();

    // Trigger form
    const input = page.getByRole('textbox', { name: /chat message input/i });
    await input.fill('Calculate ROI');
    await page.getByRole('button', { name: /send message/i }).click();

    await page.getByRole('button', { name: /Calculate ROI/i }).click();
    await expect(page.getByText(/ROI Calculator/i)).toBeVisible();

    // Close the form
    await page.getByLabel(/Close form/i).click();

    // Form should be gone
    await expect(page.getByText(/ROI Calculator/i)).not.toBeVisible();

    // Chat input should still be accessible
    await expect(page.getByRole('textbox', { name: /chat message input/i })).toBeVisible();
  });
});
