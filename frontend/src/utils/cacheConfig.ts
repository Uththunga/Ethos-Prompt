/**
 * Browser Caching Configuration
 * Manages cache strategies, versioning, and cache busting
 */

interface CacheStrategy {
  name: string;
  maxAge: number; // in seconds
  staleWhileRevalidate?: number;
  mustRevalidate?: boolean;
  immutable?: boolean;
  public?: boolean;
}

interface CacheRule {
  pattern: RegExp;
  strategy: CacheStrategy;
  description: string;
}

class CacheManager {
  private strategies: { [key: string]: CacheStrategy } = {
    // Long-term caching for versioned assets
    immutable: {
      name: 'immutable',
      maxAge: 31536000, // 1 year
      immutable: true,
      public: true
    },
    
    // Medium-term caching for images
    images: {
      name: 'images',
      maxAge: 2592000, // 30 days
      public: true
    },
    
    // Short-term caching for HTML
    html: {
      name: 'html',
      maxAge: 0,
      mustRevalidate: true,
      public: true
    },
    
    // No caching for dynamic content
    noCache: {
      name: 'no-cache',
      maxAge: 0,
      mustRevalidate: true,
      public: false
    },
    
    // API caching with revalidation
    api: {
      name: 'api',
      maxAge: 300, // 5 minutes
      staleWhileRevalidate: 60,
      public: false
    },
    
    // Font caching
    fonts: {
      name: 'fonts',
      maxAge: 31536000, // 1 year
      public: true
    }
  };

  private rules: CacheRule[] = [
    {
      pattern: /\.(js|css)$/,
      strategy: this.strategies.immutable,
      description: 'JavaScript and CSS files with hash-based versioning'
    },
    {
      pattern: /\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/,
      strategy: this.strategies.images,
      description: 'Image files'
    },
    {
      pattern: /\.(woff|woff2|ttf|eot)$/,
      strategy: this.strategies.fonts,
      description: 'Font files'
    },
    {
      pattern: /\.html$/,
      strategy: this.strategies.html,
      description: 'HTML files'
    },
    {
      pattern: /^\/api\//,
      strategy: this.strategies.api,
      description: 'API endpoints'
    },
    {
      pattern: /\/(sw\.js|service-worker\.js)$/,
      strategy: this.strategies.noCache,
      description: 'Service worker files'
    },
    {
      pattern: /\/manifest\.json$/,
      strategy: this.strategies.html,
      description: 'Web app manifest'
    }
  ];

  /**
   * Get cache headers for a given URL
   */
  getCacheHeaders(url: string): { [key: string]: string } {
    const rule = this.findMatchingRule(url);
    if (!rule) {
      return this.buildCacheHeaders(this.strategies.html);
    }

    return this.buildCacheHeaders(rule.strategy);
  }

  /**
   * Find matching cache rule for URL
   */
  private findMatchingRule(url: string): CacheRule | null {
    return this.rules.find(rule => rule.pattern.test(url)) || null;
  }

  /**
   * Build cache control headers from strategy
   */
  private buildCacheHeaders(strategy: CacheStrategy): { [key: string]: string } {
    const headers: { [key: string]: string } = {};
    
    // Build Cache-Control header
    const cacheControlParts: string[] = [];
    
    if (strategy.public !== false) {
      cacheControlParts.push('public');
    } else {
      cacheControlParts.push('private');
    }
    
    cacheControlParts.push(`max-age=${strategy.maxAge}`);
    
    if (strategy.mustRevalidate) {
      cacheControlParts.push('must-revalidate');
    }
    
    if (strategy.immutable) {
      cacheControlParts.push('immutable');
    }
    
    if (strategy.staleWhileRevalidate) {
      cacheControlParts.push(`stale-while-revalidate=${strategy.staleWhileRevalidate}`);
    }
    
    headers['Cache-Control'] = cacheControlParts.join(', ');
    
    // Add ETag for non-immutable resources
    if (!strategy.immutable && strategy.maxAge > 0) {
      headers['ETag'] = `"${this.generateETag()}"`;
    }
    
    // Add Vary header for content negotiation
    if (strategy.public !== false) {
      headers['Vary'] = 'Accept-Encoding';
    }
    
    return headers;
  }

