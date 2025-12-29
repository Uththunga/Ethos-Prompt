#!/usr/bin/env node

/**
 * Button Size Mapping and Validation Utilities
 * 
 * This module provides utilities for mapping old button sizes to new standardized sizes,
 * validating accessibility requirements, and suggesting appropriate sizes based on context.
 */

const fs = require('fs');
const path = require('path');

/**
 * Size mapping configuration from old to new standardized sizes
 */
const SIZE_MAPPING = {
  // Direct mappings
  'sm': 'sm',
  'default': 'default', 
  'lg': 'lg',
  'icon': 'icon',
  
  // Deprecated size mappings
  'xl': 'lg',
  'cta': 'lg', // Note: should also add variant="cta"
  
  // Custom height class mappings
  'h-8': 'sm',    // 32px -> 36px (sm)
  'h-9': 'sm',    // 36px -> 36px (sm)
  'h-10': 'default', // 40px -> 44px (default)
  'h-11': 'default', // 44px -> 44px (default)
  'h-12': 'lg',   // 48px -> 52px (lg)
  'h-13': 'lg',   // 52px -> 52px (lg)
  'h-14': 'lg',   // 56px -> 52px (lg)
  'h-15': 'lg',   // 60px -> 52px (lg)
  'h-16': 'lg',   // 64px -> 52px (lg)
  'h-17': 'lg',   // 68px -> 52px (lg)
  'h-18': 'lg',   // 72px -> 52px (lg)
};

/**
 * Standard button size specifications
 */
const STANDARD_SIZES = {
  sm: {
    height: 36,        // h-9
    minHeight: 36,
    padding: '8px 12px',
    fontSize: 14,
    description: 'Small buttons for secondary actions and compact interfaces'
  },
  default: {
    height: 44,        // h-11
    minHeight: 44,
    padding: '12px 16px',
    fontSize: 16,
    description: 'Standard buttons for most common actions'
  },
  lg: {
    height: 52,        // h-13
    minHeight: 52,
    padding: '16px 24px',
    fontSize: 16,
    minWidth: 120,
    description: 'Large buttons for primary actions and CTAs'
  },
  icon: {
    height: 44,        // h-11
    width: 44,         // w-11
    minHeight: 44,
    minWidth: 44,
    padding: '0',
    fontSize: 16,
    description: 'Square buttons for icon-only actions'
  }
};

/**
 * Context-based size recommendations
 */
const CONTEXT_RECOMMENDATIONS = {
  'primary-action': {
    recommendedSize: 'lg',
    variants: ['default', 'cta'],
    description: 'Main call-to-action buttons that drive user engagement'
  },
  'secondary-action': {
    recommendedSize: 'default',
    variants: ['outline', 'secondary'],
    description: 'Supporting actions like Cancel, Back, Edit'
  },
  'tertiary-action': {
    recommendedSize: 'sm',
    variants: ['ghost', 'link'],
    description: 'Minor actions like Show More, Collapse, Skip'
  },
  'icon-action': {
    recommendedSize: 'icon',
    variants: ['ghost', 'outline'],
    description: 'Icon-only buttons for actions like Close, Menu, Settings'
  },
  'form-submit': {
    recommendedSize: 'lg',
    variants: ['default', 'cta'],
    description: 'Form submission buttons'
  },
  'form-cancel': {
    recommendedSize: 'default',
    variants: ['outline', 'secondary'],
    description: 'Form cancellation buttons'
  },
  'navigation': {
    recommendedSize: 'default',
    variants: ['ghost', 'outline'],
    description: 'Navigation buttons and links'
  },
  'table-action': {
    recommendedSize: 'sm',
    variants: ['ghost', 'outline'],
    description: 'Actions within tables or lists'
  }
};

/**
 * Accessibility requirements based on WCAG 2.1 AA
 */
const ACCESSIBILITY_REQUIREMENTS = {
  minTouchTarget: 44, // pixels
  minTextSize: 14,    // pixels
  minContrast: 4.5,   // ratio for normal text
  minContrastLarge: 3, // ratio for large text (18px+)
};

/**
 * Button Size Mapping and Validation Class
 */
class ButtonSizeValidator {
  constructor() {
    this.validationResults = [];
  }

