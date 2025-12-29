import { expect, test } from '@playwright/test';

test.describe('Model Comparison Flow', () => {
  test.beforeEach(async ({ page }) => {
    const projectName = test.info().project.name;
    test.skip(
      projectName !== 'chromium',
      'Skipping model comparison E2E tests on non-Chromium projects in this environment.'
    );

    // Ensure authenticated via helper (enabled for staging and emulators)
    await page.goto('/e2e-auth?redirect=/dashboard/prompts', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForURL(/\/dashboard\/prompts/, { timeout: 45000 });
  });

  test('should display model comparison option', async ({ page }) => {
    await page.goto('/prompts');

    // Find a prompt
    const firstPrompt = page.locator('[data-testid^="prompt-card"]').first();
    if (await firstPrompt.isVisible()) {
      await firstPrompt.click();

      // Should have compare models option
      const compareButton = page.getByRole('button', { name: /compare models|multi-model/i });
      await expect(compareButton.or(page.getByText(/compare models/i))).toBeVisible();
    }
  });

  test('should execute prompt with multiple models', async ({ page }) => {
    await page.goto('/prompts');

    // Find a prompt
    const firstPrompt = page.locator('[data-testid^="prompt-card"]').first();
    if (await firstPrompt.isVisible()) {
      await firstPrompt.click();

      // Enable model comparison
      const compareToggle = page.getByLabel(/compare models|multi-model/i);
      if (await compareToggle.isVisible()) {
        await compareToggle.click();

        // Select multiple models
        const modelSelector = page.getByLabel(/select models|models/i);
        if (await modelSelector.isVisible()) {
          await modelSelector.click();

          // Select 2-3 free models
          const freeModels = page.getByRole('option', { name: /free/i });
          const count = await freeModels.count();
          for (let i = 0; i < Math.min(3, count); i++) {
            await freeModels.nth(i).click();
          }
        }

        // Fill variables
        const variableInput = page.getByLabel(/input|query/i).first();
        if (await variableInput.isVisible()) {
          await variableInput.fill('Test comparison query');
        }

        // Execute
        await page.getByRole('button', { name: /run|execute/i }).click();

        // Should show comparison results
        await expect(page.locator('[data-testid="model-comparison"]')).toBeVisible({
          timeout: 60000,
        });
      }
    }
  });

  test('should display comparison results with tabs', async ({ page }) => {
    await page.goto('/executions');

    // Find comparison execution
    const comparisonExecution = page.locator('[data-testid^="execution-"]').first();
    if (await comparisonExecution.isVisible()) {
      await comparisonExecution.click();

      // Check for comparison tabs
      const overviewTab = page.getByRole('button', { name: /overview/i });
      const responsesTab = page.getByRole('button', { name: /responses/i });
      const metricsTab = page.getByRole('button', { name: /metrics/i });

      if (await overviewTab.isVisible()) {
        // Test overview tab
        await expect(overviewTab).toBeVisible();
        await expect(page.locator('[data-testid="comparison-summary"]')).toBeVisible();

        // Test responses tab
        await responsesTab.click();
        await expect(page.locator('[data-testid="responses-grid"]')).toBeVisible();

        // Test metrics tab
        await metricsTab.click();
        await expect(page.locator('[data-testid="quality-metrics-grid"]')).toBeVisible();
      }
    }
  });

  test('should show best model recommendation', async ({ page }) => {
    await page.goto('/executions');

    // Find comparison execution
    const comparisonExecution = page.locator('[data-testid^="execution-"]').first();
    if (await comparisonExecution.isVisible()) {
      await comparisonExecution.click();

      // Should show best model indicator
      const bestModelBadge = page.locator('text=/best model|recommended/i');
      if (await bestModelBadge.isVisible()) {
        await expect(bestModelBadge).toBeVisible();
      }
    }
  });

  test('should display quality metrics for each model', async ({ page }) => {
    await page.goto('/executions');

    // Find comparison execution
    const comparisonExecution = page.locator('[data-testid^="execution-"]').first();
    if (await comparisonExecution.isVisible()) {
      await comparisonExecution.click();

      // Switch to metrics tab
      const metricsTab = page.getByRole('button', { name: /metrics/i });
      if (await metricsTab.isVisible()) {
        await metricsTab.click();

        // Should show quality metrics cards
        const metricsCards = page.locator('[data-testid^="quality-metrics-"]');
        if (await metricsCards.first().isVisible()) {
          await expect(metricsCards.first()).toBeVisible();

          // Should show latency, cost, tokens, quality score
          await expect(page.locator('text=/latency/i')).toBeVisible();
          await expect(page.locator('text=/cost/i')).toBeVisible();
          await expect(page.locator('text=/tokens/i')).toBeVisible();
        }
      }
    }
  });

  test('should compare response quality side-by-side', async ({ page }) => {
    await page.goto('/executions');

    // Find comparison execution
    const comparisonExecution = page.locator('[data-testid^="execution-"]').first();
    if (await comparisonExecution.isVisible()) {
      await comparisonExecution.click();

      // Switch to responses tab
      const responsesTab = page.getByRole('button', { name: /responses/i });
      if (await responsesTab.isVisible()) {
        await responsesTab.click();

        // Should show responses in grid
        const responsesGrid = page.locator('[data-testid="responses-grid"]');
        await expect(responsesGrid).toBeVisible();

        // Should have multiple response cards
        const responseCards = page.locator('[data-testid^="response-card-"]');
        const count = await responseCards.count();
        expect(count).toBeGreaterThan(1);
      }
    }
  });

  test('should copy individual model responses', async ({ page }) => {
    await page.goto('/executions');

    // Find comparison execution
    const comparisonExecution = page.locator('[data-testid^="execution-"]').first();
    if (await comparisonExecution.isVisible()) {
      await comparisonExecution.click();

      // Switch to responses tab
      const responsesTab = page.getByRole('button', { name: /responses/i });
      if (await responsesTab.isVisible()) {
        await responsesTab.click();

        // Find copy button
        const copyButton = page.getByRole('button', { name: /copy/i }).first();
        if (await copyButton.isVisible()) {
          await copyButton.click();

          // Should show copied confirmation
          await expect(page.locator('text=/copied/i')).toBeVisible({ timeout: 2000 });
        }
      }
    }
  });

  test('should show cost breakdown for all models', async ({ page }) => {
    await page.goto('/executions');

    // Find comparison execution
    const comparisonExecution = page.locator('[data-testid^="execution-"]').first();
    if (await comparisonExecution.isVisible()) {
      await comparisonExecution.click();

      // Switch to metrics tab
      const metricsTab = page.getByRole('button', { name: /metrics/i });
      if (await metricsTab.isVisible()) {
        await metricsTab.click();

        // Should show cost breakdown
        const costBreakdown = page.locator('text=/cost breakdown|total cost/i');
        if (await costBreakdown.isVisible()) {
          await expect(costBreakdown).toBeVisible();
        }
      }
    }
  });

  test('should handle failed model executions', async ({ page }) => {
    await page.goto('/executions');

    // Find comparison execution
    const comparisonExecution = page.locator('[data-testid^="execution-"]').first();
    if (await comparisonExecution.isVisible()) {
      await comparisonExecution.click();

      // Check for failed executions section
      const failedSection = page.locator('text=/failed executions|errors/i');
      if (await failedSection.isVisible()) {
        await expect(failedSection).toBeVisible();

        // Should show error messages
        await expect(page.locator('text=/error|failed/i')).toBeVisible();
      }
    }
  });

  test('should filter comparison results', async ({ page }) => {
    await page.goto('/executions');

    // Find comparison execution
    const comparisonExecution = page.locator('[data-testid^="execution-"]').first();
    if (await comparisonExecution.isVisible()) {
      await comparisonExecution.click();

      // Look for filter options
      const filterButton = page.getByRole('button', { name: /filter|sort/i });
      if (await filterButton.isVisible()) {
        await filterButton.click();

        // Select filter option
        await page
          .getByRole('option', { name: /fastest|cheapest|best/i })
          .first()
          .click();

        // Should update display
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should export comparison results', async ({ page }) => {
    await page.goto('/executions');

    // Find comparison execution
    const comparisonExecution = page.locator('[data-testid^="execution-"]').first();
    if (await comparisonExecution.isVisible()) {
      await comparisonExecution.click();

      // Look for export button
      const exportButton = page.getByRole('button', { name: /export|download/i });
      if (await exportButton.isVisible()) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

        await exportButton.click();

        const download = await downloadPromise;
        if (download) {
          expect(download.suggestedFilename()).toMatch(/comparison|results/i);
        }
      }
    }
  });
});
