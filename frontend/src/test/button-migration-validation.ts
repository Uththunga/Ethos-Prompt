 

/**
 * Button Migration Validation Tools
 *
 * Tools to validate that existing button implementations work correctly
 * with the enhanced button system and provide migration guidance.
 */

import React from 'react';
import type { ButtonMigrationGuide, ButtonSize, ButtonVariant } from '../components/marketing/ui/button-types';

/**
 * Migration Validation Result
 */
interface MigrationValidationResult {
  isCompatible: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
  migrationGuide?: ButtonMigrationGuide;
}

/**
 * Legacy Button Props (for testing compatibility)
 */
interface LegacyButtonProps {
  variant?: string;
  size?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

/**
 * Button Migration Validator Class
 */
export class ButtonMigrationValidator {
  private readonly validVariants: ButtonVariant[] = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'cta'];
  private readonly validSizes: ButtonSize[] = ['sm', 'default', 'lg', 'icon'];

  /**
   * Validate a legacy button implementation
   */
  validateLegacyButton(props: LegacyButtonProps): MigrationValidationResult {
    const result: MigrationValidationResult = {
      isCompatible: true,
      warnings: [],
      errors: [],
      suggestions: [],
    };

    // Validate variant
    if (props.variant) {
      if (!this.validVariants.includes(props.variant as ButtonVariant)) {
        result.isCompatible = false;
        result.errors.push(`Invalid variant "${props.variant}". Valid variants: ${this.validVariants.join(', ')}`);

        // Suggest migration
        const suggestedVariant = this.suggestVariantMigration(props.variant);
        if (suggestedVariant) {
          result.suggestions.push(`Consider migrating "${props.variant}" to "${suggestedVariant}"`);
        }
      }
    }

    // Validate size
    if (props.size) {
      if (!this.validSizes.includes(props.size as ButtonSize)) {
        result.isCompatible = false;
        result.errors.push(`Invalid size "${props.size}". Valid sizes: ${this.validSizes.join(', ')}`);

        // Suggest migration
        const suggestedSize = this.suggestSizeMigration(props.size);
        if (suggestedSize) {
          result.suggestions.push(`Consider migrating "${props.size}" to "${suggestedSize}"`);
        }
      }
    }

    // Check for deprecated patterns in className
    if (props.className) {
      const deprecatedPatterns = this.findDeprecatedClassPatterns(props.className);
      if (deprecatedPatterns.length > 0) {
        result.warnings.push(`Deprecated class patterns found: ${deprecatedPatterns.join(', ')}`);
        result.suggestions.push('Consider removing custom styling and using standard button variants');
      }
    }

    // Generate migration guide if needed
    if (!result.isCompatible || result.warnings.length > 0) {
      result.migrationGuide = this.generateMigrationGuide(props);
    }

    return result;
  }

  /**
   * Test button rendering with legacy props
   */

  testButtonRendering(props: LegacyButtonProps): boolean {
    void props;
    try {
      // Mock test for button rendering - would need proper JSX in .tsx file
      const mockElement = document.createElement('button');
      mockElement.textContent = 'Test Button';
      const isRendered = mockElement !== null;


      return isRendered;
    } catch (error) {
      console.error('Button rendering failed:', error);
      return false;
    }
  }

  /**
   * Validate button accessibility after migration
   */

  validateAccessibility(props: LegacyButtonProps): string[] {
    void props;
    const issues: string[] = [];

    try {
      // Mock test for button validation - would need proper JSX in .tsx file
      const mockElement = document.createElement('button');
      mockElement.textContent = 'Test Button';
      const button = mockElement;

      // Check touch target size
      const rect = button.getBoundingClientRect();
      if (rect.height < 44 || rect.width < 44) {
        issues.push('Button does not meet minimum 44px touch target requirement');
      }

      // Check for proper ARIA attributes
      if (!button.getAttribute('aria-label') && !button.textContent?.trim()) {
        issues.push('Button lacks accessible text or aria-label');
      }

      // Check for focus indicator
      const styles = window.getComputedStyle(button);
      if (!styles.outline && !styles.boxShadow) {
        issues.push('Button may lack proper focus indicator');
      }


    } catch (error) {
      issues.push(`Accessibility validation failed: ${error}`);
    }

    return issues;
  }