  /**
   * Map old size to new standardized size
   */
  mapSize(oldSize, context = null) {
    // Direct mapping from SIZE_MAPPING
    if (SIZE_MAPPING[oldSize]) {
      const newSize = SIZE_MAPPING[oldSize];
      
      // Special handling for deprecated 'cta' size
      if (oldSize === 'cta') {
        return {
          size: newSize,
          variant: 'cta',
          note: 'Converted deprecated size="cta" to size="lg" variant="cta"'
        };
      }
      
      return {
        size: newSize,
        note: oldSize !== newSize ? `Mapped ${oldSize} to ${newSize}` : 'No change needed'
      };
    }
    
    // Context-based recommendation if no direct mapping
    if (context && CONTEXT_RECOMMENDATIONS[context]) {
      const recommendation = CONTEXT_RECOMMENDATIONS[context];
      return {
        size: recommendation.recommendedSize,
        variant: recommendation.variants[0],
        note: `Recommended ${recommendation.recommendedSize} for ${context} context`
      };
    }
    
    // Default fallback
    return {
      size: 'default',
      note: `Unknown size "${oldSize}", defaulting to "default"`
    };
  }

  /**
   * Map multiple custom height classes to appropriate size
   */
  mapCustomHeights(heightClasses) {
    if (!heightClasses || heightClasses.length === 0) {
      return { size: 'default', note: 'No custom heights found' };
    }
    
    // Find the largest height class and map it
    const sortedHeights = heightClasses.sort((a, b) => {
      const aNum = parseInt(a.replace('h-', ''));
      const bNum = parseInt(b.replace('h-', ''));
      return bNum - aNum; // Descending order
    });
    
    const largestHeight = sortedHeights[0];
    const mapping = this.mapSize(largestHeight);
    
    return {
      ...mapping,
      note: `Mapped custom heights [${heightClasses.join(', ')}] to ${mapping.size} based on largest (${largestHeight})`
    };
  }

  /**
   * Validate button against accessibility requirements
   */
  validateAccessibility(buttonProps) {
    const issues = [];
    const suggestions = [];
    
    const size = buttonProps.size || 'default';
    const sizeSpec = STANDARD_SIZES[size];
    
    if (!sizeSpec) {
      issues.push(`Unknown size "${size}"`);
      suggestions.push('Use a standard size: sm, default, lg, or icon');
      return { isValid: false, issues, suggestions };
    }
    
    // Check minimum touch target size
    if (sizeSpec.height < ACCESSIBILITY_REQUIREMENTS.minTouchTarget) {
      issues.push(`Button height ${sizeSpec.height}px is below minimum touch target of ${ACCESSIBILITY_REQUIREMENTS.minTouchTarget}px`);
      suggestions.push('Use size="default" or larger to meet accessibility requirements');
    }
    
    // Check for custom styling that might override standard sizes
    if (buttonProps.customHeights && buttonProps.customHeights.length > 0) {
      const customHeightIssues = buttonProps.customHeights.filter(height => {
        const heightValue = parseInt(height.replace('h-', '')) * 4; // Convert to pixels (h-8 = 32px)
        return heightValue < ACCESSIBILITY_REQUIREMENTS.minTouchTarget;
      });
      
      if (customHeightIssues.length > 0) {
        issues.push(`Custom height classes [${customHeightIssues.join(', ')}] create buttons smaller than ${ACCESSIBILITY_REQUIREMENTS.minTouchTarget}px`);
        suggestions.push('Remove custom height classes and use standard sizes');
      }
    }
    
    // Check font size
    if (sizeSpec.fontSize < ACCESSIBILITY_REQUIREMENTS.minTextSize) {
      issues.push(`Font size ${sizeSpec.fontSize}px is below recommended minimum of ${ACCESSIBILITY_REQUIREMENTS.minTextSize}px`);
      suggestions.push('Use a larger button size or adjust font size');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
      sizeSpec
    };
  }

