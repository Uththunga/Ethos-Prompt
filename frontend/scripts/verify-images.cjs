#!/usr/bin/env node

/**
 * Deep Verification Script - Check all image references exist
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const PUBLIC_DIR = path.join(__dirname, '../public');

const SOURCE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss', '.html'];

// Get all existing images in public folder
function getExistingImages(dir, images = new Set()) {
  if (!fs.existsSync(dir)) return images;

  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !['dist', 'node_modules'].includes(item)) {
      getExistingImages(fullPath, images);
    } else if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].includes(ext)) {
        // Store relative path from public
        const relativePath = fullPath.replace(PUBLIC_DIR, '').replace(/\\/g, '/');
        images.add(relativePath);
        images.add(item); // Also add just filename
      }
    }
  });
  return images;
}

// Find all source files
function findSourceFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !['node_modules', 'dist', '.git'].includes(item)) {
      findSourceFiles(fullPath, files);
    } else if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();
      if (SOURCE_EXTENSIONS.includes(ext)) {
        files.push(fullPath);
      }
    }
  });
  return files;
}

// Extract image references from source files
function extractImageRefs(sourceFiles) {
  const refs = [];

  const patterns = [
    // src="..." or src='...' or src={`...`}
    /src=["'`]([^"'`]*\.(png|jpg|jpeg|gif|svg|webp|ico))/gi,
    // href="..." for favicons
    /href=["']([^"']*\.(png|jpg|jpeg|gif|svg|webp|ico))/gi,
    // url(...) in CSS
    /url\(['"]?([^'"()]*\.(png|jpg|jpeg|gif|svg|webp|ico))/gi,
    // import from
    /from\s+['"]([^'"]*\.(png|jpg|jpeg|gif|svg|webp|ico))/gi,
    // String paths like "assets/marketing/images/..."
    /["'`]([\/]?assets\/[^"'`]*\.(png|jpg|jpeg|gif|svg|webp|ico))/gi,
    // baseUrl + path patterns
    /baseUrl\}([^"'`]*\.(png|jpg|jpeg|gif|svg|webp|ico))/gi,
  ];

  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, lineNum) => {
        patterns.forEach(pattern => {
          const regex = new RegExp(pattern.source, pattern.flags);
          let match;
          while ((match = regex.exec(line)) !== null) {
            const imagePath = match[1];
            if (imagePath && !imagePath.includes('${') && !imagePath.includes('http')) {
              refs.push({
                file: file.replace(path.join(__dirname, '..'), ''),
                line: lineNum + 1,
                imagePath: imagePath,
                fullLine: line.trim().substring(0, 100)
              });
            }
          }
        });
      });
    } catch (e) {
      // Skip unreadable files
    }
  });

  return refs;
}

// Check if image reference exists
function checkImageExists(imagePath, existingImages) {
  // Normalize path
  let normalized = imagePath.replace(/\\/g, '/');
  if (!normalized.startsWith('/')) normalized = '/' + normalized;

  // Direct match
  if (existingImages.has(normalized)) return true;

  // Match just filename
  const fileName = path.basename(normalized);
  if (existingImages.has(fileName)) return true;

  // Check variations
  const variations = [
    normalized,
    normalized.replace(/^\//, ''),
    '/assets' + normalized.replace('/assets', ''),
  ];

  for (const v of variations) {
    if (existingImages.has(v)) return true;
  }

  return false;
}

// Main
function verify() {
  console.log('🔍 Deep Dive Image Reference Verification\n');
  console.log('='.repeat(60));

  // Get existing images
  console.log('\n📁 Scanning existing images...');
  const existingImages = getExistingImages(PUBLIC_DIR);
  console.log(`   Found ${existingImages.size} image files\n`);

  // Get source files
  console.log('📝 Scanning source code...');
  const sourceFiles = findSourceFiles(SRC_DIR);
  const htmlFiles = findSourceFiles(path.join(__dirname, '..'), []).filter(f => f.endsWith('.html'));
  const allSourceFiles = [...sourceFiles, ...htmlFiles];
  console.log(`   Found ${allSourceFiles.length} source files\n`);

  // Extract references
  console.log('🔗 Extracting image references...');
  const refs = extractImageRefs(allSourceFiles);
  console.log(`   Found ${refs.length} image references\n`);

  // Check each reference
  console.log('='.repeat(60));
  console.log('📊 VERIFICATION RESULTS');
  console.log('='.repeat(60));

  const missing = [];
  const valid = [];

  refs.forEach(ref => {
    if (checkImageExists(ref.imagePath, existingImages)) {
      valid.push(ref);
    } else {
      missing.push(ref);
    }
  });

  console.log(`\n✅ Valid references: ${valid.length}`);
  console.log(`❌ Missing/broken: ${missing.length}`);

  if (missing.length > 0) {
    console.log('\n🚨 MISSING IMAGES:');
    console.log('-'.repeat(60));

    // Group by image
    const byImage = {};
    missing.forEach(m => {
      if (!byImage[m.imagePath]) byImage[m.imagePath] = [];
      byImage[m.imagePath].push(m);
    });

    Object.entries(byImage).forEach(([img, refs]) => {
      console.log(`\n   ❌ ${img}`);
      refs.forEach(r => {
        console.log(`      └─ ${r.file}:${r.line}`);
      });
    });
  }

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    validCount: valid.length,
    missingCount: missing.length,
    missing: missing.map(m => ({
      image: m.imagePath,
      file: m.file,
      line: m.line
    }))
  };

  fs.writeFileSync(
    path.join(__dirname, 'verification-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n' + '='.repeat(60));
  if (missing.length === 0) {
    console.log('✅ ALL IMAGE REFERENCES ARE VALID!');
  } else {
    console.log(`⚠️  ${missing.length} broken references need attention`);
  }
  console.log('='.repeat(60));
}

verify();
