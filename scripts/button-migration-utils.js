#!/usr/bin/env node

/**
 * Button Size Migration Utilities
 * 
 * This script provides utilities for detecting, analyzing, and migrating
 * button implementations to the standardized sizing system.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const CONFIG = {
  // Directories to scan for React components
  scanDirectories: [
    '../frontend/src/**/*.tsx',
    '../frontend/src/**/*.ts',
    '../../zen-home/client/**/*.tsx',
    '../../zen-home/client/**/*.ts'
  ],
  
  // Deprecated size variants to detect
  deprecatedSizes: ['xl', 'cta'],
  
  // Standard size variants
  standardSizes: ['sm', 'default', 'lg', 'icon'],
  
  // Custom height classes that should be migrated
  customHeightClasses: [
    'h-9', 'h-10', 'h-11', 'h-12', 'h-13', 'h-14', 'h-15', 'h-16', 'h-17', 'h-18'
  ],
  
  // Output file for the report
  reportFile: 'button-migration-report.json'
};

/**
 * Button Detection and Analysis Class
 */
class ButtonDetector {
  constructor() {
    this.results = {
      totalFiles: 0,
      filesWithButtons: 0,
      totalButtons: 0,
      buttonsBySize: {},
      buttonsByVariant: {},
      deprecatedUsages: [],
      customStyling: [],
      accessibilityIssues: [],
      migrationSuggestions: [],
      summary: {}
    };
  }

  /**
   * Main method to scan all files and generate report
   */
  async scanAndReport() {
    console.log('🔍 Starting button detection scan...');
    
    const files = await this.getAllReactFiles();
    console.log(`📁 Found ${files.length} React files to scan`);
    
    this.results.totalFiles = files.length;
    
    for (const file of files) {
      await this.analyzeFile(file);
    }
    
    this.generateSummary();
    this.saveReport();
    this.printReport();
    
    return this.results;
  }

  /**
   * Get all React files to scan
   */
  async getAllReactFiles() {
    const files = [];
    
    for (const pattern of CONFIG.scanDirectories) {
      try {
        const matches = glob.sync(pattern, { 
          cwd: __dirname,
          absolute: true,
          ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**']
        });
        files.push(...matches);
      } catch (error) {
        console.warn(`⚠️  Could not scan pattern ${pattern}:`, error.message);
      }
    }
    
    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Analyze a single file for button usages
   */
  async analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);
      
      // Check if file imports Button component
      const hasButtonImport = this.hasButtonImport(content);
      if (!hasButtonImport) {
        return;
      }
      
      this.results.filesWithButtons++;
      
      // Find all button usages in the file
      const buttonUsages = this.findButtonUsages(content, relativePath);
      