  /**
   * Suggest appropriate size based on button context and content
   */
  suggestSize(context, content = '', currentSize = null) {
    const suggestions = [];
    
    // Context-based suggestion
    if (context && CONTEXT_RECOMMENDATIONS[context]) {
      const recommendation = CONTEXT_RECOMMENDATIONS[context];
      suggestions.push({
        size: recommendation.recommendedSize,
        variant: recommendation.variants[0],
        reason: `Recommended for ${context}: ${recommendation.description}`,
        confidence: 'high'
      });
    }
    
    // Content-based suggestions
    if (content) {
      const contentLower = content.toLowerCase();
      
      // Primary action keywords
      if (['submit', 'save', 'create', 'start', 'get started', 'sign up', 'buy now'].some(keyword => contentLower.includes(keyword))) {
        suggestions.push({
          size: 'lg',
          variant: 'cta',
          reason: 'Primary action button detected from content',
          confidence: 'high'
        });
      }
      
      // Secondary action keywords
      else if (['cancel', 'back', 'close', 'edit', 'view', 'details'].some(keyword => contentLower.includes(keyword))) {
        suggestions.push({
          size: 'default',
          variant: 'outline',
          reason: 'Secondary action button detected from content',
          confidence: 'medium'
        });
      }
      
      // Small action keywords
      else if (['more', 'less', 'show', 'hide', 'toggle', 'skip'].some(keyword => contentLower.includes(keyword))) {
        suggestions.push({
          size: 'sm',
          variant: 'ghost',
          reason: 'Tertiary action button detected from content',
          confidence: 'medium'
        });
      }
    }
    
    // Current size analysis
    if (currentSize && SIZE_MAPPING[currentSize]) {
      const mapped = this.mapSize(currentSize);
      suggestions.push({
        size: mapped.size,
        variant: mapped.variant,
        reason: `Current size "${currentSize}" maps to "${mapped.size}"`,
        confidence: 'medium'
      });
    }
    
    // Default suggestion if no specific recommendations
    if (suggestions.length === 0) {
      suggestions.push({
        size: 'default',
        variant: 'default',
        reason: 'Default recommendation when context is unclear',
        confidence: 'low'
      });
    }
    
    return suggestions;
  }

  /**
   * Generate migration instructions for a button
   */
  generateMigrationInstructions(buttonUsage) {
    const { props, filePath, lineNumber } = buttonUsage;
    const instructions = [];
    
    // Size migration
    if (props.size && SIZE_MAPPING[props.size] && SIZE_MAPPING[props.size] !== props.size) {
      const mapping = this.mapSize(props.size);
      
      if (props.size === 'cta') {
        instructions.push({
          type: 'size-and-variant',
          current: `size="${props.size}"`,
          replacement: `size="${mapping.size}" variant="${mapping.variant}"`,
          reason: 'Convert deprecated cta size to lg size with cta variant'
        });
      } else {
        instructions.push({
          type: 'size',
          current: `size="${props.size}"`,
          replacement: `size="${mapping.size}"`,
          reason: mapping.note
        });
      }
    }
    
    // Custom styling migration
    if (props.hasCustomStyling && props.customHeights.length > 0) {
      const heightMapping = this.mapCustomHeights(props.customHeights);
      
      instructions.push({
        type: 'remove-custom-styling',
        current: `className containing [${props.customHeights.join(', ')}]`,
        replacement: `size="${heightMapping.size}"`,
        reason: heightMapping.note
      });
    }
    
    // Accessibility improvements
    const accessibilityCheck = this.validateAccessibility(props);
    if (!accessibilityCheck.isValid) {
      instructions.push({
        type: 'accessibility',
        issues: accessibilityCheck.issues,
        suggestions: accessibilityCheck.suggestions,
        reason: 'Ensure WCAG 2.1 AA compliance'
      });
    }
    
    return {
      filePath,
      lineNumber,
      instructions,
      priority: this.calculateMigrationPriority(instructions)
    };
  }

  /**
   * Calculate migration priority based on issues found
   */
  calculateMigrationPriority(instructions) {
    let priority = 'low';
    
    for (const instruction of instructions) {
      if (instruction.type === 'accessibility') {
        priority = 'high';
        break;
      } else if (instruction.type === 'size-and-variant' || instruction.type === 'remove-custom-styling') {
        priority = 'medium';
      }
    }
    
    return priority;
  }

  /**
   * Validate an entire button usage report
   */
  validateButtonReport(reportPath) {
    try {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      const validationResults = {
        totalButtons: report.totalButtons,
        validButtons: 0,
        invalidButtons: 0,
        migrationInstructions: [],
        summary: {}
      };
      
      // Validate deprecated usages
      report.deprecatedUsages.forEach(usage => {
        const instructions = this.generateMigrationInstructions(usage);
        validationResults.migrationInstructions.push(instructions);
        validationResults.invalidButtons++;
      });
      
      // Validate custom styling
      report.customStyling.forEach(usage => {
        const instructions = this.generateMigrationInstructions(usage);
        validationResults.migrationInstructions.push(instructions);
        validationResults.invalidButtons++;
      });
      
      // Calculate valid buttons
      validationResults.validButtons = validationResults.totalButtons - validationResults.invalidButtons;
      
      // Generate summary
      validationResults.summary = {
        compliancePercentage: Math.round((validationResults.validButtons / validationResults.totalButtons) * 100),
        highPriorityMigrations: validationResults.migrationInstructions.filter(i => i.priority === 'high').length,
        mediumPriorityMigrations: validationResults.migrationInstructions.filter(i => i.priority === 'medium').length,
        lowPriorityMigrations: validationResults.migrationInstructions.filter(i => i.priority === 'low').length
      };
      
      return validationResults;
      
    } catch (error) {
      throw new Error(`Failed to validate button report: ${error.message}`);
    }
  }

