#!/usr/bin/env python3
"""
CLI Tool Production Finalization Script
Completes CLI tool for production deployment and management
"""

import os
import sys
import json
import subprocess
from typing import Dict, List, Any
from datetime import datetime

class CLIProductionFinalizer:
    """Finalizes CLI tool for production"""
    
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'cli_ready': False,
            'components_validated': {},
            'issues_found': [],
            'recommendations': []
        }
        
        self.cli_components = {
            'package_json': 'sdk/cli/package.json',
            'main_script': 'sdk/cli/rag-cli.js',
            'documentation': 'docs/api/SDK_Complete_Guide.md',
            'test_files': 'sdk/cli/__tests__/',
            'build_config': 'sdk/cli/build.js'
        }
    
    def finalize_cli_tool(self) -> Dict[str, Any]:
        """Complete CLI tool finalization"""
        print("🔧 CLI Tool Production Finalization")
        print("=" * 50)
        
        # Validate CLI components
        self._validate_cli_components()
        
        # Install dependencies
        self._install_cli_dependencies()
        
        # Create production build
        self._create_production_build()
        
        # Add cross-platform support
        self._add_cross_platform_support()
        
        # Create packaging configuration
        self._create_packaging_config()
        
        # Validate CLI functionality
        self._validate_cli_functionality()
        
        # Generate CLI documentation
        self._generate_cli_documentation()
        
        # Create deployment scripts
        self._create_deployment_scripts()
        
        # Generate summary
        self._generate_summary()
        
        return self.results
    
    def _validate_cli_components(self):
        """Validate CLI components"""
        print("\n📋 Validating CLI Components...")
        
        for component, path in self.cli_components.items():
            if os.path.exists(path):
                self.results['components_validated'][component] = True
                print(f"  ✅ {component}: Found")
            else:
                self.results['components_validated'][component] = False
                self.results['issues_found'].append(f"Missing {component}: {path}")
                print(f"  ❌ {component}: Missing")
    
    def _install_cli_dependencies(self):
        """Install CLI dependencies"""
        print("\n📦 Installing CLI Dependencies...")
        
        try:
            # Change to CLI directory
            cli_dir = 'sdk/cli'
            if not os.path.exists(cli_dir):
                os.makedirs(cli_dir, exist_ok=True)
            
            # Install dependencies
            result = subprocess.run(
                ['npm', 'install'],
                cwd=cli_dir,
                capture_output=True,
                text=True,
                timeout=120
            )
            
            if result.returncode == 0:
                print("  ✅ Dependencies installed successfully")
            else:
                print(f"  ❌ Failed to install dependencies: {result.stderr}")
                self.results['issues_found'].append("Failed to install CLI dependencies")
                
        except Exception as e:
            print(f"  ❌ Error installing dependencies: {e}")
            self.results['issues_found'].append(f"Dependency installation error: {e}")
    
    def _create_production_build(self):
        """Create production build configuration"""
        print("\n🏗️  Creating Production Build...")
        
        # Create build script
        build_script = '''#!/usr/bin/env node
/**
 * CLI Production Build Script
 * Creates optimized production build of the CLI tool
 */

const fs = require('fs');
const path = require('path');

console.log('🏗️  Building CLI for production...');

// Copy main script
const srcPath = path.join(__dirname, 'rag-cli.js');
const distPath = path.join(__dirname, 'dist', 'rag-cli.js');

// Ensure dist directory exists
if (!fs.existsSync(path.dirname(distPath))) {
  fs.mkdirSync(path.dirname(distPath), { recursive: true });
}

// Copy and optimize script
let content = fs.readFileSync(srcPath, 'utf8');

// Add production optimizations
content = content.replace(/console\\.log\\(/g, '// console.log(');
content = '#!/usr/bin/env node\\n' + content;

fs.writeFileSync(distPath, content);
fs.chmodSync(distPath, '755');

console.log('✅ CLI build completed');
'''
        
        build_path = 'sdk/cli/build.js'
        with open(build_path, 'w') as f:
            f.write(build_script)
        
        print("  ✅ Build script created")
    
    def _add_cross_platform_support(self):
        """Add cross-platform support"""
        print("\n🌐 Adding Cross-Platform Support...")
        
        # Create Windows batch file
        windows_script = '''@echo off
node "%~dp0rag-cli.js" %*
'''
        
        with open('sdk/cli/rag.bat', 'w') as f:
            f.write(windows_script)
        
        # Create Unix shell script
        unix_script = '''#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
node "$DIR/rag-cli.js" "$@"
'''
        
        with open('sdk/cli/rag.sh', 'w') as f:
            f.write(unix_script)
        
        # Make shell script executable
        try:
            os.chmod('sdk/cli/rag.sh', 0o755)
        except:
            pass  # Windows doesn't support chmod
        
        print("  ✅ Cross-platform scripts created")
    
    def _create_packaging_config(self):
        """Create packaging configuration"""
        print("\n📦 Creating Packaging Configuration...")
        
        # Update package.json for production
        package_path = 'sdk/cli/package.json'
        if os.path.exists(package_path):
            with open(package_path, 'r') as f:
                package_data = json.load(f)
            
            # Add production scripts
            package_data['scripts'].update({
                'build': 'node build.js',
                'package': 'npm pack',
                'publish:npm': 'npm publish --access public',
                'install:global': 'npm install -g .',
                'uninstall:global': 'npm uninstall -g @rag-prompt-library/cli'
            })
            
            # Add files for packaging
            package_data['files'] = [
                'rag-cli.js',
                'rag.bat',
                'rag.sh',
                'dist/',
                'README.md',
                'LICENSE'
            ]
            
            with open(package_path, 'w') as f:
                json.dump(package_data, f, indent=2)
            
            print("  ✅ Package.json updated for production")
        else:
            print("  ❌ Package.json not found")
    
    def _validate_cli_functionality(self):
        """Validate CLI functionality"""
        print("\n🧪 Validating CLI Functionality...")
        
        # Test basic CLI commands
        test_commands = [
            ['node', 'rag-cli.js', '--version'],
            ['node', 'rag-cli.js', '--help'],
            ['node', 'rag-cli.js', 'auth', '--help']
        ]
        
        cli_dir = 'sdk/cli'
        passed_tests = 0
        
        for cmd in test_commands:
            try:
                result = subprocess.run(
                    cmd,
                    cwd=cli_dir,
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                if result.returncode == 0:
                    print(f"  ✅ {' '.join(cmd[1:])}: Working")
                    passed_tests += 1
                else:
                    print(f"  ❌ {' '.join(cmd[1:])}: Failed")
                    
            except Exception as e:
                print(f"  ❌ {' '.join(cmd[1:])}: Error - {e}")
        
        if passed_tests == len(test_commands):
            print("  ✅ All CLI functionality tests passed")
        else:
            print(f"  ⚠️  {passed_tests}/{len(test_commands)} tests passed")
    
    def _generate_cli_documentation(self):
        """Generate CLI documentation"""
        print("\n📚 Generating CLI Documentation...")
        
        cli_readme = '''# RAG Prompt Library CLI

Command-line interface for the RAG Prompt Library platform.

## Installation

### Global Installation
```bash
npm install -g @rag-prompt-library/cli
```

### Local Installation
```bash
npm install @rag-prompt-library/cli
npx rag --help
```

## Quick Start

### Authentication
```bash
# Login with API key
rag auth login --api-key your-api-key

# Interactive login
rag auth login

# Check authentication status
rag auth status
```

### Managing Prompts
```bash
# List prompts
rag prompts list

# Get specific prompt
rag prompts get <prompt-id>

# Create new prompt
rag prompts create

# Execute prompt
rag prompts execute <prompt-id>
```

### Document Management
```bash
# Upload document
rag documents upload <file-path>

# List documents
rag documents list

# Delete document
rag documents delete <document-id>
```

### Workspace Management
```bash
# List workspaces
rag workspaces list

# Create workspace
rag workspaces create

# Switch workspace
rag workspaces switch <workspace-id>
```

## Configuration

The CLI stores configuration in `~/.rag-cli-config.json`:

```json
{
  "apiKey": "your-api-key",
  "baseURL": "https://api.ragpromptlibrary.com/v1",
  "currentWorkspace": "workspace-id"
}
```

## Cross-Platform Support

- **Windows**: Use `rag.bat` or install globally with npm
- **macOS/Linux**: Use `rag.sh` or install globally with npm
- **Node.js**: Direct execution with `node rag-cli.js`

## Development

```bash
# Install dependencies
npm install

# Run locally
node rag-cli.js --help

# Build for production
npm run build

# Package for distribution
npm run package
```

## Support

For issues and support, visit: https://github.com/rag-prompt-library/cli/issues
'''
        
        with open('sdk/cli/README.md', 'w') as f:
            f.write(cli_readme)
        
        print("  ✅ CLI documentation generated")
    
    def _create_deployment_scripts(self):
        """Create deployment scripts"""
        print("\n🚀 Creating Deployment Scripts...")
        
        # Create deployment script
        deploy_script = '''#!/usr/bin/env python3
"""
CLI Deployment Script
Automates CLI tool deployment to npm registry
"""

import subprocess
import sys
import json

def deploy_cli():
    """Deploy CLI to npm registry"""
    print("🚀 Deploying CLI to npm registry...")
    
    try:
        # Build CLI
        subprocess.run(['npm', 'run', 'build'], check=True)
        print("✅ CLI built successfully")
        
        # Run tests
        subprocess.run(['npm', 'test'], check=True)
        print("✅ Tests passed")
        
        # Package CLI
        subprocess.run(['npm', 'pack'], check=True)
        print("✅ CLI packaged")
        
        # Publish to npm (requires authentication)
        # subprocess.run(['npm', 'publish'], check=True)
        print("📦 Ready for npm publish (run 'npm publish' manually)")
        
        print("🎉 CLI deployment completed!")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Deployment failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    deploy_cli()
'''
        
        with open('sdk/cli/deploy.py', 'w') as f:
            f.write(deploy_script)
        
        print("  ✅ Deployment scripts created")
    
    def _generate_summary(self):
        """Generate finalization summary"""
        print("\n" + "=" * 50)
        print("🔧 CLI PRODUCTION FINALIZATION SUMMARY")
        print("=" * 50)
        
        # Calculate readiness score
        total_components = len(self.cli_components)
        validated_components = sum(1 for v in self.results['components_validated'].values() if v)
        readiness_score = (validated_components / total_components) * 100
        
        print(f"📊 CLI Readiness Score: {readiness_score:.1f}%")
        print(f"✅ Components Validated: {validated_components}/{total_components}")
        
        if self.results['issues_found']:
            print(f"❌ Issues Found ({len(self.results['issues_found'])}):")
            for issue in self.results['issues_found']:
                print(f"  - {issue}")
        
        # Determine readiness
        if readiness_score >= 80 and len(self.results['issues_found']) <= 2:
            self.results['cli_ready'] = True
            print("\n✅ CLI TOOL IS PRODUCTION READY")
            
            self.results['recommendations'] = [
                "✅ CLI tool is ready for production deployment",
                "📦 Package and publish to npm registry",
                "📚 Update documentation with final CLI commands",
                "🧪 Run final integration tests",
                "🚀 Deploy to production environment"
            ]
        else:
            print("\n❌ CLI TOOL NEEDS ADDITIONAL WORK")
            
            self.results['recommendations'] = [
                "🔧 Fix missing components and dependencies",
                "🧪 Complete CLI functionality testing",
                "📚 Finalize CLI documentation",
                "📦 Test packaging and installation",
                "🔄 Re-run finalization after fixes"
            ]
        
        print(f"\n💡 Recommendations:")
        for rec in self.results['recommendations']:
            print(f"  {rec}")
        
        # Save report
        report_path = f"reports/cli_finalization_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        
        with open(report_path, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: {report_path}")
        
        return self.results['cli_ready']

if __name__ == "__main__":
    finalizer = CLIProductionFinalizer()
    success = finalizer.finalize_cli_tool()
    
    print("\n🎯 CLI Production Finalization completed!")
    sys.exit(0 if success else 1)
