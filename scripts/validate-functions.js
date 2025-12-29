#!/usr/bin/env node

/**
 * Validate Cloud Functions
 * Checks that all required functions are exported from functions/index.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}🔍 Validating Cloud Functions${colors.reset}`);
console.log('='.repeat(50));
console.log('');

// Required functions (expected by frontend)
const requiredFunctions = [
  // CRUD Operations
  { name: 'create_prompt', category: 'CRUD', required: true },
  { name: 'get_prompt', category: 'CRUD', required: true },
  { name: 'update_prompt', category: 'CRUD', required: true },
  { name: 'delete_prompt', category: 'CRUD', required: true },
  { name: 'list_prompts', category: 'CRUD', required: true },
  { name: 'search_prompts', category: 'CRUD', required: true },
  { name: 'get_prompt_versions', category: 'CRUD', required: true },
  { name: 'restore_prompt_version', category: 'CRUD', required: true },
  
  // AI Operations
  { name: 'generate_prompt', category: 'AI', required: true },
  { name: 'execute_multi_model_prompt', category: 'AI', required: false },
  
  // API Endpoints
  { name: 'api', category: 'API', required: true },
  { name: 'httpApi', category: 'API', required: false },
];

// Read functions/index.js
const functionsPath = path.join(__dirname, '..', 'functions', 'index.js');

if (!fs.existsSync(functionsPath)) {
  console.log(`${colors.red}❌ Error: functions/index.js not found${colors.reset}`);
  process.exit(1);
}

const functionsCode = fs.readFileSync(functionsPath, 'utf8');

// Check each function
let allPassed = true;
let missingRequired = [];
let foundFunctions = [];

console.log(`${colors.cyan}📋 Checking required functions:${colors.reset}\n`);

requiredFunctions.forEach((func) => {
  // Check if function is exported
  const exportPattern = new RegExp(`exports\\.${func.name}\\s*=`, 'g');
  const isExported = exportPattern.test(functionsCode);
  
  if (isExported) {
    console.log(`${colors.green}✅ ${func.name}${colors.reset} (${func.category})`);
    foundFunctions.push(func.name);
  } else {
    if (func.required) {
      console.log(`${colors.red}❌ ${func.name}${colors.reset} (${func.category}) - MISSING (REQUIRED)`);
      missingRequired.push(func.name);
      allPassed = false;
    } else {
      console.log(`${colors.yellow}⚠️  ${func.name}${colors.reset} (${func.category}) - MISSING (OPTIONAL)`);
    }
  }
});

console.log('');
console.log('='.repeat(50));
console.log('');

// Summary
console.log(`${colors.cyan}📊 Summary:${colors.reset}`);
console.log(`  Total functions checked: ${requiredFunctions.length}`);
console.log(`  ${colors.green}Found: ${foundFunctions.length}${colors.reset}`);
console.log(`  ${colors.red}Missing (required): ${missingRequired.length}${colors.reset}`);
console.log('');

if (allPassed) {
  console.log(`${colors.green}✅ All required functions are present!${colors.reset}`);
  console.log('');
  console.log(`${colors.cyan}📋 Next steps:${colors.reset}`);
  console.log('  1. Deploy to staging:');
  console.log('     firebase use staging');
  console.log('     firebase deploy --only functions');
  console.log('');
  console.log('  2. Verify deployment:');
  console.log('     firebase functions:list');
  console.log('');
  console.log('  3. Test the application:');
  console.log('     https://rag-prompt-library-staging.web.app/dashboard/prompts');
  console.log('');
  process.exit(0);
} else {
  console.log(`${colors.red}❌ Validation failed!${colors.reset}`);
  console.log('');
  console.log(`${colors.yellow}Missing required functions:${colors.reset}`);
  missingRequired.forEach((name) => {
    console.log(`  - ${name}`);
  });
  console.log('');
  console.log(`${colors.cyan}💡 Tip:${colors.reset} Add the missing functions to functions/index.js`);
  console.log('');
  process.exit(1);
}

