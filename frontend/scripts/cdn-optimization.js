#!/usr/bin/env node

/**
 * CDN Optimization Script
 * Configures CDN settings, cache policies, and asset optimization
 */

const fs = require('fs');
const path = require('path');

class CDNOptimizer {
  constructor(options = {}) {
    this.buildDir = options.buildDir || path.join(__dirname, '../dist');
    this.publicDir = options.publicDir || path.join(__dirname, '../public');
    this.cdnConfig = {
      provider: options.provider || 'cloudflare', // cloudflare, aws, azure, gcp
      domain: options.domain || 'cdn.example.com',
      regions: options.regions || ['us-east-1', 'eu-west-1', 'ap-southeast-1']
    };
  }

  /**
   * Generate CDN configuration files
   */
  generateCDNConfig() {
    console.log('🌐 Generating CDN configuration...');

    // Generate Cloudflare configuration
    this.generateCloudflareConfig();
    
    // Generate AWS CloudFront configuration
    this.generateCloudFrontConfig();
    
    // Generate cache rules
    this.generateCacheRules();
    
    // Generate asset manifest
    this.generateAssetManifest();
  }

  /**
   * Generate Cloudflare configuration
   */
  generateCloudflareConfig() {
    const config = {
      rules: [
        {
          expression: '(http.request.uri.path matches "^/assets/.*\\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$")',
          action: 'cache',
          cache_level: 'cache_everything',
          edge_cache_ttl: 31536000, // 1 year
          browser_cache_ttl: 31536000
        },
        {
          expression: '(http.request.uri.path matches "^/api/.*")',
          action: 'bypass_cache'
        },
        {
          expression: '(http.request.uri.path eq "/" or http.request.uri.path matches "^/.*\\.html$")',
          action: 'cache',
          cache_level: 'bypass',
          edge_cache_ttl: 0,
          browser_cache_ttl: 0
        }
      ],
      page_rules: [
        {
          targets: [
            {
              target: 'url',
              constraint: {
                operator: 'matches',
                value: `${this.cdnConfig.domain}/assets/*`
              }
            }
          ],
          actions: [
            {
              id: 'cache_level',
              value: 'cache_everything'
            },
            {
              id: 'edge_cache_ttl',
              value: 31536000
            },
            {
              id: 'browser_cache_ttl',
              value: 31536000
            }
          ]
        }
      ],
      transform_rules: [
        {
          expression: '(http.request.uri.path matches "^/assets/.*\\.(js|css)$")',
          action: 'compress',
          algorithms: ['gzip', 'brotli']
        }
      ]
    };

    fs.writeFileSync(
      path.join(this.buildDir, 'cloudflare-config.json'),
      JSON.stringify(config, null, 2)
    );

    console.log('✅ Cloudflare configuration generated');
  }

  /**
   * Generate AWS CloudFront configuration
   */
  generateCloudFrontConfig() {
    const config = {
      DistributionConfig: {
        CallerReference: `rag-app-${Date.now()}`,
        Comment: 'RAG Application CDN Distribution',
        DefaultRootObject: 'index.html',
        Origins: {
          Quantity: 1,
          Items: [
            {
              Id: 'origin1',
              DomainName: 'your-app.netlify.app',
              CustomOriginConfig: {
                HTTPPort: 443,
                HTTPSPort: 443,
                OriginProtocolPolicy: 'https-only',
                OriginSslProtocols: {
                  Quantity: 1,
                  Items: ['TLSv1.2']
                }
              }
            }
          ]
        },
        DefaultCacheBehavior: {
          TargetOriginId: 'origin1',
          ViewerProtocolPolicy: 'redirect-to-https',
          CachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // Managed-CachingDisabled
          OriginRequestPolicyId: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf', // Managed-CORS-S3Origin
          ResponseHeadersPolicyId: '67f7725c-6f97-4210-82d7-5512b31e9d03' // Managed-SecurityHeadersPolicy
        },
        CacheBehaviors: {
          Quantity: 3,
          Items: [
            {
              PathPattern: '/assets/*',
              TargetOriginId: 'origin1',
              ViewerProtocolPolicy: 'redirect-to-https',
              CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // Managed-CachingOptimized
              Compress: true,
              TTL: {
                DefaultTTL: 31536000,
                MaxTTL: 31536000
              }
            },
            {
              PathPattern: '/api/*',
              TargetOriginId: 'origin1',
              ViewerProtocolPolicy: 'redirect-to-https',
              CachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // Managed-CachingDisabled
              TTL: {
                DefaultTTL: 0,
                MaxTTL: 0
              }
            },
            {
              PathPattern: '*.html',
              TargetOriginId: 'origin1',
              ViewerProtocolPolicy: 'redirect-to-https',
              CachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // Managed-CachingDisabled
              TTL: {
                DefaultTTL: 0,
                MaxTTL: 86400
              }
            }
          ]
        },
        CustomErrorResponses: {
          Quantity: 1,
          Items: [
            {
              ErrorCode: 404,
              ResponsePagePath: '/index.html',
              ResponseCode: '200',
              ErrorCachingMinTTL: 300
            }
          ]
        },
        Enabled: true,
        PriceClass: 'PriceClass_100'
      }
    };

    fs.writeFileSync(
      path.join(this.buildDir, 'cloudfront-config.json'),
      JSON.stringify(config, null, 2)
    );

    console.log('✅ CloudFront configuration generated');
  }

