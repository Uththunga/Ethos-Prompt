#!/usr/bin/env node

/**
 * Help System Validation Script
 * Validates that all help system components are properly integrated
 * and functioning correctly
 */

const fs = require('fs');
const path = require('path');

// Configuration
const HELP_COMPONENTS = [
  'frontend/src/components/help/HelpSystem.tsx',
  'frontend/src/components/help/HelpCenter.tsx',
  'frontend/src/components/help/GuidedOnboarding.tsx',
  'frontend/src/components/help/FAQ.tsx'
];

const HELP_DATA_ATTRIBUTES = [
  'help-button',
  'nav-dashboard',
  'nav-prompts',
  'nav-documents',
  'nav-executions',
  'nav-analytics',
  'nav-workspaces',
  'nav-help',
  'nav-settings',
  'create-prompt-button',
  'ai-create-prompt-button',
  'upload-documents'
];

const DOCUMENTATION_FILES = [
  'docs/user-guide/getting-started.md',
  'docs/user-guide/onboarding-checklist.md',
  'README.md'
];

// Validation results
const validationResults = {
  components: { status: 'pending', details: [] },
  integration: { status: 'pending', details: [] },
  dataAttributes: { status: 'pending', details: [] },
  documentation: { status: 'pending', details: [] },
  routes: { status: 'pending', details: [] }
};

console.log('🔍 Help System Validation Starting...\n');

// 1. Validate Help Components
console.log('📦 Checking Help Components...');
let componentsPassed = 0;
for (const component of HELP_COMPONENTS) {
  if (fs.existsSync(component)) {
    console.log(`  ✅ ${component} - EXISTS`);
    componentsPassed++;
    
    // Check component content
    const content = fs.readFileSync(component, 'utf8');
    if (content.includes('React') && content.includes('export')) {
      console.log(`    ✅ Valid React component structure`);
    } else {
      console.log(`    ⚠️  Component structure may be incomplete`);
    }
  } else {
    console.log(`  ❌ ${component} - MISSING`);
  }
}

validationResults.components.status = componentsPassed === HELP_COMPONENTS.length ? 'passed' : 'failed';
validationResults.components.details = { passed: componentsPassed, total: HELP_COMPONENTS.length };

// 2. Validate Help System Integration
console.log('\n🔗 Checking Help System Integration...');
const appFile = 'frontend/src/App.tsx';
if (fs.existsSync(appFile)) {
  const appContent = fs.readFileSync(appFile, 'utf8');
  
  const integrationChecks = [
    { name: 'HelpProvider import', pattern: /import.*HelpProvider.*from.*help/ },
    { name: 'HelpCenter import', pattern: /import.*HelpCenter.*from.*help/ },
    { name: 'HelpProvider wrapper', pattern: /<HelpProvider>/ },
    { name: 'Help route', pattern: /path="help".*element={<HelpCenter/ }
  ];
  
  let integrationPassed = 0;
  for (const check of integrationChecks) {
    if (check.pattern.test(appContent)) {
      console.log(`  ✅ ${check.name} - FOUND`);
      integrationPassed++;
    } else {
      console.log(`  ❌ ${check.name} - MISSING`);
    }
  }
  
  validationResults.integration.status = integrationPassed === integrationChecks.length ? 'passed' : 'failed';
  validationResults.integration.details = { passed: integrationPassed, total: integrationChecks.length };
} else {
  console.log('  ❌ App.tsx not found');
  validationResults.integration.status = 'failed';
}

// 3. Validate Help Data Attributes
console.log('\n🏷️  Checking Help Data Attributes...');
const filesToCheck = [
  'frontend/src/components/layout/Header.tsx',
  'frontend/src/components/layout/Sidebar.tsx',
  'frontend/src/pages/Prompts.tsx',
  'frontend/src/pages/Documents.tsx'
];

let attributesFound = 0;
for (const file of filesToCheck) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const foundAttributes = HELP_DATA_ATTRIBUTES.filter(attr => 
      content.includes(`data-help="${attr}"`)
    );
    
    if (foundAttributes.length > 0) {
      console.log(`  ✅ ${path.basename(file)} - Found ${foundAttributes.length} attributes`);
      foundAttributes.forEach(attr => {
        console.log(`    • ${attr}`);
      });
      attributesFound += foundAttributes.length;
    } else {
      console.log(`  ⚠️  ${path.basename(file)} - No help attributes found`);
    }
  }
}

validationResults.dataAttributes.status = attributesFound >= 8 ? 'passed' : 'partial';
validationResults.dataAttributes.details = { found: attributesFound, expected: HELP_DATA_ATTRIBUTES.length };

