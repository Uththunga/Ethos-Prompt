/**
 * Chunk Error Handler
 * Handles dynamic import failures and provides fallback mechanisms
 */

export class ChunkErrorHandler {
  private static retryCount = new Map<string, number>();
  private static maxRetries = 3;

  /**
   * Handle chunk loading errors with automatic retry and cache clearing
   */
  static async handleChunkError(error: Error, chunkName?: string): Promise<void> {
    console.error('🚨 Chunk loading error:', error);

    const isProd =
      typeof import.meta !== 'undefined' &&
      (import.meta as any).env &&
      (import.meta as any).env.PROD;
    const errorKey = chunkName || error.message;
    const currentRetries = this.retryCount.get(errorKey) || 0;

    // In development: do not auto-reload. Show a message once and stop to avoid HMR loops.
    if (!isProd) {
      if (currentRetries === 0) {
        this.showErrorMessage();
        this.retryCount.set(errorKey, 1);
      }
      return;
    }

    if (currentRetries < this.maxRetries) {
      console.log(`🔄 Retrying chunk load (${currentRetries + 1}/${this.maxRetries})`);
      this.retryCount.set(errorKey, currentRetries + 1);

      // Clear caches and retry
      await this.clearCaches();

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Reload only once per session to avoid infinite loops
      const reloaded = sessionStorage.getItem('chunkReloaded');
      if (!reloaded) {
        sessionStorage.setItem('chunkReloaded', '1');
        console.log('🔄 Reloading page to recover from chunk error');
        window.location.reload();
      } else {
        console.warn('⚠️ Chunk reload already attempted this session. Showing error message.');
        this.showErrorMessage();
      }
    } else {
      console.error('❌ Max retries exceeded for chunk loading');
      this.showErrorMessage();
    }
  }

  /**
   * Clear all caches to resolve stale chunk issues
   */
  private static async clearCaches(): Promise<void> {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        console.log('🧹 Cleared caches:', cacheNames);
      }

      // Clear service worker if available
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
        console.log('🔧 Unregistered service workers');
      }
    } catch (error) {
      console.warn('⚠️ Failed to clear caches:', error);
    }
  }

  /**
   * Show user-friendly error message
   */
  private static showErrorMessage(): void {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: system-ui, sans-serif;
      ">
        <div style="
          background: white;
          padding: 30px;
          border-radius: 8px;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        ">
          <h2 style="color: #dc2626; margin-bottom: 16px;">⚠️ Loading Error</h2>
          <p style="color: #374151; margin-bottom: 20px;">
            There was an issue loading part of the application. This is usually caused by cached files.
          </p>
          <button onclick="window.location.reload()" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin-right: 10px;
          ">
            Reload Page
          </button>
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: #6b7280;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
          ">
            Dismiss
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }

  /**
   * Wrap dynamic imports with error handling
   */
  static async safeImport<T>(importFn: () => Promise<T>, chunkName?: string): Promise<T> {
    try {
      return await importFn();
    } catch (error) {
      await this.handleChunkError(error as Error, chunkName);
      throw error; // Re-throw to let React handle it
    }
  }

  /**
   * Initialize global error handlers
   */
  static initialize(): void {
    // Avoid initializing in development to prevent HMR interference and reload loops
    const isProd =
      typeof import.meta !== 'undefined' &&
      (import.meta as any).env &&
      (import.meta as any).env.PROD;
    if (!isProd) {
      console.log('🛡️ Chunk error handler disabled in development');
      return;
    }

    // Prevent duplicate initialization
    if ((window as any).__chunkHandlerInitialized) return;
    (window as any).__chunkHandlerInitialized = true;

    // Handle unhandled promise rejections (chunk loading failures)
    window.addEventListener('unhandledrejection', (event) => {
      const msg = event.reason?.message || '';
      if (
        msg.includes('Loading chunk') ||
        msg.includes('ChunkLoadError') ||
        msg.includes('Failed to fetch dynamically imported module')
      ) {
        console.log('🔧 Handling chunk loading rejection');
        event.preventDefault?.();
        this.handleChunkError(event.reason, 'dynamic-import');
      }
    });

    // Handle general script loading errors (narrowed to chunk errors)
    window.addEventListener('error', (event: ErrorEvent) => {
      const msg = event.message || '';
      if (msg.includes('ChunkLoadError')) {
        console.log('🔧 Handling script chunk loading error');
        this.handleChunkError(new Error(msg), 'script-load');
      }
    });

    console.log('🛡️ Chunk error handler initialized (production)');
  }
}
