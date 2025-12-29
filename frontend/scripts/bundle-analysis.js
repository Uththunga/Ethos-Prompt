#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes the current bundle size and identifies optimization opportunities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DIST_DIR = path.join(__dirname, '../dist');
const TARGET_SIZE_KB = 500;

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundle() {
  console.log('🔍 Bundle Size Analysis');
  console.log('========================');

  const assetsDir = path.join(DIST_DIR, 'assets');

  if (!fs.existsSync(assetsDir)) {
    console.error('❌ Assets directory not found. Please run build first.');
    return;
  }

  // Scan both assets root and js subdirectory
  const files = fs.readdirSync(assetsDir);
  const jsDir = path.join(assetsDir, 'js');

  let jsFiles = files.filter(f => f.endsWith('.js') && !f.includes('.gz') && !f.includes('.br'));
  const cssFiles = files.filter(f => f.endsWith('.css') && !f.includes('.gz') && !f.includes('.br'));

  // Add JS files from js subdirectory
  if (fs.existsSync(jsDir)) {
    const jsSubFiles = fs.readdirSync(jsDir)
      .filter(f => f.endsWith('.js') && !f.includes('.gz') && !f.includes('.br'))
      .map(f => `js/${f}`);
    jsFiles = jsFiles.concat(jsSubFiles);
  }
  
  let totalSize = 0;
  let jsSize = 0;
  let cssSize = 0;
  
  console.log('\n📦 JavaScript Files:');
  console.log('--------------------');
  
  jsFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const size = getFileSize(filePath);
    const sizeKB = Math.round(size / 1024);

    jsSize += size;
    totalSize += size;

    let status = '✅';
    if (sizeKB > 500) status = '❌';
    else if (sizeKB > 200) status = '⚠️';

    const displayName = file.startsWith('js/') ? file.substring(3) : file;
    console.log(`${status} ${displayName}: ${formatBytes(size)} (${sizeKB} KB)`);
  });
  
  console.log('\n🎨 CSS Files:');
  console.log('-------------');
  
  cssFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const size = getFileSize(filePath);
    const sizeKB = Math.round(size / 1024);
    
    cssSize += size;
    totalSize += size;
    
    let status = '✅';
    if (sizeKB > 100) status = '⚠️';
    
    console.log(`${status} ${file}: ${formatBytes(size)} (${sizeKB} KB)`);
  });
  
  console.log('\n📊 Summary:');
  console.log('-----------');
  console.log(`Total Bundle Size: ${formatBytes(totalSize)} (${Math.round(totalSize / 1024)} KB)`);
  console.log(`JavaScript: ${formatBytes(jsSize)} (${Math.round(jsSize / 1024)} KB)`);
  console.log(`CSS: ${formatBytes(cssSize)} (${Math.round(cssSize / 1024)} KB)`);
  
  const totalKB = Math.round(totalSize / 1024);
  const targetStatus = totalKB <= TARGET_SIZE_KB ? '✅ PASS' : '❌ FAIL';
  console.log(`Target (${TARGET_SIZE_KB} KB): ${targetStatus}`);
  
  // Identify optimization opportunities
  console.log('\n🎯 Optimization Opportunities:');
  console.log('------------------------------');
  
  const largeFiles = jsFiles.filter(file => {
    const size = getFileSize(path.join(assetsDir, file));
    return size > 200 * 1024; // > 200KB
  });
  
  if (largeFiles.length > 0) {
    console.log('📦 Large files that need code splitting:');
    largeFiles.forEach(file => {
      const size = getFileSize(path.join(assetsDir, file));
      console.log(`  - ${file}: ${formatBytes(size)}`);
    });
  }
  
  // Check for vendor bundle
  const vendorFile = jsFiles.find(f => f.includes('vendor'));
  if (vendorFile) {
    const vendorSize = getFileSize(path.join(assetsDir, vendorFile));
    const vendorKB = Math.round(vendorSize / 1024);
    if (vendorKB > 300) {
      console.log(`📚 Vendor bundle is large (${vendorKB} KB) - consider splitting`);
    }
  }
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    totalSize: totalSize,
    totalKB: totalKB,
    jsSize: jsSize,
    cssSize: cssSize,
    targetKB: TARGET_SIZE_KB,
    withinTarget: totalKB <= TARGET_SIZE_KB,
    files: jsFiles.concat(cssFiles).map(file => ({
      name: file,
      size: getFileSize(path.join(assetsDir, file)),
      type: file.endsWith('.js') ? 'javascript' : 'css'
    }))
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../bundle-analysis-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n✅ Analysis complete! Report saved to bundle-analysis-report.json');
  
  return report;
}

// Always run the analysis
analyzeBundle();

export { analyzeBundle };
