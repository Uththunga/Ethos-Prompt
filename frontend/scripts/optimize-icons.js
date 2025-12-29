#!/usr/bin/env node

/**
 * Icon Optimization Script
 * Optimizes icon imports for better tree shaking
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '../src');

// Track icon usage
const iconUsage = {
  heroicons: new Set(),
  lucide: new Set()
};

function scanFileForIcons(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find heroicons imports
  const heroiconsImportMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]@heroicons\/react\/24\/(outline|solid)['"]/g);
  if (heroiconsImportMatch) {
    heroiconsImportMatch.forEach(match => {
      const iconsMatch = match.match(/{([^}]+)}/);
      if (iconsMatch) {
        const icons = iconsMatch[1].split(',').map(icon => icon.trim());
        icons.forEach(icon => iconUsage.heroicons.add(icon));
      }
    });
  }
  
  // Find lucide imports
  const lucideImportMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]lucide-react['"]/g);
  if (lucideImportMatch) {
    lucideImportMatch.forEach(match => {
      const iconsMatch = match.match(/{([^}]+)}/);
      if (iconsMatch) {
        const icons = iconsMatch[1].split(',').map(icon => icon.trim());
        icons.forEach(icon => iconUsage.lucide.add(icon));
      }
    });
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      scanFileForIcons(filePath);
    }
  });
}

function generateIconIndex() {
  console.log('🔍 Scanning for icon usage...');
  scanDirectory(SRC_DIR);
  
  console.log(`📊 Found ${iconUsage.heroicons.size} unique Heroicons`);
  console.log(`📊 Found ${iconUsage.lucide.size} unique Lucide icons`);
  
  // Generate optimized icon exports
  const heroiconsArray = Array.from(iconUsage.heroicons).sort();
  const lucideArray = Array.from(iconUsage.lucide).sort();
  
  // Create heroicons index
  const heroiconsIndex = `// Auto-generated optimized Heroicons exports
// This file exports only the icons used in the application

// Outline icons
export {
${heroiconsArray.map(icon => `  ${icon}`).join(',\n')}
} from '@heroicons/react/24/outline';

// Solid icons (add as needed)
export {
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';
`;

  // Create lucide index
  const lucideIndex = `// Auto-generated optimized Lucide exports
// This file exports only the icons used in the application

export {
${lucideArray.map(icon => `  ${icon}`).join(',\n')}
} from 'lucide-react';
`;

  // Write optimized icon files
  const iconsDir = path.join(SRC_DIR, 'components/icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(iconsDir, 'heroicons.ts'), heroiconsIndex);
  fs.writeFileSync(path.join(iconsDir, 'lucide.ts'), lucideIndex);
  
  // Create main icons index
  const mainIndex = `// Optimized icon exports
// Import icons from these files instead of directly from the libraries

export * from './heroicons';
export * from './lucide';
`;
  
  fs.writeFileSync(path.join(iconsDir, 'index.ts'), mainIndex);
  
  console.log('✅ Generated optimized icon exports');
  console.log(`📁 Created: ${path.join(iconsDir, 'index.ts')}`);
  console.log(`📁 Created: ${path.join(iconsDir, 'heroicons.ts')}`);
  console.log(`📁 Created: ${path.join(iconsDir, 'lucide.ts')}`);
  
  // Generate migration guide
  const migrationGuide = `# Icon Import Migration Guide

## Before (Direct imports - larger bundle):
\`\`\`typescript
import { UserIcon, HomeIcon } from '@heroicons/react/24/outline';
import { Menu, Settings } from 'lucide-react';
\`\`\`

## After (Optimized imports - smaller bundle):
\`\`\`typescript
import { UserIcon, HomeIcon, Menu, Settings } from '../components/icons';
\`\`\`

## Benefits:
- Better tree shaking
- Smaller bundle size
- Centralized icon management
- Easier to track icon usage

## Used Icons:
### Heroicons (${heroiconsArray.length}):
${heroiconsArray.map(icon => `- ${icon}`).join('\n')}

### Lucide (${lucideArray.length}):
${lucideArray.map(icon => `- ${icon}`).join('\n')}
`;
  
  fs.writeFileSync(path.join(__dirname, '../ICON_MIGRATION.md'), migrationGuide);
  console.log('📋 Created migration guide: ICON_MIGRATION.md');
  
  return {
    heroicons: heroiconsArray,
    lucide: lucideArray,
    totalIcons: heroiconsArray.length + lucideArray.length
  };
}

// Run optimization
generateIconIndex();

export { generateIconIndex };
