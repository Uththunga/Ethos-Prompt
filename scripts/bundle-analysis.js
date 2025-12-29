#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes bundle size, dependencies, and provides optimization recommendations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', ...options });
  } catch (error) {
    log(`Error executing: ${command}`, colors.red);
    throw error;
  }
}

function buildForAnalysis() {
  log('🔨 Building project for analysis...', colors.blue);
  
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  try {
    // Build with analysis enabled
    execCommand('npm run build', { 
      cwd: frontendDir, 
      stdio: 'inherit',
      env: { ...process.env, ANALYZE: 'true' }
    });
    
    log('✅ Build completed', colors.green);
  } catch (error) {
    log('❌ Build failed', colors.red);
    process.exit(1);
  }
}

function analyzeBundleSize() {
  log('📊 Analyzing bundle size...', colors.blue);
  
  const distDir = path.join(process.cwd(), 'frontend', 'dist');
  const assetsDir = path.join(distDir, 'assets');
  
  if (!fs.existsSync(assetsDir)) {
    log('❌ Assets directory not found', colors.red);
    return null;
  }

  const files = fs.readdirSync(assetsDir)
    .filter(file => file.endsWith('.js') || file.endsWith('.css'))
    .map(file => {
      const filePath = path.join(assetsDir, file);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath);
      const gzipSize = gzipSync(content).length;
      
      return {
        name: file,
        size: stats.size,
        gzipSize,
        type: file.endsWith('.js') ? 'JavaScript' : 'CSS',
      };
    })
    .sort((a, b) => b.size - a.size);

  return files;
}

function displayBundleAnalysis(files) {
  if (!files || files.length === 0) {
    log('⚠️  No bundle files found', colors.yellow);
    return;
  }

  log('\n📦 Bundle Analysis:', colors.bright);
  log('═'.repeat(80), colors.blue);
  
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const totalGzipSize = files.reduce((sum, file) => sum + file.gzipSize, 0);
  
  log(`Total Bundle Size: ${formatBytes(totalSize)} (${formatBytes(totalGzipSize)} gzipped)`, colors.cyan);
  log('');
  
  // Group by type
  const jsFiles = files.filter(f => f.type === 'JavaScript');
  const cssFiles = files.filter(f => f.type === 'CSS');
  
  if (jsFiles.length > 0) {
    log('📄 JavaScript Files:', colors.yellow);
    jsFiles.forEach(file => {
      const sizeColor = file.size > 500000 ? colors.red : file.size > 200000 ? colors.yellow : colors.green;
      log(`  ${file.name.padEnd(40)} ${sizeColor}${formatBytes(file.size).padStart(10)}${colors.reset} (${formatBytes(file.gzipSize)} gzipped)`);
    });
    log('');
  }
  
  if (cssFiles.length > 0) {
    log('🎨 CSS Files:', colors.yellow);
    cssFiles.forEach(file => {
      const sizeColor = file.size > 100000 ? colors.red : file.size > 50000 ? colors.yellow : colors.green;
      log(`  ${file.name.padEnd(40)} ${sizeColor}${formatBytes(file.size).padStart(10)}${colors.reset} (${formatBytes(file.gzipSize)} gzipped)`);
    });
    log('');
  }
}

function checkBundleBudget(files) {
  if (!files || files.length === 0) return;

  log('💰 Bundle Budget Analysis:', colors.blue);
  
  const budgets = {
    'Initial Bundle': { limit: 200000, type: 'main' },
    'Total JavaScript': { limit: 500000, type: 'js' },
    'Total CSS': { limit: 100000, type: 'css' },
  };

  const jsFiles = files.filter(f => f.type === 'JavaScript');
  const cssFiles = files.filter(f => f.type === 'CSS');
  const mainBundle = jsFiles.find(f => f.name.includes('index') || f.name.includes('main'));
  
  const sizes = {
    main: mainBundle ? mainBundle.gzipSize : 0,
    js: jsFiles.reduce((sum, f) => sum + f.gzipSize, 0),
    css: cssFiles.reduce((sum, f) => sum + f.gzipSize, 0),
  };

  Object.entries(budgets).forEach(([name, budget]) => {
    const currentSize = sizes[budget.type];
    const percentage = (currentSize / budget.limit) * 100;
    const status = percentage <= 100 ? '✅' : percentage <= 120 ? '⚠️' : '❌';
    const color = percentage <= 100 ? colors.green : percentage <= 120 ? colors.yellow : colors.red;
    
    log(`${status} ${name.padEnd(20)}: ${color}${formatBytes(currentSize)}${colors.reset} / ${formatBytes(budget.limit)} (${percentage.toFixed(1)}%)`);
  });
}

