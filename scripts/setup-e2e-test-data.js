/**
 * Setup script for E2E testing with Firebase Emulators
 * Creates test user and sample prompts in the emulator
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with emulator settings
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({
  projectId: 'rag-prompt-library-staging',
});

const auth = admin.auth();
const db = admin.firestore();

const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'testpassword123';
const TEST_USER_DISPLAY_NAME = 'Test User';

async function setupTestData() {
  console.log('🚀 Setting up E2E test data in Firebase Emulators...\n');

  try {
    // Step 1: Create test user
    console.log('1️⃣  Creating test user...');
    let testUser;
    try {
      testUser = await auth.createUser({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        displayName: TEST_USER_DISPLAY_NAME,
        emailVerified: true,
      });
      console.log(`   ✅ Test user created: ${testUser.uid}`);
      console.log(`   📧 Email: ${TEST_USER_EMAIL}`);
      console.log(`   🔑 Password: ${TEST_USER_PASSWORD}\n`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        const users = await auth.getUserByEmail(TEST_USER_EMAIL);
        testUser = users;
        console.log(`   ℹ️  Test user already exists: ${testUser.uid}\n`);
      } else {
        throw error;
      }
    }

    const userId = testUser.uid;

    // Step 2: Create sample prompts
    console.log('2️⃣  Creating sample prompts...');
    
    const samplePrompts = [
      {
        promptId: `test-prompt-001-${Date.now()}`,
        userId: userId,
        title: 'Email Marketing Campaign',
        content: 'Write a professional email marketing campaign for {{product}} targeting {{audience}}. Include subject line, body, and call-to-action.',
        category: 'Marketing',
        tags: ['email', 'marketing', 'campaign'],
        description: 'Generate email marketing campaigns',
        version: 1,
        isPublic: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        promptId: `test-prompt-002-${Date.now()}`,
        userId: userId,
        title: 'Code Review Assistant',
        content: 'Review the following {{language}} code and provide feedback on:\n1. Code quality\n2. Best practices\n3. Potential bugs\n4. Performance improvements\n\nCode:\n{{code}}',
        category: 'Development',
        tags: ['code', 'review', 'development'],
        description: 'AI-powered code review assistant',
        version: 1,
        isPublic: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        promptId: `test-prompt-003-${Date.now()}`,
        userId: userId,
        title: 'Blog Post Generator',
        content: 'Write a comprehensive blog post about {{topic}}. Include:\n- Engaging introduction\n- 3-5 main sections\n- Conclusion with call-to-action\n- SEO-optimized headings\n\nTone: {{tone}}\nLength: {{length}} words',
        category: 'Content',
        tags: ['blog', 'content', 'writing', 'seo'],
        description: 'Generate SEO-optimized blog posts',
        version: 1,
        isPublic: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        promptId: `test-prompt-004-${Date.now()}`,
        userId: userId,
        title: 'Meeting Summary',
        content: 'Summarize the following meeting notes:\n\n{{notes}}\n\nProvide:\n1. Key decisions\n2. Action items with owners\n3. Next steps\n4. Follow-up required',
        category: 'Productivity',
        tags: ['meeting', 'summary', 'productivity'],
        description: 'Summarize meeting notes and extract action items',
        version: 1,
        isPublic: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        promptId: `test-prompt-005-${Date.now()}`,
        userId: userId,
        title: 'Social Media Post',
        content: 'Create an engaging social media post for {{platform}} about {{topic}}.\n\nRequirements:\n- Attention-grabbing hook\n- Include relevant hashtags\n- Call-to-action\n- Optimal length for {{platform}}\n\nTone: {{tone}}',
        category: 'Marketing',
        tags: ['social-media', 'marketing', 'content'],
        description: 'Generate platform-optimized social media posts',
        version: 1,
        isPublic: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    ];

    const batch = db.batch();
    const createdPrompts = [];

    for (const prompt of samplePrompts) {
      const promptRef = db.collection('prompts').doc(prompt.promptId);
      batch.set(promptRef, prompt);
      createdPrompts.push(prompt);
      console.log(`   ✅ Queued: ${prompt.title} (${prompt.promptId})`);
    }

    await batch.commit();
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
    createdPrompts.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title}`);
      console.log(`      ID: ${p.promptId}`);
      console.log(`      Category: ${p.category} | Tags: ${p.tags.join(', ')}`);
    });

    console.log('\n🎯 Next Steps:');
    console.log('   1. Open http://localhost:5174 in your browser');
    console.log('   2. Sign in with:');
    console.log(`      Email: ${TEST_USER_EMAIL}`);
    console.log(`      Password: ${TEST_USER_PASSWORD}`);
    console.log('   3. Navigate to Prompt Library Dashboard');
    console.log('   4. Open the chat panel (Mole AI Assistant)');
    console.log('   5. Test the following commands:');
    console.log('      - "Show me all my prompts" (list_prompts)');
    console.log('      - "Update the title of [prompt-id] to \'New Title\'" (update_prompt)');
    console.log('      - "Delete the prompt [prompt-id]" (delete_prompt)');
    console.log('      - "Search for marketing prompts" (search_prompts)');
    console.log('      - "Create a new prompt..." (create_prompt)');
    console.log('      - "Execute prompt [prompt-id]" (execute_prompt)\n');

    console.log('✅ E2E test data setup complete!\n');
    console.log('🔗 Emulator UI: http://127.0.0.1:4000');
    console.log('🔗 Frontend: http://localhost:5174\n');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run setup
setupTestData();

