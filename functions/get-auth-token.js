/**
 * Script to generate a Firebase Auth custom token for testing
 * This token can be used to authenticate requests to the staging endpoint
 */

const admin = require('firebase-admin');

// STAGING project configuration
const STAGING_PROJECT_ID = 'rag-prompt-library-staging';
const STAGING_WEB_API_KEY = 'AIzaSyDO_PRnAPZg6neE2NVYj7SdDNny6jmkAY8';

// Initialize Firebase Admin SDK for STAGING
admin.initializeApp({
  projectId: STAGING_PROJECT_ID,
});

// The test user UID (from emulator shortcut)
const TEST_UID = '5f3TZo1RW8abwje1q43wdPfLyqde';

async function getCustomToken() {
  try {
    // Create a custom token for the test user
    const customToken = await admin.auth().createCustomToken(TEST_UID);

    console.log('\n=== Firebase Custom Token ===');
    console.log(customToken);
    console.log('\n=== Instructions ===');
    console.log('1. Use this custom token to sign in to Firebase Auth');
    console.log('2. Exchange it for an ID token using the Firebase Auth REST API');
    console.log('3. Use the ID token in the Authorization header: Bearer <ID_TOKEN>');
    console.log('\n=== Exchange for ID Token (PowerShell) ===');
    console.log(
      `$body = '{\\"token\\":\\"${customToken}\\",\\"returnSecureToken\\":true}'; curl.exe -s -X POST 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${STAGING_WEB_API_KEY}' -H 'Content-Type: application/json' --data "$body" | ConvertFrom-Json | Select-Object -ExpandProperty idToken`
    );
    console.log('\n=== Project Info ===');
    console.log(`Project: ${STAGING_PROJECT_ID}`);
    console.log(`Web API Key: ${STAGING_WEB_API_KEY}`);

    return customToken;
  } catch (error) {
    console.error('Error creating custom token:', error);
    process.exit(1);
  }
}

// Run the script
getCustomToken()
  .then(() => {
    console.log('\n✅ Custom token generated successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to generate token:', error);
    process.exit(1);
  });
