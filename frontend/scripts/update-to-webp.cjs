#!/usr/bin/env node

/**
 * Update image references from PNG/JPG to WebP
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');

// Files to update and their replacements
const replacements = [
  // marketing/images folder
  { from: 'check-icon.png', to: 'check-icon.webp' },
  { from: 'brainicon.png', to: 'brainicon.webp' },
  { from: 'bot.png', to: 'bot.webp' },
  { from: 'mole1.png', to: 'mole1.webp' },
  { from: 'promptmole.png', to: 'promptmole.webp' },
  { from: 'digitaltransformation.png', to: 'digitaltransformation.webp' },
  { from: 'ai 3 1.png', to: 'ai 3 1.webp' },
  { from: 'background-grid-pattern.png', to: 'background-grid-pattern.webp' },
  { from: 'footer-background.jpg', to: 'footer-background.webp' },
  { from: 'banner-background.jpg', to: 'banner-background.webp' },
  { from: 'ai-communication-illustration.jpg', to: 'ai-communication-illustration.webp' },
  { from: 'prompting-illustration.jpg', to: 'prompting-illustration.webp' },
  { from: 'techniques-hero-image.jpg', to: 'techniques-hero-image.webp' },
  // techniques folder
  { from: 'techniques/Group 205.png', to: 'techniques/Group 205.webp' },
  { from: 'techniques/Group 281.png', to: 'techniques/Group 281.webp' },
  { from: 'techniques/ai5.png', to: 'techniques/ai5.webp' },
  { from: 'techniques/technique-33d3874838600fa90097bf09b02e6fa049405c93.jpg', to: 'techniques/technique-33d3874838600fa90097bf09b02e6fa049405c93.webp' },
  // prompting-guide folder
  { from: 'prompting-guide/Group 281.png', to: 'prompting-guide/Group 281.webp' },
  { from: 'prompting-guide/Group 216.png', to: 'prompting-guide/Group 216.webp' },
  // basics folder
  { from: 'basics/Group 287.png', to: 'basics/Group 287.webp' },
  { from: 'basics/Image.png', to: 'basics/Image.webp' },
  { from: 'basics/App Logos.png', to: 'basics/App Logos.webp' },
  // Other
  { from: 'Group 303.png', to: 'Group 303.webp' },
  { from: 'Group 282.png', to: 'Group 282.webp' },
  { from: 'Group%20282.png', to: 'Group%20282.webp' },
];

function findFiles(dir, ext, files = []) {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '__tests__'].includes(item)) {
        findFiles(fullPath, ext, files);
      }
    } else if (item.endsWith(ext)) {
      files.push(fullPath);
    }
  });
  return files;
}

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  replacements.forEach(({ from, to }) => {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      modified = true;
      console.log(`  ${path.basename(filePath)}: ${from} → ${to}`);
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

console.log('🔄 Updating image references to WebP...\n');

const tsxFiles = findFiles(SRC_DIR, '.tsx');
const tsFiles = findFiles(SRC_DIR, '.ts');
const allFiles = [...tsxFiles, ...tsFiles];

let updatedCount = 0;
allFiles.forEach(file => {
  if (updateFile(file)) updatedCount++;
});

console.log(`\n✅ Updated ${updatedCount} files`);