// 4. Validate Documentation
console.log('\n📚 Checking Documentation...');
let docsPassed = 0;
for (const doc of DOCUMENTATION_FILES) {
  if (fs.existsSync(doc)) {
    const content = fs.readFileSync(doc, 'utf8');
    const wordCount = content.split(/\s+/).length;
    
    if (wordCount > 100) {
      console.log(`  ✅ ${doc} - EXISTS (${wordCount} words)`);
      docsPassed++;
    } else {
      console.log(`  ⚠️  ${doc} - Too short (${wordCount} words)`);
    }
  } else {
    console.log(`  ❌ ${doc} - MISSING`);
  }
}

validationResults.documentation.status = docsPassed === DOCUMENTATION_FILES.length ? 'passed' : 'failed';
validationResults.documentation.details = { passed: docsPassed, total: DOCUMENTATION_FILES.length };

// 5. Validate Help Routes
console.log('\n🛣️  Checking Help Routes...');
const sidebarFile = 'frontend/src/components/layout/Sidebar.tsx';
if (fs.existsSync(sidebarFile)) {
  const sidebarContent = fs.readFileSync(sidebarFile, 'utf8');
  
  const routeChecks = [
    { name: 'Help navigation item', pattern: /name: 'Help'/ },
    { name: 'Help route path', pattern: /href: '\/help'/ },
    { name: 'Help icon', pattern: /icon: HelpCircle/ }
  ];
  
  let routesPassed = 0;
  for (const check of routeChecks) {
    if (check.pattern.test(sidebarContent)) {
      console.log(`  ✅ ${check.name} - FOUND`);
      routesPassed++;
    } else {
      console.log(`  ❌ ${check.name} - MISSING`);
    }
  }
  
  validationResults.routes.status = routesPassed === routeChecks.length ? 'passed' : 'failed';
  validationResults.routes.details = { passed: routesPassed, total: routeChecks.length };
} else {
  console.log('  ❌ Sidebar.tsx not found');
  validationResults.routes.status = 'failed';
}

// Generate Summary Report
console.log('\n📊 Help System Validation Summary');
console.log('================================');

const allResults = Object.values(validationResults);
const passedCount = allResults.filter(r => r.status === 'passed').length;
const totalCount = allResults.length;
const successRate = (passedCount / totalCount * 100).toFixed(1);

console.log(`📋 Total Checks: ${totalCount}`);
console.log(`✅ Passed: ${passedCount}`);
console.log(`⚠️  Partial: ${allResults.filter(r => r.status === 'partial').length}`);
console.log(`❌ Failed: ${allResults.filter(r => r.status === 'failed').length}`);
console.log(`📊 Success Rate: ${successRate}%`);

// Detailed Results
console.log('\n📋 Detailed Results:');
for (const [category, result] of Object.entries(validationResults)) {
  const status = result.status === 'passed' ? '✅' : 
                result.status === 'partial' ? '⚠️' : '❌';
  console.log(`${status} ${category}: ${result.status}`);
  
  if (result.details.passed !== undefined) {
    console.log(`   ${result.details.passed}/${result.details.total} items passed`);
  }
}

// Recommendations
console.log('\n💡 Recommendations:');
if (validationResults.components.status !== 'passed') {
  console.log('• Ensure all help components are properly created');
}
if (validationResults.integration.status !== 'passed') {
  console.log('• Complete help system integration in App.tsx');
}
if (validationResults.dataAttributes.status !== 'passed') {
  console.log('• Add more help data attributes to UI elements');
}
if (validationResults.documentation.status !== 'passed') {
  console.log('• Complete all documentation files');
}
if (validationResults.routes.status !== 'passed') {
  console.log('• Fix help navigation and routing');
}

// Save detailed report
const reportPath = path.join(__dirname, '..', 'reports', 'Help_System_Validation_Report.md');
const reportDir = path.dirname(reportPath);
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const reportContent = `# Help System Validation Report

**Date**: ${new Date().toISOString().split('T')[0]}  
**Success Rate**: ${successRate}%  
**Status**: ${successRate >= 80 ? '✅ PASSED' : '❌ NEEDS WORK'}

## Summary
- Components: ${validationResults.components.status}
- Integration: ${validationResults.integration.status}
- Data Attributes: ${validationResults.dataAttributes.status}
- Documentation: ${validationResults.documentation.status}
- Routes: ${validationResults.routes.status}

## Next Steps
${successRate >= 80 ? 
  '✅ Help system is ready for production!' : 
  '⚠️ Address failed checks before deployment'}
`;

fs.writeFileSync(reportPath, reportContent);
console.log(`\n📄 Detailed report saved to: ${reportPath}`);

// Final Status
if (successRate >= 80) {
  console.log('\n🎉 Help System Validation PASSED!');
  console.log('✅ Help system is ready for production deployment');
  process.exit(0);
} else {
  console.log('\n⚠️ Help System Validation NEEDS WORK');
  console.log('❌ Address failed checks before deployment');
  process.exit(1);
}