  /**
   * Generate a comprehensive migration guide
   */
  generateMigrationGuide(validationResults) {
    const guide = {
      overview: {
        totalButtons: validationResults.totalButtons,
        compliance: validationResults.summary.compliancePercentage,
        migrationsNeeded: validationResults.invalidButtons
      },
      priorities: {
        high: validationResults.summary.highPriorityMigrations,
        medium: validationResults.summary.mediumPriorityMigrations,
        low: validationResults.summary.lowPriorityMigrations
      },
      instructions: validationResults.migrationInstructions,
      quickReference: {
        sizeMapping: SIZE_MAPPING,
        standardSizes: STANDARD_SIZES,
        contextRecommendations: CONTEXT_RECOMMENDATIONS
      }
    };
    
    return guide;
  }
}

/**
 * Utility functions for common operations
 */
const ButtonUtils = {
  /**
   * Quick size mapping lookup
   */
  mapSize: (oldSize) => {
    const validator = new ButtonSizeValidator();
    return validator.mapSize(oldSize);
  },
  
  /**
   * Quick accessibility check
   */
  checkAccessibility: (buttonProps) => {
    const validator = new ButtonSizeValidator();
    return validator.validateAccessibility(buttonProps);
  },
  
  /**
   * Quick size suggestion
   */
  suggestSize: (context, content) => {
    const validator = new ButtonSizeValidator();
    return validator.suggestSize(context, content);
  },
  
  /**
   * Get standard size specifications
   */
  getStandardSizes: () => STANDARD_SIZES,
  
  /**
   * Get context recommendations
   */
  getContextRecommendations: () => CONTEXT_RECOMMENDATIONS,
  
  /**
   * Get accessibility requirements
   */
  getAccessibilityRequirements: () => ACCESSIBILITY_REQUIREMENTS
};

// Export classes and utilities
module.exports = {
  ButtonSizeValidator,
  ButtonUtils,
  SIZE_MAPPING,
  STANDARD_SIZES,
  CONTEXT_RECOMMENDATIONS,
  ACCESSIBILITY_REQUIREMENTS
};

// CLI usage
if (require.main === module) {
  const validator = new ButtonSizeValidator();
  
  // Check if report file exists
  const reportPath = path.join(__dirname, 'button-migration-report.json');
  
  if (fs.existsSync(reportPath)) {
    console.log('🔍 Validating button migration report...');
    
    try {
      const validationResults = validator.validateButtonReport(reportPath);
      const migrationGuide = validator.generateMigrationGuide(validationResults);
      
      // Save migration guide
      const guidePath = path.join(__dirname, 'button-migration-guide.json');
      fs.writeFileSync(guidePath, JSON.stringify(migrationGuide, null, 2));
      
      // Print summary
      console.log('\n' + '='.repeat(60));
      console.log('📋 BUTTON MIGRATION VALIDATION RESULTS');
      console.log('='.repeat(60));
      
      console.log(`\n📊 Overview:`);
      console.log(`  • Total Buttons: ${validationResults.totalButtons}`);
      console.log(`  • Valid Buttons: ${validationResults.validButtons}`);
      console.log(`  • Buttons Needing Migration: ${validationResults.invalidButtons}`);
      console.log(`  • Compliance Score: ${validationResults.summary.compliancePercentage}%`);
      
      console.log(`\n🚨 Migration Priorities:`);
      console.log(`  • High Priority: ${validationResults.summary.highPriorityMigrations} (accessibility issues)`);
      console.log(`  • Medium Priority: ${validationResults.summary.mediumPriorityMigrations} (deprecated sizes/custom styling)`);
      console.log(`  • Low Priority: ${validationResults.summary.lowPriorityMigrations} (minor improvements)`);
      
      console.log(`\n📄 Migration guide saved to: ${guidePath}`);
      console.log('='.repeat(60) + '\n');
      
    } catch (error) {
      console.error('❌ Error validating report:', error.message);
      process.exit(1);
    }
  } else {
    console.log('⚠️  No button migration report found. Run button-migration-utils.js first.');
    console.log('\nExample usage:');
    console.log('  node button-migration-utils.js  # Generate report');
    console.log('  node button-validation-utils.js # Validate and create migration guide');
  }
}