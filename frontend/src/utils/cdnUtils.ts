/**
 * CDN Utilities
 * Handles CDN asset loading, fallbacks, and optimization
 */

interface CDNConfig {
  baseUrl: string;
  fallbackUrl?: string;
  regions: string[];
  retryAttempts: number;
  timeout: number;
}

interface AssetManifest {
  version: string;
  assets: { [key: string]: { hash: string; size: number; type: string } };
  preload: string[];
  prefetch: string[];
}

class CDNManager {
  private config: CDNConfig;
  private manifest: AssetManifest | null = null;
  private loadedAssets = new Set<string>();
  private failedAssets = new Set<string>();

  constructor(config: Partial<CDNConfig> = {}) {
    this.config = {
      baseUrl: import.meta.env.VITE_CDN_URL || '',
      fallbackUrl: import.meta.env.VITE_ASSETS_URL || '',
      regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
      retryAttempts: 3,
      timeout: 10000,
      ...config
    };

    this.loadAssetManifest();
  }

  /**
   * Load asset manifest from CDN
   */
  private async loadAssetManifest(): Promise<void> {
    try {
      const manifestUrl = this.getAssetUrl('/asset-manifest.json');
      const response = await fetch(manifestUrl, {
        cache: 'force-cache',
        timeout: this.config.timeout
      } as RequestInit);

      if (response.ok) {
        this.manifest = await response.json();
        console.log('📦 Asset manifest loaded from CDN');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load asset manifest from CDN:', error);
    }
  }

  /**
   * Get optimized asset URL
   */
  getAssetUrl(path: string, options: {
    version?: string;
    format?: 'webp' | 'avif' | 'auto';
    quality?: number;
    width?: number;
    height?: number;
  } = {}): string {
    const { version, format, quality, width, height } = options;

    // Remove leading slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Use CDN base URL if available
    const baseUrl = this.config.baseUrl || '';

    // Construct URL
    let url = baseUrl ? `${baseUrl}/${cleanPath}` : `/${cleanPath}`;

    // Add optimization parameters for images
    if (this.isImageAsset(path)) {
      const params = new URLSearchParams();

      if (format && format !== 'auto') {
        params.set('f', format);
      } else if (this.supportsWebP()) {
        params.set('f', 'webp');
      }

      if (quality) params.set('q', quality.toString());
      if (width) params.set('w', width.toString());
      if (height) params.set('h', height.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    // Add version for cache busting
    if (version || this.manifest?.version) {
      const versionParam = version || this.manifest!.version;
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}v=${versionParam}`;
    }

    return url;
  }

  /**
   * Preload critical assets
   */
  async preloadCriticalAssets(): Promise<void> {
    if (!this.manifest) return;

    const preloadPromises = this.manifest.preload.map(async (assetPath) => {
      try {
        await this.preloadAsset(assetPath);
      } catch (error) {
        console.warn(`Failed to preload ${assetPath}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log('🚀 Critical assets preloaded');
  }

  /**
   * Prefetch non-critical assets
   */
  prefetchAssets(): void {
    if (!this.manifest) return;

    // Use requestIdleCallback for prefetching
    const prefetch = () => {
      this.manifest!.prefetch.forEach(assetPath => {
        this.prefetchAsset(assetPath);
      });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(prefetch);
    } else {
      setTimeout(prefetch, 1000);
    }
  }

  /**
   * Preload a specific asset
   */
  private async preloadAsset(path: string): Promise<void> {
    if (this.loadedAssets.has(path) || this.failedAssets.has(path)) {
      return;
    }

    const url = this.getAssetUrl(path);
    const assetType = this.getAssetType(path);

    try {
      if (assetType === 'script') {
        await this.preloadScript(url);
      } else if (assetType === 'style') {
        await this.preloadStylesheet(url);
      } else if (assetType === 'image') {
        await this.preloadImage(url);
      } else if (assetType === 'font') {
        await this.preloadFont(url);
      }

      this.loadedAssets.add(path);
    } catch (error) {
      this.failedAssets.add(path);
      throw error;
    }
  }

  /**
   * Prefetch a specific asset
   */
  private prefetchAsset(path: string): void {
    if (this.loadedAssets.has(path) || this.failedAssets.has(path)) {
      return;
    }

    const url = this.getAssetUrl(path);
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }

  /**
   * Preload script
   */
  private preloadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload script: ${url}`));
      document.head.appendChild(link);
    });
  }

  /**
   * Preload stylesheet
   */
  private preloadStylesheet(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload stylesheet: ${url}`));
      document.head.appendChild(link);
    });
  }

  /**
   * Preload image
   */
  private preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
      img.src = url;
    });
  }

  /**
   * Preload font
   */
  private preloadFont(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload font: ${url}`));
      document.head.appendChild(link);
    });
  }

  /**
   * Load asset with fallback
   */
  async loadAssetWithFallback(path: string, retries = this.config.retryAttempts): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const url = attempt === 0
          ? this.getAssetUrl(path)
          : this.getFallbackUrl(path);

        await this.testAssetAvailability(url);
        return url;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Asset load attempt ${attempt + 1} failed for ${path}:`, error);
      }
    }

    throw lastError || new Error(`Failed to load asset: ${path}`);
  }

  /**
   * Test if asset is available
   */
  private async testAssetAvailability(url: string): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get fallback URL
   */
  private getFallbackUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return this.config.fallbackUrl
      ? `${this.config.fallbackUrl}/${cleanPath}`
      : `/${cleanPath}`;
  }

  /**
   * Check if path is an image asset
   */
  private isImageAsset(path: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif'];
    return imageExtensions.some(ext => path.toLowerCase().endsWith(ext));
  }

  /**
   * Get asset type from path
   */
  private getAssetType(path: string): string {
    const ext = path.toLowerCase().split('.').pop();
    const types: { [key: string]: string } = {
      'js': 'script',
      'css': 'style',
      'png': 'image',
      'jpg': 'image',
      'jpeg': 'image',
      'gif': 'image',
      'svg': 'image',
      'webp': 'image',
      'avif': 'image',
      'woff': 'font',
      'woff2': 'font',
      'ttf': 'font',
      'eot': 'font'
    };
    return types[ext || ''] || 'other';
  }

  /**
   * Check WebP support
   */
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Get CDN health status
   */
  async getHealthStatus(): Promise<{ healthy: boolean; latency: number; region: string }> {
    const startTime = performance.now();

    try {
      const healthUrl = this.getAssetUrl('/health');
      const response = await fetch(healthUrl, {
        method: 'HEAD',
        cache: 'no-cache'
      });

      const latency = performance.now() - startTime;

      return {
        healthy: response.ok,
        latency,
        region: response.headers.get('cf-ray')?.split('-')[1] || 'unknown'
      };
    } catch {
      return {
        healthy: false,
        latency: performance.now() - startTime,
        region: 'unknown'
      };
    }
  }
}

// Global CDN manager instance
export const cdnManager = new CDNManager();

// Initialize CDN optimizations
if (typeof window !== 'undefined') {
  // Preload critical assets when page loads
  window.addEventListener('load', () => {
    cdnManager.preloadCriticalAssets();
    cdnManager.prefetchAssets();
  });
}

// Export utility functions
export const cdnUtils = {
  getAssetUrl: (
    path: string,
    options?: { version?: string; format?: 'webp' | 'avif' | 'auto'; quality?: number; width?: number; height?: number }
  ) => cdnManager.getAssetUrl(path, options),
  loadWithFallback: (path: string) => cdnManager.loadAssetWithFallback(path),
  preloadCritical: () => cdnManager.preloadCriticalAssets(),
  getHealthStatus: () => cdnManager.getHealthStatus()
};
