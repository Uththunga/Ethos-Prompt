/// <reference types="vitest" />
import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    // E2E-only mock for document processing status
    ...(process.env.VITE_E2E_MODE === 'true'
      ? [
          {
            name: 'e2e-document-status-mock',
            configureServer(server) {
              const jobStartMap = new Map();
              server.middlewares.use((req, res, next) => {
                const url = req.url || '';
                const match = url.match(/^\/api\/ai\/document-status\/([^/?#]+)/);
                if (!match) return next();
                const jobId = decodeURIComponent(match[1]);
                const now = Date.now();
                if (!jobStartMap.has(jobId)) jobStartMap.set(jobId, now);
                const start = jobStartMap.get(jobId);
                const elapsedSec = Math.floor((now - start) / 1000);
                const steps = ['extracting', 'chunking', 'embedding', 'indexing', 'completed'];
                const idx = Math.min(elapsedSec, steps.length - 1); // advance 1 step per second
                const status = steps[idx];
                const body = { success: true, status, document_id: jobId };
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify(body));
              });
            },
          },
        ]
      : []),
    // Sentry plugin for production error tracking
    ...(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            sourcemaps: {
              assets: './dist/**',
            },
            errorHandler: (err) => {
              console.warn('Sentry upload skipped:', err?.message || err);
            },
            telemetry: false,
          }),
        ]
      : []),
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files larger than 1KB
      compressionOptions: {
        level: 9, // Maximum compression
      },
      filter: /\.(js|mjs|json|css|html|svg)$/i,
      deleteOriginFile: false,
    }),
    // Brotli compression (better than gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      compressionOptions: {
        level: 11, // Maximum compression
      },
      filter: /\.(js|mjs|json|css|html|svg)$/i,
      deleteOriginFile: false,
    }),
    // Bundle analyzer (only in analyze mode)
    ...(process.env.ANALYZE
      ? [
          visualizer({
            filename: 'dist/stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
            template: 'treemap', // or 'sunburst', 'network'
          }),
        ]
      : []),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*', 'dist/', 'coverage/'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      // ADD: Marketing component aliases
      '@': path.resolve(__dirname, './src'),
      '@/marketing': path.resolve(__dirname, './src/components/marketing'),

      // Keep RAG's React ecosystem aliases
      react: 'react',
      'react-dom': 'react-dom',
      'react-router-dom': 'react-router-dom',
      // Note: Removed react-is alias to avoid circular dependency issues
      // Comprehensive es-toolkit compatibility fix - map all functions to universal compat
      'es-toolkit/compat/get': path.resolve(__dirname, 'src/utils/es-toolkit-universal-compat.js'),
      'es-toolkit/compat/uniqBy': path.resolve(
        __dirname,
        'src/utils/es-toolkit-universal-compat.js'
      ),
      'es-toolkit/compat/sortBy': path.resolve(
        __dirname,
        'src/utils/es-toolkit-universal-compat.js'
      ),
      'es-toolkit/compat/isEqual': path.resolve(
        __dirname,
        'src/utils/es-toolkit-universal-compat.js'
      ),
      'es-toolkit/compat/last': path.resolve(__dirname, 'src/utils/es-toolkit-universal-compat.js'),
      'es-toolkit/compat/isPlainObject': path.resolve(
        __dirname,
        'src/utils/es-toolkit-universal-compat.js'
      ),
      'es-toolkit/compat/maxBy': path.resolve(
        __dirname,
        'src/utils/es-toolkit-universal-compat.js'
      ),
      'es-toolkit/compat/minBy': path.resolve(
        __dirname,
        'src/utils/es-toolkit-universal-compat.js'
      ),
      'es-toolkit/compat/range': path.resolve(
        __dirname,
        'src/utils/es-toolkit-universal-compat.js'
      ),
      'es-toolkit/compat/throttle': path.resolve(
        __dirname,
        'src/utils/es-toolkit-universal-compat.js'
      ),
      'es-toolkit/compat/omit': path.resolve(__dirname, 'src/utils/es-toolkit-universal-compat.js'),
      'es-toolkit/compat/sumBy': path.resolve(
        __dirname,
        'src/utils/es-toolkit-universal-compat.js'
      ),
      'es-toolkit/compat/isNil': path.resolve(
        __dirname,
        'src/utils/es-toolkit-universal-compat.js'
      ),
      'es-toolkit/compat/isFunction': path.resolve(
        __dirname,
        'src/utils/es-toolkit-universal-compat.js'
      ),
      'es-toolkit/compat': path.resolve(__dirname, 'src/utils/es-toolkit-universal-compat.js'),
      // Fix use-sync-external-store compatibility
      'use-sync-external-store/shim/with-selector': path.resolve(
        __dirname,
        'src/utils/use-sync-external-store-compat.js'
      ),
      'use-sync-external-store/with-selector': path.resolve(
        __dirname,
        'src/utils/use-sync-external-store-compat.js'
      ),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'react-window'],
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production', // Disable in production for smaller builds
    minify: 'esbuild', // Use esbuild instead of terser (faster and more reliable)
    target: 'es2020',
    modulePreload: false,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    // CDN Configuration
    ...(process.env.VITE_CDN_URL && {
      base: process.env.VITE_CDN_URL,
    }),
    // Enhanced build optimization
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // 4KB - inline smaller assets
    chunkSizeWarningLimit: 350, // Warn for chunks > 350KB (stricter for production)
    reportCompressedSize: true, // Report compressed sizes for budget validation
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
        pure_funcs: process.env.NODE_ENV === 'production'
          ? ['console.log', 'console.info']
          : [],
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      onwarn(warning, warn) {
        // Fail build on chunk size violations
        if (warning.code === 'CHUNK_SIZE_EXCEEDED') {
          throw new Error(`Performance budget exceeded: ${warning.message}`);
        }
        warn(warning);
      },
      output: {
        format: 'es',
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        // Ensure proper module imports across chunks
        interop: 'auto',
        preserveModules: false,
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        manualChunks: (id) => {
          // Charts library (recharts + d3) - separate for better caching
          if (
            id.includes('node_modules/recharts/') ||
            id.includes('node_modules/d3-')
          ) {
            return 'charts-vendor';
          }
          // Core React dependencies
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }
          // Router
          if (id.includes('node_modules/react-router-dom/')) {
            return 'router-vendor';
          }
          // React Query
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query-vendor';
          }
          // Firebase
          if (id.includes('node_modules/firebase/')) {
            return 'firebase-vendor';
          }
          // UI libraries
          if (
            id.includes('node_modules/@headlessui/') ||
            id.includes('node_modules/@heroicons/') ||
            id.includes('node_modules/lucide-react/')
          ) {
            return 'ui-vendor';
          }
          // Animation libraries
          if (
            id.includes('node_modules/framer-motion/') ||
            id.includes('node_modules/lottie-react/')
          ) {
            return 'animation-vendor';
          }
          // Marketing libraries
          if (
            id.includes('node_modules/embla-carousel') ||
            id.includes('node_modules/react-icons/')
          ) {
            return 'marketing-vendor';
          }
          // Virtualization
          if (id.includes('node_modules/react-window')) {
            return 'virtualization-vendor';
          }
          // Sentry
          if (id.includes('node_modules/@sentry/')) {
            return 'sentry-vendor';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react-router-dom',
      'react-window',
      'react-window-infinite-loader',
      '@tanstack/react-query',
      '@tanstack/react-query-devtools',
      '@headlessui/react',
      '@heroicons/react',
      'lucide-react',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'eventemitter3',
      'recharts',
      'react-is', // Add react-is for proper pre-bundling
      // ADD: Marketing component dependencies
      'framer-motion',
      'lottie-react',
      'react-icons',
      'embla-carousel-autoplay',
    ],
    exclude: [
      // Exclude large libraries that should be loaded on demand
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid',
      // Exclude all es-toolkit modules to prevent module resolution issues
      'es-toolkit',
      'es-toolkit/compat',
      'es-toolkit/compat/get',
      'es-toolkit/compat/uniqBy',
    ],
  },
  // Enable tree shaking for better optimization
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  // Enhanced tree shaking configuration
  esbuild: {
    treeShaking: true,
    jsx: 'automatic',
    // Disable development JSX to prevent 'jsxDEV is not a function' errors in production
    jsxDev: false,
    drop:
      process.env.NODE_ENV === 'production' && process.env.VITE_APP_ENVIRONMENT === 'production'
        ? ['console', 'debugger']
        : [],
  },
});
