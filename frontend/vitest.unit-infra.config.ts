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
        execArgv: ['--max-old-space-size=2048'],
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
      'src/services/**/*.test.ts',
      'src/services/**/*.test.tsx',
      'src/utils/**/*.test.ts',
      'src/utils/**/*.test.tsx',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
