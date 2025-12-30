#!/usr/bin/env node

/**
 * WebP Image Conversion Script
 * Converts PNG/JPG/JPEG images to WebP format with significant size reduction
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS_DIR = path.join(__dirname, '../public/assets');
const QUALITY = 80; // Good balance of quality and size

let stats = {
  processed: 0,
  skipped: 0,
  totalOriginalSize: 0,
  totalWebpSize: 0,
  errors: []
};

/**
 * Recursively find all image files
 */
function findImages(dir, files = []) {
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findImages(fullPath, files);
    } else {
      const ext = path.extname(item).toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        files.push(fullPath);
      }
    }
  });

  return files;
}

/**
 * Convert a single image to WebP
 */
async function convertToWebp(imagePath) {
  const ext = path.extname(imagePath).toLowerCase();
  const webpPath = imagePath.replace(/\.(png|jpe?g)$/i, '.webp');

  // Skip if WebP already exists and is newer
  if (fs.existsSync(webpPath)) {
    const originalStat = fs.statSync(imagePath);
    const webpStat = fs.statSync(webpPath);
    if (webpStat.mtime > originalStat.mtime) {
      console.log(`  ⏭️  Skipped (up-to-date): ${path.basename(imagePath)}`);
      stats.skipped++;
      return;
    }
  }

  try {
    const originalSize = fs.statSync(imagePath).size;

    await sharp(imagePath)
      .webp({ quality: QUALITY })
      .toFile(webpPath);

    const webpSize = fs.statSync(webpPath).size;
    const savings = ((1 - webpSize / originalSize) * 100).toFixed(1);

    stats.totalOriginalSize += originalSize;
    stats.totalWebpSize += webpSize;
    stats.processed++;

    console.log(`  ✅ ${path.basename(imagePath)} → ${path.basename(webpPath)} (${savings}% smaller)`);

  } catch (error) {
    console.error(`  ❌ Error: ${path.basename(imagePath)} - ${error.message}`);
    stats.errors.push({ file: imagePath, error: error.message });
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🖼️  WebP Image Conversion Script\n');
  console.log(`📁 Scanning: ${ASSETS_DIR}\n`);

  if (!fs.existsSync(ASSETS_DIR)) {
    console.error('❌ Assets directory not found!');
    process.exit(1);
  }

  const images = findImages(ASSETS_DIR);
  console.log(`📊 Found ${images.length} images to process\n`);

  console.log('🔄 Converting images to WebP...\n');

  for (const image of images) {
    await convertToWebp(image);
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📈 CONVERSION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Processed: ${stats.processed}`);
  console.log(`⏭️  Skipped: ${stats.skipped}`);
  console.log(`❌ Errors: ${stats.errors.length}`);
  console.log('');

  if (stats.processed > 0) {
    const originalMB = (stats.totalOriginalSize / (1024 * 1024)).toFixed(2);
    const webpMB = (stats.totalWebpSize / (1024 * 1024)).toFixed(2);
    const savingsMB = ((stats.totalOriginalSize - stats.totalWebpSize) / (1024 * 1024)).toFixed(2);
    const savingsPercent = ((1 - stats.totalWebpSize / stats.totalOriginalSize) * 100).toFixed(1);

    console.log(`📦 Original size: ${originalMB} MB`);
    console.log(`📦 WebP size: ${webpMB} MB`);
    console.log(`💰 Savings: ${savingsMB} MB (${savingsPercent}%)`);
  }

  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    stats.errors.forEach(e => console.log(`   - ${path.basename(e.file)}: ${e.error}`));
  }

  console.log('\n✨ Done! Now update component references from .png/.jpg to .webp');
}

main().catch(console.error);
