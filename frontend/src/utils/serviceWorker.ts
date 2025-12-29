/**
 * Service Worker Registration and Management
 * Handles service worker lifecycle, updates, and communication
 */

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private _config: ServiceWorkerConfig = {};

  constructor(config: ServiceWorkerConfig = {}) {
    this._config = config;
    this.setupConnectionListeners();
  }
  public get config(): Readonly<ServiceWorkerConfig> {
    return this._config;
  }

  public setConfig(config: ServiceWorkerConfig): void {
    this._config = config;
  }

  /**
   * Register the service worker
   */
  async register(swUrl: string = '/sw.js'): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported in this browser');
      return null;
    }

    try {
      console.log('[SW Manager] Registering service worker...');

      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/',
      });

      this.registration = registration;

      // Handle different service worker states
      if (registration.installing) {
        console.log('[SW Manager] Service worker installing...');
        this.trackInstalling(registration.installing);
      } else if (registration.waiting) {
        console.log('[SW Manager] Service worker waiting...');
        this.showUpdateAvailable(registration);
      } else if (registration.active) {
        console.log('[SW Manager] Service worker active');
        this._config.onSuccess?.(registration);
      }

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('[SW Manager] Service worker update found');
        const newWorker = registration.installing;
        if (newWorker) {
          this.trackInstalling(newWorker);
        }
      });

      return registration;
    } catch (error: unknown) {
      console.error('[SW Manager] Service worker registration failed:', error);
      return null;
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('[SW Manager] Service worker unregistered:', result);
      this.registration = null;
      return result;
    } catch (error: unknown) {
      console.error('[SW Manager] Failed to unregister service worker:', error);
      return false;
    }
  }

  /**
   * Update the service worker
   */
  async update(): Promise<void> {
    if (!this.registration) {
      console.warn('[SW Manager] No registration available for update');
      return;
    }

    try {
      await this.registration.update();
      console.log('[SW Manager] Service worker update triggered');
    } catch (error: unknown) {
      console.error('[SW Manager] Failed to update service worker:', error);
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  skipWaiting(): void {
    if (!this.registration?.waiting) {
      console.warn('[SW Manager] No waiting service worker to skip');
      return;
    }

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  /**
   * Get service worker version
   */
  async getVersion(): Promise<string | null> {
    if (!this.registration?.active) {
      return null;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version || null);
      };

      this.registration!.active!.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);

      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });
  }

  /**
   * Check if app is running in standalone mode (PWA)
   */
  isStandalone(): boolean {
    const nav = navigator as Navigator & { standalone?: boolean };
    return (
      (globalThis as Window & typeof globalThis).matchMedia('(display-mode: standalone)').matches ||
      nav.standalone === true
    );
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Add to home screen prompt
   */
  async promptInstall(): Promise<boolean> {
    interface BeforeInstallPromptEvent extends Event {
      prompt: () => void;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    }
    const win = globalThis as unknown as { deferredPrompt?: BeforeInstallPromptEvent | null };
    const deferredPrompt = win.deferredPrompt ?? null;

    if (!deferredPrompt) {
      console.warn('[SW Manager] Install prompt not available');
      return false;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      console.log('[SW Manager] Install prompt outcome:', outcome);
      win.deferredPrompt = null;

      return outcome === 'accepted';
    } catch (error: unknown) {
      console.error('[SW Manager] Install prompt failed:', error);
      return false;
    }
  }

  /**
   * Track installing service worker
   */
  private trackInstalling(worker: ServiceWorker): void {
    worker.addEventListener('statechange', () => {
      console.log('[SW Manager] Service worker state changed:', worker.state);

      if (worker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // New update available
          console.log('[SW Manager] New content available');
          this.showUpdateAvailable(this.registration!);
        } else {
          // Content cached for first time
          console.log('[SW Manager] Content cached for offline use');
          this._config.onSuccess?.(this.registration!);
        }
      }
    });
  }

  /**
   * Show update available notification
   */
  private showUpdateAvailable(registration: ServiceWorkerRegistration): void {
    console.log('[SW Manager] Update available');
    this._config.onUpdate?.(registration);
  }

  /**
   * Setup connection status listeners
   */
  private setupConnectionListeners(): void {
    globalThis.addEventListener('online', () => {
      console.log('[SW Manager] App is online');
      this._config.onOnline?.();
    });

    globalThis.addEventListener('offline', () => {
      console.log('[SW Manager] App is offline');
      this._config.onOffline?.();
    });
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    if (!('caches' in globalThis)) {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      console.log('[SW Manager] All caches cleared');
    } catch (error: unknown) {
      console.error('[SW Manager] Failed to clear caches:', error);
    }
  }

  /**
   * Get cache storage usage
   */
  async getCacheUsage(): Promise<{ used: number; quota: number } | null> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    } catch (error: unknown) {
      console.error('[SW Manager] Failed to get storage estimate:', error);
      return null;
    }
  }
}

// Global service worker manager instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Utility functions
export const serviceWorkerUtils = {
  /**
   * Format bytes to human readable format
   */
  formatBytes: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Check if browser supports service workers
   */
  isSupported: (): boolean => {
    return 'serviceWorker' in navigator;
  },

  /**
   * Check if browser supports push notifications
   */
  supportsPushNotifications: (): boolean => {
    return 'PushManager' in globalThis && 'Notification' in globalThis;
  },

  /**
   * Request notification permission
   */
  requestNotificationPermission: async (): Promise<NotificationPermission> => {
    if (!('Notification' in globalThis)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    return await Notification.requestPermission();
  },
};

// Auto-register service worker in production
if (process.env.NODE_ENV === 'production' && serviceWorkerUtils.isSupported()) {
  (async () => {
    try {
      await serviceWorkerManager.register();
    } catch (error) {
      console.error(error);
    }
  })();
}

// Handle beforeinstallprompt event
globalThis.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => void;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }
  const win = globalThis as unknown as { deferredPrompt?: BeforeInstallPromptEvent | null };
  win.deferredPrompt = e as BeforeInstallPromptEvent;
  console.log('[SW Manager] Install prompt available');
});

// Export types
export type { ServiceWorkerConfig };
