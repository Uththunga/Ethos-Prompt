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
    testTimeout: 60000,
    hookTimeout: 20000,
    retry: 0,
    reporters: ['verbose'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: true,
        execArgv: ['--max-old-space-size=6144']
      }
    },
    maxConcurrency: 1,
    sequence: { shuffle: false, concurrent: false },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        runScripts: 'dangerously',
        url: 'http://localhost:3000',
        pretendToBeVisual: true,
        includeNodeLocations: true
      }
    },
    include: [
      'src/components/prompts/__tests__/PromptList.test.tsx'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});