  /**
   * Generate ETag for cache validation
   */
  private generateETag(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get cache strategy for asset type
   */
  getStrategy(assetType: string): CacheStrategy {
    return this.strategies[assetType] || this.strategies.html;
  }

  /**
   * Add custom cache rule
   */
  addRule(pattern: RegExp, strategy: CacheStrategy, description: string): void {
    this.rules.unshift({ pattern, strategy, description });
  }

  /**
   * Generate cache configuration for different servers
   */
  generateServerConfigs(): {
    nginx: string;
    apache: string;
    express: string;
    netlify: string;
  } {
    return {
      nginx: this.generateNginxConfig(),
      apache: this.generateApacheConfig(),
      express: this.generateExpressConfig(),
      netlify: this.generateNetlifyConfig()
    };
  }

  /**
   * Generate Nginx configuration
   */
  private generateNginxConfig(): string {
    return `
# Nginx caching configuration for React RAG App

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# Cache static assets
location ~* \\.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary "Accept-Encoding";
}

# Cache images
location ~* \\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$ {
    expires 30d;
    add_header Cache-Control "public";
    add_header Vary "Accept-Encoding";
}

# Cache fonts
location ~* \\.(woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public";
    add_header Access-Control-Allow-Origin "*";
}

# No cache for service worker
location = /sw.js {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# Short cache for HTML
location ~* \\.html$ {
    expires 0;
    add_header Cache-Control "public, max-age=0, must-revalidate";
}

# SPA fallback
location / {
    try_files $uri $uri/ /index.html;
    expires 0;
    add_header Cache-Control "public, max-age=0, must-revalidate";
}
`;
  }

  /**
   * Generate Apache configuration
   */
  private generateApacheConfig(): string {
    return `
# Apache caching configuration for React RAG App

# Enable mod_expires
<IfModule mod_expires.c>
    ExpiresActive on
    
    # JavaScript and CSS
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType text/css "access plus 1 year"
    
    # Images
    ExpiresByType image/png "access plus 30 days"
    ExpiresByType image/jpg "access plus 30 days"
    ExpiresByType image/jpeg "access plus 30 days"
    ExpiresByType image/gif "access plus 30 days"
    ExpiresByType image/svg+xml "access plus 30 days"
    ExpiresByType image/webp "access plus 30 days"
    
    # Fonts
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType application/font-woff "access plus 1 year"
    ExpiresByType application/font-woff2 "access plus 1 year"
    
    # HTML
    ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# Cache control headers
<IfModule mod_headers.c>
    # JavaScript and CSS
    <FilesMatch "\\.(js|css)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
    
    # Images
    <FilesMatch "\\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$">
        Header set Cache-Control "public, max-age=2592000"
    </FilesMatch>
    
    # Fonts
    <FilesMatch "\\.(woff|woff2|ttf|eot)$">
        Header set Cache-Control "public, max-age=31536000"
        Header set Access-Control-Allow-Origin "*"
    </FilesMatch>
    
    # Service worker
    <Files "sw.js">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </Files>
    
    # HTML
    <FilesMatch "\\.html$">
        Header set Cache-Control "public, max-age=0, must-revalidate"
    </FilesMatch>
</IfModule>
`;
  }

  /**
   * Generate Express.js configuration
   */
  private generateExpressConfig(): string {
    return `
// Express.js caching configuration for React RAG App

const express = require('express');
const path = require('path');
const app = express();

// Cache middleware
const cacheControl = (duration, options = {}) => {
  return (req, res, next) => {
    const { immutable = false, mustRevalidate = false } = options;
    
    let cacheHeader = \`public, max-age=\${duration}\`;
    if (immutable) cacheHeader += ', immutable';
    if (mustRevalidate) cacheHeader += ', must-revalidate';
    
    res.set('Cache-Control', cacheHeader);
    res.set('Vary', 'Accept-Encoding');
    next();
  };
};

// Static assets with long cache
app.use('/assets', cacheControl(31536000, { immutable: true }), express.static('dist/assets'));

// Images with medium cache
app.use('/images', cacheControl(2592000), express.static('dist/images'));

// Fonts with long cache
app.use('/fonts', cacheControl(31536000), express.static('dist/fonts'));

// Service worker with no cache
app.get('/sw.js', cacheControl(0, { mustRevalidate: true }), (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/sw.js'));
});

// SPA fallback with no cache
app.get('*', cacheControl(0, { mustRevalidate: true }), (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});
`;
  }

  /**
   * Generate Netlify configuration
   */
  private generateNetlifyConfig(): string {
    return `
# Netlify caching configuration for React RAG App

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    Vary = "Accept-Encoding"

[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=2592000"
    Vary = "Accept-Encoding"

[[headers]]
  for = "/fonts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
    Access-Control-Allow-Origin = "*"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
`;
  }

  /**
   * Validate cache configuration
   */
  validateConfig(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for conflicting rules
    const patterns = this.rules.map(rule => rule.pattern.source);
    const duplicates = patterns.filter((pattern, index) => patterns.indexOf(pattern) !== index);
    
    if (duplicates.length > 0) {
      issues.push(`Duplicate cache rules found: ${duplicates.join(', ')}`);
    }
    
    // Check for missing critical patterns
    const criticalPatterns = ['\\.js$', '\\.css$', '\\.html$', '/sw\\.js'];
    criticalPatterns.forEach(pattern => {
      if (!this.rules.some(rule => rule.pattern.source.includes(pattern))) {
        issues.push(`Missing cache rule for pattern: ${pattern}`);
      }
    });
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

/**
 * Cache busting utilities
 */
class CacheBuster {
  private version: string;
  private buildTime: number;

  constructor() {
    this.version = import.meta.env.VITE_APP_VERSION || '1.0.0';
    this.buildTime = Date.now();
  }

  /**
   * Add version parameter to URL for cache busting
   */
  addVersion(url: string, customVersion?: string): string {
    const version = customVersion || this.version;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${version}`;
  }

  /**
   * Add timestamp for immediate cache busting
   */
  addTimestamp(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  }

  /**
   * Get versioned asset URL
   */
  getVersionedUrl(path: string): string {
    // For production builds with hash-based filenames, no additional versioning needed
    if (import.meta.env.PROD && this.hasHashInFilename(path)) {
      return path;
    }

    return this.addVersion(path);
  }

  /**
   * Check if filename contains hash
   */
  private hasHashInFilename(path: string): boolean {
    return /\.[a-f0-9]{8,}\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/i.test(path);
  }

  /**
   * Force reload of cached resource
   */
  async forceReload(url: string): Promise<Response> {
    const bustUrl = this.addTimestamp(url);
    return fetch(bustUrl, { cache: 'no-cache' });
  }

  /**
   * Clear browser cache for specific patterns
   */
  async clearCache(patterns: string[] = ['**/*']): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();

        for (const request of requests) {
          const url = request.url;
          const shouldDelete = patterns.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
            return regex.test(url);
          });

          if (shouldDelete) {
            await cache.delete(request);
          }
        }
      }
    }
  }

  /**
   * Get current version info
   */
  getVersionInfo(): { version: string; buildTime: number; buildDate: string } {
    return {
      version: this.version,
      buildTime: this.buildTime,
      buildDate: new Date(this.buildTime).toISOString()
    };
  }
}

// Global cache buster instance
export const cacheBuster = new CacheBuster();

// Export utility functions
export const cacheUtils = {
  getCacheHeaders: (url: string) => cacheManager.getCacheHeaders(url),
  getStrategy: (assetType: string) => cacheManager.getStrategy(assetType),
  generateConfigs: () => cacheManager.generateServerConfigs(),
  validate: () => cacheManager.validateConfig(),
  addVersion: (url: string, version?: string) => cacheBuster.addVersion(url, version),
  getVersionedUrl: (path: string) => cacheBuster.getVersionedUrl(path),
  forceReload: (url: string) => cacheBuster.forceReload(url),
  clearCache: (patterns?: string[]) => cacheBuster.clearCache(patterns),
  getVersionInfo: () => cacheBuster.getVersionInfo()
};
