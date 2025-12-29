/**
 * Simple E2E test data setup using Firebase Emulator REST APIs
 * No dependencies required - uses native fetch
 */

const AUTH_EMULATOR = 'http://127.0.0.1:9099';
const FIRESTORE_EMULATOR = 'http://127.0.0.1:8080';
const PROJECT_ID = 'rag-prompt-library-staging';

const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'testpassword123';
const TEST_USER_DISPLAY_NAME = 'Test User';

async function createTestUser() {
  console.log('1️⃣  Creating test user via Auth Emulator...');
  
  const response = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        displayName: TEST_USER_DISPLAY_NAME,
        returnSecureToken: true,
      }),
    }
  );

  const data = await response.json();
  
  if (data.error) {
    if (data.error.message === 'EMAIL_EXISTS') {
      console.log(`   ℹ️  User already exists, signing in...`);
      return await signInUser();
    }
    throw new Error(`Auth error: ${data.error.message}`);
  }

  console.log(`   ✅ Test user created: ${data.localId}`);
  console.log(`   📧 Email: ${TEST_USER_EMAIL}`);
  console.log(`   🔑 Password: ${TEST_USER_PASSWORD}\n`);
  
  return {
    userId: data.localId,
    idToken: data.idToken,
  };
}

async function signInUser() {
  const response = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        returnSecureToken: true,
      }),
    }
  );

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Sign in error: ${data.error.message}`);
  }

  console.log(`   ✅ Signed in: ${data.localId}\n`);
  
  return {
    userId: data.localId,
    idToken: data.idToken,
  };
}

async function createPrompt(userId, prompt) {
  const promptData = {
    fields: {
      promptId: { stringValue: prompt.promptId },
      userId: { stringValue: userId },
      title: { stringValue: prompt.title },
      content: { stringValue: prompt.content },
      category: { stringValue: prompt.category },
      tags: { arrayValue: { values: prompt.tags.map(t => ({ stringValue: t })) } },
      description: { stringValue: prompt.description },
      version: { integerValue: '1' },
      isPublic: { booleanValue: false },
      createdAt: { timestampValue: new Date().toISOString() },
      updatedAt: { timestampValue: new Date().toISOString() },
    },
  };

  const response = await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/prompts?documentId=${prompt.promptId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promptData),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create prompt: ${error}`);
  }

  return await response.json();
}