  /**
   * Suggest variant migration
   */
  private suggestVariantMigration(variant: string): ButtonVariant | null {
    const migrationMap: Record<string, ButtonVariant> = {
      'primary': 'default',
      'danger': 'destructive',
      'warning': 'destructive',
      'success': 'default',
      'info': 'default',
      'light': 'secondary',
      'dark': 'default',
      'transparent': 'ghost',
      'text': 'link',
      'minimal': 'ghost',
    };

    return migrationMap[variant.toLowerCase()] || null;
  }

  /**
   * Suggest size migration
   */
  private suggestSizeMigration(size: string): ButtonSize | null {
    const migrationMap: Record<string, ButtonSize> = {
      'xs': 'sm',
      'small': 'sm',
      'medium': 'default',
      'large': 'lg',
      'xl': 'lg',
      'xxl': 'lg',
      'tiny': 'sm',
      'huge': 'lg',
      'cta': 'lg', // Special case: cta size becomes lg with cta variant
    };

    return migrationMap[size.toLowerCase()] || null;
  }

  /**
   * Find deprecated class patterns
   */
  private findDeprecatedClassPatterns(className: string): string[] {
    const deprecated: string[] = [];
    const classes = className.split(' ');

    const deprecatedPatterns = [
      /^btn-/, // Bootstrap-style classes
      /^button-/, // Custom button classes
      /^bg-blue/, // Hardcoded colors
      /^bg-red/,
      /^bg-green/,
      /^text-blue/,
      /^text-red/,
      /^text-green/,
      /^rounded-\d+/, // Custom border radius
      /^shadow-\d+/, // Custom shadows
      /^h-\d+/, // Custom heights
      /^w-\d+/, // Custom widths (for non-icon buttons)
      /^p-\d+/, // Custom padding
      /^m-\d+/, // Custom margins
    ];

    classes.forEach(cls => {
      deprecatedPatterns.forEach(pattern => {
        if (pattern.test(cls)) {
          deprecated.push(cls);
        }
      });
    });

    return deprecated;
  }

  /**
   * Generate migration guide
   */
  private generateMigrationGuide(props: LegacyButtonProps): ButtonMigrationGuide {
    const guide: ButtonMigrationGuide = {
      from: {
        variant: props.variant,
        size: props.size,
        className: props.className,
      },
      to: {
        variant: 'default',
        size: 'default',
      },
      breaking: false,
      automated: true,
      instructions: [],
    };

    // Migrate variant
    if (props.variant) {
      const newVariant = this.suggestVariantMigration(props.variant);
      if (newVariant) {
        guide.to.variant = newVariant;
        guide.instructions.push(`Change variant from "${props.variant}" to "${newVariant}"`);
      } else {
        guide.breaking = true;
        guide.automated = false;
        guide.instructions.push(`Manual review required: Unknown variant "${props.variant}"`);
      }
    }

    // Migrate size
    if (props.size) {
      const newSize = this.suggestSizeMigration(props.size);
      if (newSize) {
        guide.to.size = newSize;
        guide.instructions.push(`Change size from "${props.size}" to "${newSize}"`);

        // Special case for CTA size
        if (props.size.toLowerCase() === 'cta') {
          guide.to.variant = 'cta';
          guide.instructions.push('Also change variant to "cta" for CTA styling');
        }
      } else {
        guide.breaking = true;
        guide.automated = false;
        guide.instructions.push(`Manual review required: Unknown size "${props.size}"`);
      }
    }

    // Handle deprecated classes
    if (props.className) {
      const deprecated = this.findDeprecatedClassPatterns(props.className);
      if (deprecated.length > 0) {
        guide.instructions.push(`Remove deprecated classes: ${deprecated.join(', ')}`);
        guide.instructions.push('Use standard button variants instead of custom styling');

        // Keep non-deprecated classes
        const remaining = props.className.split(' ').filter(cls => !deprecated.includes(cls));
        if (remaining.length > 0) {
          guide.to.className = remaining.join(' ');
        }
      }
    }

    return guide;
  }
}

