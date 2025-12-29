import { useCallback, useEffect, useState } from 'react';
import { serviceWorkerManager, serviceWorkerUtils } from '../utils/serviceWorker';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  isStandalone: boolean;
  updateAvailable: boolean;
  installing: boolean;
  cacheUsage: { used: number; quota: number } | null;
  version: string | null;
}

interface ServiceWorkerActions {
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  update: () => Promise<void>;
  skipWaiting: () => void;
  clearCaches: () => Promise<void>;
  promptInstall: () => Promise<boolean>;
  requestNotificationPermission: () => Promise<NotificationPermission>;
}

/**
 * Hook for managing service worker state and actions
 */
export function useServiceWorker(): ServiceWorkerState & ServiceWorkerActions {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: serviceWorkerUtils.isSupported(),
    isRegistered: false,
    isOnline: navigator.onLine,
    isStandalone: serviceWorkerManager.isStandalone(),
    updateAvailable: false,
    installing: false,
    cacheUsage: null,
    version: null,
  });

  // Register service worker
  const register = useCallback(async () => {
    if (!state.isSupported) {
      console.warn('Service workers not supported');
      return;
    }

    setState((prev) => ({ ...prev, installing: true }));

    try {
      const registration = await serviceWorkerManager.register('/sw.js');

      setState((prev) => ({
        ...prev,
        isRegistered: !!registration,
        installing: false,
      }));

      // Get version after registration
      const version = await serviceWorkerManager.getVersion();
      setState((prev) => ({ ...prev, version }));
    } catch (error) {
      console.error('Service worker registration failed:', error);
      setState((prev) => ({ ...prev, installing: false }));
    }
  }, [state.isSupported]);

  // Unregister service worker
  const unregister = useCallback(async () => {
    const success = await serviceWorkerManager.unregister();
    setState((prev) => ({
      ...prev,
      isRegistered: !success,
      updateAvailable: false,
      version: null,
    }));
  }, []);

  // Update service worker
  const update = useCallback(async () => {
    await serviceWorkerManager.update();
  }, []);

  // Skip waiting for new service worker
  const skipWaiting = useCallback(() => {
    serviceWorkerManager.skipWaiting();
    setState((prev) => ({ ...prev, updateAvailable: false }));
  }, []);

  // Clear all caches
  const clearCaches = useCallback(async () => {
    await serviceWorkerManager.clearCaches();
    // Refresh cache usage after clearing
    const cacheUsage = await serviceWorkerManager.getCacheUsage();
    setState((prev) => ({ ...prev, cacheUsage }));
  }, []);

  // Prompt for app installation
  const promptInstall = useCallback(async () => {
    return await serviceWorkerManager.promptInstall();
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    return await serviceWorkerUtils.requestNotificationPermission();
  }, []);

  // Setup service worker event listeners
  useEffect(() => {
    if (!state.isSupported) return;

    // Configure service worker manager
    serviceWorkerManager.setConfig({
      onSuccess: () => {
        console.log('Service worker registered successfully');
        setState((prev) => ({ ...prev, isRegistered: true }));
      },
      onUpdate: () => {
        console.log('Service worker update available');
        setState((prev) => ({ ...prev, updateAvailable: true }));
      },
      onOnline: () => {
        setState((prev) => ({ ...prev, isOnline: true }));
      },
      onOffline: () => {
        setState((prev) => ({ ...prev, isOnline: false }));
      },
    });

    // Auto-register in production
    if (process.env.NODE_ENV === 'production') {
      register();
    }
  }, [state.isSupported, register]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }));

    globalThis.addEventListener('online', handleOnline);
    globalThis.addEventListener('offline', handleOffline);

    return () => {
      globalThis.removeEventListener('online', handleOnline);
      globalThis.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get cache usage periodically
  useEffect(() => {
    const updateCacheUsage = async () => {
      const cacheUsage = await serviceWorkerManager.getCacheUsage();
      setState((prev) => ({ ...prev, cacheUsage }));
    };

    updateCacheUsage();

    // Update every 30 seconds
    const interval = setInterval(updateCacheUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    ...state,
    register,
    unregister,
    update,
    skipWaiting,
    clearCaches,
    promptInstall,
    requestNotificationPermission,
  };
}

/**
 * Hook for connection status
 */
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    globalThis.addEventListener('online', handleOnline);
    globalThis.addEventListener('offline', handleOffline);

    return () => {
      globalThis.removeEventListener('online', handleOnline);
      globalThis.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook for PWA installation
 */
export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(serviceWorkerManager.isStandalone());

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setCanInstall(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const success = await serviceWorkerManager.promptInstall();
    if (success) {
      setCanInstall(false);
      setIsInstalled(true);
    }
    return success;
  }, []);

  return {
    canInstall,
    isInstalled,
    install,
  };
}

/**
 * Hook for cache management
 */
export function useCacheManagement() {
  const [cacheUsage, setCacheUsage] = useState<{ used: number; quota: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const updateCacheUsage = useCallback(async () => {
    const usage = await serviceWorkerManager.getCacheUsage();
    setCacheUsage(usage);
  }, []);

  const clearCaches = useCallback(async () => {
    setLoading(true);
    try {
      await serviceWorkerManager.clearCaches();
      await updateCacheUsage();
    } finally {
      setLoading(false);
    }
  }, [updateCacheUsage]);

  useEffect(() => {
    updateCacheUsage();
  }, [updateCacheUsage]);

  const formatUsage = useCallback((bytes: number) => {
    return serviceWorkerUtils.formatBytes(bytes);
  }, []);

  const getUsagePercentage = useCallback(() => {
    if (!cacheUsage || cacheUsage.quota === 0) return 0;
    return (cacheUsage.used / cacheUsage.quota) * 100;
  }, [cacheUsage]);

  return {
    cacheUsage,
    loading,
    clearCaches,
    updateCacheUsage,
    formatUsage,
    getUsagePercentage,
  };
}
