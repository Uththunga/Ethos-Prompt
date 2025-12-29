#!/usr/bin/env node

/**
 * Button Usage Validation Script
 * 
 * Validates all 198 existing button implementations across the codebase
 * to ensure compatibility with the enhanced button system.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Configuration
 */
const CONFIG = {
  // Directories to scan
  scanDirs: [
    'frontend/src/**/*.{tsx,jsx,ts,js}',
    'scripts/frontend/src/**/*.{tsx,jsx,ts,js}',
    '**/*.html'
  ],
  
  // Exclude patterns
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.test.*',
    '**/*.spec.*'
  ],
  
  // Valid button variants
  validVariants: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'cta'],
  
  // Valid button sizes
  validSizes: ['sm', 'default', 'lg', 'icon'],
  
  // Output file
  outputFile: 'button-validation-report.json'
};

/**
 * Button validation results
 */
class ButtonValidationResults {
  constructor() {
    this.totalButtons = 0;
    this.validButtons = 0;
    this.invalidButtons = 0;
    this.warnings = 0;
    this.issues = [];
    this.files = [];
    this.summary = {};
  }

  addFile(filePath, buttons) {
    this.files.push({
      path: filePath,
      buttonCount: buttons.length,
      buttons: buttons
    });
    
    this.totalButtons += buttons.length;
    
    buttons.forEach(button => {
      if (button.isValid) {
        this.validButtons++;
      } else {
        this.invalidButtons++;
      }
      
      if (button.warnings.length > 0) {
        this.warnings += button.warnings.length;
      }
      
      this.issues.push(...button.issues);
    });
  }

  generateSummary() {
    this.summary = {
      totalFiles: this.files.length,
      totalButtons: this.totalButtons,
      validButtons: this.validButtons,
      invalidButtons: this.invalidButtons,
      warnings: this.warnings,
      successRate: this.totalButtons > 0 ? Math.round((this.validButtons / this.totalButtons) * 100) : 0,
      filesWithIssues: this.files.filter(f => f.buttons.some(b => !b.isValid || b.warnings.length > 0)).length
    };
  }

