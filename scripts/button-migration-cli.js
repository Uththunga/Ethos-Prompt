#!/usr/bin/env node

/**
 * Button Migration CLI Tool
 * 
 * Command-line interface for button size migration utilities
 */

const { ButtonSizeValidator, ButtonUtils } = require('./button-validation-utils');
const { ButtonDetector } = require('./button-migration-utils');

const commands = {
  scan: {
    description: 'Scan codebase for button usages and generate report',
    action: async () => {
      console.log('🔍 Scanning codebase for button usages...');
      const detector = new ButtonDetector();
      await detector.scanAndReport();
    }
  },
  
  validate: {
    description: 'Validate button report and generate migration guide',
    action: async () => {
      console.log('📋 Validating button migration report...');
      const validator = new ButtonSizeValidator();
      const reportPath = './button-migration-report.json';
      
      try {
        const validationResults = validator.validateButtonReport(reportPath);
        const migrationGuide = validator.generateMigrationGuide(validationResults);
        
        const fs = require('fs');
        fs.writeFileSync('./button-migration-guide.json', JSON.stringify(migrationGuide, null, 2));
        
        console.log(`✅ Migration guide generated: button-migration-guide.json`);
        console.log(`📊 Compliance Score: ${validationResults.summary.compliancePercentage}%`);
        console.log(`🚨 High Priority Migrations: ${validationResults.summary.highPriorityMigrations}`);
        
      } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
    }
  },
  
  map: {
    description: 'Map old size to new standardized size',
    action: (oldSize) => {
      if (!oldSize) {
        console.error('❌ Please provide a size to map. Example: npm run map cta');
        return;
      }
      
      const result = ButtonUtils.mapSize(oldSize);
      console.log(`📏 Size Mapping:`);
      console.log(`  Input: ${oldSize}`);
      console.log(`  Output: ${result.size}${result.variant ? ` variant="${result.variant}"` : ''}`);
      console.log(`  Note: ${result.note}`);
    }
  },
  
  suggest: {
    description: 'Suggest appropriate size based on context',
    action: (context, content = '') => {
      if (!context) {
        console.error('❌ Please provide a context. Example: npm run suggest primary-action "Get Started"');
        return;
      }
      
      const suggestions = ButtonUtils.suggestSize(context, content);
      console.log(`💡 Size Suggestions for context "${context}":`);
      
      suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. size="${suggestion.size}"${suggestion.variant ? ` variant="${suggestion.variant}"` : ''}`);
        console.log(`     Reason: ${suggestion.reason}`);
        console.log(`     Confidence: ${suggestion.confidence}`);
      });
    }
  },
  
  check: {
    description: 'Check accessibility compliance for button props',
    action: (size = 'default') => {
      const result = ButtonUtils.checkAccessibility({ size });
      console.log(`♿ Accessibility Check for size="${size}":`);
      console.log(`  Valid: ${result.isValid ? '✅' : '❌'}`);
      
      if (result.issues.length > 0) {
        console.log(`  Issues:`);
        result.issues.forEach(issue => console.log(`    • ${issue}`));
      }
      
      if (result.suggestions.length > 0) {
        console.log(`  Suggestions:`);
        result.suggestions.forEach(suggestion => console.log(`    • ${suggestion}`));
      }
      
      if (result.sizeSpec) {
        console.log(`  Specifications:`);
        console.log(`    • Height: ${result.sizeSpec.height}px`);
        console.log(`    • Font Size: ${result.sizeSpec.fontSize}px`);
        console.log(`    • Description: ${result.sizeSpec.description}`);
      }
    }
  },
  
  sizes: {
    description: 'Show all standard button sizes',
    action: () => {
      const sizes = ButtonUtils.getStandardSizes();
      console.log('📏 Standard Button Sizes:');
      
      Object.entries(sizes).forEach(([name, spec]) => {
        console.log(`\n  ${name.toUpperCase()}:`);
        console.log(`    • Height: ${spec.height}px`);
        console.log(`    • Font Size: ${spec.fontSize}px`);
        if (spec.minWidth) console.log(`    • Min Width: ${spec.minWidth}px`);
        console.log(`    • Padding: ${spec.padding}`);
        console.log(`    • Use Case: ${spec.description}`);
      });
    }
  },
  
  contexts: {
    description: 'Show context-based size recommendations',
    action: () => {
      const contexts = ButtonUtils.getContextRecommendations();
      console.log('🎯 Context-Based Recommendations:');
      
      Object.entries(contexts).forEach(([context, rec]) => {
        console.log(`\n  ${context.toUpperCase()}:`);
        console.log(`    • Recommended Size: ${rec.recommendedSize}`);
        console.log(`    • Suggested Variants: ${rec.variants.join(', ')}`);
        console.log(`    • Description: ${rec.description}`);
      });
    }
  },
  
  help: {
    description: 'Show available commands',
    action: () => {
      console.log('🔧 Button Migration CLI Commands:\n');
      
      Object.entries(commands).forEach(([name, cmd]) => {
        console.log(`  ${name.padEnd(12)} ${cmd.description}`);
      });
      
      console.log('\nExamples:');
      console.log('  node button-migration-cli.js scan');
      console.log('  node button-migration-cli.js validate');
      console.log('  node button-migration-cli.js map cta');
      console.log('  node button-migration-cli.js suggest primary-action "Get Started"');
      console.log('  node button-migration-cli.js check sm');
    }
  }
};

// Parse command line arguments
const [,, command, ...args] = process.argv;

if (!command || !commands[command]) {
  console.log('❌ Unknown command. Use "help" to see available commands.');
  commands.help.action();
  process.exit(1);
}

// Execute command
try {
  commands[command].action(...args);
} catch (error) {
  console.error('❌ Error executing command:', error.message);
  process.exit(1);
}