  /**
   * Generate cache rules for different CDN providers
   */
  generateCacheRules() {
    const cacheRules = {
      static_assets: {
        pattern: '/assets/*',
        cache_control: 'public, max-age=31536000, immutable',
        cdn_cache: '1y',
        compression: ['gzip', 'brotli']
      },
      images: {
        pattern: '*.{png,jpg,jpeg,gif,svg,webp,avif}',
        cache_control: 'public, max-age=2592000',
        cdn_cache: '30d',
        compression: ['gzip'],
        optimization: {
          auto_webp: true,
          quality: 85,
          progressive: true
        }
      },
      fonts: {
        pattern: '*.{woff,woff2,ttf,eot}',
        cache_control: 'public, max-age=31536000, immutable',
        cdn_cache: '1y',
        cors: true
      },
      html: {
        pattern: '*.html',
        cache_control: 'public, max-age=0, must-revalidate',
        cdn_cache: '0',
        compression: ['gzip', 'brotli']
      },
      api: {
        pattern: '/api/*',
        cache_control: 'no-cache, no-store, must-revalidate',
        cdn_cache: '0'
      },
      service_worker: {
        pattern: '/sw.js',
        cache_control: 'no-cache, no-store, must-revalidate',
        cdn_cache: '0'
      }
    };

    fs.writeFileSync(
      path.join(this.buildDir, 'cache-rules.json'),
      JSON.stringify(cacheRules, null, 2)
    );

    console.log('✅ Cache rules generated');
  }

  /**
   * Generate asset manifest for CDN
   */
  generateAssetManifest() {
    const manifest = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      cdn_base_url: `https://${this.cdnConfig.domain}`,
      assets: {},
      preload: [],
      prefetch: []
    };

    // Scan build directory for assets
    const scanDirectory = (dir, basePath = '') => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath, relativePath);
        } else {
          const ext = path.extname(item).toLowerCase();
          const size = stat.size;
          
          manifest.assets[relativePath] = {
            size,
            hash: this.generateFileHash(fullPath),
            type: this.getAssetType(ext),
            critical: this.isCriticalAsset(relativePath),
            preload: this.shouldPreload(relativePath),
            prefetch: this.shouldPrefetch(relativePath)
          };

          // Add to preload/prefetch arrays
          if (manifest.assets[relativePath].preload) {
            manifest.preload.push(relativePath);
          }
          if (manifest.assets[relativePath].prefetch) {
            manifest.prefetch.push(relativePath);
          }
        }
      });
    };

    if (fs.existsSync(this.buildDir)) {
      scanDirectory(this.buildDir);
    }

    fs.writeFileSync(
      path.join(this.buildDir, 'asset-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    console.log('✅ Asset manifest generated');
    console.log(`📊 Total assets: ${Object.keys(manifest.assets).length}`);
    console.log(`🚀 Preload assets: ${manifest.preload.length}`);
    console.log(`📦 Prefetch assets: ${manifest.prefetch.length}`);
  }

  /**
   * Generate file hash for cache busting
   */
  generateFileHash(filePath) {
    const crypto = require('crypto');
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex').slice(0, 8);
  }

  /**
   * Get asset type based on extension
   */
  getAssetType(ext) {
    const types = {
      '.js': 'script',
      '.css': 'style',
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.gif': 'image',
      '.svg': 'image',
      '.webp': 'image',
      '.avif': 'image',
      '.woff': 'font',
      '.woff2': 'font',
      '.ttf': 'font',
      '.eot': 'font',
      '.html': 'document',
      '.json': 'data'
    };
    return types[ext] || 'other';
  }

  /**
   * Check if asset is critical for initial page load
   */
  isCriticalAsset(path) {
    return path.includes('index') || 
           path.includes('main') || 
           path.includes('vendor') ||
           path.includes('critical');
  }

  /**
   * Check if asset should be preloaded
   */
  shouldPreload(path) {
    return path.includes('critical') || 
           (path.includes('main') && (path.endsWith('.js') || path.endsWith('.css')));
  }

  /**
   * Check if asset should be prefetched
   */
  shouldPrefetch(path) {
    return path.includes('chunk') && !this.isCriticalAsset(path);
  }

  /**
   * Generate deployment script
   */
  generateDeploymentScript() {
    const script = `#!/bin/bash

# CDN Deployment Script for RAG Application

echo "🚀 Starting CDN deployment..."

# Upload assets to CDN
echo "📦 Uploading assets..."

# Example for AWS S3 + CloudFront
if [ "$CDN_PROVIDER" = "aws" ]; then
    aws s3 sync dist/ s3://$S3_BUCKET --delete --cache-control "public, max-age=31536000" --exclude "*.html"
    aws s3 sync dist/ s3://$S3_BUCKET --delete --cache-control "public, max-age=0, must-revalidate" --include "*.html"
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
fi

# Example for Cloudflare
if [ "$CDN_PROVIDER" = "cloudflare" ]; then
    # Upload files using Cloudflare API or wrangler
    npx wrangler pages publish dist --project-name rag-app
fi

echo "✅ CDN deployment completed!"
`;

    fs.writeFileSync(
      path.join(this.buildDir, 'deploy-cdn.sh'),
      script
    );

    // Make script executable
    fs.chmodSync(path.join(this.buildDir, 'deploy-cdn.sh'), '755');

    console.log('✅ Deployment script generated');
  }

  /**
   * Run all CDN optimizations
   */
  optimize() {
    console.log('🌐 Starting CDN optimization...\n');

    try {
      this.generateCDNConfig();
      this.generateDeploymentScript();
      
      console.log('\n✅ CDN optimization completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Configure your CDN provider using the generated config files');
      console.log('2. Update your environment variables with CDN URLs');
      console.log('3. Run the deployment script to upload assets');
      console.log('4. Test the CDN configuration');
      
    } catch (error) {
      console.error('\n❌ CDN optimization failed:', error);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const optimizer = new CDNOptimizer();
  optimizer.optimize();
}

module.exports = CDNOptimizer;