      if (buttonUsages.length > 0) {
        this.results.totalButtons += buttonUsages.length;
        
        // Analyze each button usage
        buttonUsages.forEach(usage => {
          this.analyzeButtonUsage(usage, relativePath);
        });
      }
      
    } catch (error) {
      console.warn(`⚠️  Could not analyze file ${filePath}:`, error.message);
    }
  }

  /**
   * Check if file imports Button component
   */
  hasButtonImport(content) {
    const importPatterns = [
      /import\s*{\s*[^}]*Button[^}]*\s*}\s*from/,
      /import\s+Button\s+from/,
      /import.*Button.*from.*button/i
    ];
    
    return importPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Find all button usages in file content
   */
  findButtonUsages(content, filePath) {
    const usages = [];
    
    // Pattern to match Button components with their props
    const buttonPattern = /<Button\s+([^>]*?)(?:\s*\/?>|>[\s\S]*?<\/Button>)/g;
    
    let match;
    while ((match = buttonPattern.exec(content)) !== null) {
      const fullMatch = match[0];
      const props = match[1];
      const lineNumber = this.getLineNumber(content, match.index);
      
      usages.push({
        filePath,
        lineNumber,
        fullMatch,
        props: this.parseProps(props),
        rawProps: props
      });
    }
    
    return usages;
  }

  /**
   * Parse button props from string
   */
  parseProps(propsString) {
    const props = {};
    
    // Extract size prop
    const sizeMatch = propsString.match(/size=["']([^"']+)["']/);
    if (sizeMatch) {
      props.size = sizeMatch[1];
    }
    
    // Extract variant prop
    const variantMatch = propsString.match(/variant=["']([^"']+)["']/);
    if (variantMatch) {
      props.variant = variantMatch[1];
    }
    
    // Extract className prop
    const classNameMatch = propsString.match(/className=["']([^"']+)["']/);
    if (classNameMatch) {
      props.className = classNameMatch[1];
    }
    
    // Check for custom styling
    if (props.className) {
      props.customHeights = this.extractCustomHeights(props.className);
      props.hasCustomStyling = props.customHeights.length > 0;
    } else {
      props.customHeights = [];
      props.hasCustomStyling = false;
    }
    
    return props;
  }

  /**
   * Extract custom height classes from className
   */
  extractCustomHeights(className) {
    const heights = [];
    CONFIG.customHeightClasses.forEach(heightClass => {
      if (className.includes(heightClass)) {
        heights.push(heightClass);
      }
    });
    return heights;
  }

  /**
   * Analyze individual button usage
   */
  analyzeButtonUsage(usage, filePath) {
    const { props } = usage;
    
    // Track size usage
    const size = props.size || 'default';
    this.results.buttonsBySize[size] = (this.results.buttonsBySize[size] || 0) + 1;
    
    // Track variant usage
    const variant = props.variant || 'default';
    this.results.buttonsByVariant[variant] = (this.results.buttonsByVariant[variant] || 0) + 1;
    
    // Check for deprecated sizes
    if (CONFIG.deprecatedSizes.includes(size)) {
      this.results.deprecatedUsages.push({
        ...usage,
        issue: `Deprecated size "${size}" detected`,
        suggestion: this.getSizeMigrationSuggestion(size)
      });
    }
    
    // Check for custom styling
    if (props.hasCustomStyling) {
      this.results.customStyling.push({
        ...usage,
        customHeights: props.customHeights,
        suggestion: this.getCustomStylingMigrationSuggestion(props.customHeights)
      });
    }
    
    // Check accessibility issues
    const accessibilityIssue = this.checkAccessibility(props);
    if (accessibilityIssue) {
      this.results.accessibilityIssues.push({
        ...usage,
        issue: accessibilityIssue,
        suggestion: this.getAccessibilitySuggestion(accessibilityIssue)
      });
    }
    
    // Generate migration suggestion
    const migrationSuggestion = this.generateMigrationSuggestion(usage);
    if (migrationSuggestion) {
      this.results.migrationSuggestions.push(migrationSuggestion);
    }
  }

  /**
   * Get line number for a given position in content
   */
  getLineNumber(content, position) {
    return content.substring(0, position).split('\n').length;
  }

  /**
   * Get migration suggestion for deprecated size
   */
  getSizeMigrationSuggestion(deprecatedSize) {
    const mapping = {
      'xl': 'lg',
      'cta': 'lg with variant="cta"'
    };
    return mapping[deprecatedSize] || 'Use standard size (sm, default, lg, icon)';
  }

  /**
   * Get migration suggestion for custom styling
   */
  getCustomStylingMigrationSuggestion(customHeights) {
    const suggestions = customHeights.map(height => {
      const mapping = {
        'h-9': 'size="sm"',
        'h-10': 'size="default"',
        'h-11': 'size="default"',
        'h-12': 'size="lg"',
        'h-13': 'size="lg"',
        'h-14': 'size="lg"',
        'h-15': 'size="lg"',
        'h-16': 'size="lg"',
        'h-17': 'size="lg"',
        'h-18': 'size="lg"'
      };
      return `Replace ${height} with ${mapping[height] || 'appropriate standard size'}`;
    });
    
    return suggestions.join(', ');
  }

  /**
   * Check for accessibility issues
   */
  checkAccessibility(props) {
    // Check for buttons that might be too small
    if (props.size === 'sm' && props.customHeights && props.customHeights.some(h => ['h-8', 'h-7', 'h-6'].includes(h))) {
      return 'Button may be too small for accessibility (minimum 44px recommended)';
    }
    
    // Check for custom styling that might create accessibility issues
    if (props.className && props.className.includes('h-8')) {
      return 'Button height is below accessibility minimum (32px < 44px)';
    }
    
    return null;
  }

  /**
   * Get accessibility suggestion
   */
  getAccessibilitySuggestion(issue) {
    if (issue.includes('too small')) {
      return 'Use size="default" or larger to meet 44px minimum touch target';
    }
    if (issue.includes('below accessibility minimum')) {
      return 'Remove custom height classes and use standard sizes';
    }
    return 'Ensure button meets WCAG 2.1 AA touch target requirements';
  }

  /**
   * Generate migration suggestion for a button usage
   */
  generateMigrationSuggestion(usage) {
    const { props, filePath, lineNumber } = usage;
    
    let suggestions = [];
    
    // Size migration
    if (CONFIG.deprecatedSizes.includes(props.size)) {
      suggestions.push(`Change size="${props.size}" to ${this.getSizeMigrationSuggestion(props.size)}`);
    }
    
    // Custom styling migration
    if (props.hasCustomStyling) {
      suggestions.push(`Remove custom height classes: ${props.customHeights.join(', ')}`);
      suggestions.push(this.getCustomStylingMigrationSuggestion(props.customHeights));
    }
    
    if (suggestions.length === 0) {
      return null;
    }
    
    return {
      filePath,
      lineNumber,
      currentUsage: usage.fullMatch,
      suggestions
    };
  }

  /**
   * Generate summary statistics
   */
  generateSummary() {
    this.results.summary = {
      scanComplete: true,
      totalFiles: this.results.totalFiles,
      filesWithButtons: this.results.filesWithButtons,
      totalButtons: this.results.totalButtons,
      deprecatedUsagesCount: this.results.deprecatedUsages.length,
      customStylingCount: this.results.customStyling.length,
      accessibilityIssuesCount: this.results.accessibilityIssues.length,
      migrationSuggestionsCount: this.results.migrationSuggestions.length,
      mostUsedSize: this.getMostUsed(this.results.buttonsBySize),
      mostUsedVariant: this.getMostUsed(this.results.buttonsByVariant),
      complianceScore: this.calculateComplianceScore()
    };
  }

  /**
   * Get most used item from object
   */
  getMostUsed(obj) {
    return Object.entries(obj).reduce((a, b) => obj[a[0]] > obj[b[0]] ? a : b, ['none', 0]);
  }

  /**
   * Calculate compliance score (0-100)
   */
  calculateComplianceScore() {
    if (this.results.totalButtons === 0) return 100;
    
    const issues = this.results.deprecatedUsages.length + 
                  this.results.customStyling.length + 
                  this.results.accessibilityIssues.length;
    
    return Math.max(0, Math.round((1 - issues / this.results.totalButtons) * 100));
  }

  /**
   * Save report to file
   */
  saveReport() {
    const reportPath = path.join(__dirname, CONFIG.reportFile);
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);
  }

  /**
   * Print summary report to console
   */
  printReport() {
    const { summary } = this.results;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 BUTTON MIGRATION ANALYSIS REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📁 Files Scanned: ${summary.totalFiles}`);
    console.log(`🔍 Files with Buttons: ${summary.filesWithButtons}`);
    console.log(`🔘 Total Buttons Found: ${summary.totalButtons}`);
    
    console.log(`\n📏 Size Distribution:`);
    Object.entries(this.results.buttonsBySize).forEach(([size, count]) => {
      const isDeprecated = CONFIG.deprecatedSizes.includes(size);
      const marker = isDeprecated ? '⚠️ ' : '✅ ';
      console.log(`  ${marker}${size}: ${count} buttons`);
    });
    
    console.log(`\n🎨 Variant Distribution:`);
    Object.entries(this.results.buttonsByVariant).forEach(([variant, count]) => {
      console.log(`  • ${variant}: ${count} buttons`);
    });
    
    console.log(`\n⚠️  Issues Found:`);
    console.log(`  • Deprecated Sizes: ${summary.deprecatedUsagesCount}`);
    console.log(`  • Custom Styling: ${summary.customStylingCount}`);
    console.log(`  • Accessibility Issues: ${summary.accessibilityIssuesCount}`);
    
    console.log(`\n📈 Compliance Score: ${summary.complianceScore}%`);
    
    if (summary.deprecatedUsagesCount > 0) {
      console.log(`\n🚨 Deprecated Size Usages:`);
      this.results.deprecatedUsages.slice(0, 5).forEach(usage => {
        console.log(`  • ${usage.filePath}:${usage.lineNumber} - ${usage.issue}`);
        console.log(`    Suggestion: ${usage.suggestion}`);
      });
      if (this.results.deprecatedUsages.length > 5) {
        console.log(`  ... and ${this.results.deprecatedUsages.length - 5} more`);
      }
    }
    
    if (summary.customStylingCount > 0) {
      console.log(`\n🎨 Custom Styling Issues:`);
      this.results.customStyling.slice(0, 3).forEach(usage => {
        console.log(`  • ${usage.filePath}:${usage.lineNumber} - Custom heights: ${usage.customHeights.join(', ')}`);
        console.log(`    Suggestion: ${usage.suggestion}`);
      });
      if (this.results.customStyling.length > 3) {
        console.log(`  ... and ${this.results.customStyling.length - 3} more`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📄 Full report saved to: ${CONFIG.reportFile}`);
    console.log('='.repeat(60) + '\n');
  }
}

// Export for use as module
module.exports = { ButtonDetector, CONFIG };

// Run if called directly
if (require.main === module) {
  const detector = new ButtonDetector();
  detector.scanAndReport().catch(console.error);
}