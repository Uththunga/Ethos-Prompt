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
    testTimeout: 30000,
    hookTimeout: 10000,
    retry: 1,
    reporters: ['default'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: true,
        execArgv: ['--max-old-space-size=6144'],
      },
    },
    maxConcurrency: 1,
    sequence: { shuffle: false, concurrent: false },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        runScripts: 'dangerously',
        url: 'http://localhost:3000',
        pretendToBeVisual: true,
        includeNodeLocations: true,
      },
    },
    include: [
      'src/components/**/*.test.ts',
      'src/components/**/*.test.tsx',
      'src/components/**/__tests__/**/*.test.ts',
      'src/components/**/__tests__/**/*.test.tsx',
      'src/hooks/**/*.test.ts',
      'src/hooks/**/*.test.tsx',
    ],
    exclude: ['src/components/prompts/__tests__/PromptList.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
