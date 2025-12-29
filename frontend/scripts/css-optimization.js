#!/usr/bin/env node

/**
 * CSS Optimization Script
 * Purges unused CSS, optimizes fonts, and generates critical CSS
 */

const fs = require('fs');
const path = require('path');
const { PurgeCSS } = require('purgecss');
const postcss = require('postcss');
const cssnano = require('cssnano');
const autoprefixer = require('autoprefixer');

class CSSOptimizer {
  constructor(options = {}) {
    this.buildDir = options.buildDir || path.join(__dirname, '../dist');
    this.srcDir = options.srcDir || path.join(__dirname, '../src');
    this.publicDir = options.publicDir || path.join(__dirname, '../public');
  }

  /**
   * Purge unused CSS from build files
   */
  async purgeUnusedCSS() {
    console.log('🧹 Purging unused CSS...');

    const cssFiles = this.findCSSFiles(this.buildDir);
    const contentFiles = this.findContentFiles(this.buildDir);

    for (const cssFile of cssFiles) {
      try {
        const purgeCSSResult = await new PurgeCSS().purge({
          content: contentFiles,
          css: [cssFile],
          safelist: {
            standard: [
              // Keep utility classes that might be added dynamically
              /^(bg|text|border|shadow|rounded|p|m|w|h|flex|grid)-/,
              // Keep state classes
              /^(hover|focus|active|disabled):/,
              // Keep responsive classes
              /^(sm|md|lg|xl|2xl):/,
              // Keep dark mode classes
              /^dark:/,
              // Keep animation classes
              /^animate-/,
              // Keep transition classes
              /^transition-/
            ],
            deep: [
              // Keep classes that might be in third-party components
              /react-/,
              /rc-/,
              /ant-/
            ],
            greedy: [
              // Keep classes with dynamic parts
              /^btn-/,
              /^alert-/,
              /^modal-/
            ]
          },
          keyframes: true,
          fontFace: true,
          variables: true
        });

        if (purgeCSSResult.length > 0) {
          const originalSize = fs.statSync(cssFile).size;
          const purgedCSS = purgeCSSResult[0].css;
          
          // Optimize the purged CSS
          const optimizedCSS = await this.optimizeCSS(purgedCSS);
          
          fs.writeFileSync(cssFile, optimizedCSS);
          
          const newSize = fs.statSync(cssFile).size;
          const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
          
          console.log(`✅ ${path.basename(cssFile)}: ${this.formatBytes(originalSize)} → ${this.formatBytes(newSize)} (${savings}% reduction)`);
        }
      } catch (error) {
        console.error(`❌ Error purging ${cssFile}:`, error.message);
      }
    }
  }

  /**
   * Optimize CSS with PostCSS plugins
   */
  async optimizeCSS(css) {
    const result = await postcss([
      autoprefixer({
        overrideBrowserslist: [
          '>0.2%',
          'not dead',
          'not op_mini all'
        ]
      }),
      cssnano({
        preset: ['default', {
          discardComments: {
            removeAll: true
          },
          normalizeWhitespace: true,
          mergeLonghand: true,
          mergeRules: true,
          minifySelectors: true,
          reduceIdents: false, // Keep animation names
          zindex: false // Don't optimize z-index values
        }]
      })
    ]).process(css, { from: undefined });

    return result.css;
  }

