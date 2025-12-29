/**
 * Script to create a test user in Firebase Auth for staging tests
 * Uses Firebase Auth REST API to create user and get ID token
 */

const STAGING_WEB_API_KEY = 'AIzaSyDO_PRnAPZg6neE2NVYj7SdDNny6jmkAY8';
const TEST_EMAIL = 'test@ethosprompt.com';
const TEST_PASSWORD = 'TestPassword123!';

async function createTestUser() {
  try {
    console.log('\n=== Creating Test User in Staging ===');
    console.log(`Email: ${TEST_EMAIL}`);
    
    // Try to sign up (will fail if user already exists)
    const signupResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${STAGING_WEB_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          returnSecureToken: true,
        }),
      }
    );

    const signupData = await signupResponse.json();

    if (signupData.error) {
      if (signupData.error.message === 'EMAIL_EXISTS') {
        console.log('✅ User already exists, signing in...');
        
        // Sign in instead
        const signinResponse = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${STAGING_WEB_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: TEST_EMAIL,
              password: TEST_PASSWORD,
              returnSecureToken: true,
            }),
          }
        );

        const signinData = await signinResponse.json();

        if (signinData.error) {
          console.error('❌ Sign in failed:', signinData.error.message);
          process.exit(1);
        }

        console.log('\n=== ID Token ===');
        console.log(signinData.idToken);
        console.log('\n=== User Info ===');
        console.log(`UID: ${signinData.localId}`);
        console.log(`Email: ${signinData.email}`);
        console.log(`Expires in: ${signinData.expiresIn} seconds`);
        
        return signinData.idToken;
      } else {
        console.error('❌ Signup failed:', signupData.error.message);
        process.exit(1);
      }
    }

    console.log('✅ User created successfully');
    console.log('\n=== ID Token ===');
    console.log(signupData.idToken);
    console.log('\n=== User Info ===');
    console.log(`UID: ${signupData.localId}`);
    console.log(`Email: ${signupData.email}`);
    console.log(`Expires in: ${signupData.expiresIn} seconds`);
    
    return signupData.idToken;
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
createTestUser()
  .then((idToken) => {
    console.log('\n=== Test Command ===');
    console.log(`curl.exe -s -X POST -H "Authorization: Bearer ${idToken}" -H "Content-Type: application/json" --data @test-staging-payload.json "https://httpapi-zcr2ek5dsa-ts.a.run.app/api/ai/prompt-library-chat"`);
    console.log('\n✅ Test user ready');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

