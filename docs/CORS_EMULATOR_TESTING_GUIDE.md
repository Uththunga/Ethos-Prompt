# CORS Emulator Testing Guide

## Overview

This guide provides step-by-step instructions for testing CORS functionality with Firebase emulators to ensure callable functions work correctly without CORS errors.

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
2. **Firebase CLI** (installed globally)
   ```bash
   npm install -g firebase-tools
   ```
3. **Java Runtime** (for Firestore emulator)
   - Download from: https://www.oracle.com/java/technologies/downloads/
   - Or use OpenJDK: https://adoptium.net/

### Install Playwright Browsers (First Time Only)

```bash
cd frontend
npx playwright install chromium
```

## Quick Start

### Option 1: Automated Test Script

Run the automated CORS testing script:

```bash
# From project root
node scripts/test-cors-emulator.js
```

This script will:
1. Start Firebase emulators
2. Run E2E CORS tests
3. Generate a test report
4. Clean up processes

### Option 2: Manual Testing

#### Step 1: Start Firebase Emulators

Open a terminal and start the emulators:

```bash
# From project root
npm run emulators
```

Wait for the message: **"All emulators ready!"**

You should see:
```
✔  All emulators ready! It is now safe to connect your app.
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! View status and logs at http://localhost:4000 │
└─────────────────────────────────────────────────────────────┘

┌───────────┬────────────────┬─────────────────────────────────┐
│ Emulator  │ Host:Port      │ View in Emulator UI             │
├───────────┼────────────────┼─────────────────────────────────┤
│ Auth      │ localhost:9099 │ http://localhost:4000/auth      │
│ Firestore │ localhost:8080 │ http://localhost:4000/firestore │
│ Functions │ localhost:5001 │ http://localhost:4000/functions │
│ Storage   │ localhost:9199 │ http://localhost:4000/storage   │
└───────────┴────────────────┴─────────────────────────────────┘
```

#### Step 2: Start Frontend Dev Server

Open a **new terminal** and start the frontend:

```bash
cd frontend
VITE_ENABLE_EMULATORS=true npm run dev
```

The frontend should start on `http://localhost:3000` (or the next available port).

#### Step 3: Run E2E CORS Tests

Open a **third terminal** and run the CORS tests:

```bash
cd frontend
npx playwright test e2e/cors.spec.ts --project=chromium
```

#### Step 4: Check Results

The test should pass without any CORS errors. Look for:

```
✓ CORS validation > no CORS errors during prompt flows (5s)

1 passed (5s)
```

If you see CORS errors, they will be displayed in the test output.

## Manual Browser Testing

### Step 1: Open Browser Console

1. Open `http://localhost:3000` in Chrome
2. Open Developer Tools (F12)
3. Go to the **Console** tab
4. Clear the console

### Step 2: Test Callable Functions

1. Navigate to **Prompts** page
2. Click **"AI-Assisted Creation"** button
3. Fill in the form and submit

### Step 3: Check for CORS Errors

In the console, look for any errors containing:
- `CORS`
- `Access-Control-Allow-Origin`
- `preflight`
- `No 'Access-Control-Allow-Origin' header`

**Expected Result:** No CORS errors should appear.

### Step 4: Check Network Tab

1. Go to **Network** tab in Developer Tools
2. Filter by **Fetch/XHR**
3. Look for requests to `localhost:5001`
4. Check the **Headers** tab for each request

**Expected Headers:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Testing Different Scenarios

### Test 1: Generate Prompt (Callable Function)

```javascript
// Open browser console and run:
const { httpsCallable } = await import('firebase/functions');
const { functions } = await import('./src/config/firebase');

const generatePrompt = httpsCallable(functions, 'generate_prompt');
const result = await generatePrompt({
  purpose: 'test',
  industry: 'Technology',
  useCase: 'testing CORS'
});

console.log('Result:', result.data);
```

**Expected:** No CORS errors, successful response.

### Test 2: Execute Prompt (Callable Function)

```javascript
// Open browser console and run:
const { httpsCallable } = await import('firebase/functions');
const { functions } = await import('./src/config/firebase');

const api = httpsCallable(functions, 'api');
const result = await api({
  endpoint: 'execute_prompt',
  promptId: 'test-prompt',
  variables: { input: 'test' }
});

console.log('Result:', result.data);
```

**Expected:** No CORS errors, successful response.

### Test 3: Health Check

```javascript
// Open browser console and run:
const { httpsCallable } = await import('firebase/functions');
const { functions } = await import('./src/config/firebase');

const api = httpsCallable(functions, 'api');
const result = await api({ endpoint: 'health' });

console.log('Health check:', result.data);
```

**Expected:** `{ status: 'success', message: 'API working', region: 'australia-southeast1' }`

## Troubleshooting

### Issue: Emulators Won't Start

**Solution:**
1. Check if Java is installed: `java -version`
2. Kill any existing emulator processes:
   ```bash
   # Windows
   taskkill /F /IM java.exe
   
   # macOS/Linux
   pkill -f firebase
   ```
3. Try starting emulators again

### Issue: Port Already in Use

**Solution:**
1. Check which process is using the port:
   ```bash
   # Windows
   netstat -ano | findstr :5001
   
   # macOS/Linux
   lsof -i :5001
   ```
2. Kill the process or change the port in `firebase.json`

### Issue: CORS Errors Still Appear

**Solution:**
1. Check that `VITE_ENABLE_EMULATORS=true` is set
2. Verify emulator connection in browser console:
   ```javascript
   console.log('Emulators enabled:', import.meta.env.VITE_ENABLE_EMULATORS);
   ```
3. Clear browser cache and reload
4. Check Firebase config in `frontend/src/config/firebase.ts`

### Issue: Playwright Tests Fail

**Solution:**
1. Install Playwright browsers:
   ```bash
   cd frontend
   npx playwright install
   ```
2. Check Playwright config: `frontend/playwright.config.ts`
3. Run tests with debug mode:
   ```bash
   npx playwright test --debug
   ```

## Expected Test Results

### Successful Test Output

```
Running 1 test using 1 worker

  ✓  e2e/cors.spec.ts:9:3 › CORS validation › no CORS errors during prompt flows (5.2s)

  1 passed (5.2s)
```

### Test Report Location

After running tests, check the report at:
- **HTML Report:** `frontend/playwright-report/index.html`
- **JSON Report:** `test-results/cors-emulator-report.json`

## Verification Checklist

- [ ] Firebase emulators start successfully
- [ ] Frontend connects to emulators (check console logs)
- [ ] No CORS errors in browser console
- [ ] Callable functions execute successfully
- [ ] Network requests show correct CORS headers
- [ ] E2E tests pass without errors
- [ ] Test report generated successfully

## Next Steps

After successful CORS testing with emulators:

1. **Document Results:** Update task 1.7 as complete
2. **Deploy to Staging:** Proceed to task 1.8 (requires permission)
3. **Production Testing:** Test CORS in production environment
4. **Remove Fallbacks:** Update frontend to remove CORS fallback logic

## Additional Resources

- [Firebase Emulators Documentation](https://firebase.google.com/docs/emulator-suite)
- [Playwright Testing Guide](https://playwright.dev/docs/intro)
- [CORS Specification](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Firebase Callable Functions](https://firebase.google.com/docs/functions/callable)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review emulator logs in the terminal
3. Check browser console for detailed error messages
4. Consult the Firebase emulator UI at `http://localhost:4000`

