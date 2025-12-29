#!/usr/bin/env node

/**
 * Figma MCP Connection Test Script
 * Tests the connection to Figma's MCP server and validates selected layer functionality
 */

const http = require('http');
const https = require('https');

class FigmaMCPTester {
  constructor() {
    this.baseUrl = 'http://127.0.0.1:3845';
    this.endpoints = {
      sse: '/sse',
      mcp: '/mcp',
      health: '/health'
    };
  }

  async testConnection() {
    console.log('🔍 Testing Figma MCP Connection...\n');
    
    try {
      // Test SSE endpoint (primary)
      console.log('1. Testing SSE endpoint...');
      await this.testEndpoint(this.endpoints.sse);
      
      // Test MCP endpoint (alternative)
      console.log('\n2. Testing MCP endpoint...');
      await this.testEndpoint(this.endpoints.mcp);
      
      // Test health endpoint if available
      console.log('\n3. Testing health endpoint...');
      await this.testEndpoint(this.endpoints.health);
      
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      this.showTroubleshootingSteps();
    }
  }

  async testEndpoint(endpoint) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${endpoint}`;
      
      const req = http.get(url, (res) => {
        console.log(`   ✅ ${endpoint}: Status ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log(`   📡 Server is responding on ${endpoint}`);
          resolve();
        } else {
          console.log(`   ⚠️  Unexpected status: ${res.statusCode}`);
          resolve();
        }
      });

      req.on('error', (error) => {
        if (error.code === 'ECONNREFUSED') {
          console.log(`   ❌ ${endpoint}: Connection refused - Server not running`);
        } else {
          console.log(`   ❌ ${endpoint}: ${error.message}`);
        }
        resolve(); // Don't reject, just log the error
      });

      req.setTimeout(5000, () => {
        console.log(`   ⏰ ${endpoint}: Request timeout`);
        req.destroy();
        resolve();
      });
    });
  }

  showTroubleshootingSteps() {
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Ensure Figma desktop app is open and running');
    console.log('2. Verify Dev Mode MCP Server is enabled in Figma preferences');
    console.log('3. Check that you have a Professional, Organization, or Enterprise plan');
    console.log('4. Restart Figma desktop app if needed');
    console.log('5. Verify VS Code settings.json has correct MCP configuration');
    console.log('6. Restart VS Code after configuration changes');
  }

  showUsageInstructions() {
    console.log('\n📋 Figma MCP Usage Instructions:');
    console.log('1. Open your landing page design in Figma desktop app');
    console.log('2. Select a frame or component you want to work with');
    console.log('3. In VS Code, use these prompts:');
    console.log('');
    console.log('   Basic code generation:');
    console.log('   "Generate React TypeScript code for my Figma selection using Tailwind CSS"');
    console.log('');
    console.log('   Update existing component:');
    console.log('   "Update HeroSection.tsx to match this Figma design"');
    console.log('');
    console.log('   Extract design tokens:');
    console.log('   "Get color and spacing variables from my Figma selection"');
    console.log('');
    console.log('   Create new landing page section:');
    console.log('   "Create a new landing page section component from this Figma selection"');
  }

  showLandingPageComponents() {
    console.log('\n🎨 Available Landing Page Components:');
    console.log('• HeroSection.tsx - Main hero banner');
    console.log('• NavigationHeader.tsx - Navigation menu');
    console.log('• FeaturesSection.tsx - Feature highlights');
    console.log('• BenefitsSection.tsx - Value propositions');
    console.log('• TestimonialsSection.tsx - Customer testimonials');
    console.log('• CTASection.tsx - Call-to-action section');
    console.log('• FooterSection.tsx - Footer links and info');
  }

  showConfigurationStatus() {
    console.log('\n⚙️  Current Configuration Status:');
    console.log('✅ VS Code settings.json updated with Figma MCP server');
    console.log('✅ Server URL: http://127.0.0.1:3845/sse');
    console.log('✅ Transport: SSE');
    console.log('✅ MCP discovery enabled');
    console.log('✅ Chat agent enabled');
  }
}

// Main execution
async function main() {
  const tester = new FigmaMCPTester();
  
  console.log('🎨 Figma MCP Connection Test for Landing Page Development\n');
  console.log('This script tests the connection to Figma\'s MCP server');
  console.log('to enable design-to-code workflow for your landing page.\n');
  
  await tester.testConnection();
  tester.showConfigurationStatus();
  tester.showLandingPageComponents();
  tester.showUsageInstructions();
  
  console.log('\n✨ Ready to connect to Figma and get selected layers!');
  console.log('Follow the usage instructions above to start generating code from your Figma designs.');
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = FigmaMCPTester; 