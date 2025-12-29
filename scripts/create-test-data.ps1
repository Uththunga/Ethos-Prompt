# ============================================================================
# Create Test Data for Staging Environment
# ============================================================================
# This script creates test data in the staging Firestore database:
#   - Test prompts with different categories
#   - Execution records for each prompt
#
# Usage:
#   .\scripts\create-test-data.ps1
#   .\scripts\create-test-data.ps1 -UserId "custom-user-id"
#
# Prerequisites:
#   - Firebase CLI installed
#   - Authenticated with Firebase (run: firebase login)
#   - Node.js installed (for running Firebase Functions locally)
# ============================================================================

param(
    [string]$ProjectId = "rag-prompt-library-staging",
    [string]$UserId = "",
    [int]$PromptCount = 3,
    [int]$ExecutionsPerPrompt = 1
)

# Color output functions
function Write-Success { param($Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Error-Custom { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Warning-Custom { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Progress-Custom { param($Message) Write-Host "[PROGRESS] $Message" -ForegroundColor Blue }

# ============================================================================
# Pre-flight checks
# ============================================================================

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Magenta
Write-Host "  TEST DATA CREATION SCRIPT" -ForegroundColor Magenta
Write-Host "============================================================================" -ForegroundColor Magenta
Write-Host ""

# Check if Node.js is installed
Write-Info "Checking for Node.js..."
try {
    $nodeVersion = node --version 2>&1
    Write-Success "Node.js found: $nodeVersion"
} catch {
    Write-Error-Custom "Node.js not found. Please install Node.js first."
    Write-Info "Download from: https://nodejs.org/"
    exit 1
}

# Check if Firebase CLI is installed
Write-Info "Checking for Firebase CLI..."
try {
    $firebaseVersion = firebase --version 2>&1
    Write-Success "Firebase CLI found: $firebaseVersion"
} catch {
    Write-Error-Custom "Firebase CLI not found. Please install Firebase CLI first."
    Write-Info "Run: npm install -g firebase-tools"
    exit 1
}

# ============================================================================
# Configuration
# ============================================================================

Write-Host ""
Write-Info "Configuration:"
Write-Host "  Project ID           : $ProjectId" -ForegroundColor White
Write-Host "  Prompts to create    : $PromptCount" -ForegroundColor White
Write-Host "  Executions per prompt: $ExecutionsPerPrompt" -ForegroundColor White

if ($UserId) {
    Write-Host "  User ID              : $UserId" -ForegroundColor White
} else {
    Write-Warning-Custom "No User ID provided. You must provide a valid user ID."
    Write-Info "Get your user ID from Firebase Console:"
    Write-Host "  https://console.firebase.google.com/project/$ProjectId/authentication/users" -ForegroundColor Cyan
    Write-Host ""
    $UserId = Read-Host "Enter User ID"

    if (-not $UserId) {
        Write-Error-Custom "User ID is required. Exiting."
        exit 1
    }
}

Write-Host ""

# ============================================================================
# Create test data script (Node.js)
# ============================================================================

Write-Progress-Custom "Generating test data creation script..."

$testDataScript = @"
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: '$ProjectId'
});

const db = admin.firestore();

// Test data templates
const promptTemplates = [
  {
    title: 'Greeting Generator',
    content: 'Generate a friendly greeting for {{name}} who is interested in {{topic}}.',
    description: 'Creates personalized greetings based on name and topic',
    category: 'Communication',
    tags: ['greeting', 'personalization', 'test'],
    variables: [
      { name: 'name', description: 'Person\'s name', required: true, defaultValue: 'Alice' },
      { name: 'topic', description: 'Topic of interest', required: true, defaultValue: 'AI' }
    ],
    isPublic: false,
    difficulty: 'beginner'
  },
  {
    title: 'Code Explainer',
    content: 'Explain the following {{language}} code in simple terms:\n\n{{code}}',
    description: 'Explains code snippets in plain language',
    category: 'Development',
    tags: ['code', 'explanation', 'test'],
    variables: [
      { name: 'language', description: 'Programming language', required: true, defaultValue: 'JavaScript' },
      { name: 'code', description: 'Code to explain', required: true, defaultValue: 'const x = 5;' }
    ],
    isPublic: false,
    difficulty: 'intermediate'
  },
  {
    title: 'Email Writer',
    content: 'Write a professional email to {{recipient}} about {{subject}}. Tone: {{tone}}',
    description: 'Generates professional emails with customizable tone',
    category: 'Business',
    tags: ['email', 'professional', 'test'],
    variables: [
      { name: 'recipient', description: 'Email recipient', required: true, defaultValue: 'Team' },
      { name: 'subject', description: 'Email subject', required: true, defaultValue: 'Project Update' },
      { name: 'tone', description: 'Email tone', required: false, defaultValue: 'formal' }
    ],
    isPublic: false,
    difficulty: 'advanced'
  }
];

async function createTestData() {
  const userId = '$UserId';
  const promptCount = $PromptCount;
  const executionsPerPrompt = $ExecutionsPerPrompt;

  console.log('🚀 Starting test data creation...');
  console.log('User ID:', userId);
  console.log('Prompts to create:', promptCount);
  console.log('Executions per prompt:', executionsPerPrompt);
  console.log('');

  const createdPrompts = [];
  const createdExecutions = [];

  try {
    // Create prompts
    for (let i = 0; i < Math.min(promptCount, promptTemplates.length); i++) {
      const template = promptTemplates[i];
      const promptData = {
        ...template,
        userId: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        executionCount: 0,
        averageRating: 0,
        totalCost: 0
      };

      console.log(\`⏳ Creating prompt: \${template.title}\`);
      const promptRef = await db.collection('prompts').add(promptData);
      createdPrompts.push({ id: promptRef.id, ...template });
      console.log(\`✅ Created prompt: \${promptRef.id}\`);

      // Create executions for this prompt
      for (let j = 0; j < executionsPerPrompt; j++) {
        const executionData = {
          userId: userId,
          promptId: promptRef.id,
          promptTitle: template.title,
          modelId: 'openai/gpt-3.5-turbo',
          status: 'success',
          output: \`This is a test execution output for \${template.title}. Execution #\${j + 1}.\`,
          variables: template.variables.reduce((acc, v) => {
            acc[v.name] = v.defaultValue;
            return acc;
          }, {}),
          tokensUsed: {
            input: Math.floor(Math.random() * 100) + 50,
            output: Math.floor(Math.random() * 200) + 100,
            total: Math.floor(Math.random() * 300) + 150
          },
          cost: (Math.random() * 0.01).toFixed(4),
          duration: Math.floor(Math.random() * 3000) + 1000,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        console.log(\`  ⏳ Creating execution #\${j + 1} for \${template.title}\`);
        const execRef = await db.collection('executions').add(executionData);
        createdExecutions.push({ id: execRef.id, promptTitle: template.title });
        console.log(\`  ✅ Created execution: \${execRef.id}\`);
      }

      console.log('');
    }

    // Summary
    console.log('============================================================================');
    console.log('✅ TEST DATA CREATION COMPLETE');
    console.log('============================================================================');
    console.log('');
    console.log('Created Resources:');
    console.log(\`  Prompts   : \${createdPrompts.length}\`);
    console.log(\`  Executions: \${createdExecutions.length}\`);
    console.log('');
    console.log('Prompt IDs:');
    createdPrompts.forEach(p => {
      console.log(\`  • \${p.id} - \${p.title}\`);
    });
    console.log('');
    console.log('Execution IDs:');
    createdExecutions.forEach(e => {
      console.log(\`  • \${e.id} - \${e.promptTitle}\`);
    });
    console.log('');
    console.log('Verify in Firestore Console:');
    console.log(\`  https://console.firebase.google.com/project/$ProjectId/firestore\`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

createTestData();
"@

# Save the Node.js script to a temporary file
$tempScriptPath = Join-Path $env:TEMP "create-test-data-temp.js"
$testDataScript | Out-File -FilePath $tempScriptPath -Encoding UTF8

Write-Success "Test data script generated"

# ============================================================================
# Install dependencies
# ============================================================================

Write-Host ""
Write-Progress-Custom "Checking Firebase Admin SDK..."

# Check if firebase-admin is installed globally
$adminInstalled = $false
try {
    $npmList = npm list -g firebase-admin --depth=0 2>&1
    if ($npmList -match "firebase-admin@") {
        $adminInstalled = $true
        Write-Success "Firebase Admin SDK already installed"
    }
} catch {
    # Not installed
}

if (-not $adminInstalled) {
    Write-Warning-Custom "Firebase Admin SDK not found. Installing globally..."
    try {
        npm install -g firebase-admin 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Firebase Admin SDK installed successfully"
        } else {
            throw "npm install failed"
        }
    } catch {
        Write-Error-Custom "Failed to install Firebase Admin SDK: $_"
        Write-Info "Please install manually: npm install -g firebase-admin"
        Remove-Item $tempScriptPath -ErrorAction SilentlyContinue
        exit 1
    }
}

# ============================================================================
# Set up authentication
# ============================================================================

Write-Host ""
Write-Info "Setting up Firebase authentication..."

# Set GOOGLE_APPLICATION_CREDENTIALS environment variable
$env:GOOGLE_APPLICATION_CREDENTIALS = ""
$env:FIRESTORE_EMULATOR_HOST = ""

Write-Info "Using Application Default Credentials (ADC)"
Write-Info "Ensure you are authenticated with: gcloud auth application-default login"

# ============================================================================
# Execute test data creation
# ============================================================================

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Progress-Custom "Creating test data in Firestore..."
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Run the Node.js script
    node $tempScriptPath

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Success "Test data creation completed successfully!"
    } else {
        throw "Script execution failed with exit code: $LASTEXITCODE"
    }
} catch {
    Write-Error-Custom "Failed to create test data: $_"
    Write-Info "Please check the error messages above and try again."
    Remove-Item $tempScriptPath -ErrorAction SilentlyContinue
    exit 1
} finally {
    # Clean up temporary script
    Remove-Item $tempScriptPath -ErrorAction SilentlyContinue
}

# ============================================================================
# Next steps
# ============================================================================

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
Write-Info "NEXT STEPS:"
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Verify data in Firestore Console:" -ForegroundColor Cyan
Write-Host "   https://console.firebase.google.com/project/$ProjectId/firestore" -ForegroundColor White
Write-Host ""
Write-Host "2. Test execution visibility on staging:" -ForegroundColor Cyan
Write-Host "   https://rag-prompt-library-staging.web.app/dashboard/executions" -ForegroundColor White
Write-Host ""
Write-Host "3. Run verification script:" -ForegroundColor Cyan
Write-Host "   .\scripts\verify-execution-visibility.ps1" -ForegroundColor White
Write-Host ""

exit 0
