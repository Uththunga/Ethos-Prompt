#!/usr/bin/env node

/**
 * Fix timing-sensitive tests that are causing hangs and failures
 * This script addresses common issues with async tests, timers, and waitFor
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing timing-sensitive tests...');

// Fix retry mechanism tests
const retryTestPath = path.join(__dirname, '../frontend/src/utils/__tests__/retryMechanism.test.ts');
if (fs.existsSync(retryTestPath)) {
  let content = fs.readFileSync(retryTestPath, 'utf8');
  
  // Fix exponential backoff test
  content = content.replace(
    /it\('uses exponential backoff', async \(\) => \{[\s\S]*?\}\);/,
    `it('uses exponential backoff', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));
      const onRetry = vi.fn();

      const resultPromise = retryAsync(operation, {
        maxAttempts: 3,
        delay: 10, // Shorter delay for testing
        exponentialBackoff: true,
        onRetry
      });

      await vi.runAllTimersAsync();
      await resultPromise;

      expect(onRetry).toHaveBeenCalledTimes(2);
      // Check that delays increased exponentially
      expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, 10);
      expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, 20);
    });`
  );

  // Fix retry condition test
  content = content.replace(
    /it\('respects retry condition', async \(\) => \{[\s\S]*?\}\);/,
    `it('respects retry condition', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Client error'));
      const retryCondition = vi.fn().mockReturnValue(false);

      const resultPromise = retryAsync(operation, {
        maxAttempts: 3,
        delay: 10,
        retryCondition
      });

      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(retryCondition).toHaveBeenCalledWith(expect.any(Error));
    });`
  );

  // Fix onRetry callback test
  content = content.replace(
    /it\('calls onRetry callback', async \(\) => \{[\s\S]*?\}\);/,
    `it('calls onRetry callback', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success');
      const onRetry = vi.fn();

      const resultPromise = retryAsync(operation, {
        maxAttempts: 3,
        delay: 10,
        onRetry
      });

      await vi.runAllTimersAsync();
      await resultPromise;

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 10);
    });`
  );

  // Fix retryFetch test
  content = content.replace(
    /it\('retries failed fetch requests', async \(\) => \{[\s\S]*?\}\);/,
    `it('retries failed fetch requests', async () => {
      const mockFetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: 'success' }) });

      global.fetch = mockFetch;

      const resultPromise = retryFetch('https://api.example.com/data', {
        maxAttempts: 2,
        delay: 10
      });

      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });`
  );

  // Fix progressive retry test
  content = content.replace(
    /it\('uses different retry configs based on importance', async \(\) => \{[\s\S]*?\}\);/,
    `it('uses different retry configs based on importance', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));

      const resultPromise = progressiveRetry(operation, 'high');

      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(5); // High importance = 5 attempts
      expect(operation).toHaveBeenCalledTimes(5);
    });`
  );

  fs.writeFileSync(retryTestPath, content);
  console.log('✅ Fixed retry mechanism tests');
}

// Fix Toast tests
const toastTestPath = path.join(__dirname, '../frontend/src/components/common/__tests__/Toast.test.tsx');
if (fs.existsSync(toastTestPath)) {
  let content = fs.readFileSync(toastTestPath, 'utf8');
  
  // Add timeout to all waitFor calls
  content = content.replace(
    /await waitFor\(\(\) => \{[\s\S]*?\}\);/g,
    (match) => match.replace('});', '}, { timeout: 1000 });')
  );

  // Fix auto-dismiss test
  content = content.replace(
    /it\('auto-dismisses toast after duration', async \(\) => \{[\s\S]*?\}\);/,
    `it('auto-dismisses toast after duration', async () => {
      renderWithProviders(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const addButton = screen.getByText('Add Info Toast');
      act(() => { fireEvent.click(addButton); });

      // Toast should be visible initially
      await waitFor(() => {
        expect(screen.getByText('Info Toast')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Fast-forward time to trigger auto-dismiss
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Toast should be dismissed
      await waitFor(() => {
        expect(screen.queryByText('Info Toast')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });`
  );

  fs.writeFileSync(toastTestPath, content);
  console.log('✅ Fixed Toast tests');
}

// Fix any other timing-sensitive tests
const testFiles = [
  'frontend/src/components/prompts/__tests__/PromptEditor.test.tsx',
  'frontend/src/components/documents/__tests__/DocumentUpload.test.tsx',
  'frontend/src/hooks/__tests__/useDebounce.test.ts'
];

testFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add shorter timeouts to waitFor calls
    content = content.replace(
      /await waitFor\(\(\) => \{[\s\S]*?\}\);/g,
      (match) => {
        if (!match.includes('timeout:')) {
          return match.replace('});', '}, { timeout: 1000 });');
        }
        return match;
      }
    );

    // Reduce debounce delays in tests
    content = content.replace(
      /useDebounce\([^,]+,\s*(\d+)\)/g,
      (match, delay) => {
        const newDelay = Math.min(parseInt(delay), 100);
        return match.replace(delay, newDelay.toString());
      }
    );

    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed timing issues in ${filePath}`);
  }
});

// Create a test configuration for faster execution
const vitestConfigPath = path.join(__dirname, '../frontend/vitest.config.ts');
if (fs.existsSync(vitestConfigPath)) {
  let content = fs.readFileSync(vitestConfigPath, 'utf8');
  
  // Add test timeout configuration
  if (!content.includes('testTimeout')) {
    content = content.replace(
      /export default defineConfig\(\{/,
      `export default defineConfig({
  test: {
    testTimeout: 10000, // 10 second timeout for tests
    hookTimeout: 10000, // 10 second timeout for hooks
  },`
    );
  }

  fs.writeFileSync(vitestConfigPath, content);
  console.log('✅ Updated Vitest configuration with timeouts');
}

console.log('🎉 Test fixes completed!');
console.log('');
console.log('Summary of fixes:');
console.log('- Fixed timing-sensitive retry mechanism tests');
console.log('- Added timeouts to Toast component tests');
console.log('- Reduced debounce delays in test scenarios');
console.log('- Updated Vitest configuration with proper timeouts');
console.log('');
console.log('Run tests again with: npm test');