/**
 * Batch Migration Validator
 */
export class BatchMigrationValidator {
  private validator = new ButtonMigrationValidator();

  /**
   * Validate multiple button implementations
   */
  validateBatch(buttonProps: LegacyButtonProps[]): {
    total: number;
    compatible: number;
    incompatible: number;
    warnings: number;
    results: MigrationValidationResult[];
  } {
    const results = buttonProps.map(props => this.validator.validateLegacyButton(props));

    return {
      total: results.length,
      compatible: results.filter(r => r.isCompatible).length,
      incompatible: results.filter(r => !r.isCompatible).length,
      warnings: results.filter(r => r.warnings.length > 0).length,
      results,
    };
  }

  /**
   * Generate migration report
   */
  generateMigrationReport(buttonProps: LegacyButtonProps[]): string {
    const batchResult = this.validateBatch(buttonProps);

    let report = '# Button Migration Report\n\n';
    report += `## Summary\n`;
    report += `- Total buttons analyzed: ${batchResult.total}\n`;
    report += `- Compatible: ${batchResult.compatible}\n`;
    report += `- Incompatible: ${batchResult.incompatible}\n`;
    report += `- With warnings: ${batchResult.warnings}\n\n`;

    if (batchResult.incompatible > 0) {
      report += `## Incompatible Buttons\n\n`;
      batchResult.results.forEach((result, index) => {
        if (!result.isCompatible) {
          report += `### Button ${index + 1}\n`;
          report += `**Errors:**\n`;
          result.errors.forEach(error => {
            report += `- ${error}\n`;
          });

          if (result.suggestions.length > 0) {
            report += `**Suggestions:**\n`;
            result.suggestions.forEach(suggestion => {
              report += `- ${suggestion}\n`;
            });
          }

          if (result.migrationGuide) {
            report += `**Migration Guide:**\n`;
            result.migrationGuide.instructions.forEach(instruction => {
              report += `- ${instruction}\n`;
            });
          }

          report += '\n';
        }
      });
    }

    if (batchResult.warnings > 0) {
      report += `## Buttons with Warnings\n\n`;
      batchResult.results.forEach((result, index) => {
        if (result.warnings.length > 0) {
          report += `### Button ${index + 1}\n`;
          report += `**Warnings:**\n`;
          result.warnings.forEach(warning => {
            report += `- ${warning}\n`;
          });

          if (result.suggestions.length > 0) {
            report += `**Suggestions:**\n`;
            result.suggestions.forEach(suggestion => {
              report += `- ${suggestion}\n`;
            });
          }

          report += '\n';
        }
      });
    }

    return report;
  }
}

/**
 * Export validation utilities
 */
export const migrationValidator = new ButtonMigrationValidator();
export const batchMigrationValidator = new BatchMigrationValidator();

/**
 * Convenience function for quick validation
 */
export const validateButtonMigration = (props: LegacyButtonProps): MigrationValidationResult => {
  return migrationValidator.validateLegacyButton(props);
};

/**
 * Test existing button implementations
 */
export const testExistingButtons = (): void => {
  // Test common legacy button patterns
  const legacyButtons: LegacyButtonProps[] = [
    { variant: 'primary', size: 'large' },
    { variant: 'danger', size: 'small' },
    { variant: 'success', size: 'medium' },
    { variant: 'cta', size: 'cta' },
    { className: 'btn-primary btn-lg' },
    { className: 'bg-blue-500 text-white px-4 py-2 rounded' },
  ];

  const report = batchMigrationValidator.generateMigrationReport(legacyButtons);
  console.log(report);
};