async function setupTestData() {
  console.log('🚀 Setting up E2E test data in Firebase Emulators...\n');

  try {
    // Step 1: Create/sign in test user
    const { userId, idToken } = await createTestUser();

    // Step 2: Create sample prompts
    console.log('2️⃣  Creating sample prompts...');
    
    const timestamp = Date.now();
    const samplePrompts = [
      {
        promptId: `test-prompt-001-${timestamp}`,
        title: 'Email Marketing Campaign',
        content: 'Write a professional email marketing campaign for {{product}} targeting {{audience}}. Include subject line, body, and call-to-action.',
        category: 'Marketing',
        tags: ['email', 'marketing', 'campaign'],
        description: 'Generate email marketing campaigns',
      },
      {
        promptId: `test-prompt-002-${timestamp}`,
        title: 'Code Review Assistant',
        content: 'Review the following {{language}} code and provide feedback on:\n1. Code quality\n2. Best practices\n3. Potential bugs\n4. Performance improvements\n\nCode:\n{{code}}',
        category: 'Development',
        tags: ['code', 'review', 'development'],
        description: 'AI-powered code review assistant',
      },
      {
        promptId: `test-prompt-003-${timestamp}`,
        title: 'Blog Post Generator',
        content: 'Write a comprehensive blog post about {{topic}}. Include:\n- Engaging introduction\n- 3-5 main sections\n- Conclusion with call-to-action\n- SEO-optimized headings\n\nTone: {{tone}}\nLength: {{length}} words',
        category: 'Content',
        tags: ['blog', 'content', 'writing', 'seo'],
        description: 'Generate SEO-optimized blog posts',
      },
      {
        promptId: `test-prompt-004-${timestamp}`,
        title: 'Meeting Summary',
        content: 'Summarize the following meeting notes:\n\n{{notes}}\n\nProvide:\n1. Key decisions\n2. Action items with owners\n3. Next steps\n4. Follow-up required',
        category: 'Productivity',
        tags: ['meeting', 'summary', 'productivity'],
        description: 'Summarize meeting notes and extract action items',
      },
      {
        promptId: `test-prompt-005-${timestamp}`,
        title: 'Social Media Post',
        content: 'Create an engaging social media post for {{platform}} about {{topic}}.\n\nRequirements:\n- Attention-grabbing hook\n- Include relevant hashtags\n- Call-to-action\n- Optimal length for {{platform}}\n\nTone: {{tone}}',
        category: 'Marketing',
        tags: ['social-media', 'marketing', 'content'],
        description: 'Generate platform-optimized social media posts',
      },
    ];

    for (const prompt of samplePrompts) {
      await createPrompt(userId, prompt);
      console.log(`   ✅ Created: ${prompt.title} (${prompt.promptId})`);
    }

    console.log(`\n   ✅ Created ${samplePrompts.length} sample prompts\n`);

    // Step 3: Display summary
    console.log('📊 Test Data Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`User ID:       ${userId}`);
    console.log(`Email:         ${TEST_USER_EMAIL}`);
    console.log(`Password:      ${TEST_USER_PASSWORD}`);
    console.log(`Prompts:       ${samplePrompts.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📝 Created Prompts:');
    samplePrompts.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title}`);
      console.log(`      ID: ${p.promptId}`);
      console.log(`      Category: ${p.category} | Tags: ${p.tags.join(', ')}`);
    });

    console.log('\n🎯 E2E Testing Instructions:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Open http://localhost:5174 in your browser');
    console.log('2. Sign in with:');
    console.log(`   Email: ${TEST_USER_EMAIL}`);
    console.log(`   Password: ${TEST_USER_PASSWORD}`);
    console.log('3. Navigate to Prompt Library Dashboard');
    console.log('4. Open the chat panel (Mole AI Assistant)');
    console.log('5. Test the following commands:\n');
    
    console.log('   📋 LIST PROMPTS (new tool):');
    console.log('      "Show me all my prompts"');
    console.log('      "List all prompts in the Marketing category"\n');
    
    console.log('   ✏️  UPDATE PROMPT (new tool):');
    console.log(`      "Update the title of ${samplePrompts[0].promptId} to 'Updated Email Campaign'"`);
    console.log(`      "Change the tags of ${samplePrompts[1].promptId} to code, testing, quality"\n`);
    
    console.log('   🗑️  DELETE PROMPT (new tool):');
    console.log(`      "Delete the prompt ${samplePrompts[4].promptId}"`);
    console.log('      (Mole should ask for confirmation)\n');
    
    console.log('   🔍 EXISTING TOOLS (verify no regressions):');
    console.log('      "Search for marketing prompts" (search_prompts)');
    console.log('      "Create a new prompt for..." (create_prompt)');
    console.log(`      "Execute prompt ${samplePrompts[0].promptId}" (execute_prompt)`);
    console.log('      "Show my execution history" (get_history)');
    console.log('      "Analyze performance" (analyze_performance)');
    console.log('      "Suggest improvements for..." (suggest_improvements)\n');

    console.log('✅ E2E test data setup complete!\n');
    console.log('🔗 Emulator UI: http://127.0.0.1:4000');
    console.log('🔗 Frontend: http://localhost:5174');
    console.log('🔗 Firestore: http://127.0.0.1:4000/firestore');
    console.log('🔗 Auth: http://127.0.0.1:4000/auth\n');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  }
}

// Run setup
setupTestData();