  /**
   * Extract and inline critical CSS
   */
  async extractCriticalCSS() {
    console.log('🎯 Extracting critical CSS...');

    const criticalCSSPath = path.join(this.srcDir, 'styles', 'critical.css');
    
    if (!fs.existsSync(criticalCSSPath)) {
      console.log('⚠️ Critical CSS file not found, skipping...');
      return;
    }

    const criticalCSS = fs.readFileSync(criticalCSSPath, 'utf8');
    const optimizedCriticalCSS = await this.optimizeCSS(criticalCSS);

    // Find HTML files in build directory
    const htmlFiles = this.findHTMLFiles(this.buildDir);

    for (const htmlFile of htmlFiles) {
      try {
        let html = fs.readFileSync(htmlFile, 'utf8');
        
        // Insert critical CSS in the head
        const criticalStyleTag = `<style>${optimizedCriticalCSS}</style>`;
        
        if (html.includes('</head>')) {
          html = html.replace('</head>', `${criticalStyleTag}</head>`);
          fs.writeFileSync(htmlFile, html);
          console.log(`✅ Inlined critical CSS in ${path.basename(htmlFile)}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${htmlFile}:`, error.message);
      }
    }
  }

  /**
   * Optimize font loading
   */
  async optimizeFonts() {
    console.log('🔤 Optimizing fonts...');

    const fontDir = path.join(this.publicDir, 'fonts');
    
    if (!fs.existsSync(fontDir)) {
      console.log('⚠️ Fonts directory not found, skipping...');
      return;
    }

    // Generate font preload links
    const fontFiles = fs.readdirSync(fontDir)
      .filter(file => file.endsWith('.woff2'))
      .map(file => `/fonts/${file}`);

    if (fontFiles.length === 0) {
      console.log('⚠️ No WOFF2 fonts found, skipping...');
      return;
    }

    // Add preload links to HTML files
    const htmlFiles = this.findHTMLFiles(this.buildDir);

    for (const htmlFile of htmlFiles) {
      try {
        let html = fs.readFileSync(htmlFile, 'utf8');
        
        const preloadLinks = fontFiles
          .map(font => `<link rel="preload" href="${font}" as="font" type="font/woff2" crossorigin>`)
          .join('\n    ');

        if (html.includes('</head>')) {
          html = html.replace('</head>', `    ${preloadLinks}\n</head>`);
          fs.writeFileSync(htmlFile, html);
          console.log(`✅ Added font preloads to ${path.basename(htmlFile)}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${htmlFile}:`, error.message);
      }
    }
  }

  /**
   * Generate CSS stats
   */
  async generateStats() {
    console.log('📊 Generating CSS stats...');

    const cssFiles = this.findCSSFiles(this.buildDir);
    const stats = {
      totalFiles: cssFiles.length,
      totalSize: 0,
      files: []
    };

    for (const cssFile of cssFiles) {
      const size = fs.statSync(cssFile).size;
      stats.totalSize += size;
      stats.files.push({
        name: path.basename(cssFile),
        size: size,
        sizeFormatted: this.formatBytes(size)
      });
    }

    stats.totalSizeFormatted = this.formatBytes(stats.totalSize);

    // Write stats to file
    const statsPath = path.join(this.buildDir, 'css-stats.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));

    console.log(`📈 CSS Stats:`);
    console.log(`   Total files: ${stats.totalFiles}`);
    console.log(`   Total size: ${stats.totalSizeFormatted}`);
    
    return stats;
  }

  /**
   * Find CSS files in directory
   */
  findCSSFiles(dir) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;

    const walk = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (item.endsWith('.css')) {
          files.push(fullPath);
        }
      }
    };

    walk(dir);
    return files;
  }

  /**
   * Find HTML files in directory
   */
  findHTMLFiles(dir) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;

    const walk = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (item.endsWith('.html')) {
          files.push(fullPath);
        }
      }
    };

    walk(dir);
    return files;
  }

  /**
   * Find content files for PurgeCSS
   */
  findContentFiles(dir) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;

    const walk = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (item.endsWith('.html') || item.endsWith('.js')) {
          files.push(fullPath);
        }
      }
    };

    walk(dir);
    return files;
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Run all optimizations
   */
  async optimize() {
    console.log('🚀 Starting CSS optimization...\n');

    try {
      await this.purgeUnusedCSS();
      await this.extractCriticalCSS();
      await this.optimizeFonts();
      await this.generateStats();
      
      console.log('\n✅ CSS optimization completed successfully!');
    } catch (error) {
      console.error('\n❌ CSS optimization failed:', error);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const optimizer = new CSSOptimizer();
  optimizer.optimize();
}

module.exports = CSSOptimizer;
