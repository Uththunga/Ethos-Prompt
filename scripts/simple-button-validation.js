#!/usr/bin/env node

/**
 * Simple Button Usage Validation Script
 * 
 * A lightweight validation script that doesn't require external dependencies
 * to validate button implementations across the codebase.
 */

const fs = require('fs');
const path = require('path');

/**
 * Configuration
 */
const CONFIG = {
  validVariants: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'cta'],
  validSizes: ['sm', 'default', 'lg', 'icon'],
  scanDirs: ['frontend/src', 'scripts/frontend/src'],
  fileExtensions: ['.tsx', '.jsx', '.ts', '.js', '.html']
};

/**
 * Recursively get all files in directory
 */
function getAllFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, dist, build directories
        if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
          getAllFiles(filePath, fileList);
        }
      } else {
        // Check if file has valid extension
        const ext = path.extname(file);
        if (CONFIG.fileExtensions.includes(ext)) {
          fileList.push(filePath);
        }
      }
    });
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}`);
  }
  
  return fileList;
}

/**
 * Extract button information from file content
 */
function extractButtons(content, filePath) {
  const buttons = [];
  const lines = content.split('\n');
  
  // Patterns to match different button types
  const patterns = [
    // React Button component
    /<Button\s+([^>]*?)>/g,
    // HTML button elements
    /<button\s+([^>]*?)>/g,
    // Elements with role="button"
    /<\w+\s+([^>]*?)role=["']button["']([^>]*?)>/g
  ];
  
  patterns.forEach((pattern, patternIndex) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const matchText = match[0];
      const attributes = match[1] || '';
      
      // Find line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      
      // Extract properties
      const button = {
        file: filePath,
        line: lineNumber,
        content: matchText.trim(),
        type: matchText.includes('<Button') ? 'react' : 'html',
        variant: extractAttribute(attributes, 'variant'),
        size: extractAttribute(attributes, 'size'),
        className: extractAttribute(attributes, 'className') || extractAttribute(attributes, 'class'),
        ariaLabel: extractAttribute(attributes, 'aria-label'),
        disabled: attributes.includes('disabled'),
        issues: [],
        warnings: []
      };
      
      // Validate button
      validateButton(button);
      buttons.push(button);
    }
  });
  
  return buttons;
}

/**
 * Extract attribute value from attributes string
 */
function extractAttribute(attributes, attrName) {
  const regex = new RegExp(`${attrName}=["']([^"']+)["']`);
  const match = attributes.match(regex);
  return match ? match[1] : null;
}

/**
 * Validate individual button
 */
function validateButton(button) {
  // Validate variant
  if (button.variant && !CONFIG.validVariants.includes(button.variant)) {
    button.issues.push(`Invalid variant: "${button.variant}"`);
  }
  
  // Validate size
  if (button.size && !CONFIG.validSizes.includes(button.size)) {
    button.issues.push(`Invalid size: "${button.size}"`);
  }
  
  // Check for deprecated class patterns
  if (button.className) {
    const deprecatedPatterns = [
      { pattern: /btn-/, message: 'Bootstrap-style btn- classes are deprecated' },
      { pattern: /bg-blue-\d+/, message: 'Hardcoded blue colors should use design tokens' },
      { pattern: /bg-red-\d+/, message: 'Hardcoded red colors should use design tokens' },
      { pattern: /bg-green-\d+/, message: 'Hardcoded green colors should use design tokens' },
      { pattern: /text-blue-\d+/, message: 'Hardcoded blue text colors should use design tokens' },
      { pattern: /text-red-\d+/, message: 'Hardcoded red text colors should use design tokens' },
      { pattern: /rounded-\d+/, message: 'Custom border radius should use standard button variants' }
    ];
    
    deprecatedPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(button.className)) {
        button.warnings.push(message);
      }
    });
  }
  
  // Check accessibility
  if (button.size === 'icon' && !button.ariaLabel) {
    button.warnings.push('Icon buttons should have aria-label for accessibility');
  }
  
  if (button.type === 'html' && !button.ariaLabel && button.content.length < 50) {
    button.warnings.push('HTML button may need aria-label for better accessibility');
  }
  
  // Check for missing variant (React buttons)
  if (button.type === 'react' && !button.variant) {
    button.warnings.push('React Button should specify a variant prop');
  }
}

/**
 * Generate validation report
 */
function generateReport(allButtons) {
  const totalButtons = allButtons.length;
  const validButtons = allButtons.filter(b => b.issues.length === 0);
  const buttonsWithWarnings = allButtons.filter(b => b.warnings.length > 0);
  const invalidButtons = allButtons.filter(b => b.issues.length > 0);
  
  const report = {
    summary: {
      totalButtons,
      validButtons: validButtons.length,
      invalidButtons: invalidButtons.length,
      buttonsWithWarnings: buttonsWithWarnings.length,
      successRate: totalButtons > 0 ? Math.round((validButtons.length / totalButtons) * 100) : 0
    },
    byFile: {},
    issues: [],
    warnings: []
  };
  
  // Group by file
  allButtons.forEach(button => {
    const relativePath = path.relative(process.cwd(), button.file);
    if (!report.byFile[relativePath]) {
      report.byFile[relativePath] = {
        total: 0,
        valid: 0,
        invalid: 0,
        warnings: 0,
        buttons: []
      };
    }
    
    const fileReport = report.byFile[relativePath];
    fileReport.total++;
    fileReport.buttons.push(button);
    
    if (button.issues.length === 0) {
      fileReport.valid++;
    } else {
      fileReport.invalid++;
      button.issues.forEach(issue => {
        report.issues.push(`${relativePath}:${button.line} - ${issue}`);
      });
    }
    
    if (button.warnings.length > 0) {
      fileReport.warnings++;
      button.warnings.forEach(warning => {
        report.warnings.push(`${relativePath}:${button.line} - ${warning}`);
      });
    }
  });
  
  return report;
}

/**
 * Main validation function
 */
function validateButtonUsage() {
  console.log('🔍 Starting Simple Button Usage Validation...\n');
  
  const allFiles = [];
  
  // Collect all files
  CONFIG.scanDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      getAllFiles(dir, allFiles);
    } else {
      console.warn(`Warning: Directory ${dir} does not exist`);
    }
  });
  
  console.log(`📁 Scanning ${allFiles.length} files...`);
  
  const allButtons = [];
  let filesWithButtons = 0;
  
  // Process each file
  allFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const buttons = extractButtons(content, filePath);
      
      if (buttons.length > 0) {
        allButtons.push(...buttons);
        filesWithButtons++;
        
        const relativePath = path.relative(process.cwd(), filePath);
        console.log(`  ✓ ${relativePath}: ${buttons.length} buttons found`);
      }
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}`);
    }
  });
  
  // Generate report
  const report = generateReport(allButtons);
  
  console.log('\n📊 Validation Results:');
  console.log(`  Files Scanned: ${allFiles.length}`);
  console.log(`  Files with Buttons: ${filesWithButtons}`);
  console.log(`  Total Buttons: ${report.summary.totalButtons}`);
  console.log(`  Valid Buttons: ${report.summary.validButtons}`);
  console.log(`  Invalid Buttons: ${report.summary.invalidButtons}`);
  console.log(`  Buttons with Warnings: ${report.summary.buttonsWithWarnings}`);
  console.log(`  Success Rate: ${report.summary.successRate}%`);
  
  // Show status
  if (report.summary.successRate >= 95) {
    console.log('\n✅ Excellent! Button usage is highly compatible.');
  } else if (report.summary.successRate >= 85) {
    console.log('\n⚠️  Good compatibility with some issues to address.');
  } else {
    console.log('\n❌ Significant compatibility issues found.');
  }
  
  // Show sample issues
  if (report.issues.length > 0) {
    console.log('\n🔧 Sample Issues (first 5):');
    report.issues.slice(0, 5).forEach(issue => {
      console.log(`  - ${issue}`);
    });
    
    if (report.issues.length > 5) {
      console.log(`  ... and ${report.issues.length - 5} more issues`);
    }
  }
  
  // Show sample warnings
  if (report.warnings.length > 0) {
    console.log('\n⚠️  Sample Warnings (first 5):');
    report.warnings.slice(0, 5).forEach(warning => {
      console.log(`  - ${warning}`);
    });
    
    if (report.warnings.length > 5) {
      console.log(`  ... and ${report.warnings.length - 5} more warnings`);
    }
  }
  
  // Save detailed report
  const reportFile = 'button-validation-report.json';
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportFile}`);
  
  console.log('\n🎯 Next Steps:');
  if (report.summary.invalidButtons > 0) {
    console.log('  1. Fix invalid button variants and sizes');
  }
  if (report.summary.buttonsWithWarnings > 0) {
    console.log('  2. Address accessibility and deprecation warnings');
  }
  console.log('  3. Use the enhanced Button component for new implementations');
  console.log('  4. Consider migrating deprecated patterns to design tokens');
  
  return report;
}

// Run if called directly
if (require.main === module) {
  try {
    const report = validateButtonUsage();
    process.exit(report.summary.successRate >= 85 ? 0 : 1);
  } catch (error) {
    console.error('Validation failed:', error);
    process.exit(1);
  }
}

module.exports = { validateButtonUsage };
