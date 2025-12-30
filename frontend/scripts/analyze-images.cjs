#!/usr/bin/env node

/**
 * Image Cleanup Analysis Script
 * Detects duplicate images (via MD5) and finds unused images
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ASSETS_DIR = path.join(__dirname, '../public/assets');
const SRC_DIR = path.join(__dirname, '../src');
const PUBLIC_DIR = path.join(__dirname, '../public');

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];
const SOURCE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss', '.html', '.json'];

/**
 * Compute MD5 hash of a file
 */
function getFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Get file size in KB
 */
function getFileSizeKB(filePath) {
  return (fs.statSync(filePath).size / 1024).toFixed(2);
}

/**
 * Recursively find all files with given extensions
 */
function findFiles(dir, extensions, files = []) {
  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip dist, node_modules, coverage
      if (!['dist', 'node_modules', 'coverage', '.git'].includes(item)) {
        findFiles(fullPath, extensions, files);
      }
    } else {
      const ext = path.extname(item).toLowerCase();
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  });

  return files;
}

/**
 * Find all image references in source code
 */
function findImageReferences(sourceFiles) {
  const references = new Set();

  // Patterns to match image references
  const patterns = [
    /['"`]([^'"`]*\.(png|jpg|jpeg|gif|svg|webp|ico))['"`]/gi,
    /src=["']([^"']*\.(png|jpg|jpeg|gif|svg|webp|ico))["']/gi,
    /url\(['"]?([^'"()]*\.(png|jpg|jpeg|gif|svg|webp|ico))['"]?\)/gi,
    /import.*from\s+['"]([^'"]*\.(png|jpg|jpeg|gif|svg|webp|ico))['"];?/gi,
  ];

  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');

      patterns.forEach(pattern => {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(content)) !== null) {
          // Extract the image path/name
          const imagePath = match[1] || match[0];
          // Normalize: get just the filename
          const fileName = path.basename(imagePath);
          references.add(fileName);
          // Also add the full relative path
          references.add(imagePath);
        }
      });
    } catch (e) {
      // Skip files that can't be read
    }
  });

  return references;
}

/**
 * Main analysis
 */
function analyze() {
  console.log('🔍 Image Cleanup Analysis\n');
  console.log('='.repeat(60));

  // Step 1: Find all images
  console.log('\n📁 Scanning for images...');
  const imageFiles = findFiles(path.join(__dirname, '../public'), IMAGE_EXTENSIONS);
  console.log(`   Found ${imageFiles.length} image files\n`);

  // Step 2: Compute hashes and find duplicates
  console.log('🔐 Computing file hashes...');
  const hashMap = new Map(); // hash -> [files]
  const fileInfo = new Map(); // file -> {hash, size}

  imageFiles.forEach(file => {
    const hash = getFileHash(file);
    const size = getFileSizeKB(file);

    fileInfo.set(file, { hash, size });

    if (!hashMap.has(hash)) {
      hashMap.set(hash, []);
    }
    hashMap.get(hash).push(file);
  });

  // Find duplicates (same hash, multiple files)
  const duplicates = [];
  hashMap.forEach((files, hash) => {
    if (files.length > 1) {
      duplicates.push({ hash, files });
    }
  });

  // Step 3: Find image references in source code
  console.log('📝 Scanning source code for image references...');
  const sourceFiles = findFiles(SRC_DIR, SOURCE_EXTENSIONS);
  const publicSourceFiles = findFiles(PUBLIC_DIR, ['.html', '.json']);
  const allSourceFiles = [...sourceFiles, ...publicSourceFiles];
  console.log(`   Scanned ${allSourceFiles.length} source files\n`);

  const references = findImageReferences(allSourceFiles);

  // Step 4: Find unused images
  const unusedImages = [];
  const usedImages = [];

  imageFiles.forEach(file => {
    const fileName = path.basename(file);
    const relativePath = file.replace(path.join(__dirname, '../public'), '').replace(/\\/g, '/');

    // Check if referenced by filename or path
    const isReferenced =
      references.has(fileName) ||
      references.has(relativePath) ||
      references.has(relativePath.substring(1)) || // without leading /
      [...references].some(ref => ref.includes(fileName));

    if (isReferenced) {
      usedImages.push(file);
    } else {
      unusedImages.push(file);
    }
  });

  // Generate Report
  console.log('='.repeat(60));
  console.log('📊 ANALYSIS REPORT');
  console.log('='.repeat(60));

  // Duplicate Report
  console.log('\n🔄 DUPLICATE FILES:');
  if (duplicates.length === 0) {
    console.log('   No exact duplicates found.');
  } else {
    let duplicateSavings = 0;
    duplicates.forEach((dup, i) => {
      console.log(`\n   Group ${i + 1} (${dup.files.length} files, same content):`);
      dup.files.forEach((file, j) => {
        const size = fileInfo.get(file).size;
        const relativePath = file.replace(path.join(__dirname, '../public'), '');
        console.log(`     ${j === 0 ? '✓ KEEP:' : '✗ DELETE:'} ${relativePath} (${size} KB)`);
        if (j > 0) duplicateSavings += parseFloat(size);
      });
    });
    console.log(`\n   💰 Potential savings from duplicates: ${duplicateSavings.toFixed(2)} KB`);
  }

  // Unused Images Report
  console.log('\n\n🗑️  POTENTIALLY UNUSED IMAGES:');
  if (unusedImages.length === 0) {
    console.log('   All images appear to be in use.');
  } else {
    let unusedSize = 0;
    unusedImages.forEach(file => {
      const size = parseFloat(fileInfo.get(file).size);
      const relativePath = file.replace(path.join(__dirname, '../public'), '');
      unusedSize += size;
      console.log(`   ${relativePath} (${size.toFixed(2)} KB)`);
    });
    console.log(`\n   💰 Potential savings from unused: ${(unusedSize / 1024).toFixed(2)} MB (${unusedSize.toFixed(2)} KB)`);
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📈 SUMMARY');
  console.log('='.repeat(60));
  console.log(`   Total images: ${imageFiles.length}`);
  console.log(`   Used images: ${usedImages.length}`);
  console.log(`   Unused images: ${unusedImages.length}`);
  console.log(`   Duplicate groups: ${duplicates.length}`);

  // Save detailed report as JSON
  const report = {
    timestamp: new Date().toISOString(),
    totalImages: imageFiles.length,
    usedImages: usedImages.length,
    unusedImages: unusedImages.map(f => ({
      path: f.replace(path.join(__dirname, '../public'), ''),
      sizeKB: parseFloat(fileInfo.get(f).size)
    })),
    duplicates: duplicates.map(d => ({
      hash: d.hash,
      files: d.files.map(f => ({
        path: f.replace(path.join(__dirname, '../public'), ''),
        sizeKB: parseFloat(fileInfo.get(f).size)
      }))
    }))
  };

  const reportPath = path.join(__dirname, 'image-cleanup-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);
}

analyze();