function analyzeChunks() {
  log('\n🧩 Chunk Analysis:', colors.blue);
  
  const frontendDir = path.join(process.cwd(), 'frontend');
  const packageJsonPath = path.join(frontendDir, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log('⚠️  Package.json not found', colors.yellow);
    return;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = Object.keys(packageJson.dependencies || {});
    const devDependencies = Object.keys(packageJson.devDependencies || {});
    
    log(`📦 Dependencies: ${dependencies.length}`, colors.cyan);
    log(`🔧 Dev Dependencies: ${devDependencies.length}`, colors.cyan);
    
    // Identify large dependencies
    const largeDependencies = [
      'react', 'react-dom', 'firebase', '@tanstack/react-query',
      'recharts', 'framer-motion', '@radix-ui', 'lucide-react'
    ];
    
    const foundLargeDeps = dependencies.filter(dep => 
      largeDependencies.some(large => dep.includes(large))
    );
    
    if (foundLargeDeps.length > 0) {
      log('\n📊 Large Dependencies Found:', colors.yellow);
      foundLargeDeps.forEach(dep => {
        log(`  • ${dep}`, colors.cyan);
      });
      log('\nConsider code splitting for these dependencies', colors.yellow);
    }
    
  } catch (error) {
    log('❌ Failed to analyze dependencies', colors.red);
  }
}

function generateOptimizationRecommendations(files) {
  log('\n💡 Optimization Recommendations:', colors.blue);
  
  if (!files || files.length === 0) {
    log('⚠️  No files to analyze', colors.yellow);
    return;
  }

  const recommendations = [];
  
  // Check for large JavaScript files
  const largeJsFiles = files.filter(f => f.type === 'JavaScript' && f.size > 300000);
  if (largeJsFiles.length > 0) {
    recommendations.push('🔄 Consider code splitting for large JavaScript files');
    recommendations.push('   Use dynamic imports for route-based splitting');
  }
  
  // Check for large CSS files
  const largeCssFiles = files.filter(f => f.type === 'CSS' && f.size > 80000);
  if (largeCssFiles.length > 0) {
    recommendations.push('🎨 Consider CSS optimization for large stylesheets');
    recommendations.push('   Use PurgeCSS or similar tools to remove unused styles');
  }
  
  // Check compression ratio
  const avgCompressionRatio = files.reduce((sum, f) => sum + (f.gzipSize / f.size), 0) / files.length;
  if (avgCompressionRatio > 0.4) {
    recommendations.push('📦 Consider better compression or minification');
    recommendations.push('   Current compression ratio could be improved');
  }
  
  // General recommendations
  recommendations.push('⚡ Enable tree shaking for unused code elimination');
  recommendations.push('🔗 Use preload/prefetch for critical resources');
  recommendations.push('📱 Implement service worker for caching');
  recommendations.push('🖼️  Optimize images and use modern formats (WebP, AVIF)');
  
  if (recommendations.length > 0) {
    recommendations.forEach(rec => log(rec, colors.cyan));
  } else {
    log('✅ Bundle is well optimized!', colors.green);
  }
}

function main() {
  log('🚀 Starting bundle analysis...', colors.bright);
  
  try {
    buildForAnalysis();
    const files = analyzeBundleSize();
    
    if (files) {
      displayBundleAnalysis(files);
      checkBundleBudget(files);
      analyzeChunks();
      generateOptimizationRecommendations(files);
    }
    
    log('\n✅ Bundle analysis complete!', colors.green);
    log('\n📋 Next steps:', colors.blue);
    log('• Review large files and consider code splitting', colors.cyan);
    log('• Check for unused dependencies', colors.cyan);
    log('• Implement recommended optimizations', colors.cyan);
    log('• Set up bundle size monitoring in CI/CD', colors.cyan);
    
  } catch (error) {
    log(`❌ Bundle analysis failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the analysis if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
