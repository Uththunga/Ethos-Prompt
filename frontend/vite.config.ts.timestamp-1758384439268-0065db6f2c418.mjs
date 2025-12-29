// vite.config.ts
import { defineConfig } from "file:///D:/react/React-App-000739/Prompt-Library/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///D:/react/React-App-000739/Prompt-Library/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import viteCompression from "file:///D:/react/React-App-000739/Prompt-Library/frontend/node_modules/vite-plugin-compression/dist/index.mjs";
import { visualizer } from "file:///D:/react/React-App-000739/Prompt-Library/frontend/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import path from "path";
var __vite_injected_original_dirname = "D:\\react\\React-App-000739\\Prompt-Library\\frontend";
var vite_config_default = defineConfig({
  plugins: [
    react({
      jsxRuntime: "classic",
      jsxImportSource: "react"
    }),
    // Gzip compression
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024,
      // Only compress files larger than 1KB
      compressionOptions: {
        level: 9
        // Maximum compression
      },
      filter: /\.(js|mjs|json|css|html|svg)$/i,
      deleteOriginFile: false
    }),
    // Brotli compression (better than gzip)
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
      compressionOptions: {
        level: 11
        // Maximum compression
      },
      filter: /\.(js|mjs|json|css|html|svg)$/i,
      deleteOriginFile: false
    }),
    // Bundle analyzer (only in analyze mode)
    ...process.env.ANALYZE ? [
      visualizer({
        filename: "dist/stats.html",
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: "treemap"
        // or 'sunburst', 'network'
      })
    ] : []
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "dist/",
        "coverage/"
      ]
    }
  },
  resolve: {
    alias: {
      // ADD: Marketing component aliases
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      "@/marketing": path.resolve(__vite_injected_original_dirname, "./src/components/marketing"),
      // Keep RAG's React ecosystem aliases
      "react": "react",
      "react-dom": "react-dom",
      "react-router-dom": "react-router-dom",
      // Fix react-is compatibility with Recharts
      "react-is": path.resolve(__vite_injected_original_dirname, "src/utils/react-is-compat.js"),
      // Comprehensive es-toolkit compatibility fix - map all functions to universal compat
      "es-toolkit/compat/get": path.resolve(__vite_injected_original_dirname, "src/utils/es-toolkit-universal-compat.js"),
      "es-toolkit/compat/uniqBy": path.resolve(__vite_injected_original_dirname, "src/utils/es-toolkit-universal-compat.js"),
      "es-toolkit/compat/sortBy": path.resolve(__vite_injected_original_dirname, "src/utils/es-toolkit-universal-compat.js"),
      "es-toolkit/compat/isEqual": path.resolve(__vite_injected_original_dirname, "src/utils/es-toolkit-universal-compat.js"),
      "es-toolkit/compat/last": path.resolve(__vite_injected_original_dirname, "src/utils/es-toolkit-universal-compat.js"),
      "es-toolkit/compat/isPlainObject": path.resolve(__vite_injected_original_dirname, "src/utils/es-toolkit-universal-compat.js"),
      "es-toolkit/compat/maxBy": path.resolve(__vite_injected_original_dirname, "src/utils/es-toolkit-universal-compat.js"),
      "es-toolkit/compat/minBy": path.resolve(__vite_injected_original_dirname, "src/utils/es-toolkit-universal-compat.js"),
      "es-toolkit/compat/range": path.resolve(__vite_injected_original_dirname, "src/utils/es-toolkit-universal-compat.js"),
      "es-toolkit/compat/throttle": path.resolve(__vite_injected_original_dirname, "src/utils/es-toolkit-universal-compat.js"),
      "es-toolkit/compat/omit": path.resolve(__vite_injected_original_dirname, "src/utils/es-toolkit-universal-compat.js"),
      "es-toolkit/compat/sumBy": path.resolve(__vite_injected_original_dirname, "src/utils/es-toolkit-universal-compat.js"),
      "es-toolkit/compat/isNil": path.resolve(__vite_injected_original_dirname, "src/utils/es-toolkit-universal-compat.js"),
      "es-toolkit/compat/isFunction": path.resolve(__vite_injected_original_dirname, "src/utils/es-toolkit-universal-compat.js"),
      "es-toolkit/compat": path.resolve(__vite_injected_original_dirname, "src/utils/es-toolkit-universal-compat.js"),
      // Fix use-sync-external-store compatibility
      "use-sync-external-store/shim/with-selector": path.resolve(__vite_injected_original_dirname, "src/utils/use-sync-external-store-compat.js")
    },
    dedupe: ["react", "react-dom", "react-router-dom", "@tanstack/react-query", "react-window"]
  },
  server: {
    port: 3e3,
    open: true
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
    target: "es2020",
    modulePreload: false,
    // CDN Configuration
    ...process.env.VITE_CDN_URL && {
      base: process.env.VITE_CDN_URL
    },
    // Enhanced build optimization
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    // 4KB - inline smaller assets
    chunkSizeWarningLimit: 1e3,
    // Warn for chunks > 1MB (more realistic for complex apps)
    reportCompressedSize: false,
    // Faster builds
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === "production" && process.env.VITE_APP_ENVIRONMENT === "production",
        drop_debugger: process.env.NODE_ENV === "production",
        pure_funcs: process.env.NODE_ENV === "production" && process.env.VITE_APP_ENVIRONMENT === "production" ? ["console.log", "console.info"] : []
      },
      mangle: {
        safari10: true
      }
    },
    rollupOptions: {
      output: {
        format: "es",
        entryFileNames: "assets/js/[name]-[hash].js",
        chunkFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".") || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        manualChunks: void 0
      }
    }
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react-router-dom",
      "react-window",
      "react-window-infinite-loader",
      "@tanstack/react-query",
      "@tanstack/react-query-devtools",
      "@headlessui/react",
      "@heroicons/react",
      "lucide-react",
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
      "eventemitter3",
      "recharts",
      // ADD: Marketing component dependencies
      "framer-motion",
      "lottie-react",
      "react-icons",
      "embla-carousel-react",
      "embla-carousel-autoplay"
    ],
    exclude: [
      // Exclude large libraries that should be loaded on demand
      "@heroicons/react/24/outline",
      "@heroicons/react/24/solid",
      // Exclude all es-toolkit modules to prevent module resolution issues
      "es-toolkit",
      "es-toolkit/compat",
      "es-toolkit/compat/get",
      "es-toolkit/compat/uniqBy"
    ]
  },
  // Enable tree shaking for better optimization
  define: {
    __DEV__: process.env.NODE_ENV === "development",
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production")
  },
  // Enhanced tree shaking configuration
  esbuild: {
    treeShaking: true,
    jsx: "transform",
    drop: process.env.NODE_ENV === "production" && process.env.VITE_APP_ENVIRONMENT === "production" ? ["console", "debugger"] : []
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxyZWFjdFxcXFxSZWFjdC1BcHAtMDAwNzM5XFxcXFByb21wdC1MaWJyYXJ5XFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxyZWFjdFxcXFxSZWFjdC1BcHAtMDAwNzM5XFxcXFByb21wdC1MaWJyYXJ5XFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9yZWFjdC9SZWFjdC1BcHAtMDAwNzM5L1Byb21wdC1MaWJyYXJ5L2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3RcIiAvPlxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB2aXRlQ29tcHJlc3Npb24gZnJvbSAndml0ZS1wbHVnaW4tY29tcHJlc3Npb24nXG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSAncm9sbHVwLXBsdWdpbi12aXN1YWxpemVyJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcblxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3Qoe1xuICAgICAganN4UnVudGltZTogJ2NsYXNzaWMnLFxuICAgICAganN4SW1wb3J0U291cmNlOiAncmVhY3QnXG4gICAgfSksXG4gICAgLy8gR3ppcCBjb21wcmVzc2lvblxuICAgIHZpdGVDb21wcmVzc2lvbih7XG4gICAgICBhbGdvcml0aG06ICdnemlwJyxcbiAgICAgIGV4dDogJy5neicsXG4gICAgICB0aHJlc2hvbGQ6IDEwMjQsIC8vIE9ubHkgY29tcHJlc3MgZmlsZXMgbGFyZ2VyIHRoYW4gMUtCXG4gICAgICBjb21wcmVzc2lvbk9wdGlvbnM6IHtcbiAgICAgICAgbGV2ZWw6IDksIC8vIE1heGltdW0gY29tcHJlc3Npb25cbiAgICAgIH0sXG4gICAgICBmaWx0ZXI6IC9cXC4oanN8bWpzfGpzb258Y3NzfGh0bWx8c3ZnKSQvaSxcbiAgICAgIGRlbGV0ZU9yaWdpbkZpbGU6IGZhbHNlLFxuICAgIH0pLFxuICAgIC8vIEJyb3RsaSBjb21wcmVzc2lvbiAoYmV0dGVyIHRoYW4gZ3ppcClcbiAgICB2aXRlQ29tcHJlc3Npb24oe1xuICAgICAgYWxnb3JpdGhtOiAnYnJvdGxpQ29tcHJlc3MnLFxuICAgICAgZXh0OiAnLmJyJyxcbiAgICAgIHRocmVzaG9sZDogMTAyNCxcbiAgICAgIGNvbXByZXNzaW9uT3B0aW9uczoge1xuICAgICAgICBsZXZlbDogMTEsIC8vIE1heGltdW0gY29tcHJlc3Npb25cbiAgICAgIH0sXG4gICAgICBmaWx0ZXI6IC9cXC4oanN8bWpzfGpzb258Y3NzfGh0bWx8c3ZnKSQvaSxcbiAgICAgIGRlbGV0ZU9yaWdpbkZpbGU6IGZhbHNlLFxuICAgIH0pLFxuICAgIC8vIEJ1bmRsZSBhbmFseXplciAob25seSBpbiBhbmFseXplIG1vZGUpXG4gICAgLi4uKHByb2Nlc3MuZW52LkFOQUxZWkUgPyBbXG4gICAgICB2aXN1YWxpemVyKHtcbiAgICAgICAgZmlsZW5hbWU6ICdkaXN0L3N0YXRzLmh0bWwnLFxuICAgICAgICBvcGVuOiB0cnVlLFxuICAgICAgICBnemlwU2l6ZTogdHJ1ZSxcbiAgICAgICAgYnJvdGxpU2l6ZTogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGU6ICd0cmVlbWFwJywgLy8gb3IgJ3N1bmJ1cnN0JywgJ25ldHdvcmsnXG4gICAgICB9KVxuICAgIF0gOiBbXSksXG4gIF0sXG4gIHRlc3Q6IHtcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgIHNldHVwRmlsZXM6ICcuL3NyYy90ZXN0L3NldHVwLnRzJyxcbiAgICBjc3M6IHRydWUsXG4gICAgY292ZXJhZ2U6IHtcbiAgICAgIHByb3ZpZGVyOiAndjgnLFxuICAgICAgcmVwb3J0ZXI6IFsndGV4dCcsICdqc29uJywgJ2h0bWwnLCAnbGNvdiddLFxuICAgICAgZXhjbHVkZTogW1xuICAgICAgICAnbm9kZV9tb2R1bGVzLycsXG4gICAgICAgICdzcmMvdGVzdC8nLFxuICAgICAgICAnKiovKi5kLnRzJyxcbiAgICAgICAgJyoqLyouY29uZmlnLionLFxuICAgICAgICAnZGlzdC8nLFxuICAgICAgICAnY292ZXJhZ2UvJyxcbiAgICAgIF0sXG4gICAgfSxcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAvLyBBREQ6IE1hcmtldGluZyBjb21wb25lbnQgYWxpYXNlc1xuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcbiAgICAgICdAL21hcmtldGluZyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9jb21wb25lbnRzL21hcmtldGluZycpLFxuICAgICAgXG4gICAgICAvLyBLZWVwIFJBRydzIFJlYWN0IGVjb3N5c3RlbSBhbGlhc2VzXG4gICAgICAncmVhY3QnOiAncmVhY3QnLFxuICAgICAgJ3JlYWN0LWRvbSc6ICdyZWFjdC1kb20nLFxuICAgICAgJ3JlYWN0LXJvdXRlci1kb20nOiAncmVhY3Qtcm91dGVyLWRvbScsXG4gICAgICAvLyBGaXggcmVhY3QtaXMgY29tcGF0aWJpbGl0eSB3aXRoIFJlY2hhcnRzXG4gICAgICAncmVhY3QtaXMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3V0aWxzL3JlYWN0LWlzLWNvbXBhdC5qcycpLFxuICAgICAgLy8gQ29tcHJlaGVuc2l2ZSBlcy10b29sa2l0IGNvbXBhdGliaWxpdHkgZml4IC0gbWFwIGFsbCBmdW5jdGlvbnMgdG8gdW5pdmVyc2FsIGNvbXBhdFxuICAgICAgJ2VzLXRvb2xraXQvY29tcGF0L2dldCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvdXRpbHMvZXMtdG9vbGtpdC11bml2ZXJzYWwtY29tcGF0LmpzJyksXG4gICAgICAnZXMtdG9vbGtpdC9jb21wYXQvdW5pcUJ5JzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy91dGlscy9lcy10b29sa2l0LXVuaXZlcnNhbC1jb21wYXQuanMnKSxcbiAgICAgICdlcy10b29sa2l0L2NvbXBhdC9zb3J0QnknOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3V0aWxzL2VzLXRvb2xraXQtdW5pdmVyc2FsLWNvbXBhdC5qcycpLFxuICAgICAgJ2VzLXRvb2xraXQvY29tcGF0L2lzRXF1YWwnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3V0aWxzL2VzLXRvb2xraXQtdW5pdmVyc2FsLWNvbXBhdC5qcycpLFxuICAgICAgJ2VzLXRvb2xraXQvY29tcGF0L2xhc3QnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3V0aWxzL2VzLXRvb2xraXQtdW5pdmVyc2FsLWNvbXBhdC5qcycpLFxuICAgICAgJ2VzLXRvb2xraXQvY29tcGF0L2lzUGxhaW5PYmplY3QnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3V0aWxzL2VzLXRvb2xraXQtdW5pdmVyc2FsLWNvbXBhdC5qcycpLFxuICAgICAgJ2VzLXRvb2xraXQvY29tcGF0L21heEJ5JzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy91dGlscy9lcy10b29sa2l0LXVuaXZlcnNhbC1jb21wYXQuanMnKSxcbiAgICAgICdlcy10b29sa2l0L2NvbXBhdC9taW5CeSc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvdXRpbHMvZXMtdG9vbGtpdC11bml2ZXJzYWwtY29tcGF0LmpzJyksXG4gICAgICAnZXMtdG9vbGtpdC9jb21wYXQvcmFuZ2UnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3V0aWxzL2VzLXRvb2xraXQtdW5pdmVyc2FsLWNvbXBhdC5qcycpLFxuICAgICAgJ2VzLXRvb2xraXQvY29tcGF0L3Rocm90dGxlJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy91dGlscy9lcy10b29sa2l0LXVuaXZlcnNhbC1jb21wYXQuanMnKSxcbiAgICAgICdlcy10b29sa2l0L2NvbXBhdC9vbWl0JzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy91dGlscy9lcy10b29sa2l0LXVuaXZlcnNhbC1jb21wYXQuanMnKSxcbiAgICAgICdlcy10b29sa2l0L2NvbXBhdC9zdW1CeSc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvdXRpbHMvZXMtdG9vbGtpdC11bml2ZXJzYWwtY29tcGF0LmpzJyksXG4gICAgICAnZXMtdG9vbGtpdC9jb21wYXQvaXNOaWwnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3V0aWxzL2VzLXRvb2xraXQtdW5pdmVyc2FsLWNvbXBhdC5qcycpLFxuICAgICAgJ2VzLXRvb2xraXQvY29tcGF0L2lzRnVuY3Rpb24nOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3V0aWxzL2VzLXRvb2xraXQtdW5pdmVyc2FsLWNvbXBhdC5qcycpLFxuICAgICAgJ2VzLXRvb2xraXQvY29tcGF0JzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy91dGlscy9lcy10b29sa2l0LXVuaXZlcnNhbC1jb21wYXQuanMnKSxcbiAgICAgIC8vIEZpeCB1c2Utc3luYy1leHRlcm5hbC1zdG9yZSBjb21wYXRpYmlsaXR5XG4gICAgICAndXNlLXN5bmMtZXh0ZXJuYWwtc3RvcmUvc2hpbS93aXRoLXNlbGVjdG9yJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy91dGlscy91c2Utc3luYy1leHRlcm5hbC1zdG9yZS1jb21wYXQuanMnKSxcbiAgICB9LFxuICAgIGRlZHVwZTogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbScsICdAdGFuc3RhY2svcmVhY3QtcXVlcnknLCAncmVhY3Qtd2luZG93J10sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgb3BlbjogdHJ1ZSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIG1pbmlmeTogJ3RlcnNlcicsXG4gICAgdGFyZ2V0OiAnZXMyMDIwJyxcbiAgICBtb2R1bGVQcmVsb2FkOiBmYWxzZSxcbiAgICAvLyBDRE4gQ29uZmlndXJhdGlvblxuICAgIC4uLihwcm9jZXNzLmVudi5WSVRFX0NETl9VUkwgJiYge1xuICAgICAgYmFzZTogcHJvY2Vzcy5lbnYuVklURV9DRE5fVVJMLFxuICAgIH0pLFxuICAgIC8vIEVuaGFuY2VkIGJ1aWxkIG9wdGltaXphdGlvblxuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcbiAgICBhc3NldHNJbmxpbmVMaW1pdDogNDA5NiwgLy8gNEtCIC0gaW5saW5lIHNtYWxsZXIgYXNzZXRzXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLCAvLyBXYXJuIGZvciBjaHVua3MgPiAxTUIgKG1vcmUgcmVhbGlzdGljIGZvciBjb21wbGV4IGFwcHMpXG4gICAgcmVwb3J0Q29tcHJlc3NlZFNpemU6IGZhbHNlLCAvLyBGYXN0ZXIgYnVpbGRzXG4gICAgdGVyc2VyT3B0aW9uczoge1xuICAgICAgY29tcHJlc3M6IHtcbiAgICAgICAgZHJvcF9jb25zb2xlOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nICYmIHByb2Nlc3MuZW52LlZJVEVfQVBQX0VOVklST05NRU5UID09PSAncHJvZHVjdGlvbicsXG4gICAgICAgIGRyb3BfZGVidWdnZXI6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicsXG4gICAgICAgIHB1cmVfZnVuY3M6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicgJiYgcHJvY2Vzcy5lbnYuVklURV9BUFBfRU5WSVJPTk1FTlQgPT09ICdwcm9kdWN0aW9uJyA/IFsnY29uc29sZS5sb2cnLCAnY29uc29sZS5pbmZvJ10gOiBbXSxcbiAgICAgIH0sXG4gICAgICBtYW5nbGU6IHtcbiAgICAgICAgc2FmYXJpMTA6IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGZvcm1hdDogJ2VzJyxcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdhc3NldHMvanMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICBhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT4ge1xuICAgICAgICAgIGNvbnN0IGluZm8gPSBhc3NldEluZm8ubmFtZT8uc3BsaXQoJy4nKSB8fCBbXTtcbiAgICAgICAgICBjb25zdCBleHQgPSBpbmZvW2luZm8ubGVuZ3RoIC0gMV07XG4gICAgICAgICAgaWYgKC9wbmd8anBlP2d8c3ZnfGdpZnx0aWZmfGJtcHxpY28vaS50ZXN0KGV4dCkpIHtcbiAgICAgICAgICAgIHJldHVybiBgYXNzZXRzL2ltYWdlcy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdYDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKC93b2ZmMj98ZW90fHR0ZnxvdGYvaS50ZXN0KGV4dCkpIHtcbiAgICAgICAgICAgIHJldHVybiBgYXNzZXRzL2ZvbnRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV1gO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYGFzc2V0cy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdYDtcbiAgICAgICAgfSxcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB1bmRlZmluZWQsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcbiAgICAgICdyZWFjdCcsXG4gICAgICAncmVhY3QtZG9tJyxcbiAgICAgICdyZWFjdC1kb20vY2xpZW50JyxcbiAgICAgICdyZWFjdC9qc3gtcnVudGltZScsXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbScsXG4gICAgICAncmVhY3Qtd2luZG93JyxcbiAgICAgICdyZWFjdC13aW5kb3ctaW5maW5pdGUtbG9hZGVyJyxcbiAgICAgICdAdGFuc3RhY2svcmVhY3QtcXVlcnknLFxuICAgICAgJ0B0YW5zdGFjay9yZWFjdC1xdWVyeS1kZXZ0b29scycsXG4gICAgICAnQGhlYWRsZXNzdWkvcmVhY3QnLFxuICAgICAgJ0BoZXJvaWNvbnMvcmVhY3QnLFxuICAgICAgJ2x1Y2lkZS1yZWFjdCcsXG4gICAgICAnZmlyZWJhc2UvYXBwJyxcbiAgICAgICdmaXJlYmFzZS9hdXRoJyxcbiAgICAgICdmaXJlYmFzZS9maXJlc3RvcmUnLFxuICAgICAgJ2V2ZW50ZW1pdHRlcjMnLFxuICAgICAgJ3JlY2hhcnRzJyxcbiAgICAgIC8vIEFERDogTWFya2V0aW5nIGNvbXBvbmVudCBkZXBlbmRlbmNpZXNcbiAgICAgICdmcmFtZXItbW90aW9uJyxcbiAgICAgICdsb3R0aWUtcmVhY3QnLFxuICAgICAgJ3JlYWN0LWljb25zJyxcbiAgICAgICdlbWJsYS1jYXJvdXNlbC1yZWFjdCcsXG4gICAgICAnZW1ibGEtY2Fyb3VzZWwtYXV0b3BsYXknXG4gICAgXSxcbiAgICBleGNsdWRlOiBbXG4gICAgICAvLyBFeGNsdWRlIGxhcmdlIGxpYnJhcmllcyB0aGF0IHNob3VsZCBiZSBsb2FkZWQgb24gZGVtYW5kXG4gICAgICAnQGhlcm9pY29ucy9yZWFjdC8yNC9vdXRsaW5lJyxcbiAgICAgICdAaGVyb2ljb25zL3JlYWN0LzI0L3NvbGlkJyxcbiAgICAgIC8vIEV4Y2x1ZGUgYWxsIGVzLXRvb2xraXQgbW9kdWxlcyB0byBwcmV2ZW50IG1vZHVsZSByZXNvbHV0aW9uIGlzc3Vlc1xuICAgICAgJ2VzLXRvb2xraXQnLFxuICAgICAgJ2VzLXRvb2xraXQvY29tcGF0JyxcbiAgICAgICdlcy10b29sa2l0L2NvbXBhdC9nZXQnLFxuICAgICAgJ2VzLXRvb2xraXQvY29tcGF0L3VuaXFCeSdcbiAgICBdXG4gIH0sXG4gIC8vIEVuYWJsZSB0cmVlIHNoYWtpbmcgZm9yIGJldHRlciBvcHRpbWl6YXRpb25cbiAgZGVmaW5lOiB7XG4gICAgX19ERVZfXzogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcsXG4gICAgJ3Byb2Nlc3MuZW52Lk5PREVfRU5WJzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuTk9ERV9FTlYgfHwgJ3Byb2R1Y3Rpb24nKSxcbiAgfSxcbiAgLy8gRW5oYW5jZWQgdHJlZSBzaGFraW5nIGNvbmZpZ3VyYXRpb25cbiAgZXNidWlsZDoge1xuICAgIHRyZWVTaGFraW5nOiB0cnVlLFxuICAgIGpzeDogJ3RyYW5zZm9ybScsXG4gICAgZHJvcDogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyAmJiBwcm9jZXNzLmVudi5WSVRFX0FQUF9FTlZJUk9OTUVOVCA9PT0gJ3Byb2R1Y3Rpb24nID8gWydjb25zb2xlJywgJ2RlYnVnZ2VyJ10gOiBbXSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8scUJBQXFCO0FBQzVCLFNBQVMsa0JBQWtCO0FBQzNCLE9BQU8sVUFBVTtBQUxqQixJQUFNLG1DQUFtQztBQVF6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsTUFDSixZQUFZO0FBQUEsTUFDWixpQkFBaUI7QUFBQSxJQUNuQixDQUFDO0FBQUE7QUFBQSxJQUVELGdCQUFnQjtBQUFBLE1BQ2QsV0FBVztBQUFBLE1BQ1gsS0FBSztBQUFBLE1BQ0wsV0FBVztBQUFBO0FBQUEsTUFDWCxvQkFBb0I7QUFBQSxRQUNsQixPQUFPO0FBQUE7QUFBQSxNQUNUO0FBQUEsTUFDQSxRQUFRO0FBQUEsTUFDUixrQkFBa0I7QUFBQSxJQUNwQixDQUFDO0FBQUE7QUFBQSxJQUVELGdCQUFnQjtBQUFBLE1BQ2QsV0FBVztBQUFBLE1BQ1gsS0FBSztBQUFBLE1BQ0wsV0FBVztBQUFBLE1BQ1gsb0JBQW9CO0FBQUEsUUFDbEIsT0FBTztBQUFBO0FBQUEsTUFDVDtBQUFBLE1BQ0EsUUFBUTtBQUFBLE1BQ1Isa0JBQWtCO0FBQUEsSUFDcEIsQ0FBQztBQUFBO0FBQUEsSUFFRCxHQUFJLFFBQVEsSUFBSSxVQUFVO0FBQUEsTUFDeEIsV0FBVztBQUFBLFFBQ1QsVUFBVTtBQUFBLFFBQ1YsTUFBTTtBQUFBLFFBQ04sVUFBVTtBQUFBLFFBQ1YsWUFBWTtBQUFBLFFBQ1osVUFBVTtBQUFBO0FBQUEsTUFDWixDQUFDO0FBQUEsSUFDSCxJQUFJLENBQUM7QUFBQSxFQUNQO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFDSixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixZQUFZO0FBQUEsSUFDWixLQUFLO0FBQUEsSUFDTCxVQUFVO0FBQUEsTUFDUixVQUFVO0FBQUEsTUFDVixVQUFVLENBQUMsUUFBUSxRQUFRLFFBQVEsTUFBTTtBQUFBLE1BQ3pDLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQTtBQUFBLE1BRUwsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3BDLGVBQWUsS0FBSyxRQUFRLGtDQUFXLDRCQUE0QjtBQUFBO0FBQUEsTUFHbkUsU0FBUztBQUFBLE1BQ1QsYUFBYTtBQUFBLE1BQ2Isb0JBQW9CO0FBQUE7QUFBQSxNQUVwQixZQUFZLEtBQUssUUFBUSxrQ0FBVyw4QkFBOEI7QUFBQTtBQUFBLE1BRWxFLHlCQUF5QixLQUFLLFFBQVEsa0NBQVcsMENBQTBDO0FBQUEsTUFDM0YsNEJBQTRCLEtBQUssUUFBUSxrQ0FBVywwQ0FBMEM7QUFBQSxNQUM5Riw0QkFBNEIsS0FBSyxRQUFRLGtDQUFXLDBDQUEwQztBQUFBLE1BQzlGLDZCQUE2QixLQUFLLFFBQVEsa0NBQVcsMENBQTBDO0FBQUEsTUFDL0YsMEJBQTBCLEtBQUssUUFBUSxrQ0FBVywwQ0FBMEM7QUFBQSxNQUM1RixtQ0FBbUMsS0FBSyxRQUFRLGtDQUFXLDBDQUEwQztBQUFBLE1BQ3JHLDJCQUEyQixLQUFLLFFBQVEsa0NBQVcsMENBQTBDO0FBQUEsTUFDN0YsMkJBQTJCLEtBQUssUUFBUSxrQ0FBVywwQ0FBMEM7QUFBQSxNQUM3RiwyQkFBMkIsS0FBSyxRQUFRLGtDQUFXLDBDQUEwQztBQUFBLE1BQzdGLDhCQUE4QixLQUFLLFFBQVEsa0NBQVcsMENBQTBDO0FBQUEsTUFDaEcsMEJBQTBCLEtBQUssUUFBUSxrQ0FBVywwQ0FBMEM7QUFBQSxNQUM1RiwyQkFBMkIsS0FBSyxRQUFRLGtDQUFXLDBDQUEwQztBQUFBLE1BQzdGLDJCQUEyQixLQUFLLFFBQVEsa0NBQVcsMENBQTBDO0FBQUEsTUFDN0YsZ0NBQWdDLEtBQUssUUFBUSxrQ0FBVywwQ0FBMEM7QUFBQSxNQUNsRyxxQkFBcUIsS0FBSyxRQUFRLGtDQUFXLDBDQUEwQztBQUFBO0FBQUEsTUFFdkYsOENBQThDLEtBQUssUUFBUSxrQ0FBVyw2Q0FBNkM7QUFBQSxJQUNySDtBQUFBLElBQ0EsUUFBUSxDQUFDLFNBQVMsYUFBYSxvQkFBb0IseUJBQXlCLGNBQWM7QUFBQSxFQUM1RjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYLFFBQVE7QUFBQSxJQUNSLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQTtBQUFBLElBRWYsR0FBSSxRQUFRLElBQUksZ0JBQWdCO0FBQUEsTUFDOUIsTUFBTSxRQUFRLElBQUk7QUFBQSxJQUNwQjtBQUFBO0FBQUEsSUFFQSxjQUFjO0FBQUEsSUFDZCxtQkFBbUI7QUFBQTtBQUFBLElBQ25CLHVCQUF1QjtBQUFBO0FBQUEsSUFDdkIsc0JBQXNCO0FBQUE7QUFBQSxJQUN0QixlQUFlO0FBQUEsTUFDYixVQUFVO0FBQUEsUUFDUixjQUFjLFFBQVEsSUFBSSxhQUFhLGdCQUFnQixRQUFRLElBQUkseUJBQXlCO0FBQUEsUUFDNUYsZUFBZSxRQUFRLElBQUksYUFBYTtBQUFBLFFBQ3hDLFlBQVksUUFBUSxJQUFJLGFBQWEsZ0JBQWdCLFFBQVEsSUFBSSx5QkFBeUIsZUFBZSxDQUFDLGVBQWUsY0FBYyxJQUFJLENBQUM7QUFBQSxNQUM5STtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ04sVUFBVTtBQUFBLE1BQ1o7QUFBQSxJQUNGO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0IsQ0FBQyxjQUFjO0FBQzdCLGdCQUFNLE9BQU8sVUFBVSxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUM7QUFDNUMsZ0JBQU0sTUFBTSxLQUFLLEtBQUssU0FBUyxDQUFDO0FBQ2hDLGNBQUksa0NBQWtDLEtBQUssR0FBRyxHQUFHO0FBQy9DLG1CQUFPO0FBQUEsVUFDVDtBQUNBLGNBQUksc0JBQXNCLEtBQUssR0FBRyxHQUFHO0FBQ25DLG1CQUFPO0FBQUEsVUFDVDtBQUNBLGlCQUFPO0FBQUEsUUFDVDtBQUFBLFFBQ0EsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBO0FBQUEsTUFFQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUE7QUFBQSxNQUVQO0FBQUEsTUFDQTtBQUFBO0FBQUEsTUFFQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUVBLFFBQVE7QUFBQSxJQUNOLFNBQVMsUUFBUSxJQUFJLGFBQWE7QUFBQSxJQUNsQyx3QkFBd0IsS0FBSyxVQUFVLFFBQVEsSUFBSSxZQUFZLFlBQVk7QUFBQSxFQUM3RTtBQUFBO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDUCxhQUFhO0FBQUEsSUFDYixLQUFLO0FBQUEsSUFDTCxNQUFNLFFBQVEsSUFBSSxhQUFhLGdCQUFnQixRQUFRLElBQUkseUJBQXlCLGVBQWUsQ0FBQyxXQUFXLFVBQVUsSUFBSSxDQUFDO0FBQUEsRUFDaEk7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
