#!/usr/bin/env node

/**
 * Development Environment Setup Script
 * Automates the setup of the development environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    log(`Executing: ${command}`, colors.cyan);
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    log(`Error executing: ${command}`, colors.red);
    log(error.message, colors.red);
    return false;
  }
}

function checkPrerequisites() {
  log('🔍 Checking prerequisites...', colors.blue);
  
  const requirements = [
    { command: 'node --version', name: 'Node.js' },
    { command: 'npm --version', name: 'npm' },
    { command: 'git --version', name: 'Git' },
  ];

  for (const req of requirements) {
    try {
      const version = execSync(req.command, { encoding: 'utf8' }).trim();
      log(`✅ ${req.name}: ${version}`, colors.green);
    } catch (error) {
      log(`❌ ${req.name} is not installed or not in PATH`, colors.red);
      process.exit(1);
    }
  }
}

function setupEnvironment() {
  log('🔧 Setting up environment files...', colors.blue);
  
  const envFiles = [
    {
      source: '.env.example',
      target: '.env.local',
      description: 'Local environment variables'
    },
    {
      source: 'frontend/.env.example',
      target: 'frontend/.env.local',
      description: 'Frontend environment variables'
    }
  ];

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile.source) && !fs.existsSync(envFile.target)) {
      fs.copyFileSync(envFile.source, envFile.target);
      log(`✅ Created ${envFile.target} from ${envFile.source}`, colors.green);
    } else if (fs.existsSync(envFile.target)) {
      log(`⚠️  ${envFile.target} already exists, skipping`, colors.yellow);
    } else {
      log(`⚠️  ${envFile.source} not found, skipping ${envFile.description}`, colors.yellow);
    }
  }
}

function installDependencies() {
  log('📦 Installing dependencies...', colors.blue);
  
  // Root dependencies
  if (fs.existsSync('package.json')) {
    log('Installing root dependencies...', colors.cyan);
    if (!execCommand('npm install')) {
      log('❌ Failed to install root dependencies', colors.red);
      process.exit(1);
    }
  }

  // Frontend dependencies
  if (fs.existsSync('frontend/package.json')) {
    log('Installing frontend dependencies...', colors.cyan);
    if (!execCommand('npm install', { cwd: 'frontend' })) {
      log('❌ Failed to install frontend dependencies', colors.red);
      process.exit(1);
    }
  }

  // Functions dependencies
  if (fs.existsSync('functions/package.json')) {
    log('Installing functions dependencies...', colors.cyan);
    if (!execCommand('npm install', { cwd: 'functions' })) {
      log('❌ Failed to install functions dependencies', colors.red);
      process.exit(1);
    }
  }
}

function setupGitHooks() {
  log('🪝 Setting up Git hooks...', colors.blue);
  
  if (fs.existsSync('frontend/package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
    if (packageJson.scripts && packageJson.scripts.prepare) {
      if (!execCommand('npm run prepare', { cwd: 'frontend' })) {
        log('⚠️  Failed to setup Git hooks', colors.yellow);
      } else {
        log('✅ Git hooks configured', colors.green);
      }
    }
  }
}

function runInitialChecks() {
  log('🔍 Running initial quality checks...', colors.blue);
  
  // Type checking
  if (fs.existsSync('frontend/tsconfig.json')) {
    log('Running TypeScript type check...', colors.cyan);
    if (!execCommand('npm run type-check', { cwd: 'frontend' })) {
      log('⚠️  TypeScript type check failed', colors.yellow);
    } else {
      log('✅ TypeScript type check passed', colors.green);
    }
  }

  // Linting
  if (fs.existsSync('frontend/.eslintrc.js') || fs.existsSync('frontend/.eslintrc.json')) {
    log('Running ESLint check...', colors.cyan);
    if (!execCommand('npm run lint', { cwd: 'frontend' })) {
      log('⚠️  ESLint check failed', colors.yellow);
    } else {
      log('✅ ESLint check passed', colors.green);
    }
  }
}

function displayNextSteps() {
  log('\n🎉 Development environment setup complete!', colors.green);
  log('\n📋 Next steps:', colors.blue);
  log('1. Review and update environment variables in .env.local files', colors.cyan);
  log('2. Start the development server: npm run dev', colors.cyan);
  log('3. Start Firebase emulators: firebase emulators:start', colors.cyan);
  log('4. Run tests: npm run test', colors.cyan);
  log('\n📚 Useful commands:', colors.blue);
  log('• npm run dev          - Start development server', colors.cyan);
  log('• npm run test         - Run tests', colors.cyan);
  log('• npm run lint         - Run linting', colors.cyan);
  log('• npm run build        - Build for production', colors.cyan);
  log('• npm run quality:check - Run all quality checks', colors.cyan);
}

function main() {
  log('🚀 Starting development environment setup...', colors.bright);
  
  try {
    checkPrerequisites();
    setupEnvironment();
    installDependencies();
    setupGitHooks();
    runInitialChecks();
    displayNextSteps();
  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
