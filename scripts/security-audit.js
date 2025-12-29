#!/usr/bin/env node

/**
 * Security Audit Script
 * Checks for common security vulnerabilities and configurations
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Security Audit Starting...');

// Check Firebase security rules
function checkFirebaseRules() {
  console.log('\n🔥 Firebase Security Rules Check:');
  
  const rulesFiles = [
    'firestore.rules',
    'storage.rules'
  ];

  rulesFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      console.log(`\n📄 ${file}:`);
      
      // Check for overly permissive rules
      if (content.includes('allow read, write: if true')) {
        console.log('  ❌ CRITICAL: Overly permissive rules found (allow read, write: if true)');
      } else {
        console.log('  ✅ No overly permissive rules detected');
      }
      
      // Check for authentication requirements
      if (content.includes('request.auth != null')) {
        console.log('  ✅ Authentication checks present');
      } else {
        console.log('  ⚠️  Consider adding authentication requirements');
      }
      
      // Check for data validation
      if (content.includes('request.resource.data')) {
        console.log('  ✅ Data validation rules present');
      } else {
        console.log('  ⚠️  Consider adding data validation rules');
      }
    } else {
      console.log(`  ❌ ${file} not found`);
    }
  });
}

// Check environment variables security
function checkEnvironmentSecurity() {
  console.log('\n🔐 Environment Variables Security:');
  
  const envFiles = [
    'frontend/.env.example',
    'frontend/.env.production',
    'functions/.env.example'
  ];

  envFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      console.log(`\n📄 ${file}:`);
      
      // Check for exposed secrets
      const secretPatterns = [
        /sk-[a-zA-Z0-9]{48}/g, // OpenAI API keys
        /AIza[0-9A-Za-z-_]{35}/g, // Google API keys
        /[0-9a-f]{32}/g, // Generic 32-char hex keys
      ];
      
      let hasSecrets = false;
      secretPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          hasSecrets = true;
        }
      });
      
      if (hasSecrets) {
        console.log('  ❌ CRITICAL: Potential secrets found in environment file');
      } else {
        console.log('  ✅ No exposed secrets detected');
      }
      
      // Check for proper variable naming
      if (content.includes('your_') || content.includes('your-')) {
        console.log('  ✅ Template variables properly marked');
      } else {
        console.log('  ⚠️  Consider using placeholder values in example files');
      }
    }
  });
}

// Check package vulnerabilities
function checkPackageVulnerabilities() {
  console.log('\n📦 Package Security Check:');
  
  const packageFiles = [
    'frontend/package.json',
    'functions/package.json'
  ];

  packageFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      console.log(`\n📄 ${file}:`);
      
      // Check for known vulnerable packages
      const vulnerablePackages = [
        'lodash', 'moment', 'request', 'node-uuid'
      ];
      
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      const foundVulnerable = Object.keys(dependencies).filter(dep =>
        vulnerablePackages.some(vuln => dep.includes(vuln))
      );
      
      if (foundVulnerable.length > 0) {
        console.log(`  ⚠️  Potentially vulnerable packages: ${foundVulnerable.join(', ')}`);
      } else {
        console.log('  ✅ No known vulnerable packages detected');
      }
      
      // Check for outdated packages (basic check)
      const depCount = Object.keys(dependencies).length;
      console.log(`  📊 Total dependencies: ${depCount}`);
      
      if (depCount > 100) {
        console.log('  ⚠️  Large number of dependencies - consider audit');
      }
    }
  });
}

// Check HTTPS and security headers
function checkSecurityHeaders() {
  console.log('\n🛡️  Security Headers Check:');
  
  const indexPath = path.join(__dirname, '../frontend/dist/index.html');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    
    // Check for security-related meta tags
    const securityChecks = [
      {
        name: 'Content Security Policy',
        check: content.includes('Content-Security-Policy'),
        recommendation: 'Add CSP meta tag for XSS protection'
      },
      {
        name: 'X-Frame-Options',
        check: content.includes('X-Frame-Options'),
        recommendation: 'Add X-Frame-Options to prevent clickjacking'
      },
      {
        name: 'Referrer Policy',
        check: content.includes('referrer'),
        recommendation: 'Add referrer policy for privacy'
      }
    ];

    securityChecks.forEach(({ name, check, recommendation }) => {
      console.log(`  ${check ? '✅' : '❌'} ${name}`);
      if (!check) {
        console.log(`    💡 ${recommendation}`);
      }
    });
  } else {
    console.log('  ❌ Built application not found - run build first');
  }
}

// Check Firebase configuration
function checkFirebaseConfig() {
  console.log('\n🔥 Firebase Configuration Security:');
  
  const configPath = path.join(__dirname, '../frontend/src/config/firebase.ts');
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf8');
    
    // Check for hardcoded values
    if (content.includes('AIza') && !content.includes('import.meta.env')) {
      console.log('  ❌ CRITICAL: Hardcoded Firebase API key detected');
    } else {
      console.log('  ✅ Firebase config uses environment variables');
    }
    
    // Check for emulator configuration
    if (content.includes('connectAuthEmulator')) {
      console.log('  ✅ Emulator configuration present');
    } else {
      console.log('  ⚠️  Consider adding emulator support for development');
    }
    
    // Check for proper error handling
    if (content.includes('try') && content.includes('catch')) {
      console.log('  ✅ Error handling implemented');
    } else {
      console.log('  ⚠️  Consider adding error handling for Firebase initialization');
    }
  }
}

// Generate security recommendations
function generateSecurityRecommendations() {
  console.log('\n📋 Security Recommendations:');
  console.log('================================');
  
  const recommendations = [
    '🔒 Enable Firebase App Check for production',
    '🛡️  Implement Content Security Policy (CSP)',
    '🔐 Use Firebase Security Rules for data access control',
    '📱 Enable two-factor authentication for admin accounts',
    '🔍 Regular security audits and dependency updates',
    '📊 Monitor authentication and access patterns',
    '🚫 Implement rate limiting for API endpoints',
    '🔑 Rotate API keys regularly',
    '📝 Log security events for monitoring',
    '🌐 Use HTTPS everywhere (enforce in production)'
  ];

  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });

  // Save security report
  const reportData = {
    timestamp: new Date().toISOString(),
    auditResults: 'See console output above',
    recommendations: recommendations,
    nextAuditDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  };

  const reportPath = path.join(__dirname, '../security-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(`\n📄 Security report saved to: ${reportPath}`);
}

// Main execution
function main() {
  try {
    checkFirebaseRules();
    checkEnvironmentSecurity();
    checkPackageVulnerabilities();
    checkSecurityHeaders();
    checkFirebaseConfig();
    generateSecurityRecommendations();
    
    console.log('\n✅ Security audit completed!');
    console.log('\n🎯 Priority Actions:');
    console.log('1. Review and fix any CRITICAL issues found');
    console.log('2. Implement recommended security headers');
    console.log('3. Set up regular security monitoring');
    console.log('4. Schedule monthly security audits');
  } catch (error) {
    console.error('❌ Error during security audit:', error.message);
    process.exit(1);
  }
}

main();