  saveReport() {
    this.generateSummary();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.summary,
      files: this.files,
      issues: this.issues,
      recommendations: this.generateRecommendations()
    };
    
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${CONFIG.outputFile}`);
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.summary.successRate < 95) {
      recommendations.push('Consider running the migration validation tools on problematic buttons');
    }
    
    if (this.summary.warnings > 0) {
      recommendations.push('Review warning messages and update deprecated patterns');
    }
    
    if (this.invalidButtons > 0) {
      recommendations.push('Update invalid button implementations to use standard variants and sizes');
    }
    
    return recommendations;
  }
}

/**
 * Button pattern matchers
 */
const BUTTON_PATTERNS = {
  // React Button component usage
  reactButton: /<Button\s+([^>]*?)>/g,
  
  // HTML button elements
  htmlButton: /<button\s+([^>]*?)>/g,
  
  // Clickable divs that might be buttons
  clickableDiv: /<div\s+([^>]*?)(?:onClick|click)([^>]*?)>/g,
  
  // Button-like elements with role="button"
  roleButton: /<\w+\s+([^>]*?)role=["']button["']([^>]*?)>/g
};

/**
 * Extract button properties from attributes string
 */
function extractButtonProps(attributesString) {
  const props = {};
  
  // Extract variant
  const variantMatch = attributesString.match(/variant=["']([^"']+)["']/);
  if (variantMatch) {
    props.variant = variantMatch[1];
  }
  
  // Extract size
  const sizeMatch = attributesString.match(/size=["']([^"']+)["']/);
  if (sizeMatch) {
    props.size = sizeMatch[1];
  }
  
  // Extract className
  const classMatch = attributesString.match(/className=["']([^"']+)["']/);
  if (classMatch) {
    props.className = classMatch[1];
  }
  
  // Extract class (for HTML)
  const classHtmlMatch = attributesString.match(/class=["']([^"']+)["']/);
  if (classHtmlMatch) {
    props.className = classHtmlMatch[1];
  }
  
  // Check for disabled
  if (attributesString.includes('disabled')) {
    props.disabled = true;
  }
  
  // Check for aria-label
  const ariaLabelMatch = attributesString.match(/aria-label=["']([^"']+)["']/);
  if (ariaLabelMatch) {
    props.ariaLabel = ariaLabelMatch[1];
  }
  
  return props;
}

/**
 * Validate individual button
 */
function validateButton(buttonMatch, lineNumber, filePath) {
  const [fullMatch, attributes] = buttonMatch;
  const props = extractButtonProps(attributes);
  
  const button = {
    line: lineNumber,
    content: fullMatch.trim(),
    props: props,
    isValid: true,
    warnings: [],
    issues: [],
    type: fullMatch.includes('<Button') ? 'react' : 'html'
  };
  
  // Validate variant
  if (props.variant && !CONFIG.validVariants.includes(props.variant)) {
    button.isValid = false;
    button.issues.push(`Invalid variant "${props.variant}" at line ${lineNumber}`);
  }
  
  // Validate size
  if (props.size && !CONFIG.validSizes.includes(props.size)) {
    button.isValid = false;
    button.issues.push(`Invalid size "${props.size}" at line ${lineNumber}`);
  }
  
  // Check for deprecated patterns
  if (props.className) {
    const deprecatedPatterns = [
      /btn-/,
      /bg-blue-/,
      /bg-red-/,
      /bg-green-/,
      /text-blue-/,
      /text-red-/,
      /text-green-/
    ];
    
    deprecatedPatterns.forEach(pattern => {
      if (pattern.test(props.className)) {
        button.warnings.push(`Deprecated class pattern found: ${pattern.source} at line ${lineNumber}`);
      }
    });
  }
  
  // Check accessibility
  if (button.type === 'html' && !props.ariaLabel && !fullMatch.includes('>')) {
    button.warnings.push(`HTML button may need aria-label at line ${lineNumber}`);
  }
  
  // Check for icon buttons without labels
  if (props.size === 'icon' && !props.ariaLabel) {
    button.warnings.push(`Icon button should have aria-label at line ${lineNumber}`);
  }
  
  return button;
}

/**
 * Scan file for buttons
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const buttons = [];
    
    // Find all button patterns
    Object.entries(BUTTON_PATTERNS).forEach(([patternName, pattern]) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // Find line number
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        
        const button = validateButton([match[0], match[1] || ''], lineNumber, filePath);
        button.patternType = patternName;
        buttons.push(button);
      }
    });
    
    return buttons;
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Main validation function
 */
async function validateButtonUsage() {
  console.log('🔍 Starting Button Usage Validation...\n');
  
  const results = new ButtonValidationResults();
  
  // Get all files to scan
  const allFiles = [];
  
  for (const pattern of CONFIG.scanDirs) {
    try {
      const files = glob.sync(pattern, {
        ignore: CONFIG.excludePatterns,
        absolute: true
      });
      allFiles.push(...files);
    } catch (error) {
      console.error(`Error scanning pattern ${pattern}:`, error.message);
    }
  }
  
  // Remove duplicates
  const uniqueFiles = [...new Set(allFiles)];
  
  console.log(`📁 Scanning ${uniqueFiles.length} files...`);
  
  // Scan each file
  let processedFiles = 0;
  for (const filePath of uniqueFiles) {
    const relativePath = path.relative(process.cwd(), filePath);
    const buttons = scanFile(filePath);
    
    if (buttons.length > 0) {
      results.addFile(relativePath, buttons);
      console.log(`  ✓ ${relativePath}: ${buttons.length} buttons found`);
    }
    
    processedFiles++;
    if (processedFiles % 50 === 0) {
      console.log(`    Progress: ${processedFiles}/${uniqueFiles.length} files processed`);
    }
  }
  
  // Generate and display results
  results.generateSummary();
  
  console.log('\n📊 Validation Results:');
  console.log(`  Total Files Scanned: ${uniqueFiles.length}`);
  console.log(`  Files with Buttons: ${results.summary.totalFiles}`);
  console.log(`  Total Buttons Found: ${results.summary.totalButtons}`);
  console.log(`  Valid Buttons: ${results.summary.validButtons}`);
  console.log(`  Invalid Buttons: ${results.summary.invalidButtons}`);
  console.log(`  Warnings: ${results.summary.warnings}`);
  console.log(`  Success Rate: ${results.summary.successRate}%`);
  
  // Show status
  if (results.summary.successRate >= 95) {
    console.log('\n✅ Excellent! Button usage is highly compatible with the enhanced system.');
  } else if (results.summary.successRate >= 85) {
    console.log('\n⚠️  Good compatibility with some issues to address.');
  } else {
    console.log('\n❌ Significant compatibility issues found. Migration recommended.');
  }
  
  // Show top issues
  if (results.issues.length > 0) {
    console.log('\n🔧 Top Issues to Address:');
    const issueTypes = {};
    results.issues.forEach(issue => {
      const type = issue.split(' ')[0];
      issueTypes[type] = (issueTypes[type] || 0) + 1;
    });
    
    Object.entries(issueTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([type, count]) => {
        console.log(`  - ${type}: ${count} occurrences`);
      });
  }
  
  // Save detailed report
  results.saveReport();
  
  console.log('\n🎯 Next Steps:');
  console.log('  1. Review the detailed report for specific issues');
  console.log('  2. Use migration validation tools for problematic buttons');
  console.log('  3. Update deprecated patterns to use enhanced button system');
  console.log('  4. Test accessibility compliance for all buttons');
  
  return results;
}

// Run validation if called directly
if (require.main === module) {
  validateButtonUsage()
    .then(results => {
      process.exit(results.summary.successRate >= 85 ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateButtonUsage, ButtonValidationResults };
