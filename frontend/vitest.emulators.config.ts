/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Vitest config for running tests against Firebase Emulators
// - Uses a dedicated setup file that DOES NOT mock Firebase modules
// - Enables jsdom environment like the default config
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.emulators.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    testTimeout: 30000,
    hookTimeout: 10000,
    retry: 0,
    reporters: ['default'],
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true, isolate: true, execArgv: ['--max-old-space-size=4096'] },
    },
    maxConcurrency: 1,
    sequence: { shuffle: false, concurrent: false },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        runScripts: 'dangerously',
        url: 'http://localhost:5173',
        pretendToBeVisual: true,
        includeNodeLocations: true,
      },
    },
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
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

