/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    
    // Optimized for performance tests
    testTimeout: 20000, // 20 seconds max per test
    hookTimeout: 5000,  // 5 seconds for setup/teardown
    retry: 0, // No retries for performance tests to get accurate timing
    
    // Better error reporting
    reporters: ['verbose'],
    
    // Run tests sequentially to avoid resource conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: false // Faster startup
      }
    },
    
    // Optimized JSDOM environment
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        runScripts: 'dangerously',
        url: 'http://localhost:3000',
        pretendToBeVisual: true,
        includeNodeLocations: false // Faster parsing
      }
    },
    
    // Include only performance tests
    include: [
      'src/test/performance.test.tsx',
      'src/test/performance/**/*.test.ts'
    ],

    // Exclude other tests
    exclude: [
      'node_modules/',
      'src/test/setup.ts',
      'src/test/test-utils.tsx'
    ],
    
    // No coverage for performance tests (speeds up execution)
    coverage: {
      enabled: false
    },
    
    // Performance test specific settings
    logHeapUsage: true,
    isolate: false, // Faster test execution
    
    // Disable file watching for CI
    watch: false,
    
    // Optimize for speed
    deps: {
      inline: ['@testing-library/react', '@testing-library/jest-dom']
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  
  // Optimize build for testing
  esbuild: {
    target: 'node14'
  }
});
