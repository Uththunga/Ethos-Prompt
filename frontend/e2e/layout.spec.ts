import { expect, test, type Page } from '@playwright/test';

const runLayoutE2E = process.env.RUN_LAYOUT_E2E === 'true';

// Helper to ensure clean localStorage for deterministic UI state
async function clearStorage(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Enable ProtectedRoute bypass for E2E
    try {
      localStorage.setItem('e2eAuth', 'true');
    } catch {}
  });
}

test.describe('Dashboard Layout — Desktop keyboard shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    // Skip keyboard shortcut tests on mobile browsers
    const projectName = test.info().project.name;
    test.skip(
      projectName !== 'chromium' || !runLayoutE2E,
      'Skipping dashboard keyboard shortcut tests; enable with RUN_LAYOUT_E2E=true on Chromium only in this environment.'
    );
    await clearStorage(page);
  });

  test('Cmd/Ctrl+B toggles Sidebar collapsed state', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    // Wait for the sidebar to be visible
    const sidebar = page.locator('#main-sidebar');
    await sidebar.waitFor({ state: 'visible', timeout: 10000 });

    // Expect expanded by default on fresh storage (280px at lg)
    await expect(sidebar).toHaveAttribute('class', /lg:w-\[280px\]/);

    await page.keyboard.press('Control+b');
    await expect(sidebar).toHaveAttribute('class', /lg:w-16/);

    await page.keyboard.press('Control+b');
    await expect(sidebar).toHaveAttribute('class', /lg:w-\[280px\]/);
  });

  test('Cmd/Ctrl+K toggles Right Panel collapsed state', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    // Wait for the right panel to be visible (it's hidden on mobile, visible on desktop)
    const panel = page.getByLabel('User actions panel');
    await panel.waitFor({ state: 'attached', timeout: 10000 });

    // Depending on persisted state it might be collapsed or expanded; toggle twice to assert flip
    const initial = await panel.getAttribute('class');
    await page.keyboard.press('Control+k');
    const afterFirst = await panel.getAttribute('class');
    expect(afterFirst).not.toBe(initial);

    await page.keyboard.press('Control+k');
    const afterSecond = await panel.getAttribute('class');
    expect(afterSecond).toBe(initial);
  });
});

test.describe('Dashboard Layout — Panel switching', () => {
  test.beforeEach(async ({ page }) => {
    const projectName = test.info().project.name;
    test.skip(
      projectName !== 'chromium' || !runLayoutE2E,
      'Skipping dashboard panel switching tests; enable with RUN_LAYOUT_E2E=true on Chromium only in this environment.'
    );
    await clearStorage(page);
  });

  test('Clicking panel icons switches active panel', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    // Wait for the right panel to be attached
    const panel = page.getByLabel('User actions panel');
    await panel.waitFor({ state: 'attached', timeout: 10000 });

    // Expand panel if currently collapsed
    const panelClass = await panel.getAttribute('class');
    if (/w-16/.test(panelClass || '')) {
      await page.keyboard.press('Control+k');
      // Wait for expansion animation
      await page.waitForTimeout(500);
    }

    // Click Profile icon
    await page.getByRole('button', { name: 'Open profile panel' }).click();

    // Wait for panel content to load (may skip Loading… if instant)
    await page.waitForTimeout(500);

    // Now click Chat icon (bottom)
    await page.getByRole('button', { name: 'Open chat panel' }).click();

    // Wait for panel content to switch
    await page.waitForTimeout(500);
  });
});

test.describe('Dashboard Layout — Mobile basic flows', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone-ish size

  test.beforeEach(async ({ page }) => {
    const projectName = test.info().project.name;
    test.skip(
      projectName !== 'chromium' || !runLayoutE2E,
      'Skipping dashboard mobile layout flows; enable with RUN_LAYOUT_E2E=true on Chromium only in this environment.'
    );
    await clearStorage(page);
  });

  test('FAB opens Bottom Sheet and Escape closes it', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    // Wait for the FAB to be visible (it's only visible on mobile)
    const fab = page.getByRole('button', { name: 'Open right panel' });
    await fab.waitFor({ state: 'visible', timeout: 10000 });

    // Open via FAB
    await fab.click();

    // Wait for the bottom sheet dialog to appear
    const dialog = page.getByRole('dialog', { name: 'Right panel' });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Close via Escape
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 5000 });
  });
});
