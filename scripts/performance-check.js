#!/usr/bin/env node

/**
 * Performance Check Script
 * Analyzes build output and provides performance recommendations
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Performance Analysis Starting...');

// Check if build exists
const buildDir = path.join(__dirname, '../frontend/dist');
if (!fs.existsSync(buildDir)) {
  console.log('❌ Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Analyze bundle sizes
function analyzeBundleSizes() {
  console.log('\n📦 Bundle Size Analysis:');
  
  const assetsDir = path.join(buildDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.log('❌ Assets directory not found');
    return;
  }

  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter(f => f.endsWith('.js'));
  const cssFiles = files.filter(f => f.endsWith('.css'));

  let totalJSSize = 0;
  let totalCSSSize = 0;

  console.log('\n📄 JavaScript Files:');
  jsFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    totalJSSize += stats.size;
    
    const status = stats.size > 500000 ? '⚠️' : '✅';
    console.log(`  ${status} ${file}: ${sizeKB} KB`);
  });

  console.log('\n🎨 CSS Files:');
  cssFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    totalCSSSize += stats.size;
    
    const status = stats.size > 100000 ? '⚠️' : '✅';
    console.log(`  ${status} ${file}: ${sizeKB} KB`);
  });

  console.log('\n📊 Summary:');
  console.log(`  Total JS: ${(totalJSSize / 1024).toFixed(2)} KB`);
  console.log(`  Total CSS: ${(totalCSSSize / 1024).toFixed(2)} KB`);
  console.log(`  Total Assets: ${((totalJSSize + totalCSSSize) / 1024).toFixed(2)} KB`);

  // Performance recommendations
  console.log('\n💡 Recommendations:');
  if (totalJSSize > 1000000) {
    console.log('  ⚠️  Consider code splitting for JS bundles > 1MB');
  }
  if (totalCSSSize > 200000) {
    console.log('  ⚠️  Consider CSS optimization for files > 200KB');
  }
  if (totalJSSize + totalCSSSize < 500000) {
    console.log('  ✅ Excellent bundle size optimization!');
  }
}

// Check for performance best practices
function checkPerformanceBestPractices() {
  console.log('\n🔍 Performance Best Practices Check:');

  const checks = [
    {
      name: 'Service Worker',
      check: () => fs.existsSync(path.join(buildDir, 'sw.js')),
      recommendation: 'Add service worker for caching'
    },
    {
      name: 'Gzip Compression',
      check: () => files.some(f => f.endsWith('.gz')),
      recommendation: 'Enable gzip compression in build'
    },
    {
      name: 'Source Maps (Production)',
      check: () => !files.some(f => f.endsWith('.map')),
      recommendation: 'Disable source maps in production'
    },
    {
      name: 'Asset Optimization',
      check: () => fs.existsSync(path.join(buildDir, 'assets')),
      recommendation: 'Ensure assets are properly optimized'
    }
  ];

  const files = getAllFiles(buildDir);
  
  checks.forEach(({ name, check, recommendation }) => {
    const passed = check();
    console.log(`  ${passed ? '✅' : '❌'} ${name}`);
    if (!passed) {
      console.log(`    💡 ${recommendation}`);
    }
  });
}

// Get all files recursively
function getAllFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getAllFiles(fullPath));
    } else {
      files.push(item);
    }
  });
  
  return files;
}

// Check for unused dependencies
function checkUnusedDependencies() {
  console.log('\n📦 Dependency Analysis:');
  
  const packageJsonPath = path.join(__dirname, '../frontend/package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ package.json not found');
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});

  console.log(`  📊 Production dependencies: ${dependencies.length}`);
  console.log(`  🔧 Development dependencies: ${devDependencies.length}`);

  // Check for large dependencies
  const largeDeps = [
    'lodash', 'moment', 'axios', 'jquery', 'bootstrap'
  ];

  const foundLargeDeps = dependencies.filter(dep => 
    largeDeps.some(large => dep.includes(large))
  );

  if (foundLargeDeps.length > 0) {
    console.log('  ⚠️  Large dependencies found:');
    foundLargeDeps.forEach(dep => {
      console.log(`    - ${dep} (consider lighter alternatives)`);
    });
  } else {
    console.log('  ✅ No unnecessarily large dependencies detected');
  }
}

// Performance metrics simulation
function simulatePerformanceMetrics() {
  console.log('\n⚡ Performance Metrics Simulation:');
  
  const indexPath = path.join(buildDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log('❌ index.html not found');
    return;
  }

  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Check for performance optimizations
  const optimizations = [
    {
      name: 'Preload Critical Resources',
      check: indexContent.includes('rel="preload"'),
      impact: 'High'
    },
    {
      name: 'DNS Prefetch',
      check: indexContent.includes('rel="dns-prefetch"'),
      impact: 'Medium'
    },
    {
      name: 'Meta Viewport',
      check: indexContent.includes('name="viewport"'),
      impact: 'High'
    },
    {
      name: 'Meta Description',
      check: indexContent.includes('name="description"'),
      impact: 'Medium'
    }
  ];

  optimizations.forEach(({ name, check, impact }) => {
    console.log(`  ${check ? '✅' : '❌'} ${name} (${impact} impact)`);
  });

  // Estimate load times
  const assetsDir = path.join(buildDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    const totalSize = files.reduce((sum, file) => {
      const filePath = path.join(assetsDir, file);
      return sum + fs.statSync(filePath).size;
    }, 0);

    const estimatedLoadTime3G = (totalSize / (1.6 * 1024 * 1024)) * 8; // 1.6 Mbps 3G
    const estimatedLoadTime4G = (totalSize / (10 * 1024 * 1024)) * 8; // 10 Mbps 4G

    console.log('\n📶 Estimated Load Times:');
    console.log(`  3G Connection: ${estimatedLoadTime3G.toFixed(2)} seconds`);
    console.log(`  4G Connection: ${estimatedLoadTime4G.toFixed(2)} seconds`);

    if (estimatedLoadTime3G > 3) {
      console.log('  ⚠️  Consider optimizing for slower connections');
    } else {
      console.log('  ✅ Good performance on mobile networks');
    }
  }
}

// Generate performance report
function generatePerformanceReport() {
  console.log('\n📋 Performance Report Summary:');
  console.log('================================');
  
  const reportData = {
    timestamp: new Date().toISOString(),
    buildSize: 'Analyzed above',
    recommendations: [
      'Enable gzip compression',
      'Implement service worker',
      'Optimize images',
      'Use CDN for static assets',
      'Implement lazy loading',
      'Monitor Core Web Vitals'
    ]
  };

  const reportPath = path.join(__dirname, '../performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(`📄 Detailed report saved to: ${reportPath}`);
  console.log('\n🎯 Next Steps:');
  console.log('1. Run lighthouse audit');
  console.log('2. Test on real devices');
  console.log('3. Monitor production metrics');
  console.log('4. Set up performance budgets');
}

// Main execution
function main() {
  try {
    analyzeBundleSizes();
    checkPerformanceBestPractices();
    checkUnusedDependencies();
    simulatePerformanceMetrics();
    generatePerformanceReport();
    
    console.log('\n✅ Performance analysis completed!');
  } catch (error) {
    console.error('❌ Error during performance analysis:', error.message);
    process.exit(1);
  }
}

main();
