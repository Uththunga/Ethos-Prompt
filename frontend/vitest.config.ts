/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Only include unit/integration tests; exclude Playwright E2E specs
    include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    // Optimized timeouts for performance tests
    testTimeout: 30000, // Reduced from 60s to 30s
    hookTimeout: 10000, // Reduced from 60s to 10s
    // Retry failed tests
    retry: 1, // Reduced retries to speed up tests
    // Better error reporting
    reporters: ['verbose'],
    // Memory optimization settings
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: true,
        execArgv: ['--max-old-space-size=4096'],
      },
    },
    // Limit concurrent tests to reduce memory usage
    maxConcurrency: 1,
    // Enable garbage collection between tests
    sequence: {
      shuffle: false,
      concurrent: false,
    },
    // Ensure proper JSDOM environment
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        runScripts: 'dangerously',
        url: 'http://localhost:3000',
        pretendToBeVisual: true,
        includeNodeLocations: true,
      },
    },
    // Remove deprecated environmentMatchGlobs
    // Force environment for all tests
    // environmentMatchGlobs: [
    //   ['**/*.test.{ts,tsx}', 'jsdom']
    // ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
